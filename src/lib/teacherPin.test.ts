import { describe, expect, it } from "vitest";
import { isTeacherPin, normalizeTeacherName } from "./teacherPin";

describe("교사 PIN 입력", () => {
  it("이름의 앞뒤 공백과 연속 공백을 정리한다", () => {
    expect(normalizeTeacherName("  김  교사 ")).toBe("김 교사");
  });

  it("6자리 숫자 PIN만 허용한다", () => {
    expect(isTeacherPin("482913")).toBe(true);
    expect(isTeacherPin("12345")).toBe(false);
    expect(isTeacherPin("12a456")).toBe(false);
  });
});
