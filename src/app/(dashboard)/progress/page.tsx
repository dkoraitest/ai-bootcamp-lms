"use client";

import StatsGrid from "@/components/progress/StatsGrid";
import ActivityChart from "@/components/progress/ActivityChart";
import DailyActivityGrid from "@/components/progress/DailyActivityGrid";
import PointsHistory from "@/components/progress/PointsHistory";
import LevelCard from "@/components/progress/LevelCard";
import BadgesGrid from "@/components/progress/BadgesGrid";
import QuestsCard from "@/components/progress/QuestsCard";
import GoalCard from "@/components/progress/GoalCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUser } from "@/lib/hooks/useUser";
import { useStudentData } from "@/lib/hooks/useStudentData";

const BOOTCAMP_START = new Date("2026-05-12");
const BOOTCAMP_TOTAL_DAYS = 42;

const LEVEL_NAMES: Record<number, string> = {
  1: "Новичок", 2: "Практик", 3: "Агент", 4: "Мастер", 5: "Эксперт",
};
const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 101, 2: 301, 3: 601, 4: 1001, 5: 1001,
};
const NEXT_LEVEL_NAMES: Record<number, string> = {
  1: "Практик", 2: "Агент", 3: "Мастер", 4: "Эксперт", 5: "Эксперт",
};

const DEFAULT_BADGES = [
  { id: 1,  name: "Первый старт",  emoji: "🚀", description: "Просмотрел первый урок",          earned: false, earnedAt: null },
  { id: 2,  name: "Prompt Master", emoji: "✍️", description: "Сдал HW1",                         earned: false, earnedAt: null },
  { id: 3,  name: "Coworker",      emoji: "🤖", description: "Создал первую автоматизацию",      earned: false, earnedAt: null },
  { id: 4,  name: "Vibe Coder",    emoji: "💻", description: "Задеплоил mini-app (HW2)",          earned: false, earnedAt: null },
  { id: 5,  name: "Context King",  emoji: "📄", description: "Написал CLAUDE.md (HW3)",           earned: false, earnedAt: null },
  { id: 6,  name: "Skill Builder", emoji: "🛠",  description: "Написал 2 Skills (HW3)",            earned: false, earnedAt: null },
  { id: 7,  name: "MCP Pioneer",   emoji: "🔌", description: "Подключил MCP (HW4)",               earned: false, earnedAt: null },
  { id: 8,  name: "5 в неделю",    emoji: "🔥", description: "5 запусков агента за неделю",       earned: false, earnedAt: null },
  { id: 9,  name: "На старте",     emoji: "⚡", description: "3 недели подряд без пропусков",     earned: false, earnedAt: null },
  { id: 10, name: "Domain Expert", emoji: "🎯", description: "Сдал доменный кейс (HW5)",          earned: false, earnedAt: null },
  { id: 11, name: "Peer Reviewer", emoji: "👥", description: "Провёл 2 пир-ревью",                earned: false, earnedAt: null },
  { id: 12, name: "Demo Day",      emoji: "🏆", description: "Выступил на финале",                earned: false, earnedAt: null },
];

const DEFAULT_QUESTS = [
  { id: 1, name: "Первая неделя", emoji: "🌱", description: "Просмотри оба урока недели 1 и сдай HW1",   progress: 0, total: 3, completed: false },
  { id: 2, name: "Кодер-агент",   emoji: "💻", description: "Просмотри уроки 3–4 и задеплой mini-app",    progress: 0, total: 3, completed: false },
  { id: 3, name: "Строитель ОС",  emoji: "🛠",  description: "Напиши CLAUDE.md + 2 Skills + пир-ревью",   progress: 0, total: 3, completed: false },
  { id: 4, name: "Агент 5/5",     emoji: "🔥", description: "5 запусков агента за одну неделю",            progress: 0, total: 5, completed: false },
];

