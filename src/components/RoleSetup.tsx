import { useState } from "react";
import { isStudentNumber, schoolConfig } from "../lib/schoolConfig";
import { ChevronLeft, ChevronRight, GraduationCap, UserRoundCheck } from "lucide-react";

type RoleSetupProps = {
  teacherOnly?: boolean;
  initialName: string;
  onStudentSaved: (name: string, studentNumber: string) => void | Promise<void>;
  onTeacherApplied: (name: string) => void | Promise<void>;
};

export function RoleSetup({ teacherOnly = false, initialName, onStudentSaved, onTeacherApplied }: RoleSetupProps) {
  const [role, setRole] = useState<"student" | "teacher" | null>(teacherOnly ? "teacher" : null);
  const [name, setName] = useState(initialName);
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || (role === "student" && !isStudentNumber(number))) return;
    setSaving(true);
    try {
      if (role === "student") await onStudentSaved(name.trim(), number);
      if (role === "teacher") await onTeacherApplied(name.trim());
    } finally {
      setSaving(false);
    }
  }

  if (!role) {
    return <main className="center-screen setup-screen"><section className="form-card role-card"><div className="brand-mark small"><UserRoundCheck /></div><p className="eyebrow">처음 한 번만 선택해 주세요</p><h1>어떻게 쌤톡을 사용할까요?</h1><p className="setup-help">학생과 선생님이 같은 학교 계정을 사용하므로 역할을 먼저 확인해요.</p><div className="role-choice"><button aria-label="학생으로 사용하기" onClick={() => setRole("student")}><UserRoundCheck /><span><b>학생으로 사용하기</b><small>선생님을 골라 상담을 요청해요</small></span><ChevronRight /></button><button aria-label="선생님으로 사용하기" onClick={() => setRole("teacher")}><GraduationCap /><span><b>선생님으로 사용하기</b><small>관리자 승인 후 상담을 관리해요</small></span><ChevronRight /></button></div></section></main>;
  }

  return <main className="center-screen setup-screen"><section className="form-card">{!teacherOnly && <button className="back-button" onClick={() => setRole(null)}><ChevronLeft /> 역할 다시 선택</button>}<div className="brand-mark small">{role === "student" ? <UserRoundCheck /> : <GraduationCap />}</div><p className="eyebrow">처음 한 번만 알려주세요</p><h1>{role === "student" ? "누가 상담을 요청하나요?" : "선생님 등록을 신청해요"}</h1><label>이름<input aria-label="이름" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요" /></label>{role === "student" && <label>{schoolConfig.student.numberLabel} <span>숫자 {schoolConfig.student.numberLength}자리</span><input aria-label={`${schoolConfig.student.numberLabel} 숫자 ${schoolConfig.student.numberLength}자리`} inputMode="numeric" maxLength={schoolConfig.student.numberLength} value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} placeholder={`예: ${schoolConfig.student.numberExample}`} /></label>}<button className="primary-button" disabled={!name.trim() || (role === "student" && !isStudentNumber(number)) || saving} onClick={submit}>{saving ? "저장 중…" : role === "student" ? "쌤톡 시작하기" : "교사 등록 신청하기"}<ChevronRight /></button>{role === "teacher" && <p className="privacy-note">관리자가 학교 계정과 이름을 확인한 뒤 승인해요.</p>}</section></main>;
}
