import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseServiceAccount } from "../server/firebaseProject.js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { isAdminActor, parseAdminDirectoryBody } from "../server/adminDirectorySecurity.js";
import { parseBearerToken } from "../server/requestDeleteAuthorization.js";
import { studentKey } from "../server/studentPinSecurity.js";
import { teacherKey } from "../server/teacherPinSecurity.js";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT가 비어 있습니다.");
  return initializeApp({ credential: cert(parseServiceAccount(raw, process.env.VITE_FIREBASE_PROJECT_ID)) });
}

async function deleteAuthUser(uid: string, app: ReturnType<typeof getAdminApp>) {
  try {
    await getAuth(app).deleteUser(uid);
  } catch (error) {
    if ((error as { code?: string })?.code !== "auth/user-not-found") throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "허용되지 않은 요청입니다." });
  const body = parseAdminDirectoryBody(req.body);
  if (!body) return res.status(400).json({ error: "삭제할 등록 정보를 확인해 주세요." });
  const token = parseBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: "관리자 로그인을 다시 확인해 주세요." });

  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token).catch(() => null);
    if (!decoded) return res.status(401).json({ error: "로그인 시간이 끝났어요. 다시 로그인해 주세요." });
    if (!isAdminActor(decoded, process.env.VITE_ADMIN_EMAIL || "")) return res.status(403).json({ error: "관리자만 사용할 수 있습니다." });
    if (body.uid === decoded.uid) return res.status(400).json({ error: "현재 로그인한 관리자 계정은 삭제할 수 없습니다." });

    const store = getFirestore(app);
    const userRef = store.collection("users").doc(body.uid);
    const user = await userRef.get();
    const userData = user.data();
    if (!user.exists) return res.status(404).json({ error: "등록 정보를 찾을 수 없어요." });

    const secret = process.env.STUDENT_AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("인증 비밀키가 안전하게 설정되지 않았습니다.");
    if (body.action === "delete-student") {
      if (userData?.role !== "student" || userData.studentNumber !== body.studentNumber) return res.status(400).json({ error: "학생 정보가 일치하지 않습니다." });
      const credentialId = typeof userData.credentialId === "string" ? userData.credentialId : studentKey(body.studentNumber, secret);
      const writer = store.bulkWriter();
      const requests = await store.collection("requests").where("userId", "==", body.uid).get();
      for (const request of requests.docs) {
        const slotId = request.data().slotId;
        if (typeof slotId === "string" && slotId) writer.delete(store.collection("slotLocks").doc(slotId));
        writer.delete(request.ref);
      }
      writer.delete(store.collection("studentCredentials").doc(credentialId));
      writer.delete(store.collection("studentSessions").doc(body.uid));
      writer.delete(userRef);
      await writer.close();
      await deleteAuthUser(body.uid, app);
      return res.status(200).json({ ok: true });
    }

    if (userData?.role !== "teacher") return res.status(400).json({ error: "교사 정보가 일치하지 않습니다." });
    const writer = store.bulkWriter();
    const [schedules, publicSchedules, overrides, locks, requests] = await Promise.all([
      store.collection("schedules").where("teacherId", "==", body.uid).get(),
      store.collection("publicSchedules").where("teacherId", "==", body.uid).get(),
      store.collection("slotOverrides").where("teacherId", "==", body.uid).get(),
      store.collection("slotLocks").where("teacherId", "==", body.uid).get(),
      store.collection("requests").where("teacherId", "==", body.uid).get(),
    ]);
    for (const snapshot of [schedules, publicSchedules, overrides, locks]) {
      for (const item of snapshot.docs) writer.delete(item.ref);
    }
    for (const request of requests.docs) {
      if (["pending", "confirmed", "proposed"].includes(String(request.data().status))) {
        writer.set(request.ref, { status: "deferred", teacherNote: "선생님 등록이 해제되어 다음에 다시 일정을 잡아야 해요.", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }
    const teacherName = typeof userData.name === "string" ? userData.name : "";
    if (teacherName) writer.delete(store.collection("teacherCredentials").doc(teacherKey(teacherName, secret)));
    writer.delete(store.collection("teacherApplications").doc(body.uid));
    writer.delete(store.collection("teachers").doc(body.uid));
    writer.delete(userRef);
    await writer.close();
    await deleteAuthUser(body.uid, app);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("관리자 등록 삭제 처리 실패", error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "등록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
}
