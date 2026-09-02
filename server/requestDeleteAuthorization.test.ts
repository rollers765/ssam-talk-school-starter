import { describe, expect, it } from "vitest";
import {
  canDeleteBoundSlotLock,
  canDeleteRequest,
  isDeleteRequestBody,
  isValidRequestId,
  parseBearerToken,
} from "./requestDeleteAuthorization";

const ownRequest = { userId: "student-1", teacherId: "teacher-1" };
const otherStudentRequest = { userId: "student-2", teacherId: "teacher-1" };
const assignedRequest = { userId: "student-1", teacherId: "teacher-1" };
const otherTeacherRequest = { userId: "student-1", teacherId: "teacher-2" };

describe("상담 기록 삭제 권한", () => {
  it("활성 세션의 학생은 자신의 상담 기록만 삭제할 수 있다", () => {
    expect(canDeleteRequest({
      actor: { uid: "student-1", role: "student", sessionVersion: 3 },
      request: ownRequest,
      teacherApproved: false,
      sessionActive: true,
    })).toBe(true);
  });

  it("학생은 다른 학생의 상담 기록을 삭제할 수 없다", () => {
    expect(canDeleteRequest({
      actor: { uid: "student-1", role: "student", sessionVersion: 3 },
      request: otherStudentRequest,
      teacherApproved: false,
      sessionActive: true,
    })).toBe(false);
  });

  it("만료되었거나 비활성인 학생 세션은 자신의 기록도 삭제할 수 없다", () => {
    expect(canDeleteRequest({
      actor: { uid: "student-1", role: "student", sessionVersion: 2 },
      request: ownRequest,
      teacherApproved: false,
      sessionActive: false,
    })).toBe(false);
  });

  it("승인된 PIN 교사는 배정된 상담 기록을 삭제할 수 있다", () => {
    expect(canDeleteRequest({
      actor: { uid: "teacher-1", role: "teacher" },
      request: assignedRequest,
      teacherApproved: true,
      sessionActive: false,
    })).toBe(true);
  });

  it("관리자 계정은 본인에게 배정된 상담 기록을 삭제할 수 있다", () => {
    expect(canDeleteRequest({
      actor: { uid: "admin-1", email: "admin@example.com" },
      request: { userId: "student-1", teacherId: "admin-1" },
      teacherApproved: true,
      sessionActive: false,
      adminAuthorized: true,
    })).toBe(true);
  });

  it("교사는 다른 교사에게 배정된 상담 기록을 삭제할 수 없다", () => {
    expect(canDeleteRequest({
      actor: { uid: "teacher-1", role: "teacher" },
      request: otherTeacherRequest,
      teacherApproved: true,
      sessionActive: false,
    })).toBe(false);
  });

  it("승인되지 않은 교사는 배정된 상담 기록도 삭제할 수 없다", () => {
    expect(canDeleteRequest({
      actor: { uid: "teacher-1", role: "teacher" },
      request: assignedRequest,
      teacherApproved: false,
      sessionActive: false,
    })).toBe(false);
  });

  it("교사 역할이 아니면 배정된 상담 기록도 삭제할 수 없다", () => {
    expect(canDeleteRequest({
      actor: { uid: "teacher-1" },
      request: assignedRequest,
      teacherApproved: true,
      sessionActive: false,
    })).toBe(false);
  });

  it("학생 역할이 아닌 승인된 교사만 교사 권한으로 삭제할 수 있다", () => {
    expect(canDeleteRequest({
      actor: { uid: "teacher-1", role: "student", sessionVersion: 3 },
      request: assignedRequest,
      teacherApproved: true,
      sessionActive: false,
    })).toBe(false);
  });
});

describe("상담 기록 ID 검증", () => {
  it.each(["", " ", "request/id", "request\u0000id", "x".repeat(1501)])("잘못된 요청 ID를 거부한다: %j", (requestId) => {
    expect(isValidRequestId(requestId)).toBe(false);
  });

  it("Firestore 문서 ID로 사용할 수 있는 요청 ID를 허용한다", () => {
    expect(isValidRequestId("consultation_2026-08-03:student-1")).toBe(true);
  });
});

describe("삭제 API 입력 검증", () => {
  it.each(["", "Basic token", "Bearer ", "Bearer token extra", ["Bearer token"]])("잘못된 Bearer 형식을 거부한다: %j", (header) => {
    expect(parseBearerToken(header)).toBe("");
  });

  it("정확한 Bearer 토큰만 추출한다", () => {
    expect(parseBearerToken("Bearer valid-token.123")).toBe("valid-token.123");
  });

  it.each([null, [], {}, { requestId: "request-1", extra: true }, { requestId: "request/id" }])("requestId 하나만 있는 본문이 아니면 거부한다: %j", (body) => {
    expect(isDeleteRequestBody(body)).toBe(false);
  });

  it("유효한 requestId 하나만 있는 본문을 허용한다", () => {
    expect(isDeleteRequestBody({ requestId: "request-1" })).toBe(true);
  });
});

describe("slot lock 삭제 결속", () => {
  it("현재 lock이 삭제할 상담 기록에 계속 결속되어 있을 때만 삭제한다", () => {
    expect(canDeleteBoundSlotLock({ requestId: "request-1", slotId: "slot-1", lock: { requestId: "request-1" } })).toBe(true);
  });

  it("트랜잭션 전에 lock이 다른 상담 기록으로 바뀌면 삭제하지 않는다", () => {
    expect(canDeleteBoundSlotLock({ requestId: "request-1", slotId: "slot-1", lock: { requestId: "request-2" } })).toBe(false);
  });
});
