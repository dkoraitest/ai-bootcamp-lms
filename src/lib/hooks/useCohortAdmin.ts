"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AssignmentScheduleRow,
  CohortMember,
  CohortOverview,
  LessonScheduleRow,
} from "@/lib/types/admin";

type RpcError = { message: string } | null;

// Коды ошибок из базы переводим в человеческий текст один раз здесь,
// чтобы экраны не занимались разбором сообщений Postgres.
export function humanizeRpcError(message: string): string {
  if (message.includes("forbidden")) return "Недостаточно прав: нужна роль admin.";
  if (message.includes("registration_closed")) return "Набор в поток закрыт.";
  if (message.includes("bad_cohort_id")) return "Код потока: только латиница, цифры и дефис.";
  if (message.includes("bad_lesson_count")) return "Число уроков должно быть от 1 до 60.";
  if (message.includes("unsupported_start_weekday"))
    return "Генератор рассчитан на старт во вторник или четверг. Для другого дня заполните даты вручную.";
  if (message.includes("member_not_found")) return "Участник не найден в исходном потоке.";
  if (message.includes("duplicate key")) return "Поток с таким кодом уже существует.";
  return message;
}

function toError(error: { message: string } | null): RpcError {
  return error ? { message: humanizeRpcError(error.message) } : null;
}

export function useCohortOverview() {
  const [cohorts, setCohorts] = useState<CohortOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("admin_cohort_overview");
      if (cancelled) return;

      if (rpcError) {
        setError(humanizeRpcError(rpcError.message));
      } else {
        setError("");
        setCohorts(
          ((data ?? []) as Record<string, unknown>[]).map((row) => ({
            id: row.id as string,
            name: row.name as string,
            startsAt: (row.starts_at as string) ?? null,
            endsAt: (row.ends_at as string) ?? null,
            isActive: Boolean(row.is_active),
            isVisibleToStudents: Boolean(row.is_visible_to_students),
            isEnrolling: Boolean(row.is_enrolling),
            displayOrder: (row.display_order as number) ?? 0,
            students: (row.students as number) ?? 0,
            pendingReviews: (row.pending_reviews as number) ?? 0,
            lessonsScheduled: (row.lessons_scheduled as number) ?? 0,
            nextLessonDate: (row.next_lesson_date as string) ?? null,
          }))
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const createCohort = async (input: {
    id: string;
    name: string;
    startsAt: string | null;
    endsAt: string | null;
  }): Promise<RpcError> => {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_create_cohort", {
      p_id: input.id,
      p_name: input.name,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
    });
    reload();
    return toError(rpcError);
  };

  const updateCohort = async (
    cohortId: string,
    patch: {
      name?: string;
      startsAt?: string | null;
      endsAt?: string | null;
      isVisibleToStudents?: boolean;
      isEnrolling?: boolean;
      isActive?: boolean;
    }
  ): Promise<RpcError> => {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_update_cohort", {
      p_cohort_id: cohortId,
      p_name: patch.name ?? null,
      p_starts_at: patch.startsAt ?? null,
      p_ends_at: patch.endsAt ?? null,
      p_is_visible_to_students: patch.isVisibleToStudents ?? null,
      p_is_enrolling: patch.isEnrolling ?? null,
      p_is_active: patch.isActive ?? null,
    });
    reload();
    return toError(rpcError);
  };

  const generateSchedule = async (
    cohortId: string,
    firstDate: string,
    lessonCount: number
  ): Promise<RpcError> => {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_generate_lesson_schedule", {
      p_cohort_id: cohortId,
      p_first_date: firstDate,
      p_lesson_count: lessonCount,
    });
    reload();
    return toError(rpcError);
  };

  return { cohorts, loading, error, reload, createCohort, updateCohort, generateSchedule };
}

