"use client";

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
            <div
              key={submission.id}
              className="rounded-lg border border-[#e4e4e7] bg-zinc-50 px-4 py-3"
            >
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
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    {submission.status === "reviewed" ? "Проверено" : "Ожидает проверки"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatTimestamp(submission.submittedAt)}
                  </p>
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
                    GitHub: {submission.githubUrl}
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
