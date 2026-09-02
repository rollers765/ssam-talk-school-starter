import { useState } from "react";
import { schoolConfig } from "../lib/schoolConfig";
import { Check, KeyRound, ShieldCheck } from "lucide-react";
import { isStudentNumber } from "../lib/studentPin";

export function StudentPinReset({ onReset }: { onReset: (name: string, studentNumber: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reset() {
    if (!name.trim() || !isStudentNumber(studentNumber)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await onReset(name.trim(), studentNumber);
      setMessage("PIN을 초기화했어요.");
      setName("");
      setStudentNumber("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "PIN을 초기화하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="teacher-content"><div className="section-heading"><div><span className="step"><KeyRound /></span><h2>학생 PIN 초기화</h2></div><small>학생을 직접 확인한 뒤 사용해 주세요</small></div><div className="manager-card pin-reset-card"><div className="helper"><ShieldCheck /><span><b>학생 목록은 표시하지 않아요.</b><small>학생의 이름과 학번을 직접 확인하고 정확히 입력해야 해요.</small></span></div><label>학생 이름<input aria-label="학생 이름" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="학생 이름" /></label><label>학생 학번 <span>숫자 {schoolConfig.student.numberLength}자리</span><input aria-label="학생 학번" inputMode="numeric" maxLength={schoolConfig.student.numberLength} value={studentNumber} onChange={(e) => setStudentNumber(e.target.value.replace(/\D/g, ""))} placeholder={`예: ${schoolConfig.student.numberExample}`} /></label>{error && <p className="login-notice" role="alert">{error}</p>}{message && <p className="success-note"><Check />{message}<small>학생에게 ‘처음 이용해요’에서 새 PIN을 만들도록 안내해 주세요.</small></p>}<button className="primary-button" disabled={!name.trim() || !isStudentNumber(studentNumber) || busy} onClick={reset}>{busy ? "초기화 중…" : "본인 확인 후 PIN 초기화"}</button></div></section>;
}
