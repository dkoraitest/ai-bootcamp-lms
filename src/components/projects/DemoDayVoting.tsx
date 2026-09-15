'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ballot, DraftBallot, EMPTY_BALLOT, DEMO_CRITERIA, ballotTotal, makeBallotPayload, sameBallot } from '@/lib/projects/demoVoting';
import { ArrowLeft, Check, ChevronDown, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Candidate = { candidate_key: string; display_name: string; is_self: boolean; scores: Ballot | null; updated_at: string | null };
type VotingState = { viewer_key: string; is_open: boolean; can_manage: boolean; can_cast: boolean; is_test_voter: boolean; voter_count: number; ready: boolean; candidates: Candidate[] };
type Result = { candidate_key: string; display_name: string; vote_count: number; mean_total: number | null; mean_usefulness: number | null; mean_working: number | null; mean_understanding: number | null };
const COHORT = 'flow-2';

function readDraft(key: string): DraftBallot | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== DEMO_CRITERIA.length) return null;
    if (!DEMO_CRITERIA.every(({ key }) => Object.prototype.hasOwnProperty.call(value, key) &&
      ((value as DraftBallot)[key] === null || (typeof (value as DraftBallot)[key] === 'number' &&
        Number.isInteger((value as DraftBallot)[key]) && (value as DraftBallot)[key]! >= 0 && (value as DraftBallot)[key]! <= 3)))) return null;
    return value as DraftBallot;
  } catch { return null; }
}

