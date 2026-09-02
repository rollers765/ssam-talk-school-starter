import { Bell, CalendarCheck2 } from "lucide-react";
import type { ConsultationRequest } from "../types";

export function TodayConsultations({ requests, today }: { requests: ConsultationRequest[]; today: string }) {
  const consultations = requests
    .filter((item) => item.status === "confirmed" && item.date === today)
    .sort((a, b) => (a.start || "99:99").localeCompare(b.start || "99:99"));

  return <aside className="today-consultations"><header><span><Bell /></span><div><b>오늘 상담</b><strong>{consultations.length}건</strong></div></header>{consultations.length === 0 ? <p>오늘 확정된 상담이 없어요</p> : <div className="today-consultation-list">{consultations.map((item) => <div data-testid="today-consultation" key={item.id}><time>{item.start || "시간 협의"}</time><span><b>{item.studentName}</b><small>{item.studentNumber}</small></span><CalendarCheck2 /></div>)}</div>}</aside>;
}
