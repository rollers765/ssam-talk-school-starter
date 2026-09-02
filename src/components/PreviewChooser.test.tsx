// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewChooser } from "./PreviewChooser";

describe("PreviewChooser", () => {
  it("학생용과 교사용 미리보기를 보여주고 선택을 전달한다", () => {
    const onSelect = vi.fn();
    render(<PreviewChooser onSelect={onSelect} />);

    expect(screen.getByText("로그인 전에 둘러보기")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "학생용 미리보기" }));
    fireEvent.click(screen.getByRole("button", { name: "교사용 미리보기" }));

    expect(onSelect).toHaveBeenNthCalledWith(1, "student");
    expect(onSelect).toHaveBeenNthCalledWith(2, "teacher");
  });
});
