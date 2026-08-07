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
  { id: 1,  week: 1, date: "06.08.2026", topic: "Что такое вайб кодинг + лестница автономии",   hasHw: false,                status: "locked" as const, videoUrl: "#" },
  { id: 2,  week: 1, date: "11.08.2026", topic: "Цикл вайб-кодинга + экономика",                 hasHw: true,  hwNumber: 1,  status: "locked" as const, videoUrl: "#" },
  { id: 3,  week: 2, date: "13.08.2026", topic: "Кодинг-агент: от разового ответа к инструменту", hasHw: false,               status: "locked" as const, videoUrl: "#" },
  { id: 4,  week: 2, date: "18.08.2026", topic: "Цикл на полную: 3 принципа + публичная ссылка", hasHw: true,  hwNumber: 2,  status: "locked"    as const, videoUrl: "#" },
  { id: 5,  week: 3, date: "20.08.2026", topic: "Контекст агента: CLAUDE.md и структура папок",  hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 6,  week: 3, date: "25.08.2026", topic: "Расширения агента: slash и skill",              hasHw: true,  hwNumber: 3,  status: "locked"    as const, videoUrl: "#" },
  { id: 7,  week: 4, date: "27.08.2026", topic: "Руки агента: MCP и внешние системы",            hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 8,  week: 4, date: "01.09.2026", topic: "Память агента: четыре уровня",                  hasHw: true,  hwNumber: 4,  status: "locked"    as const, videoUrl: "#" },
  { id: 9,  week: 5, date: "03.09.2026", topic: "Свой кейс: выбор и запуск",                     hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 10, week: 5, date: "08.09.2026", topic: "Свой кейс: доведение до результата",            hasHw: true,  hwNumber: 5,  status: "locked"    as const, videoUrl: "#" },
  { id: 11, week: 6, date: "10.09.2026", topic: "Дисциплина: безопасность + мультиагент обзорно", hasHw: false,               status: "locked"    as const, videoUrl: "#" },
  { id: 12, week: 6, date: "15.09.2026", topic: "Demo Day · Защита проектов",  hasHw: false, isDemoDay: true, status: "locked" as const, videoUrl: "#" },
];

const WEEK_THEMES: Record<number, string> = {
  1: "Вайб кодинг: формула и лестница",
  2: "Кодинг-агент и первый продукт",
  3: "Контекст агента и расширения",
  4: "Руки и память агента",
  5: "Своя задача в деле",
  6: "Дисциплина и защита",
};

const TECHNIQUES: Record<number, string[]> = {
  1:  ["Формула Сцена + Задача + Правила", "Лестница автономии: чат → Cowork → код", "Границы вайб-кодинга"],
  2:  ["Цикл промпт → результат → оценка → итерация", "Экономика лимитов", "Возврат в прерванную сессию"],
  3:  ["Скрипт вместо разового ответа", "Проверка на вторых данных", "git как страховка и откат"],
  4:  ["3 принципа вайб-кодинга", "Деплой публичной ссылки", "Коммит перед агент-сессией"],
  5:  ["CLAUDE.md: 5 разделов", "Структура папок проекта", "Контекст как материал"],
  6:  ["Четыре примитива Claude Code", "Slash-команды", "Skills под свои задачи"],
  7:  ["MCP к своей системе", "Права доступа и read-only", "Аудит подключений"],
  8:  ["4 уровня памяти", "Правило «поднимайся когда упёрся»", "База знаний и RAG"],
  9:  ["Выбор доменного кейса", "Запуск на своих данных", "Публичная фиксация"],
  10: ["Доведение кейса до результата", "Артефакт результата", "Peer review"],
  11: ["Security audit: 4 вопроса", "Хуки guard и log", "Мультиагент: когда нужен"],
  12: [],
};

