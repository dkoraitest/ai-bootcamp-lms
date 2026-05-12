"use client";

import { useState, useMemo } from "react";
import AssignmentSummaryBar from "@/components/assignments/AssignmentSummaryBar";
import AssignmentFilters, { FilterKey } from "@/components/assignments/AssignmentFilters";
import AssignmentPageCard, { AssignmentData } from "@/components/assignments/AssignmentPageCard";
import { useUser } from "@/lib/hooks/useUser";

const ASSIGNMENTS: AssignmentData[] = [
  {
    id: 1,
    hwNumber: 1,
    title: "Промпт-инжиниринг",
    lessonId: 2,
    lessonTitle: "Урок 2 — Архитектура промптов",
    deadline: "17.05.2026",
    status: "not_started",
    points: 50,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    description:
      "Развернуть Cowork, взять реальную задачу из своей работы, написать промпт по формуле Сцена + Задача + Правила, запустить автоматизацию и поделиться результатом.",
    requirements: [
      "Развернуть Cowork: поставить, авторизоваться, проверить что работает",
      "Взять одну рутину из своего списка делегирования — реальную задачу, прошедшую 3-вопросный фильтр",
      "Написать промпт по формуле Сцена + Задача + Правила (прошёл Golden Rule)",
      "Запустить автоматизацию в Cowork — AI должен реально что-то сделать",
      "Выложить 30-сек видео или скрин в группу: «вот мой агент, вот что он сделал»",
    ],
    checklist: [
      { id: 1, text: "Развернул Cowork и авторизовался", done: false },
      { id: 2, text: "Выбрал реальную рутину из работы", done: false },
      { id: 3, text: "Написал промпт по формуле Сцена + Задача + Правила", done: false },
      { id: 4, text: "Запустил автоматизацию в Cowork", done: false },
      { id: 5, text: "Выложил видео или скрин в группу", done: false },
    ],
    feedback: null,
  },
  {
    id: 2,
    hwNumber: 2,
    title: "Mini-App деплой",
    lessonId: 4,
    lessonTitle: "Урок 4 — Vibe Coding",
    deadline: "24.05.2026",
    status: "not_started",
    points: 60,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    description:
      "Задеплой мини-приложение на базе Claude Code. Это может быть любой инструмент для твоего домена — бот, скрипт-автоматизация или веб-интерфейс.",
    requirements: [
      "Рабочее приложение задеплоено (Vercel, Railway, Replit и т.д.)",
      "Исходный код в GitHub",
      "Live URL доступен публично",
      "README с описанием что делает приложение",
    ],
    checklist: [
      { id: 1, text: "Выбрал идею приложения", done: false },
      { id: 2, text: "Написал код с Claude Code", done: false },
      { id: 3, text: "Задеплоил приложение", done: false },
      { id: 4, text: "Написал README", done: false },
    ],
    feedback: null,
  },
  {
    id: 3,
    hwNumber: 3,
    title: "CLAUDE.md + Skills",
    lessonId: 6,
    lessonTitle: "Урок 6 — Операционная система агента",
    deadline: "31.05.2026",
    status: "not_started",
    points: 70,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    description:
      "Настрой операционную систему своего агента: напиши CLAUDE.md и создай 2 кастомных Skills для автоматизации рутинных задач.",
    requirements: [
      "CLAUDE.md с описанием роли, контекста и правил агента",
      "Минимум 2 кастомных Skills в .claude/commands/",
      "Примеры использования каждого Skill",
      "Пир-ревью CLAUDE.md одного однокурсника",
    ],
    checklist: [
      { id: 1, text: "Написал CLAUDE.md", done: false },
      { id: 2, text: "Создал Skill #1", done: false },
      { id: 3, text: "Создал Skill #2", done: false },
      { id: 4, text: "Провёл пир-ревью", done: false },
    ],
    feedback: null,
  },
  {
    id: 4,
    hwNumber: 4,
    title: "MCP интеграция",
    lessonId: 8,
    lessonTitle: "Урок 8 — MCP протокол",
    deadline: "07.06.2026",
    status: "locked",
    points: 80,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    description:
      "Подключи минимум один MCP-сервер к своему рабочему окружению и сними видео демонстрацию использования.",
    requirements: [
      "Подключён минимум 1 MCP-сервер",
      "Loom-видео демонстрация (5–10 мин)",
      "Описание какие задачи решает MCP в твоём домене",
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
    lessonTitle: "Урок 10 — Доменная экспертиза",
    deadline: "14.06.2026",
    status: "locked",
    points: 100,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    description:
      "Реши реальную задачу из своего домена с помощью Claude Code агента. Задокументируй процесс и результат.",
    requirements: [
      "Реальная задача из твоего профессионального домена",
      "GitHub с кодом и CLAUDE.md под конкретную задачу",
      "Loom-видео разбор решения (10–15 мин)",
      "Текстовое описание домена и эффекта от агента",
    ],
    checklist: [
      { id: 1, text: "Выбрал доменную задачу", done: false },
      { id: 2, text: "Решил задачу с агентом", done: false },
      { id: 3, text: "Запушил в GitHub", done: false },
      { id: 4, text: "Снял Loom-видео", done: false },
      { id: 5, text: "Написал описание кейса", done: false },
    ],
    feedback: null,
  },
  {
    id: 6,
    hwNumber: 6,
    title: "Demo Day презентация",
    lessonId: 12,
    lessonTitle: "Урок 12 — Demo Day",
    deadline: "21.06.2026",
    status: "locked",
    points: 120,
    pointsEarned: null,
    githubUrl: "",
    videoUrl: "",
    description:
      "Подготовь и запиши финальную презентацию своего прогресса и главного кейса буткемпа.",
    requirements: [
      "Презентация 10 минут: домен, проблема, решение, результат",
      "Loom-видео записи презентации",
      "Слайды или демо live (на выбор)",
    ],
    checklist: [
      { id: 1, text: "Подготовил презентацию", done: false },
      { id: 2, text: "Записал Loom-видео", done: false },
      { id: 3, text: "Выступил на Demo Day", done: false },
    ],
    feedback: null,
  },
];

const FILTER_MATCH: Record<FilterKey, AssignmentData["status"][]> = {
  all:       ["reviewed", "submitted", "in_progress", "not_started", "locked"],
  active:    ["in_progress", "not_started"],
  submitted: ["submitted"],
  reviewed:  ["reviewed"],
  locked:    ["locked"],
};

export default function AssignmentsPage() {
  const { user } = useUser();
  const isExpert = (user?.app_metadata as Record<string, unknown> | undefined)?.role === "expert";

  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const result = {} as Record<FilterKey, number>;
    for (const key of Object.keys(FILTER_MATCH) as FilterKey[]) {
      result[key] = ASSIGNMENTS.filter((a) =>
        FILTER_MATCH[key].includes(a.status)
      ).length;
    }
    return result;
  }, []);

  const filtered = useMemo(
    () => ASSIGNMENTS.filter((a) => FILTER_MATCH[filter].includes(a.status)),
    [filter]
  );

  const segments = ASSIGNMENTS.map((a) => ({
    label: `ДЗ ${a.hwNumber}`,
    status: a.status,
  }));

  const totalPoints = ASSIGNMENTS.reduce(
    (sum, a) => sum + (a.pointsEarned ?? 0),
    0
  );
  const maxPoints = ASSIGNMENTS.reduce((sum, a) => sum + a.points, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Домашние задания</h1>
        <p className="text-sm text-[#71717a] mt-1">
          {totalPoints} / {maxPoints} очков
          {isExpert && <span className="ml-2 text-purple-600 font-medium">· Режим эксперта</span>}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AssignmentSummaryBar segments={segments} />

        <AssignmentFilters
          active={filter}
          counts={counts}
          onChange={setFilter}
        />

        <div className="flex flex-col gap-3">
          {filtered.map((assignment) => (
            <AssignmentPageCard key={assignment.id} assignment={assignment} isExpert={isExpert} />
          ))}
        </div>
      </div>
    </div>
  );
}
