import { describe, expect, it } from "vitest";
import { canResetStudentPin, parseStudentPinResetBody } from "./teacherAuthorization";

describe("학생 PIN 초기화 권한", () => {
  it("관리자 Google 계정은 교사 역할 표시가 없어도 허용한다", () => {
    expect(canResetStudentPin(
      { email: "admin@example.com" },
      false,
      "admin@example.com",
    )).toBe(true);
  });

  it("승인된 PIN 교사는 허용하고 승인 전 교사는 거부한다", () => {
    expect(canResetStudentPin({ role: "teacher" }, true, "admin@example.com")).toBe(true);
    expect(canResetStudentPin({ role: "teacher" }, false, "admin@example.com")).toBe(false);
  });

  it("학생과 일반 Google 계정은 거부한다", () => {
    expect(canResetStudentPin({ role: "student" }, true, "admin@example.com")).toBe(false);
    expect(canResetStudentPin({ email: "other@example.com" }, true, "admin@example.com")).toBe(false);
  });
});

describe("학생 PIN 초기화 요청", () => {
  it("관리자 화면에서 선택한 학생 uid를 함께 받는다", () => {
    expect(parseStudentPinResetBody({ name: "김하늘", studentNumber: "10312", uid: "student_second" })).toEqual({ name: "김하늘", studentNumber: "10312", uid: "student_second" });
  });

  it("일반 교사 입력은 uid 없이 받고 위험한 uid는 거부한다", () => {
    expect(parseStudentPinResetBody({ name: "김하늘", studentNumber: "10312" })).toEqual({ name: "김하늘", studentNumber: "10312" });
    expect(parseStudentPinResetBody({ name: "김하늘", studentNumber: "10312", uid: "student/second" })).toBeNull();
  });
});
