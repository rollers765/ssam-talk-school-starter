import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithCustomToken, signInWithPopup, signOut, type User } from "firebase/auth";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  HeartHandshake,
  KeyRound,
  LogOut,
  MessageCircleHeart,
  MessagesSquare,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { PreviewChooser } from "./components/PreviewChooser";
import { PreviewGuide } from "./components/PreviewGuide";
import { AdminDirectory } from "./components/AdminDirectory";
import { RequestList } from "./components/RequestList";
import { RequestModal, type RequestDraft } from "./components/RequestModal";
import { RoleSetup } from "./components/RoleSetup";
import { StudentPinAuth } from "./components/StudentPinAuth";
import { SchoolBrand } from "./components/SchoolBrand";
import { TeacherPinAuth } from "./components/TeacherPinAuth";
import { StudentPinReset } from "./components/StudentPinReset";
import { TeacherWaiting } from "./components/TeacherApproval";
import { TeacherPicker } from "./components/TeacherPicker";
import { TeacherRequests } from "./components/TeacherRequests";
import { TodayConsultations } from "./components/TodayConsultations";
import { auth, db, googleProvider, isFirebaseReady } from "./lib/firebase";
import { consultationErrorMessage } from "./lib/consultationErrors";
import { buildSlots, buildTeacherAvailabilitySlots, formatKoreanDate, getFourWeekDays, isPastSlot, toDateKey } from "./lib/schedule";
import { isAdminEmail, teacherSlotId } from "./lib/teacherScope";
import { SCHOOL_NAME } from "./lib/siteConfig";
import { schoolConfig } from "./lib/schoolConfig";
import { demoRequests } from "./lib/demoRequests";
import type { StudentAuthInput } from "./lib/studentPin";
import type { TeacherAuthInput } from "./lib/teacherPin";
import type { AdminStudent, ConsultationRequest, PublicTeacher, RequestKind, ScheduleItem, TeacherApplication, TimeSlot, UserProfile } from "./types";

