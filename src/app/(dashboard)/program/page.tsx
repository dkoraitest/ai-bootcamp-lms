"use client";

import { useEffect, useState } from "react";
import ProgramProgressBar from "@/components/program/ProgramProgressBar";
import WeekBlock from "@/components/program/WeekBlock";
import { type AssignmentData } from "@/components/program/AssignmentCard";
import { useLessonUrls } from "@/lib/hooks/useContentUrls";
import { useCohortSchedule, useAssignmentMaterials } from "@/lib/hooks/useContentUrls";
import { useUser } from "@/lib/hooks/useUser";
import { useCohort } from "@/lib/cohort/CohortProvider";
import { createClient } from "@/lib/supabase/client";

type SubmissionRow = {
  assignment_id: number;
  status: AssignmentData["status"];
  github_url: string | null;
  video_url: string | null;
};

type LessonStatus = "completed" | "watching" | "locked";

type ProgressRow = {
  lesson_id: string;
  status: string;
};

// Запасная программа на случай, если расписание потока ещё не заполнено:
// даты, темы и недели приходят из cohort_lesson_schedule и перекрывают эти.
const LESSONS = [
  { id: 1,  week: 1, date: "06.08.2026", topic: "Что такое вайб кодинг + лестница автономии",   hasHw: true,  hwNumber: 1,  status: "locked" as const, videoUrl: "#" },
  { id: 2,  week: 2, date: "11.08.2026", topic: "Рабочее место: VS Code, папки, settings.json", hasHw: false,                status: "locked" as const, videoUrl: "#" },
  { id: 3,  week: 2, date: "13.08.2026", topic: "Личный контекст и первый проект",              hasHw: true,  hwNumber: 2,  status: "locked" as const, videoUrl: "#" },
  { id: 4,  week: 3, date: "18.08.2026", topic: "Цикл на полную: 3 принципа + публичная ссылка", hasHw: false,               status: "locked"    as const, videoUrl: "#" },
  { id: 5,  week: 3, date: "20.08.2026", topic: "Свои инструменты: slash и skill",              hasHw: true,  hwNumber: 3,  status: "locked"    as const, videoUrl: "#" },
  { id: 6,  week: 4, date: "25.08.2026", topic: "Руки агента: MCP и внешние системы",           hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 7,  week: 4, date: "27.08.2026", topic: "Память агента: четыре уровня",                 hasHw: true,  hwNumber: 4,  status: "locked"    as const, videoUrl: "#" },
  { id: 8,  week: 5, date: "01.09.2026", topic: "Безопасность выполнения",                      hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 9,  week: 5, date: "03.09.2026", topic: "Свой кейс: выбор и запуск",                    hasHw: true,  hwNumber: 5,  status: "locked"    as const, videoUrl: "#" },
  { id: 10, week: 6, date: "08.09.2026", topic: "Свой кейс: доведение до результата",           hasHw: true,  hwNumber: 6,  status: "locked"    as const, videoUrl: "#" },
  { id: 11, week: 6, date: "10.09.2026", topic: "Мультиагент обзорно + подготовка защиты",      hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 12, week: 7, date: "15.09.2026", topic: "Demo Day · Защита проектов",  hasHw: true, hwNumber: 7, isDemoDay: true, status: "locked" as const, videoUrl: "#" },
];

// Две фазы: сетап (занятия 1-3) и задачи в собранной системе (4-12).
const WEEK_THEMES: Record<number, string> = {
  1: "Сетап · с чего начинается вайб кодинг",
  2: "Сетап · рабочее место и личный контекст",
  3: "Задачи · цикл и свои инструменты",
  4: "Задачи · руки и память агента",
  5: "Задачи · безопасность и свой кейс",
  6: "Задачи · результат и подготовка защиты",
  7: "Demo Day",
};

