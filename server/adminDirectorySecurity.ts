import { isStudentNumber } from "../shared/school-config.mjs";
export type AdminActor = { email?: unknown; role?: unknown };

type StudentDelete = { action: "delete-student"; uid: string; studentNumber: string };
type TeacherDelete = { action: "delete-teacher"; uid: string };
export type AdminDirectoryBody = StudentDelete | TeacherDelete;

function validUid(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128 && !value.includes("/") && !value.includes("\0") && value === value.trim();
}

export function isAdminActor(actor: AdminActor, adminEmail: string) {
  const email = typeof actor.email === "string" ? actor.email.trim().toLowerCase() : "";
  const expected = adminEmail.trim().toLowerCase();
  return Boolean(expected) && email === expected;
}

export function parseAdminDirectoryBody(value: unknown): AdminDirectoryBody | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (body.action === "delete-student") {
    if (Object.keys(body).length !== 3 || !validUid(body.uid) || !isStudentNumber(body.studentNumber)) return null;
    return { action: "delete-student", uid: body.uid, studentNumber: body.studentNumber };
  }
  if (body.action === "delete-teacher") {
    if (Object.keys(body).length !== 2 || !validUid(body.uid)) return null;
    return { action: "delete-teacher", uid: body.uid };
  }
  return null;
}
