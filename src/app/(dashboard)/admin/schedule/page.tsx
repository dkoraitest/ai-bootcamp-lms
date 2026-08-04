"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useCohortOverview, useCohortSchedule } from "@/lib/hooks/useCohortAdmin";
import type { AssignmentScheduleRow, LessonScheduleRow } from "@/lib/types/admin";

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function weekdayOf(iso: string | null): string {
  if (!iso) return "";
  return WEEKDAYS[new Date(`${iso}T00:00:00`).getDay()];
}

// timestamptz → значение для input[type=datetime-local] в местной зоне браузера
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export default function AdminSchedulePage() {
  const { cohorts } = useCohortOverview();
  const [cohortId, setCohortId] = useState<string | null>(null);

  useEffect(() => {
    if (cohortId !== null || cohorts.length === 0) return;
    const requested = new URLSearchParams(window.location.search).get("cohort");
    const match = cohorts.find((c) => c.id === requested);
    setCohortId(match?.id ?? cohorts.find((c) => c.isEnrolling)?.id ?? cohorts[0].id);
  }, [cohorts, cohortId]);

  const { lessons, assignments, loading, error, saveLessons, saveAssignments } =
    useCohortSchedule(cohortId);

  const [lessonDraft, setLessonDraft] = useState<LessonScheduleRow[]>([]);
  const [hwDraft, setHwDraft] = useState<AssignmentScheduleRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => setLessonDraft(lessons), [lessons]);
  useEffect(() => setHwDraft(assignments), [assignments]);

  function patchLesson(index: number, patch: Partial<LessonScheduleRow>) {
    setLessonDraft((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function patchHw(index: number, patch: Partial<AssignmentScheduleRow>) {
    setHwDraft((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addHw() {
    const next = hwDraft.length > 0 ? Math.max(...hwDraft.map((r) => r.hwNumber)) + 1 : 1;
    setHwDraft((rows) => [...rows, { hwNumber: next, deadline: null, isReleased: true }]);
  }

  async function save() {
    setBusy(true);
    setStatus("");
    const lessonResult = await saveLessons(lessonDraft);
    const hwResult = await saveAssignments(hwDraft);
    setBusy(false);
    setStatus(lessonResult?.message ?? hwResult?.message ?? "Расписание сохранено.");
  }

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft size={15} />
        К управлению
      </Link>

      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Расписание потока</h1>
          <p className="text-sm text-[#71717a] mt-1">
            Даты уроков, время начала и дедлайны ДЗ. Пока даты не заданы, участники видят нейтральное состояние.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={cohortId ?? ""}
            onChange={(e) => setCohortId(e.target.value)}
            className="text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] bg-white"
          >
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </select>

          <button
            onClick={save}
            disabled={busy || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#4338ca] disabled:opacity-60"
          >
            <Save size={15} />
            {busy ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>

      {(error || status) && (
        <p
          className={`mb-4 text-sm rounded-lg p-3 border ${
            error
              ? "text-red-600 bg-red-50 border-red-100"
              : "text-emerald-700 bg-emerald-50 border-emerald-100"
          }`}
        >
          {error || status}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Загружаем расписание...</p>
      ) : lessonDraft.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <p className="text-sm text-zinc-600">
            У потока пока нет строк расписания. Заполните его генератором на странице потоков — он
            рассчитает даты по ритму «две встречи в неделю», а здесь можно поправить отдельные уроки.
          </p>
          <Link
            href="/admin/cohorts"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#4338ca]"
          >
            К генератору
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                  <th className="px-4 py-3 font-medium">Урок</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Начало</th>
                  <th className="px-4 py-3 font-medium">Название (переопределение)</th>
                  <th className="px-4 py-3 font-medium">Открыт</th>
                </tr>
              </thead>
              <tbody>
                {lessonDraft.map((row, index) => (
                  <tr key={row.lessonNumber} className="border-b border-zinc-50 last:border-0">
                    <td className="px-4 py-2 font-medium text-zinc-900">№{row.lessonNumber}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={row.lessonDate ?? ""}
                          onChange={(e) => patchLesson(index, { lessonDate: e.target.value || null })}
                          className="text-sm px-2 py-1 border border-zinc-200 rounded"
                        />
                        <span className="text-xs text-zinc-400">{weekdayOf(row.lessonDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="datetime-local"
                        value={toLocalInput(row.startsAt)}
                        onChange={(e) =>
                          patchLesson(index, { startsAt: fromLocalInput(e.target.value) })
                        }
                        className="text-sm px-2 py-1 border border-zinc-200 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.titleOverride ?? ""}
                        onChange={(e) => patchLesson(index, { titleOverride: e.target.value || null })}
                        placeholder="как в программе"
                        className="w-full text-sm px-2 py-1 border border-zinc-200 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={row.isReleased}
                        onChange={(e) => patchLesson(index, { isReleased: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-zinc-900">Дедлайны домашних заданий</p>
              <button
                onClick={addHw}
                className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                Добавить ДЗ
              </button>
            </div>

            {hwDraft.length === 0 ? (
              <p className="text-sm text-zinc-500">Дедлайнов пока нет.</p>
            ) : (
              <div className="space-y-2">
                {hwDraft.map((row, index) => (
                  <div key={row.hwNumber} className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-zinc-900 w-16">ДЗ {row.hwNumber}</span>
                    <input
                      type="datetime-local"
                      value={toLocalInput(row.deadline)}
                      onChange={(e) => patchHw(index, { deadline: fromLocalInput(e.target.value) })}
                      className="text-sm px-2 py-1 border border-zinc-200 rounded"
                    />
                    <label className="flex items-center gap-2 text-xs text-zinc-500">
                      <input
                        type="checkbox"
                        checked={row.isReleased}
                        onChange={(e) => patchHw(index, { isReleased: e.target.checked })}
                      />
                      открыто
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
