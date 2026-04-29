type WeekValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  activeWeek: WeekValue;
  onWeekChange: (week: WeekValue) => void;
};

const WEEKS: { value: WeekValue; label: string }[] = [
  { value: 0, label: "Все недели" },
  { value: 1, label: "Неделя 1" },
  { value: 2, label: "Неделя 2" },
  { value: 3, label: "Неделя 3" },
  { value: 4, label: "Неделя 4" },
  { value: 5, label: "Неделя 5" },
  { value: 6, label: "Неделя 6" },
];

export default function WeekFilterPills({ activeWeek, onWeekChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
      {WEEKS.map((w) => (
        <button
          key={w.value}
          onClick={() => onWeekChange(w.value)}
          className={`whitespace-nowrap text-xs rounded-full px-3 py-1 transition-colors ${
            activeWeek === w.value
              ? "bg-[#2563eb] text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
