import StatsGrid from "@/components/progress/StatsGrid";
import ActivityChart from "@/components/progress/ActivityChart";
import DailyActivityGrid from "@/components/progress/DailyActivityGrid";
import PointsHistory from "@/components/progress/PointsHistory";
import LevelCard from "@/components/progress/LevelCard";
import BadgesGrid from "@/components/progress/BadgesGrid";
import QuestsCard from "@/components/progress/QuestsCard";
import GoalCard from "@/components/progress/GoalCard";

const mockStats = {
  lessonsCompleted: 3,
  lessonsTotal: 12,
  hwCompleted: 1,
  hwTotal: 6,
  hwSubmitted: 1,
  hwReviewed: 0,
  totalLaunches: 11,
  daysInBootcamp: 17,
  daysTotal: 42,
  peerReviewsDone: 0,
};

const mockGamification = {
  points: 185,
  level: 2,
  levelName: "Практик",
  pointsToNextLevel: 300,
  nextLevelName: "Агент",
  badges: [
    { id: 1,  name: "Первый старт",    emoji: "🚀", description: "Просмотрел первый урок",          earned: true,  earnedAt: "12.05.2026" },
    { id: 2,  name: "Prompt Master",   emoji: "✍️", description: "Сдал HW1",                         earned: true,  earnedAt: "16.05.2026" },
    { id: 3,  name: "Coworker",        emoji: "🤖", description: "Создал первую автоматизацию",      earned: true,  earnedAt: "16.05.2026" },
    { id: 4,  name: "Vibe Coder",      emoji: "💻", description: "Задеплоил mini-app (HW2)",          earned: false, earnedAt: null },
    { id: 5,  name: "Context King",    emoji: "📄", description: "Написал CLAUDE.md (HW3)",           earned: false, earnedAt: null },
    { id: 6,  name: "Skill Builder",   emoji: "🛠", description: "Написал 2 Skills (HW3)",            earned: false, earnedAt: null },
    { id: 7,  name: "MCP Pioneer",     emoji: "🔌", description: "Подключил MCP (HW4)",               earned: false, earnedAt: null },
    { id: 8,  name: "5 в неделю",      emoji: "🔥", description: "5 запусков агента за неделю",       earned: false, earnedAt: null },
    { id: 9,  name: "На старте",       emoji: "⚡", description: "3 недели подряд без пропусков",     earned: false, earnedAt: null },
    { id: 10, name: "Domain Expert",   emoji: "🎯", description: "Сдал доменный кейс (HW5)",          earned: false, earnedAt: null },
    { id: 11, name: "Peer Reviewer",   emoji: "👥", description: "Провёл 2 пир-ревью",                earned: false, earnedAt: null },
    { id: 12, name: "Demo Day",        emoji: "🏆", description: "Выступил на финале",                earned: false, earnedAt: null },
  ],
  quests: [
    { id: 1, name: "Первая неделя",  emoji: "🌱", description: "Просмотри оба урока недели 1 и сдай HW1",         progress: 3, total: 3, completed: true },
    { id: 2, name: "Кодер-агент",    emoji: "💻", description: "Просмотри уроки 3–4 и задеплой mini-app",          progress: 1, total: 3, completed: false },
    { id: 3, name: "Строитель ОС",   emoji: "🛠", description: "Напиши CLAUDE.md + 2 Skills + пир-ревью",          progress: 0, total: 3, completed: false },
    { id: 4, name: "Агент 5/5",      emoji: "🔥", description: "5 запусков агента за одну неделю",                 progress: 2, total: 5, completed: false },
  ],
};

const mockWeeklyLaunches = [
  { week: "29 апр", launches: 0 },
  { week: "6 мая",  launches: 0 },
  { week: "12 мая", launches: 3 },
  { week: "19 мая", launches: 2 },
  { week: "26 мая", launches: 4 },
  { week: "2 июн",  launches: 1 },
  { week: "9 июн",  launches: 3 },
  { week: "16 июн", launches: 2 },
];

const mockDailyActivity = [
  false, false, true,  false, true,  true,  false,
  true,  false, false, true,  false, true,  false,
  false, true,  true,  false, false, true,  false,
  true,  false, true,  false, false, false, true,
  false, true,  false,
];

const mockPointsHistory = [
  { action: "Просмотрел урок 3",      points: 10, date: "19.05.2026" },
  { action: "Сдал ДЗ #1 вовремя",     points: 30, date: "16.05.2026" },
  { action: "Провёл пир-ревью",        points: 20, date: "15.05.2026" },
  { action: "Просмотрел урок 2",       points: 10, date: "14.05.2026" },
  { action: "5 запусков за неделю",    points: 25, date: "13.05.2026" },
  { action: "Просмотрел урок 1",       points: 10, date: "12.05.2026" },
];

const currentWeekLaunches = mockWeeklyLaunches[mockWeeklyLaunches.length - 1].launches;

export default function ProgressPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Мой прогресс</h1>
        <p className="text-sm text-[#71717a] mt-1">
          День {mockStats.daysInBootcamp} из {mockStats.daysTotal} · Неделя 3 из 6
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <StatsGrid
            lessonsCompleted={mockStats.lessonsCompleted}
            lessonsTotal={mockStats.lessonsTotal}
            hwCompleted={mockStats.hwCompleted}
            hwTotal={mockStats.hwTotal}
            totalLaunches={mockStats.totalLaunches}
            launchesThisWeek={currentWeekLaunches}
            daysInBootcamp={mockStats.daysInBootcamp}
            daysTotal={mockStats.daysTotal}
          />

          {/* Activity card — wraps both chart and daily grid */}
          <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Активность запусков</h2>
            <ActivityChart data={mockWeeklyLaunches} />
            <DailyActivityGrid activity={mockDailyActivity} />
          </div>

          <PointsHistory
            history={mockPointsHistory}
            totalPoints={mockGamification.points}
          />
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <LevelCard
            level={mockGamification.level}
            levelName={mockGamification.levelName}
            points={mockGamification.points}
            pointsToNextLevel={mockGamification.pointsToNextLevel}
            nextLevelName={mockGamification.nextLevelName}
          />
          <BadgesGrid badges={mockGamification.badges} />
          <QuestsCard quests={mockGamification.quests} />
        </div>

        {/* ── Full-width bottom ── */}
        <div className="lg:col-span-3">
          <GoalCard streakWeeks={0} targetWeeks={4} />
        </div>
      </div>
    </div>
  );
}
