"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { recordLaunch } from "@/lib/actions/recordLaunch";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

type Props = {
  launchDaysThisWeek: boolean[];
  launchesThisWeek: number;
  launchesTarget: number;
  userId?: string;
  onLaunched?: () => void;
};

export default function LaunchTracker({
  launchDaysThisWeek,
  launchesThisWeek,
  launchesTarget,
  userId,
  onLaunched,
}: Props) {
  const [days, setDays] = useState(launchDaysThisWeek);
  const [count, setCount] = useState(launchesThisWeek);
  const [saving, setSaving] = useState(false);

  async function handleMark() {
    if (!userId) return;

    setSaving(true);
    const { error } = await recordLaunch(userId);

    if (!error) {
      const updated = [...days];
      updated[TODAY_INDEX] = true;
      setDays(updated);
      setCount((c) => c + 1);
      onLaunched?.();
    }

    setSaving(false);
  }

  return (
    <div className="col-span-1 bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-[#18181b]">Запуски агента</h2>

      <p className="font-medium text-sm text-[#18181b]">
        На этой неделе:{" "}
        <span className="text-[#2563eb]">
          {count} / {launchesTarget}
        </span>
      </p>

      <div className="flex items-end gap-2">
        {days.map((done, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                done
                  ? "bg-[#2563eb]"
                  : i === TODAY_INDEX
                  ? "bg-zinc-100 border-2 border-zinc-400"
                  : "bg-zinc-100"
              }`}
            >
              {done && <Check size={14} className="text-white" strokeWidth={2.5} />}
            </div>
            <span className="text-[10px] text-[#71717a]">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleMark}
        disabled={saving || !userId || days[TODAY_INDEX]}
        className="w-full border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Сохраняем..." : days[TODAY_INDEX] ? "Уже отмечено сегодня ✓" : "+ Отметить запуск сегодня"}
      </button>
    </div>
  );
}
