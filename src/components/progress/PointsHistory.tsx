type PointEntry = { action: string; points: number; date: string };

type Props = {
  history: PointEntry[];
  totalPoints: number;
};

export default function PointsHistory({ history, totalPoints }: Props) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-zinc-900">История очков</h2>
        <span className="text-sm text-[#2563eb] font-medium">
          Итого: {totalPoints} очков
        </span>
      </div>
      <div>
        {history.map((entry, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-2.5 ${
              i < history.length - 1 ? "border-b border-[#e4e4e7]" : ""
            }`}
          >
            <span className="text-sm text-zinc-700">{entry.action}</span>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-sm font-medium text-[#16a34a]">+{entry.points}</span>
              <span className="text-xs text-zinc-400">{entry.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
