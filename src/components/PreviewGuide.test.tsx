// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewGuide } from "./PreviewGuide";

describe("PreviewGuide", () => {
  it("다음 단계로 이동하고 미리보기를 끝낸다", () => {
    const onExit = vi.fn();
    render(<PreviewGuide role="student" onExit={onExit} />);

    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음 설명" }));
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "미리보기 끝내기" }));

    expect(onExit).toHaveBeenCalledOnce();
  });
});
