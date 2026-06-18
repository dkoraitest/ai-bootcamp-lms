'use client';

import { useVotesResults } from '@/lib/hooks/useProjectVotes';
import { AlertCircle, BarChart3 } from 'lucide-react';

export function VotesResultsTable() {
  const { results, loading, error } = useVotesResults();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Загружаю результаты...</p>
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

  if (!results.length) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Оценки ещё не загружены</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Место
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Студент
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Средний балл
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Голосов
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Min–Max
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((result, index) => {
                const place = index + 1;
                let medalColor = '';
                let medalText = '';

                if (place === 1) {
                  medalColor = 'text-yellow-500 bg-yellow-50';
                  medalText = '🥇';
                } else if (place === 2) {
                  medalColor = 'text-gray-400 bg-gray-50';
                  medalText = '🥈';
                } else if (place === 3) {
                  medalColor = 'text-orange-400 bg-orange-50';
                  medalText = '🥉';
                }

                return (
                  <tr key={result.user_id} className={`${medalColor} transition-colors`}>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {place <= 3 ? medalText : `#${place}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {result.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 break-all">
                      {result.email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold text-indigo-600">
                          {result.avg_score}
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${(result.avg_score / 10) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                      {result.total_votes}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {result.min_score} – {result.max_score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Всего студентов в рейтинге:</span> {results.length}
        </p>
      </div>
    </div>
  );
}
