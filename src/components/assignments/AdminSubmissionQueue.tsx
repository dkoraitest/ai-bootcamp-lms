"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AdminSubmission = {
  id: string;
  hwNumber: number;
  title: string;
  studentName: string | null;
  studentEmail: string | null;
  githubUrl: string | null;
  videoUrl: string | null;
  liveUrl: string | null;
  artifact: string | null;
  status: string;
  submittedAt: string | null;
  feedback: string | null;
  pointsEarned: number | null;
};

type Props = {
  submissions: AdminSubmission[];
  loading: boolean;
};

function formatTimestamp(value: string | null) {
  if (!value) return "без даты";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "без даты";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SubmissionCard({ submission }: { submission: AdminSubmission }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [points, setPoints] = useState<string>(
    submission.pointsEarned != null ? String(submission.pointsEarned) : ""
  );
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(submission.status);
  const [error, setError] = useState("");

  const isReviewed = savedStatus === "reviewed";

  async function handleReview() {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("review_assignment_submission", {
      submission_id: submission.id,
      feedback_text: feedback || null,
      earned_points: points ? parseInt(points, 10) : null,
    });

    setSaving(false);

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setSavedStatus("reviewed");
      setExpanded(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#e4e4e7] bg-zinc-50 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            ДЗ {submission.hwNumber}: {submission.title}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {submission.studentName || "Без имени"}
            {submission.studentEmail ? ` · ${submission.studentEmail}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {isReviewed ? "Проверено" : "Ожидает проверки"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{formatTimestamp(submission.submittedAt)}</p>
          </div>
          {!isReviewed && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
            >
              {expanded ? "Скрыть" : "Оценить"}
            </button>
          )}
          {isReviewed && (
            <span className="ml-2 rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
              ✓ Проверено
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {submission.githubUrl && (
          <a
            href={submission.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#2563eb] hover:underline"
          >
            Ссылка: {submission.githubUrl}
          </a>
        )}
        {submission.liveUrl && (
          <a
            href={submission.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#2563eb] hover:underline"
          >
            Live URL: {submission.liveUrl}
          </a>
        )}
        {submission.videoUrl && (
          <a
            href={submission.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#2563eb] hover:underline"
          >
            Видео / Loom: {submission.videoUrl}
          </a>
        )}
        {submission.artifact && (
          <div className="rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-zinc-700">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Описание
            </p>
            <p>{submission.artifact}</p>
          </div>
        )}
      </div>

      {isReviewed && submission.feedback && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-green-600">
            Фидбек
          </p>
          <p>{submission.feedback}</p>
          {submission.pointsEarned != null && (
            <p className="mt-1 font-medium">{submission.pointsEarned} очков</p>
          )}
        </div>
      )}

      {expanded && !isReviewed && (
        <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Фидбек студенту
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Напиши комментарий к работе..."
              rows={3}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Баллы (необязательно)
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Например: 10"
              min={0}
              className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <button
            onClick={handleReview}
            disabled={saving}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Сохраняем..." : "Отметить проверено"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminSubmissionQueue({ submissions, loading }: Props) {
  return (
    <section className="rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Сданные домашние задания</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Все новые сдачи с ссылками студентов для проверки.
          </p>
        </div>
        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
          {loading ? "..." : submissions.length}
        </span>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          Загружаем список сдач...
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          Пока нет отправленных домашних заданий.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </section>
  );
}
