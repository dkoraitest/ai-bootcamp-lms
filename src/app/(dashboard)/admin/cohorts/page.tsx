"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wand2 } from "lucide-react";
import { useCohortOverview } from "@/lib/hooks/useCohortAdmin";

export default function AdminCohortsPage() {
  const { cohorts, loading, error, createCohort, updateCohort, generateSchedule } =
    useCohortOverview();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState("");

  // Генератор расписания: ритм «две встречи в неделю» от даты первого урока.
  const [genCohort, setGenCohort] = useState("");
  const [genDate, setGenDate] = useState("");
  const [genCount, setGenCount] = useState("16");
  const [genBusy, setGenBusy] = useState(false);
  const [genResult, setGenResult] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setDone("");

    if (!id.trim() || !name.trim()) {
      setFormError("Заполните код и название потока.");
      return;
    }

    setBusy(true);
    const result = await createCohort({
      id: id.trim(),
      name: name.trim(),
      startsAt: startsAt || null,
      endsAt: endsAt || null,
    });
    setBusy(false);

    if (result) {
      setFormError(result.message);
      return;
    }

    setDone(`Поток «${name.trim()}» создан. Он скрыт от студентов, пока вы не откроете его.`);
    setId("");
    setName("");
    setStartsAt("");
    setEndsAt("");
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenResult("");

    if (!genCohort || !genDate) {
      setGenResult("Выберите поток и дату первого урока.");
      return;
    }

    setGenBusy(true);
    const result = await generateSchedule(genCohort, genDate, Number(genCount));
    setGenBusy(false);
    setGenResult(result ? result.message : `Расписание заполнено: ${genCount} уроков.`);
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

      <h1 className="text-2xl font-semibold text-zinc-900">Потоки</h1>
      <p className="text-sm text-[#71717a] mt-1">
        Новый поток создаётся скрытым: участники не увидят его, пока вы не откроете доступ и набор.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
      )}

      <form onSubmit={handleCreate} className="mt-6 bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <p className="font-semibold text-zinc-900">Новый поток</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Название" hint="Видно в переключателе потоков">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Поток 2 · август 2026"
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
            />
          </Field>

          <Field label="Код" hint="Латиница, цифры и дефис: flow-3">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="flow-3"
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
            />
          </Field>

          <Field label="Первый урок">
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
            />
          </Field>

          <Field label="Последний урок" hint="Необязательно">
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#4338ca] disabled:opacity-60"
        >
          {busy ? "Создаём..." : "Создать поток"}
        </button>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {done && <p className="text-sm text-emerald-700">{done}</p>}
      </form>

      <form onSubmit={handleGenerate} className="mt-4 bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-[#4f46e5]" />
          <p className="font-semibold text-zinc-900">Заполнить расписание</p>
        </div>
        <p className="text-xs text-zinc-500">
          Ритм «две встречи в неделю»: от даты первого урока даты считаются автоматически.
          Старт в четверг даёт пары чт/вт, старт во вторник — вт/чт. Время по умолчанию 18:00 и 14:30 МСК,
          поправить можно на странице расписания.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Поток">
            <select
              value={genCohort}
              onChange={(e) => setGenCohort(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] bg-white"
            >
              <option value="">Выберите поток</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Первый урок">
            <input
              type="date"
              value={genDate}
              onChange={(e) => setGenDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px]"
            />
          </Field>

          <Field label="Сколько уроков">
            <input
              type="number"
              min={1}
              max={60}
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px]"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={genBusy}
          className="px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {genBusy ? "Считаем даты..." : "Заполнить"}
        </button>

        {genResult && <p className="text-sm text-zinc-700">{genResult}</p>}
      </form>

      <div className="mt-8">
        <p className="text-sm font-semibold text-zinc-900 mb-3">Все потоки</p>
        {loading ? (
          <p className="text-sm text-zinc-400">Загружаем...</p>
        ) : (
          <div className="space-y-3">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <p className="font-medium text-zinc-900">{cohort.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {cohort.id} · участников: {cohort.students} · уроков в расписании:{" "}
                    {cohort.lessonsScheduled}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCohort(cohort.id, { isEnrolling: !cohort.isEnrolling })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      cohort.isEnrolling
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {cohort.isEnrolling ? "Набор идёт" : "Открыть набор"}
                  </button>
                  <button
                    onClick={() =>
                      updateCohort(cohort.id, { isVisibleToStudents: !cohort.isVisibleToStudents })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      cohort.isVisibleToStudents
                        ? "bg-indigo-50 text-[#4f46e5] border-indigo-200"
                        : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {cohort.isVisibleToStudents ? "Виден студентам" : "Скрыт"}
                  </button>
                  <Link
                    href={`/admin/schedule?cohort=${cohort.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  >
                    Расписание
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}
