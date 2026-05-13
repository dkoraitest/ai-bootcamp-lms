"use client";

import { useEffect, useMemo, useState } from "react";
import AssignmentSummaryBar from "@/components/assignments/AssignmentSummaryBar";
import AssignmentFilters, { FilterKey } from "@/components/assignments/AssignmentFilters";
import AssignmentPageCard, {
  AssignmentData,
  AssignmentSubmitPayload,
  AssignmentSubmitResult,
} from "@/components/assignments/AssignmentPageCard";
import AssignmentNotificationsPanel from "@/components/assignments/AssignmentNotificationsPanel";
import AdminSubmissionQueue from "@/components/assignments/AdminSubmissionQueue";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

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
};

const INITIAL_ASSIGNMENTS: AssignmentData[] = [
  {
    id: 1,
    hwNumber: 1,
    title: "Промпт-инжиниринг",
    lessonId: 2,
    lessonTitle: "Урок 2 · Архитектура промптов",
    deadline: "17.05.2026",
    status: "not_started",
    points: 50,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Развернуть Cowork, взять реальную задачу из своей работы, написать промпт по формуле Сцена + Задача + Правила, запустить автоматизацию и поделиться результатом.",
    requirements: [
      "Развернуть Cowork: поставить, авторизоваться, проверить что всё работает",
      "Взять одну реальную рабочую рутину, которую можно делегировать агенту",
      "Написать промпт по формуле Сцена + Задача + Правила",
      "Запустить автоматизацию в Cowork и получить реальный результат",
      "Выложить скрин или короткое видео с результатом",
    ],
    checklist: [
      { id: 1, text: "Развернул Cowork и авторизовался", done: false },
      { id: 2, text: "Выбрал реальную рутину из работы", done: false },
      { id: 3, text: "Написал промпт по формуле", done: false },
      { id: 4, text: "Запустил автоматизацию в Cowork", done: false },
      { id: 5, text: "Подготовил скрин или видео результата", done: false },
    ],
    feedback: null,
  },
  {
    id: 2,
    hwNumber: 2,
    title: "Mini-App деплой",
    lessonId: 4,
    lessonTitle: "Урок 4 · Vibe Coding",
    deadline: "24.05.2026",
    status: "not_started",
    points: 60,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Задеплой мини-приложение на базе Claude Code. Это может быть бот, скрипт или веб-интерфейс для твоего домена.",
    requirements: [
      "Рабочее приложение задеплоено и доступно по ссылке",
      "Исходный код лежит в GitHub",
      "Live URL доступен публично",
      "Есть README с описанием продукта",
    ],
    checklist: [
      { id: 1, text: "Выбрал идею приложения", done: false },
      { id: 2, text: "Написал код с Claude Code", done: false },
      { id: 3, text: "Задеплоил приложение", done: false },
      { id: 4, text: "Подготовил README", done: false },
    ],
    feedback: null,
  },
  {
    id: 3,
    hwNumber: 3,
    title: "CLAUDE.md + Skills",
    lessonId: 6,
    lessonTitle: "Урок 6 · Операционная система агента",
    deadline: "31.05.2026",
    status: "not_started",
    points: 70,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Настрой операционную систему своего агента: напиши CLAUDE.md и создай минимум 2 кастомных Skills для автоматизации рутинных задач.",
    requirements: [
      "Есть CLAUDE.md с описанием роли и правил агента",
      "Создано минимум 2 кастомных Skills",
      "Добавлены примеры использования каждого Skill",
      "Проведён peer-review работы однокурсника",
    ],
    checklist: [
      { id: 1, text: "Написал CLAUDE.md", done: false },
      { id: 2, text: "Создал Skill #1", done: false },
      { id: 3, text: "Создал Skill #2", done: false },
      { id: 4, text: "Провёл peer-review", done: false },
    ],
    feedback: null,
  },
  {
    id: 4,
    hwNumber: 4,
    title: "MCP интеграция",
    lessonId: 8,
    lessonTitle: "Урок 8 · MCP протокол",
    deadline: "07.06.2026",
    status: "locked",
    points: 80,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Подключи минимум один MCP-сервер к своему рабочему окружению и сними видео-демо того, как он помогает решать задачу.",
    requirements: [
      "Подключён минимум 1 MCP-сервер",
      "Подготовлено Loom-видео с демонстрацией",
      "Описано, какие задачи MCP решает в твоём домене",
    ],
    checklist: [
      { id: 1, text: "Выбрал подходящий MCP-сервер", done: false },
      { id: 2, text: "Настроил подключение", done: false },
      { id: 3, text: "Снял Loom-видео", done: false },
    ],
    feedback: null,
  },
  {
    id: 5,
    hwNumber: 5,
    title: "Доменный кейс",
    lessonId: 10,
    lessonTitle: "Урок 10 · Доменная экспертиза",
    deadline: "14.06.2026",
    status: "locked",
    points: 100,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Реши реальную задачу из своего домена с помощью агента. Зафиксируй контекст, код, процесс и итоговый эффект.",
    requirements: [
      "Выбрана реальная доменная задача",
      "Есть GitHub-репозиторий с кодом и настройками агента",
      "Подготовлено Loom-видео разбора решения",
      "Добавлено текстовое описание кейса и результата",
    ],
    checklist: [
      { id: 1, text: "Выбрал доменную задачу", done: false },
      { id: 2, text: "Решил задачу с агентом", done: false },
      { id: 3, text: "Выложил решение в GitHub", done: false },
      { id: 4, text: "Снял Loom-видео", done: false },
      { id: 5, text: "Описал кейс и результат", done: false },
    ],
    feedback: null,
  },
  {
    id: 6,
    hwNumber: 6,
    title: "Demo Day презентация",
    lessonId: 12,
    lessonTitle: "Урок 12 · Demo Day",
    deadline: "21.06.2026",
    status: "locked",
    points: 120,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Подготовь и запиши финальную презентацию своего прогресса и главного кейса буткемпа.",
    requirements: [
      "Есть 10-минутная презентация",
      "Записано Loom-видео или подготовлена live-демонстрация",
      "Собраны слайды или сценарий выступления",
    ],
    checklist: [
      { id: 1, text: "Подготовил презентацию", done: false },
      { id: 2, text: "Записал Loom-видео", done: false },
      { id: 3, text: "Подготовился к Demo Day", done: false },
    ],
    feedback: null,
  },
];

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
): NotificationRow {
  return {
    id: `local-${assignment.hwNumber}-${submittedAt}`,
    title: `ДЗ ${assignment.hwNumber} отправлено`,
    body: `Вы сдали "${assignment.title}". Ссылки уже появились в панели администратора.`,
    created_at: submittedAt,
  };
}

