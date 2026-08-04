"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ClipboardCheck, Link2, Users, CalendarDays } from "lucide-react";
import { useCohortOverview } from "@/lib/hooks/useCohortAdmin";

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDate(iso: string | null): string {
  if (!iso) return "не задана";
  const date = new Date(`${iso}T00:00:00`);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export default function AdminDashboardPage() {
  const { cohorts, loading, error, updateCohort } = useCohortOverview();
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);

  async function toggle(cohortId: string, patch: Parameters<typeof updateCohort>[1]) {
    setBusy(cohortId);
    setActionError("");
    const result = await updateCohort(cohortId, patch);
    if (result) setActionError(result.message);
    setBusy(null);
  }

  function copyRegistrationLink() {
    navigator.clipboard.writeText(`${window.location.origin}/register`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const enrolling = cohorts.find((c) => c.isEnrolling) ?? null;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Управление буткемпом</h1>
          <p className="text-sm text-[#71717a] mt-1">Потоки, набор участников и очередь проверки</p>
        </div>

        <button
          onClick={copyRegistrationLink}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          {copied ? <Check size={15} /> : <Link2 size={15} />}
          {copied ? "Скопировано" : "Ссылка регистрации"}
        </button>
      </div>

      {(error || actionError) && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error || actionError}
        </p>
      )}

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
        {enrolling ? (
          <span className="text-zinc-700">
            Новые регистрации попадают в <b>{enrolling.name}</b>
            {enrolling.startsAt ? `, старт ${formatDate(enrolling.startsAt)}` : ""}.
          </span>
        ) : (
          <span className="text-zinc-500">
            Набор закрыт во всех потоках: страница регистрации сейчас не принимает новых участников.
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Загружаем потоки...</p>
      ) : (
        <div className="space-y-4">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-zinc-900">{cohort.name}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                      {cohort.id}
                    </span>
                    {cohort.isEnrolling && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        идёт набор
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Старт {formatDate(cohort.startsAt)} · расписание: {cohort.lessonsScheduled} уроков
                    {cohort.nextLessonDate ? ` · ближайший ${formatDate(cohort.nextLessonDate)}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(cohort.id, { isEnrolling: !cohort.isEnrolling })}
                    disabled={busy === cohort.id}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border disabled:opacity-60 ${
                      cohort.isEnrolling
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                    }`}
                  >
                    {cohort.isEnrolling ? "Набор открыт" : "Набор закрыт"}
                  </button>

                  <button
                    onClick={() =>
                      toggle(cohort.id, { isVisibleToStudents: !cohort.isVisibleToStudents })
                    }
                    disabled={busy === cohort.id}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border disabled:opacity-60 ${
                      cohort.isVisibleToStudents
                        ? "bg-indigo-50 text-[#4f46e5] border-indigo-200 hover:bg-indigo-100"
                        : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                    }`}
                  >
                    {cohort.isVisibleToStudents ? "Виден студентам" : "Скрыт от студентов"}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat icon={<Users size={15} />} label="Участников" value={cohort.students} />
                <Stat
                  icon={<ClipboardCheck size={15} />}
                  label="ДЗ ждут проверки"
                  value={cohort.pendingReviews}
                />
                <Stat
                  icon={<CalendarDays size={15} />}
                  label="Уроков в расписании"
                  value={cohort.lessonsScheduled}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/students?cohort=${cohort.id}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Участники
                </Link>
                <Link
                  href={`/admin/schedule?cohort=${cohort.id}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Расписание
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/admin/cohorts"
          className="px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#4338ca]"
        >
          Создать поток
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="border border-zinc-100 rounded-lg p-3">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-zinc-900 mt-1">{value}</p>
    </div>
  );
}
