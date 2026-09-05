import type { Material } from "@/components/materials/MaterialCard";

// Локальные учебные материалы, без строк Supabase и персональных данных.
// Диапазон 90000+ зарезервирован для этих артефактов интерфейса.
export const FLOW2_WEEK5_MATERIALS: Material[] = [
  { id: 90001, title: "После занятий 1 и 3 сентября: маршрут своего проекта", type: "technique", week: 5, lessonId: 9, lessonTopic: "Свой кейс", description: "Восемь шагов: от полезного результата и разрешённого входа до проверки и повторного запуска.", url: "/artifacts/flow-2/week-5/index.html" },
  { id: 90002, title: "Промпт проверки безопасности без изменений", type: "template", week: 5, lessonId: 8, lessonTopic: "Безопасность", description: "Secrets, Data, Actions и следующий безопасный шаг. Без вывода секретов и автоматических исправлений.", url: "/artifacts/flow-2/week-5/audit-prompt.md" },
  { id: 90003, title: "Постановка полезной задачи: шаблон", type: "template", week: 5, lessonId: 9, lessonTopic: "Свой кейс", description: "Ручная работа, вход, результат, роль агента, доступ и критерий проверки.", url: "/artifacts/flow-2/week-5/case-brief.md" },
  { id: 90004, title: "Результат или препятствие: шаблон сдачи ДЗ 5", type: "template", week: 5, lessonId: 9, lessonTopic: "Свой кейс", description: "Что получилось, чем проверено, что не работает и какая помощь нужна.", url: "/artifacts/flow-2/week-5/submission.md" },
];

export function getLocalCourseMaterials(cohortId: string | null): Material[] {
  return cohortId === "flow-2" ? FLOW2_WEEK5_MATERIALS : [];
}
