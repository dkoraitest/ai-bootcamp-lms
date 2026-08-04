import { createClient } from "@/lib/supabase/client";

export async function recordLaunch(_userId: string, cohortId: string) {
  const supabase = createClient();

  const { error } = await supabase.rpc("record_agent_launch", {
    p_cohort_id: cohortId,
  });

  return { error };
}
