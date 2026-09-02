const alreadyBookedMessage = "이미 다른 학생이 먼저 신청했어요";

export function consultationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes(alreadyBookedMessage)) return "그 시간은 방금 다른 상담이 잡혔어요. 다른 시간을 골라주세요.";
  return "상담 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.";
}
