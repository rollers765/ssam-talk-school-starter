import { useState } from "react";
import { Check, GraduationCap, KeyRound, Trash2, UsersRound } from "lucide-react";
import type { AdminStudent, TeacherApplication } from "../types";

type Props = {
  students: AdminStudent[];
  applications: TeacherApplication[];
  busyId: string;
  message: string;
  error: string;
  onResetStudent: (student: AdminStudent) => void | Promise<void>;
  onDeleteStudent: (student: AdminStudent) => void | Promise<void>;
  onApproveTeacher: (id: string, name: string, department?: string) => void | Promise<void>;
  onDeleteTeacher: (teacher: TeacherApplication) => void | Promise<void>;
};

export function AdminDirectory({ students, applications, busyId, message, error, onResetStudent, onDeleteStudent, onApproveTeacher, onDeleteTeacher }: Props) {
  const [section, setSection] = useState<"students" | "teachers">("students");
  const sortedStudents = [...students].sort((a, b) => a.studentNumber.localeCompare(b.studentNumber, "ko", { numeric: true }) || Number(a.registrationNumber || 1) - Number(b.registrationNumber || 1));
  const sortedTeachers = [...applications].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name, "ko") : a.status === "pending" ? -1 : 1));

  return <section className="teacher-content admin-directory"><div className="section-heading"><div><span className="step"><UsersRound /></span><h2>관리자 등록 관리</h2></div><small>PIN과 상담 내용은 표시하지 않아요</small></div><div className="pin-mode-tabs admin-tabs"><button className={section === "students" ? "active" : ""} onClick={() => setSection("students")}>학생 관리 {students.length}</button><button className={section === "teachers" ? "active" : ""} onClick={() => setSection("teachers")}>교사 관리 {applications.length}</button></div>{message && <p className="success-note"><Check />{message}</p>}{error && <p className="login-notice" role="alert">{error}</p>}{section === "students" ? <div className="manager-card directory-card"><div className="directory-heading"><h3><UsersRound /> 등록 학생</h3><small>학번 순서 · 같은 학번은 등록 순서</small></div>{sortedStudents.length === 0 ? <p className="directory-empty">등록된 학생이 없어요.</p> : <div className="directory-list">{sortedStudents.map((student) => <article key={student.id}><span className="avatar">{student.name[0]}</span><div className="directory-info"><b>{student.name}</b><small data-testid="student-number">{student.studentNumber}</small><small className="registration-number" data-testid="registration-number">{Number(student.registrationNumber || 1)}번째 등록</small></div><div className="directory-actions"><button aria-label={`${student.name} 학생 PIN 초기화`} disabled={busyId === student.id} onClick={() => onResetStudent(student)}><KeyRound />PIN 초기화</button><button className="danger" aria-label={`${student.name} 학생 삭제`} disabled={busyId === student.id} onClick={() => window.confirm(`${student.name} 학생의 ${Number(student.registrationNumber || 1)}번째 등록과 상담 기록을 모두 삭제할까요?`) && onDeleteStudent(student)}><Trash2 />삭제</button></div></article>)}</div>}</div> : <div className="manager-card directory-card"><div className="directory-heading"><h3><GraduationCap /> 등록 교사</h3><small>승인 대기 교사가 먼저 보여요</small></div>{sortedTeachers.length === 0 ? <p className="directory-empty">등록된 교사가 없어요.</p> : <div className="directory-list">{sortedTeachers.map((teacher) => <article key={teacher.id}><span className="avatar">{teacher.name[0]}</span><div className="directory-info"><b>{teacher.name}</b><small>{teacher.department || "소속 부서 미입력"} · {teacher.status === "pending" ? "승인 대기" : "승인 완료"}</small></div><div className="directory-actions">{teacher.status === "pending" && <button className="approve" aria-label={`${teacher.name} 교사 승인`} disabled={busyId === teacher.id} onClick={() => onApproveTeacher(teacher.id, teacher.name, teacher.department)}><Check />승인</button>}<button className="danger" aria-label={`${teacher.name} 교사 삭제`} disabled={busyId === teacher.id} onClick={() => window.confirm(`${teacher.name} 선생님의 등록을 삭제할까요?`) && onDeleteTeacher(teacher)}><Trash2 />삭제</button></div></article>)}</div>}</div>}</section>;
}
