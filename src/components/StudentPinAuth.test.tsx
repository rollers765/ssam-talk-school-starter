// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentPinAuth } from "./StudentPinAuth";

afterEach(cleanup);

describe("StudentPinAuth", () => {
  it("학번과 PIN으로 로그인을 요청한다", async () => {
    const onAuthenticate = vi.fn().mockResolvedValue(undefined);
    render(<StudentPinAuth onAuthenticate={onAuthenticate} onBack={vi.fn()} />);

    expect(screen.getByText(/PIN을 잊었다면/)).toHaveTextContent("‘처음 이용해요’에서 다시 등록해 주세요");

    fireEvent.change(screen.getByLabelText("학번"), { target: { value: "10312" } });
    fireEvent.change(screen.getByLabelText("6자리 PIN"), { target: { value: "482913" } });
    fireEvent.click(screen.getByRole("button", { name: "학생 로그인" }));

    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledWith({ action: "login", studentNumber: "10312", pin: "482913" }));
  });

  it("처음 등록할 때 이름과 같은 PIN 두 번을 요구한다", async () => {
    const onAuthenticate = vi.fn().mockResolvedValue(undefined);
    render(<StudentPinAuth onAuthenticate={onAuthenticate} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "처음 이용해요" }));

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "김하늘" } });
    fireEvent.change(screen.getByLabelText("학번"), { target: { value: "10312" } });
    fireEvent.change(screen.getByLabelText("6자리 PIN"), { target: { value: "482913" } });
    fireEvent.change(screen.getByLabelText("PIN 다시 입력"), { target: { value: "482914" } });
    expect(screen.getByRole("button", { name: "PIN 등록하고 시작하기" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("PIN 다시 입력"), { target: { value: "482913" } });
    fireEvent.click(screen.getByRole("button", { name: "PIN 등록하고 시작하기" }));
    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledWith({ action: "register", name: "김하늘", studentNumber: "10312", pin: "482913" }));
  });
});
