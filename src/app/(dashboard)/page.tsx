"use client";

import { useEffect, useState } from "react";
import NextStepBanner from "@/components/dashboard/NextStepBanner";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import GamificationWidget from "@/components/dashboard/GamificationWidget";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import QuickLinks from "@/components/dashboard/QuickLinks";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUser } from "@/lib/hooks/useUser";
import { useStudentData } from "@/lib/hooks/useStudentData";
import { createClient } from "@/lib/supabase/client";

const BOOTCAMP_START = new Date("2026-05-12");

const LESSONS_SCHEDULE = [
  { number: 1,  date: new Date("2026-05-12"), dateStr: "12 мая, вторник",  time: "14:30 МСК", topic: "AI Mindset: новая работа в эпоху агентов" },
  { number: 2,  date: new Date("2026-05-14"), dateStr: "14 мая, четверг",  time: "18:00 МСК", topic: "Переход в Cowork: AI который делает" },
  { number: 3,  date: new Date("2026-05-19"), dateStr: "19 мая, вторник",  time: "14:30 МСК", topic: "Кодинг-агенты как класс. CC / Codex / IDE" },
  { number: 4,  date: new Date("2026-05-21"), dateStr: "21 мая, четверг",  time: "18:00 МСК", topic: "Vibe coding: 3 принципа + первый mini-app" },
  { number: 5,  date: new Date("2026-05-26"), dateStr: "26 мая, вторник",  time: "14:30 МСК", topic: "Контекст как материал. R&D подход" },
  { number: 6,  date: new Date("2026-05-28"), dateStr: "28 мая, четверг",  time: "18:00 МСК", topic: "Skills и Commands: четыре примитива CC" },
  { number: 7,  date: new Date("2026-06-02"), dateStr: "2 июня, вторник",  time: "14:30 МСК", topic: "MCP и RAG: расширяем агента" },
  { number: 8,  date: new Date("2026-06-04"), dateStr: "4 июня, четверг",  time: "18:00 МСК", topic: "Автоматизации 24/7 и визуальное программирование" },
  { number: 9,  date: new Date("2026-06-09"), dateStr: "9 июня, вторник",  time: "14:30 МСК", topic: "Маркетинг + продажи (доменные кейсы)" },
  { number: 10, date: new Date("2026-06-11"), dateStr: "11 июня, четверг", time: "18:00 МСК", topic: "Продукт + аналитика (доменные кейсы)" },
  { number: 11, date: new Date("2026-06-16"), dateStr: "16 июня, вторник", time: "14:30 МСК", topic: "Безопасный агент + multi-agent" },
  { number: 12, date: new Date("2026-06-18"), dateStr: "18 июня, четверг", time: "18:00 МСК", topic: "Demo Day — Защита проектов" },
];

const DEADLINES_SCHEDULE = [
  { hwNumber: 1, title: "Промпт-инжиниринг",    date: new Date("2026-05-17"), deadlineStr: "17 мая, воскресенье, 23:59" },
  { hwNumber: 2, title: "Mini-App деплой",        date: new Date("2026-05-24"), deadlineStr: "24 мая, воскресенье, 23:59" },
  { hwNumber: 3, title: "CLAUDE.md + Skills",     date: new Date("2026-05-31"), deadlineStr: "31 мая, воскресенье, 23:59" },
  { hwNumber: 4, title: "MCP интеграция",         date: new Date("2026-06-07"), deadlineStr: "7 июня, воскресенье, 23:59" },
  { hwNumber: 5, title: "Доменный кейс",          date: new Date("2026-06-14"), deadlineStr: "14 июня, воскресенье, 23:59" },
  { hwNumber: 6, title: "Demo Day презентация",   date: new Date("2026-06-21"), deadlineStr: "21 июня, воскресенье, 23:59" },
];

export default function HomePage() {
  const { user } = useUser();
  const { data: studentData, loading } = useStudentData(user?.id);
  const [lesson1Url, setLesson1Url] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("materials")
      .select("url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.url) setLesson1Url(data.url as string);
      });
  }, []);

  const userName = (user?.user_metadata?.name as string | undefined) ?? "Студент";

  const lessonsCompletedFromDb =
    studentData?.progress?.filter((p) => p.status === "completed").length ?? 0;
  const lessonsCompleted = user?.id
    ? Math.max(1, lessonsCompletedFromDb)
    : lessonsCompletedFromDb;
  const hwCompleted =
    studentData?.submissions?.filter(
      (s) => s.status === "submitted" || s.status === "reviewed"
    ).length ?? 0;

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const nextLessonData =
    LESSONS_SCHEDULE.find((l) => l.date >= today) ??
    LESSONS_SCHEDULE[LESSONS_SCHEDULE.length - 1];

  const nextDeadlineData =
    DEADLINES_SCHEDULE.find((d) => d.date >= today) ??
    DEADLINES_SCHEDULE[DEADLINES_SCHEDULE.length - 1];

  const daysLeft = Math.max(
    0,
    Math.ceil((nextDeadlineData.date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  );

  const nextLesson = {
    number: nextLessonData.number,
    date: nextLessonData.dateStr,
    time: nextLessonData.time,
    topic: nextLessonData.topic,
  };

  const nextDeadline = {
    hwNumber: nextDeadlineData.hwNumber,
    title: nextDeadlineData.title,
    deadline: nextDeadlineData.deadlineStr,
    daysLeft,
  };

  const daysInBootcamp = Math.max(
    1,
    Math.ceil((now.getTime() - BOOTCAMP_START.getTime()) / (24 * 60 * 60 * 1000))
  );
  const weekNumber = Math.min(6, Math.max(1, Math.ceil(daysInBootcamp / 7)));

  const points = studentData?.gamification?.points ?? 0;
  const level = studentData?.gamification?.level ?? 1;

  const LEVEL_NAMES: Record<number, string> = {
    1: "Новичок", 2: "Практик", 3: "Агент", 4: "Мастер", 5: "Эксперт",
  };
  const LEVEL_THRESHOLDS = [0, 101, 301, 601, 1001, Infinity];
  const levelName = LEVEL_NAMES[level] ?? "Новичок";
  const pointsToNext = LEVEL_THRESHOLDS[level] ?? 300;

  const lastBadge = { name: "Первый старт", emoji: "🚀" };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Привет, {userName}! 👋
        </h1>
        <p className="text-sm text-[#71717a] mt-1">
          День {daysInBootcamp} · Неделя {weekNumber} из 6
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
          href={lesson1Url || undefined}
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

        <UpcomingEvents
          nextLesson={nextLesson}
          nextDeadline={nextDeadline}
        />

        <QuickLinks />
      </div>
    </div>
  );
}
