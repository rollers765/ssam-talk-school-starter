// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeacherPinAuth } from "./TeacherPinAuth";

afterEach(cleanup);

describe("TeacherPinAuth", () => {
  it("이름과 PIN으로 교사 로그인을 요청한다", async () => {
    const onAuthenticate = vi.fn().mockResolvedValue(undefined);
    render(<TeacherPinAuth onAuthenticate={onAuthenticate} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("교사 이름"), { target: { value: "박교사" } });
    fireEvent.change(screen.getByLabelText("교사 6자리 PIN"), { target: { value: "482913" } });
    fireEvent.click(screen.getByRole("button", { name: "교사 로그인" }));
    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledWith({ action: "login", name: "박교사", pin: "482913" }));
  });

  it("처음 신청할 때 소속 부서와 같은 PIN 두 번을 요구한다", async () => {
    const onAuthenticate = vi.fn().mockResolvedValue(undefined);
    render(<TeacherPinAuth onAuthenticate={onAuthenticate} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "처음 등록해요" }));
    fireEvent.change(screen.getByLabelText("교사 이름"), { target: { value: "박교사" } });
    fireEvent.change(screen.getByLabelText("소속 부서"), { target: { value: "진로교육부" } });
    fireEvent.change(screen.getByLabelText("교사 6자리 PIN"), { target: { value: "482913" } });
    fireEvent.change(screen.getByLabelText("교사 PIN 다시 입력"), { target: { value: "482913" } });
    fireEvent.click(screen.getByRole("button", { name: "등록 신청하기" }));
    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledWith({ action: "register", name: "박교사", department: "진로교육부", pin: "482913" }));
  });
});
