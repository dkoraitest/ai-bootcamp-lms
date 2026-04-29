import ProgramProgressBar from "@/components/program/ProgramProgressBar";
import WeekBlock from "@/components/program/WeekBlock";
import { type AssignmentData } from "@/components/program/AssignmentCard";

const LESSONS = [
  { id: 1,  week: 1, date: "12.05.2026", topic: "AI Mindset: новая работа в эпоху агентов",             hasHw: false,                status: "completed" as const, videoUrl: "#" },
  { id: 2,  week: 1, date: "14.05.2026", topic: "Переход в Cowork: AI который делает",                   hasHw: true,  hwNumber: 1,  status: "completed" as const, videoUrl: "#" },
  { id: 3,  week: 2, date: "19.05.2026", topic: "Кодинг-агенты как класс. CC / Codex / IDE",             hasHw: false,                status: "watching"  as const, videoUrl: "#" },
  { id: 4,  week: 2, date: "21.05.2026", topic: "Vibe coding: 3 принципа + первый mini-app",             hasHw: true,  hwNumber: 2,  status: "locked"    as const, videoUrl: "#" },
  { id: 5,  week: 3, date: "26.05.2026", topic: "Контекст как материал. R&D подход",                     hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 6,  week: 3, date: "28.05.2026", topic: "Skills и Commands: четыре примитива CC",                hasHw: true,  hwNumber: 3,  status: "locked"    as const, videoUrl: "#" },
  { id: 7,  week: 4, date: "02.06.2026", topic: "MCP и RAG: расширяем агента",                           hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 8,  week: 4, date: "04.06.2026", topic: "Автоматизации 24/7 и визуальное программирование",      hasHw: true,  hwNumber: 4,  status: "locked"    as const, videoUrl: "#" },
  { id: 9,  week: 5, date: "09.06.2026", topic: "Маркетинг + продажи (доменные кейсы)",                  hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 10, week: 5, date: "11.06.2026", topic: "Продукт + аналитика (доменные кейсы)",                  hasHw: true,  hwNumber: 5,  status: "locked"    as const, videoUrl: "#" },
  { id: 11, week: 6, date: "16.06.2026", topic: "Безопасный агент + multi-agent (обзор)",                hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 12, week: 6, date: "18.06.2026", topic: "Demo Day — Защита проектов",  hasHw: false, isDemoDay: true, status: "locked" as const, videoUrl: "#" },
];

const WEEK_THEMES: Record<number, string> = {
  1: "AI Mindset + Cowork",
  2: "Кодинг-агенты + Vibe coding",
  3: "Контекст + Skills",
  4: "MCP + Автоматизации",
  5: "Домен: Маркетинг + Продукт",
  6: "Безопасность + Demo Day",
};

const TECHNIQUES: Record<number, string[]> = {
  1:  ["Stage + Task + Rules формула", "AI Mindset framework", "Prompt-first подход"],
  2:  ["Cowork automation loop", "Task decomposition", "Output verification"],
  3:  ["CC vs Codex сравнение", "IDE integration patterns", "Agent scaffolding"],
  4:  ["3 принципа vibe coding", "Deploy flow", "Git-first workflow"],
  5:  ["CLAUDE.md структура", "Context layering", "R&D iteration loop"],
  6:  ["Skills anatomy", "Slash-команды", "Subagent patterns", "MCP overview"],
  7:  ["MCP connection flow", "RAG pipeline basics", "Knowledge base setup"],
  8:  ["3 уровня доверия", "24/7 agent loop", "Visual programming nodes"],
  9:  ["Marketing agent кейсы", "Lead gen automation", "Content pipeline"],
  10: ["Product analytics agent", "Data pipeline", "Insight generation"],
  11: ["Trust boundaries", "Multi-agent coordination", "Safety checklist"],
  12: [],
};

