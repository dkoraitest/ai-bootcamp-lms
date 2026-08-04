import { createClient } from "@/lib/supabase/client";

// Записывает заход пользователя на платформу (один раз в день).
// Дубликаты в том же потоке и в тот же день гасятся cohort-aware индексом.
export async function recordVisit(
  userId: string,
  cohortId: string,
  cohortStartsAt?: string | null
) {
  const supabase = createClient();
  const today = new Date();
  const cohortStart = cohortStartsAt ? new Date(`${cohortStartsAt}T00:00:00`) : null;

  // Локальная дата в формате YYYY-MM-DD
  const visitDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const weekNumber = Math.max(
    1,
    cohortStart && !Number.isNaN(cohortStart.getTime())
      ? Math.ceil((today.getTime() - cohortStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
      : 1
  );

  const { error } = await supabase
    .from("platform_visits")
    .upsert(
      { user_id: userId, cohort_id: cohortId, visit_date: visitDate, week_number: weekNumber },
      { onConflict: "cohort_id,user_id,visit_date", ignoreDuplicates: true }
    );

  return { error };
}
