"use client";

import { useEffect, useState } from "react";
import { Target, X } from "lucide-react";
import {
  PARTICIPANT_GOALS,
  type GoalStatus,
} from "@/lib/data/participantGoals";

const STATUS_META: Record<GoalStatus, { icon: string; className: string }> = {
  done: { icon: "✅", className: "text-[#16a34a]" },
  missed: { icon: "❌", className: "text-[#dc2626]" },
  in_progress: { icon: "⏳", className: "text-[#d97706]" },
};

export default function BootcampGoalsCard() {
  const [open, setOpen] = useState(false);

  // Закрытие по Esc + блокировка прокрутки фона, пока модалка открыта
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="col-span-1 lg:col-start-3 text-left bg-[#fafafa] rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col gap-3 hover:border-[#4f46e5] hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4f46e5]/10">
            <Target size={18} className="text-[#4f46e5]" />
          </div>
          <h2 className="font-semibold text-[#18181b]">Цели на буткемп</h2>
        </div>
        <p className="text-sm text-[#71717a] leading-relaxed">
          Главные цели участников и прогресс по неделям. Нажми, чтобы открыть.
        </p>
        <span className="mt-1 inline-flex self-start items-center rounded-full bg-[#4f46e5]/10 text-[#4f46e5] text-xs font-medium px-2.5 py-1">
          {PARTICIPANT_GOALS.length} участников
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl my-4 bg-white rounded-[12px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Шапка */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#e4e4e7] bg-white px-6 py-4 rounded-t-[12px]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4f46e5]/10">
                  <Target size={18} className="text-[#4f46e5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#18181b] leading-tight">
                    Цели на буткемп
                  </h3>
                  <p className="text-xs text-[#71717a]">
                    Главная цель и прогресс по неделям
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#71717a] hover:bg-zinc-100 transition-colors"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Список участников */}
            <div className="px-6 py-5 space-y-5">
              {PARTICIPANT_GOALS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-[10px] border border-[#e4e4e7] p-4"
                >
                  <div className="mb-1">
                    <h4 className="font-semibold text-[#18181b]">{p.name}</h4>
                    <p className="text-xs text-[#a1a1aa]">{p.role}</p>
                  </div>

                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-sm shrink-0">🎯</span>
                    <p className="text-sm text-[#3f3f46] leading-relaxed">
                      {p.mainGoal}
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-[#f4f4f5] pt-3">
                    {p.weeks.map((g, i) => {
                      const meta = STATUS_META[g.status];
                      return (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <span className="shrink-0 leading-5">{meta.icon}</span>
                          <span className="shrink-0 w-[3.4rem] text-xs font-medium text-[#a1a1aa] leading-5">
                            Неделя {g.week}
                          </span>
                          <span className={`leading-5 ${meta.className}`}>
                            {g.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Легенда */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#71717a] pt-1">
                <span>✅ выполнено</span>
                <span>❌ не сделано / отказался</span>
                <span>⏳ в работе</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