function storeDraft(key: string, draft: DraftBallot | null) {
  try {
    if (draft) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch { /* Keep the in-memory draft if browser storage is unavailable. */ }
}

function CandidateCard({ candidate, viewerKey, open, onSaved }: { candidate: Candidate; viewerKey: string; open: boolean; onSaved: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const storageKey = `lms.demoDayDraft.v1:${JSON.stringify([viewerKey, COHORT, candidate.candidate_key])}`;
  const [{ draft, saved, notice }, setBallot] = useState<{ draft: DraftBallot; saved: Ballot | null; notice: string }>(() => ({
    draft: readDraft(storageKey) ?? candidate.scores ?? { ...EMPTY_BALLOT }, saved: candidate.scores, notice: '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = ballotTotal(draft);
  const dirty = !sameBallot(saved ?? EMPTY_BALLOT, draft);
  useEffect(() => {
    setBallot(previous => sameBallot(previous.saved ?? EMPTY_BALLOT, previous.draft)
      ? { draft: candidate.scores ?? { ...EMPTY_BALLOT }, saved: candidate.scores,
        notice: sameBallot(previous.saved, candidate.scores) ? previous.notice : '' }
      : previous);
  }, [candidate.scores]);
  useEffect(() => { storeDraft(storageKey, dirty ? draft : null); }, [storageKey, draft, dirty]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(skip = false) {
    setBusy(true); setError(''); setBallot(previous => ({ ...previous, notice: '' }));
    try {
      const payload = makeBallotPayload(candidate.candidate_key, draft, skip);
      const { error: rpcError } = await supabase.rpc('save_demo_day_ballot', {
        p_cohort_id: COHORT, p_candidate_key: payload.candidate_key, p_scores: payload.scores,
      });
      if (rpcError) throw new Error(rpcError.message);
      setBallot({ saved: payload.scores, draft: payload.scores ?? { ...EMPTY_BALLOT },
        notice: skip ? 'Проект пропущен. Ноль не начисляется.' : 'Оценка сохранена. Пока голосование открыто, её можно изменить.' });
      storeDraft(storageKey, null);
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить оценку. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-label={`Проект: ${candidate.display_name}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700" aria-hidden>{candidate.display_name.slice(0,1)}</span>
          <div><h2 className="text-lg font-semibold text-slate-900">{candidate.display_name}</h2>
            <p className="text-xs text-slate-500">{candidate.is_self ? 'Ваш проект' : dirty ? 'Есть несохранённые изменения' : saved ? 'Ваша оценка сохранена' : 'Ещё не оценено'}</p>
          </div>
        </div>
        {!candidate.is_self && <span className="text-sm font-medium tabular-nums text-slate-600">{total === null ? '—' : total} / 9</span>}
      </div>
      {candidate.is_self ? <p className="text-sm text-slate-600">За свой проект голосовать нельзя. Оцените выступления остальных участников.</p> : <>
        <div className="grid gap-6 lg:grid-cols-3">
          {DEMO_CRITERIA.map((criterion) => <fieldset key={criterion.key} disabled={!open || busy}>
            <legend className="font-medium text-slate-900">{criterion.title}</legend>
            <p className="mb-3 mt-1 min-h-10 text-sm text-slate-500">{criterion.question}</p>
            <div className="flex gap-2">
              {[0,1,2,3].map((value) => <label key={value} className={`relative flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${draft[criterion.key]===value ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400'} ${!open || busy ? 'cursor-default opacity-60' : ''}`}>
                <input type="radio" name={`${candidate.candidate_key}-${criterion.key}`} value={value} checked={draft[criterion.key]===value}
                  onChange={() => { setBallot((previous) => ({ ...previous, draft: { ...previous.draft, [criterion.key]: value }, notice: '' })); setError(''); }}
                  aria-label={`${criterion.title}: ${value} — ${criterion.levels[value]}`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <span aria-hidden>{value}</span>
              </label>)}
            </div>
            <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{draft[criterion.key]===null ? 'Выберите оценку от 0 до 3' : criterion.levels[draft[criterion.key] as number]}</p>
          </fieldset>)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={() => void save()} disabled={!open || busy || total===null || !dirty}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
            <Check size={16} />{busy ? 'Сохраняю…' : 'Сохранить оценку'}
          </button>
          <button type="button" onClick={() => void save(true)} disabled={!open || busy}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">Не видел / пропустить</button>
        </div>
        {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </>}
    </article>
  );
}

function OrganizerPanel({ state, reload }: { state: VotingState; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createClient(), []);
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  async function refresh() {
    setBusy(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('get_demo_day_results', { p_cohort_id: COHORT });
      if (rpcError) throw new Error(rpcError.message);
      setResults(data ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось обновить результаты. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }
  async function toggle(target: boolean) {
    setBusy(true); setError('');
    try {
      const { error: rpcError } = await supabase.rpc('set_demo_day_open', { p_cohort_id: COHORT, p_is_open: target });
      if (rpcError) throw new Error(rpcError.message);
      setConfirmClose(false); await reload(); setResults(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось изменить статус голосования. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-label="Управление голосованием">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="font-semibold text-slate-900">Для ведущих</h2><p className="mt-1 text-sm text-slate-600">{state.can_cast ? 'Ваш голос имеет тот же вес, что и голос каждого участника.' : 'Вы управляете голосованием, но голос не подаёте.'} Голосующих в списке: {state.voter_count}.</p></div>
      <button type="button" disabled={busy || (!state.is_open && !state.ready)} onClick={() => state.is_open ? setConfirmClose(true) : void toggle(true)}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 disabled:opacity-50">{state.is_open ? 'Закрыть голосование' : 'Открыть голосование'}</button>
    </div>
    {!state.ready && <p className="mt-3 text-sm text-amber-800">Перед открытием нужно подтвердить аккаунты всех пяти участников.</p>}
    {confirmClose && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-900">Закрыть приём оценок? Несохранённые оценки после закрытия отправить не получится.</p><div className="mt-3 flex gap-3"><button disabled={busy} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => void toggle(false)}>Да, закрыть</button><button disabled={busy} className="px-3 py-2 text-sm" onClick={() => setConfirmClose(false)}>Отмена</button></div></div>}
    <div className="mt-5 border-t border-slate-200 pt-4">
      <button type="button" disabled={busy} onClick={() => void refresh()} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-indigo-700"><RefreshCw size={15} />{busy ? 'Загружаю…' : results ? 'Обновить результаты' : 'Показать результаты ведущим'}</button>
      <p className="text-xs leading-5 text-slate-500">{state.is_open ? 'Предварительные результаты: голосование ещё идёт.' : 'Приём оценок закрыт.'} Среднее суммы трёх критериев, максимум 9. Бонусы за ДЗ и посещаемость здесь не добавляются.</p>
      {results && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="pb-3 font-medium">Участник</th><th className="pb-3 text-right font-medium">Среднее / 9</th><th className="pb-3 text-right font-medium">Голосов</th><th className="pb-3 pl-5 font-medium">Польза · работа · владение</th></tr></thead><tbody>{results.map(r => <tr key={r.candidate_key} className="border-b border-slate-200"><td className="py-3 font-medium">{r.display_name}</td><td className="py-3 text-right tabular-nums">{r.mean_total===null ? 'Нет оценок' : Number(r.mean_total).toFixed(2)}</td><td className="py-3 text-right tabular-nums">{r.vote_count}</td><td className="py-3 pl-5 tabular-nums text-slate-600">{[r.mean_usefulness,r.mean_working,r.mean_understanding].map(v => v===null ? '—' : Number(v).toFixed(2)).join(' · ')}</td></tr>)}</tbody></table><p className="mt-3 text-xs text-slate-500">Перед объявлением мест проверьте число голосов и пропущенные выступления. При одинаковом среднем проекты имеют одинаковый результат.</p></div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  </section>;
}

export function DemoDayVoting({ resultsOnly = false }: { resultsOnly?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<VotingState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const requestGeneration = useRef(0);
  const reload = useCallback(async () => {
    const generation = ++requestGeneration.current;
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_demo_day_state', { p_cohort_id: COHORT });
      if (generation !== requestGeneration.current) return;
      if (rpcError) throw new Error(rpcError.message);
      if (!data || typeof data.viewer_key !== 'string' || !data.viewer_key || !Array.isArray(data.candidates)) throw new Error('Не удалось загрузить список проектов.');
      setError(''); setState(data);
    } catch (e) {
      if (generation === requestGeneration.current) setError(e instanceof Error ? e.message : 'Не удалось обновить голосование. Попробуйте ещё раз.');
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }, [supabase]);
  const onSaved = useCallback(() => {
    // Invalidate pre-save snapshots before fetching the committed ballot.
    requestGeneration.current++;
    setVersion(v => v+1);
    void reload();
  }, [reload]);
  useEffect(() => { void reload(); }, [reload]);
  return <main className="flex-1 overflow-auto bg-slate-50"><div className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
    <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} />На главную</Link>
    <header className="mb-7"><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Второй поток · 15 сентября</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Оценка проектов</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Оцените то, что участник показал и проверил. Работающая часть большого проекта тоже может быть полезным результатом.</p></header>
    {loading && !state ? <p role="status" className="rounded-xl bg-white p-6 text-slate-500">Загружаю голосование…</p> : error && !state ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5"><p className="text-sm text-red-800">{error}</p><button className="mt-3 rounded-lg bg-white px-4 py-2 text-sm" onClick={() => void reload()}>Попробовать снова</button></div> : state && <>
      {error && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error} Показаны последние загруженные данные. Черновики сохранены.</div>}
      {state.is_test_voter && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Пробный аккаунт. Страница работает как у участника, но эти оценки не попадают в результаты и не учитываются в числе голосов.</p>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4"><div><span className={`text-sm font-semibold ${state.is_open ? 'text-emerald-700' : 'text-slate-700'}`}>{state.is_open ? 'Голосование открыто' : 'Голосование закрыто'}</span><p className="mt-1 text-xs text-slate-500">Все голоса равны. Свой проект не оцениваем. «Не видел» не считается нулём.</p></div><button disabled={loading} className="inline-flex min-h-10 items-center gap-2 text-sm text-indigo-700 disabled:opacity-50" onClick={() => void reload()}><RefreshCw size={14} />Обновить статус</button></div>
      {!resultsOnly && state.can_cast && <details className="mb-6 rounded-xl border border-slate-200 bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700">Подсказки к оценкам 0–3<ChevronDown size={16}/></summary><div className="mt-4 grid gap-5 sm:grid-cols-3">{DEMO_CRITERIA.map(c => <div key={c.key}><h2 className="mb-2 text-sm font-semibold">{c.title}</h2><ul className="space-y-2 text-xs leading-5 text-slate-600">{c.levels.map((l,i) => <li key={i}><strong>{i}</strong> — {l}</li>)}</ul></div>)}</div></details>}
      <div className="space-y-4">{!resultsOnly && (state.can_cast
        ? state.candidates.map(candidate => <CandidateCard key={`${state.viewer_key}:${COHORT}:${candidate.candidate_key}`} candidate={candidate} viewerKey={state.viewer_key} open={state.is_open} onSaved={onSaved} />)
        : <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Ваш аккаунт не в списке голосующих. Вы ведёте демо-день и видите результаты, но собственный голос не подаёте.</p>)}
      {state.can_manage ? <OrganizerPanel key={`${state.viewer_key}:results-${version}`} state={state} reload={reload} /> : resultsOnly && <p className="rounded-xl bg-white p-5 text-sm">Результаты доступны ведущим. <Link className="text-indigo-700 underline" href="/projects">Перейти к оценке проектов</Link></p>}</div>
    </>}
  </div></main>;
}
