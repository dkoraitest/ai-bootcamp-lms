type Props = {
  level: number;
  levelName: string;
  points: number;
  pointsToNext: number;
  lastBadge: { name: string; emoji: string };
};

export default function GamificationWidget({
  level,
  levelName,
  points,
  pointsToNext,
  lastBadge,
}: Props) {
  const xpPct = Math.round((points / pointsToNext) * 100);

  return (
    <div className="col-span-1 bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-[#18181b]">Уровень</h2>

      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-[#2563eb] flex items-center justify-center">
          <span className="text-white font-bold text-2xl">{level}</span>
        </div>
        <span className="font-semibold text-[#18181b]">{levelName}</span>
        <span className="text-sm text-[#71717a]">
          {points} / {pointsToNext} очков
        </span>
        <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      <div className="border-t border-[#e4e4e7]" />

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-[#18181b]">
          <span className="text-base">{lastBadge.emoji}</span>
          <span className="text-[#71717a]">Последний бейдж:</span>
          <span className="font-medium">{lastBadge.name}</span>
        </div>
        <p className="text-xs text-zinc-400">Следующий: Prompt Master 🎯</p>
      </div>
    </div>
  );
}
