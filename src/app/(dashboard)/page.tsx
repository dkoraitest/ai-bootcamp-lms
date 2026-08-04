"use client";

import NextStepBanner from "@/components/dashboard/NextStepBanner";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import GamificationWidget from "@/components/dashboard/GamificationWidget";
import WeeklyGoalCard from "@/components/dashboard/WeeklyGoalCard";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import QuickLinks from "@/components/dashboard/QuickLinks";
import BootcampGoalsCard from "@/components/dashboard/BootcampGoalsCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUser } from "@/lib/hooks/useUser";
import { useStudentData } from "@/lib/hooks/useStudentData";
import { useCohort } from "@/lib/cohort/CohortProvider";
import { useCohortSchedule } from "@/lib/hooks/useContentUrls";

const LESSONS_SCHEDULE = [
  { number: 1,  date: new Date("2026-05-12"), dateStr: "12 мая, вторник",  time: "14:30 МСК", topic: "AI Mindset: новая работа в эпоху агентов" },
  { number: 2,  date: new Date("2026-05-14"), dateStr: "14 мая, четверг",  time: "18:00 МСК", topic: "Переход в Cowork: AI который делает" },
  { number: 3,  date: new Date("2026-05-19"), dateStr: "19 мая, вторник",  time: "14:30 МСК", topic: "Кодинг-агенты как класс. CC / Codex / IDE" },
  { number: 4,  date: new Date("2026-05-21"), dateStr: "21 мая, четверг",  time: "18:00 МСК", topic: "Vibe coding: 3 принципа + первый mini-app" },
  { number: 5,  date: new Date("2026-05-26"), dateStr: "26 мая, вторник",  time: "14:30 МСК", topic: "Контекст как материал. R&D подход" },
  { number: 6,  date: new Date("2026-05-28"), dateStr: "28 мая, четверг",  time: "18:00 МСК", topic: "Skills и Commands: четыре примитива CC" },
  { number: 7,  date: new Date("2026-06-02"), dateStr: "2 июня, вторник",  time: "14:30 МСК", topic: "4 уровня памяти агента" },
  { number: 8,  date: new Date("2026-06-04"), dateStr: "4 июня, четверг",  time: "18:00 МСК", topic: "Доверие, git, безопасность — инструментальный финал" },
  { number: 9,  date: new Date("2026-06-09"), dateStr: "9 июня, вторник",  time: "14:30 МСК", topic: "Маркетинг + продажи (доменные кейсы)" },
  { number: 10, date: new Date("2026-06-11"), dateStr: "11 июня, четверг", time: "18:00 МСК", topic: "Продукт + аналитика (доменные кейсы)" },
  { number: 11, date: new Date("2026-06-16"), dateStr: "16 июня, вторник", time: "14:30 МСК", topic: "Безопасный агент + multi-agent" },
  { number: 12, date: new Date("2026-06-18"), dateStr: "18 июня, четверг", time: "18:00 МСК", topic: "Demo Day — Защита проектов" },
];

const DEADLINES_SCHEDULE = [
  { hwNumber: 1, title: "Промпт-инжиниринг",    date: new Date("2026-05-17"), deadlineStr: "17 мая, воскресенье, 23:59" },
  { hwNumber: 2, title: "Mini-App деплой",        date: new Date("2026-05-24"), deadlineStr: "24 мая, воскресенье, 23:59" },
  { hwNumber: 3, title: "CLAUDE.md + Skills",     date: new Date("2026-05-31"), deadlineStr: "31 мая, воскресенье, 23:59" },
  { hwNumber: 4, title: "Ресёрч-агент",            date: new Date("2026-06-07"), deadlineStr: "7 июня, воскресенье, 23:59" },
  { hwNumber: 5, title: "Доменный кейс",          date: new Date("2026-06-14"), deadlineStr: "14 июня, воскресенье, 23:59" },
  { hwNumber: 6, title: "Demo Day презентация",   date: new Date("2026-06-21"), deadlineStr: "21 июня, воскресенье, 23:59" },
];

