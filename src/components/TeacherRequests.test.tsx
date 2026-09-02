// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeacherRequests } from "./TeacherRequests";
import type { ConsultationRequest } from "../types";

const pendingRequest: ConsultationRequest = {
  id: "teacher-request-1",
  teacherId: "teacher-1",
  teacherName: "김선생님",
  userId: "student-1",
  studentEmail: "student@example.test",
  studentName: "학생",
  studentNumber: "10312",
  topic: "진로 상담",
  kind: "normal",
  date: "2026-08-03",
  start: "10:10",
  end: "10:20",
  slotId: "slot-1",
  status: "pending",
  createdAt: new Date("2026-08-01T09:00:00"),
};

function renderRequests(overrides: Partial<ComponentProps<typeof TeacherRequests>> = {}) {
  const handlers = { onAct: vi.fn(), onDelete: vi.fn() };
  return {
    handlers,
    ...render(<TeacherRequests requests={[pendingRequest]} deletingId="" deleteError="" {...handlers} {...overrides} />),
  };
}

afterEach(cleanup);

describe("TeacherRequests", () => {
  it("대기 요청에서 승인과 다음 일정 안내를 기존처럼 전달한다", () => {
    const { handlers } = renderRequests();

    fireEvent.click(screen.getByRole("button", { name: "승인하기" }));
    fireEvent.click(screen.getByRole("button", { name: "다음에 일정 잡아 연락할게" }));

    expect(handlers.onAct).toHaveBeenNthCalledWith(1, pendingRequest, "confirmed");
    expect(handlers.onAct).toHaveBeenNthCalledWith(2, pendingRequest, "deferred");
  });

  it("다른 시간을 제안한 뒤 입력한 날짜와 시간을 전달한다", () => {
    const { handlers } = renderRequests();

    fireEvent.click(screen.getByRole("button", { name: "다른 시간 제안" }));
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-08-04" } });
    fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "11:10" } });
    fireEvent.click(screen.getByRole("button", { name: "제안 보내기" }));

    expect(handlers.onAct).toHaveBeenCalledWith(pendingRequest, "proposed", { date: "2026-08-04", start: "11:10" });
  });

  it("확정된 상담을 완료로 표시한다", () => {
    const confirmedRequest = { ...pendingRequest, id: "confirmed-request", status: "confirmed" as const };
    const { handlers } = renderRequests({ requests: [confirmedRequest] });

    fireEvent.click(screen.getByRole("button", { name: "상담 완료로 표시" }));

    expect(handlers.onAct).toHaveBeenCalledWith(confirmedRequest, "completed");
  });

  it("삭제를 취소하면 삭제 콜백을 호출하지 않는다", () => {
    const { handlers } = renderRequests();

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));
    expect(screen.getByText("삭제하면 다시 볼 수 없어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "그만할래요" }));

    expect(handlers.onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("삭제하면 다시 볼 수 없어요")).not.toBeInTheDocument();
  });

  it("명시적으로 확인한 삭제만 해당 요청을 전달한다", () => {
    const { handlers } = renderRequests();

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));
    fireEvent.click(screen.getByRole("button", { name: "정말 삭제하기" }));

    expect(handlers.onDelete).toHaveBeenCalledWith(pendingRequest);
  });

  it("삭제 중에는 중복 삭제를 막는다", () => {
    renderRequests({ deletingId: pendingRequest.id });

    expect(screen.getByRole("button", { name: "삭제 중이에요" })).toBeDisabled();
  });

  it("삭제 오류를 경고로 보여 주면서 학생 이메일은 표시하지 않는다", () => {
    renderRequests({ deleteError: "기록을 삭제하지 못했어요." });

    expect(screen.getByRole("alert")).toHaveTextContent("기록을 삭제하지 못했어요.");
    expect(screen.getByText("학생")).toBeInTheDocument();
    expect(screen.queryByText("student@example.test")).not.toBeInTheDocument();
  });

  it("학생 이름과 핵심 상담 정보를 또렷한 영역으로 구분한다", () => {
    renderRequests();

    expect(screen.getByRole("heading", { name: /학생 10312/ })).toHaveClass("student-name");
    expect(screen.getByText("진로 상담")).toHaveClass("request-value");
    expect(screen.getByText(/8월 3일.*10:10/)).toHaveClass("request-value");
  });
});
