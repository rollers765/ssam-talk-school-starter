export type TeacherAuthInput = {
  action: "login" | "register";
  name: string;
  pin: string;
  department?: string;
};

export function normalizeTeacherName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isTeacherPin(value: string) {
  return /^\d{6}$/.test(value);
}
