'use client';

import { useFinalCourseRatings } from '@/lib/hooks/useProjectVotes';
import { AlertCircle, TrendingUp } from 'lucide-react';

export function FinalRatingsTable() {
  const { ratings, loading, error } = useFinalCourseRatings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Загружаю финальный рейтинг...</p>
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

  if (!ratings.length) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
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
                  Баллы курса
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Оценка проекта
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Итоговый балл
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ratings.map((rating, index) => {
                const place = index + 1;
                let medalText = '';

                if (place === 1) {
                  medalText = '🥇';
                } else if (place === 2) {
                  medalText = '🥈';
                } else if (place === 3) {
                  medalText = '🥉';
                }

                return (
                  <tr
                    key={rating.user_id}
                    className={`transition-colors ${
                      place <= 3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {place <= 3 ? medalText : `#${place}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {rating.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 break-all">
                      {rating.email}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                      {rating.current_points}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                      {rating.project_votes_sum}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-600">
                          {rating.final_score}
                        </span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((rating.final_score / 100) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="font-semibold text-indigo-900">Баллы курса</p>
          <p className="text-indigo-700 text-xs mt-1">Текущие очки за весь курс</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="font-semibold text-purple-900">Оценка проекта</p>
          <p className="text-purple-700 text-xs mt-1">Сумма оценок от коллег</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
          <p className="font-semibold text-indigo-900">Итоговый балл</p>
          <p className="text-indigo-700 text-xs mt-1">Финальная оценка студента</p>
        </div>
      </div>
    </div>
  );
}
