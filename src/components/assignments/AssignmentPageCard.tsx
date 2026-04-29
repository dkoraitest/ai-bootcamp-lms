"use client";

import { useState } from "react";
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
  description: string;
  requirements: string[];
  feedback: string | null;
};

type Props = {
  assignment: AssignmentData;
  isExpert?: boolean;
};

const STATUS_CONFIG: Record<
  AssignmentData["status"],
  { label: string; badgeCls: string; headerCls: string }
> = {
  reviewed:    { label: "Проверено",     badgeCls: "bg-green-100 text-green-700",   headerCls: "border-l-4 border-[#16a34a]" },
  submitted:   { label: "Сдано",         badgeCls: "bg-blue-100 text-blue-700",     headerCls: "border-l-4 border-[#2563eb]" },
  in_progress: { label: "В процессе",    badgeCls: "bg-yellow-100 text-yellow-700", headerCls: "border-l-4 border-[#d97706]" },
  not_started: { label: "Не начато",     badgeCls: "bg-zinc-100 text-zinc-500",     headerCls: "border-l-4 border-zinc-300" },
  locked:      { label: "Заблокировано", badgeCls: "bg-zinc-100 text-zinc-400",     headerCls: "border-l-4 border-zinc-200" },
};

const STUDENT_TABS = ["Задание", "Чеклист", "Материалы", "Сдать / Статус"] as const;
const EXPERT_TABS  = ["Задание", "Чеклист", "Материалы", "Оставить фидбек"] as const;

