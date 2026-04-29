"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import LessonCard from "./LessonCard";
import DemoDayCard from "./DemoDayCard";
import AssignmentCard, { type AssignmentData } from "./AssignmentCard";

type LessonStatus = "completed" | "watching" | "locked";

type LessonData = {
  id: number;
  week: number;
  date: string;
  topic: string;
  hasHw: boolean;
  hwNumber?: number;
  status: LessonStatus;
  videoUrl: string;
  isDemoDay?: boolean;
};

type Props = {
  weekNumber: number;
  theme: string;
  lessons: LessonData[];
  techniques: Record<number, string[]>;
  assignments: Record<number, AssignmentData>;
  defaultOpen?: boolean;
};

function getWeekBadge(lessons: LessonData[]): string {
  if (lessons.every((l) => l.status === "completed")) return "✅";
  if (lessons.some((l) => l.status === "watching" || l.status === "completed")) return "🔄";
  return "⬜";
}

export default function WeekBlock({
  weekNumber,
  theme,
  lessons,
  techniques,
  assignments,
  defaultOpen = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const badge = getWeekBadge(lessons);

  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-medium text-sm flex items-center justify-center shrink-0">
            {weekNumber}
          </span>
          <span className="font-medium text-zinc-900 text-left">
            Неделя {weekNumber} — {theme}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-sm text-zinc-400 hidden sm:inline">2 урока</span>
          <span className="text-sm">{badge}</span>
          {isOpen ? (
            <ChevronUp size={18} className="text-zinc-400" />
          ) : (
            <ChevronDown size={18} className="text-zinc-400" />
          )}
        </div>
      </button>

      {/* Accordion body */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-4 flex flex-col gap-3">
          {lessons.map((lesson) => (
            <div key={lesson.id}>
              {lesson.isDemoDay ? (
                <DemoDayCard
                  id={lesson.id}
                  date={lesson.date}
                  topic={lesson.topic}
                />
              ) : (
                <LessonCard
                  lesson={lesson}
                  techniques={techniques[lesson.id] ?? []}
                />
              )}

              {lesson.hasHw && lesson.hwNumber && assignments[lesson.id] && (
                <div className="ml-4 mt-2 border-l-4 border-[#2563eb] pl-4">
                  <AssignmentCard assignment={assignments[lesson.id]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
