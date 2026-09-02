// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentPinReset } from "./StudentPinReset";

describe("StudentPinReset", () => {
  it("정확한 이름과 5자리 학번을 입력해 초기화를 요청한다", async () => {
    const onReset = vi.fn().mockResolvedValue(undefined);
    render(<StudentPinReset onReset={onReset} />);

    expect(screen.getByText("학생 목록은 표시하지 않아요.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("학생 이름"), { target: { value: "김하늘" } });
    fireEvent.change(screen.getByLabelText("학생 학번"), { target: { value: "10312" } });
    fireEvent.click(screen.getByRole("button", { name: "본인 확인 후 PIN 초기화" }));

    await waitFor(() => expect(onReset).toHaveBeenCalledWith("김하늘", "10312"));
    expect(await screen.findByText("PIN을 초기화했어요.")).toBeInTheDocument();
  });
});
