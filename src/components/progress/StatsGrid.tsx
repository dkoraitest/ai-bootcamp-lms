type Props = {
  lessonsCompleted: number;
  lessonsTotal: number;
  hwCompleted: number;
  hwTotal: number;
  totalLaunches: number;
  launchesThisWeek: number;
  daysInBootcamp: number;
  daysTotal: number;
};

function StatTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">{children}</div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-zinc-200 mt-2 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function StatsGrid({
  lessonsCompleted, lessonsTotal,
  hwCompleted, hwTotal,
  totalLaunches, launchesThisWeek,
  daysInBootcamp, daysTotal,
}: Props) {
  const lessonsPct = Math.round((lessonsCompleted / lessonsTotal) * 100);
  const hwPct = Math.round((hwCompleted / hwTotal) * 100);
  const daysPct = Math.round((daysInBootcamp / daysTotal) * 100);

  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">Общая статистика</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatTile>
          <p className="font-bold text-3xl text-zinc-900">{lessonsCompleted}</p>
          <p className="text-sm text-zinc-500">из {lessonsTotal} уроков</p>
          <MiniBar pct={lessonsPct} color="bg-[#2563eb]" />
        </StatTile>

        <StatTile>
          <p className="font-bold text-3xl text-zinc-900">{hwCompleted}</p>
          <p className="text-sm text-zinc-500">из {hwTotal} заданий</p>
          <MiniBar pct={hwPct} color="bg-[#16a34a]" />
        </StatTile>

        <StatTile>
          <p className="font-bold text-3xl text-zinc-900">{totalLaunches}</p>
          <p className="text-sm text-zinc-500">всего запусков</p>
          <p className="text-xs text-[#d97706] mt-2">{launchesThisWeek} на этой неделе</p>
        </StatTile>

        <StatTile>
          <p className="font-bold text-3xl text-zinc-900">{daysInBootcamp}</p>
          <p className="text-sm text-zinc-500">из {daysTotal} дней</p>
          <MiniBar pct={daysPct} color="bg-[#7c3aed]" />
        </StatTile>
      </div>
    </div>
  );
}
