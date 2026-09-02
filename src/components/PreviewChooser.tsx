import { CalendarCheck2, ChevronRight, GraduationCap } from "lucide-react";

type PreviewRole = "student" | "teacher";

export function PreviewChooser({ onSelect }: { onSelect: (role: PreviewRole) => void }) {
  return (
    <section className="preview-chooser" aria-labelledby="preview-title">
      <div className="preview-heading">
        <span>체험하기</span>
        <div>
          <h2 id="preview-title">로그인 전에 둘러보기</h2>
          <p>예시 화면이라 눌러봐도 실제 상담 정보는 저장되지 않아요.</p>
        </div>
      </div>
      <div className="preview-role-grid">
        <button type="button" className="preview-role-card student" aria-label="학생용 미리보기" onClick={() => onSelect("student")}>
          <span className="preview-role-icon"><GraduationCap /></span>
          <span><b>학생용 미리보기</b><small>상담 시간을 고르고 요청해 봐요</small></span>
          <ChevronRight />
        </button>
        <button type="button" className="preview-role-card teacher" aria-label="교사용 미리보기" onClick={() => onSelect("teacher")}>
          <span className="preview-role-icon"><CalendarCheck2 /></span>
          <span><b>교사용 미리보기</b><small>요청 확인과 승인 과정을 살펴봐요</small></span>
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
