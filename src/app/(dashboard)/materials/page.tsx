"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import MaterialCard, { type Material } from "@/components/materials/MaterialCard";
import MaterialTabs from "@/components/materials/MaterialTabs";
import WeekFilterPills from "@/components/materials/WeekFilterPills";
import MaterialsEmptyState from "@/components/materials/MaterialsEmptyState";
import { useMaterialUrls } from "@/lib/hooks/useContentUrls";

type TabKey = "all" | "video" | "template" | "technique" | "resource";
type WeekValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MATERIALS: Material[] = [
  // ВИДЕО
  { id: 1,  title: "AI Mindset: новая работа в эпоху агентов",            type: "video",     week: 1, lessonId: 1,  lessonTopic: "AI Mindset",     url: "#", description: "Запись урока 1 · 12.05.2026" },
  { id: 2,  title: "Переход в Cowork: AI который делает",                  type: "video",     week: 1, lessonId: 2,  lessonTopic: "Cowork",          url: "#", description: "Запись урока 2 · 14.05.2026" },
  { id: 3,  title: "Кодинг-агенты как класс. CC / Codex / IDE",            type: "video",     week: 2, lessonId: 3,  lessonTopic: "Кодинг-агенты",   url: "#", description: "Запись урока 3 · 19.05.2026" },
  { id: 4,  title: "Vibe coding: 3 принципа + первый mini-app",            type: "video",     week: 2, lessonId: 4,  lessonTopic: "Vibe coding",      url: "#", description: "Запись урока 4 · 21.05.2026" },
  { id: 5,  title: "Контекст как материал. R&D подход",                    type: "video",     week: 3, lessonId: 5,  lessonTopic: "Контекст",         url: "#", description: "Запись урока 5 · 26.05.2026" },
  { id: 6,  title: "Skills и Commands: четыре примитива CC",               type: "video",     week: 3, lessonId: 6,  lessonTopic: "Skills",           url: "#", description: "Запись урока 6 · 28.05.2026" },
  { id: 7,  title: "MCP и RAG: расширяем агента",                          type: "video",     week: 4, lessonId: 7,  lessonTopic: "MCP + RAG",        url: "#", description: "Запись урока 7 · 02.06.2026" },
  { id: 8,  title: "Автоматизации 24/7 и визуальное программирование",     type: "video",     week: 4, lessonId: 8,  lessonTopic: "Автоматизации",    url: "#", description: "Запись урока 8 · 04.06.2026" },
  { id: 9,  title: "Маркетинг + продажи (доменные кейсы)",                 type: "video",     week: 5, lessonId: 9,  lessonTopic: "Маркетинг",        url: "#", description: "Запись урока 9 · 09.06.2026" },
  { id: 10, title: "Продукт + аналитика (доменные кейсы)",                 type: "video",     week: 5, lessonId: 10, lessonTopic: "Продукт",          url: "#", description: "Запись урока 10 · 11.06.2026" },
  { id: 11, title: "Безопасный агент + multi-agent",                        type: "video",     week: 6, lessonId: 11, lessonTopic: "Безопасность",     url: "#", description: "Запись урока 11 · 16.06.2026" },
  { id: 12, title: "Demo Day — Защита проектов",                            type: "video",     week: 6, lessonId: 12, lessonTopic: "Demo Day",          url: "#", description: "Запись урока 12 · 18.06.2026" },
  // ШАБЛОНЫ
  { id: 13, title: "Шаблон промпта Stage + Task + Rules",                   type: "template",  week: 1, lessonId: 1,  lessonTopic: "AI Mindset",     url: "#", description: "Базовая формула промпта для любой задачи" },
  { id: 14, title: "Чеклист запуска Cowork-автоматизации",                  type: "template",  week: 1, lessonId: 2,  lessonTopic: "Cowork",          url: "#", description: "Пошаговый чеклист для первой автоматизации" },
  { id: 15, title: "Шаблон CLAUDE.md (5 разделов)",                         type: "template",  week: 3, lessonId: 5,  lessonTopic: "Контекст",        url: "#", description: "Готовая структура личной операционной системы" },
  { id: 16, title: "Шаблон Skill для Claude Code",                          type: "template",  week: 3, lessonId: 6,  lessonTopic: "Skills",          url: "#", description: "Стартовая структура для написания своего Skill" },
  { id: 17, title: "Шаблон MCP конфига",                                    type: "template",  week: 4, lessonId: 7,  lessonTopic: "MCP + RAG",       url: "#", description: "Базовая конфигурация для подключения MCP-сервера" },
  { id: 18, title: "Шаблон питча для Demo Day (5 мин)",                     type: "template",  week: 6, lessonId: 12, lessonTopic: "Demo Day",        url: "#", description: "Структура выступления: проблема → агент → результат" },
  // ТЕХНИКИ
  { id: 19, title: "Stage + Task + Rules формула",                          type: "technique", week: 1, lessonId: 1,  lessonTopic: "AI Mindset",     url: "#", markdownContent: "## Stage + Task + Rules\n\n**Stage** — контекст: кто ты, какая ситуация\n**Task** — конкретное действие\n**Rules** — ограничения и формат вывода\n\n```\n[Stage] Ты senior маркетолог...\n[Task] Напиши 3 варианта заголовка...\n[Rules] Каждый до 10 слов, без вопросов\n```" },
  { id: 20, title: "AI Mindset: 3 режима работы с агентом",                 type: "technique", week: 1, lessonId: 1,  lessonTopic: "AI Mindset",     url: "#", markdownContent: "## 3 режима работы с агентом\n\n1. **Ассистент** — разовые задачи\n2. **Напарник** — итеративная работа\n3. **Агент** — автономное выполнение" },
  { id: 21, title: "Cowork automation loop",                                 type: "technique", week: 1, lessonId: 2,  lessonTopic: "Cowork",          url: "#", markdownContent: "## Cowork Automation Loop\n\nТrigger → Agent → Output → Verify → Deploy" },
  { id: 22, title: "3 принципа vibe coding",                                type: "technique", week: 2, lessonId: 4,  lessonTopic: "Vibe coding",     url: "#", markdownContent: "## 3 принципа vibe coding\n\n1. **Describe, don't code** — описывай результат, не шаги\n2. **Iterate fast** — маленькие итерации с проверкой\n3. **Own the output** — всегда понимай что задеплоил" },
  { id: 23, title: "CLAUDE.md: 5 обязательных разделов",                   type: "technique", week: 3, lessonId: 5,  lessonTopic: "Контекст",        url: "#", markdownContent: "## CLAUDE.md структура\n\n1. Роль и контекст\n2. Стиль работы\n3. Запрещённые действия\n4. Форматы вывода\n5. Проектный контекст" },
  { id: 24, title: "Skills anatomy: 4 части",                               type: "technique", week: 3, lessonId: 6,  lessonTopic: "Skills",          url: "#", markdownContent: "## Anatomy of a Skill\n\n1. **Trigger** — когда запускается\n2. **Context** — что передаётся агенту\n3. **Task** — что делает агент\n4. **Output** — формат результата" },
  { id: 25, title: "MCP connection flow",                                    type: "technique", week: 4, lessonId: 7,  lessonTopic: "MCP + RAG",       url: "#", markdownContent: "## MCP Connection Flow\n\nInstall → Configure → Authenticate → Test → Use in Agent" },
  { id: 26, title: "3 уровня доверия для автоматизаций",                    type: "technique", week: 4, lessonId: 8,  lessonTopic: "Автоматизации",   url: "#", markdownContent: "## 3 уровня доверия\n\n1. **Supervised** — агент предлагает, человек подтверждает\n2. **Semi-auto** — агент действует, человек проверяет результат\n3. **Autonomous** — агент действует и отчитывается" },
  { id: 27, title: "Trust boundaries checklist",                             type: "technique", week: 6, lessonId: 11, lessonTopic: "Безопасность",    url: "#", markdownContent: "## Trust Boundaries Checklist\n\n- [ ] Scope файловой системы ограничен\n- [ ] Деструктивные действия требуют подтверждения\n- [ ] Секреты не передаются в промпт\n- [ ] Stop conditions заданы" },
  // РЕСУРСЫ
  { id: 28, title: "skills_v2.csv — Skill Matrix",                          type: "resource",  week: 1, lessonId: 1,  lessonTopic: "Все недели",      url: "#", description: "CSV-файл с матрицей 10 навыков × 3 уровня" },
  { id: 29, title: "assignments_v2.csv — структура ДЗ",                     type: "resource",  week: 1, lessonId: 2,  lessonTopic: "Все недели",      url: "#", description: "CSV со всеми домашними заданиями и рубриками" },
  { id: 30, title: "lessons_v2.csv — расписание",                           type: "resource",  week: 1, lessonId: 1,  lessonTopic: "Все недели",      url: "#", description: "12 уроков с датами и темами" },
  { id: 31, title: "11_PEDAGOGY.md — методология",                          type: "resource",  week: 1, lessonId: 1,  lessonTopic: "Все недели",      url: "#", description: "Полная методологическая документация буткемпа" },
  { id: 32, title: "Google Drive — все материалы",                           type: "resource",  week: 1, lessonId: 1,  lessonTopic: "Все недели",      url: "#", description: "Общая папка с записями, шаблонами и ДЗ" },
];

