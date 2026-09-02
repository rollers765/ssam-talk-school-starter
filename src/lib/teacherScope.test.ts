import { describe, expect, it } from "vitest";
import { canManageTeacherData, isAdminEmail, teacherSlotId } from "./teacherScope";

describe("teacherScope", () => {
  it("서로 다른 선생님의 같은 시간을 서로 다른 문서로 만든다", () => {
    expect(teacherSlotId("teacher-a", "2026-07-30_12:10")).toBe("teacher-a__2026-07-30_12:10");
    expect(teacherSlotId("teacher-b", "2026-07-30_12:10")).not.toBe("teacher-a__2026-07-30_12:10");
  });

  it("관리자 이메일이 설정되지 않으면 임의의 계정을 관리자로 인정하지 않는다", () => {
    expect(isAdminEmail("admin@example.com")).toBe(false);
    expect(isAdminEmail("student@example.com")).toBe(false);
  });

  it("승인된 선생님이 자기 자료만 관리할 수 있다", () => {
    expect(canManageTeacherData("teacher-a", "teacher-a", true)).toBe(true);
    expect(canManageTeacherData("teacher-a", "teacher-b", true)).toBe(false);
    expect(canManageTeacherData("teacher-a", "teacher-a", false)).toBe(false);
  });
});
