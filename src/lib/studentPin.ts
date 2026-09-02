export type StudentAuthInput = {
  action: "login" | "register";
  studentNumber: string;
  pin: string;
  name?: string;
};

export { isStudentNumber } from "../../shared/school-config.mjs";

export function isStudentPin(value: string) {
  return /^\d{6}$/.test(value);
}
