"use client";

import { useEffect, useState } from "react";
import { Target, X, Pencil } from "lucide-react";
import { useCohortGoals, type WeeklyGoal } from "@/lib/hooks/useCohortGoals";

const STATUS_META: Record<WeeklyGoal["status"], { icon: string; className: string }> = {
  done: { icon: "✅", className: "text-[#16a34a]" },
  missed: { icon: "❌", className: "text-[#dc2626]" },
  in_progress: { icon: "⏳", className: "text-[#d97706]" },
};

export default function CohortGoalsCard() {
  const { goals, myGoal, loading, saveMyGoal } = useCohortGoals();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mainGoal, setMainGoal] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMainGoal(myGoal?.mainGoal ?? "");
    setContext(myGoal?.context ?? "");
  }, [myGoal]);

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

  async function handleSave() {
    if (!mainGoal.trim()) {
      setError("Напишите цель — хотя бы одной фразой.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await saveMyGoal(mainGoal, context);
    setSaving(false);
    if (result.ok) setEditing(false);
    else setError(result.error ?? "Не удалось сохранить.");
  }

  const hasMyGoal = Boolean(myGoal?.mainGoal);

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
          {hasMyGoal
            ? "Твоя цель и цели остальных участников потока."
            : "Сформулируй свою цель на буткемп и посмотри цели остальных."}
        </p>
        <span className="mt-1 inline-flex self-start items-center rounded-full bg-[#4f46e5]/10 text-[#4f46e5] text-xs font-medium px-2.5 py-1">
          {loading ? "Загружаем..." : hasMyGoal ? `${goals.length} участников` : "Цель не заполнена"}
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
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h3 className="font-semibold text-[#18181b]">Цели на буткемп</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <section className="rounded-lg border border-[#4f46e5]/30 bg-[#4f46e5]/5 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#18181b]">Моя цель</h4>
                  {hasMyGoal && !editing && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#4f46e5] hover:underline"
                    >
                      <Pencil size={12} />
                      Изменить
                    </button>
                  )}
                </div>

                {hasMyGoal && !editing ? (
                  <>
                    {myGoal?.context && (
                      <p className="mt-1 text-xs text-zinc-500">{myGoal.context}</p>
                    )}
                    <p className="mt-2 text-sm text-zinc-700">{myGoal?.mainGoal}</p>
                  </>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500">Чем занимаешься</label>
                      <input
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Например: маркетолог в B2B SaaS"
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">
                        Что хочешь получить к концу буткемпа
                      </label>
                      <textarea
                        value={mainGoal}
                        onChange={(e) => setMainGoal(e.target.value)}
                        rows={3}
                        placeholder="Конкретно: какую свою задачу передашь агенту и что считается результатом"
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                    </div>
                    {error && <p className="text-xs text-[#dc2626]">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md bg-[#4f46e5] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {saving ? "Сохраняем..." : "Сохранить"}
                      </button>
                      {hasMyGoal && (
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600"
                        >
                          Отмена
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-[#18181b]">Цели потока</h4>
                {loading ? (
                  <p className="mt-2 text-sm text-zinc-500">Загружаем...</p>
                ) : goals.filter((goal) => goal.userId !== myGoal?.userId).length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    Пока никто больше не заполнил цель. Будь первым — остальные подтянутся.
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {goals
                      .filter((goal) => goal.userId !== myGoal?.userId)
                      .map((goal) => (
                        <div key={goal.userId} className="rounded-lg border border-zinc-200 p-4">
                          <p className="text-sm font-medium text-[#18181b]">{goal.name}</p>
                          {goal.context && (
                            <p className="text-xs text-zinc-500">{goal.context}</p>
                          )}
                          <p className="mt-2 text-sm text-zinc-700">{goal.mainGoal}</p>
                          {goal.weekly.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {goal.weekly.map((week) => (
                                <li key={week.week} className="flex gap-2 text-xs text-zinc-600">
                                  <span className={STATUS_META[week.status]?.className}>
                                    {STATUS_META[week.status]?.icon ?? "•"}
                                  </span>
                                  <span>
                                    <span className="text-zinc-400">Неделя {week.week}:</span>{" "}
                                    {week.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