function matchesSearch(m: Material, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    m.title.toLowerCase().includes(lower) ||
    (m.description ?? "").toLowerCase().includes(lower) ||
    m.lessonTopic.toLowerCase().includes(lower) ||
    (m.markdownContent ?? "").toLowerCase().includes(lower)
  );
}

export default function MaterialsPage() {
  const materialUrls = useMaterialUrls();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [activeWeek, setActiveWeek] = useState<WeekValue>(0);

  const materials = useMemo(
    () => MATERIALS.map((m) => ({ ...m, url: materialUrls[m.id] ?? "" })),
    [materialUrls]
  );

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesTab = activeTab === "all" || m.type === activeTab;
      const matchesWeek = activeWeek === 0 || m.week === activeWeek;
      return matchesTab && matchesWeek && matchesSearch(m, searchQuery);
    });
  }, [materials, searchQuery, activeTab, activeWeek]);

  // Counts per type for the current week+search (tab-agnostic)
  const tabCounts = useMemo(() => {
    const base = materials.filter(
      (m) =>
        (activeWeek === 0 || m.week === activeWeek) &&
        matchesSearch(m, searchQuery)
    );
    return {
      all:       base.length,
      video:     base.filter((m) => m.type === "video").length,
      template:  base.filter((m) => m.type === "template").length,
      technique: base.filter((m) => m.type === "technique").length,
      resource:  base.filter((m) => m.type === "resource").length,
    };
  }, [materials, searchQuery, activeWeek]);

  const resetFilters = () => {
    setActiveTab("all");
    setActiveWeek(0);
    setSearchQuery("");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Каталог материалов</h1>
        <p className="text-sm text-[#71717a] mt-1">
          {MATERIALS.length} материалов · 6 недель
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Поиск по материалам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 pl-10 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
        />
      </div>

      {/* Type tabs */}
      <MaterialTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Week filter pills */}
      <WeekFilterPills activeWeek={activeWeek} onWeekChange={setActiveWeek} />

      {/* Results count */}
      <p className="text-sm text-zinc-500 mb-4">
        {filtered.length} материалов
        {searchQuery ? ` по запросу «${searchQuery}»` : ""}
      </p>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <MaterialsEmptyState onReset={resetFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </div>
      )}
    </div>
  );
}
