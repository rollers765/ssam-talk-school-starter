// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SchoolBrand } from "./SchoolBrand";

afterEach(cleanup);

describe("SchoolBrand", () => {
  it("교표는 작은 학교 명찰로 보여주고 쌤톡을 중심 이름으로 둔다", () => {
    render(<SchoolBrand />);

    expect(screen.getByRole("img", { name: "우리 고등학교 교표" })).toHaveAttribute("src", "/school-logo.svg");
    expect(screen.getByText("우리 고등학교")).toBeInTheDocument();
    expect(screen.getByText("쌤톡")).toBeInTheDocument();
  });
});
