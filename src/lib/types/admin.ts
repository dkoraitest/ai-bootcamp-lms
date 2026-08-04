// Типы админского слоя. Опираются на схему потоков из миграций 008-016:
// поток — строковый id ('flow-1', 'flow-2'), участие — строка в cohort_members.

export type CohortOverview = {
  id: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isVisibleToStudents: boolean;
  isEnrolling: boolean;
  displayOrder: number;
  students: number;
  pendingReviews: number;
  lessonsScheduled: number;
  nextLessonDate: string | null;
};

export type CohortMember = {
  userId: string;
  name: string;
  email: string;
  telegram: string | null;
  cohortRole: "student" | "expert" | "admin";
  globalRole: "expert" | "admin" | null;
  joinedAt: string;
  lessonsDone: number;
  hwSubmitted: number;
  hwReviewed: number;
  points: number;
  lastVisit: string | null;
};

export type LessonScheduleRow = {
  lessonNumber: number;
  lessonDate: string | null;
  startsAt: string | null;
  titleOverride: string | null;
  topicOverride: string | null;
  isReleased: boolean;
};

export type AssignmentScheduleRow = {
  hwNumber: number;
  deadline: string | null;
  isReleased: boolean;
};

export type RegistrationStatus = {
  cohortId: string;
  cohortName: string;
  startsAt: string | null;
} | null;
