import { describe, expect, it } from "vitest";
import { isStudentNumber, isStudentPin } from "./studentPin";

describe("studentPin validation", () => {
  it("학번은 숫자 5자리만 허용한다", () => {
    expect(isStudentNumber("10312")).toBe(true);
    expect(isStudentNumber("1031")).toBe(false);
    expect(isStudentNumber("10가12")).toBe(false);
  });

  it("PIN은 숫자 6자리만 허용한다", () => {
    expect(isStudentPin("482913")).toBe(true);
    expect(isStudentPin("48291")).toBe(false);
    expect(isStudentPin("48a913")).toBe(false);
  });
});
