export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();

export function isAdminEmail(email?: string | null) {
  return Boolean(ADMIN_EMAIL) && email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export function teacherSlotId(teacherId: string, slotId: string) {
  return `${teacherId}__${slotId}`;
}

export function canManageTeacherData(userId: string, teacherId: string, approved: boolean) {
  return approved && userId === teacherId;
}
