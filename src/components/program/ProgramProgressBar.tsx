type Props = {
  completed: number;
  total: number;
};

export default function ProgramProgressBar({ completed, total }: Props) {
  const pct = (completed / total) * 100;

  return (
    <div className="mb-6">
      <p className="text-sm text-zinc-600 mb-1.5">
        Пройдено {completed} из {total} уроков
      </p>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
          style={{ width: `${pct.toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}
