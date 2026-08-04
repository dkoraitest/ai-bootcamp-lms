"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Search } from "lucide-react";
import { useCohortMembers, useCohortOverview } from "@/lib/hooks/useCohortAdmin";
import type { CohortMember } from "@/lib/types/admin";

type SortKey = "name" | "points" | "lessonsDone" | "hwSubmitted" | "lastVisit";

function toCsv(rows: CohortMember[]): string {
  const header = [
    "Имя", "Email", "Telegram", "Роль", "Присоединился",
    "Уроков", "ДЗ сдано", "ДЗ проверено", "Баллы", "Последний заход",
  ];
  const body = rows.map((r) => [
    r.name,
    r.email,
    r.telegram ?? "",
    r.globalRole ?? "student",
    r.joinedAt?.slice(0, 10) ?? "",
    String(r.lessonsDone),
    String(r.hwSubmitted),
    String(r.hwReviewed),
    String(r.points),
    r.lastVisit ?? "",
  ]);
  return [header, ...body]
    .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}

export default function AdminStudentsPage() {
  const { cohorts } = useCohortOverview();
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Поток можно передать ссылкой: /admin/students?cohort=flow-2
  useEffect(() => {
    if (cohortId !== null || cohorts.length === 0) return;
    const requested = new URLSearchParams(window.location.search).get("cohort");
    const match = cohorts.find((c) => c.id === requested);
    setCohortId(match?.id ?? cohorts.find((c) => c.isEnrolling)?.id ?? cohorts[0].id);
  }, [cohorts, cohortId]);

  const { members, loading, error, moveMember, removeMember, setGlobalRole } =
    useCohortMembers(cohortId);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? members.filter(
          (m) =>
            m.name.toLowerCase().includes(needle) ||
            m.email.toLowerCase().includes(needle) ||
            (m.telegram ?? "").toLowerCase().includes(needle)
        )
      : members;

    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "ru");
      if (sortKey === "lastVisit") return (b.lastVisit ?? "").localeCompare(a.lastVisit ?? "");
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
  }, [members, query, sortKey]);

  async function run(userId: string, action: () => Promise<{ message: string } | null>) {
    setBusyId(userId);
    setActionError("");
    const result = await action();
    if (result) setActionError(result.message);
    setBusyId(null);
  }

  function downloadCsv() {
    const blob = new Blob(["﻿" + toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participants-${cohortId ?? "cohort"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-2xl font-semibold text-zinc-900">Участники</h1>
          <p className="text-sm text-[#71717a] mt-1">
            Прогресс по урокам и ДЗ, баллы, активность на платформе
          </p>
        </div>

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
      </div>

      {(error || actionError) && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error || actionError}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени, email или Telegram"
            className="w-full text-sm pl-9 pr-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] bg-white"
        >
          <option value="name">По имени</option>
          <option value="points">По баллам</option>
          <option value="lessonsDone">По урокам</option>
          <option value="hwSubmitted">По сданным ДЗ</option>
          <option value="lastVisit">По последнему заходу</option>
        </select>

        <button
          onClick={downloadCsv}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          <Download size={15} />
          CSV
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-4 py-3 font-medium">Участник</th>
              <th className="px-4 py-3 font-medium">Telegram</th>
              <th className="px-4 py-3 font-medium">Уроки</th>
              <th className="px-4 py-3 font-medium">ДЗ</th>
              <th className="px-4 py-3 font-medium">Баллы</th>
              <th className="px-4 py-3 font-medium">Заход</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((member) => (
              <tr key={member.userId} className="border-b border-zinc-50 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900">{member.name}</p>
                    {member.globalRole && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-[#4f46e5] border border-indigo-200">
                        {member.globalRole}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{member.email}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{member.telegram ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{member.lessonsDone}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {member.hwSubmitted} сдано · {member.hwReviewed} проверено
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">{member.points}</td>
                <td className="px-4 py-3 text-zinc-600">{member.lastVisit ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value=""
                      onChange={(e) =>
                        e.target.value && run(member.userId, () => moveMember(member.userId, e.target.value))
                      }
                      disabled={busyId === member.userId}
                      className="text-xs px-2 py-1 border border-zinc-200 rounded bg-white"
                    >
                      <option value="">Перенести в...</option>
                      {cohorts
                        .filter((c) => c.id !== cohortId)
                        .map((cohort) => (
                          <option key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </option>
                        ))}
                    </select>

                    <select
                      value={member.globalRole ?? "student"}
                      onChange={(e) =>
                        run(member.userId, () =>
                          setGlobalRole(member.userId, e.target.value as "student" | "expert" | "admin")
                        )
                      }
                      disabled={busyId === member.userId}
                      className="text-xs px-2 py-1 border border-zinc-200 rounded bg-white"
                    >
                      <option value="student">студент</option>
                      <option value="expert">эксперт</option>
                      <option value="admin">админ</option>
                    </select>

                    <button
                      onClick={() => run(member.userId, () => removeMember(member.userId))}
                      disabled={busyId === member.userId}
                      className="text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      Исключить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && visible.length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            {members.length === 0 ? "В этом потоке пока нет участников." : "Ничего не найдено."}
          </p>
        )}
        {loading && <p className="px-4 py-6 text-sm text-zinc-400">Загружаем участников...</p>}
      </div>

      <p className="text-[11px] text-zinc-400 mt-3">
        Исключение убирает доступ к потоку, но сохраняет прогресс и сдачи — если исключили по ошибке,
        участника можно вернуть переносом обратно.
      </p>
    </div>
  );
}
