"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SKILLS, SkillDef, Mastery } from "@/lib/data/skills";

export type ComputedSkill = SkillDef & {
  mastery: Mastery;
  score: number;        // 0..1 — значение для радара и прогресс-бара
  lessonsDone: number;  // сколько связанных уроков пройдено
  hwStatus: "none" | "submitted" | "reviewed";
};

type ProgressRow = {
  status: string;
  lessons: { lesson_number: number } | { lesson_number: number }[] | null;
};

type SubmissionRow = {
  assignment_id: number;
  status: string;
};

// Демо-аккаунт: студент, идеально закрывший прошедшие недели 1–4
// (уроки 1–8 просмотрены, ДЗ 1–4 сданы и проверены экспертом).
const DEMO_EMAIL = "kirabogdanova24@yandex.ru";
const DEMO_COMPLETED_LESSONS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
const DEMO_REVIEWED_HW = new Set([1, 2, 3, 4]);

// Плавный балл для радара, чтобы многоугольник отражал и долю пройденных уроков.
function masteryScore(mastery: Mastery, lessonShare: number): number {
  if (mastery === 0) return 0;
  if (mastery === 1) return 0.25 + 0.2 * lessonShare; // 0.25..0.45
  if (mastery === 2) return 0.7;
  return 1;
}

function computeSkill(
  skill: SkillDef,
  lessonDone: (n: number) => boolean,
  hwStatusOf: (hw: number) => "none" | "submitted" | "reviewed"
): ComputedSkill {
  const lessonsDone = skill.lessons.filter(lessonDone).length;
  const lessonShare = skill.lessons.length ? lessonsDone / skill.lessons.length : 0;
  const hwStatus = skill.hw ? hwStatusOf(skill.hw) : "none";

  let mastery: Mastery = 0;
  if (skill.hw) {
    if (hwStatus === "reviewed") mastery = 3;
    else if (hwStatus === "submitted") mastery = 2;
    else if (lessonsDone > 0) mastery = 1;
  } else {
    // Навык без ДЗ: потолок — «Практика» при полном прохождении уроков.
    if (lessonShare >= 1) mastery = 2;
    else if (lessonsDone > 0) mastery = 1;
  }

  return {
    ...skill,
    mastery,
    score: masteryScore(mastery, lessonShare),
    lessonsDone,
    hwStatus,
  };
}

export function useSkillData(userId: string | undefined, email?: string | null) {
  const [skills, setSkills] = useState<ComputedSkill[]>(
    SKILLS.map((s) => ({ ...s, mastery: 0, score: 0, lessonsDone: 0, hwStatus: "none" }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Захардкоженная демо-картина для презентационного аккаунта.
    if (email && email.toLowerCase() === DEMO_EMAIL) {
      const lessonDone = (n: number) => DEMO_COMPLETED_LESSONS.has(n);
      const hwStatusOf = (hw: number): "none" | "submitted" | "reviewed" =>
        DEMO_REVIEWED_HW.has(hw) ? "reviewed" : "none";
      setSkills(SKILLS.map((skill) => computeSkill(skill, lessonDone, hwStatusOf)));
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const supabase = createClient();

      const [{ data: progress }, { data: submissions }] = await Promise.all([
        supabase
          .from("student_progress")
          .select("status, lessons(lesson_number)")
          .eq("user_id", userId),
        supabase.rpc("get_my_assignment_submissions"),
      ]);

      if (cancelled) return;

      // Уроки: пробуем точные номера через join; если их нет (RLS/пустота) —
      // деградируем к «первые N уроков пройдены по порядку».
      const completedNumbers = new Set<number>();
      let hasNumbers = false;
      const progressRows = (progress ?? []) as ProgressRow[];
      for (const row of progressRows) {
        if (row.status !== "completed") continue;
        const lesson = Array.isArray(row.lessons) ? row.lessons[0] : row.lessons;
        if (lesson?.lesson_number) {
          completedNumbers.add(lesson.lesson_number);
          hasNumbers = true;
        }
      }
      const completedCount = progressRows.filter((r) => r.status === "completed").length;
      const lessonDone = (n: number) =>
        hasNumbers ? completedNumbers.has(n) : n <= completedCount;

      // ДЗ: статус по номеру (assignment_id из RPC = hw_number).
      const hwMap = new Map<number, string>();
      for (const row of (submissions ?? []) as SubmissionRow[]) {
        hwMap.set(row.assignment_id, row.status);
      }
      const hwStatusOf = (hw: number): "none" | "submitted" | "reviewed" => {
        const s = hwMap.get(hw);
        if (s === "reviewed") return "reviewed";
        if (s === "submitted") return "submitted";
        return "none";
      };

      setSkills(SKILLS.map((skill) => computeSkill(skill, lessonDone, hwStatusOf)));
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  return { skills, loading };
}