const demoStudent: UserProfile = { email: "", name: "가상학생", studentNumber: schoolConfig.student.numberExample, role: "student" };
const demoTeacher: UserProfile = { email: "", name: "선생님", role: "teacher" };

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teacherApplication, setTeacherApplication] = useState<TeacherApplication | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loading, setLoading] = useState(isFirebaseReady);
  const [demoRole, setDemoRole] = useState<"student" | "teacher" | null>(null);
  const [loginNotice, setLoginNotice] = useState("");
  const [showStudentPin, setShowStudentPin] = useState(false);
  const [showTeacherPin, setShowTeacherPin] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;
    return onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setTeacherApplication(null);
        setLoading(false);
        return;
      }
      const tokenResult = await nextUser.getIdTokenResult();
      const isPinStudent = tokenResult.claims.role === "student";
      const isPinTeacher = tokenResult.claims.role === "teacher";
      if (!isPinStudent && !isPinTeacher && !isAdminEmail(nextUser.email)) {
        await signOut(auth!);
        alert("교사는 이름과 PIN으로 로그인해 주세요.");
        setLoading(false);
        return;
      }
      setUser(nextUser);
      const ref = doc(db!, "users", nextUser.uid);
      const saved = await getDoc(ref);
      if (saved.exists()) {
        const nextProfile = saved.data() as UserProfile;
        if (nextProfile.role === "student" && !isPinStudent) {
          await signOut(auth!);
          setLoginNotice("학생은 이메일 대신 학번과 PIN으로 로그인해 주세요.");
          setLoading(false);
          return;
        }
        setProfile(nextProfile);
        if (nextProfile.role === "teacher") {
          setApprovalLoading(true);
          const applicationRef = doc(db!, "teacherApplications", nextUser.uid);
          if (isAdminEmail(nextUser.email)) {
            const approvedApplication = { name: nextProfile.name, email: nextUser.email!, status: "approved", approvedAt: serverTimestamp() };
            await setDoc(applicationRef, approvedApplication, { merge: true });
            await setDoc(doc(db!, "teachers", nextUser.uid), { name: nextProfile.name, status: "approved" }, { merge: true });
            setTeacherApplication({ id: nextUser.uid, name: nextProfile.name, email: nextUser.email!, status: "approved" });
          } else {
            const application = await getDoc(applicationRef);
            if (application.exists()) setTeacherApplication({ id: application.id, ...application.data() } as TeacherApplication);
          }
          setApprovalLoading(false);
        }
      }
      setLoading(false);
    });
  }, []);

  async function adminLogin() {
    if (!auth) return;
    setLoginNotice("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      setLoginNotice("관리자 로그인을 마치지 못했어요. 데스크톱 크롬에서 다시 시도해 주세요.");
    }
  }

  async function studentAuthenticate(input: StudentAuthInput) {
    if (!auth) throw new Error("로그인 연결을 준비하지 못했어요.");
    const response = await fetch("/api/student-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const result = await response.json() as { token?: string; error?: string };
    if (!response.ok || !result.token) throw new Error(result.error || "학생 로그인을 처리하지 못했어요.");
    await signInWithCustomToken(auth, result.token);
    setShowStudentPin(false);
  }

  async function teacherAuthenticate(input: TeacherAuthInput) {
    if (!auth) throw new Error("로그인 연결을 준비하지 못했어요.");
    const response = await fetch("/api/teacher-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const result = await response.json() as { token?: string; error?: string };
    if (!response.ok || !result.token) throw new Error(result.error || "교사 로그인을 처리하지 못했어요.");
    await signInWithCustomToken(auth, result.token);
    setShowTeacherPin(false);
  }

  if (loading) return <LoadingScreen />;
  if (demoRole) return <Dashboard profile={demoRole === "teacher" ? demoTeacher : demoStudent} demo onExit={() => setDemoRole(null)} />;
  if (!user && showStudentPin) return <StudentPinAuth onAuthenticate={studentAuthenticate} onBack={() => setShowStudentPin(false)} />;
  if (!user && showTeacherPin) return <TeacherPinAuth onAuthenticate={teacherAuthenticate} onBack={() => setShowTeacherPin(false)} />;
  if (!user) return <WelcomeScreen onTeacherPin={() => setShowTeacherPin(true)} onAdminLogin={adminLogin} onStudentPin={() => setShowStudentPin(true)} onDemo={setDemoRole} loginNotice={loginNotice} />;
  if (!profile) return <RoleSetup teacherOnly initialName={user.displayName || ""} onStudentSaved={async () => {}} onTeacherApplied={async (name) => {
    if (!db) return;
    const next: UserProfile = { email: user.email!, name, role: "teacher" };
    const application: Omit<TeacherApplication, "id"> = { name, email: user.email!, status: isAdminEmail(user.email) ? "approved" : "pending", createdAt: new Date() };
    await setDoc(doc(db, "users", user.uid), next);
    await setDoc(doc(db, "teacherApplications", user.uid), { ...application, createdAt: serverTimestamp() });
    if (isAdminEmail(user.email)) await setDoc(doc(db, "teachers", user.uid), { name, status: "approved" });
    setProfile(next);
    setTeacherApplication({ id: user.uid, ...application });
  }} />;
  if (profile.role === "teacher" && approvalLoading) return <LoadingScreen />;
  if (profile.role === "teacher" && teacherApplication?.status !== "approved") return <TeacherWaiting name={profile.name} onExit={() => auth && signOut(auth)} />;
  return <Dashboard profile={profile} user={user} onExit={() => auth && signOut(auth)} />;
}

function LoadingScreen() {
  return <main className="center-screen"><div className="brand-mark"><MessageCircleHeart /></div><p>쌤톡을 열고 있어요…</p></main>;
}

function WelcomeScreen({ onTeacherPin, onAdminLogin, onStudentPin, onDemo, loginNotice }: { onTeacherPin: () => void; onAdminLogin: () => void; onStudentPin: () => void; onDemo: (role: "student" | "teacher") => void; loginNotice: string }) {
  return (
    <main className="welcome-shell">
      <section className="welcome-card">
        <SchoolBrand />
        <div className="welcome-art" aria-hidden="true"><div className="bubble one">오늘 어때?</div><div className="bubble two">잠깐 이야기해요</div><div className="face">☺</div></div>
        <p className="eyebrow">선생님과 나를 잇는 작은 약속</p>
        <h1>선생님,<br /><em>상담 요청해요!</em></h1>
        <p className="lead">말 걸기 어려웠던 마음도 괜찮아요.<br />편한 시간을 골라 가볍게 약속해요.</p>
        {isFirebaseReady
          ? <div className="login-choice"><button className="primary-button student-pin-button" onClick={onStudentPin}><KeyRound />학생 PIN으로 시작하기</button><button className="google-button" onClick={onTeacherPin}><KeyRound />선생님 PIN으로 시작하기</button><button className="back-button" onClick={onAdminLogin}>관리자 로그인</button></div>
          : <p className="connection-note">지금은 미리보기만 이용할 수 있어요.</p>}
        {loginNotice && <p className="login-notice" role="alert">{loginNotice}</p>}
        <PreviewChooser onSelect={onDemo} />
        <p className="privacy-note">🔒 다른 학생에게는 내 상담 정보가 보이지 않아요</p>
      </section>
    </main>
  );
}

function Dashboard({ profile, user, demo = false, onExit }: { profile: UserProfile; user?: User; demo?: boolean; onExit: () => void }) {
  return (
    <div className={`app-shell ${demo ? "demo-mode" : ""}`}>
      <Header profile={profile} demo={demo} onExit={onExit} />
      {profile.role === "teacher" ? <TeacherDashboard profile={profile} user={user} demo={demo} isAdmin={!demo && isAdminEmail(user?.email)} /> : <StudentDashboard profile={profile} user={user} demo={demo} />}
      {demo && <PreviewGuide role={profile.role} onExit={onExit} />}
    </div>
  );
}

function Header({ profile, demo, onExit }: { profile: UserProfile; demo: boolean; onExit: () => void }) {
  return <header className="topbar"><div className="logo-row compact"><div className="brand-mark small"><MessageCircleHeart /></div><div><b>{schoolConfig.branding.appName}</b><span>{SCHOOL_NAME}</span></div></div><div className="account"><span className="avatar">{profile.name[0]}</span><div><b>{profile.name}</b><small>{profile.role === "teacher" ? "선생님" : profile.studentNumber}</small></div><button className="icon-button" onClick={onExit} aria-label={demo ? "미리보기 나가기" : "로그아웃"}><LogOut /></button></div></header>;
}

function StudentDashboard({ profile, user, demo }: { profile: UserProfile; user?: User; demo: boolean }) {
  const days = useMemo(() => getFourWeekDays(), []);
  const [teachers, setTeachers] = useState<PublicTeacher[]>(demo ? [{ id: "demo-teacher", name: "선생님", status: "approved" }] : []);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(demo ? "demo-teacher" : null);
  const [selectedDate, setSelectedDate] = useState(toDateKey(days[0]));
  const [requests, setRequests] = useState<ConsultationRequest[]>(demo ? demoRequests(profile) : []);
  const [locks, setLocks] = useState<Record<string, string>>({});
  const [disabled, setDisabled] = useState<Record<string, boolean>>({});
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [draft, setDraft] = useState<RequestDraft | null>(null);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (demo || !db) return;
    return onSnapshot(query(collection(db, "teachers"), where("status", "==", "approved")), (snap) => {
      setTeachers(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as PublicTeacher));
    });
  }, [demo]);

  useEffect(() => {
    if (demo || !db || !user) return;
    const stopRequests = onSnapshot(
      query(collection(db, "requests"), where("userId", "==", user.uid)),
      (snap) => setRequests(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as ConsultationRequest)),
    );
    if (!selectedTeacherId) return stopRequests;
    const stopLocks = onSnapshot(query(collection(db, "slotLocks"), where("teacherId", "==", selectedTeacherId)), (snap) => {
      setLocks(Object.fromEntries(snap.docs.map((item) => [String(item.data().slotId), String(item.data().status || "pending")])));
    });
    const stopOverrides = onSnapshot(query(collection(db, "slotOverrides"), where("teacherId", "==", selectedTeacherId)), (snap) => {
      setDisabled(Object.fromEntries(snap.docs.map((item) => [String(item.data().slotId), item.data().enabled === false])));
    });
    const stopSchedules = onSnapshot(query(collection(db, "publicSchedules"), where("teacherId", "==", selectedTeacherId)), (snap) => {
      setSchedules(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as ScheduleItem));
    });
    const stops = [stopRequests, stopLocks, stopOverrides, stopSchedules];
    return () => stops.forEach((stop) => stop());
  }, [demo, user, selectedTeacherId]);

  const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId);

  const slots = buildSlots(selectedDate).map((slot) => ({ ...slot, enabled: !disabled[slot.id], bookingStatus: locks[slot.id] as ConsultationRequest["status"] }));
  const daySchedules = schedules.filter((item) => item.date === selectedDate || (item.recurring && item.weekday === new Date(`${selectedDate}T00:00:00`).getDay()));

  function beginSpecial(kind: RequestKind) { setSubmitError(""); setDraft({ kind }); }
  function beginSlot(slot: TimeSlot) { setSubmitError(""); setDraft({ kind: "normal", slot }); }

  async function submitRequest(draftToSubmit: RequestDraft) {
    if (!draftToSubmit.topic || !selectedTeacher) return;
    if (draftToSubmit.kind === "friend" && !draftToSubmit.companionName?.trim()) return;
    const request: Omit<ConsultationRequest, "id"> = {
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      userId: user?.uid || "demo-student",
      studentName: profile.name,
      studentNumber: profile.studentNumber!,
      topic: draftToSubmit.topic,
      kind: draftToSubmit.kind,
      companionName: draftToSubmit.companionName?.trim() || "",
      date: draftToSubmit.slot?.date || selectedDate,
      start: draftToSubmit.slot?.start || "",
      end: draftToSubmit.slot?.end || "",
      slotId: draftToSubmit.slot?.id || "",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      setSubmitting(true);
      setSubmitError("");
      if (demo) {
        setRequests((prev) => [{ ...request, id: crypto.randomUUID() }, ...prev]);
        if (draftToSubmit.slot) setLocks((prev) => ({ ...prev, [draftToSubmit.slot!.id]: "pending" }));
      } else if (db) {
        const reqRef = doc(collection(db, "requests"));
        await runTransaction(db, async (tx) => {
          if (draftToSubmit.slot) {
            const lockId = teacherSlotId(selectedTeacher.id, draftToSubmit.slot.id);
            const lockRef = doc(db!, "slotLocks", lockId);
            if ((await tx.get(lockRef)).exists()) throw new Error("이미 다른 학생이 먼저 신청했어요.");
            tx.set(lockRef, { requestId: reqRef.id, teacherId: selectedTeacher.id, slotId: draftToSubmit.slot.id, status: "pending", date: draftToSubmit.slot.date, start: draftToSubmit.slot.start, updatedAt: serverTimestamp() });
            request.slotId = lockId;
          }
          tx.set(reqRef, { ...request, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        });
      }
      setDraft(null);
      setNotice("상담 요청을 보냈어요! 선생님이 확인하면 바로 알려드릴게요.");
      setTimeout(() => setNotice(""), 5000);
    } catch (error) {
      setSubmitError(consultationErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRequest(item: ConsultationRequest) {
    if (demo) setRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: "cancelled" } : r));
    else if (db) {
      await updateDoc(doc(db, "requests", item.id), { status: "cancelled", updatedAt: serverTimestamp(), expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)) });
      if (item.slotId) await deleteDoc(doc(db, "slotLocks", item.slotId));
    }
  }

  async function answerProposal(item: ConsultationRequest, accept: boolean) {
    if (demo) setRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: accept ? "confirmed" : "pending", ...(accept ? { date: r.proposedDate, start: r.proposedStart } : {}) } : r));
    else if (db) {
      await updateDoc(doc(db, "requests", item.id), accept ? { status: "confirmed", date: item.proposedDate, start: item.proposedStart, updatedAt: serverTimestamp() } : { status: "pending", slotId: "", teacherNote: "학생이 다른 시간을 부탁했어요.", updatedAt: serverTimestamp() });
      if (item.slotId) {
        if (accept) await updateDoc(doc(db, "slotLocks", item.slotId), { status: "confirmed", updatedAt: serverTimestamp() });
        else await deleteDoc(doc(db, "slotLocks", item.slotId));
      }
    }
  }

  async function deleteRequest(item: ConsultationRequest) {
    setDeletingId(item.id);
    setDeleteError("");
    try {
      if (demo) {
        setRequests((prev) => prev.filter((request) => request.id !== item.id));
        return;
      }
      await deleteRequestFromServer(user, item.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeletingId("");
    }
  }

  if (!selectedTeacher) return <TeacherPicker teachers={teachers} onSelect={setSelectedTeacherId} />;

  return <main className="dashboard student-dashboard">
    <section className="hero-strip"><div><p className="eyebrow">{selectedTeacher.name} 선생님과 상담해요</p><h1>오늘은 어떤 이야기를<br /><em>나누고 싶나요?</em></h1><p>{profile.name} 학생, 편한 날짜와 시간을 골라주세요.</p><button className="change-teacher" onClick={() => setSelectedTeacherId(null)}>다른 선생님 선택하기</button></div><div className="hero-doodle"><span>마음 편히<br />이야기해요</span><HeartHandshake /></div></section>
    {notice && <div className="toast"><Check />{notice}</div>}
    <section className="content-grid">
      <div className="main-column">
        <div data-tour="student-date">
          <div className="section-heading"><div><span className="step">1</span><h2>날짜를 골라주세요</h2></div><small>오늘부터 {schoolConfig.consultation.weeksAvailable}주까지</small></div>
          <DateRail days={days} selected={selectedDate} onSelect={setSelectedDate} />
          {daySchedules.length > 0 && <div className="schedule-note"><CalendarDays /> <div><b>선생님 일정</b>{daySchedules.map((s) => <span key={s.id}>{s.start}~{s.end} · {s.publicTitle || "선생님 일정 있음"}</span>)}</div></div>}
        </div>
        <div data-tour="student-time">
          <div className="section-heading"><div><span className="step">2</span><h2>시간을 골라주세요</h2></div><small>{formatKoreanDate(selectedDate)}</small></div>
          <SlotGroups slots={slots} onSelect={beginSlot} />
        </div>
        <div className="section-heading"><div><span className="step">+</span><h2>특별한 요청도 괜찮아요</h2></div></div>
        <div className="special-grid"><button className="special-card meal" onClick={() => beginSpecial("meal")}><Coffee /><span><b>밥 사주세요!</b><small>날짜와 시간은 선생님과 정해요</small></span><ChevronRight /></button><button className="special-card friend" onClick={() => beginSpecial("friend")}><UsersRound /><span><b>친구와 함께 대화하고 싶어요</b><small>함께 올 친구 이름을 알려주세요</small></span><ChevronRight /></button></div>
      </div>
      <aside className="side-column" data-tour="student-status"><RequestList requests={requests} deletingId={deletingId} deleteError={deleteError} onCancel={cancelRequest} onAnswer={answerProposal} onDelete={deleteRequest} /></aside>
    </section>
    {draft && <RequestModal draft={draft} submitting={submitting} error={submitError} onDraftChange={setDraft} onClose={() => setDraft(null)} onSubmit={submitRequest} />}
  </main>;
}