const TECHNIQUES: Record<number, string[]> = {
  1:  ["Формула Сцена + Задача + Правила", "Лестница автономии: чат → Cowork → код", "Границы вайб-кодинга"],
  2:  ["Claude Code из терминала в VS Code", "Папка Claude Projects и служебная ~/.claude", "settings.json: модель, effort, алиасы"],
  3:  ["Глобальный CLAUDE.md: 5 разделов", "Первый проект в правильном месте", "git init и первый коммит"],
  4:  ["3 принципа вайб-кодинга", "Деплой публичной ссылки", "Коммит перед агент-сессией"],
  5:  ["Четыре примитива Claude Code", "Slash-команды", "Skills под свои задачи"],
  6:  ["MCP к своей системе", "Права доступа и read-only", "Аудит подключений"],
  7:  ["4 уровня памяти", "Правило «поднимайся когда упёрся»", "База знаний и RAG"],
  8:  ["Security audit: 4 вопроса", "Хуки guard и log", "Секреты, .env и .gitignore"],
  9:  ["Выбор доменного кейса", "Запуск на своих данных", "Публичная фиксация перекличкой"],
  10: ["Доведение кейса до результата", "Артефакт результата", "Peer review"],
  11: ["Мультиагент: когда нужен, когда нет", "Структура питча", "Репетиция минуты"],
  12: [],
};

