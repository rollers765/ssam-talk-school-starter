// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ConsultationRequest } from "../types";
import { TodayConsultations } from "./TodayConsultations";

afterEach(cleanup);

describe("TodayConsultations", () => {
  it("오늘 확정된 학생만 상담 시간 순서로 보여준다", () => {
    const requests = [
      { id: "late", studentName: "가상학생다", studentNumber: "20115", topic: "여러 가지 이야기", date: "2026-08-26", start: "15:50", status: "confirmed" },
      { id: "pending", studentName: "가상학생라", studentNumber: "20110", topic: "진로", date: "2026-08-26", start: "13:50", status: "pending" },
      { id: "early", studentName: "가상학생나", studentNumber: "20101", topic: "친구", date: "2026-08-26", start: "11:10", status: "confirmed" },
      { id: "other-day", studentName: "가상학생가", studentNumber: "20106", topic: "성적", date: "2026-08-27", start: "09:10", status: "confirmed" },
    ] as ConsultationRequest[];

    render(<TodayConsultations requests={requests} today="2026-08-26" />);

    expect(screen.getAllByTestId("today-consultation").map((item) => item.textContent)).toEqual([
      "11:10가상학생나20101",
      "15:50가상학생다20115",
    ]);
  });

  it("오늘 확정 상담이 없으면 빈 상태를 알려준다", () => {
    render(<TodayConsultations requests={[]} today="2026-08-26" />);

    expect(screen.getByText("오늘 확정된 상담이 없어요")).toBeInTheDocument();
  });
});
