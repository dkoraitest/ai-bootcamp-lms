"use client";

import { useEffect, useState } from "react";
import { Target, X, Plus, Trash2, Check } from "lucide-react";
import { useCohortGoals, type GoalStatus } from "@/lib/hooks/useCohortGoals";

const STATUS_META: Record<GoalStatus, { icon: string; label: string; className: string }> = {
  planned: { icon: "○", label: "Запланирована", className: "text-zinc-400" },
  in_progress: { icon: "⏳", label: "В работе", className: "text-[#d97706]" },
  done: { icon: "✅", label: "Сделана", className: "text-[#16a34a]" },
  dropped: { icon: "❌", label: "Снята", className: "text-[#dc2626]" },
};

// Клик по статусу гоняет цель по кругу, чтобы не заводить выпадающий список
// ради четырёх значений.
const NEXT_STATUS: Record<GoalStatus, GoalStatus> = {
  planned: "in_progress",
  in_progress: "done",
  done: "dropped",
  dropped: "planned",
};

export default function CohortGoalsCard() {
  const { myGoals, otherGoals, loading, addGoal, updateGoal, deleteGoal, saveContext } =
    useCohortGoals();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [context, setContext] = useState("");
  const [contextDirty, setContextDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contextDirty) setContext(myGoals?.context ?? "");
  }, [myGoals, contextDirty]);

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

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError("");
    const result = await action();
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Не получилось. Попробуй ещё раз.");
    return result.ok;
  }

  async function handleAdd() {
    if (!draft.trim()) return;
    const ok = await run(() => addGoal(draft));
    if (ok) setDraft("");
  }

  const myItems = myGoals?.items ?? [];
  const doneCount = myItems.filter((item) => item.status === "done").length;

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
          {myItems.length > 0
            ? "Твои цели и цели остальных участников потока."
            : "Запиши, чего хочешь добиться за буткемп. Целей может быть несколько."}
        </p>
        <span className="mt-1 inline-flex self-start items-center rounded-full bg-[#4f46e5]/10 text-[#4f46e5] text-xs font-medium px-2.5 py-1">
          {loading
            ? "Загружаем..."
            : myItems.length > 0
              ? `Мои цели: ${doneCount} из ${myItems.length}`
              : "Целей пока нет"}
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
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <section className="rounded-lg border border-[#4f46e5]/30 bg-[#4f46e5]/5 p-4">
                <h4 className="text-sm font-semibold text-[#18181b]">Мои цели</h4>

                <div className="mt-3">
                  <label className="text-xs text-zinc-500">Чем занимаешься</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={context}
                      onChange={(e) => {
                        setContext(e.target.value);
                        setContextDirty(true);
                      }}
                      placeholder="Например: маркетолог в B2B SaaS"
                      className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    {contextDirty && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          const ok = await run(() => saveContext(context));
                          if (ok) setContextDirty(false);
                        }}
                        className="rounded-md bg-[#4f46e5] px-3 text-xs font-medium text-white disabled:opacity-60"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {myItems.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {myItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 rounded-md bg-white px-3 py-2">
                        <button
                          type="button"
                          disabled={busy}
                          title={STATUS_META[item.status].label}
                          onClick={() => run(() => updateGoal(item.id, { status: NEXT_STATUS[item.status] }))}
                          className={`mt-0.5 shrink-0 text-sm ${STATUS_META[item.status].className}`}
                        >
                          {STATUS_META[item.status].icon}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            item.status === "done" || item.status === "dropped"
                              ? "text-zinc-400 line-through"
                              : "text-zinc-700"
                          }`}
                        >
                          {item.week ? (
                            <span className="text-zinc-400">Неделя {item.week}: </span>
                          ) : null}
                          {item.text}
                          {item.source === "transcript" && (
                            <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                              с разбора
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => deleteGoal(item.id))}
                          className="mt-0.5 shrink-0 text-zinc-300 hover:text-[#dc2626]"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAdd();
                    }}
                    placeholder="Ещё одна цель — что конкретно хочешь получить"
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={busy || !draft.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#4f46e5] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    <Plus size={14} />
                    Добавить
                  </button>
                </div>

                {error && <p className="mt-2 text-xs text-[#dc2626]">{error}</p>}
                <p className="mt-2 text-xs text-zinc-400">
                  Клик по значку слева меняет статус: запланирована, в работе, сделана, снята.
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-[#18181b]">Цели потока</h4>
                {loading ? (
                  <p className="mt-2 text-sm text-zinc-500">Загружаем...</p>
                ) : otherGoals.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    Пока никто больше не записал цели. Будь первым — остальные подтянутся.
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {otherGoals.map((goal) => (
                      <div key={goal.userId} className="rounded-lg border border-zinc-200 p-4">
                        <p className="text-sm font-medium text-[#18181b]">{goal.name}</p>
                        {goal.context && <p className="text-xs text-zinc-500">{goal.context}</p>}
                        <ul className="mt-2 space-y-1.5">
                          {goal.items.map((item) => (
                            <li key={item.id} className="flex gap-2 text-sm text-zinc-700">
                              <span className={`shrink-0 ${STATUS_META[item.status].className}`}>
                                {STATUS_META[item.status].icon}
                              </span>
                              <span>
                                {item.week ? (
                                  <span className="text-zinc-400">Неделя {item.week}: </span>
                                ) : null}
                                {item.text}
                              </span>
                            </li>
                          ))}
                        </ul>
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
