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
  href?: string;
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
  return `Посмотри запись Урока ${Math.max(1, lessonsCompleted)}`;
}

export default function NextStepBanner(props: Props) {
  const text = getBannerText(props);
  const className =
    "col-span-1 lg:col-span-3 bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-[8px] px-6 py-5 flex items-center justify-between cursor-pointer";

  const content = (
    <>
      <div className="flex items-center gap-4">
        <Zap className="text-white opacity-80 shrink-0" size={22} />
        <div>
          <p className="text-white text-xs opacity-75 mb-0.5">Твой следующий шаг</p>
          <p className="text-white font-semibold text-lg leading-snug">{text}</p>
        </div>
      </div>
      <ChevronRight className="text-white shrink-0 animate-pulse" size={24} />
    </>
  );

  if (props.href) {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
