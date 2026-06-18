'use client';

import { useState, useEffect } from 'react';
import { useProjectVotes } from '@/lib/hooks/useProjectVotes';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ProjectVotingTable() {
  const { students, currentVotes, loading, error, submitVotes } = useProjectVotes();
  const [votes, setVotes] = useState<{ [voteeId: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize votes from currentVotes on load
  useEffect(() => {
    setVotes(currentVotes);
  }, [currentVotes]);

  const handleVoteChange = (voteeId: string, score: string) => {
    const numScore = parseInt(score) || 0;
    if (numScore >= 0 && numScore <= 10) {
      setVotes((prev) => ({
        ...prev,
        [voteeId]: numScore,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const votesArray = Object.entries(votes).map(([votee_id, score]) => ({
        votee_id,
        score,
      }));

      await submitVotes(votesArray);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to submit votes:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Загружаю данные...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-900">Ошибка загрузки</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Студент / Проект
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Оценка (0–10)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={votes[student.user_id] ?? ''}
                      onChange={(e) => handleVoteChange(student.user_id, e.target.value)}
                      placeholder="-"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Отправляю...' : 'Отправить оценки'}
        </Button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">Оценки записаны!</h3>
            <p className="text-sm text-green-700 mt-1">
              Спасибо за участие в оценке проектов
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
