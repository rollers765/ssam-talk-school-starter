import { Check, GraduationCap } from "lucide-react";
import type { TeacherApplication } from "../types";

export function TeacherApproval({ applications, onApprove }: { applications: TeacherApplication[]; onApprove: (id: string, name: string, department?: string) => void | Promise<void> }) {
  const pending = applications.filter((item) => item.status === "pending");
  return <section className="teacher-content approval-panel"><div className="section-heading"><div><span className="step"><GraduationCap /></span><h2>교사 등록 관리</h2></div><small>상담과 일정은 이곳에 보이지 않아요</small></div>{pending.length === 0 ? <div className="large-empty"><Check /><h3>기다리는 신청이 없어요</h3><p>새 교사 신청이 오면 이름과 소속 부서만 표시돼요.</p></div> : <div className="approval-list">{pending.map((item) => <article key={item.id}><span className="avatar large">{item.name[0]}</span><div><b>{item.name}</b><small>{item.department || "기존 등록 교사"}</small></div><button className="approve" onClick={() => onApprove(item.id, item.name, item.department)}><Check />승인하기</button></article>)}</div>}</section>;
}

export function TeacherWaiting({ name, onExit }: { name: string; onExit: () => void }) {
  return <main className="center-screen setup-screen"><section className="form-card waiting-card"><div className="brand-mark small"><GraduationCap /></div><p className="eyebrow">교사 등록 확인 중</p><h1>{name} 선생님,<br />조금만 기다려 주세요</h1><p>관리자가 이름과 소속 부서를 확인하고 있어요. 승인 후 다시 로그인하면 교사 화면이 나타납니다.</p><button className="primary-button" onClick={onExit}>로그아웃</button></section></main>;
}
