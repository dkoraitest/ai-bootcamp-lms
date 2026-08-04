import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useCohort } from '@/lib/cohort/CohortProvider';

interface Student {
  user_id: string;
  name: string;
}

interface CurrentVotes {
  [voteeId: string]: number;
}

interface VoteResult {
  user_id: string;
  name: string;
  email: string;
  avg_score: number;
  total_votes: number;
  min_score: number;
  max_score: number;
}

interface VoteData {
  votee_id: string;
  score: number;
}

export function useProjectVotes() {
  const { activeCohortId } = useCohort();
  const [students, setStudents] = useState<Student[]>([]);
  const [currentVotes, setCurrentVotes] = useState<CurrentVotes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setStudents([]);
    setCurrentVotes({});
    setError(null);
    setLoading(Boolean(activeCohortId));

    const fetchData = async () => {
      if (!activeCohortId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [studentsRes, votesRes] = await Promise.all([
          supabase.rpc('get_students_for_voting', { p_cohort_id: activeCohortId }),
          supabase.rpc('get_my_project_votes', { p_cohort_id: activeCohortId }),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (votesRes.error) throw votesRes.error;
        if (cancelled) return;

        setStudents(studentsRes.data || []);

        const votesMap: CurrentVotes = {};
        (votesRes.data || []).forEach((v: VoteData) => {
          votesMap[v.votee_id] = v.score;
        });
        setCurrentVotes(votesMap);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [activeCohortId, supabase]);

  const submitVotes = async (votes: { votee_id: string; score: number }[]) => {
    try {
      if (!activeCohortId) throw new Error('Поток не выбран');
      const { data, error } = await supabase.rpc('submit_project_votes', {
        p_cohort_id: activeCohortId,
        votes: votes,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to submit votes');
    }
  };

  return {
    students,
    currentVotes,
    loading,
    error,
    submitVotes,
  };
}

export function useVotesResults() {
  const { activeCohortId } = useCohort();
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setResults([]);
    setError(null);
    setLoading(Boolean(activeCohortId));

    const fetchResults = async () => {
      try {
        if (!activeCohortId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const { data, error } = await supabase.rpc('get_project_votes_results', {
          p_cohort_id: activeCohortId,
        });

        if (error) throw error;
        if (cancelled) return;
        setResults(data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error loading results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [activeCohortId, supabase]);

  return { results, loading, error };
}

interface FinalRating {
  user_id: string;
  name: string;
  email: string;
  current_points: number;
  project_votes_sum: number;
  final_score: number;
}

export function useFinalCourseRatings() {
  const { activeCohortId } = useCohort();
  const [ratings, setRatings] = useState<FinalRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setRatings([]);
    setError(null);
    setLoading(Boolean(activeCohortId));

    const fetchRatings = async () => {
      try {
        if (!activeCohortId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const { data, error } = await supabase.rpc('get_final_course_ratings', {
          p_cohort_id: activeCohortId,
        });

        if (error) throw error;
        if (cancelled) return;
        setRatings(data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error loading ratings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRatings();

    return () => {
      cancelled = true;
    };
  }, [activeCohortId, supabase]);

  return { ratings, loading, error };
}
