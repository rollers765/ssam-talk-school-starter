import { Bell, Check, Clock3, HeartHandshake, Save, X } from "lucide-react";
import { useState } from "react";
import { formatKoreanDate, getStatusLabel, toDateKey } from "../lib/schedule";
import type { ConsultationRequest } from "../types";

type TeacherAction = "confirmed" | "deferred" | "proposed" | "completed";

export interface TeacherRequestsProps {
  requests: ConsultationRequest[];
  deletingId: string;
  deleteError: string;
  onAct: (item: ConsultationRequest, action: TeacherAction, proposal?: { date: string; start: string }) => void;
  onDelete: (item: ConsultationRequest) => void;
}

const statusPriority = { pending: 0, proposed: 1, confirmed: 2, cancelled: 3, deferred: 4, completed: 5 };

export function TeacherRequests({ requests, deletingId, deleteError, onAct, onDelete }: TeacherRequestsProps) {
  const active = [...requests].sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  return <section className="teacher-content" data-tour="teacher-requests">
    <div className="section-heading"><div><span className="step"><Bell /></span><h2>들어온 상담 요청</h2></div><small>새 요청부터 보여드려요</small></div>
    {deleteError && <p className="delete-error" role="alert">{deleteError}</p>}
    {active.length === 0
      ? <div className="large-empty"><Check /><h3>모든 요청을 확인했어요</h3><p>새로운 상담 요청이 오면 이곳에 바로 나타나요.</p></div>
      : <div className="teacher-request-grid">{active.map((item) => <TeacherRequestCard key={item.id} item={item} deleting={deletingId === item.id} onAct={onAct} onDelete={onDelete} />)}</div>}
  </section>;
}

function TeacherRequestCard({ item, deleting, onAct, onDelete }: { item: ConsultationRequest; deleting: boolean; onAct: TeacherRequestsProps["onAct"]; onDelete: TeacherRequestsProps["onDelete"] }) {
  const [proposing, setProposing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [date, setDate] = useState(item.date || toDateKey(new Date()));
  const [start, setStart] = useState(item.start || "12:10");

  return <article className={`teacher-request-card status-${item.status}`}>
    <div className="student-line"><span className="avatar large">{item.studentName[0]}</span><div><h3 className="student-name">{item.studentName} <small>{item.studentNumber}</small></h3></div><span className="status-pill">{getStatusLabel(item.status)}</span></div>
    <div className="request-details"><span><b>상담 주제</b><strong className="request-value">{item.topic}</strong></span><span><b>희망 시간</b><strong className="request-value">{item.kind === "meal" ? "밥 사주세요 · 시간 협의" : `${item.date ? formatKoreanDate(item.date) : ""} ${item.start || ""}`}</strong></span>{item.kind === "friend" && <span><b>함께 오는 친구</b><strong className="request-value">{item.companionName}</strong></span>}</div>
    {item.status === "pending" && !proposing && <div className="teacher-actions" data-tour="teacher-actions"><button type="button" className="approve" onClick={() => onAct(item, "confirmed")}><Check />승인하기</button><button type="button" onClick={() => setProposing(true)}><Clock3 />다른 시간 제안</button><button type="button" className="defer" data-tour="teacher-defer" onClick={() => onAct(item, "deferred")}><HeartHandshake />다음에 일정 잡아 연락할게</button></div>}
    {item.status === "confirmed" && <div className="teacher-actions single"><button type="button" className="approve" onClick={() => onAct(item, "completed")}><Check />상담 완료로 표시</button></div>}
    {proposing && <div className="proposal-form"><label>날짜<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>시작 시간<input type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label><button type="button" onClick={() => { onAct(item, "proposed", { date, start }); setProposing(false); }}><Save />제안 보내기</button><button type="button" className="icon-button" aria-label="시간 제안 닫기" onClick={() => setProposing(false)}><X /></button></div>}
    {confirmingDelete
      ? <div className="delete-confirmation"><p>삭제하면 다시 볼 수 없어요</p><div><button type="button" className="delete-confirm" disabled={deleting} onClick={() => onDelete(item)}>{deleting ? "삭제 중이에요" : "정말 삭제하기"}</button><button type="button" className="delete-cancel" disabled={deleting} onClick={() => setConfirmingDelete(false)}>그만할래요</button></div></div>
      : <button type="button" className="soft-delete" disabled={deleting} onClick={() => setConfirmingDelete(true)}>{deleting ? "삭제 중이에요" : "기록 삭제"}</button>}
  </article>;
}
