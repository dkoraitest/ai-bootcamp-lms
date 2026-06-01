import { createClient } from "@/lib/supabase/client";

const BOOTCAMP_START = new Date("2026-05-12");

// Записывает заход пользователя на платформу (один раз в день).
// Дубликаты в тот же день гасятся unique-индексом (user_id, visit_date).
export async function recordVisit(userId: string) {
  const supabase = createClient();
  const today = new Date();

  // Локальная дата в формате YYYY-MM-DD
  const visitDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const weekNumber = Math.max(
    1,
    Math.ceil(
      (today.getTime() - BOOTCAMP_START.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  );

  const { error } = await supabase
    .from("platform_visits")
    .upsert(
      { user_id: userId, visit_date: visitDate, week_number: weekNumber },
      { onConflict: "user_id,visit_date", ignoreDuplicates: true }
    );

  return { error };
}
