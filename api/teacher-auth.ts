import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseServiceAccount } from "../server/firebaseProject.js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { evaluatePinAttempt, hashPin } from "../server/studentPinSecurity.js";
import { teacherKey } from "../server/teacherPinSecurity.js";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT가 비어 있습니다.");
  return initializeApp({ credential: cert(parseServiceAccount(raw, process.env.VITE_FIREBASE_PROJECT_ID)) });
}

class TeacherAuthError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "허용되지 않은 요청입니다." });
  try {
    const { action, name, department, pin } = req.body || {};
    const cleanName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
    if (!['login', 'register'].includes(action) || !cleanName || cleanName.length > 20 || typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
      throw new TeacherAuthError(400, "이름과 6자리 PIN을 확인해 주세요.");
    }
    const cleanDepartment = typeof department === "string" ? department.trim() : "";
    if (action === "register" && (!cleanDepartment || cleanDepartment.length > 40)) throw new TeacherAuthError(400, "소속 부서를 확인해 주세요.");

    const secret = process.env.STUDENT_AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("인증 비밀키가 안전하게 설정되지 않았습니다.");
    const app = getAdminApp();
    const store = getFirestore(app);
    const auth = getAuth(app);
    const key = teacherKey(cleanName, secret);
    const credentialRef = store.collection("teacherCredentials").doc(key);
    const uid = `teacher_${key.slice(0, 40)}`;

    if (action === "register") {
      const encoded = await hashPin(pin);
      await store.runTransaction(async (tx) => {
        const existing = await tx.get(credentialRef);
        if (existing.exists) throw new TeacherAuthError(409, "이미 등록된 이름이에요. ‘이미 등록했어요’에서 로그인해 주세요.");
        tx.set(credentialRef, { uid, salt: encoded.salt, pinHash: encoded.hash, failedAttempts: 0, lockedUntil: null });
        tx.set(store.collection("users").doc(uid), { name: cleanName, department: cleanDepartment, role: "teacher" });
        tx.set(store.collection("teacherApplications").doc(uid), { name: cleanName, department: cleanDepartment, status: "pending", createdAt: new Date() });
      });
      const token = await auth.createCustomToken(uid, { role: "teacher" });
      return res.status(200).json({ token });
    }

    const result = await store.runTransaction(async (tx) => {
      const credential = await tx.get(credentialRef);
      const data = credential.data();
      if (!credential.exists || !data) throw new TeacherAuthError(401, "이름 또는 PIN을 확인해 주세요.");
      const attempt = await evaluatePinAttempt(pin, { salt: String(data.salt), pinHash: String(data.pinHash), failedAttempts: Number(data.failedAttempts || 0), lockedUntil: data.lockedUntil || null }, Date.now());
      if (attempt.kind === "failure") tx.update(credentialRef, attempt.next);
      if (attempt.kind === "success") tx.update(credentialRef, { failedAttempts: 0, lockedUntil: null });
      return { attempt, uid: String(data.uid) };
    });
    if (result.attempt.kind === "locked") throw new TeacherAuthError(429, `PIN을 여러 번 틀렸어요. ${result.attempt.minutes}분 뒤 다시 시도해 주세요.`);
    if (result.attempt.kind === "failure") throw new TeacherAuthError(result.attempt.next.lockedUntil ? 429 : 401, result.attempt.next.lockedUntil ? "PIN을 5번 틀려 10분 동안 로그인이 잠겼어요." : "이름 또는 PIN을 확인해 주세요.");
    const token = await auth.createCustomToken(result.uid, { role: "teacher" });
    return res.status(200).json({ token });
  } catch (error) {
    if (error instanceof TeacherAuthError) return res.status(error.status).json({ error: error.message });
    console.error("교사 PIN 로그인을 처리하지 못했습니다.", error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "교사 로그인을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
}
