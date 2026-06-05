// Карта компетенций AI Agent Bootcamp.
// Навыки выводятся автоматически из прогресса студента (просмотр уроков + сдача/проверка ДЗ),
// поэтому отдельной таблицы в БД не требуется.

export type SkillDef = {
  id: number;
  name: string;       // полное имя для карточки
  shortName: string;  // короткое имя для радара
  emoji: string;
  week: number;       // неделя программы, к которой относится навык
  lessons: number[];  // номера уроков, формирующих навык
  hw: number | null;  // номер связанного ДЗ (null — навык без ДЗ)
  description: string;
};

// Уровень владения навыком.
// 0 — не начат, 1 — теория (уроки просмотрены), 2 — практика (ДЗ сдано или
// для безДЗ-навыка все уроки пройдены), 3 — освоен (ДЗ проверено экспертом).
export type Mastery = 0 | 1 | 2 | 3;

export const MASTERY_LABELS: Record<Mastery, string> = {
  0: "Не начат",
  1: "Теория",
  2: "Практика",
  3: "Освоен",
};

export const SKILLS: SkillDef[] = [
  {
    id: 1,
    name: "AI Mindset и делегирование",
    shortName: "Mindset",
    emoji: "🧭",
    week: 1,
    lessons: [1, 2],
    hw: null,
    description: "Мыслить задачами для агента и делегировать рутину вместо ручной работы.",
  },
  {
    id: 2,
    name: "Промпт-инжиниринг",
    shortName: "Промпты",
    emoji: "✍️",
    week: 1,
    lessons: [2],
    hw: 1,
    description: "Формула «Сцена + Задача + Правила» и управляемые результаты агента.",
  },
  {
    id: 3,
    name: "Vibe Coding",
    shortName: "Vibe coding",
    emoji: "💻",
    week: 2,
    lessons: [3, 4],
    hw: 2,
    description: "Кодинг-агенты и сборка рабочего mini-app без глубокой разработки.",
  },
  {
    id: 4,
    name: "Контекст и Skills",
    shortName: "Контекст",
    emoji: "📄",
    week: 3,
    lessons: [5, 6],
    hw: 3,
    description: "CLAUDE.md как операционная система агента и кастомные Skills.",
  },
  {
    id: 5,
    name: "MCP и RAG",
    shortName: "MCP / RAG",
    emoji: "🔌",
    week: 4,
    lessons: [7, 8],
    hw: 4,
    description: "Подключение внешних инструментов и знаний к агенту через MCP.",
  },
  {
    id: 6,
    name: "Автоматизации 24/7",
    shortName: "Автоматизации",
    emoji: "⚙️",
    week: 4,
    lessons: [8],
    hw: null,
    description: "Фоновые процессы и визуальное программирование рабочих сценариев.",
  },
  {
    id: 7,
    name: "Доменное применение",
    shortName: "Домен",
    emoji: "🎯",
    week: 5,
    lessons: [9, 10],
    hw: 5,
    description: "Решение реальных задач своего домена: маркетинг, продажи, продукт.",
  },
  {
    id: 8,
    name: "Безопасный и multi-agent",
    shortName: "Безопасность",
    emoji: "🛡",
    week: 6,
    lessons: [11],
    hw: null,
    description: "Безопасная работа агента и оркестрация нескольких агентов.",
  },
  {
    id: 9,
    name: "Презентация решений",
    shortName: "Demo Day",
    emoji: "🏆",
    week: 6,
    lessons: [12],
    hw: 6,
    description: "Упаковка и защита итогового кейса на Demo Day.",
  },
];