function DateRail({ days, selected, onSelect }: { days: Date[]; selected: string; onSelect: (date: string) => void }) {
  const [page, setPage] = useState(0);
  const visible = days.slice(page * 5, page * 5 + 5);
  return <div className="date-rail"><button className="rail-arrow" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></button><div className="date-list">{visible.map((date) => { const key = toDateKey(date); const today = key === toDateKey(new Date()); return <button key={key} className={`date-card ${selected === key ? "selected" : ""}`} onClick={() => onSelect(key)}><small>{today ? "오늘" : new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date)}</small><b>{date.getDate()}</b><span>{date.getMonth() + 1}월</span></button>; })}</div><button className="rail-arrow" disabled={(page + 1) * 5 >= days.length} onClick={() => setPage((p) => p + 1)}><ChevronRight /></button></div>;
}

function SlotGroups({ slots, onSelect }: { slots: TimeSlot[]; onSelect: (slot: TimeSlot) => void }) {
  const groups = [
    { type: "break", title: "쉬는 시간", note: "긴급한 경우에만", icon: Bell },
    { type: "lunch", title: "점심시간", note: "여유 있게", icon: Coffee },
    { type: "after", title: "방과 후", note: "차분하게", icon: Sparkles },
  ];
  return <div className="slot-groups">{groups.map((group) => <div className="slot-group" key={group.type}><div className="slot-title"><group.icon /><span><b>{group.title}</b><small>{group.note}</small></span></div><div className="slot-list">{slots.filter((slot) => slot.type === group.type).map((slot) => { const unavailable = !slot.enabled || !!slot.bookingStatus || isPastSlot(slot.date, slot.start); return <button key={slot.id} disabled={unavailable} className="slot-button" onClick={() => onSelect(slot)}><span>{slot.label}</span><b>{slot.start}</b><small>{slot.bookingStatus ? (slot.bookingStatus === "confirmed" ? "예약됨" : "확인 중") : !slot.enabled ? "선생님 일정" : isPastSlot(slot.date, slot.start) ? "시간 지남" : `${slot.end}까지`}</small></button>; })}</div></div>)}</div>;
}

