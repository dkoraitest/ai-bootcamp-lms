type Props = {
  goal: string;
};

export default function WeekGoalCard({ goal }: Props) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-6">
      <h2 className="font-semibold text-zinc-900">🎯 Моя цель на неделю</h2>
      <p className="text-sm text-zinc-600 mt-1">{goal}</p>
    </div>
  );
}
