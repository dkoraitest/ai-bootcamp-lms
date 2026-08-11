"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCohort } from "@/lib/cohort/CohortProvider";
import { useUser } from "@/lib/hooks/useUser";

export type GoalStatus = "planned" | "in_progress" | "done" | "dropped";

export type GoalItem = {
  id: string;
  text: string;
  week: number | null;
  status: GoalStatus;
  source: "self" | "transcript";
};

export type CohortGoal = {
  userId: string;
  name: string;
  context: string;
  items: GoalItem[];
  updatedAt: string;
};

type Result = { ok: boolean; error?: string };

// Цели участников активного потока. У каждого список: свои цели он ведёт
// сам, цели из разбора встреч добавляет преподаватель.
export function useCohortGoals() {
  const { activeCohortId } = useCohort();
  const { user } = useUser();
  const [goals, setGoals] = useState<CohortGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!activeCohortId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("get_cohort_goals", {
      p_cohort_id: activeCohortId,
    });

    if (rpcError) {
      setError("Не удалось загрузить цели потока.");
      setGoals([]);
    } else {
      setError("");
      setGoals(
        (data ?? []).map((row: Record<string, unknown>) => ({
          userId: row.user_id as string,
          name: (row.name as string) ?? "Участник",
          context: (row.context as string) ?? "",
          items: ((row.items as GoalItem[]) ?? []).filter((item) => item?.id),
          updatedAt: row.updated_at as string,
        }))
      );
    }

    setLoading(false);
  }, [activeCohortId]);

  useEffect(() => {
    void load();
  }, [load]);

  const call = useCallback(
    async (fn: string, params: Record<string, unknown>): Promise<Result> => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc(fn, params);
      if (rpcError) return { ok: false, error: rpcError.message };
      await load();
      return { ok: true };
    },
    [load]
  );

  const addGoal = useCallback(
    (text: string, week: number | null = null) => {
      if (!activeCohortId) return Promise.resolve({ ok: false, error: "Поток ещё загружается." });
      return call("add_my_goal", { p_cohort_id: activeCohortId, p_text: text, p_week: week });
    },
    [activeCohortId, call]
  );

  const updateGoal = useCallback(
    (id: string, patch: { text?: string; status?: GoalStatus }) =>
      call("update_my_goal", {
        p_goal_id: id,
        p_text: patch.text ?? null,
        p_status: patch.status ?? null,
      }),
    [call]
  );

  const deleteGoal = useCallback((id: string) => call("delete_my_goal", { p_goal_id: id }), [call]);

  const saveContext = useCallback(
    (context: string) => {
      if (!activeCohortId) return Promise.resolve({ ok: false, error: "Поток ещё загружается." });
      return call("set_my_goal_context", { p_cohort_id: activeCohortId, p_context: context });
    },
    [activeCohortId, call]
  );

  const myGoals = goals.find((goal) => goal.userId === user?.id) ?? null;
  const otherGoals = goals.filter((goal) => goal.userId !== user?.id);

  return {
    goals,
    myGoals,
    otherGoals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    saveContext,
    reload: load,
  };
}
