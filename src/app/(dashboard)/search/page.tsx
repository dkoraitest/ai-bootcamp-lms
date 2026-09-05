"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import SearchResultCard, { type SearchItem } from "@/components/search/SearchResultCard";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import SearchNoResults from "@/components/search/SearchNoResults";
import { useCohortSchedule, useMaterials } from "@/lib/hooks/useContentUrls";
import { PROGRAM_LESSONS } from "@/lib/program/lessons";
import { getProgramAssignments } from "@/lib/program/assignments";
import { useCohort } from "@/lib/cohort/CohortProvider";


const STORAGE_KEY = "lms_recent_searches";
const MAX_RECENT = 6;

type SearchResults = {
  lessons: SearchItem[];
  materials: SearchItem[];
  assignments: SearchItem[];
  total: number;
};

export default function SearchPage() {
  const { activeCohortId } = useCohort();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
    setRecentSearches(stored);
    inputRef.current?.focus();
  }, []);

  function saveToRecent(q: string) {
    if (!q.trim()) return;
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
    const updated = [q, ...existing.filter((s) => s !== q)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  }

  function removeFromRecent(term: string) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
    const updated = existing.filter((s) => s !== term);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  }

  function handleSelect(term: string) {
    setQuery(term);
    saveToRecent(term);
  }

  const { lessonSchedule, assignmentSchedule } = useCohortSchedule();
  const { data: cohortMaterials } = useMaterials();

  // Индекс собирается из данных активного потока, а не из зашитого списка.
  // Раньше здесь лежала копия программы первого потока, и поиск показывал
  // его занятия и материалы участникам второго.
  const allItems = useMemo<SearchItem[]>(() => {
    const lessonBase = new Map(PROGRAM_LESSONS.map((lesson) => [lesson.id, lesson]));
    const lessons: SearchItem[] = lessonSchedule.map((row) => {
      const base = lessonBase.get(row.lesson_number);
      const title = row.title_override ?? base?.topic ?? `Урок ${row.lesson_number}`;
      return {
        id: row.lesson_number,
        type: "lesson",
        title,
        week: base?.week ?? Math.ceil(row.lesson_number / 2),
        date: row.lesson_date
          ? new Date(`${row.lesson_date}T00:00:00`).toLocaleDateString("ru-RU")
          : "Дата уточняется",
        topic: row.topic_override ?? title,
        status: row.is_released ? "watching" : "locked",
      };
    });

    const materials: SearchItem[] = cohortMaterials.map((material) => ({
      id: 1000 + material.id,
      type: "material",
      title: material.title.trim(),
      materialType: material.type,
      week: material.week,
      lessonTopic: material.lessonTopic,
      description: material.description ?? material.lessonTopic,
      markdownContent: material.markdownContent,
    }));

    const releasedHw = new Set(
      assignmentSchedule.filter((row) => row.is_released).map((row) => row.hw_number)
    );
    const deadlineByHw = new Map(assignmentSchedule.map((row) => [row.hw_number, row.deadline]));
    const assignments: SearchItem[] = getProgramAssignments(activeCohortId).filter((hw) =>
      releasedHw.has(hw.hwNumber)
    ).map((hw) => {
      const deadline = deadlineByHw.get(hw.hwNumber);
      return {
        id: 2000 + hw.hwNumber,
        type: "assignment",
        hwNumber: hw.hwNumber,
        title: hw.title,
        week: Math.ceil(hw.lessonId / 2),
        deadline: deadline
          ? new Date(deadline).toLocaleDateString("ru-RU")
          : hw.deadline,
        status: hw.status,
        description: hw.description,
      };
    });

    return [...lessons, ...materials, ...assignments];
  }, [activeCohortId, lessonSchedule, assignmentSchedule, cohortMaterials]);

  const results = useMemo<SearchResults | null>(() => {
    if (query.trim().length < 2) return null;

    const q = query.toLowerCase();
    const matched = allItems.filter((item) => {
      if (item.type === "lesson") {
        return item.title.toLowerCase().includes(q) || item.topic.toLowerCase().includes(q);
      }
      if (item.type === "material") {
        return (
          item.title.toLowerCase().includes(q) ||
          item.lessonTopic.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q) ||
          (item.markdownContent ?? "").toLowerCase().includes(q)
        );
      }
      if (item.type === "assignment") {
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return false;
    });

    return {
      lessons:     matched.filter((i) => i.type === "lesson"),
      materials:   matched.filter((i) => i.type === "material"),
      assignments: matched.filter((i) => i.type === "assignment"),
      total:       matched.length,
    };
  }, [query, allItems]);

  const isSearching = query.trim().length >= 2;
  const hasResults = results !== null && results.total > 0;
  const noResults = results !== null && results.total === 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Поиск</h1>
        <p className="text-sm text-zinc-500 mt-1">Уроки, материалы, техники, домашние задания</p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          autoFocus
          placeholder="Введите запрос — минимум 2 символа..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
            if (e.key === "Enter") saveToRecent(query);
          }}
          className="w-full border border-zinc-300 rounded-xl pl-11 pr-10 py-3.5 text-base bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Empty query state */}
      {!isSearching && (
        <SearchEmptyState
          recentSearches={recentSearches}
          onSelect={handleSelect}
          onRemoveRecent={removeFromRecent}
        />
      )}

      {/* Results */}
      {hasResults && results && (
        <div>
          <p className="text-sm text-zinc-500 mb-4">
            Найдено {results.total} результатов по запросу «{query}»
          </p>

          <div className="flex flex-col gap-6">
            {results.lessons.length > 0 && (
              <section>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  📅 Уроки
                  <span className="bg-zinc-100 text-zinc-500 text-xs rounded-full px-1.5 ml-1">
                    {results.lessons.length}
                  </span>
                </p>
                <div className="flex flex-col gap-2">
                  {results.lessons.map((item) => (
                    <SearchResultCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      query={query}
                      onSelect={() => {
                        console.log("navigate to", item.type, item.id);
                        saveToRecent(query);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {results.assignments.length > 0 && (
              <section>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  ✅ Домашние задания
                  <span className="bg-zinc-100 text-zinc-500 text-xs rounded-full px-1.5 ml-1">
                    {results.assignments.length}
                  </span>
                </p>
                <div className="flex flex-col gap-2">
                  {results.assignments.map((item) => (
                    <SearchResultCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      query={query}
                      onSelect={() => {
                        console.log("navigate to", item.type, item.id);
                        saveToRecent(query);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {results.materials.length > 0 && (
              <section>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  📚 Материалы
                  <span className="bg-zinc-100 text-zinc-500 text-xs rounded-full px-1.5 ml-1">
                    {results.materials.length}
                  </span>
                </p>
                <div className="flex flex-col gap-2">
                  {results.materials.map((item) => (
                    <SearchResultCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      query={query}
                      onSelect={() => {
                        console.log("navigate to", item.type, item.id);
                        saveToRecent(query);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* No results */}
      {noResults && (
        <SearchNoResults
          query={query}
          onSelect={handleSelect}
          onClear={() => setQuery("")}
        />
      )}
    </div>
  );
}
