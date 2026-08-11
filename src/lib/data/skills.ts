// Карта компетенций AI Agent Bootcamp.
// Привязка к занятиям и ДЗ пересобрана под программу двух фаз (сетап, затем
// задачи) и семь ДЗ. Названия и определения навыков ждут обновления
// skills_v2.csv в проекте содержания — там матрица ещё от первой версии.
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
    lessons: [1],
    hw: null,
    description: "Мыслить задачами для агента и делегировать рутину вместо ручной работы.",
  },
  {
    id: 2,
    name: "Промпт-инжиниринг",
    shortName: "Промпты",
    emoji: "✍️",
    week: 1,
    lessons: [1],
    hw: 1,
    description: "Формула «Сцена + Задача + Правила» и управляемые результаты агента.",
  },
  {
    id: 3,
    name: "Рабочее место агента",
    shortName: "Сетап",
    emoji: "🧰",
    week: 2,
    lessons: [2],
    hw: 2,
    description: "VS Code, структура папок и settings.json: система, не зависящая от модели.",
  },
  {
    id: 4,
    name: "Контекст и Skills",
    shortName: "Контекст",
    emoji: "📄",
    week: 2,
    lessons: [3, 5],
    hw: 3,
    description: "CLAUDE.md как операционная система агента и свои команды со скиллами.",
  },
  {
    id: 5,
    name: "Vibe Coding",
    shortName: "Vibe coding",
    emoji: "💻",
    week: 3,
    lessons: [4],
    hw: 3,
    description: "Три принципа вайб-кодинга и публикация результата по живой ссылке.",
  },
  {
    id: 6,
    name: "MCP и внешние системы",
    shortName: "MCP",
    emoji: "🔌",
    week: 4,
    lessons: [6],
    hw: 4,
    description: "Подключение агента к своим системам и работа с правами доступа.",
  },
  {
    id: 7,
    name: "Память агента и RAG",
    shortName: "Память",
    emoji: "🧠",
    week: 4,
    lessons: [7],
    hw: 4,
    description: "Четыре уровня памяти и выбор нужного по правилу «поднимайся когда упёрся».",
  },
  {
    id: 8,
    name: "Безопасность выполнения",
    shortName: "Безопасность",
    emoji: "🛡",
    week: 5,
    lessons: [8],
    hw: 5,
    description: "Хуки, ограничение прав и security audit перед запуском в работу.",
  },
  {
    id: 9,
    name: "Доменное применение",
    shortName: "Домен",
    emoji: "🎯",
    week: 5,
    lessons: [9, 10],
    hw: 6,
    description: "Решение реальной задачи своего домена на собственных данных.",
  },
  {
    id: 10,
    name: "Презентация решений",
    shortName: "Demo Day",
    emoji: "🏆",
    week: 7,
    lessons: [11, 12],
    hw: 7,
    description: "Упаковка и защита итогового кейса на Demo Day.",
  },
];