function TeacherDashboard({ profile, user, demo, isAdmin }: { profile: UserProfile; user?: User; demo: boolean; isAdmin: boolean }) {
  const [tab, setTab] = useState<"requests" | "availability" | "schedule" | "pin-reset" | "admin">("requests");
  const [requests, setRequests] = useState<ConsultationRequest[]>(demo ? demoRequests(demoStudent) : []);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [disabled, setDisabled] = useState<Record<string, boolean>>({});
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [adminBusyId, setAdminBusyId] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (demo || !db || !user) return;
    const stopRequests = onSnapshot(query(collection(db, "requests"), where("teacherId", "==", user.uid)), (snap) => {
      setRequests(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as ConsultationRequest));
    });
    const stopOverrides = onSnapshot(query(collection(db, "slotOverrides"), where("teacherId", "==", user.uid)), (snap) => {
      setDisabled(Object.fromEntries(snap.docs.map((item) => [String(item.data().slotId), item.data().enabled === false])));
    });
    const stopSchedules = onSnapshot(query(collection(db, "schedules"), where("teacherId", "==", user.uid)), (snap) => {
      setSchedules(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as ScheduleItem));
    });
    const stops = [stopRequests, stopOverrides, stopSchedules];
    if (isAdmin) {
      stops.push(onSnapshot(collection(db, "teacherApplications"), (snap) => {
        setApplications(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as TeacherApplication));
      }, () => setAdminError("교사 등록 목록을 불러오지 못했어요.")));
      stops.push(onSnapshot(collection(db, "users"), (snap) => {
        setStudents(snap.docs.flatMap((item) => {
          const data = item.data();
          return data.role === "student" && typeof data.name === "string" && typeof data.studentNumber === "string"
            ? [{ id: item.id, name: data.name, studentNumber: data.studentNumber, registrationNumber: Number(data.registrationNumber || 1), registeredAt: data.registeredAt }]
            : [];
        }));
      }, () => setAdminError("학생 등록 목록을 불러오지 못했어요.")));
    }
    return () => stops.forEach((stop) => stop());
  }, [demo, user, isAdmin]);

  useEffect(() => {
    if (demo || !db) return;
    const cutoff = Date.now();
    requests.filter((r) => r.expiresAt && dateValue(r.expiresAt) < cutoff).forEach((r) => deleteDoc(doc(db!, "requests", r.id)));
  }, [requests, demo]);

  async function act(item: ConsultationRequest, action: "confirmed" | "deferred" | "proposed" | "completed", proposal?: { date: string; start: string }) {
    const shouldExpire = action === "deferred" || action === "completed";
    const next = { ...item, status: action, ...(proposal ? { proposedDate: proposal.date, proposedStart: proposal.start } : {}), updatedAt: new Date(), ...(shouldExpire ? { expiresAt: new Date(Date.now() + 90 * 86400000) } : {}) } as ConsultationRequest;
    if (demo) setRequests((prev) => prev.map((r) => r.id === item.id ? next : r));
    else if (db) {
      if (action === "proposed" && proposal) {
        const rawSlotId = `${proposal.date}_${proposal.start}`;
        const nextSlotId = teacherSlotId(user!.uid, rawSlotId);
        await runTransaction(db, async (tx) => {
          const nextLock = doc(db!, "slotLocks", nextSlotId);
          const current = await tx.get(nextLock);
          if (current.exists() && current.data().requestId !== item.id) throw new Error("그 시간은 이미 다른 상담이 있어요.");
          if (item.slotId && item.slotId !== nextSlotId) tx.delete(doc(db!, "slotLocks", item.slotId));
          tx.set(nextLock, { requestId: item.id, teacherId: user!.uid, slotId: rawSlotId, status: "proposed", date: proposal.date, start: proposal.start, updatedAt: serverTimestamp() });
          tx.update(doc(db!, "requests", item.id), { status: action, proposedDate: proposal.date, proposedStart: proposal.start, slotId: nextSlotId, updatedAt: serverTimestamp() });
        });
      } else {
        await updateDoc(doc(db, "requests", item.id), { status: action, updatedAt: serverTimestamp(), ...(shouldExpire ? { expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)) } : {}) });
        if (item.slotId && action === "confirmed") await updateDoc(doc(db, "slotLocks", item.slotId), { status: "confirmed", updatedAt: serverTimestamp() });
        if (item.slotId && (action === "deferred" || action === "completed")) await deleteDoc(doc(db, "slotLocks", item.slotId));
      }

    }
  }

  async function deleteRequest(item: ConsultationRequest) {
    setDeletingId(item.id);
    setDeleteError("");
    try {
      if (demo) {
        setRequests((prev) => prev.filter((request) => request.id !== item.id));
        return;
      }
      await deleteRequestFromServer(user, item.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeletingId("");
    }
  }

  async function toggleSlot(slot: TimeSlot) {
    const next = !disabled[slot.id];
    setDisabled((prev) => ({ ...prev, [slot.id]: next }));
    if (!demo && db && user) await setDoc(doc(db, "slotOverrides", teacherSlotId(user.uid, slot.id)), { teacherId: user.uid, slotId: slot.id, enabled: !next, date: slot.date, start: slot.start, updatedAt: serverTimestamp() });
  }

  async function addSchedule(item: Omit<ScheduleItem, "id">) {
    if (demo) setSchedules((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
    else if (db && user) {
      const scheduleRef = doc(collection(db, "schedules"));
      const batch = writeBatch(db);
      batch.set(scheduleRef, { ...item, teacherId: user.uid, createdAt: serverTimestamp() });
      batch.set(doc(db, "publicSchedules", scheduleRef.id), { teacherId: user.uid, date: item.date || null, weekday: item.weekday || null, start: item.start, end: item.end, publicTitle: item.publicTitle || "", recurring: item.recurring, createdAt: serverTimestamp() });
      await batch.commit();
    }
  }

  async function removeSchedule(id: string) {
    if (demo) setSchedules((prev) => prev.filter((s) => s.id !== id));
    else if (db) {
      const batch = writeBatch(db);
      batch.delete(doc(db, "schedules", id));
      batch.delete(doc(db, "publicSchedules", id));
      await batch.commit();
    }
  }

  async function approveTeacher(id: string, name: string, department?: string) {
    if (!db || !isAdmin) return;
    setAdminBusyId(id); setAdminError(""); setAdminMessage("");
    try {
      await setDoc(doc(db, "teachers", id), { name, ...(department ? { department } : {}), status: "approved" });
      await updateDoc(doc(db, "teacherApplications", id), { status: "approved", approvedAt: serverTimestamp() });
      setAdminMessage(`${name} 선생님을 승인했어요.`);
    } catch {
      setAdminError("교사 승인을 처리하지 못했어요.");
    } finally { setAdminBusyId(""); }
  }

  async function resetStudentPin(name: string, studentNumber: string, uid?: string) {
    if (!user) throw new Error("선생님 로그인을 확인하지 못했어요.");
    const token = await user.getIdToken();
    const response = await fetch("/api/student-pin-reset", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, studentNumber, ...(uid ? { uid } : {}) }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || "PIN을 초기화하지 못했어요.");
  }

  async function resetStudentFromDirectory(student: AdminStudent) {
    setAdminBusyId(student.id); setAdminError(""); setAdminMessage("");
    try {
      await resetStudentPin(student.name, student.studentNumber, student.id);
      setAdminMessage(`${student.name} 학생의 PIN을 초기화했어요.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "PIN을 초기화하지 못했어요.");
    } finally { setAdminBusyId(""); }
  }

  async function adminDelete(action: "delete-student" | "delete-teacher", target: AdminStudent | TeacherApplication) {
    if (!user) return;
    setAdminBusyId(target.id); setAdminError(""); setAdminMessage("");
    try {
      const token = await user.getIdToken(true);
      const response = await fetch("/api/admin-directory", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, uid: target.id, ...(action === "delete-student" ? { studentNumber: (target as AdminStudent).studentNumber } : {}) }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "등록을 삭제하지 못했어요.");
      setAdminMessage(`${target.name} ${action === "delete-student" ? "학생" : "선생님"}의 등록을 삭제했어요.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "등록을 삭제하지 못했어요.");
    } finally { setAdminBusyId(""); }
  }

  return <main className="dashboard teacher-dashboard"><section className="teacher-hero"><div><p className="eyebrow">좋은 하루예요, {profile.name} 👋</p><h1>학생들의 마음이<br /><em>{requests.filter((r) => r.status === "pending").length}개</em> 도착했어요</h1></div><TodayConsultations requests={requests} today={toDateKey(new Date())} /></section>
    <nav className="teacher-tabs"><button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}><MessagesSquare />상담 요청</button><button data-tour="teacher-availability" className={tab === "availability" ? "active" : ""} onClick={() => setTab("availability")}><Clock3 />상담 가능 시간</button><button className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}><CalendarDays />수업·일정</button><button className={tab === "pin-reset" ? "active" : ""} onClick={() => setTab("pin-reset")}><KeyRound />학생 PIN 초기화</button>{isAdmin && <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}><UserRoundCheck />관리자</button>}</nav>
    {tab === "requests" && <TeacherRequests requests={requests} deletingId={deletingId} deleteError={deleteError} onAct={act} onDelete={deleteRequest} />}
    {tab === "availability" && <AvailabilityManager selectedDate={selectedDate} setSelectedDate={setSelectedDate} disabled={disabled} requests={requests} onToggle={toggleSlot} />}
    {tab === "schedule" && <ScheduleManager schedules={schedules} onAdd={addSchedule} onRemove={removeSchedule} />}
    {tab === "pin-reset" && <StudentPinReset onReset={resetStudentPin} />}
    {tab === "admin" && isAdmin && <AdminDirectory students={students} applications={applications} busyId={adminBusyId} message={adminMessage} error={adminError} onResetStudent={resetStudentFromDirectory} onDeleteStudent={(student) => adminDelete("delete-student", student)} onApproveTeacher={approveTeacher} onDeleteTeacher={(teacher) => adminDelete("delete-teacher", teacher)} />}
  </main>;
}

