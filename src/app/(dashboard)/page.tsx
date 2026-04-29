import NextStepBanner from "@/components/dashboard/NextStepBanner";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import GamificationWidget from "@/components/dashboard/GamificationWidget";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import QuickLinks from "@/components/dashboard/QuickLinks";

const mockStudent = {
  name: "Алина",
  level: 2,
  levelName: "Практик",
  points: 185,
  pointsToNext: 300,
  lastBadge: { name: "Первый старт", emoji: "🚀" },
};

const mockProgress = {
  lessonsCompleted: 3,
  lessonsTotal: 12,
  hwCompleted: 1,
  hwTotal: 6,
  launchesThisWeek: 2,
  launchesTarget: 5,
  launchDaysThisWeek: [true, false, true, false, false, false, false],
};

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

export default function HomePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Привет, {mockStudent.name}! 👋
        </h1>
        <p className="text-sm text-[#71717a] mt-1">
          Сегодня 29 апреля · Неделя 1 из 6
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NextStepBanner
          hwCompleted={mockProgress.hwCompleted}
          hwTotal={mockProgress.hwTotal}
          daysLeft={mockNextDeadline.daysLeft}
          hwNumber={mockNextDeadline.hwNumber}
          peerReviewOpen={false}
          lessonToday={false}
          lessonsCompleted={mockProgress.lessonsCompleted}
          lessonsTotal={mockProgress.lessonsTotal}
          nextLessonNumber={mockNextLesson.number}
          nextLessonTopic={mockNextLesson.topic}
        />

        <ProgressWidget
          lessonsCompleted={mockProgress.lessonsCompleted}
          lessonsTotal={mockProgress.lessonsTotal}
          hwCompleted={mockProgress.hwCompleted}
          hwTotal={mockProgress.hwTotal}
        />

        <GamificationWidget
          level={mockStudent.level}
          levelName={mockStudent.levelName}
          points={mockStudent.points}
          pointsToNext={mockStudent.pointsToNext}
          lastBadge={mockStudent.lastBadge}
        />

        <UpcomingEvents
          nextLesson={mockNextLesson}
          nextDeadline={mockNextDeadline}
        />

        <QuickLinks />
      </div>
    </div>
  );
}
