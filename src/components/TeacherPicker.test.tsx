// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeacherPicker } from "./TeacherPicker";

describe("TeacherPicker", () => {
  it("승인된 선생님 이름을 보여주고 선택한 UID를 전달한다", () => {
    const onSelect = vi.fn();
    render(<TeacherPicker teachers={[{ id: "t1", name: "김선생님", status: "approved" }]} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /김선생님/ }));
    expect(onSelect).toHaveBeenCalledWith("t1");
  });
});
