"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCohort } from "@/lib/cohort/CohortProvider";
import { useUser } from "@/lib/hooks/useUser";

export type WeeklyGoal = {
  week: number;
  text: string;
  status: "done" | "missed" | "in_progress";
};

export type CohortGoal = {
  userId: string;
  name: string;
  context: string;
  mainGoal: string;
  weekly: WeeklyGoal[];
  source: "self" | "transcript";
  updatedAt: string;
};

// Цели участников активного потока. Пустые записи RPC не отдаёт, поэтому
// список — это те, кто цель уже сформулировал.
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
          mainGoal: (row.main_goal as string) ?? "",
          weekly: (row.weekly as WeeklyGoal[]) ?? [],
          source: (row.source as CohortGoal["source"]) ?? "self",
          updatedAt: row.updated_at as string,
        }))
      );
    }

    setLoading(false);
  }, [activeCohortId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMyGoal = useCallback(
    async (mainGoal: string, context: string): Promise<{ ok: boolean; error?: string }> => {
      if (!activeCohortId) return { ok: false, error: "Поток ещё загружается." };

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("set_my_goal", {
        p_cohort_id: activeCohortId,
        p_main_goal: mainGoal,
        p_context: context,
      });

      if (rpcError) return { ok: false, error: `Не удалось сохранить: ${rpcError.message}` };

      await load();
      return { ok: true };
    },
    [activeCohortId, load]
  );

  const myGoal = goals.find((goal) => goal.userId === user?.id) ?? null;

  return { goals, myGoal, loading, error, saveMyGoal, reload: load };
}
