"use client";

import { useEffect, useState } from "react";
import ProgramProgressBar from "@/components/program/ProgramProgressBar";
import WeekBlock from "@/components/program/WeekBlock";
import { type AssignmentData } from "@/components/program/AssignmentCard";
import { useLessonUrls } from "@/lib/hooks/useContentUrls";
import { useCohortSchedule } from "@/lib/hooks/useContentUrls";
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

const LESSONS = [
  { id: 1,  week: 1, date: "12.05.2026", topic: "AI Mindset: новая работа в эпоху агентов",             hasHw: false,                status: "locked" as const, videoUrl: "#" },
  { id: 2,  week: 1, date: "14.05.2026", topic: "Переход в Cowork: AI который делает",                   hasHw: true,  hwNumber: 1,  status: "locked" as const, videoUrl: "#" },
  { id: 3,  week: 2, date: "19.05.2026", topic: "Кодинг-агенты как класс. CC / Codex / IDE",             hasHw: false,                status: "locked" as const, videoUrl: "#" },
  { id: 4,  week: 2, date: "21.05.2026", topic: "Vibe coding: 3 принципа + первый mini-app",             hasHw: true,  hwNumber: 2,  status: "locked"    as const, videoUrl: "#" },
  { id: 5,  week: 3, date: "26.05.2026", topic: "Контекст как материал. R&D подход",                     hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 6,  week: 3, date: "28.05.2026", topic: "Skills и Commands: четыре примитива CC",                hasHw: true,  hwNumber: 3,  status: "locked"    as const, videoUrl: "#" },
  { id: 7,  week: 4, date: "02.06.2026", topic: "4 уровня памяти агента",                                hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 8,  week: 4, date: "04.06.2026", topic: "Доверие, git, безопасность — инструментальный финал",   hasHw: true,  hwNumber: 4,  status: "locked"    as const, videoUrl: "#" },
  { id: 9,  week: 5, date: "09.06.2026", topic: "Маркетинг + продажи (доменные кейсы)",                  hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 10, week: 5, date: "11.06.2026", topic: "Продукт + аналитика (доменные кейсы)",                  hasHw: true,  hwNumber: 5,  status: "locked"    as const, videoUrl: "#" },
  { id: 11, week: 6, date: "16.06.2026", topic: "Безопасный агент + multi-agent (обзор)",                hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 12, week: 6, date: "18.06.2026", topic: "Demo Day — Защита проектов",  hasHw: false, isDemoDay: true, status: "locked" as const, videoUrl: "#" },
];

const WEEK_THEMES: Record<number, string> = {
  1: "AI Mindset + Cowork",
  2: "Кодинг-агенты + Vibe coding",
  3: "Контекст + Skills",
  4: "Память + Инструментальный фундамент",
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
  7:  ["4 уровня памяти (L1-L4)", "Контекстное окно", "RAG vs Graph RAG"],
  8:  ["3 уровня доверия", "Git/GitHub минимум", "Безопасность 80/20", "Шаблон research-agent"],
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
    status: "not_started",
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
    title: "Ресёрч-агент на своей доменной задаче",
    description: "Форкните шаблон ресёрч-агента и адаптируйте под свою роль (sales / HR / marketing / etc). Уровень доверия — read-only.",
    deadline: "07.06.2026, воскресенье 23:59",
    daysLeft: 25,
    deliverables: ["Видео-демо настроенного агента на 3 запросах (1 мин)"],
    checklist: [
      "Форкнул шаблон через git clone",
      "Адаптировал CLAUDE.md под свою роль",
      "5-20 сущностей в data/known.csv",
      "Запустил /research на 3 запросах",
      "Видео снято",
    ],
    rubric: [
      { level: "Базовый",  description: "Шаблон форкнут, агент работает на 1 запросе" },
      { level: "Хороший",  description: "CLAUDE.md адаптирован, агент даёт релевантные ответы" },
      { level: "Отличный", description: "Шаблон под реальную задачу + 3+ кейса, можно использовать в работе" },
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


export default function ProgramPage() {
  const lessonUrls = useLessonUrls();
  const { lessonSchedule, assignmentSchedule, loading: scheduleLoading } = useCohortSchedule();
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
      const sub = submissionsByHw[a.hwNumber];
      if (!sub) return [lessonId, { ...a, deadline }];
      return [
        lessonId,
        {
          ...a,
          deadline,
          status: sub.status,
          githubUrl: sub.github_url ?? a.githubUrl,
          videoUrl: sub.video_url ?? a.videoUrl,
        },
      ];
    })
  );

  // Список уроков строится из расписания потока, а не только из программы
  // первого потока: у второго потока шестнадцать занятий, и уроки сверх
  // двенадцатого иначе не отрисовались бы вовсе.
  const lessonBase = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
  const lessonNumbers = Array.from(
    new Set([...LESSONS.map((l) => l.id), ...lessonSchedule.map((s) => s.lesson_number)])
  ).sort((a, b) => a - b);

  const lessons = lessonNumbers.map((lessonNumber) => {
    const base = lessonBase.get(lessonNumber);
    const l = base ?? {
      id: lessonNumber,
      // Две встречи в неделю: урок 13 — это пятая неделя восьминедельного потока.
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

  // Недели берутся из уроков потока: шесть у первого, восемь у второго.
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
