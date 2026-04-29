type NextLesson = {
  number: number;
  date: string;
  time: string;
  topic: string;
};

type NextDeadline = {
  hwNumber: number;
  title: string;
  deadline: string;
  daysLeft: number;
};

type Props = {
  nextLesson: NextLesson;
  nextDeadline: NextDeadline;
};

export default function UpcomingEvents({ nextLesson, nextDeadline }: Props) {
  const deadlineColor =
    nextDeadline.daysLeft <= 3 ? "text-[#d97706]" : "text-[#71717a]";

  return (
    <div className="col-span-1 bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-[#18181b]">Ближайшее</h2>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span>📅</span>
          <span className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
            Следующий урок
          </span>
        </div>
        <p className="font-semibold text-[#18181b]">
          Урок {nextLesson.number} · {nextLesson.date}
        </p>
        <p className="text-sm text-[#71717a]">{nextLesson.topic}</p>
        <span className="mt-1 inline-block bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded self-start">
          {nextLesson.time}
        </span>
      </div>

      <div className="border-t border-[#e4e4e7]" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span>⏰</span>
          <span className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
            Дедлайн ДЗ
          </span>
        </div>
        <p className="font-semibold text-[#18181b]">
          ДЗ #{nextDeadline.hwNumber} · {nextDeadline.title}
        </p>
        <p className="text-sm text-[#71717a]">{nextDeadline.deadline}</p>
        <p className={`text-sm font-medium ${deadlineColor}`}>
          Осталось {nextDeadline.daysLeft} дня
        </p>
      </div>
    </div>
  );
}
