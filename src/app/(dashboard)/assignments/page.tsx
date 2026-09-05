"use client";

import { useEffect, useMemo, useState } from "react";
import AssignmentSummaryBar from "@/components/assignments/AssignmentSummaryBar";
import AssignmentFilters, { FilterKey } from "@/components/assignments/AssignmentFilters";
import AssignmentPageCard, {
  AssignmentData,
  AssignmentSubmitPayload,
  AssignmentSubmitResult,
} from "@/components/assignments/AssignmentPageCard";
import AssignmentNotificationsPanel, {
  AssignmentNotification,
} from "@/components/assignments/AssignmentNotificationsPanel";
import AdminSubmissionQueue from "@/components/assignments/AdminSubmissionQueue";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { useCohort } from "@/lib/cohort/CohortProvider";
import { useCohortSchedule, useAssignmentMaterials } from "@/lib/hooks/useContentUrls";
import { getProgramAssignments } from "@/lib/program/assignments";
import WeekFiveNotice from "@/components/program/WeekFiveNotice";
import { getScheduledAssignmentStatus } from "@/lib/program/submission";

type StudentSubmissionRow = {
  assignment_id: number;
  status: AssignmentData["status"];
  github_url: string | null;
  video_url: string | null;
  live_url: string | null;
  artifact: string | null;
  submitted_at: string | null;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

type AdminSubmissionRow = {
  id: string;
  hw_number: number;
  student_name: string | null;
  student_email: string | null;
  github_url: string | null;
  video_url: string | null;
  live_url: string | null;
  artifact: string | null;
  status: string;
  submitted_at: string | null;
  feedback: string | null;
  points_earned: number | null;
};


const FILTER_MATCH: Record<FilterKey, AssignmentData["status"][]> = {
  all: ["reviewed", "submitted", "in_progress", "not_started", "locked"],
  active: ["in_progress", "not_started"],
  submitted: ["submitted"],
  reviewed: ["reviewed"],
  locked: ["locked"],
};

function mergeAssignmentsWithSubmissions(
  assignments: AssignmentData[],
  submissions: StudentSubmissionRow[]
) {
  const submissionMap = new Map(submissions.map((item) => [item.assignment_id, item]));

  return assignments.map((assignment) => {
    const submission =
      submissionMap.get(assignment.id) ?? submissionMap.get(assignment.hwNumber);

    if (!submission) return assignment;

    return {
      ...assignment,
      status: submission.status,
      githubUrl: submission.github_url ?? "",
      videoUrl: submission.video_url ?? "",
      liveUrl: submission.live_url ?? "",
      artifact: submission.artifact ?? "",
      submittedAt: submission.submitted_at,
    };
  });
}

function buildStudentNotice(
  assignment: AssignmentData,
  submittedAt: string
): AssignmentNotification {
  return {
    id: `local-${assignment.hwNumber}-${submittedAt}`,
    title: `ДЗ ${assignment.hwNumber} отправлено`,
    body: `Вы сдали "${assignment.title}". Ссылки уже появились в панели администратора.`,
    createdAt: submittedAt,
  };
}

function mapNotificationRow(row: NotificationRow): AssignmentNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}

