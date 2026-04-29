"use client";

import NextStepBanner from "@/components/dashboard/NextStepBanner";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import GamificationWidget from "@/components/dashboard/GamificationWidget";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import QuickLinks from "@/components/dashboard/QuickLinks";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUser } from "@/lib/hooks/useUser";
import { useStudentData } from "@/lib/hooks/useStudentData";

const mockNextLesson = {
  number: 4,
  date: "21 мая, среда",
  time: "19:00 МСК",
  topic: "Vibe coding: 3 принципа + первый mini-app",
};

const mockNextDeadline = {
  hwNumber: 1,
  title: "Первая Cowork-автоматизация",
  deadline: "25 мая, воскресенье, 23:59",
  daysLeft: 4,
};

const BOOTCAMP_START = new Date("2026-05-12");

export default function HomePage() {
  const { user } = useUser();
  const { data: studentData, loading } = useStudentData(user?.id);

  const userName = (user?.user_metadata?.name as string | undefined) ?? "Студент";

  const lessonsCompleted =
    studentData?.progress?.filter((p) => p.status === "completed").length ?? 0;
  const hwCompleted =
    studentData?.submissions?.filter(
      (s) => s.status === "submitted" || s.status === "reviewed"
    ).length ?? 0;

  const now = new Date();
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
          daysLeft={mockNextDeadline.daysLeft}
          hwNumber={mockNextDeadline.hwNumber}
          peerReviewOpen={false}
          lessonToday={false}
          lessonsCompleted={lessonsCompleted}
          lessonsTotal={12}
          nextLessonNumber={mockNextLesson.number}
          nextLessonTopic={mockNextLesson.topic}
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
          nextLesson={mockNextLesson}
          nextDeadline={mockNextDeadline}
        />

        <QuickLinks />
      </div>
    </div>
  );
}
