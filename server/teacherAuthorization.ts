import { isStudentNumber } from "../shared/school-config.mjs";
export type TeacherActor = {
  role?: unknown;
  email?: unknown;
};

export function canResetStudentPin(actor: TeacherActor, teacherApproved: boolean, adminEmail: string) {
  const email = typeof actor.email === "string" ? actor.email.trim().toLowerCase() : "";
  const normalizedAdmin = adminEmail.trim().toLowerCase();
  if (normalizedAdmin && email === normalizedAdmin) return true;
  return actor.role === "teacher" && teacherApproved;
}

function validUid(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128 && value === value.trim() && !value.includes("/") && !value.includes("\0");
}

export type StudentPinResetBody = { name: string; studentNumber: string; uid?: string };

export function parseStudentPinResetBody(value: unknown): StudentPinResetBody | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const rawName = body.name;
  const rawStudentNumber = body.studentNumber;
  const uid = body.uid;
  const allowed = uid === undefined ? ["name", "studentNumber"] : ["name", "studentNumber", "uid"];
  if (Object.keys(body).some((key) => !allowed.includes(key))) return null;
  if (typeof rawName !== "string" || !rawName.trim() || rawName.trim().length > 20) return null;
  if (!isStudentNumber(rawStudentNumber)) return null;
  let parsedUid: string | undefined;
  if (uid !== undefined) {
    if (!validUid(uid)) return null;
    parsedUid = uid;
  }
  const name = rawName.trim();
  const studentNumber = rawStudentNumber;
  if (parsedUid !== undefined) return { name, studentNumber, uid: parsedUid };
  return { name, studentNumber };
}
