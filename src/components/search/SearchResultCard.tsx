import HighlightedText from "./HighlightedText";

type SearchLesson = {
  id: number;
  type: "lesson";
  title: string;
  week: number;
  date: string;
  topic: string;
  status: "completed" | "watching" | "locked";
};

type SearchMaterial = {
  id: number;
  type: "material";
  title: string;
  materialType: "video" | "template" | "technique" | "resource";
  week: number;
  lessonTopic: string;
  description: string;
  markdownContent?: string;
};

type SearchAssignment = {
  id: number;
  type: "assignment";
  title: string;
  hwNumber: number;
  week: number;
  deadline: string;
  status: string;
  description: string;
};

export type SearchItem = SearchLesson | SearchMaterial | SearchAssignment;

type Props = {
  item: SearchItem;
  query: string;
  onSelect: () => void;
};

const MATERIAL_ICON: Record<SearchMaterial["materialType"], { emoji: string; bg: string }> = {
  video:     { emoji: "📹", bg: "bg-purple-50" },
  template:  { emoji: "📄", bg: "bg-orange-50" },
  technique: { emoji: "💡", bg: "bg-blue-50" },
  resource:  { emoji: "📦", bg: "bg-zinc-50" },
};

const LESSON_STATUS_BADGE: Record<SearchLesson["status"], { label: string; cls: string }> = {
  completed: { label: "Пройден",    cls: "bg-green-100 text-green-700" },
  watching:  { label: "Смотрю",     cls: "bg-blue-100 text-blue-700" },
  locked:    { label: "Заблокирован",cls: "bg-zinc-100 text-zinc-400" },
};

const ASSIGNMENT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  reviewed:    { label: "Проверено",     cls: "bg-green-100 text-green-700" },
  submitted:   { label: "Сдано",         cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В процессе",    cls: "bg-yellow-100 text-yellow-700" },
  not_started: { label: "Не начато",     cls: "bg-zinc-100 text-zinc-500" },
  locked:      { label: "Заблокировано", cls: "bg-zinc-100 text-zinc-400" },
};

function getSnippet(text: string, query: string): string | null {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 30);
  const snippet = text.slice(start, end);
  return `${start > 0 ? "..." : ""}${snippet}${end < text.length ? "..." : ""}`;
}

export default function SearchResultCard({ item, query, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white border border-zinc-200 rounded-lg px-4 py-3 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer flex items-start gap-3"
    >
      {item.type === "lesson" && (
        <>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-lg">
            📅
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-900 text-sm">
              <HighlightedText text={item.title} query={query} />
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Урок {item.id} · Неделя {item.week} · {item.date}
            </p>
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${LESSON_STATUS_BADGE[item.status].cls}`}>
            {LESSON_STATUS_BADGE[item.status].label}
          </span>
        </>
      )}

      {item.type === "material" && (() => {
        const icon = MATERIAL_ICON[item.materialType];
        const snippet = getSnippet(item.description ?? "", query) ??
                        getSnippet(item.markdownContent ?? "", query);
        return (
          <>
            <div className={`w-9 h-9 rounded-lg ${icon.bg} flex items-center justify-center shrink-0 text-lg`}>
              {icon.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 text-sm">
                <HighlightedText text={item.title} query={query} />
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {item.materialType} · Неделя {item.week} · {item.lessonTopic}
              </p>
              {snippet && (
                <p className="text-xs text-zinc-500 mt-1 italic">
                  <HighlightedText text={snippet} query={query} />
                </p>
              )}
            </div>
          </>
        );
      })()}

      {item.type === "assignment" && (() => {
        const badge = ASSIGNMENT_STATUS_BADGE[item.status] ?? { label: item.status, cls: "bg-zinc-100 text-zinc-500" };
        return (
          <>
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0 text-lg">
              ✅
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 text-sm">
                <HighlightedText text={`ДЗ #${item.hwNumber}: ${item.title}`} query={query} />
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Неделя {item.week} · Дедлайн {item.deadline}
              </p>
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${badge.cls}`}>
              {badge.label}
            </span>
          </>
        );
      })()}
    </button>
  );
}