const ASSIGNMENTS: Record<number, AssignmentData> = {
  2: {
    hwNumber: 1,
    title: "Первая Cowork-автоматизация",
    description: "Возьмите одну свою рутинную задачу и автоматизируйте её в Cowork.",
    deadline: "25.05.2026, воскресенье 23:59",
    daysLeft: 4,
    deliverables: ["Короткое видео-демо (30 сек) или скриншот готовой автоматизации"],
    checklist: [
      "Задача выбрана и описана",
      "Автоматизация настроена в Cowork",
      "Результат снят на видео или скриншот",
    ],
    rubric: [
      { level: "Базовый",  description: "Автоматизация работает, результат показан" },
      { level: "Хороший",  description: "Задача реальная из вашей работы, есть описание зачем" },
      { level: "Отличный", description: "Измеримый результат, экономия времени указана" },
    ],
    status: "submitted",
    githubUrl: "",
    videoUrl: "",
  },
  4: {
    hwNumber: 2,
    title: "Задеплоенный mini-app",
    description: "Используя 3 принципа vibe coding, соберите и задеплойте простой веб-проект.",
    deadline: "01.06.2026, воскресенье 23:59",
    daysLeft: 11,
    deliverables: [
      "Живая ссылка на приложение",
      "Ссылка на git-репозиторий",
      "Пост в Telegram-чат курса",
    ],
    checklist: [
      "Приложение задеплоено и открывается по ссылке",
      "Репозиторий публичный",
      "Пост опубликован в чате",
    ],
    rubric: [
      { level: "Базовый",  description: "Приложение открывается, есть git-репо" },
      { level: "Хороший",  description: "Приложение решает реальную задачу, понятен UX" },
      { level: "Отличный", description: "Код чистый, есть README, приложение используется" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  6: {
    hwNumber: 3,
    title: "Личная ОС в CLAUDE.md + 2 Skills",
    description: "Создайте CLAUDE.md с 5 разделами и напишите 2 рабочих Skills.",
    deadline: "08.06.2026, воскресенье 23:59",
    daysLeft: 18,
    deliverables: ["Ссылка на git-репо с CLAUDE.md и Skills"],
    checklist: [
      "CLAUDE.md создан с 5 разделами",
      "Каждый раздел минимум 2 строки",
      "2 Skills написаны и работают",
    ],
    rubric: [
      { level: "Базовый",  description: "CLAUDE.md создан, Skills существуют" },
      { level: "Хороший",  description: "Skills решают реальные задачи" },
      { level: "Отличный", description: "Система персонализирована, Skills задокументированы" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  8: {
    hwNumber: 4,
    title: "Ресёрч-агент с MCP + RAG",
    description: "Подключите MCP и базу знаний к своему агенту.",
    deadline: "15.06.2026, воскресенье 23:59",
    daysLeft: 25,
    deliverables: ["Видео-демо агента с MCP и базой знаний в действии (1 мин)"],
    checklist: [
      "MCP подключён",
      "База знаний загружена",
      "Агент отвечает по вашим данным",
      "Видео снято",
    ],
    rubric: [
      { level: "Базовый",  description: "MCP подключён, агент отвечает" },
      { level: "Хороший",  description: "База знаний содержит ваши реальные данные" },
      { level: "Отличный", description: "Агент даёт нетривиальные ответы, демо убедительное" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  10: {
    hwNumber: 5,
    title: "Доменный кейс",
    description: "Запустите CC-агента в своей доменной зоне на собственных данных.",
    deadline: "22.06.2026, воскресенье 23:59",
    daysLeft: 32,
    deliverables: [
      "Ссылка на git-репозиторий",
      "Видео-демо (2–3 минуты)",
      "Артефакт результата: отчёт, контент, список лидов",
    ],
    checklist: [
      "Доменная зона выбрана",
      "Агент работает на реальных данных",
      "Измеримый результат получен",
      "Видео снято",
    ],
    rubric: [
      { level: "Базовый",  description: "Агент запущен в домене, результат показан" },
      { level: "Хороший",  description: "Результат измеримый, данные реальные" },
      { level: "Отличный", description: "Артефакт качественный, можно показать в портфолио" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
};

const WEEKS = [1, 2, 3, 4, 5, 6];
const completedCount = LESSONS.filter((l) => l.status === "completed").length;

export default function ProgramPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Программа</h1>
        <p className="text-sm text-[#71717a] mt-1">
          6 недель · 12 занятий · 6 домашних заданий
        </p>
      </div>

      <ProgramProgressBar completed={completedCount} total={LESSONS.length} />

      <div className="flex flex-col gap-3">
        {WEEKS.map((week) => (
          <WeekBlock
            key={week}
            weekNumber={week}
            theme={WEEK_THEMES[week]}
            lessons={LESSONS.filter((l) => l.week === week)}
            techniques={TECHNIQUES}
            assignments={ASSIGNMENTS}
            defaultOpen={week === 1}
          />
        ))}
      </div>
    </div>
  );
}
