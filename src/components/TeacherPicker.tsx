import { ChevronRight, GraduationCap, MessageCircleHeart } from "lucide-react";
import type { PublicTeacher } from "../types";

export function TeacherPicker({ teachers, onSelect }: { teachers: PublicTeacher[]; onSelect: (teacherId: string) => void }) {
  return <main className="dashboard teacher-picker"><section className="picker-hero"><div className="brand-mark"><MessageCircleHeart /></div><p className="eyebrow">상담할 선생님 선택</p><h1>어떤 선생님과<br /><em>이야기하고 싶나요?</em></h1><p>선생님을 고르면 가능한 날짜와 시간이 보여요.</p></section>{teachers.length === 0 ? <div className="large-empty"><GraduationCap /><h3>등록된 선생님을 기다리고 있어요</h3><p>선생님 등록이 승인되면 이곳에 바로 나타나요.</p></div> : <div className="teacher-choice-grid">{teachers.map((teacher) => <button key={teacher.id} onClick={() => onSelect(teacher.id)}><span className="avatar large">{teacher.name[0]}</span><span><b>{teacher.name}</b><small>상담 가능한 시간 보기</small></span><ChevronRight /></button>)}</div>}</main>;
}
