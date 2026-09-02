export type PreviewRole = "student" | "teacher";

export type PreviewStep = {
  target: string;
  title: string;
  description: string;
};

export const previewSteps: Record<PreviewRole, PreviewStep[]> = {
  student: [
    { target: "student-date", title: "상담할 날짜를 골라요", description: "달력에서 원하는 평일을 누르면 그날 신청할 수 있는 시간이 보여요." },
    { target: "student-time", title: "편한 시간을 선택해요", description: "쉬는 시간, 점심시간, 방과후 중 편한 시간을 가볍게 눌러보세요." },
    { target: "student-topic", title: "이야기 주제를 알려줘요", description: "진로, 친구, 성적처럼 선생님과 나누고 싶은 주제를 간단히 선택해요." },
    { target: "student-status", title: "요청 결과를 확인해요", description: "선생님이 승인하거나 다른 시간을 제안하면 이곳에 바로 표시돼요." },
  ],
  teacher: [
    { target: "teacher-requests", title: "새 상담 요청을 확인해요", description: "학생의 학번, 이름, 원하는 시간과 이야기 주제를 한눈에 볼 수 있어요." },
    { target: "teacher-actions", title: "승인하거나 시간을 제안해요", description: "가능하면 바로 승인하고, 어렵다면 학생에게 다른 시간을 제안할 수 있어요." },
    { target: "teacher-defer", title: "다음 만남으로 안내해요", description: "지금 일정을 잡기 어렵다면 부드럽게 다음에 만나자는 답을 보낼 수 있어요." },
    { target: "teacher-availability", title: "상담 가능한 시간을 관리해요", description: "기본 시간은 켜 두고, 상담이 어려운 날과 시간만 간단히 끌 수 있어요." },
  ],
};
