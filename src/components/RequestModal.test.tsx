// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestModal, type RequestDraft } from "./RequestModal";

const slotDraft: RequestDraft = {
  kind: "normal",
  slot: { id: "slot-1", date: "2026-08-03", start: "10:00", end: "10:10", label: "쉬는 시간", type: "break", enabled: true },
};

function StatefulModal({ onSubmit }: { onSubmit: (draft: RequestDraft) => void }) {
  const [draft, setDraft] = useState(slotDraft);
  return <RequestModal draft={draft} submitting={false} error="" onDraftChange={setDraft} onClose={vi.fn()} onSubmit={onSubmit} />;
}

afterEach(cleanup);

describe("RequestModal", () => {
  it.each(["진로에 대해", "친구에 대해", "성적에 대해", "취업에 대해", "여러 가지 이야기", "모르겠어요"])("%s를 선택해 요청에 담아 보낸다", (topic) => {
    const onSubmit = vi.fn();
    render(<StatefulModal onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: topic }));
    fireEvent.click(screen.getByRole("button", { name: "선생님께 요청 보내기" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ topic }));
  });

  it("전송 중에는 다시 전송할 수 없고 안내 문구를 보여준다", () => {
    render(<RequestModal draft={{ ...slotDraft, topic: "진로에 대해" }} submitting error="" onDraftChange={vi.fn()} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "보내는 중이에요…" })).toBeDisabled();
  });

  it("전송 중에는 닫기와 배경 클릭으로 모달을 닫을 수 없다", () => {
    const onClose = vi.fn();
    const { container } = render(<RequestModal draft={{ ...slotDraft, topic: "진로에 대해" }} submitting error="" onDraftChange={vi.fn()} onClose={onClose} onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    fireEvent.mouseDown(container.querySelector(".modal-backdrop")!);

    expect(screen.getByRole("button", { name: "닫기" })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("전송 오류를 알림으로 보여준다", () => {
    render(<RequestModal draft={slotDraft} submitting={false} error="상담 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요." onDraftChange={vi.fn()} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("상담 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
  });
});
