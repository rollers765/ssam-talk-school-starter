import { Bell, Clock3, MessageCircleHeart } from "lucide-react";
import { useState } from "react";
import { formatKoreanDate, getStatusLabel } from "../lib/schedule";
import type { ConsultationRequest } from "../types";

export interface RequestListProps {
  requests: ConsultationRequest[];
  deletingId: string;
  deleteError: string;
  onCancel: (item: ConsultationRequest) => void;
  onAnswer: (item: ConsultationRequest, accept: boolean) => void;
  onDelete: (item: ConsultationRequest) => void;
}

function createdMillis(value: ConsultationRequest["createdAt"]) {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

export function RequestList({ requests, deletingId, deleteError, onCancel, onAnswer, onDelete }: RequestListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const history = [...requests].sort((a, b) => createdMillis(b.createdAt) - createdMillis(a.createdAt));
  const activeCount = history.filter((item) => item.status === "pending" || item.status === "proposed").length;

  return <section className="request-panel">
    <div className="panel-title"><div><Bell /><h2>나의 상담 이력</h2></div><span>{activeCount}</span></div>
    {deleteError && <p className="delete-error" role="alert">{deleteError}</p>}
    {history.length === 0
      ? <div className="empty-state"><MessageCircleHeart /><b>아직 요청한 상담이 없어요</b><p>편한 시간을 골라 선생님께 이야기해 보세요.</p></div>
      : <div className="request-stack">{history.map((item) => {
        const confirming = confirmingId === item.id;
        const deleting = deletingId === item.id;
        return <article className={`request-card status-${item.status}`} data-testid="request-card" key={item.id}>
          <div className="request-top"><span className="status-pill">{getStatusLabel(item.status)}</span><small>{item.teacherName || "담임 선생님"}</small></div>
          <h3>{item.kind === "meal" ? "밥 사주세요!" : item.date ? formatKoreanDate(item.date, true) : "시간을 정하고 있어요"}</h3>
          <small>{item.topic}</small>
          {item.kind === "friend" && <small>친구와 함께{item.companionName ? ` · ${item.companionName}` : ""}</small>}
          {item.start && <p><Clock3 /> {item.start} 시작</p>}
          {item.status === "proposed" && <div className="proposal"><b>선생님이 제안한 시간</b><p>{item.proposedDate && formatKoreanDate(item.proposedDate)} {item.proposedStart}</p><div><button type="button" onClick={() => onAnswer(item, true)}>좋아요</button><button type="button" className="ghost" onClick={() => onAnswer(item, false)}>다른 시간을 부탁드려요</button></div></div>}
          {["pending", "confirmed", "proposed"].includes(item.status) && <button type="button" className="soft-cancel" onClick={() => onCancel(item)}>바쁜 일정으로 인해 다음에 만나요, 선생님</button>}
          {confirming
            ? <div className="delete-confirmation"><p>삭제하면 다시 볼 수 없어요</p><div><button type="button" className="delete-confirm" disabled={deleting} onClick={() => onDelete(item)}>{deleting ? "삭제 중이에요" : "확정 삭제하기"}</button><button type="button" className="delete-cancel" disabled={deleting} onClick={() => setConfirmingId(null)}>그만둘래요</button></div></div>
            : <button type="button" className="soft-delete" disabled={deleting} onClick={() => setConfirmingId(item.id)}>{deleting ? "삭제 중이에요" : "기록 삭제"}</button>}
        </article>;
      })}</div>}
  </section>;
}
