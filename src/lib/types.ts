export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Lesson = {
  id: string;
  week: number;
  lesson_number: number;
  title: string;
  topic: string;
  has_homework: boolean;
  video_url: string | null;
  lesson_date: string;
};

export type Material = {
  id: string;
  lesson_id: string;
  title: string;
  type: "video" | "template" | "technique" | "resource";
  content_url: string | null;
  markdown_content: string | null;
  week: number;
};

export type Assignment = {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  checklist: Record<string, unknown>;
  rubric: Record<string, unknown>;
  deadline: string;
  hw_number: number;
};

export type StudentProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  status: "not_started" | "watching" | "completed";
  completed_at: string | null;
};

export type AssignmentSubmission = {
  id: string;
  user_id: string;
  assignment_id: string;
  github_url: string | null;
  video_url: string | null;
  status: "not_started" | "in_progress" | "submitted" | "reviewed";
  submitted_at: string | null;
};

export type AgentLaunch = {
  id: string;
  user_id: string;
  launched_at: string;
  week_number: number;
};

export type Gamification = {
  id: string;
  user_id: string;
  points: number;
  level: number;
  badges: Record<string, unknown>;
  quests: Record<string, unknown>;
};

export type PeerReview = {
  id: string;
  reviewer_id: string;
  submission_id: string;
  checklist_scores: Record<string, unknown>;
  comment: string | null;
  created_at: string;
};
