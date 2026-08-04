"use client";

import { AlertCircle, ChevronDown, Layers3, RefreshCw } from "lucide-react";
import { useCohort } from "@/lib/cohort/CohortProvider";

export default function TopBar() {
  const {
    cohorts,
    activeCohortId,
    isLoading,
    error,
    canSwitch,
    refresh,
    selectCohort,
  } = useCohort();

  return (
    <header className="h-14 bg-white border-b border-[#e4e4e7] flex items-center justify-between gap-4 px-4 md:px-6 sticky top-0 z-40">
      <div className="md:hidden font-semibold text-[#18181b] text-sm truncate">
        AI Agents Bootcamp
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isLoading ? (
          <div
            aria-label="Загрузка потока"
            className="h-8 w-32 rounded-md bg-zinc-100 animate-pulse"
          />
        ) : error ? (
          <button
            type="button"
            onClick={() => void refresh()}
            title="Повторить загрузку потоков"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 active:translate-y-px"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>Потоки недоступны</span>
            <RefreshCw size={13} aria-hidden="true" />
          </button>
        ) : canSwitch ? (
          <div className="relative shrink-0">
            <Layers3
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <label htmlFor="active-cohort" className="sr-only">
              Активный поток
            </label>
            <select
              id="active-cohort"
              value={activeCohortId ?? ""}
              onChange={(event) => selectCohort(event.target.value)}
              className="h-8 min-w-[132px] appearance-none rounded-md border border-zinc-200 bg-white pl-8 pr-8 text-xs font-medium text-zinc-800 outline-none transition-colors hover:border-zinc-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
            >
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
