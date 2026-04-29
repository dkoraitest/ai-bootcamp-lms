"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle, ExternalLink } from "lucide-react";

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
};

const STATUS_CONFIG: Record<
  AssignmentData["status"],
  { label: string; badgeCls: string; headerCls: string }
> = {
  reviewed:    { label: "Проверено",    badgeCls: "bg-green-100 text-green-700",  headerCls: "border-l-4 border-[#16a34a]" },
  submitted:   { label: "Сдано",        badgeCls: "bg-blue-100 text-blue-700",    headerCls: "border-l-4 border-[#2563eb]" },
  in_progress: { label: "В процессе",   badgeCls: "bg-yellow-100 text-yellow-700",headerCls: "border-l-4 border-[#d97706]" },
  not_started: { label: "Не начато",    badgeCls: "bg-zinc-100 text-zinc-500",    headerCls: "border-l-4 border-zinc-300" },
  locked:      { label: "Заблокировано",badgeCls: "bg-zinc-100 text-zinc-400",    headerCls: "border-l-4 border-zinc-200" },
};

const TABS = ["Задание", "Чеклист", "Материалы", "Сдать / Статус"] as const;

export default function AssignmentPageCard({ assignment }: Props) {
  const [isOpen, setIsOpen]         = useState(false);
  const [activeTab, setActiveTab]   = useState<number>(
    assignment.status === "reviewed" ? 3 : 0
  );
  const [checklist, setChecklist]   = useState<ChecklistItem[]>(assignment.checklist);
  const [githubUrl, setGithubUrl]   = useState(assignment.githubUrl);
  const [videoUrl, setVideoUrl]     = useState(assignment.videoUrl);
  const [liveUrl, setLiveUrl]       = useState("");
  const [artifact, setArtifact]     = useState("");

  const cfg = STATUS_CONFIG[assignment.status];
  const isLocked = assignment.status === "locked";
  const isReviewed = assignment.status === "reviewed";
  const isSubmitted = assignment.status === "submitted";

  function handleHeaderClick() {
    if (isLocked) return;
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

  return (
    <div className={`bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm overflow-hidden ${cfg.headerCls}`}>
      {/* Header */}
      <button
        onClick={handleHeaderClick}
        disabled={isLocked}
        className={`w-full text-left px-6 py-4 flex items-center gap-4 transition-colors ${
          isLocked ? "cursor-default" : "hover:bg-zinc-50"
        }`}
        title={isLocked ? `Сначала пройди урок ${assignment.lessonId}` : undefined}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900 text-sm">
              ДЗ {assignment.hwNumber}: {assignment.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.badgeCls}`}>
              {cfg.label}
            </span>
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
        {!isLocked && (
          <ChevronDown
            size={18}
            className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
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
                    onClick={() => toggleCheck(item.id)}
                    className="flex items-start gap-2.5 w-full text-left group"
                  >
                    {item.done ? (
                      <CheckCircle2 size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={18} className="text-zinc-300 shrink-0 mt-0.5 group-hover:text-zinc-400" />
                    )}
                    <span
                      className={`text-sm ${
                        item.done ? "line-through text-zinc-400" : "text-zinc-700"
                      }`}
                    >
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

          {/* Tab 3: Сдать / Статус */}
          {activeTab === 3 && (
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
                  {(assignment.hwNumber === 1 ||
                    assignment.hwNumber === 2 ||
                    assignment.hwNumber === 3 ||
                    assignment.hwNumber === 5) && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        GitHub ссылка *
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}

                  {(assignment.hwNumber === 2) && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Live URL *
                      </label>
                      <input
                        type="url"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      />
                    </div>
                  )}

                  {(assignment.hwNumber === 4 ||
                    assignment.hwNumber === 5 ||
                    assignment.hwNumber === 6) && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Видео / Loom ссылка *
                      </label>
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
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Описание доменного кейса *
                      </label>
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
                  <p className="text-xs text-zinc-400 mt-1">
                    Максимум {assignment.points} очков за это задание
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
