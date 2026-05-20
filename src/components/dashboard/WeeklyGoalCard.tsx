"use client";

import { Target } from "lucide-react";

type Props = {
  goal: string | null;
};

export default function WeeklyGoalCard({ goal }: Props) {
  if (!goal) return null;

  return (
    <div className="col-span-1 lg:col-span-3 rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
          <Target size={16} className="text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">
            Цель на неделю
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed">{goal}</p>
        </div>
      </div>
    </div>
  );
}
