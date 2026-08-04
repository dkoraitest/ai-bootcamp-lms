// 0 — «Все недели», дальше номер недели. Число недель зависит от потока:
// шесть у первого, восемь у второго, поэтому список приходит снаружи.
type WeekValue = number;

type Props = {
  activeWeek: WeekValue;
  onWeekChange: (week: WeekValue) => void;
  weeks?: number[];
};

const DEFAULT_WEEKS = [1, 2, 3, 4, 5, 6];

export default function WeekFilterPills({ activeWeek, onWeekChange, weeks }: Props) {
  const options = [
    { value: 0, label: "Все недели" },
    ...(weeks && weeks.length > 0 ? weeks : DEFAULT_WEEKS).map((week) => ({
      value: week,
      label: `Неделя ${week}`,
    })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
      {options.map((w) => (
        <button
          key={w.value}
          onClick={() => onWeekChange(w.value)}
          className={`whitespace-nowrap text-xs rounded-full px-3 py-1 transition-colors ${
            activeWeek === w.value
              ? "bg-[#4f46e5] text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
