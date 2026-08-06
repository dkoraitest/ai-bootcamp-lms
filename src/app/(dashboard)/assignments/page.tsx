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
import { useCohortSchedule } from "@/lib/hooks/useContentUrls";

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

const INITIAL_ASSIGNMENTS: AssignmentData[] = [
  {
    id: 1,
    hwNumber: 1,
    title: "Сводка через Cowork + своя рутина по формуле",
    lessonId: 2,
    lessonTitle: "Урок 2 · Цикл вайб-кодинга + экономика",
    deadline: "17.08.2026",
    status: "not_started",
    points: 50,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Сделать сводку через Cowork на общих данных в папке svodka/ и описать свою рабочую рутину промптом по формуле Сцена + Задача + Правила. Промпт показать двум людям из своей тройки.",
    requirements: [
      "Развернуть Cowork: поставить, авторизоваться, проверить что всё работает",
      "Получить файл сводки в общей папке svodka/",
      "Приложить скрин или запись экрана с результатом",
      "Написать промпт под свою рутину по формуле Сцена + Задача + Правила",
      "Получить подтверждение промпта от двух человек из тройки",
    ],
    checklist: [
      { id: 1, text: "Развернул Cowork и авторизовался", done: false },
      { id: 2, text: "Сводка по общим данным получена", done: false },
      { id: 3, text: "Подготовил скрин или запись экрана", done: false },
      { id: 4, text: "Написал промпт под свою рутину по формуле", done: false },
      { id: 5, text: "Промпт подтверждён двумя людьми из тройки", done: false },
    ],
    feedback: null,
  },
  {
    id: 2,
    hwNumber: 2,
    title: "Скрипт + задеплоенная страница",
    lessonId: 4,
    lessonTitle: "Урок 4 · Цикл на полную: 3 принципа + публичная ссылка",
    deadline: "24.08.2026",
    status: "not_started",
    points: 60,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Довести скрипт из Лайва 3 до работы на двух разных папках и задеплоить страницу, которая открывается у постороннего человека. Ссылку выложить в общий канал.",
    requirements: [
      "Публичная ссылка на страницу, открывается у постороннего",
      "git-репо с историей минимум 4 коммита",
      "Скрипт из Лайва 3, отработавший на двух разных папках",
      "Описание своей рабочей задачи по формуле",
    ],
    checklist: [
      { id: 1, text: "Страница открывается по живой ссылке", done: false },
      { id: 2, text: "Скрипт отработал на второй папке без правок", done: false },
      { id: 3, text: "git-репо с историей минимум 4 коммита", done: false },
      { id: 4, text: "Ссылка опубликована в общем канале", done: false },
    ],
    feedback: null,
  },
  {
    id: 3,
    hwNumber: 3,
    title: "Личная ОС в CLAUDE.md + 2 Skills",
    lessonId: 6,
    lessonTitle: "Урок 6 · Расширения агента: slash и skill",
    deadline: "30.08.2026",
    status: "not_started",
    points: 70,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Собрать личную ОС в CLAUDE.md по шаблону из пяти разделов и написать 2 рабочих Skill под свои регулярные задачи. Один из них — апгрейд промпта первой недели.",
    requirements: [
      "CLAUDE.md содержит все 5 разделов, минимум по 2 строки на раздел",
      "MCP audit пройден, лишнее отключено",
      "2 Skill реально вызываются и дают результат",
      "Хотя бы один Skill — апгрейд промпта из первой недели",
      "Дано peer review двум участникам своей тройки",
    ],
    checklist: [
      { id: 1, text: "Написал CLAUDE.md из 5 разделов", done: false },
      { id: 2, text: "Прошёл MCP audit, отключил лишнее", done: false },
      { id: 3, text: "Создал Skill #1 — апгрейд промпта W1", done: false },
      { id: 4, text: "Создал Skill #2", done: false },
      { id: 5, text: "Дал peer review двум участникам тройки", done: false },
    ],
    feedback: null,
  },
  {
    id: 4,
    hwNumber: 4,
    title: "Ресёрч-агент с MCP + RAG",
    lessonId: 8,
    lessonTitle: "Урок 8 · Память агента: четыре уровня",
    deadline: "06.09.2026",
    status: "locked",
    points: 80,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Развернуть ресёрч-агента с одним MCP и одной базой знаний под свою задачу. Уровень доверия — read-only. Записать 1-минутное видео-демо.",
    requirements: [
      "Подключён 1 MCP, он реально делает запросы",
      "Подключена база знаний: свои документы или Notion",
      "Уровень доверия read-only, hard writes отсутствуют",
      "Видео-демо 1 минута: вопрос → ответ по документам плюс веб-поиск",
    ],
    checklist: [
      { id: 1, text: "Подключил MCP и проверил запросы", done: false },
      { id: 2, text: "Подключил свою базу знаний", done: false },
      { id: 3, text: "Проверил, что доступ read-only", done: false },
      { id: 4, text: "Снял видео-демо 1 минута", done: false },
    ],
    feedback: null,
  },
  {
    id: 5,
    hwNumber: 5,
    title: "Доменный кейс",
    lessonId: 10,
    lessonTitle: "Урок 10 · Свой кейс: доведение до результата",
    deadline: "13.09.2026",
    status: "locked",
    points: 100,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Развернуть один кейс из своей доменной зоны: Claude Code плюс минимум один MCP и база знаний. Это ядро финального демо.",
    requirements: [
      "Кейс работает на собственных данных, не на учебных",
      "Использован минимум один MCP и минимум один источник знаний",
      "Есть видимый результат: отчёт, контент, лиды или транскрипт",
      "Ссылка на репозиторий и видео 2–3 минуты",
    ],
    checklist: [
      { id: 1, text: "Выбрал кейс из своей доменной зоны", done: false },
      { id: 2, text: "Агент работает на собственных данных", done: false },
      { id: 3, text: "Подключил MCP и источник знаний", done: false },
      { id: 4, text: "Снял видео 2–3 минуты", done: false },
      { id: 5, text: "Дал peer review двум участникам доменной тройки", done: false },
    ],
    feedback: null,
  },
  {
    id: 6,
    hwNumber: 6,
    title: "Финальный проект + питч",
    lessonId: 12,
    lessonTitle: "Урок 12 · Demo Day · Защита проектов",
    deadline: "15.09.2026",
    status: "locked",
    points: 120,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Финальный проект на базе кейса пятой недели: пройденный security audit и 2 хука. Питч 5 минут по структуре задача · решение · демо · результат, плюс 3 минуты вопросов.",
    requirements: [
      "Security audit пройден по четырём вопросам",
      "2 хука установлены и работают",
      "Питч 5 минут подготовлен",
      "Занят слот в общем расписании демо-дня",
      "Дано согласие на 30-day check-in",
    ],
    checklist: [
      { id: 1, text: "Прошёл security audit", done: false },
      { id: 2, text: "Установил и проверил 2 хука", done: false },
      { id: 3, text: "Подготовил питч 5 минут", done: false },
      { id: 4, text: "Занял слот демо-дня", done: false },
      { id: 5, text: "Дал согласие на 30-day check-in", done: false },
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
  const { assignmentSchedule, loading: scheduleLoading } = useCohortSchedule();
  const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
  const isReviewer = isPrivileged || role === "expert" || role === "admin";

  const [filter, setFilter] = useState<FilterKey>("all");
  const [assignments, setAssignments] = useState<AssignmentData[]>(INITIAL_ASSIGNMENTS);
  const [notifications, setNotifications] = useState<AssignmentNotification[]>([]);
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
        setNotifications(((messageData ?? []) as NotificationRow[]).map(mapNotificationRow));
      }

      setLoadingPanel(false);
    }

    void loadPageData();

    return () => {
      isCancelled = true;
    };
  }, [activeCohortId, isReviewer, user?.id]);

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

    return [...assignments, ...extraAssignments]
      .sort((a, b) => a.hwNumber - b.hwNumber)
      .map((assignment) => {
      const schedule = scheduleByHw.get(assignment.hwNumber);
      if (!schedule?.is_released || !schedule.deadline) {
        const status: AssignmentData["status"] =
          assignment.status === "submitted" || assignment.status === "reviewed"
            ? assignment.status
            : "locked";
        return { ...assignment, deadline: "Дата уточняется", daysLeft: 0, status };
      }

      const deadline = new Date(schedule.deadline);
      return {
        ...assignment,
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
  }, [assignmentSchedule, assignments, scheduleLoading]);

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
        feedback: submission.feedback,
        pointsEarned: submission.points_earned,
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
