"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

type AssignmentStatus = "not_started" | "in_progress" | "submitted" | "reviewed";
type Tab = "task" | "checklist" | "rubric" | "submit";

type RubricItem = {
  level: string;
  description: string;
};

export type AssignmentData = {
  hwNumber: number;
  title: string;
  description: string;
  deadline: string;
  daysLeft: number;
  deliverables: string[];
  checklist: string[];
  rubric: RubricItem[];
  status: AssignmentStatus;
  githubUrl: string;
  videoUrl: string;
};

type Props = {
  assignment: AssignmentData;
};

const STATUS_BADGE: Record<AssignmentStatus, { label: string; classes: string }> = {
  not_started: { label: "Не начато",  classes: "bg-zinc-100 text-zinc-500" },
  in_progress:  { label: "В работе",   classes: "bg-yellow-100 text-yellow-700" },
  submitted:    { label: "Сдано",      classes: "bg-blue-100 text-blue-700" },
  reviewed:     { label: "Проверено",  classes: "bg-green-100 text-green-700" },
};

const RUBRIC_BADGE: Record<string, string> = {
  "Базовый":  "bg-zinc-100 text-zinc-600",
  "Хороший":  "bg-blue-100 text-blue-700",
  "Отличный": "bg-green-100 text-green-700",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "task",      label: "Задание" },
  { key: "checklist", label: "Чеклист" },
  { key: "rubric",    label: "Рубрика" },
  { key: "submit",    label: "Сдать" },
];

export default function AssignmentCard({ assignment }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("task");

  const badge = STATUS_BADGE[assignment.status];
  const isSubmitted =
    assignment.status === "submitted" || assignment.status === "reviewed";
  const deadlineColor =
    assignment.daysLeft <= 3 ? "text-[#d97706]" : "text-zinc-500";

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-lg overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <span className="font-medium text-zinc-800 text-sm text-left">
          📝 ДЗ #{assignment.hwNumber}: {assignment.title}
        </span>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.classes}`}>
            {badge.label}
          </span>
          {isOpen ? (
            <ChevronUp size={16} className="text-zinc-400" />
          ) : (
            <ChevronDown size={16} className="text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[1200px]" : "max-h-0"
        }`}
      >
        {/* Tab bar */}
        <div className="flex border-b border-[#e4e4e7] px-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm px-3 py-2.5 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#2563eb] text-[#2563eb] font-medium"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {/* Tab 1 — Задание */}
          {activeTab === "task" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-700">{assignment.description}</p>
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
                  Что сдать:
                </p>
                <ul className="space-y-1">
                  {assignment.deliverables.map((d, i) => (
                    <li key={i} className="text-sm text-zinc-700 flex gap-2">
                      <span className="text-zinc-400 shrink-0">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <p className={`text-sm ${deadlineColor}`}>
                ⏰ Дедлайн: {assignment.deadline}
              </p>
            </div>
          )}

          {/* Tab 2 — Чеклист */}
          {activeTab === "checklist" && (
            <div className="space-y-2.5">
              {assignment.checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded border border-zinc-300 bg-white shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3 — Рубрика */}
          {activeTab === "rubric" && (
            <div className="space-y-2.5">
              {assignment.rubric.map((row) => (
                <div key={row.level} className="flex items-start gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${
                      RUBRIC_BADGE[row.level] ?? "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {row.level}
                  </span>
                  <p className="text-sm text-zinc-700 pt-0.5">{row.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4 — Сдать */}
          {activeTab === "submit" && (
            <div>
              {isSubmitted ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 size={36} className="text-green-600" />
                  <p className="text-green-700 font-medium">Работа сдана</p>
                  {assignment.githubUrl && (
                    <a
                      href={assignment.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#2563eb] underline"
                    >
                      GitHub репозиторий
                    </a>
                  )}
                  {assignment.videoUrl && (
                    <a
                      href={assignment.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#2563eb] underline"
                    >
                      Видео-демо
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Ссылка на GitHub
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Ссылка на видео-демо
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>
                  <button
                    onClick={() => console.log("submit hw")}
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md py-2 text-sm font-medium transition-colors"
                  >
                    Сдать домашнее задание
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
