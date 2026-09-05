import type { AssignmentData, AssignmentSubmitPayload } from "@/components/assignments/AssignmentPageCard";

export type AssignmentSubmissionField = {
  key: keyof AssignmentSubmitPayload;
  label: string;
  required: boolean;
  multiline?: boolean;
};

const fields: Record<number, AssignmentSubmissionField[]> = {
  1: [
    { key: "githubUrl", label: "Ссылка на сводку и доказательство результата", required: true },
    { key: "artifact", label: "Промпт своей рутины или комментарий", required: false, multiline: true },
  ],
  2: [
    { key: "githubUrl", label: "Ссылка на скриншоты сетапа", required: true },
    { key: "artifact", label: "Комментарий к семи пунктам", required: false, multiline: true },
  ],
  3: [
    { key: "githubUrl", label: "Репозиторий GitHub и доказательство работы", required: true },
    { key: "liveUrl", label: "Ссылка на приложение, если опубликовано", required: false },
    { key: "artifact", label: "Результат и проверка секретов без их значений", required: false, multiline: true },
  ],
  4: [
    { key: "githubUrl", label: "Ссылка на результат или скриншот MCP", required: false },
    { key: "videoUrl", label: "Видео, если записано", required: false },
    { key: "artifact", label: "Результат запроса, выбор памяти и проверка прав; либо точное препятствие", required: true, multiline: true },
  ],
  5: [
    { key: "githubUrl", label: "Ссылка на отчёт или результат, если есть", required: false },
    { key: "videoUrl", label: "Видео, если записано", required: false },
    { key: "artifact", label: "Артефакт / результат", required: true, multiline: true },
  ],
  6: [
    { key: "githubUrl", label: "Репозиторий проекта", required: true },
    { key: "videoUrl", label: "Видео 2–3 минуты", required: true },
    { key: "artifact", label: "Артефакт результата: описание или ссылка", required: true, multiline: true },
  ],
  7: [
    { key: "githubUrl", label: "Ссылка на рабочий проект или материалы защиты", required: false },
    { key: "videoUrl", label: "Запись демонстрации, если есть", required: false },
    { key: "artifact", label: "Проект, подготовка защиты и согласие на check-in", required: true, multiline: true },
  ],
};

export function getAssignmentSubmissionFields(hwNumber: number): AssignmentSubmissionField[] {
  return fields[hwNumber] ?? [];
}

export function isAssignmentSubmitDisabled(cohortId: string | null, hwNumber: number, payload: AssignmentSubmitPayload): boolean {
  if (cohortId === "flow-2" && fields[hwNumber]) {
    return fields[hwNumber].some((field) => field.required && !payload[field.key].trim());
  }
  // Существующий контракт первого потока сохраняется без изменений.
  if (hwNumber === 1 || hwNumber === 3) return !payload.githubUrl.trim();
  if (hwNumber === 2) return !payload.liveUrl.trim() || !payload.githubUrl.trim();
  if (hwNumber === 4 || hwNumber === 6) return !payload.videoUrl.trim();
  if (hwNumber === 5) return !payload.githubUrl.trim() || !payload.videoUrl.trim() || !payload.artifact.trim();
  return false;
}

export function getScheduledAssignmentStatus(cohortId: string | null, status: AssignmentData["status"], hasPublishedDeadline: boolean): AssignmentData["status"] {
  if (status === "submitted" || status === "reviewed") return status;
  if (!hasPublishedDeadline) return "locked";
  return cohortId === "flow-2" && status === "locked" ? "not_started" : status;
}
