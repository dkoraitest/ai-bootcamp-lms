"use client";

type LessonStatus = "completed" | "watching" | "locked";

type LessonData = {
  id: number;
  date: string;
  topic: string;
  status: LessonStatus;
  videoUrl: string;
};

type Props = {
  lesson: LessonData;
  techniques: string[];
};

const STATUS_CONFIG: Record<LessonStatus, { label: string; emoji: string; classes: string }> = {
  completed: { label: "Просмотрено", emoji: "✅", classes: "bg-green-100 text-green-700" },
  watching:  { label: "Смотрю",      emoji: "▶️", classes: "bg-blue-100 text-blue-700" },
  locked:    { label: "Скоро",       emoji: "🔒", classes: "bg-zinc-100 text-zinc-400" },
};

export default function LessonCard({ lesson, techniques }: Props) {
  const cfg = STATUS_CONFIG[lesson.status];
  const visibleTechs = techniques.slice(0, 3);
  const remaining = techniques.length - 3;

  return (
    <div className="bg-[#f7f7f8] border border-zinc-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-0.5">
            Урок {lesson.id} · {lesson.date}
          </p>
          <p className="font-semibold text-zinc-900 text-base leading-snug">
            {lesson.topic}
          </p>
          {visibleTechs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {visibleTechs.map((tech) => (
                <span
                  key={tech}
                  className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full"
                >
                  {tech}
                </span>
              ))}
              {remaining > 0 && (
                <span className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full">
                  +{remaining} ещё
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {!lesson.videoUrl && (
            <span className={`text-xs font-medium px-2 py-1 rounded ${cfg.classes}`}>
              {cfg.emoji} {cfg.label}
            </span>
          )}
          {lesson.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap bg-white border border-zinc-300 text-zinc-700 text-sm rounded-md px-3 py-1.5 hover:bg-zinc-50 transition-colors"
            >
              ▶️ Смотреть запись
            </a>
          )}
        </div>
      </div>

      {/* Status change buttons — only when watching */}
      {lesson.status === "watching" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-200">
          <button
            onClick={() => console.log("status change")}
            className="text-xs px-3 py-1.5 rounded bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            Не начат
          </button>
          <button
            onClick={() => console.log("status change")}
            className="text-xs px-3 py-1.5 rounded bg-blue-100 text-blue-700 ring-1 ring-blue-400"
          >
            Смотрю
          </button>
          <button
            onClick={() => console.log("status change")}
            className="text-xs px-3 py-1.5 rounded bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            Просмотрен
          </button>
        </div>
      )}
    </div>
  );
}
