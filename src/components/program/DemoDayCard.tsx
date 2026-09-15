type Props = {
  id: number;
  date: string;
  topic: string;
  videoUrl?: string;
};

export default function DemoDayCard({ id, date, topic, videoUrl }: Props) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-0.5">
            Урок {id} · {date}
          </p>
          <p className="font-semibold text-zinc-900 text-base">{topic}</p>
          <p className="text-sm text-zinc-500 mt-1">
            Питч 5 минут · Покажи финальный проект когорте
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
            🎉 Финал
          </span>
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap bg-white border border-zinc-300 text-zinc-700 text-sm rounded-md px-3 py-1.5 hover:bg-zinc-50 transition-colors"
            >
              ▶️ Смотреть запись
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