function AvailabilityManager({ selectedDate, setSelectedDate, disabled, requests, onToggle }: { selectedDate: string; setSelectedDate: (date: string) => void; disabled: Record<string, boolean>; requests: ConsultationRequest[]; onToggle: (slot: TimeSlot) => void }) {
  const slots = buildTeacherAvailabilitySlots(selectedDate, disabled, requests);
  return <section className="teacher-content"><div className="section-heading"><div><span className="step"><Settings2 /></span><h2>상담 가능한 시간</h2></div><small>기본은 모두 켜져 있어요</small></div><div className="manager-card"><label className="date-input">확인할 날짜<input type="date" value={selectedDate} min={toDateKey(new Date())} onChange={(e) => setSelectedDate(e.target.value)} /></label><p className="helper">바쁜 날에는 해당 시간을 눌러 꺼 주세요. 학생에게는 “선생님 일정”으로 보여요.</p><div className="toggle-list">{slots.map((slot) => { const booked = !!slot.bookingStatus; return <button key={slot.id} disabled={booked} className={`toggle-row ${!slot.enabled || booked ? "off" : ""}`} onClick={() => onToggle(slot)}><span><b>{slot.label}</b><small>{slot.start}~{slot.end}</small></span><i>{booked && slot.bookingStudentName ? <><b>{slot.bookingStudentName} 학생</b><small>{slot.bookingStatus === "confirmed" ? "예약됨" : "확인 중"}</small></> : slot.bookingStatus === "confirmed" ? "예약됨" : booked ? "확인 중" : !slot.enabled ? "꺼짐" : "상담 가능"}</i></button>; })}</div></div></section>;
}

