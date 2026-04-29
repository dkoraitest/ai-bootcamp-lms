"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import SearchResultCard, { type SearchItem } from "@/components/search/SearchResultCard";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import SearchNoResults from "@/components/search/SearchNoResults";

// ── Lessons ──────────────────────────────────────────────────────────────────
type SearchLesson = Extract<SearchItem, { type: "lesson" }>;
const LESSONS: SearchLesson[] = [
  { id: 1,  type: "lesson", title: "AI Mindset: новая работа в эпоху агентов",         week: 1, date: "12.05.2026", topic: "AI Mindset",                          status: "completed" },
  { id: 2,  type: "lesson", title: "Переход в Cowork: AI который делает",               week: 1, date: "14.05.2026", topic: "Cowork & AI в действии",              status: "completed" },
  { id: 3,  type: "lesson", title: "Кодинг-агенты как класс. CC / Codex / IDE",         week: 2, date: "19.05.2026", topic: "Coding Agents",                       status: "watching" },
  { id: 4,  type: "lesson", title: "Vibe coding: 3 принципа + первый mini-app",         week: 2, date: "21.05.2026", topic: "Vibe Coding",                         status: "locked" },
  { id: 5,  type: "lesson", title: "Контекст как материал. R&D подход",                 week: 3, date: "26.05.2026", topic: "Context Engineering",                 status: "locked" },
  { id: 6,  type: "lesson", title: "Skills и Commands: четыре примитива CC",            week: 3, date: "28.05.2026", topic: "Skills & Commands",                   status: "locked" },
  { id: 7,  type: "lesson", title: "MCP и RAG: расширяем агента",                       week: 4, date: "02.06.2026", topic: "MCP & RAG",                           status: "locked" },
  { id: 8,  type: "lesson", title: "Автоматизации 24/7 и визуальное программирование",  week: 4, date: "04.06.2026", topic: "Automations & Visual Programming",    status: "locked" },
  { id: 9,  type: "lesson", title: "Маркетинг + продажи (доменные кейсы)",              week: 5, date: "09.06.2026", topic: "Marketing & Sales with AI",           status: "locked" },
  { id: 10, type: "lesson", title: "Продукт + аналитика (доменные кейсы)",              week: 5, date: "11.06.2026", topic: "Product & Analytics with AI",         status: "locked" },
  { id: 11, type: "lesson", title: "Безопасный агент + multi-agent",                    week: 6, date: "16.06.2026", topic: "Safe Agents & Multi-Agent Systems",   status: "locked" },
  { id: 12, type: "lesson", title: "Demo Day — Защита проектов",                        week: 6, date: "18.06.2026", topic: "Demo Day",                            status: "locked" },
];

