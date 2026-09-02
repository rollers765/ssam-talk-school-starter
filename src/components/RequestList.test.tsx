// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestList } from "./RequestList";
import type { ConsultationRequest } from "../types";

const pendingRequest: ConsultationRequest = {
  id: "pending-request",
  teacherId: "teacher-1",
  teacherName: "김선생님",
  userId: "student-1",
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

function renderList(overrides: Partial<ComponentProps<typeof RequestList>> = {}) {
  const handlers = {
    onCancel: vi.fn(),
    onAnswer: vi.fn(),
    onDelete: vi.fn(),
  };
  return {
    handlers,
    ...render(<RequestList requests={[pendingRequest]} deletingId="" deleteError="" {...handlers} {...overrides} />),
  };
}

afterEach(cleanup);

describe("RequestList", () => {
  it("취소한 상담도 이력에 보여준다", () => {
    const cancelledRequest = { ...pendingRequest, id: "cancelled-request", status: "cancelled" as const };

    renderList({ requests: [cancelledRequest] });

    expect(screen.getByText("요청 취소")).toBeInTheDocument();
  });

  it("최근에 만든 상담부터 보여준다", () => {
    const olderRequest = { ...pendingRequest, id: "older-request", topic: "먼저 만든 상담", createdAt: new Date("2026-08-01T08:00:00") };
    const newerRequest = { ...pendingRequest, id: "newer-request", topic: "나중에 만든 상담", createdAt: new Date("2026-08-01T10:00:00") };

    renderList({ requests: [olderRequest, newerRequest] });

    const cards = screen.getAllByTestId("request-card");
    expect(cards[0]).toHaveTextContent("나중에 만든 상담");
    expect(cards[1]).toHaveTextContent("먼저 만든 상담");
  });

  it("기록 삭제를 누르면 확인 안내를 보여주고 취소하면 삭제하지 않는다", () => {
    const { handlers } = renderList();

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));
    expect(screen.getByText("삭제하면 다시 볼 수 없어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "그만둘래요" }));

    expect(handlers.onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("삭제하면 다시 볼 수 없어요")).not.toBeInTheDocument();
  });

  it("확정 삭제를 눌렀을 때만 요청을 삭제한다", () => {
    const { handlers } = renderList();

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));
    fireEvent.click(screen.getByRole("button", { name: "확정 삭제하기" }));

    expect(handlers.onDelete).toHaveBeenCalledWith(pendingRequest);
  });

  it("삭제 중인 요청은 중복 삭제를 막고 한국어 안내를 보여준다", () => {
    renderList({ deletingId: pendingRequest.id });

    expect(screen.getByRole("button", { name: "삭제 중이에요" })).toBeDisabled();
  });

  it("삭제 실패 오류를 경고로 보여주고 카드는 유지한다", () => {
    renderList({ deletingId: pendingRequest.id, deleteError: "기록을 삭제하지 못했어요." });

    expect(screen.getByRole("alert")).toHaveTextContent("기록을 삭제하지 못했어요.");
    expect(screen.getByTestId("request-card")).toBeInTheDocument();
  });

  it("기존 취소와 시간 제안 응답을 그대로 실행한다", () => {
    const proposedRequest = { ...pendingRequest, id: "proposed-request", status: "proposed" as const, proposedDate: "2026-08-04", proposedStart: "11:10" };
    const { handlers } = renderList({ requests: [pendingRequest, proposedRequest] });

    fireEvent.click(screen.getAllByRole("button", { name: "바쁜 일정으로 인해 다음에 만나요, 선생님" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다른 시간을 부탁드려요" }));

    expect(handlers.onCancel).toHaveBeenCalledWith(pendingRequest);
    expect(handlers.onAnswer).toHaveBeenNthCalledWith(1, proposedRequest, true);
    expect(handlers.onAnswer).toHaveBeenNthCalledWith(2, proposedRequest, false);
  });

  it("shows the consultation topic for a friend request", () => {
    const friendRequest = {
      ...pendingRequest,
      id: "friend-request",
      kind: "friend" as const,
      topic: "Friend request topic",
      companionName: "Companion",
    };

    renderList({ requests: [friendRequest] });

    expect(screen.getByTestId("request-card")).toHaveTextContent("Friend request topic");
  });
});
