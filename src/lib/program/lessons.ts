// Программа потока: запасная раскладка занятий на случай, если расписание
// ещё не заполнено. Даты, темы и недели приходят из cohort_lesson_schedule
// и перекрывают эти значения.
//
// Лежит отдельным модулем, потому что нужна и программе, и поиску: пока
// список был копией внутри страницы, поиск продолжал показывать занятия
// прошлого потока, когда программа уже сменилась.
export const PROGRAM_LESSONS = [
  { id: 1,  week: 1, date: "06.08.2026", topic: "Что такое вайб кодинг + лестница автономии",   hasHw: true,  hwNumber: 1,  status: "locked" as const, videoUrl: "#" },
  { id: 2,  week: 2, date: "11.08.2026", topic: "Рабочее место: VS Code, папки, settings.json", hasHw: false,                status: "locked" as const, videoUrl: "#" },
  { id: 3,  week: 2, date: "13.08.2026", topic: "Личный контекст и первый проект",              hasHw: true,  hwNumber: 2,  status: "locked" as const, videoUrl: "#" },
  { id: 4,  week: 3, date: "18.08.2026", topic: "Цикл на полную: 3 принципа + публичная ссылка", hasHw: false,               status: "locked"    as const, videoUrl: "#" },
  { id: 5,  week: 3, date: "20.08.2026", topic: "Свои инструменты: slash и skill",              hasHw: true,  hwNumber: 3,  status: "locked"    as const, videoUrl: "#" },
  { id: 6,  week: 4, date: "25.08.2026", topic: "Руки агента: MCP и внешние системы",           hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 7,  week: 4, date: "27.08.2026", topic: "Память агента: четыре уровня",                 hasHw: true,  hwNumber: 4,  status: "locked"    as const, videoUrl: "#" },
  { id: 8,  week: 5, date: "01.09.2026", topic: "Безопасность выполнения",                      hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 9,  week: 5, date: "03.09.2026", topic: "Свой кейс: выбор и запуск",                    hasHw: true,  hwNumber: 5,  status: "locked"    as const, videoUrl: "#" },
  { id: 10, week: 6, date: "08.09.2026", topic: "Свой кейс: доведение до результата",           hasHw: true,  hwNumber: 6,  status: "locked"    as const, videoUrl: "#" },
  { id: 11, week: 6, date: "10.09.2026", topic: "Мультиагент обзорно + подготовка защиты",      hasHw: false,                status: "locked"    as const, videoUrl: "#" },
  { id: 12, week: 7, date: "15.09.2026", topic: "Demo Day · Защита проектов",  hasHw: true, hwNumber: 7, isDemoDay: true, status: "locked" as const, videoUrl: "#" },
];