function ScheduleManager({ schedules, onAdd, onRemove }: { schedules: ScheduleItem[]; onAdd: (item: Omit<ScheduleItem, "id">) => void; onRemove: (id: string) => void }) {
  const [date, setDate] = useState(toDateKey(new Date())); const [start, setStart] = useState("08:20"); const [end, setEnd] = useState("09:10"); const [title, setTitle] = useState(""); const [isPublic, setIsPublic] = useState(false);
  function save() { if (!title.trim()) return; onAdd({ date, start, end, title: title.trim(), publicTitle: isPublic ? title.trim() : "", recurring: false }); setTitle(""); }
  return <section className="teacher-content"><div className="section-heading"><div><span className="step"><CalendarDays /></span><h2>수업과 일정 관리</h2></div><small>학생에게는 간단히 보여요</small></div><div className="schedule-layout"><div className="manager-card schedule-form"><h3><Plus /> 새 일정 넣기</h3><label>날짜<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><div className="two-fields"><label>시작<input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label><label>끝<input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></label></div><label>일정 이름<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 3학년 2반 수업" /></label><label className="check-label"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> 학생에게 일정 이름도 보여주기</label><button className="primary-button" disabled={!title.trim()} onClick={save}><Save />일정 저장하기</button></div><div className="manager-card"><h3>등록된 일정</h3>{schedules.length === 0 ? <div className="empty-state compact"><CalendarDays /><p>아직 등록된 일정이 없어요.</p></div> : <div className="schedule-list">{schedules.map((item) => <div key={item.id}><span><b>{item.date ? formatKoreanDate(item.date) : "매주"}</b><small>{item.start}~{item.end} · {item.title}</small></span><button className="icon-button danger" onClick={() => onRemove(item.id)}><Trash2 /></button></div>)}</div>}</div></div></section>;
}

async function deleteRequestFromServer(user: User | undefined, requestId: string) {
  if (!user) throw new Error("로그인을 다시 확인해 주세요.");
  const token = await user.getIdToken(true);
  const response = await fetch("/api/request-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ requestId }),
  });
  if (!response.ok) throw new Error("기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
}

function dateValue(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (value && typeof (value as Timestamp).toMillis === "function") return (value as Timestamp).toMillis();
  return Infinity;
}

export default App;
