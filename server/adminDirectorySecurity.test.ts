import { describe, expect, it } from "vitest";
import { isAdminActor, parseAdminDirectoryBody } from "./adminDirectorySecurity";

describe("관리자 등록 관리 권한", () => {
  it("설정된 관리자 이메일만 허용한다", () => {
    expect(isAdminActor({ email: "admin@example.com" }, "admin@example.com")).toBe(true);
    expect(isAdminActor({ email: "other@example.com" }, "admin@example.com")).toBe(false);
    expect(isAdminActor({ role: "teacher" }, "admin@example.com")).toBe(false);
  });
});

describe("관리자 삭제 요청 검증", () => {
  it("학생 삭제에는 안전한 uid와 5자리 학번을 요구한다", () => {
    expect(parseAdminDirectoryBody({ action: "delete-student", uid: "student_1", studentNumber: "10312" })).toEqual({ action: "delete-student", uid: "student_1", studentNumber: "10312" });
    expect(parseAdminDirectoryBody({ action: "delete-student", uid: "student/1", studentNumber: "10312" })).toBeNull();
    expect(parseAdminDirectoryBody({ action: "delete-student", uid: "student_1", studentNumber: "123" })).toBeNull();
  });

  it("교사 삭제에는 안전한 uid만 허용하고 추가 필드는 거부한다", () => {
    expect(parseAdminDirectoryBody({ action: "delete-teacher", uid: "teacher_1" })).toEqual({ action: "delete-teacher", uid: "teacher_1" });
    expect(parseAdminDirectoryBody({ action: "delete-teacher", uid: "teacher_1", name: "김교사" })).toBeNull();
  });
});
