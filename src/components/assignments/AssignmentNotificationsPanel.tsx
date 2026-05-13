"use client";

type AssignmentNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type Props = {
  notifications: AssignmentNotification[];
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "только что";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AssignmentNotificationsPanel({ notifications }: Props) {
  return (
    <section className="rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Сообщения по ДЗ</h2>
          <p className="mt-1 text-sm text-zinc-500">
            После отправки домашнего задания здесь появляется подтверждение.
          </p>
        </div>
        <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
          {notifications.length}
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          Пока пусто. Как только ты сдашь домашнее задание, здесь появится сообщение.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-lg border border-[#e4e4e7] bg-zinc-50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{notification.body}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-400">
                  {formatTimestamp(notification.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