export default function HomePage() {
  const { user } = useUser();
  const { activeCohort, activeCohortId } = useCohort();
  const { lessonSchedule, assignmentSchedule, loading: scheduleLoading } = useCohortSchedule();
  const { data: studentData, loading } = useStudentData(user?.id);
  const userName = (user?.user_metadata?.name as string | undefined) ?? "Студент";

  const lessonsCompletedFromDb =
    studentData?.progress?.filter((p) => p.status === "completed").length ?? 0;
  const lessonsCompleted = user?.id && activeCohortId === "flow-1"
    ? Math.max(1, lessonsCompletedFromDb)
    : lessonsCompletedFromDb;
  const hwCompleted =
    studentData?.submissions?.filter(
      (s) => s.status === "submitted" || s.status === "reviewed"
    ).length ?? 0;

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const lessonByNumber = new Map(LESSONS_SCHEDULE.map((lesson) => [lesson.number, lesson]));
  const releasedLessons = lessonSchedule
    .filter((lesson) => lesson.is_released && lesson.lesson_date)
    .map((lesson) => ({
      ...lesson,
      date: new Date(`${lesson.lesson_date}T00:00:00`),
      source: lessonByNumber.get(lesson.lesson_number),
    }))
    .filter((lesson) => lesson.source);
  const nextLessonData = releasedLessons.find((lesson) => lesson.date >= today) ?? releasedLessons.at(-1);

  const deadlineByNumber = new Map(DEADLINES_SCHEDULE.map((deadline) => [deadline.hwNumber, deadline]));
  const releasedDeadlines = assignmentSchedule
    .filter((assignment) => assignment.is_released && assignment.deadline)
    .map((assignment) => ({
      ...assignment,
      date: new Date(assignment.deadline as string),
      source: deadlineByNumber.get(assignment.hw_number),
    }))
    .filter((assignment) => assignment.source);
  const nextDeadlineData = releasedDeadlines.find((deadline) => deadline.date >= today) ?? releasedDeadlines.at(-1);

  const daysLeft = nextDeadlineData
    ? Math.max(
        0,
        Math.ceil((nextDeadlineData.date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      )
    : 0;

  const nextLesson = {
    number: nextLessonData?.lesson_number ?? 0,
    date: nextLessonData?.date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) ?? "Дата уточняется",
    time: nextLessonData?.starts_at
      ? new Date(nextLessonData.starts_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      : "Время уточняется",
    topic: nextLessonData?.topic_override ?? nextLessonData?.source?.topic ?? "Расписание ещё не опубликовано",
  };

  const nextDeadline = {
    hwNumber: nextDeadlineData?.hw_number ?? 0,
    title: nextDeadlineData?.source?.title ?? "Расписание ещё не опубликовано",
    deadline: nextDeadlineData?.date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) ?? "Дата уточняется",
    daysLeft,
  };

  const cohortStart = activeCohort?.starts_at
    ? new Date(`${activeCohort.starts_at}T00:00:00`)
    : null;
  const hasCohortStart = Boolean(cohortStart && !Number.isNaN(cohortStart.getTime()));
  const daysInBootcamp = hasCohortStart
    ? Math.max(1, Math.ceil((now.getTime() - (cohortStart as Date).getTime()) / (24 * 60 * 60 * 1000)))
    : null;
  const weekNumber = daysInBootcamp === null
    ? null
    : Math.min(6, Math.max(1, Math.ceil(daysInBootcamp / 7)));

  const points = studentData?.gamification?.points ?? 0;
  const level = points >= 1001 ? 5 : points >= 601 ? 4 : points >= 301 ? 3 : points >= 101 ? 2 : 1;

  const LEVEL_NAMES: Record<number, string> = {
    1: "Новичок", 2: "Практик", 3: "Агент", 4: "Мастер", 5: "Эксперт",
  };
  const LEVEL_THRESHOLDS = [0, 101, 301, 601, 1001, Infinity];
  const levelName = LEVEL_NAMES[level] ?? "Новичок";
  const pointsToNext = LEVEL_THRESHOLDS[level] ?? 300;

  const badgeMetadata: Record<number, { name: string; emoji: string }> = {
    1: { name: "Первый старт", emoji: "🚀" },
    2: { name: "Prompt Master", emoji: "✍️" },
    3: { name: "Coworker", emoji: "🤖" },
    4: { name: "Vibe Coder", emoji: "💻" },
    5: { name: "Context King", emoji: "📄" },
    6: { name: "Skill Builder", emoji: "🛠" },
    7: { name: "Research Agent", emoji: "🔎" },
    8: { name: "5 в неделю", emoji: "🔥" },
    9: { name: "На старте", emoji: "⚡" },
    10: { name: "Domain Expert", emoji: "🎯" },
    11: { name: "Peer Reviewer", emoji: "👥" },
    12: { name: "Demo Day", emoji: "🏆" },
  };
  const lastBadgeEntry = studentData?.gamification?.badges?.at(-1);
  const lastBadge = lastBadgeEntry
    ? badgeMetadata[lastBadgeEntry.id] ?? { name: `Бейдж #${lastBadgeEntry.id}`, emoji: "🏅" }
    : { name: "Пока нет бейджей", emoji: "—" };

  if (scheduleLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-zinc-100" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Привет, {userName}! 👋
        </h1>
        <p className="text-sm text-[#71717a] mt-1">
          {daysInBootcamp === null
            ? "Период потока будет опубликован вместе с расписанием"
            : `День ${daysInBootcamp} · Неделя ${weekNumber} из 6`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NextStepBanner
          hwCompleted={hwCompleted}
          hwTotal={6}
          daysLeft={nextDeadline.daysLeft}
          hwNumber={nextDeadline.hwNumber}
          peerReviewOpen={false}
          lessonToday={false}
          lessonsCompleted={lessonsCompleted}
          lessonsTotal={12}
          nextLessonNumber={nextLesson.number}
          nextLessonTopic={nextLesson.topic}
          href={activeCohortId === "flow-1" ? "https://drive.google.com/file/d/1bKF9JxY0RwzmoQxADJkglg9DsXoFXM5z/view?usp=drive_link" : undefined}
          recordingAvailable={activeCohortId === "flow-1"}
          recordingLessonNumber={activeCohortId === "flow-1" ? 11 : undefined}
        />

        {loading ? (
          <>
            <Skeleton className="lg:col-span-2 h-40" />
            <Skeleton className="h-40" />
          </>
        ) : (
          <>
            <ProgressWidget
              lessonsCompleted={lessonsCompleted}
              lessonsTotal={12}
              hwCompleted={hwCompleted}
              hwTotal={6}
            />

            <GamificationWidget
              level={level}
              levelName={levelName}
              points={points}
              pointsToNext={pointsToNext}
              lastBadge={lastBadge}
            />
          </>
        )}

        <WeeklyGoalCard goal={studentData?.goal ?? null} />

        <UpcomingEvents
          nextLesson={nextLesson}
          nextDeadline={nextDeadline}
        />

        <QuickLinks />

        <BootcampGoalsCard />
      </div>
    </div>
  );
}
