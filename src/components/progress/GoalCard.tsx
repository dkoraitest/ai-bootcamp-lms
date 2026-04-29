type Props = {
  streakWeeks: number;
  targetWeeks: number;
};

export default function GoalCard({ streakWeeks, targetWeeks }: Props) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-6">
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-zinc-900">🎯 Главная цель буткемпа</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Использовать CC-агента в своей доменной зоне 5+ раз в неделю в течение 30 дней
            после Demo Day
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            Текущий streak: {streakWeeks} недель подряд с 5+ запусками
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Цель считается достигнутой когда 4 недели подряд → 5+ запусков
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1 lg:w-1/3">
          <span className="text-5xl font-bold text-[#2563eb]">{streakWeeks}</span>
          <p className="text-sm text-zinc-500 text-center">недель streak</p>
          <p className="text-xs text-zinc-400 text-center">нужно {targetWeeks}</p>
        </div>
      </div>
    </div>
  );
}
