import { useState } from "react";
import { schoolConfig } from "../lib/schoolConfig";
import { ChevronLeft, ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { isStudentNumber, isStudentPin, type StudentAuthInput } from "../lib/studentPin";

export function StudentPinAuth({ onAuthenticate, onBack }: { onAuthenticate: (input: StudentAuthInput) => Promise<void>; onBack: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [pin, setPin] = useState("");
  const [pinAgain, setPinAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = isStudentNumber(studentNumber) && isStudentPin(pin) && (mode === "login" || (!!name.trim() && pin === pinAgain));

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      await onAuthenticate({ action: mode, studentNumber, pin, ...(mode === "register" ? { name: name.trim() } : {}) });
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

  return <main className="center-screen setup-screen pin-auth-screen"><section className="form-card pin-auth-card"><button className="back-button" onClick={onBack}><ChevronLeft /> 처음으로 돌아가기</button><div className="brand-mark small"><KeyRound /></div><p className="eyebrow">학생 이메일은 받지 않아요</p><h1>{mode === "login" ? "학생 PIN 로그인" : "나만의 PIN 만들기"}</h1><p className="setup-help">{mode === "login" ? "학번과 내가 정한 PIN으로 들어가요." : "처음 한 번만 이름과 학번을 알려주세요."}</p><div className="pin-mode-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>이미 PIN이 있어요</button><button aria-label="처음 이용해요" className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>처음 이용해요</button></div>{mode === "login" && <p className="pin-recovery-help">PIN을 잊었다면 ‘처음 이용해요’에서 다시 등록해 주세요.</p>}{mode === "register" && <label>이름<input aria-label="이름" value={name} maxLength={20} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요" /></label>}<label>{schoolConfig.student.numberLabel} <span>숫자 {schoolConfig.student.numberLength}자리</span><input aria-label="학번" inputMode="numeric" autoComplete="username" maxLength={schoolConfig.student.numberLength} value={studentNumber} onChange={(e) => setStudentNumber(e.target.value.replace(/\D/g, ""))} placeholder={`예: ${schoolConfig.student.numberExample}`} /></label><label>6자리 PIN <span>다른 사람이 쉽게 맞히지 못할 번호</span><input aria-label="6자리 PIN" type="password" inputMode="numeric" autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="숫자 6자리" /></label>{mode === "register" && <label>PIN 다시 입력<input aria-label="PIN 다시 입력" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pinAgain} onChange={(e) => setPinAgain(e.target.value.replace(/\D/g, ""))} placeholder="같은 PIN을 다시 입력해 주세요" /></label>}{error && <p className="login-notice" role="alert">{error}</p>}<button className="primary-button" disabled={!ready || busy} onClick={submit}>{busy ? "확인 중…" : mode === "login" ? "학생 로그인" : "PIN 등록하고 시작하기"}<ChevronRight /></button><p className="pin-privacy"><ShieldCheck /> PIN 원래 번호는 저장하지 않으며 선생님도 볼 수 없어요.</p></section></main>;
}
