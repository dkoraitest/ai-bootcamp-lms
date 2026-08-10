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
    lessonId: 1,
    lessonTitle: "Урок 1 · Что такое вайб кодинг + лестница автономии",
    deadline: "13.08.2026",
    status: "not_started",
    points: 50,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Сделать сводку через Cowork на общих данных в папке svodka/ и описать свою рабочую рутину промптом по формуле Сцена + Задача + Правила. Промпт показать в общем чате потока.",
    requirements: [
      "Развернуть Cowork: поставить, авторизоваться, проверить что всё работает",
      "Получить файл сводки в общей папке svodka/",
      "Приложить скрин или запись экрана с результатом",
      "Написать промпт под свою рутину по формуле Сцена + Задача + Правила",
      "Выложить промпт в общий чат и получить отклик от двух участников",
    ],
    checklist: [
      { id: 1, text: "Развернул Cowork и авторизовался", done: false },
      { id: 2, text: "Сводка по общим данным получена", done: false },
      { id: 3, text: "Подготовил скрин или запись экрана", done: false },
      { id: 4, text: "Написал промпт под свою рутину по формуле", done: false },
      { id: 5, text: "Промпт выложен в чат, двое откликнулись", done: false },
    ],
    feedback: null,
  },
  {
    id: 2,
    hwNumber: 2,
    title: "Рабочий сетап — восемь галочек",
    lessonId: 3,
    lessonTitle: "Урок 3 · Личный контекст и первый проект",
    deadline: "15.08.2026",
    status: "not_started",
    points: 50,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Собрать систему, в которой вы делаете проекты и переключаете модели. Восемь пунктов, каждый проверяется скриншотом: либо есть, либо нет. Почти всё делается в эфире на Лайвах 2 и 3, дома остаётся добить хвосты.",
    requirements: [
      "Скрин структуры папок",
      "Скрин settings.json",
      "Скрин переключения модели на живой задаче",
      "Первый проект с git-коммитом",
    ],
    checklist: [
      { id: 1, text: "Claude Code стартует из терминала внутри VS Code", done: false },
      { id: 2, text: "Заведена папка Claude Projects, проекты лежат только там", done: false },
      { id: 3, text: "В служебной ~/.claude проектов нет", done: false },
      { id: 4, text: "settings.json настроен: модель, effort, список моделей", done: false },
      { id: 5, text: "Переключение модели проверено на живой задаче, разница видна", done: false },
      { id: 6, text: "Глобальный CLAUDE.md заполнен, пять разделов", done: false },
      { id: 7, text: "Первый проект создан в правильном месте, в нём свой CLAUDE.md", done: false },
      { id: 8, text: "В проекте git init и хотя бы один коммит", done: false },
    ],
    feedback: null,
  },
  {
    id: 3,
    hwNumber: 3,
    title: "Публичная ссылка + своя команда",
    lessonId: 5,
    lessonTitle: "Урок 5 · Свои инструменты: slash и skill",
    deadline: "25.08.2026",
    status: "not_started",
    points: 60,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Собрать и опубликовать результат, применив три принципа вайб-кодинга, и завернуть повторяющееся действие в свою slash-команду.",
    requirements: [
      "Ссылка на задеплоенную страницу, открывается у постороннего",
      "git-репо от 4 коммитов",
      "Рабочая slash-команда",
    ],
    checklist: [
      { id: 1, text: "Страница открывается по живой ссылке у постороннего", done: false },
      { id: 2, text: "В репозитории минимум 4 коммита", done: false },
      { id: 3, text: "Slash-команда вызывается и даёт результат", done: false },
      { id: 4, text: "Ссылка опубликована в общем чате", done: false },
    ],
    feedback: null,
  },
  {
    id: 4,
    hwNumber: 4,
    title: "MCP к своей системе + база знаний",
    lessonId: 7,
    lessonTitle: "Урок 7 · Память агента: четыре уровня",
    deadline: "01.09.2026",
    status: "locked",
    points: 70,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Подключить агента к своим источникам и выбрать уровень памяти под задачу по правилу «поднимайся когда упёрся».",
    requirements: [
      "Скрин работающего MCP на своих данных",
      "Описание, какой уровень памяти выбран и почему",
    ],
    checklist: [
      { id: 1, text: "MCP подключён и делает запросы к своей системе", done: false },
      { id: 2, text: "Права проверены, лишнего доступа нет", done: false },
      { id: 3, text: "База знаний подключена", done: false },
      { id: 4, text: "Выбор уровня памяти объяснён", done: false },
      { id: 5, text: "Дано peer review в общем чате", done: false },
    ],
    feedback: null,
  },
  {
    id: 5,
    hwNumber: 5,
    title: "Защищённый агент + зафиксированный кейс",
    lessonId: 9,
    lessonTitle: "Урок 9 · Свой кейс: выбор и запуск",
    deadline: "08.09.2026",
    status: "locked",
    points: 80,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Ограничить права агента двумя хуками и публично зафиксировать задачу, которая станет финальным проектом.",
    requirements: [
      "Два хука установлены и проверены: rm -rf блокируется",
      "Публично зафиксированный кейс в чате",
    ],
    checklist: [
      { id: 1, text: "Хук guard установлен, опасная команда блокируется", done: false },
      { id: 2, text: "Хук log установлен и пишет", done: false },
      { id: 3, text: "Security audit пройден", done: false },
      { id: 4, text: "Кейс назван в общем чате", done: false },
    ],
    feedback: null,
  },
  {
    id: 6,
    hwNumber: 6,
    title: "Рабочий кейс на своих данных",
    lessonId: 10,
    lessonTitle: "Урок 10 · Свой кейс: доведение до результата",
    deadline: "15.09.2026",
    status: "locked",
    points: 100,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    liveUrl: "",
    artifact: "",
    submittedAt: null,
    description:
      "Довести зафиксированный кейс до измеримого результата. Это ядро финального демо.",
    requirements: [
      "Ссылка на git-репозиторий",
      "Видео 2–3 минуты",
      "Артефакт результата: отчёт, контент, лиды",
    ],
    checklist: [
      { id: 1, text: "Кейс работает на собственных данных, не на учебных", done: false },
      { id: 2, text: "Есть видимый результат", done: false },
      { id: 3, text: "Видео снято", done: false },
      { id: 4, text: "Дано peer review двум участникам потока", done: false },
    ],
    feedback: null,
  },
  {
    id: 7,
    hwNumber: 7,
    title: "Финальный проект и защита",
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
      "Питч 5 минут на демо-дне плюс 3 минуты вопросов, рабочий проект за ним.",
    requirements: [
      "Питч 5 минут на демо-дне",
      "Рабочий проект",
      "Согласие на check-in через 30 дней",
    ],
    checklist: [
      { id: 1, text: "Питч собран по структуре: задача, решение, демо, результат", done: false },
      { id: 2, text: "Проект работает и показывается вживую", done: false },
      { id: 3, text: "Занят слот демо-дня", done: false },
      { id: 4, text: "Дано согласие на check-in через 30 дней", done: false },
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
  const materialsByHw = useAssignmentMaterials();
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
      const materials = materialsByHw[assignment.hwNumber];
      if (!schedule?.is_released || !schedule.deadline) {
        const status: AssignmentData["status"] =
          assignment.status === "submitted" || assignment.status === "reviewed"
            ? assignment.status
            : "locked";
        return { ...assignment, materials, deadline: "Дата уточняется", daysLeft: 0, status };
      }

      const deadline = new Date(schedule.deadline);
      return {
        ...assignment,
        materials,
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
  }, [assignmentSchedule, assignments, materialsByHw, scheduleLoading]);

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