export default function AssignmentsPage() {
  const { user } = useUser();
  const { activeCohortId, isPrivileged } = useCohort();
  const initialAssignments = getProgramAssignments(activeCohortId);
  const { assignmentSchedule, loading: scheduleLoading } = useCohortSchedule();
  const materialsByHw = useAssignmentMaterials();
  const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
  const isReviewer = isPrivileged || role === "expert" || role === "admin";

  const [filter, setFilter] = useState<FilterKey>("all");
  const [assignments, setAssignments] = useState<AssignmentData[]>(initialAssignments);
  const [notifications, setNotifications] = useState<AssignmentNotification[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<AdminSubmissionRow[]>([]);
  const [panelError, setPanelError] = useState("");
  const [loadingPanel, setLoadingPanel] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadPageData() {
      setAssignments(initialAssignments);
      setNotifications([]);
      setAdminSubmissions([]);
      setPanelError("");

      if (!user?.id) return;

      setLoadingPanel(true);
      const supabase = createClient();

      if (!activeCohortId) {
        setLoadingPanel(false);
        return;
      }

      if (isReviewer) {
        const { data, error } = await supabase.rpc("get_assignment_submissions_feed", {
          p_cohort_id: activeCohortId,
        });

        if (isCancelled) return;

        if (error) {
          setPanelError(`Ошибка: ${error.message}`);
        } else {
          setAdminSubmissions((data ?? []) as AdminSubmissionRow[]);
        }

        setLoadingPanel(false);
        return;
      }

      const [{ data: submissions, error: submissionsError }, { data: messageData, error: messagesError }] =
        await Promise.all([
          supabase.rpc("get_my_assignment_submissions", { p_cohort_id: activeCohortId }),
          supabase.rpc("get_my_notifications", { p_cohort_id: activeCohortId }),
        ]);

      if (isCancelled) return;

      if (submissionsError) {
        setPanelError("Не удалось загрузить статус уже сданных домашних заданий.");
      } else {
        setAssignments(
          mergeAssignmentsWithSubmissions(
            initialAssignments,
            (submissions ?? []) as StudentSubmissionRow[]
          )
        );
      }

      if (messagesError) {
        setPanelError((current) =>
          current || "Не удалось загрузить сообщения по домашним заданиям."
        );
      } else {
        setNotifications(((messageData ?? []) as NotificationRow[]).map(mapNotificationRow));
      }

      setLoadingPanel(false);
    }

    void loadPageData();

    return () => {
      isCancelled = true;
    };
  }, [activeCohortId, initialAssignments, isReviewer, user?.id]);

  async function handleStudentSubmit(
    assignment: AssignmentData,
    payload: AssignmentSubmitPayload
  ): Promise<AssignmentSubmitResult> {
    if (!user?.id) {
      return {
        ok: false,
        error: "Сначала войди в аккаунт, чтобы сдать домашнее задание.",
      };
    }

    const supabase = createClient();
    if (!activeCohortId) {
      return {
        ok: false,
        error: "Поток ещё загружается. Попробуй ещё раз.",
      };
    }
    const submittedAt = new Date().toISOString();

    const { error } = await supabase.rpc("submit_student_assignment", {
      p_cohort_id: activeCohortId,
      hw_number: assignment.hwNumber,
      github_link: payload.githubUrl.trim() || null,
      video_link: payload.videoUrl.trim() || null,
      live_link: payload.liveUrl.trim() || null,
      artifact_text: payload.artifact.trim() || null,
    });

    if (error) {
      console.error("submit_student_assignment failed", error);
      return {
        ok: false,
        error: `Не удалось отправить ДЗ: ${error.message}`,
      };
    }

    setAssignments((current) =>
      current.map((item) =>
        item.id === assignment.id
          ? {
              ...item,
              status: "submitted",
              githubUrl: payload.githubUrl.trim(),
              videoUrl: payload.videoUrl.trim(),
              liveUrl: payload.liveUrl.trim(),
              artifact: payload.artifact.trim(),
              submittedAt,
            }
          : item
      )
    );

    setNotifications((current) => [
      buildStudentNotice(assignment, submittedAt),
      ...current,
    ].slice(0, 5));

    return { ok: true, submittedAt };
  }

  const cohortAssignments = useMemo(() => {
    const scheduleByHw = new Map(assignmentSchedule.map((row) => [row.hw_number, row]));
    if (scheduleLoading) return [];

    // Заготовка под ДЗ, которых нет в программе первого потока: у второго
    // потока их может быть больше шести. Содержание заполняется позже,
    // дедлайн и сдача работают сразу.
    const byHwNumber = new Map(assignments.map((assignment) => [assignment.hwNumber, assignment]));
    const extraAssignments: AssignmentData[] = assignmentSchedule
      .filter((row) => !byHwNumber.has(row.hw_number))
      .map((row) => ({
        id: row.hw_number,
        hwNumber: row.hw_number,
        title: `ДЗ ${row.hw_number}`,
        lessonId: row.hw_number * 2,
        lessonTitle: `Урок ${row.hw_number * 2}`,
        deadline: "Дата уточняется",
        status: "not_started",
        points: 50,
        pointsEarned: null,
        githubUrl: "",
        videoUrl: "",
        liveUrl: "",
        artifact: "",
        submittedAt: null,
        description: "Описание задания появится вместе с программой потока.",
        requirements: [],
        checklist: [],
        rubric: [],
        feedback: null,
      }));

    // Снятая публикация означает, что задания для студента ещё нет: он его
    // не видит вовсе. Раньше карточка всё равно рисовалась — заблокированной
    // и без даты, и «скрыть ДЗ» в админке ничего не скрывало.
    // Проверяющие видят весь список, чтобы вести расписание.
    // Уже сданное остаётся на виду в любом случае: снять публикацию задним
    // числом не должно прятать работу студента вместе с его сдачей.
    const visibleForStudent = (assignment: AssignmentData) => {
      if (isReviewer) return true;
      if (assignment.status === "submitted" || assignment.status === "reviewed") return true;
      return Boolean(scheduleByHw.get(assignment.hwNumber)?.is_released);
    };

    return [...assignments, ...extraAssignments]
      .filter(visibleForStudent)
      .sort((a, b) => a.hwNumber - b.hwNumber)
      .map((assignment) => {
      const schedule = scheduleByHw.get(assignment.hwNumber);
      const materials = materialsByHw[assignment.hwNumber];
      const status = getScheduledAssignmentStatus(activeCohortId, assignment.status, Boolean(schedule?.is_released && schedule.deadline));
      if (!schedule?.is_released || !schedule.deadline) {
        return { ...assignment, materials, deadline: "Дата уточняется", daysLeft: 0, status };
      }

      const deadline = new Date(schedule.deadline);
      return {
        ...assignment,
        materials,
        status,
        deadline: deadline.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        daysLeft: Math.max(
          0,
          Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        ),
      };
    });
  }, [activeCohortId, assignmentSchedule, assignments, materialsByHw, scheduleLoading, isReviewer]);

  const counts = useMemo(() => {
    const result = {} as Record<FilterKey, number>;

    for (const key of Object.keys(FILTER_MATCH) as FilterKey[]) {
      result[key] = cohortAssignments.filter((assignment) =>
        FILTER_MATCH[key].includes(assignment.status)
      ).length;
    }

    return result;
  }, [cohortAssignments]);

  const filtered = useMemo(
    () => cohortAssignments.filter((assignment) => FILTER_MATCH[filter].includes(assignment.status)),
    [cohortAssignments, filter]
  );

  const segments = cohortAssignments.map((assignment) => ({
    label: `ДЗ ${assignment.hwNumber}`,
    status: assignment.status,
  }));

  const totalPoints = cohortAssignments.reduce(
    (sum, assignment) => sum + (assignment.pointsEarned ?? 0),
    0
  );
  const maxPoints = cohortAssignments.reduce((sum, assignment) => sum + assignment.points, 0);

  const queueSubmissions = useMemo(
    () =>
      adminSubmissions.map((submission) => ({
        id: submission.id,
        hwNumber: submission.hw_number,
        title:
          initialAssignments.find((assignment) => assignment.hwNumber === submission.hw_number)
            ?.title ?? `ДЗ ${submission.hw_number}`,
        studentName: submission.student_name,
        studentEmail: submission.student_email,
        githubUrl: submission.github_url,
        videoUrl: submission.video_url,
        liveUrl: submission.live_url,
        artifact: submission.artifact,
        status: submission.status,
        submittedAt: submission.submitted_at,
        feedback: submission.feedback,
        pointsEarned: submission.points_earned,
      })),
    [adminSubmissions, initialAssignments]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Домашние задания</h1>
        <p className="mt-1 text-sm text-[#71717a]">
          {totalPoints} / {maxPoints} очков
          {isReviewer && (
            <span className="ml-2 font-medium text-purple-600">
              · {role === "admin" ? "Режим администратора" : "Режим эксперта"}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <WeekFiveNotice cohortId={activeCohortId} />
        <AssignmentSummaryBar segments={segments} />

        {isReviewer ? (
          <AdminSubmissionQueue submissions={queueSubmissions} loading={loadingPanel} />
        ) : (
          <AssignmentNotificationsPanel notifications={notifications} />
        )}

        {panelError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {panelError}
          </div>
        )}

        <AssignmentFilters active={filter} counts={counts} onChange={setFilter} />

        <div className="flex flex-col gap-3">
          {scheduleLoading ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
              Загружаем расписание потока...
            </div>
          ) : (
            filtered.map((assignment) => (
              <AssignmentPageCard
                key={assignment.id}
                assignment={assignment}
                isExpert={isReviewer}
                onStudentSubmit={isReviewer ? undefined : handleStudentSubmit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
