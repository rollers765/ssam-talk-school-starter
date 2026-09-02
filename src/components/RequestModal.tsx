import { BookOpen, BriefcaseBusiness, Check, ChevronRight, CircleHelp, GraduationCap, MessagesSquare, UsersRound, X } from "lucide-react";
import { formatKoreanDate } from "../lib/schedule";
import { schoolConfig } from "../lib/schoolConfig";
import type { RequestKind, TimeSlot } from "../types";

const topicStyles = [
  { label: "진로에 대해", icon: GraduationCap, color: "mint" },
  { label: "친구에 대해", icon: UsersRound, color: "blue" },
  { label: "성적에 대해", icon: BookOpen, color: "yellow" },
  { label: "취업에 대해", icon: BriefcaseBusiness, color: "purple" },
  { label: "여러 가지 이야기", icon: MessagesSquare, color: "coral" },
  { label: "모르겠어요", icon: CircleHelp, color: "gray" },
];
const topics = schoolConfig.consultation.topics.map((label, i) => ({ ...topicStyles[i % topicStyles.length], label }));

export interface RequestDraft {
  slot?: TimeSlot;
  kind: RequestKind;
  topic?: string;
  companionName?: string;
}

interface RequestModalProps {
  draft: RequestDraft;
  submitting: boolean;
  error: string;
  onDraftChange: (draft: RequestDraft) => void;
  onClose: () => void;
  onSubmit: (draft: RequestDraft) => void;
}

export function RequestModal({ draft, submitting, error, onDraftChange, onClose, onSubmit }: RequestModalProps) {
  const title = draft.kind === "meal" ? "밥 사주세요!" : draft.kind === "friend" ? "친구와 함께 이야기해요" : `${formatKoreanDate(draft.slot!.date)} ${draft.slot!.start}`;
  const cannotSubmit = !draft.topic || (draft.kind === "friend" && !draft.companionName?.trim()) || submitting;
  const closeModal = () => { if (!submitting) onClose(); };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
    <section className="modal">
      <button type="button" className="modal-close" disabled={submitting} onClick={closeModal} aria-label="닫기"><X /></button>
      <p className="eyebrow">거의 다 됐어요</p>
      <h2>{title}</h2>
      {draft.kind === "friend" && <label className="modal-label">함께 올 친구 이름<input value={draft.companionName || ""} onChange={(event) => onDraftChange({ ...draft, companionName: event.target.value })} placeholder="친구 이름을 적어주세요" maxLength={20} /></label>}
      <p className="question">어떤 이야기를 나누고 싶나요?</p>
      <div className="topic-grid" data-tour="student-topic">
        {topics.map((topic) => <button key={topic.label} type="button" className={`topic-card ${topic.color} ${draft.topic === topic.label ? "selected" : ""}`} aria-pressed={draft.topic === topic.label} onClick={() => onDraftChange({ ...draft, topic: topic.label })}>
          <topic.icon /><span>{topic.label}</span>{draft.topic === topic.label && <Check />}
        </button>)}
      </div>
      <button type="button" className="primary-button" disabled={cannotSubmit} onClick={() => onSubmit(draft)}>{submitting ? "보내는 중이에요…" : "선생님께 요청 보내기"} <ChevronRight /></button>
      {error && <p className="privacy-note" role="alert">{error}</p>}
      <p className="privacy-note">상담 주제는 선생님만 볼 수 있어요</p>
    </section>
  </div>;
}
