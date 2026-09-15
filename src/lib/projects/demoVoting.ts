export type Ballot = { usefulness: number; working: number; understanding: number };
export type DraftBallot = { [K in keyof Ballot]: number | null };
export const EMPTY_BALLOT: DraftBallot = { usefulness: null, working: null, understanding: null };
export const DEMO_CRITERIA: { key: keyof Ballot; title: string; question: string; levels: string[] }[] = [
  { key: 'usefulness', title: 'Польза', question: 'Какую работу помогает сделать показанный результат?', levels: ['Польза не показана', 'Задача понятна, польза пока предполагается', 'Результат решает конкретную часть задачи', 'Польза подтверждена сравнением или проверкой'] },
  { key: 'working', title: 'Работоспособность', question: 'Что действительно работает и как это проверили?', levels: ['Работающий шаг не показан', 'Есть заготовка, существенные ограничения', 'Полезный шаг работает, результат проверен', 'Показан повторяемый сценарий и его проверка'] },
  { key: 'understanding', title: 'Владение решением', question: 'Понимает ли автор свой процесс и его ограничения?', levels: ['Объяснение не получено', 'Объясняет часть процесса с помощью', 'Объясняет работу, проверку и ограничения', 'Может повторить процесс и обосновать решения'] },
];
export function ballotTotal(ballot: DraftBallot | null): number | null {
  if (!ballot) return null;
  const values = [ballot.usefulness, ballot.working, ballot.understanding];
  if (!values.every((x) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 3)) return null;
  return values.reduce<number>((sum, x) => sum + (x as number), 0);
}
export function makeBallotPayload(candidate_key: string, ballot: DraftBallot, skip: boolean) {
  if (skip) return { candidate_key, scores: null };
  if (ballotTotal(ballot) === null) throw new Error('Оцените все три критерия или пропустите проект.');
  return { candidate_key, scores: { ...ballot } as Ballot };
}
export function sameBallot(a: DraftBallot | null, b: DraftBallot | null): boolean {
  if (!a || !b) return a === b;
  return a.usefulness === b.usefulness && a.working === b.working && a.understanding === b.understanding;
}
