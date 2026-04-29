"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type StudentProgress = {
  lesson_id: number;
  status: string;
};

export type Submission = {
  assignment_id: number;
  status: string;
};

export type Launch = {
  launched_at: string;
  week_number: number;
};

export type Gamification = {
  points: number;
  level: number;
  badges: { id: number; earnedAt: string }[];
  quests: { id: number; progress: number; total: number; completed: boolean }[];
};

export type StudentData = {
  progress: StudentProgress[] | null;
  submissions: Submission[] | null;
  launches: Launch[] | null;
  gamification: Gamification | null;
};

export function useStudentData(userId: string | undefined) {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function load() {
      const supabase = createClient();

      const [
        { data: progress },
        { data: submissions },
        { data: launches },
        { data: gamification },
      ] = await Promise.all([
        supabase.from("student_progress").select("*").eq("user_id", userId),
        supabase.from("assignment_submissions").select("*").eq("user_id", userId),
        supabase.from("agent_launches").select("*").eq("user_id", userId),
        supabase.from("gamification").select("*").eq("user_id", userId).single(),
      ]);

      setData({
        progress: progress as StudentProgress[] | null,
        submissions: submissions as Submission[] | null,
        launches: launches as Launch[] | null,
        gamification: gamification as Gamification | null,
      });
      setLoading(false);
    }

    load();
  }, [userId]);

  return { data, loading };
}
