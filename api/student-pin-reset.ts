import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseServiceAccount } from "../server/firebaseProject.js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { studentKey } from "../server/studentPinSecurity.js";
import { isAdminActor } from "../server/adminDirectorySecurity.js";
import { canResetStudentPin, parseStudentPinResetBody } from "../server/teacherAuthorization.js";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT가 비어 있습니다.");
  return initializeApp({ credential: cert(parseServiceAccount(raw, process.env.VITE_FIREBASE_PROJECT_ID)) });
}

export default async function handler(req: VercelRequest, res: VercResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "허용되지 않은 요청입니다." });
  try {
    const app = getAdminApp();
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "선생님 로그인을 다시 확인해 주세요." });
    const decoded = await getAuth(app).verifyIdToken(token).catch(() => null);
    if (!decoded) return res.status(401).json({ error: "로그인 시간이 끝났어요. 다시 로그인해 주세요." });
    const store = getFirestore(app);
    const teacher = await store.collection("teachers").doc(decoded.uid).get();
    const approved = teacher.exists && teacher.data()?.status === "approved";
    if (!canResetStudentPin(decoded, approved, process.env.VITE_ADMIN_EMAIL || "")) {
      return res.status(403).json({ error: "승인된 선생님만 초기화할 수 있습니다." });
    }

    const body = parseStudentPinResetBody(req.body);
    if (!body) return res.status(400).json({ error: "학생 이름과 설정된 형식의 학번을 확인해 주세요." });
    const isAdmin = isAdminActor(decoded, process.env.VITE_ADMIN_EMAIL || "");
    if (body.uid && !isAdmin) return res.status(403).json({ error: "관리자만 학생 목록에서 계정을 직접 선택할 수 있습니다." });
    const secret = process.env.STUDENT_AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("STUDENT_AUTH_SECRET가 안전하게 설정되지 않았습니다.");
    let studentUid = body.uid || "";
    let studentData: Record<string, unknown> | undefined;
    if (studentUid) {
      const student = await store.collection("users").doc(studentUid).get();
      studentData = student.data();
      if (!student.exists || studentData?.role !== "student" || studentData.name !== body.name || studentData.studentNumber !== body.studentNumber) throw new Error("STUDENT_NOT_FOUND");
    } else {
      const matches = await store.collection("users").where("studentNumber", "==", body.studentNumber).get();
      const exact = matches.docs.filter((item) => item.data().role === "student" && item.data().name === body.name);
      if (exact.length === 0) throw new Error("STUDENT_NOT_FOUND");
      if (exact.length > 1) throw new Error("STUDENT_AMBIGUOUS");
      studentUid = exact[0].id;
      studentData = exact[0].data();
    }
    const credentialId = typeof studentData?.credentialId === "string" ? studentData.credentialId : studentKey(body.studentNumber, secret);
    const credentialRef = store.collection("studentCredentials").doc(credentialId);
    await store.runTransaction(async (tx) => {
      const credential = await tx.get(credentialRef);
      const data = credential.data();
      if (!credential.exists || data?.uid !== studentUid) throw new Error("STUDENT_NOT_FOUND");
      const nextVersion = Number(data.sessionVersion || 1) + 1;
      tx.update(credentialRef, { pinHash: FieldValue.delete(), salt: FieldValue.delete(), failedAttempts: 0, lockedUntil: null, resetRequired: true, sessionVersion: nextVersion });
      tx.set(store.collection("studentSessions").doc(studentUid), { version: nextVersion });
    });
    await getAuth(app).revokeRefreshTokens(studentUid);
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_NOT_FOUND") return res.status(404).json({ error: "이름과 학번이 일치하는 학생을 찾지 못했어요." });
    if (error instanceof Error && error.message === "STUDENT_AMBIGUOUS") return res.status(409).json({ error: "같은 이름과 학번의 등록이 여러 개예요. 학생은 ‘처음 이용해요’에서 다시 등록하거나 관리자에게 요청해 주세요." });
    console.error("학생 PIN 초기화를 처리하지 못했습니다.", error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "PIN을 초기화하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
}

type VercResponse = VercelResponse;
