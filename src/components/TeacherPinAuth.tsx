import { useState } from "react";
import { ChevronLeft, ChevronRight, GraduationCap, ShieldCheck } from "lucide-react";
import { isTeacherPin, normalizeTeacherName, type TeacherAuthInput } from "../lib/teacherPin";

export function TeacherPinAuth({ onAuthenticate, onBack }: { onAuthenticate: (input: TeacherAuthInput) => Promise<void>; onBack: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [pin, setPin] = useState("");
  const [pinAgain, setPinAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const normalizedName = normalizeTeacherName(name);
  const ready = !!normalizedName && isTeacherPin(pin) && (mode === "login" || (!!department.trim() && pin === pinAgain));

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      await onAuthenticate({ action: mode, name: normalizedName, pin, ...(mode === "register" ? { department: department.trim() } : {}) });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setPin("");
    setPinAgain("");
  }

  return <main className="center-screen setup-screen pin-auth-screen"><section className="form-card pin-auth-card"><button className="back-button" onClick={onBack}><ChevronLeft /> 처음으로 돌아가기</button><div className="brand-mark small"><GraduationCap /></div><p className="eyebrow">교사 이메일은 받지 않아요</p><h1>{mode === "login" ? "교사 PIN 로그인" : "교사 등록 신청"}</h1><p className="setup-help">{mode === "login" ? "이름과 내가 정한 PIN으로 들어가요." : "관리자가 이름과 소속 부서를 확인한 뒤 승인해요."}</p><div className="pin-mode-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>이미 등록했어요</button><button className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>처음 등록해요</button></div><label>이름<input aria-label="교사 이름" autoComplete="name" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요" /></label>{mode === "register" && <label>소속 부서<input aria-label="소속 부서" maxLength={40} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="예: 진로교육부" /></label>}<label>6자리 PIN<input aria-label="교사 6자리 PIN" type="password" inputMode="numeric" maxLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="숫자 6자리" /></label>{mode === "register" && <label>PIN 다시 입력<input aria-label="교사 PIN 다시 입력" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={pinAgain} onChange={(e) => setPinAgain(e.target.value.replace(/\D/g, ""))} placeholder="같은 PIN을 다시 입력해 주세요" /></label>}{error && <p className="login-notice" role="alert">{error}</p>}<button className="primary-button" disabled={!ready || busy} onClick={submit}>{busy ? "확인 중…" : mode === "login" ? "교사 로그인" : "등록 신청하기"}<ChevronRight /></button><p className="pin-privacy"><ShieldCheck /> PIN 원래 번호와 이메일은 저장하지 않아요.</p></section></main>;
}
