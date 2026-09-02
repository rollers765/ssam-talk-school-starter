import type { ConsultationRequest, RequestStatus, TimeSlot } from "../types";
import { schoolConfig, type SchoolConfig } from "./schoolConfig";

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatKoreanDate(dateKey: string, includeYear = false) {
  const date = new Date(`${dateKey}T00:00:00`);
  const options: Intl.DateTimeFormatOptions = includeYear
    ? { year: "numeric", month: "long", day: "numeric", weekday: "short" }
    : { month: "long", day: "numeric", weekday: "short" };
  return new Intl.DateTimeFormat("ko-KR", options).format(date);
}

export function buildSlots(dateKey: string, config: SchoolConfig = schoolConfig): TimeSlot[] {
  const day = new Date(`${dateKey}T00:00:00`).getDay();
  if (day === 0 || day === 6) return [];
  const weekday = ["monday", "tuesday", "wednesday", "thursday", "friday"][day - 1] as keyof SchoolConfig["consultation"]["weeklySchedule"];
  return (config.consultation.weeklySchedule[weekday] || []).map(slot => ({ ...slot, id: `${dateKey}_${slot.start}`, date: dateKey, enabled: true })).sort((a, b) => a.start.localeCompare(b.start));
}

export function buildTeacherAvailabilitySlots(
  dateKey: string,
  disabled: Record<string, boolean>,
  requests: ConsultationRequest[],
) {
  const active = new Set<RequestStatus>(["pending", "confirmed", "proposed"]);
  return buildSlots(dateKey).map((slot) => {
    const request = requests.find((item) => {
      if (!active.has(item.status)) return false;
      const requestDate = item.status === "proposed" ? item.proposedDate : item.date;
      const requestStart = item.status === "proposed" ? item.proposedStart : item.start;
      return requestDate === slot.date && requestStart === slot.start;
    });
    return {
      ...slot,
      enabled: !disabled[slot.id],
      bookingStatus: request?.status,
      bookingStudentName: request?.studentName,
    };
  });
}

export function getFourWeekDays(config: SchoolConfig = schoolConfig) {
  const result: Date[] = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  for (let i = 0; i <= config.consultation.weeksAvailable * 7; i += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + i);
    if (buildSlots(toDateKey(candidate), config).length > 0) result.push(candidate);
  }
  return result;
}

export function isPastSlot(dateKey: string, start: string) {
  return new Date(`${dateKey}T${start}:00`).getTime() <= Date.now();
}

export function getStatusLabel(status: string) {
  return {
    pending: "선생님 확인 중",
    confirmed: "상담 확정",
    proposed: "새 시간 도착",
    deferred: "다음에 만나요",
    cancelled: "요청 취소",
    completed: "상담 완료",
  }[status] ?? status;
}
