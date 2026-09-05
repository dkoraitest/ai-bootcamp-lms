export default function WeekFiveNotice({ cohortId }: { cohortId: string | null }) {
  if (cohortId !== "flow-2") return null;
  return (
    <aside className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <h2 className="text-sm font-semibold text-indigo-950">После занятий 1 и 3 сентября</h2>
      <p className="mt-1 text-sm text-indigo-900">Пошаговый маршрут для своего проекта: безопасная проверка, постановка задачи, первый полезный результат и сдача в LMS.</p>
      <a href="/artifacts/flow-2/week-5/index.html" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-indigo-800 underline underline-offset-4">Открыть инструкцию и шаблоны</a>
    </aside>
  );
}
