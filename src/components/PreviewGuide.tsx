import { ArrowLeft, ArrowRight, Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import { previewSteps, type PreviewRole } from "../lib/previewSteps";

export function PreviewGuide({ role, onExit }: { role: PreviewRole; onExit: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = previewSteps[role];
  const step = steps[stepIndex];

  useEffect(() => {
    const highlighted = document.querySelector(".tour-highlight");
    highlighted?.classList.remove("tour-highlight");

    const target = document.querySelector(`[data-tour="${step.target}"]`);
    target?.classList.add("tour-highlight");
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });

    return () => target?.classList.remove("tour-highlight");
  }, [step.target]);

  return (
    <aside className="preview-guide" aria-live="polite">
      <div className="preview-guide-top">
        <span className={`preview-mode ${role}`}><Eye /> {role === "student" ? "학생용 미리보기" : "교사용 미리보기"}</span>
        <button type="button" className="preview-exit" aria-label="미리보기 끝내기" onClick={onExit}><X /> 미리보기 끝내기</button>
      </div>
      <div className="preview-progress" aria-hidden="true">
        {steps.map((item, index) => <i key={item.target} className={index <= stepIndex ? "active" : ""} />)}
      </div>
      <div className="preview-guide-copy">
        <span>{stepIndex + 1} / {steps.length}</span>
        <div><b>{step.title}</b><p>{step.description}</p></div>
      </div>
      <div className="preview-guide-actions">
        <button type="button" aria-label="이전 설명" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}><ArrowLeft /> 이전</button>
        <button type="button" className="next" aria-label="다음 설명" onClick={() => setStepIndex((current) => current === steps.length - 1 ? 0 : current + 1)}>{stepIndex === steps.length - 1 ? "처음부터" : "다음"}<ArrowRight /></button>
      </div>
    </aside>
  );
}