// ── Materials ─────────────────────────────────────────────────────────────────
type SearchMaterial = Extract<SearchItem, { type: "material" }>;
const MATERIALS: SearchMaterial[] = [
  // Videos
  { id: 101, type: "material", title: "AI Mindset: новая работа в эпоху агентов",           materialType: "video",     week: 1, lessonTopic: "AI Mindset",     description: "Запись урока 1 · 12.05.2026" },
  { id: 102, type: "material", title: "Переход в Cowork: AI который делает",                 materialType: "video",     week: 1, lessonTopic: "Cowork",          description: "Запись урока 2 · 14.05.2026" },
  { id: 103, type: "material", title: "Кодинг-агенты как класс. CC / Codex / IDE",           materialType: "video",     week: 2, lessonTopic: "Кодинг-агенты",   description: "Запись урока 3 · 19.05.2026" },
  { id: 104, type: "material", title: "Vibe coding: 3 принципа + первый mini-app",           materialType: "video",     week: 2, lessonTopic: "Vibe coding",      description: "Запись урока 4 · 21.05.2026" },
  { id: 105, type: "material", title: "Контекст как материал. R&D подход",                   materialType: "video",     week: 3, lessonTopic: "Контекст",         description: "Запись урока 5 · 26.05.2026" },
  { id: 106, type: "material", title: "Skills и Commands: четыре примитива CC",              materialType: "video",     week: 3, lessonTopic: "Skills",           description: "Запись урока 6 · 28.05.2026" },
  { id: 107, type: "material", title: "MCP и RAG: расширяем агента",                         materialType: "video",     week: 4, lessonTopic: "MCP + RAG",        description: "Запись урока 7 · 02.06.2026" },
  { id: 108, type: "material", title: "Автоматизации 24/7 и визуальное программирование",    materialType: "video",     week: 4, lessonTopic: "Автоматизации",    description: "Запись урока 8 · 04.06.2026" },
  { id: 109, type: "material", title: "Маркетинг + продажи (доменные кейсы)",                materialType: "video",     week: 5, lessonTopic: "Маркетинг",        description: "Запись урока 9 · 09.06.2026" },
  { id: 110, type: "material", title: "Продукт + аналитика (доменные кейсы)",                materialType: "video",     week: 5, lessonTopic: "Продукт",          description: "Запись урока 10 · 11.06.2026" },
  { id: 111, type: "material", title: "Безопасный агент + multi-agent",                      materialType: "video",     week: 6, lessonTopic: "Безопасность",     description: "Запись урока 11 · 16.06.2026" },
  { id: 112, type: "material", title: "Demo Day — Защита проектов",                          materialType: "video",     week: 6, lessonTopic: "Demo Day",          description: "Запись урока 12 · 18.06.2026" },
  // Templates
  { id: 113, type: "material", title: "Шаблон промпта Stage + Task + Rules",                 materialType: "template",  week: 1, lessonTopic: "AI Mindset",     description: "Базовая формула промпта для любой задачи" },
  { id: 114, type: "material", title: "Чеклист запуска Cowork-автоматизации",                materialType: "template",  week: 1, lessonTopic: "Cowork",          description: "Пошаговый чеклист для первой автоматизации" },
  { id: 115, type: "material", title: "Шаблон CLAUDE.md (5 разделов)",                       materialType: "template",  week: 3, lessonTopic: "Контекст",        description: "Готовая структура личной операционной системы" },
  { id: 116, type: "material", title: "Шаблон Skill для Claude Code",                        materialType: "template",  week: 3, lessonTopic: "Skills",          description: "Стартовая структура для написания своего Skill" },
  { id: 117, type: "material", title: "Шаблон MCP конфига",                                  materialType: "template",  week: 4, lessonTopic: "MCP + RAG",       description: "Базовая конфигурация для подключения MCP-сервера" },
  { id: 118, type: "material", title: "Шаблон питча для Demo Day (5 мин)",                   materialType: "template",  week: 6, lessonTopic: "Demo Day",        description: "Структура выступления: проблема → агент → результат" },
  // Techniques
  { id: 119, type: "material", title: "Stage + Task + Rules формула",                        materialType: "technique", week: 1, lessonTopic: "AI Mindset",     description: "Базовая формула промпта", markdownContent: "## Stage + Task + Rules\n\n**Stage** — контекст: кто ты, какая ситуация\n**Task** — конкретное действие\n**Rules** — ограничения и формат вывода\n\n```\n[Stage] Ты senior маркетолог...\n[Task] Напиши 3 варианта заголовка...\n[Rules] Каждый до 10 слов, без вопросов\n```" },
  { id: 120, type: "material", title: "AI Mindset: 3 режима работы с агентом",               materialType: "technique", week: 1, lessonTopic: "AI Mindset",     description: "Ассистент, напарник, агент", markdownContent: "## 3 режима работы с агентом\n\n1. **Ассистент** — разовые задачи\n2. **Напарник** — итеративная работа\n3. **Агент** — автономное выполнение" },
  { id: 121, type: "material", title: "Cowork automation loop",                               materialType: "technique", week: 1, lessonTopic: "Cowork",          description: "Trigger → Agent → Output → Verify → Deploy", markdownContent: "## Cowork Automation Loop\n\nТrigger → Agent → Output → Verify → Deploy" },
  { id: 122, type: "material", title: "3 принципа vibe coding",                              materialType: "technique", week: 2, lessonTopic: "Vibe coding",     description: "Describe, iterate fast, own the output", markdownContent: "## 3 принципа vibe coding\n\n1. **Describe, don't code** — описывай результат, не шаги\n2. **Iterate fast** — маленькие итерации с проверкой\n3. **Own the output** — всегда понимай что задеплоил" },
  { id: 123, type: "material", title: "CLAUDE.md: 5 обязательных разделов",                  materialType: "technique", week: 3, lessonTopic: "Контекст",        description: "Роль, стиль, запреты, форматы, контекст", markdownContent: "## CLAUDE.md структура\n\n1. Роль и контекст\n2. Стиль работы\n3. Запрещённые действия\n4. Форматы вывода\n5. Проектный контекст" },
  { id: 124, type: "material", title: "Skills anatomy: 4 части",                             materialType: "technique", week: 3, lessonTopic: "Skills",          description: "Trigger, Context, Task, Output", markdownContent: "## Anatomy of a Skill\n\n1. **Trigger** — когда запускается\n2. **Context** — что передаётся агенту\n3. **Task** — что делает агент\n4. **Output** — формат результата" },
  { id: 125, type: "material", title: "MCP connection flow",                                  materialType: "technique", week: 4, lessonTopic: "MCP + RAG",       description: "Install → Configure → Authenticate → Test → Use", markdownContent: "## MCP Connection Flow\n\nInstall → Configure → Authenticate → Test → Use in Agent" },
  { id: 126, type: "material", title: "3 уровня доверия для автоматизаций",                  materialType: "technique", week: 4, lessonTopic: "Автоматизации",   description: "Supervised, Semi-auto, Autonomous", markdownContent: "## 3 уровня доверия\n\n1. **Supervised** — агент предлагает, человек подтверждает\n2. **Semi-auto** — агент действует, человек проверяет результат\n3. **Autonomous** — агент действует и отчитывается" },
  { id: 127, type: "material", title: "Trust boundaries checklist",                           materialType: "technique", week: 6, lessonTopic: "Безопасность",    description: "Scope, деструктивные действия, секреты, stop conditions", markdownContent: "## Trust Boundaries Checklist\n\n- [ ] Scope файловой системы ограничен\n- [ ] Деструктивные действия требуют подтверждения\n- [ ] Секреты не передаются в промпт\n- [ ] Stop conditions заданы" },
  // Resources
  { id: 128, type: "material", title: "skills_v2.csv — Skill Matrix",                        materialType: "resource",  week: 1, lessonTopic: "Все недели",      description: "CSV-файл с матрицей 10 навыков × 3 уровня" },
  { id: 129, type: "material", title: "assignments_v2.csv — структура ДЗ",                   materialType: "resource",  week: 1, lessonTopic: "Все недели",      description: "CSV со всеми домашними заданиями и рубриками" },
  { id: 130, type: "material", title: "lessons_v2.csv — расписание",                         materialType: "resource",  week: 1, lessonTopic: "Все недели",      description: "12 уроков с датами и темами" },
  { id: 131, type: "material", title: "11_PEDAGOGY.md — методология",                        materialType: "resource",  week: 1, lessonTopic: "Все недели",      description: "Полная методологическая документация буткемпа" },
  { id: 132, type: "material", title: "Google Drive — все материалы",                        materialType: "resource",  week: 1, lessonTopic: "Все недели",      description: "Общая папка с записями, шаблонами и ДЗ" },
];

