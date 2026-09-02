// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoleSetup } from "./RoleSetup";

afterEach(cleanup);

describe("RoleSetup", () => {
  it("Google 로그인 후에는 선생님 등록 화면만 보여준다", () => {
    render(<RoleSetup teacherOnly initialName="박교사" onStudentSaved={vi.fn()} onTeacherApplied={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "선생님 등록을 신청해요" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "학생으로 사용하기" })).not.toBeInTheDocument();
  });

  it("학생은 이름과 5자리 학번을 입력해야 시작할 수 있다", () => {
    const onStudentSaved = vi.fn();
    render(<RoleSetup initialName="" onStudentSaved={onStudentSaved} onTeacherApplied={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "학생으로 사용하기" }));
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "김하늘" } });
    fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "1234" } });
    expect(screen.getByRole("button", { name: "쌤톡 시작하기" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "10312" } });
    fireEvent.click(screen.getByRole("button", { name: "쌤톡 시작하기" }));
    expect(onStudentSaved).toHaveBeenCalledWith("김하늘", "10312");
  });

  it("선생님은 이름으로 등록 신청을 보낸다", () => {
    const onTeacherApplied = vi.fn();
    render(<RoleSetup initialName="박교사" onStudentSaved={vi.fn()} onTeacherApplied={onTeacherApplied} />);

    fireEvent.click(screen.getByRole("button", { name: "선생님으로 사용하기" }));
    fireEvent.click(screen.getByRole("button", { name: "교사 등록 신청하기" }));
    expect(onTeacherApplied).toHaveBeenCalledWith("박교사");
  });
});
