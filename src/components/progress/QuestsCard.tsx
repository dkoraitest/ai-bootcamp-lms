type Quest = {
  id: number;
  name: string;
  emoji: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
};

type Props = {
  quests: Quest[];
};

export default function QuestsCard({ quests }: Props) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">Квесты</h2>
      <div>
        {quests.map((quest, i) => {
          const pct = Math.round((quest.progress / quest.total) * 100);
          return (
            <div
              key={quest.id}
              className={`py-3 ${i < quests.length - 1 ? "border-b border-[#e4e4e7]" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-zinc-900">
                  {quest.emoji} {quest.name}
                </span>
                {quest.completed ? (
                  <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Выполнен ✅
                  </span>
                ) : (
                  <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    В процессе
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{quest.description}</p>
              {!quest.completed && (
                <div className="mt-2">
                  <p className="text-xs text-zinc-500 text-right mb-0.5">
                    {quest.progress} / {quest.total}
                  </p>
                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
