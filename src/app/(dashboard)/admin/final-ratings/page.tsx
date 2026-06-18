'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { FinalRatingsTable } from '@/components/projects/FinalRatingsTable';
import { AlertCircle, Award, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AdminFinalRatingsPage() {
  const { user } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }

    const email = user.email?.toLowerCase().trim();
    const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;

    // Check if user is admin/expert OR matches the specific email
    const hasAccess =
      role === 'admin' ||
      role === 'expert' ||
      email === 'kirabogdanova24@yandex.ru' ||
      email === 'kira20032411@gmail.com';

    setIsAuthorized(hasAccess);
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
          <p className="text-gray-600">Проверяю доступ...</p>
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 flex flex-col items-center text-center">
              <Lock className="w-12 h-12 text-red-600 mb-4" />
              <h1 className="text-2xl font-bold text-red-900 mb-2">Доступ запрещен</h1>
              <p className="text-red-700 mb-6">
                У вас нет прав доступа к этой странице. Администраторы могут просматривать итоговый рейтинг.
              </p>
              <Link
                href="/"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Финальный рейтинг буткемпа</h1>
                <p className="text-gray-600 mt-2">
                  Общий рейтинг студентов с учётом баллов курса и оценок проектов
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Формула расчёта:</p>
              <p className="font-mono text-xs bg-white rounded px-2 py-1">
                Итоговый балл = (Баллы курса × 1) + (Сумма оценок проекта × 0.7)
              </p>
            </div>
          </div>

          {/* Final Ratings Table */}
          <FinalRatingsTable />
        </div>
      </div>
    </main>
  );
}
