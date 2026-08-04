"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCohort } from "@/lib/cohort/CohortProvider";

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

export type Visit = {
  visit_date: string;
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
  visits: Visit[] | null;
  gamification: Gamification | null;
  goal: string | null;
};

export function useStudentData(userId: string | undefined) {
  const { activeCohortId } = useCohort();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setData(null);

    if (!userId) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!activeCohortId) {
      setLoading(true);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);

    async function load() {
      const supabase = createClient();

      const [
        { data: progress },
        { data: submissions },
        { data: launches },
        { data: visits },
        { data: gamification },
        { data: userData },
      ] = await Promise.all([
        supabase
          .from("student_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("cohort_id", activeCohortId),
        supabase
          .from("assignment_submissions")
          .select("*")
          .eq("user_id", userId)
          .eq("cohort_id", activeCohortId),
        supabase
          .from("agent_launches")
          .select("*")
          .eq("user_id", userId)
          .eq("cohort_id", activeCohortId),
        supabase
          .from("platform_visits")
          .select("*")
          .eq("user_id", userId)
          .eq("cohort_id", activeCohortId),
        supabase
          .from("gamification")
          .select("*")
          .eq("user_id", userId)
          .eq("cohort_id", activeCohortId)
          .maybeSingle(),
        supabase.from("users").select("goal").eq("id", userId).single(),
      ]);

      if (cancelled) return;

      setData({
        progress: progress as StudentProgress[] | null,
        submissions: submissions as Submission[] | null,
        launches: launches as Launch[] | null,
        visits: visits as Visit[] | null,
        gamification: gamification as Gamification | null,
        goal: (userData as { goal: string | null } | null)?.goal ?? null,
      });
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeCohortId, userId]);

  return { data, loading };
}
