import { createClient } from "@/lib/supabase/client";

const BOOTCAMP_START = new Date("2026-05-12");

export async function recordLaunch(userId: string) {
  const supabase = createClient();
  const today = new Date();

  const weekNumber = Math.max(
    1,
    Math.ceil(
      (today.getTime() - BOOTCAMP_START.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  );

  const { error } = await supabase.from("agent_launches").insert({
    user_id: userId,
    launched_at: today.toISOString(),
    week_number: weekNumber,
  });

  if (!error) {
    await supabase.rpc("increment_points", { user_id: userId, amount: 5 });
  }

  return { error };
}
