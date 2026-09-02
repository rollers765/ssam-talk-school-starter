// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeacherApproval } from "./TeacherApproval";

describe("TeacherApproval", () => {
  it("관리자에게 승인에 필요한 이름과 소속 부서를 보여준다", () => {
    const onApprove = vi.fn();
    render(<TeacherApproval applications={[{ id: "t1", name: "박교사", department: "진로교육부", status: "pending" }]} onApprove={onApprove} />);

    expect(screen.getByText("박교사")).toBeInTheDocument();
    expect(screen.getByText("진로교육부")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "승인하기" }));
    expect(onApprove).toHaveBeenCalledWith("t1", "박교사", "진로교육부");
  });
});