export function useCohortMembers(cohortId: string | null) {
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    if (!cohortId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("admin_cohort_members", {
        p_cohort_id: cohortId,
      });
      if (cancelled) return;

      if (rpcError) {
        setError(humanizeRpcError(rpcError.message));
      } else {
        setError("");
        setMembers(
          ((data ?? []) as Record<string, unknown>[]).map((row) => ({
            userId: row.user_id as string,
            name: row.name as string,
            email: row.email as string,
            telegram: (row.telegram as string) ?? null,
            cohortRole: (row.cohort_role as CohortMember["cohortRole"]) ?? "student",
            globalRole: (row.global_role as CohortMember["globalRole"]) ?? null,
            joinedAt: row.joined_at as string,
            lessonsDone: (row.lessons_done as number) ?? 0,
            hwSubmitted: (row.hw_submitted as number) ?? 0,
            hwReviewed: (row.hw_reviewed as number) ?? 0,
            points: (row.points as number) ?? 0,
            lastVisit: (row.last_visit as string) ?? null,
          }))
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cohortId, tick]);

  const moveMember = async (userId: string, toCohort: string): Promise<RpcError> => {
    if (!cohortId) return { message: "Поток не выбран." };
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_move_member", {
      p_user_id: userId,
      p_from_cohort: cohortId,
      p_to_cohort: toCohort,
    });
    reload();
    return toError(rpcError);
  };

  const removeMember = async (userId: string): Promise<RpcError> => {
    if (!cohortId) return { message: "Поток не выбран." };
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_remove_member", {
      p_cohort_id: cohortId,
      p_user_id: userId,
    });
    reload();
    return toError(rpcError);
  };

  const setGlobalRole = async (
    userId: string,
    role: "student" | "expert" | "admin"
  ): Promise<RpcError> => {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_set_global_role", {
      p_user_id: userId,
      p_role: role,
    });
    reload();
    return toError(rpcError);
  };

  return { members, loading, error, reload, moveMember, removeMember, setGlobalRole };
}

export function useCohortSchedule(cohortId: string | null) {
  const [lessons, setLessons] = useState<LessonScheduleRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    if (!cohortId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();

      const [lessonsResult, assignmentsResult] = await Promise.all([
        supabase
          .from("cohort_lesson_schedule")
          .select("lesson_number, lesson_date, starts_at, title_override, topic_override, is_released")
          .eq("cohort_id", cohortId)
          .order("lesson_number"),
        supabase
          .from("cohort_assignment_schedule")
          .select("hw_number, deadline, is_released")
          .eq("cohort_id", cohortId)
          .order("hw_number"),
      ]);

      if (cancelled) return;

      if (lessonsResult.error || assignmentsResult.error) {
        setError("Не удалось загрузить расписание потока.");
      } else {
        setError("");
        setLessons(
          (lessonsResult.data ?? []).map((row) => ({
            lessonNumber: row.lesson_number as number,
            lessonDate: (row.lesson_date as string) ?? null,
            startsAt: (row.starts_at as string) ?? null,
            titleOverride: (row.title_override as string) ?? null,
            topicOverride: (row.topic_override as string) ?? null,
            isReleased: Boolean(row.is_released),
          }))
        );
        setAssignments(
          (assignmentsResult.data ?? []).map((row) => ({
            hwNumber: row.hw_number as number,
            deadline: (row.deadline as string) ?? null,
            isReleased: Boolean(row.is_released),
          }))
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cohortId, tick]);

  const saveLessons = async (rows: LessonScheduleRow[]): Promise<RpcError> => {
    if (!cohortId) return { message: "Поток не выбран." };
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_set_lesson_schedule", {
      p_cohort_id: cohortId,
      p_rows: rows.map((row) => ({
        lesson_number: row.lessonNumber,
        lesson_date: row.lessonDate,
        starts_at: row.startsAt,
        title_override: row.titleOverride,
        topic_override: row.topicOverride,
        is_released: row.isReleased,
      })),
    });
    reload();
    return toError(rpcError);
  };

  const saveAssignments = async (rows: AssignmentScheduleRow[]): Promise<RpcError> => {
    if (!cohortId) return { message: "Поток не выбран." };
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_set_assignment_schedule", {
      p_cohort_id: cohortId,
      p_rows: rows.map((row) => ({
        hw_number: row.hwNumber,
        deadline: row.deadline,
        is_released: row.isReleased,
      })),
    });
    reload();
    return toError(rpcError);
  };

  return { lessons, assignments, loading, error, reload, saveLessons, saveAssignments };
}