const ASSIGNMENTS: Record<number, AssignmentData> = {
  2: {
    hwNumber: 1,
    title: "Сводка через Cowork + своя рутина по формуле",
    description: "Сделайте сводку через Cowork на общих данных в папке svodka/ и опишите свою рабочую рутину промптом по формуле Сцена + Задача + Правила. Промпт покажите в общем чате потока.",
    deadline: "17.08.2026, понедельник 12:00",
    daysLeft: 11,
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
  4: {
    hwNumber: 2,
    title: "Скрипт + задеплоенная страница",
    description: "Доведите скрипт из Лайва 3 до работы на двух разных папках и задеплойте страницу, которая открывается у постороннего человека.",
    deadline: "24.08.2026, понедельник 12:00",
    daysLeft: 18,
    deliverables: [
      "Публичная ссылка на страницу (открывается у постороннего)",
      "git-репо с историей минимум 4 коммита",
      "Скрипт из Лайва 3, отработавший на двух разных папках",
      "Описание своей рабочей задачи по формуле",
    ],
    checklist: [
      "Страница открывается по живой ссылке",
      "Скрипт отработал на второй папке без правок",
      "git-репо инициализирован, есть коммит перед агент-сессией",
      "Ссылка опубликована в общем канале",
    ],
    rubric: [
      { level: "Базовый",  description: "Страница открывается, репозиторий с историей есть" },
      { level: "Хороший",  description: "Применён хотя бы один из трёх принципов вайб-кодинга, это видно в комментарии" },
      { level: "Отличный", description: "Скрипт решает реальную задачу и переиспользуется на своих данных" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  6: {
    hwNumber: 3,
    title: "Личная ОС в CLAUDE.md + 2 Skills",
    description: "Соберите личную ОС в CLAUDE.md (5 разделов по шаблону) и напишите 2 рабочих Skill под свои регулярные задачи. Один из них — апгрейд промпта из первой недели.",
    deadline: "30.08.2026, воскресенье 23:59",
    daysLeft: 24,
    deliverables: ["Ссылка на git-репо с CLAUDE.md и двумя Skills"],
    checklist: [
      "CLAUDE.md содержит все 5 разделов, минимум по 2 строки на раздел",
      "MCP audit пройден, лишнее отключено",
      "2 Skill реально вызываются и дают результат",
      "Хотя бы один Skill — апгрейд промпта из первой недели",
      "Дано peer review двум любым участникам потока",
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
    description: "Разверните ресёрч-агента с одним MCP и одной базой знаний под свою задачу. Уровень доверия — read-only.",
    deadline: "06.09.2026, воскресенье 23:59",
    daysLeft: 31,
    deliverables: ["Видео-демо агента на 1 минуту: вопрос → ответ по документам плюс веб-поиск"],
    checklist: [
      "Подключён 1 MCP, он реально делает запросы",
      "Подключена база знаний: свои документы или Notion",
      "Уровень доверия read-only, hard writes отсутствуют",
      "Видео-демо снято",
    ],
    rubric: [
      { level: "Базовый",  description: "MCP подключён, агент отвечает на один запрос" },
      { level: "Хороший",  description: "Агент отвечает по своим документам и даёт релевантные ответы" },
      { level: "Отличный", description: "Связка работает на реальной задаче, можно использовать в работе" },
    ],
    status: "not_started",
    githubUrl: "",
    videoUrl: "",
  },
  10: {
    hwNumber: 5,
    title: "Доменный кейс",
    description: "Разверните один кейс из своей доменной зоны: Claude Code плюс хотя бы один MCP и база знаний. Это ядро финального демо.",
    deadline: "13.09.2026, воскресенье 23:59",
    daysLeft: 38,
    deliverables: [
      "Ссылка на git-репозиторий",
      "Видео-демо (2–3 минуты)",
      "Артефакт результата: отчёт, контент, список лидов",
    ],
    checklist: [
      "Кейс работает на собственных данных, не на учебных",
      "Использован минимум один MCP и минимум один источник знаний",
      "Есть видимый результат: отчёт, контент, лиды или транскрипт",
      "Дано peer review двум любым участникам потока",
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


export default function ProgramPage() {
  const lessonUrls = useLessonUrls();
  const { lessonSchedule, assignmentSchedule, loading: scheduleLoading } = useCohortSchedule();
  const materialsByHw = useAssignmentMaterials();
  const { user } = useUser();
  const { activeCohortId } = useCohort();
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
    Object.entries(ASSIGNMENTS).map(([lessonId, a]) => {
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