const MOCK_WEEKLY_LAUNCHES = [
  { week: "29 апр", launches: 0 },
  { week: "6 мая",  launches: 0 },
  { week: "12 мая", launches: 0 },
  { week: "19 мая", launches: 0 },
  { week: "26 мая", launches: 0 },
  { week: "2 июн",  launches: 0 },
  { week: "9 июн",  launches: 0 },
  { week: "16 июн", launches: 0 },
];

const MOCK_DAILY_ACTIVITY = Array(31).fill(false);
const MOCK_POINTS_HISTORY: { action: string; points: number; date: string }[] = [];

export default function ProgressPage() {
  const { user } = useUser();
  const { data: studentData, loading } = useStudentData(user?.id);

  const now = new Date();
  const daysInBootcamp = Math.max(
    1,
    Math.ceil((now.getTime() - BOOTCAMP_START.getTime()) / (24 * 60 * 60 * 1000))
  );
  const weekNumber = Math.min(6, Math.max(1, Math.ceil(daysInBootcamp / 7)));

  const lessonsCompleted =
    studentData?.progress?.filter((p) => p.status === "completed").length ?? 0;
  const hwCompleted =
    studentData?.submissions?.filter(
      (s) => s.status === "submitted" || s.status === "reviewed"
    ).length ?? 0;
  const totalLaunches = studentData?.launches?.length ?? 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const launchesThisWeek =
    studentData?.launches?.filter(
      (l) => new Date(l.launched_at) >= oneWeekAgo
    ).length ?? 0;

  const points = studentData?.gamification?.points ?? 0;
  const level = studentData?.gamification?.level ?? 1;
  const levelName = LEVEL_NAMES[level] ?? "Новичок";
  const pointsToNextLevel = LEVEL_THRESHOLDS[level] ?? 101;
  const nextLevelName = NEXT_LEVEL_NAMES[level] ?? "Практик";

  const earnedBadgeIds = new Set(
    (studentData?.gamification?.badges ?? []).map((b) => b.id)
  );
  const badges = DEFAULT_BADGES.map((b) => {
    const earned = earnedBadgeIds.has(b.id);
    const earnedEntry = studentData?.gamification?.badges.find((e) => e.id === b.id);
    return { ...b, earned, earnedAt: earnedEntry?.earnedAt ?? null };
  });

  const dbQuests = studentData?.gamification?.quests ?? [];
  const quests = DEFAULT_QUESTS.map((q) => {
    const real = dbQuests.find((dq) => dq.id === q.id);
    return real ? { ...q, progress: real.progress, completed: real.completed } : q;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Мой прогресс</h1>
        <p className="text-sm text-[#71717a] mt-1">
          День {daysInBootcamp} из {BOOTCAMP_TOTAL_DAYS} · Неделя {weekNumber} из 6
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <StatsGrid
              lessonsCompleted={lessonsCompleted}
              lessonsTotal={12}
              hwCompleted={hwCompleted}
              hwTotal={6}
              totalLaunches={totalLaunches}
              launchesThisWeek={launchesThisWeek}
              daysInBootcamp={daysInBootcamp}
              daysTotal={BOOTCAMP_TOTAL_DAYS}
            />
          )}

          <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Активность запусков</h2>
            <ActivityChart data={MOCK_WEEKLY_LAUNCHES} />
            <DailyActivityGrid activity={MOCK_DAILY_ACTIVITY} />
          </div>

          <PointsHistory
            history={MOCK_POINTS_HISTORY}
            totalPoints={points}
          />
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {loading ? (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </>
          ) : (
            <>
              <LevelCard
                level={level}
                levelName={levelName}
                points={points}
                pointsToNextLevel={pointsToNextLevel}
                nextLevelName={nextLevelName}
              />
              <BadgesGrid badges={badges} />
              <QuestsCard quests={quests} />
            </>
          )}
        </div>

        {/* ── Full-width bottom ── */}
        <div className="lg:col-span-3">
          <GoalCard streakWeeks={0} targetWeeks={4} />
        </div>
      </div>
    </div>
  );
}