export default function AssignmentPageCard({ assignment, isExpert = false }: Props) {
  const TABS = isExpert ? EXPERT_TABS : STUDENT_TABS;

  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(assignment.checklist);

  // student fields
  const [githubUrl, setGithubUrl] = useState(assignment.githubUrl);
  const [videoUrl, setVideoUrl]   = useState(assignment.videoUrl);
  const [liveUrl, setLiveUrl]     = useState("");
  const [artifact, setArtifact]   = useState("");

  // expert fields
  const [studentEmail, setStudentEmail]   = useState("");
  const [feedbackText, setFeedbackText]   = useState("");
  const [pointsAwarded, setPointsAwarded] = useState<number>(assignment.points);
  const [expertSaving, setExpertSaving]   = useState(false);
  const [expertError, setExpertError]     = useState("");
  const [expertDone, setExpertDone]       = useState(false);

  const cfg = STATUS_CONFIG[assignment.status];
  const isLocked   = assignment.status === "locked";
  const isReviewed = assignment.status === "reviewed";
  const isSubmitted = assignment.status === "submitted";

  function handleHeaderClick() {
    if (isLocked && !isExpert) return;
    setIsOpen((v) => !v);
  }

  function toggleCheck(id: number) {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  const doneCount = checklist.filter((c) => c.done).length;

  function isSubmitDisabled() {
    const hw = assignment.hwNumber;
    if (hw === 1 || hw === 3) return !githubUrl.trim();
    if (hw === 2)             return !liveUrl.trim() || !githubUrl.trim();
    if (hw === 4 || hw === 6) return !videoUrl.trim();
    if (hw === 5)             return !githubUrl.trim() || !videoUrl.trim() || !artifact.trim();
    return false;
  }

  async function handleExpertSubmit() {
    if (!studentEmail.trim() || !feedbackText.trim()) return;
    setExpertSaving(true);
    setExpertError("");

    const supabase = createClient();
    const { error } = await supabase.rpc("submit_expert_feedback", {
      student_email:  studentEmail.trim(),
      hw_number:      assignment.hwNumber,
      feedback_text:  feedbackText.trim(),
      points_awarded: pointsAwarded,
    });

    if (error) {
      setExpertError(error.message.includes("не найден")
        ? "Студент с таким email не найден"
        : "Ошибка сохранения. Попробуй ещё раз."
      );
    } else {
      setExpertDone(true);
    }
    setExpertSaving(false);
  }

  return (
    <div className={`bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm overflow-hidden ${cfg.headerCls}`}>
      {/* Header */}
      <button
        onClick={handleHeaderClick}
        disabled={isLocked && !isExpert}
        className={`w-full text-left px-6 py-4 flex items-center gap-4 transition-colors ${
          isLocked && !isExpert ? "cursor-default" : "hover:bg-zinc-50"
        }`}
        title={isLocked && !isExpert ? `Сначала пройди урок ${assignment.lessonId}` : undefined}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900 text-sm">
              ДЗ {assignment.hwNumber}: {assignment.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.badgeCls}`}>
              {cfg.label}
            </span>
            {isExpert && (
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-purple-100 text-purple-700">
                Эксперт
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {assignment.lessonTitle} · до {assignment.deadline}
            {assignment.pointsEarned !== null && (
              <span className="ml-2 text-[#16a34a] font-medium">
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

      {/* Expandable body */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        {/* Tabs */}
        <div className="flex border-t border-[#e4e4e7] px-6">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-6 py-4">
          {/* Tab 0: Задание */}
          {activeTab === 0 && (
            <div>
              <p className="text-sm text-zinc-700 mb-3">{assignment.description}</p>
              <ul className="space-y-1.5">
                {assignment.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="text-[#2563eb] mt-0.5 shrink-0">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 1: Чеклист */}
          {activeTab === 1 && (
            <div>
              <p className="text-xs text-zinc-500 mb-3">
                Выполнено: {doneCount} / {checklist.length}
              </p>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !isExpert && toggleCheck(item.id)}
                    className="flex items-start gap-2.5 w-full text-left group"
                  >
                    {item.done ? (
                      <CheckCircle2 size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={18} className="text-zinc-300 shrink-0 mt-0.5 group-hover:text-zinc-400" />
                    )}
                    <span className={`text-sm ${item.done ? "line-through text-zinc-400" : "text-zinc-700"}`}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Материалы */}
          {activeTab === 2 && (
            <div className="space-y-2">
              {[
                { label: "Урок " + assignment.lessonId, href: "#" },
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

          {/* Tab 3: Сдать / Статус (студент) */}
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
                    <div className="bg-zinc-50 rounded-[6px] p-3 text-sm text-zinc-700 border border-[#e4e4e7]">
                      <p className="text-xs text-zinc-500 font-medium mb-1">Фидбек ментора:</p>
                      {assignment.feedback}
                    </div>
                  )}
                </div>
              ) : isSubmitted ? (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle2 size={18} className="text-[#2563eb]" />
                  Работа сдана. Ожидай проверки ментора.
                </div>
              ) : (
                <div className="space-y-3">
                  {(assignment.hwNumber === 1 || assignment.hwNumber === 2 ||
                    assignment.hwNumber === 3 || assignment.hwNumber === 5) && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">GitHub ссылка *</label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}
                  {assignment.hwNumber === 2 && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">Live URL *</label>
                      <input
                        type="url"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}
                  {(assignment.hwNumber === 4 || assignment.hwNumber === 5 ||
                    assignment.hwNumber === 6) && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">Видео / Loom ссылка *</label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://loom.com/..."
                        className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}
                  {assignment.hwNumber === 5 && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">Описание доменного кейса *</label>
                      <textarea
                        value={artifact}
                        onChange={(e) => setArtifact(e.target.value)}
                        placeholder="Опиши свой домен и как применяешь агента..."
                        rows={3}
                        className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb] resize-none"
                      />
                    </div>
                  )}
                  <button
                    disabled={isSubmitDisabled()}
                    onClick={() => {}}
                    className="mt-1 px-4 py-2 rounded-[6px] text-sm font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Сдать ДЗ {assignment.hwNumber}
                  </button>
                  <p className="text-xs text-zinc-400 mt-1">Максимум {assignment.points} очков</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Оставить фидбек (эксперт) */}
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
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Email студента *</label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Фидбек *</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Напиши развёрнутый комментарий по работе студента..."
                      rows={4}
                      className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Очки (макс. {assignment.points})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.points}
                      value={pointsAwarded}
                      onChange={(e) => setPointsAwarded(Number(e.target.value))}
                      className="w-28 text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  {expertError && (
                    <p className="text-red-600 text-sm">{expertError}</p>
                  )}

                  <button
                    disabled={expertSaving || !studentEmail.trim() || !feedbackText.trim()}
                    onClick={handleExpertSubmit}
                    className="px-4 py-2 rounded-[6px] text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {expertSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
