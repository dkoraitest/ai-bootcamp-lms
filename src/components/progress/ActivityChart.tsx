type WeeklyLaunch = { week: string; launches: number };

type Props = {
  data: WeeklyLaunch[];
};

const MAX_HEIGHT = 64;
const MAX_LAUNCHES = 4;

function getBarColor(launches: number): string {
  if (launches >= 5) return "bg-[#2563eb]";
  if (launches >= 3) return "bg-[#60a5fa]";
  if (launches > 0) return "bg-[#bfdbfe]";
  return "bg-zinc-200";
}

function getBarHeight(launches: number): number {
  return Math.max(4, (launches / MAX_LAUNCHES) * MAX_HEIGHT);
}

export default function ActivityChart({ data }: Props) {
  return (
    <div>
      {/* Bar chart */}
      <div className="flex items-end gap-1 justify-between">
        {data.map((item, i) => {
          const isCurrentWeek = i === data.length - 1;
          const barHeight = getBarHeight(item.launches);
          const barColor = getBarColor(item.launches);

          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-xs text-zinc-600 font-medium">{item.launches}</span>
              <div
                className={`w-6 sm:w-8 rounded-sm ${barColor} ${
                  isCurrentWeek ? "ring-2 ring-[#2563eb] ring-offset-1" : ""
                }`}
                style={{ height: `${barHeight}px` }}
              />
              <span className="text-[10px] text-zinc-400 text-center w-full truncate">
                {item.week}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
        {[
          { color: "bg-[#2563eb]", label: "5+ запусков" },
          { color: "bg-[#60a5fa]", label: "3–4 запуска" },
          { color: "bg-[#bfdbfe]", label: "1–2 запуска" },
          { color: "bg-zinc-200",  label: "Нет запусков" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
            <span className="text-xs text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
