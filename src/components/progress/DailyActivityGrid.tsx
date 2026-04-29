import { Check } from "lucide-react";

type Props = {
  activity: boolean[];
};

export default function DailyActivityGrid({ activity }: Props) {
  const activeDays = activity.filter(Boolean).length;

  return (
    <div>
      <p className="text-sm font-medium text-zinc-700 mt-4 mb-3">Последние 30 дней</p>
      <div className="grid grid-cols-7 gap-1.5">
        {activity.map((active, i) => {
          const isToday = i === activity.length - 1;
          return (
            <div
              key={i}
              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                active ? "bg-[#2563eb]" : "bg-zinc-100"
              } ${isToday ? "ring-2 ring-zinc-400" : ""}`}
            >
              {active && <Check size={12} className="text-white" strokeWidth={2.5} />}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        Всего активных дней: {activeDays} из 30
      </p>
    </div>
  );
}
