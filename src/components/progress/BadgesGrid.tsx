type Badge = {
  id: number;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
};

type Props = {
  badges: Badge[];
};

export default function BadgesGrid({ badges }: Props) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-900">Бейджи</h2>
        <span className="text-sm text-zinc-500">
          {earnedCount} / {badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.earned ? badge.description : undefined}
            className={`rounded-lg p-3 flex flex-col items-center text-center gap-1 ${
              badge.earned
                ? "bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                : "bg-zinc-50 border border-zinc-100"
            }`}
          >
            <span
              className={`text-2xl leading-none ${
                badge.earned ? "" : "opacity-30 grayscale"
              }`}
            >
              {badge.emoji}
            </span>
            <span
              className={`text-xs font-medium leading-tight ${
                badge.earned ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              {badge.name}
            </span>
            {badge.earned ? (
              <span className="text-xs text-zinc-400">{badge.earnedAt}</span>
            ) : (
              <span className="text-xs text-zinc-300">🔒</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
