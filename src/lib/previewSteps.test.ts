import { describe, expect, it } from "vitest";
import { previewSteps } from "./previewSteps";

describe("previewSteps", () => {
  it("학생과 교사 안내를 각각 네 단계 제공한다", () => {
    expect(previewSteps.student).toHaveLength(4);
    expect(previewSteps.teacher).toHaveLength(4);
    expect(previewSteps.student.map((step) => step.target)).toEqual([
      "student-date",
      "student-time",
      "student-topic",
      "student-status",
    ]);
    expect(previewSteps.teacher.map((step) => step.target)).toEqual([
      "teacher-requests",
      "teacher-actions",
      "teacher-defer",
      "teacher-availability",
    ]);
  });
});
