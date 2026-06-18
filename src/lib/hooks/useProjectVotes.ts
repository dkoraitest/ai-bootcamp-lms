import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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
  const [students, setStudents] = useState<Student[]>([]);
  const [currentVotes, setCurrentVotes] = useState<CurrentVotes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [studentsRes, votesRes] = await Promise.all([
          supabase.rpc('get_students_for_voting'),
          supabase.rpc('get_my_project_votes'),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (votesRes.error) throw votesRes.error;

        setStudents(studentsRes.data || []);

        const votesMap: CurrentVotes = {};
        (votesRes.data || []).forEach((v: VoteData) => {
          votesMap[v.votee_id] = v.score;
        });
        setCurrentVotes(votesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitVotes = async (votes: { votee_id: string; score: number }[]) => {
    try {
      const { data, error } = await supabase.rpc('submit_project_votes', {
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
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_project_votes_results');

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { results, loading, error };
}
