import { ChevronRight, Zap } from "lucide-react";

type Props = {
  hwCompleted: number;
  hwTotal: number;
  daysLeft: number;
  hwNumber: number;
  peerReviewOpen: boolean;
  lessonToday: boolean;
  lessonsCompleted: number;
  lessonsTotal: number;
  nextLessonNumber: number;
  nextLessonTopic: string;
};

function getBannerText(props: Props): string {
  const {
    hwCompleted,
    hwTotal,
    daysLeft,
    hwNumber,
    peerReviewOpen,
    lessonToday,
    lessonsCompleted,
    lessonsTotal,
    nextLessonNumber,
    nextLessonTopic,
  } = props;

  if (hwCompleted < hwTotal && daysLeft <= 2) {
    return `Сдай ДЗ #${hwNumber} — дедлайн через ${daysLeft} дн.`;
  }
  if (peerReviewOpen) {
    return "Началось пир-ревью — оцени 2 работы";
  }
  if (lessonsCompleted < lessonsTotal && lessonToday) {
    return `Сегодня урок ${nextLessonNumber}: ${nextLessonTopic}`;
  }
  return `Посмотри запись Урока ${lessonsCompleted + 1}`;
}

export default function NextStepBanner(props: Props) {
  const text = getBannerText(props);

  return (
    <div className="col-span-1 lg:col-span-3 bg-[#2563eb] rounded-[8px] px-6 py-5 flex items-center justify-between cursor-pointer">
      <div className="flex items-center gap-4">
        <Zap className="text-white opacity-80 shrink-0" size={22} />
        <div>
          <p className="text-white text-xs opacity-75 mb-0.5">Твой следующий шаг</p>
          <p className="text-white font-semibold text-lg leading-snug">{text}</p>
        </div>
      </div>
      <ChevronRight className="text-white shrink-0 animate-pulse" size={24} />
    </div>
  );
}
