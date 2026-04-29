import { Check } from "lucide-react";

const LEVELS = [
  { num: 1, name: "Новичок",  minPoints: 0 },
  { num: 2, name: "Практик",  minPoints: 101 },
  { num: 3, name: "Агент",    minPoints: 301 },
  { num: 4, name: "Мастер",   minPoints: 601 },
  { num: 5, name: "Эксперт",  minPoints: 1001 },
];

type Props = {
  level: number;
  levelName: string;
  points: number;
  pointsToNextLevel: number;
  nextLevelName: string;
};

export default function LevelCard({
  level, levelName, points, pointsToNextLevel, nextLevelName,
}: Props) {
  const xpPct = Math.round((points / pointsToNextLevel) * 100);

  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">Уровень и очки</h2>

      {/* Level circle */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-20 h-20 rounded-full bg-[#2563eb] flex items-center justify-center">
          <span className="text-3xl font-bold text-white">{level}</span>
        </div>
        <p className="text-lg font-semibold text-zinc-900 text-center mt-2">{levelName}</p>
        <p className="text-sm text-zinc-500 text-center mt-0.5">
          {points} / {pointsToNextLevel} очков
        </p>
      </div>

      {/* XP bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">{levelName}</span>
          <span className="text-xs text-zinc-500">{nextLevelName}</span>
        </div>
        <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563eb] transition-all duration-1000"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* Level ladder */}
      <div>
        {LEVELS.map((lvl, i) => {
          const isPassed  = lvl.num < level;
          const isCurrent = lvl.num === level;
          const isLocked  = lvl.num > level;

          return (
            <div
              key={lvl.num}
              className={`flex items-center gap-3 py-2 ${
                i < LEVELS.length - 1 ? "border-b border-[#e4e4e7]" : ""
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${
                  isPassed
                    ? "bg-[#2563eb] text-white"
                    : isCurrent
                    ? "bg-[#2563eb] text-white ring-2 ring-[#2563eb] ring-offset-1"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {isPassed ? (
                  <Check size={12} strokeWidth={2.5} />
                ) : (
                  lvl.num
                )}
              </div>
              <span
                className={`flex-1 text-sm font-medium ${
                  isLocked ? "text-zinc-400" : "text-zinc-900"
                }`}
              >
                {lvl.name}
              </span>
              <span className="text-xs text-zinc-500 shrink-0">
                {isLocked ? `от ${lvl.minPoints} очков` : `${lvl.minPoints} очков`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
