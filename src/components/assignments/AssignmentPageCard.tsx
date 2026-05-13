"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type ChecklistItem = {
  id: number;
  text: string;
  done: boolean;
};

export type AssignmentData = {
  id: number;
  hwNumber: number;
  title: string;
  lessonId: number;
  lessonTitle: string;
  deadline: string;
  status: "reviewed" | "submitted" | "in_progress" | "not_started" | "locked";
  points: number;
  pointsEarned: number | null;
  checklist: ChecklistItem[];
  githubUrl: string;
  videoUrl: string;
  liveUrl?: string;
  artifact?: string;
  submittedAt?: string | null;
  description: string;
  requirements: string[];
  feedback: string | null;
};

export type AssignmentSubmitPayload = {
  githubUrl: string;
  videoUrl: string;
  liveUrl: string;
  artifact: string;
};

export type AssignmentSubmitResult = {
  ok: boolean;
  error?: string;
  submittedAt?: string;
};

type Props = {
  assignment: AssignmentData;
  isExpert?: boolean;
  onStudentSubmit?: (
    assignment: AssignmentData,
    payload: AssignmentSubmitPayload
  ) => Promise<AssignmentSubmitResult>;
};

const STATUS_CONFIG: Record<
  AssignmentData["status"],
  { label: string; badgeCls: string; headerCls: string }
> = {
  reviewed: {
    label: "Проверено",
    badgeCls: "bg-green-100 text-green-700",
    headerCls: "border-l-4 border-[#16a34a]",
  },
  submitted: {
    label: "Сдано",
    badgeCls: "bg-blue-100 text-blue-700",
    headerCls: "border-l-4 border-[#2563eb]",
  },
  in_progress: {
    label: "В процессе",
    badgeCls: "bg-yellow-100 text-yellow-700",
    headerCls: "border-l-4 border-[#d97706]",
  },
  not_started: {
    label: "Не начато",
    badgeCls: "bg-zinc-100 text-zinc-500",
    headerCls: "border-l-4 border-zinc-300",
  },
  locked: {
    label: "Заблокировано",
    badgeCls: "bg-zinc-100 text-zinc-400",
    headerCls: "border-l-4 border-zinc-200",
  },
};

const STUDENT_TABS = ["Задание", "Чеклист", "Материалы", "Сдать / Статус"] as const;
const EXPERT_TABS = ["Задание", "Чеклист", "Материалы", "Оставить фидбек"] as const;

