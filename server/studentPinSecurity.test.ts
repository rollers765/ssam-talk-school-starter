import { describe, expect, it } from "vitest";
import { evaluatePinAttempt, hashPin, recordFailedAttempt, studentKey, verifyPin } from "./studentPinSecurity";

describe("student PIN security", () => {
  it("학번을 서버 비밀키 기반의 고정 검색 키로 바꾼다", () => {
    expect(studentKey("10312", "test-secret")).toBe("2fc2e98efcd854085af9eeb7b832b4247ea2dcac7492d1a1ad2ce7767f77bff8");
  });

  it("같은 PIN도 서로 다른 값으로 저장하고 올바른 PIN만 확인한다", async () => {
    const first = await hashPin("482913");
    const second = await hashPin("482913");

    expect(first.hash).not.toBe("482913");
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    await expect(verifyPin("482913", first.salt, first.hash)).resolves.toBe(true);
    await expect(verifyPin("111111", first.salt, first.hash)).resolves.toBe(false);
  });

  it("다섯 번째 실패에서 10분 동안 잠근다", () => {
    const now = 1_000_000;
    let state = { failedAttempts: 0, lockedUntil: null as number | null };
    for (let attempt = 0; attempt < 4; attempt += 1) state = recordFailedAttempt(state, now);
    expect(state).toEqual({ failedAttempts: 4, lockedUntil: null });

    state = recordFailedAttempt(state, now);
    expect(state).toEqual({ failedAttempts: 5, lockedUntil: 1_600_000 });
  });

  it("잠긴 상태에서는 올바른 PIN이어도 잠금을 먼저 지킨다", async () => {
    const encoded = await hashPin("482913");
    const result = await evaluatePinAttempt("482913", {
      salt: encoded.salt,
      pinHash: encoded.hash,
      failedAttempts: 5,
      lockedUntil: 1_600_000,
    }, 1_000_000);

    expect(result.kind).toBe("locked");
  });
});
