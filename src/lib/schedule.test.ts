import { describe, expect, it } from "vitest";
import { buildSlots, buildTeacherAvailabilitySlots } from "./schedule";
import type { ConsultationRequest } from "../types";

describe("학교별 상담 시간표", () => {
  it("다른 학교가 설정한 시간만 생성한다", () => {
    const config = { consultation: { weeklySchedule: { monday: [{ start: "09:30", end: "09:45", label: "상담 시간", type: "break" }] } } };
    // 설정을 무시하고 기존 고정 시간표를 사용하면 실패해야 합니다.
    expect(buildSlots("2026-09-07", config as never).map(s => [s.start, s.end, s.label])).toEqual([["09:30", "09:45", "상담 시간"]]);
  });
});

describe("상담 시간표", () => {
  it("7교시 날의 상담 시간을 실제 시간 순서와 쉬운 이름으로 만든다", () => {
    const slots = buildSlots("2026-08-31");

    expect(slots.map(({ start, label }) => [start, label])).toEqual([
      ["08:10", "조회 끝나고 잠깐"],
      ["09:10", "1교시 끝나고 쉬는 시간"],
      ["10:10", "2교시 끝나고 쉬는 시간"],
      ["11:10", "3교시 끝나고 쉬는 시간"],
      ["12:10", "점심시간 앞부분"],
      ["12:30", "점심시간 뒷부분"],
      ["13:50", "5교시 끝나고 쉬는 시간"],
      ["14:50", "6교시 끝나고 쉬는 시간"],
      ["15:50", "방과 후 바로"],
      ["16:10", "방과 후 20분 뒤"],
    ]);
  });

  it("6교시 금요일에는 14:50을 방과 후 바로로 한 번만 만든다", () => {
    const slots = buildSlots("2026-08-28");
    expect(slots.filter((slot) => slot.start === "14:50")).toHaveLength(1);
    expect(slots.find((slot) => slot.start === "14:50")?.label).toBe("방과 후 바로");
    expect(new Set(slots.map((slot) => slot.id)).size).toBe(slots.length);
  });

  it("7교시 월요일에는 15:50을 방과 후 바로로 한 번만 만든다", () => {
    const slots = buildSlots("2026-08-31");
    expect(slots.filter((slot) => slot.start === "15:50")).toHaveLength(1);
    expect(slots.find((slot) => slot.start === "15:50")?.label).toBe("방과 후 바로");
    expect(new Set(slots.map((slot) => slot.id)).size).toBe(slots.length);
  });

  it("학생 요청과 승인된 시간은 교사 화면에서 선택할 수 없게 표시한다", () => {
    const requests = [
      { id: "r1", studentName: "가상학생가", date: "2026-08-28", start: "14:50", status: "confirmed" },
      { id: "r2", studentName: "가상학생나", date: "2026-08-28", start: "13:50", status: "pending" },
    ] as ConsultationRequest[];
    const slots = buildTeacherAvailabilitySlots("2026-08-28", {}, requests);

    expect(slots.find((slot) => slot.start === "14:50")?.bookingStatus).toBe("confirmed");
    expect(slots.find((slot) => slot.start === "14:50")?.bookingStudentName).toBe("가상학생가");
    expect(slots.find((slot) => slot.start === "13:50")?.bookingStatus).toBe("pending");
    expect(slots.find((slot) => slot.start === "13:50")?.bookingStudentName).toBe("가상학생나");
  });
});