// ── Assignments ───────────────────────────────────────────────────────────────
type SearchAssignment = Extract<SearchItem, { type: "assignment" }>;
const ASSIGNMENTS: SearchAssignment[] = [
  { id: 201, type: "assignment", hwNumber: 1, title: "Промпт-инжиниринг",      week: 1, deadline: "22.05.2026", status: "reviewed",    description: "Напиши системный промпт для агента в своей доменной зоне. Промпт должен включать роль, контекст, ограничения и примеры." },
  { id: 202, type: "assignment", hwNumber: 2, title: "Mini-App деплой",        week: 2, deadline: "05.06.2026", status: "in_progress", description: "Задеплой мини-приложение на базе Claude Code. Это может быть любой инструмент для твоего домена — бот, скрипт-автоматизация или веб-интерфейс." },
  { id: 203, type: "assignment", hwNumber: 3, title: "CLAUDE.md + Skills",     week: 3, deadline: "12.06.2026", status: "not_started", description: "Настрой операционную систему своего агента: напиши CLAUDE.md и создай 2 кастомных Skills для автоматизации рутинных задач." },
  { id: 204, type: "assignment", hwNumber: 4, title: "MCP интеграция",         week: 4, deadline: "19.06.2026", status: "locked",      description: "Подключи минимум один MCP-сервер к своему рабочему окружению и сними видео демонстрацию использования." },
  { id: 205, type: "assignment", hwNumber: 5, title: "Доменный кейс",          week: 5, deadline: "26.06.2026", status: "locked",      description: "Реши реальную задачу из своего домена с помощью Claude Code агента. Задокументируй процесс и результат." },
  { id: 206, type: "assignment", hwNumber: 6, title: "Demo Day презентация",   week: 6, deadline: "03.07.2026", status: "locked",      description: "Подготовь и запиши финальную презентацию своего прогресса и главного кейса буткемпа." },
];

const ALL_ITEMS: SearchItem[] = [...LESSONS, ...MATERIALS, ...ASSIGNMENTS];

const STORAGE_KEY = "lms_recent_searches";
const MAX_RECENT = 6;

type SearchResults = {
  lessons: SearchItem[];
  materials: SearchItem[];
  assignments: SearchItem[];
  total: number;
};

export default function SearchPage() {
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

  const results = useMemo<SearchResults | null>(() => {
    if (query.trim().length < 2) return null;

    const q = query.toLowerCase();
    const matched = ALL_ITEMS.filter((item) => {
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
  }, [query]);

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
