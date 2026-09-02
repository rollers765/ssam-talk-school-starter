import { describe, expect, it } from "vitest";
import { shouldUseRedirectLogin } from "./loginMode";

describe("shouldUseRedirectLogin", () => {
  it("좁은 화면에서는 전체 화면 로그인으로 이동한다", () => {
    expect(shouldUseRedirectLogin(390, false)).toBe(true);
  });

  it("터치 중심 기기에서는 전체 화면 로그인으로 이동한다", () => {
    expect(shouldUseRedirectLogin(1024, true)).toBe(true);
  });

  it("넓은 컴퓨터 화면에서는 작은 로그인 창을 사용한다", () => {
    expect(shouldUseRedirectLogin(1280, false)).toBe(false);
  });
});