const ASSIGNMENTS: Record<number, AssignmentData> = {
  1: {
    hwNumber: 1,
    title: "Сводка через Cowork + своя рутина по формуле",
    description: "Сделайте сводку через Cowork на общих данных в папке svodka/ и опишите свою рабочую рутину промптом по формуле Сцена + Задача + Правила. Промпт покажите в общем чате потока.",
    deadline: "13.08.2026, 12:00",
    daysLeft: 3,
    deliverables: [
      "Файл сводки, созданный Cowork в общей папке svodka/ (скрин или запись экрана)",
      "Промпт под свою рутину по формуле Сцена + Задача + Правила",
    ],
    checklist: [
      "Cowork запускается",
      "Сводка по общим данным получена",
      "Промпт написан по формуле Сцена + Задача + Правила",
      "Промпт выложен в чат, двое участников откликнулись",
    ],
    rubric: [
      { level: "Базовый",  description: "Сводка получена, промпт написан по формуле" },
      { level: "Хороший",  description: "Рутина реальная из вашей работы, все три слота формулы заполнены" },
      { level: "Отличный", description: "Промпт доработан по замечаниям из чата" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  3: {
    hwNumber: 2,
    title: "Рабочий сетап — восемь галочек",
    description: "Собрать систему, в которой вы делаете проекты и переключаете модели. Восемь пунктов, каждый проверяется скриншотом: либо есть, либо нет. Почти всё делается в эфире на Лайвах 2 и 3, дома остаётся добить хвосты.",
    deadline: "15.08.2026, 12:00",
    daysLeft: 6,
    deliverables: [
      "Скрин структуры папок",
      "Скрин settings.json",
      "Скрин переключения модели на живой задаче",
      "Первый проект с git-коммитом",
    ],
    checklist: [
      "Claude Code стартует из терминала внутри VS Code",
      "Заведена папка Claude Projects, проекты лежат только там",
      "В служебной ~/.claude проектов нет",
      "settings.json настроен: модель, effort, список моделей",
      "Переключение модели проверено на живой задаче, разница видна",
      "Глобальный CLAUDE.md заполнен, пять разделов, конкретика вместо общих слов",
      "Первый проект создан в правильном месте, в нём свой CLAUDE.md",
      "В проекте git init и хотя бы один коммит",
    ],
    rubric: [
      { level: "Базовый",  description: "Инструмент запускается, папки разложены" },
      { level: "Хороший",  description: "settings.json свой, переключение модели проверено руками" },
      { level: "Отличный", description: "CLAUDE.md написан под свою работу, первый проект уже рабочий" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  5: {
    hwNumber: 3,
    title: "Публичная ссылка + своя команда",
    description: "Собрать и опубликовать результат, применив три принципа вайб-кодинга, и завернуть повторяющееся действие в свою slash-команду.",
    deadline: "25.08.2026, 12:00",
    daysLeft: 16,
    deliverables: [
      "Ссылка на задеплоенную страницу, открывается у постороннего",
      "git-репо от 4 коммитов",
      "Рабочая slash-команда",
    ],
    checklist: [
      "Страница открывается по живой ссылке у постороннего человека",
      "В репозитории минимум 4 коммита",
      "Slash-команда вызывается и даёт результат",
      "Ссылка опубликована в общем чате",
    ],
    rubric: [
      { level: "Базовый",  description: "Страница открывается, репозиторий с историей есть" },
      { level: "Хороший",  description: "Применены три принципа, это видно в комментарии" },
      { level: "Отличный", description: "Команда закрывает реальную повторяющуюся задачу" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  7: {
    hwNumber: 4,
    title: "MCP к своей системе + база знаний",
    description: "Подключить агента к своим источникам и выбрать уровень памяти под задачу по правилу «поднимайся когда упёрся».",
    deadline: "01.09.2026, 12:00",
    daysLeft: 23,
    deliverables: [
      "Скрин работающего MCP на своих данных",
      "Описание, какой уровень памяти выбран и почему",
    ],
    checklist: [
      "MCP подключён и делает запросы к своей системе",
      "Права проверены, лишнего доступа нет",
      "База знаний подключена",
      "Выбор уровня памяти объяснён",
      "Дано peer review в общем чате",
    ],
    rubric: [
      { level: "Базовый",  description: "MCP подключён, запросы проходят" },
      { level: "Хороший",  description: "Работает на своих данных, уровень памяти выбран осознанно" },
      { level: "Отличный", description: "Связка закрывает реальную рабочую задачу" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  9: {
    hwNumber: 5,
    title: "Защищённый агент + зафиксированный кейс",
    description: "Ограничить права агента двумя хуками и публично зафиксировать задачу, которая станет финальным проектом.",
    deadline: "08.09.2026, 12:00",
    daysLeft: 30,
    deliverables: [
      "Два хука установлены и проверены: rm -rf блокируется",
      "Публично зафиксированный кейс в чате",
    ],
    checklist: [
      "Хук guard установлен, опасная команда блокируется",
      "Хук log установлен и пишет",
      "Security audit пройден",
      "Кейс назван в общем чате",
    ],
    rubric: [
      { level: "Базовый",  description: "Хуки стоят, блокировка проверена" },
      { level: "Хороший",  description: "Кейс зафиксирован и понятен со стороны" },
      { level: "Отличный", description: "Кейс на своих данных, объём реалистичен к защите" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  10: {
    hwNumber: 6,
    title: "Рабочий кейс на своих данных",
    description: "Довести зафиксированный кейс до измеримого результата. Это ядро финального демо.",
    deadline: "15.09.2026, 12:00",
    daysLeft: 37,
    deliverables: [
      "Ссылка на git-репозиторий",
      "Видео 2–3 минуты",
      "Артефакт результата: отчёт, контент, лиды",
    ],
    checklist: [
      "Кейс работает на собственных данных, не на учебных",
      "Есть видимый результат",
      "Видео снято",
      "Дано peer review двум участникам потока",
    ],
    rubric: [
      { level: "Базовый",  description: "Кейс запущен, результат показан" },
      { level: "Хороший",  description: "Результат измеримый, данные реальные" },
      { level: "Отличный", description: "Артефакт качественный, можно показать в портфолио" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  12: {
    hwNumber: 7,
    title: "Финальный проект и защита",
    description: "Питч 5 минут на демо-дне плюс 3 минуты вопросов, рабочий проект за ним.",
    deadline: "15.09.2026, 14:30",
    daysLeft: 37,
    deliverables: [
      "Питч 5 минут на демо-дне",
      "Рабочий проект",
      "Согласие на check-in через 30 дней",
    ],
    checklist: [
      "Питч собран по структуре: задача, решение, демо, результат",
      "Проект работает и показывается вживую",
      "Занят слот демо-дня",
      "Дано согласие на check-in через 30 дней",
    ],
    rubric: [
      { level: "Базовый",  description: "Проект показан, питч уложен в регламент" },
      { level: "Хороший",  description: "Виден результат на своих данных" },
      { level: "Отличный", description: "Агент используется в работе регулярно" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
};


export default function ProgramPage() {
  const lessonUrls = useLessonUrls();
  const { lessonSchedule, assignmentSchedule, loading: scheduleLoading } = useCohortSchedule();
  const materialsByHw = useAssignmentMaterials();
  const { user } = useUser();
  const { activeCohortId, isPrivileged } = useCohort();
  const [submissionsByHw, setSubmissionsByHw] = useState<
    Record<number, SubmissionRow>
  >({});
  const [progressByLesson, setProgressByLesson] = useState<Record<number, LessonStatus>>({});
  const [lessonUuidByNumber, setLessonUuidByNumber] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user?.id || !activeCohortId) {
      setSubmissionsByHw({});
      setProgressByLesson({});
      setLessonUuidByNumber({});
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const [{ data: subData, error: subError }, { data: progData }, { data: lessonData }] = await Promise.all([
        supabase.rpc("get_my_assignment_submissions", {
          p_cohort_id: activeCohortId,
        }),
        supabase
          .from("student_progress")
          .select("lesson_id, status")
          .eq("user_id", user.id)
          .eq("cohort_id", activeCohortId),
        supabase.from("lessons").select("id, lesson_number"),
      ]);

      if (cancelled) return;

      if (!subError && subData) {
        const map: Record<number, SubmissionRow> = {};
        for (const row of subData as SubmissionRow[]) {
          map[row.assignment_id] = row;
        }
        setSubmissionsByHw(map);
      }

      if (progData) {
        const lessonNumberById = new Map(
          (lessonData ?? []).map((lesson) => [lesson.id as string, lesson.lesson_number as number])
        );
        const map: Record<number, LessonStatus> = {};
        for (const row of progData as ProgressRow[]) {
          const lessonNumber = lessonNumberById.get(row.lesson_id);
          if (lessonNumber) {
            map[lessonNumber] = row.status === "completed"
              ? "completed"
              : row.status === "watching"
              ? "watching"
              : "locked";
          }
        }
        setProgressByLesson(map);
      }

      const uuidMap: Record<number, string> = {};
      for (const lesson of lessonData ?? []) {
        uuidMap[lesson.lesson_number as number] = lesson.id as string;
      }
      setLessonUuidByNumber(uuidMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCohortId, user?.id]);

  async function handleStatusChange(lessonNumber: number, status: LessonStatus) {
    if (!user?.id || !activeCohortId) return;
    const lessonId = lessonUuidByNumber[lessonNumber];
    if (!lessonId) return;
    const supabase = createClient();

    setProgressByLesson((prev) => ({ ...prev, [lessonNumber]: status }));

    if (status === "locked") {
      await supabase
        .from("student_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("cohort_id", activeCohortId)
        .eq("lesson_id", lessonId);
      setProgressByLesson((prev) => {
        const next = { ...prev };
        delete next[lessonNumber];
        return next;
      });
    } else {
      await supabase
        .from("student_progress")
        .upsert(
          { user_id: user.id, cohort_id: activeCohortId, lesson_id: lessonId, status },
          { onConflict: "cohort_id,user_id,lesson_id" }
        );
    }
  }

  const scheduleByLesson = new Map(lessonSchedule.map((row) => [row.lesson_number, row]));
  const scheduleByHw = new Map(assignmentSchedule.map((row) => [row.hw_number, row]));
  const assignments: Record<number, AssignmentData> = Object.fromEntries(
    Object.entries(ASSIGNMENTS)
      // Неопубликованное ДЗ студент не видит и в программе тоже — иначе
      // «скрыть» в админке прячет его на одном экране и оставляет на другом.
      .filter(([, a]) => {
        if (isPrivileged) return true;
        if (submissionsByHw[a.hwNumber]) return true;
        return Boolean(scheduleByHw.get(a.hwNumber)?.is_released);
      })
      .map(([lessonId, a]) => {
      const schedule = scheduleByHw.get(a.hwNumber);
      const deadline = schedule?.is_released && schedule.deadline
        ? new Date(schedule.deadline).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Дата уточняется";
      const materials = materialsByHw[a.hwNumber];
      const sub = submissionsByHw[a.hwNumber];
      if (!sub) return [lessonId, { ...a, deadline, materials }];
      return [
        lessonId,
        {
          ...a,
          deadline,
          materials,
          status: sub.status,
          githubUrl: sub.github_url ?? a.githubUrl,
          videoUrl: sub.video_url ?? a.videoUrl,
        },
      ];
    })
  );

  // Список уроков строится из расписания потока, а не из зашитой программы:
  // у потока может быть любое число занятий, и всё сверх зашитого списка
  // иначе не отрисовалось бы вовсе.
  const lessonBase = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
  const lessonNumbers = Array.from(
    new Set([...LESSONS.map((l) => l.id), ...lessonSchedule.map((s) => s.lesson_number)])
  ).sort((a, b) => a - b);

  const lessons = lessonNumbers.map((lessonNumber) => {
    const base = lessonBase.get(lessonNumber);
    const l = base ?? {
      id: lessonNumber,
      // Две встречи в неделю, поэтому номер недели — это половина номера урока.
      week: Math.ceil(lessonNumber / 2),
      date: "Дата уточняется",
      topic: `Урок ${lessonNumber}`,
      hasHw: false,
      status: "locked" as const,
      videoUrl: "#",
    };
    const schedule = scheduleByLesson.get(l.id);
    const isReleased = Boolean(schedule?.is_released);
    const lessonDate = schedule?.lesson_date
      ? new Date(`${schedule.lesson_date}T00:00:00`)
      : null;
    const date = lessonDate
      ? lessonDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "Дата уточняется";

    let status: LessonStatus;
    if (progressByLesson[l.id] !== undefined) {
      status = progressByLesson[l.id];
    } else if (isReleased) {
      status = "watching";
    } else {
      status = "locked";
    }

    return {
      ...l,
      date,
      topic: schedule?.topic_override ?? schedule?.title_override ?? l.topic,
      videoUrl: lessonUrls[l.id] ?? "",
      status,
    };
  });

  const completedCount = lessons.filter((l) => l.status === "completed").length;

  // Недели берутся из уроков потока, а не из зашитых шести.
  const weeks = Array.from(new Set(lessons.map((l) => l.week))).sort((a, b) => a - b);
  const weekWord = weeks.length === 1 ? "неделя" : weeks.length < 5 ? "недели" : "недель";

  if (scheduleLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-zinc-100" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-white border border-zinc-200" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Программа</h1>
        <p className="text-sm text-[#71717a] mt-1">
          {weeks.length} {weekWord} · {lessons.length} занятий · {assignmentSchedule.length || 6} домашних заданий
        </p>
      </div>

      <ProgramProgressBar completed={completedCount} total={lessons.length} />

      <div className="flex flex-col gap-3">
        {weeks.map((week) => (
          <WeekBlock
            key={week}
            weekNumber={week}
            theme={WEEK_THEMES[week]}
            lessons={lessons.filter((l) => l.week === week)}
            techniques={TECHNIQUES}
            assignments={assignments}
            defaultOpen={week === 1}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