export default function AssignmentsPage() {
  const { user } = useUser();
  const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
  const isReviewer = role === "expert" || role === "admin";

  const [filter, setFilter] = useState<FilterKey>("all");
  const [assignments, setAssignments] = useState<AssignmentData[]>(INITIAL_ASSIGNMENTS);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<AdminSubmissionRow[]>([]);
  const [panelError, setPanelError] = useState("");
  const [loadingPanel, setLoadingPanel] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadPageData() {
      setAssignments(INITIAL_ASSIGNMENTS);
      setNotifications([]);
      setAdminSubmissions([]);
      setPanelError("");

      if (!user?.id) return;

      setLoadingPanel(true);
      const supabase = createClient();

      if (isReviewer) {
        const { data, error } = await supabase.rpc("get_assignment_submissions_feed");

        if (isCancelled) return;

        if (error) {
          setPanelError("Не удалось загрузить сданные ДЗ для панели проверки.");
        } else {
          setAdminSubmissions((data ?? []) as AdminSubmissionRow[]);
        }

        setLoadingPanel(false);
        return;
      }

      const [{ data: submissions, error: submissionsError }, { data: messageData, error: messagesError }] =
        await Promise.all([
          supabase.rpc("get_my_assignment_submissions"),
          supabase.rpc("get_my_notifications"),
        ]);

      if (isCancelled) return;

      if (submissionsError) {
        setPanelError("Не удалось загрузить статус уже сданных домашних заданий.");
      } else {
        setAssignments(
          mergeAssignmentsWithSubmissions(
            INITIAL_ASSIGNMENTS,
            (submissions ?? []) as StudentSubmissionRow[]
          )
        );
      }

      if (messagesError) {
        setPanelError((current) =>
          current || "Не удалось загрузить сообщения по домашним заданиям."
        );
      } else {
        setNotifications((messageData ?? []) as NotificationRow[]);
      }

      setLoadingPanel(false);
    }

    void loadPageData();

    return () => {
      isCancelled = true;
    };
  }, [isReviewer, user?.id]);

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
    const submittedAt = new Date().toISOString();

    const { error } = await supabase.rpc("submit_student_assignment", {
      hw_number: assignment.hwNumber,
      github_link: payload.githubUrl.trim() || null,
      video_link: payload.videoUrl.trim() || null,
      live_link: payload.liveUrl.trim() || null,
      artifact_text: payload.artifact.trim() || null,
    });

    if (error) {
      return {
        ok: false,
        error: "Не удалось отправить ДЗ. Проверь ссылки и попробуй ещё раз.",
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

  const counts = useMemo(() => {
    const result = {} as Record<FilterKey, number>;

    for (const key of Object.keys(FILTER_MATCH) as FilterKey[]) {
      result[key] = assignments.filter((assignment) =>
        FILTER_MATCH[key].includes(assignment.status)
      ).length;
    }

    return result;
  }, [assignments]);

  const filtered = useMemo(
    () => assignments.filter((assignment) => FILTER_MATCH[filter].includes(assignment.status)),
    [assignments, filter]
  );

  const segments = assignments.map((assignment) => ({
    label: `ДЗ ${assignment.hwNumber}`,
    status: assignment.status,
  }));

  const totalPoints = assignments.reduce(
    (sum, assignment) => sum + (assignment.pointsEarned ?? 0),
    0
  );
  const maxPoints = assignments.reduce((sum, assignment) => sum + assignment.points, 0);

  const queueSubmissions = useMemo(
    () =>
      adminSubmissions.map((submission) => ({
        id: submission.id,
        hwNumber: submission.hw_number,
        title:
          INITIAL_ASSIGNMENTS.find((assignment) => assignment.hwNumber === submission.hw_number)
            ?.title ?? `ДЗ ${submission.hw_number}`,
        studentName: submission.student_name,
        studentEmail: submission.student_email,
        githubUrl: submission.github_url,
        videoUrl: submission.video_url,
        liveUrl: submission.live_url,
        artifact: submission.artifact,
        status: submission.status,
        submittedAt: submission.submitted_at,
      })),
    [adminSubmissions]
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
        <AssignmentSummaryBar segments={segments} />

        {isReviewer ? (
          <AdminSubmissionQueue submissions={queueSubmissions} loading={loadingPanel} />
        ) : (
          <AssignmentNotificationsPanel
            notifications={notifications.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              createdAt: n.created_at,
            }))}
          />
        )}

        {panelError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {panelError}
          </div>
        )}

        <AssignmentFilters active={filter} counts={counts} onChange={setFilter} />

        <div className="flex flex-col gap-3">
          {filtered.map((assignment) => (
            <AssignmentPageCard
              key={assignment.id}
              assignment={assignment}
              isExpert={isReviewer}
              onStudentSubmit={isReviewer ? undefined : handleStudentSubmit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
