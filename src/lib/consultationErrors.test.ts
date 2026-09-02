import { describe, expect, it } from "vitest";
import { consultationErrorMessage } from "./consultationErrors";

describe("consultationErrorMessage", () => {
  it("이미 다른 학생이 신청한 시간 오류를 다시 고를 수 있는 안내로 바꾼다", () => {
    expect(consultationErrorMessage(new Error("이미 다른 학생이 먼저 신청했어요."))).toBe("그 시간은 방금 다른 상담이 잡혔어요. 다른 시간을 골라주세요.");
  });

  it("그 밖의 오류는 일반적인 재시도 안내로 바꾼다", () => {
    expect(consultationErrorMessage(new Error("network"))).toBe("상담 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
  });
});
