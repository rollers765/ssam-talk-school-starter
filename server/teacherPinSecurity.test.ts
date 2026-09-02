import { describe, expect, it } from "vitest";
import { teacherKey } from "./teacherPinSecurity";

describe("교사 PIN 보안", () => {
  it("정리된 이름을 서버 비밀키 기반의 고정 검색 키로 바꾼다", () => {
    expect(teacherKey("  김  교사 ", "test-secret")).toBe(teacherKey("김 교사", "test-secret"));
    expect(teacherKey("김 교사", "test-secret")).not.toContain("김");
  });
});
