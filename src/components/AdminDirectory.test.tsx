// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDirectory } from "./AdminDirectory";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminDirectory", () => {
  it("학생을 학번 순으로 보여주고 PIN 초기화와 삭제를 연결한다", () => {
    const onResetStudent = vi.fn();
    const onDeleteStudent = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminDirectory
      students={[
        { id: "s2", name: "두번째", studentNumber: "20202" },
        { id: "s1", name: "첫번째", studentNumber: "10101" },
      ]}
      applications={[]}
      busyId=""
      message=""
      error=""
      onResetStudent={onResetStudent}
      onDeleteStudent={onDeleteStudent}
      onApproveTeacher={vi.fn()}
      onDeleteTeacher={vi.fn()}
    />);

    expect(screen.getAllByTestId("student-number").map((item) => item.textContent)).toEqual(["10101", "20202"]);
    fireEvent.click(screen.getByRole("button", { name: "첫번째 학생 PIN 초기화" }));
    expect(onResetStudent).toHaveBeenCalledWith({ id: "s1", name: "첫번째", studentNumber: "10101" });
    fireEvent.click(screen.getByRole("button", { name: "첫번째 학생 삭제" }));
    expect(onDeleteStudent).toHaveBeenCalledWith({ id: "s1", name: "첫번째", studentNumber: "10101" });
  });

  it("같은 학번은 등록 순서대로 번호를 붙여 보여준다", () => {
    render(<AdminDirectory
      students={[
        { id: "s2", name: "김하늘", studentNumber: "10312", registrationNumber: 2 },
        { id: "s1", name: "김하늘", studentNumber: "10312", registrationNumber: 1 },
      ]}
      applications={[]}
      busyId=""
      message=""
      error=""
      onResetStudent={vi.fn()}
      onDeleteStudent={vi.fn()}
      onApproveTeacher={vi.fn()}
      onDeleteTeacher={vi.fn()}
    />);

    expect(screen.getAllByTestId("registration-number").map((item) => item.textContent)).toEqual(["1번째 등록", "2번째 등록"]);
  });

  it("승인 대기와 승인된 교사를 함께 관리한다", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onApproveTeacher = vi.fn();
    const onDeleteTeacher = vi.fn();
    render(<AdminDirectory
      students={[]}
      applications={[
        { id: "t1", name: "김교사", department: "진로부", status: "pending" },
        { id: "t2", name: "이교사", department: "교무부", status: "approved" },
      ]}
      busyId=""
      message=""
      error=""
      onResetStudent={vi.fn()}
      onDeleteStudent={vi.fn()}
      onApproveTeacher={onApproveTeacher}
      onDeleteTeacher={onDeleteTeacher}
    />);

    fireEvent.click(screen.getByRole("button", { name: "교사 관리 2" }));
    fireEvent.click(screen.getByRole("button", { name: "김교사 교사 승인" }));
    expect(onApproveTeacher).toHaveBeenCalledWith("t1", "김교사", "진로부");
    fireEvent.click(screen.getByRole("button", { name: "이교사 교사 삭제" }));
    expect(onDeleteTeacher).toHaveBeenCalledWith({ id: "t2", name: "이교사", department: "교무부", status: "approved" });
  });
});
