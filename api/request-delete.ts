import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseServiceAccount } from "../server/firebaseProject.js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { isAdminActor } from "../server/adminDirectorySecurity.js";
import {
  canDeleteBoundSlotLock,
  canDeleteRequest,
  isDeleteRequestBody,
  isValidRequestId,
  parseBearerToken,
} from "../server/requestDeleteAuthorization.js";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT가 비어 있습니다.");
  return initializeApp({ credential: cert(parseServiceAccount(raw, process.env.VITE_FIREBASE_PROJECT_ID)) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "허용하지 않는 요청입니다." });
  if (!isDeleteRequestBody(req.body)) return res.status(400).json({ error: "삭제할 상담 기록을 확인해 주세요." });

  const token = parseBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: "로그인을 다시 확인해 주세요." });

  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token).catch(() => null);
    if (!decoded) return res.status(401).json({ error: "로그인 시간이 만료되었어요. 다시 로그인해 주세요." });

    const store = getFirestore(app);
    const requestRef = store.collection("requests").doc(req.body.requestId);
    const outcome = await store.runTransaction(async (transaction) => {
      const request = await transaction.get(requestRef);
      if (!request.exists) return "not-found" as const;

      const data = request.data() || {};
      const studentSession = decoded.role === "student"
        ? await transaction.get(store.collection("studentSessions").doc(decoded.uid))
        : null;
      const sessionActive = studentSession?.exists === true
        && typeof decoded.sessionVersion === "number"
        && Number.isInteger(decoded.sessionVersion)
        && studentSession.data()?.version === decoded.sessionVersion;
      const teacher = decoded.role === "student"
        ? null
        : await transaction.get(store.collection("teachers").doc(decoded.uid));
      const teacherApproved = teacher?.exists === true && teacher.data()?.status === "approved";
      const adminAuthorized = isAdminActor(decoded, process.env.VITE_ADMIN_EMAIL || "");

      if (!canDeleteRequest({ actor: decoded, request: data, sessionActive, teacherApproved, adminAuthorized })) return "forbidden" as const;

      const slotId = isValidRequestId(data.slotId) ? data.slotId : "";
      if (slotId) {
        const lockRef = store.collection("slotLocks").doc(slotId);
        const lock = await transaction.get(lockRef);
        if (canDeleteBoundSlotLock({ requestId: requestRef.id, slotId, lock: lock.data() })) transaction.delete(lockRef);
      }
      transaction.delete(requestRef);
      return "deleted" as const;
    });
    if (outcome === "not-found") return res.status(404).json({ error: "상담 기록을 찾을 수 없어요." });
    if (outcome === "forbidden") return res.status(403).json({ error: "이 상담 기록을 삭제할 권한이 없어요." });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("상담 기록 삭제 처리 실패", error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "상담 기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
}
