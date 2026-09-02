import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rules = readFileSync(resolve(process.cwd(), "templates/firestore.rules.template"), "utf8");

describe("Firestore 학생 보안 규칙", () => {
  it("상담 요청의 이름과 학번을 로그인한 학생 프로필과 맞춘다", () => {
    expect(rules).toContain("request.resource.data.studentName == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.name");
    expect(rules).toContain("request.resource.data.studentNumber == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.studentNumber");
  });

  it("학생이 만든 시간 잠금은 상담 요청의 시간 잠금 문서 하나와 연결한다", () => {
    expect(rules).toContain("allow read: if activeStudent()");
    expect(rules).toContain("getAfter(/databases/$(database)/documents/requests/$(request.resource.data.requestId)).data.slotId == slotId");
    expect(rules).toContain("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])");
  });
});

describe("Firestore consultation deletion rules", () => {
  it("denies direct client deletion of consultation requests", () => {
    expect(rules).toContain("match /requests/{requestId}");
    expect(rules).toContain("allow delete: if false;");
  });

  it("allows a client to delete a slot lock only after its request releases that slot", () => {
    expect(rules).toContain("function requestReleasesSlotLock(slotId, data)");
    expect(rules).toContain("getAfter(/databases/$(database)/documents/requests/$(data.requestId)).data.slotId != slotId");
    expect(rules).toContain("requestReleasesSlotLock(slotId, resource.data)");
  });
});

describe("Firestore 교사 PIN 권한", () => {
  it("PIN 교사 역할을 교사 계정으로 인정하고 승인 문서를 확인한다", () => {
    expect(rules).toContain("request.auth.token.role == 'teacher'");
    expect(rules).toContain("teacherIsApproved(teacherId)");
  });
});

describe("Firestore 관리자 등록 목록 권한", () => {
  it("관리자는 전체 사용자 목록을 읽을 수 있다", () => {
    expect(rules).toContain("allow read: if admin() || (request.auth.uid == userId");
  });

  it("PIN 자격 증명 컬렉션은 관리자 클라이언트에도 열지 않는다", () => {
    expect(rules).not.toMatch(/match \/(studentCredentials|teacherCredentials)/);
  });
});
