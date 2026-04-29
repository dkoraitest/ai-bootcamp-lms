type Bar = {
  label: string;
  value: number;
  total: number;
  color: string;
};

type Props = {
  lessonsCompleted: number;
  lessonsTotal: number;
  hwCompleted: number;
  hwTotal: number;
  launchesThisWeek: number;
  launchesTarget: number;
};

function ProgressBar({ label, value, total, color }: Bar) {
  const pct = Math.round((value / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#18181b]">{label}</span>
        <span className="text-sm text-[#71717a]">
          {value} / {total} — {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ProgressWidget({
  lessonsCompleted,
  lessonsTotal,
  hwCompleted,
  hwTotal,
  launchesThisWeek,
  launchesTarget,
}: Props) {
  return (
    <div className="col-span-1 lg:col-span-2 bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 space-y-5">
      <h2 className="font-semibold text-[#18181b]">Мой прогресс</h2>
      <ProgressBar
        label="Уроков пройдено"
        value={lessonsCompleted}
        total={lessonsTotal}
        color="#2563eb"
      />
      <ProgressBar
        label="Домашних заданий"
        value={hwCompleted}
        total={hwTotal}
        color="#16a34a"
      />
      <ProgressBar
        label="Запусков агента (неделя)"
        value={launchesThisWeek}
        total={launchesTarget}
        color="#d97706"
      />
    </div>
  );
}
