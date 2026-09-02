import { describe, expect, it } from "vitest";
import { hashPin } from "./studentPinSecurity";
import { findMatchingCredential, nextRegistrationNumber } from "./studentCredentialSecurity";

describe("student credential selection", () => {
  it("기존 자료를 첫 번째 등록으로 보고 다음 번호를 정한다", () => {
    expect(nextRegistrationNumber([])).toBe(1);
    expect(nextRegistrationNumber([{ registrationNumber: undefined }, { registrationNumber: 2 }])).toBe(3);
  });

  it("같은 학번의 여러 자료 중 PIN이 맞는 계정을 고른다", async () => {
    const first = await hashPin("111111", "salt-first");
    const second = await hashPin("222222", "salt-second");

    const result = await findMatchingCredential("222222", [
      { id: "first", uid: "student_first", salt: first.salt, pinHash: first.hash },
      { id: "second", uid: "student_second", salt: second.salt, pinHash: second.hash },
    ], 1_000_000);

    expect(result).toEqual({ kind: "match", credentialId: "second", uid: "student_second" });
  });

  it("초기화된 자료는 로그인 후보에서 제외한다", async () => {
    const encoded = await hashPin("222222", "salt-reset");
    const result = await findMatchingCredential("222222", [
      { id: "reset", uid: "student_reset", salt: encoded.salt, pinHash: encoded.hash, resetRequired: true },
    ], 1_000_000);

    expect(result).toEqual({ kind: "none" });
  });

  it("PIN이 맞아도 해당 계정이 잠겨 있으면 잠금 시간을 알린다", async () => {
    const encoded = await hashPin("222222", "salt-locked");
    const result = await findMatchingCredential("222222", [
      { id: "locked", uid: "student_locked", salt: encoded.salt, pinHash: encoded.hash, lockedUntil: 1_600_000 },
    ], 1_000_000);

    expect(result).toEqual({ kind: "locked", minutes: 10 });
  });
});
