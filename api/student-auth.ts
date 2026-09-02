import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseServiceAccount } from "../server/firebaseProject.js";
import { randomUUID } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { findMatchingCredential, nextRegistrationNumber, type StudentCredentialRecord } from "../server/studentCredentialSecurity.js";
import { hashPin, recordFailedAttempt, studentKey } from "../server/studentPinSecurity.js";
import { isStudentNumber as validStudentNumber } from "../shared/school-config.mjs";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT가 비어 있습니다.");
  return initializeApp({ credential: cert(parseServiceAccount(raw, process.env.VITE_FIREBASE_PROJECT_ID)) });
}

class StudentAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function validPin(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "허용되지 않은 요청입니다." });
  try {
    const { action, name, studentNumber, pin } = req.body || {};
    if (!validStudentNumber(studentNumber) || !validPin(pin) || !["login", "register"].includes(action)) {
      throw new StudentAuthError(400, "학번과 6자리 PIN을 확인해 주세요.");
    }
    if (action === "register" && (typeof name !== "string" || !name.trim() || name.trim().length > 20)) {
      throw new StudentAuthError(400, "이름을 확인해 주세요.");
    }

    const secret = process.env.STUDENT_AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("STUDENT_AUTH_SECRET가 안전하게 설정되지 않았습니다.");
    const app = getAdminApp();
    const store = getFirestore(app);
    const auth = getAuth(app);
    const key = studentKey(studentNumber, secret);
    const credentials = store.collection("studentCredentials");
    const legacyCredentialRef = credentials.doc(key);
    const credentialQuery = credentials.where("studentNumberKey", "==", key);
    const guardRef = store.collection("studentLoginGuards").doc(key);

    if (action === "register") {
      const encoded = await hashPin(pin);
      const uid = `student_${randomUUID().replace(/-/g, "")}`;
      const credentialRef = credentials.doc();
      const counterRef = store.collection("studentRegistrationCounters").doc(key);
      let registrationNumber = 1;
      await store.runTransaction(async (tx) => {
        const [legacy, matching, counter] = await Promise.all([
          tx.get(legacyCredentialRef),
          tx.get(credentialQuery),
          tx.get(counterRef),
        ]);
        const records = new Map<string, StudentCredentialRecord>();
        if (legacy.exists) {
          const data = legacy.data() || {};
          records.set(legacy.id, { id: legacy.id, uid: String(data.uid || ""), salt: data.salt, pinHash: data.pinHash, registrationNumber: data.registrationNumber, resetRequired: data.resetRequired, lockedUntil: data.lockedUntil });
        }
        for (const item of matching.docs) {
          const data = item.data();
          records.set(item.id, { id: item.id, uid: String(data.uid || ""), salt: data.salt, pinHash: data.pinHash, registrationNumber: data.registrationNumber, resetRequired: data.resetRequired, lockedUntil: data.lockedUntil });
        }
        const existingPin = await findMatchingCredential(pin, [...records.values()], Date.now());
        if (existingPin.kind !== "none") throw new StudentAuthError(409, "같은 학번에서 이미 사용 중인 PIN이에요. 다른 6자리 번호를 정해 주세요.");
        registrationNumber = Math.max(nextRegistrationNumber([...records.values()]), Number(counter.data()?.lastNumber || 0) + 1);
        const userRef = store.collection("users").doc(uid);
        const sessionRef = store.collection("studentSessions").doc(uid);
        tx.set(credentialRef, { uid, studentNumberKey: key, registrationNumber, salt: encoded.salt, pinHash: encoded.hash, failedAttempts: 0, lockedUntil: null, resetRequired: false, sessionVersion: 1, createdAt: FieldValue.serverTimestamp() });
        tx.set(userRef, { name: name.trim(), studentNumber, role: "student", credentialId: credentialRef.id, registrationNumber, registeredAt: FieldValue.serverTimestamp() });
        tx.set(sessionRef, { version: 1 });
        tx.set(counterRef, { lastNumber: registrationNumber, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      });
      const token = await auth.createCustomToken(uid, { role: "student", sessionVersion: 1 });
      return res.status(200).json({ token });
    }

    const [legacy, matching, guard] = await Promise.all([legacyCredentialRef.get(), credentialQuery.get(), guardRef.get()]);
    const records = new Map<string, StudentCredentialRecord & { sessionVersion?: number }>();
    if (legacy.exists) {
      const data = legacy.data() || {};
      records.set(legacy.id, { id: legacy.id, uid: String(data.uid || ""), salt: data.salt, pinHash: data.pinHash, registrationNumber: data.registrationNumber, resetRequired: data.resetRequired, lockedUntil: data.lockedUntil, sessionVersion: Number(data.sessionVersion || 1) });
    }
    for (const item of matching.docs) {
      const data = item.data();
      records.set(item.id, { id: item.id, uid: String(data.uid || ""), salt: data.salt, pinHash: data.pinHash, registrationNumber: data.registrationNumber, resetRequired: data.resetRequired, lockedUntil: data.lockedUntil, sessionVersion: Number(data.sessionVersion || 1) });
    }
    if (records.size === 0) throw new StudentAuthError(401, "학번 또는 PIN을 확인해 주세요.");
    const now = Date.now();
    const guardLockedUntil = Number(guard.data()?.lockedUntil || 0);
    if (guardLockedUntil > now) throw new StudentAuthError(429, `PIN을 여러 번 틀렸어요. ${Math.max(1, Math.ceil((guardLockedUntil - now) / 60000))}분 뒤 다시 시도해 주세요.`);
    const match = await findMatchingCredential(pin, [...records.values()], now);
    if (match.kind === "locked") throw new StudentAuthError(429, `PIN을 여러 번 틀렸어요. ${match.minutes}분 뒤 다시 시도해 주세요.`);
    if (match.kind === "none") {
      const failed = await store.runTransaction(async (tx) => {
        const snapshot = await tx.get(guardRef);
        const next = recordFailedAttempt({ failedAttempts: Number(snapshot.data()?.failedAttempts || 0), lockedUntil: snapshot.data()?.lockedUntil || null }, now);
        tx.set(guardRef, next);
        return next;
      });
      throw new StudentAuthError(failed.lockedUntil ? 429 : 401, failed.lockedUntil ? "PIN을 5번 틀려 10분 동안 로그인이 잠겼어요." : "학번 또는 PIN을 확인해 주세요.");
    }
    const selected = records.get(match.credentialId)!;
    await store.runTransaction(async (tx) => {
      tx.set(guardRef, { failedAttempts: 0, lockedUntil: null });
      tx.update(credentials.doc(match.credentialId), { failedAttempts: 0, lockedUntil: null });
    });
    const token = await auth.createCustomToken(match.uid, { role: "student", sessionVersion: Number(selected.sessionVersion || 1) });
    return res.status(200).json({ token });
  } catch (error) {
    if (error instanceof StudentAuthError) return res.status(error.status).json({ error: error.message });
    console.error("학생 PIN 로그인을 처리하지 못했습니다.", error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "학생 로그인을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
}