function formatSubmittedAt(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AssignmentPageCard({
  assignment,
  isExpert = false,
  onStudentSubmit,
}: Props) {
  const tabs = isExpert ? EXPERT_TABS : STUDENT_TABS;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(assignment.checklist);

  const [githubUrl, setGithubUrl] = useState(assignment.githubUrl);
  const [videoUrl, setVideoUrl] = useState(assignment.videoUrl);
  const [liveUrl, setLiveUrl] = useState(assignment.liveUrl ?? "");
  const [artifact, setArtifact] = useState(assignment.artifact ?? "");
  const [submitSaving, setSubmitSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");

  const [studentEmail, setStudentEmail] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState<number>(assignment.points);
  const [expertSaving, setExpertSaving] = useState(false);
  const [expertError, setExpertError] = useState("");
  const [expertDone, setExpertDone] = useState(false);

  useEffect(() => {
    setChecklist(assignment.checklist);
  }, [assignment.checklist]);

  useEffect(() => {
    setGithubUrl(assignment.githubUrl);
    setVideoUrl(assignment.videoUrl);
    setLiveUrl(assignment.liveUrl ?? "");
    setArtifact(assignment.artifact ?? "");
  }, [
    assignment.githubUrl,
    assignment.videoUrl,
    assignment.liveUrl,
    assignment.artifact,
  ]);

  const cfg = STATUS_CONFIG[assignment.status];
  const isLocked = assignment.status === "locked";
  const isReviewed = assignment.status === "reviewed";
  const isSubmitted =
    assignment.status === "submitted" || assignment.status === "reviewed";
  const doneCount = useMemo(
    () => checklist.filter((item) => item.done).length,
    [checklist]
  );
  const submittedAtLabel = formatSubmittedAt(assignment.submittedAt);

  function handleHeaderClick() {
    if (isLocked && !isExpert) return;
    setIsOpen((current) => !current);
  }

  function toggleCheck(id: number) {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  function isSubmitDisabled() {
    const hw = assignment.hwNumber;
    if (hw === 1 || hw === 3) return !githubUrl.trim();
    if (hw === 2) return !liveUrl.trim() || !githubUrl.trim();
    if (hw === 4 || hw === 6) return !videoUrl.trim();
    if (hw === 5) return !githubUrl.trim() || !videoUrl.trim() || !artifact.trim();
    return false;
  }

  async function handleStudentSubmit() {
    if (!onStudentSubmit) return;

    setSubmitSaving(true);
    setSubmitError("");
    setSubmitNotice("");

    const result = await onStudentSubmit(assignment, {
      githubUrl,
      videoUrl,
      liveUrl,
      artifact,
    });

    if (!result.ok) {
      setSubmitError(result.error ?? "Не удалось отправить домашнее задание.");
      setSubmitSaving(false);
      return;
    }

    setSubmitNotice(
      "Домашнее задание отправлено. Ссылки уже доступны в панели администратора."
    );
    setSubmitSaving(false);
  }

  async function handleExpertSubmit() {
    if (!studentEmail.trim() || !feedbackText.trim()) return;

    setExpertSaving(true);
    setExpertError("");

    const supabase = createClient();
    const { error } = await supabase.rpc("submit_expert_feedback", {
      student_email: studentEmail.trim(),
      hw_number: assignment.hwNumber,
      feedback_text: feedbackText.trim(),
      points_awarded: pointsAwarded,
    });

    if (error) {
      setExpertError(
        error.message.includes("не найден")
          ? "Студент с таким email не найден"
          : "Ошибка сохранения. Попробуй ещё раз."
      );
    } else {
      setExpertDone(true);
    }

    setExpertSaving(false);
  }

  return (
    <div
      className={`overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white shadow-sm ${cfg.headerCls}`}
    >
      <button
        onClick={handleHeaderClick}
        disabled={isLocked && !isExpert}
        className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors ${
          isLocked && !isExpert ? "cursor-default" : "hover:bg-zinc-50"
        }`}
        title={isLocked && !isExpert ? `Сначала пройди урок ${assignment.lessonId}` : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              ДЗ {assignment.hwNumber}: {assignment.title}
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${cfg.badgeCls}`}>
              {cfg.label}
            </span>
            {isExpert && (
              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                Проверка
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {assignment.lessonTitle} · до {assignment.deadline}
            {assignment.pointsEarned !== null && (
              <span className="ml-2 font-medium text-[#16a34a]">
                +{assignment.pointsEarned} очков
              </span>
            )}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="flex border-t border-[#e4e4e7] px-6">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === index
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-6 py-4">
          {activeTab === 0 && (
            <div>
              <p className="mb-3 text-sm text-zinc-700">{assignment.description}</p>
              <ul className="space-y-1.5">
                {assignment.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-0.5 shrink-0 text-[#2563eb]">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <p className="mb-3 text-xs text-zinc-500">
                Выполнено: {doneCount} / {checklist.length}
              </p>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !isExpert && toggleCheck(item.id)}
                    className="group flex w-full items-start gap-2.5 text-left"
                  >
                    {item.done ? (
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#16a34a]" />
                    ) : (
                      <Circle
                        size={18}
                        className="mt-0.5 shrink-0 text-zinc-300 group-hover:text-zinc-400"
                      />
                    )}
                    <span
                      className={`text-sm ${
                        item.done ? "text-zinc-400 line-through" : "text-zinc-700"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-2">
              {[
                { label: `Урок ${assignment.lessonId}`, href: "#" },
                { label: "Каталог материалов", href: "/materials" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 text-sm text-[#2563eb] hover:underline"
                >
                  <ExternalLink size={14} />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {activeTab === 3 && !isExpert && (
            <div>
              {isReviewed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-[#16a34a]" />
                    <span className="font-semibold text-zinc-900">Проверено</span>
                    {assignment.pointsEarned !== null && (
                      <span className="ml-auto text-sm font-medium text-[#16a34a]">
                        +{assignment.pointsEarned} / {assignment.points} очков
                      </span>
                    )}
                  </div>
                  {assignment.feedback && (
                    <div className="rounded-[6px] border border-[#e4e4e7] bg-zinc-50 p-3 text-sm text-zinc-700">
                      <p className="mb-1 text-xs font-medium text-zinc-500">Фидбек ментора:</p>
                      {assignment.feedback}
                    </div>
                  )}
                </div>
              ) : isSubmitted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <CheckCircle2 size={18} className="text-[#2563eb]" />
                    Работа сдана. Ожидай проверки ментора.
                  </div>

                  {submittedAtLabel && (
                    <p className="text-xs text-zinc-500">Отправлено: {submittedAtLabel}</p>
                  )}

                  <div className="grid gap-2">
                    {assignment.githubUrl && (
                      <a
                        href={assignment.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#2563eb] hover:underline"
                      >
                        GitHub: {assignment.githubUrl}
                      </a>
                    )}
                    {assignment.liveUrl && (
                      <a
                        href={assignment.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#2563eb] hover:underline"
                      >
                        Live URL: {assignment.liveUrl}
                      </a>
                    )}
                    {assignment.videoUrl && (
                      <a
                        href={assignment.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#2563eb] hover:underline"
                      >
                        Видео / Loom: {assignment.videoUrl}
                      </a>
                    )}
                    {assignment.artifact && (
                      <div className="rounded-[6px] border border-[#e4e4e7] bg-zinc-50 p-3 text-sm text-zinc-700">
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                          Описание артефакта
                        </p>
                        <p>{assignment.artifact}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(assignment.hwNumber === 1 ||
                    assignment.hwNumber === 2 ||
                    assignment.hwNumber === 3 ||
                    assignment.hwNumber === 5) && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        GitHub ссылка *
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(event) => setGithubUrl(event.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}

                  {assignment.hwNumber === 2 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Live URL *
                      </label>
                      <input
                        type="url"
                        value={liveUrl}
                        onChange={(event) => setLiveUrl(event.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}

                  {(assignment.hwNumber === 4 ||
                    assignment.hwNumber === 5 ||
                    assignment.hwNumber === 6) && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Видео / Loom ссылка *
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(event) => setVideoUrl(event.target.value)}
                        placeholder="https://loom.com/..."
                        className="w-full rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}

                  {assignment.hwNumber === 5 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Описание доменного кейса *
                      </label>
                      <textarea
                        value={artifact}
                        onChange={(event) => setArtifact(event.target.value)}
                        placeholder="Коротко опиши задачу, домен и результат..."
                        rows={3}
                        className="w-full resize-none rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}

                  {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                  {submitNotice && <p className="text-sm text-[#16a34a]">{submitNotice}</p>}

                  <button
                    disabled={submitSaving || isSubmitDisabled()}
                    onClick={handleStudentSubmit}
                    className="mt-1 rounded-[6px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitSaving ? "Отправляем..." : `Сдать ДЗ ${assignment.hwNumber}`}
                  </button>
                  <p className="mt-1 text-xs text-zinc-400">Максимум {assignment.points} очков</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 3 && isExpert && (
            <div>
              {expertDone ? (
                <div className="flex items-center gap-2 text-sm text-[#16a34a]">
                  <CheckCircle2 size={18} />
                  Фидбек сохранён. Студент увидит его в своём аккаунте.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">
                    Введи email студента, чтобы привязать фидбек к его аккаунту.
                  </p>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Email студента *
                    </label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(event) => setStudentEmail(event.target.value)}
                      placeholder="student@example.com"
                      className="w-full rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Фидбек *
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(event) => setFeedbackText(event.target.value)}
                      placeholder="Напиши развёрнутый комментарий по работе студента..."
                      rows={4}
                      className="w-full resize-none rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Очки (макс. {assignment.points})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.points}
                      value={pointsAwarded}
                      onChange={(event) => setPointsAwarded(Number(event.target.value))}
                      className="w-28 rounded-[4px] border border-[#e4e4e7] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  {expertError && <p className="text-sm text-red-600">{expertError}</p>}

                  <button
                    disabled={expertSaving || !studentEmail.trim() || !feedbackText.trim()}
                    onClick={handleExpertSubmit}
                    className="flex items-center gap-2 rounded-[6px] bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {expertSaving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Сохраняем...
                      </>
                    ) : (
                      "Сохранить фидбек"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
