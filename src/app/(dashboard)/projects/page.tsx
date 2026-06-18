'use client';

import { ProjectVotingTable } from '@/components/projects/ProjectVotingTable';
import { ArrowLeft, Vote } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  return (
    <main className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>

            <div className="flex items-start gap-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Оценка проектов</h1>
                <p className="text-gray-600 mt-2">
                  Оцени проекты своих однокурсников по шкале от 0 до 10 баллов
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-8">
            <h2 className="font-semibold text-indigo-900 mb-2">Как это работает:</h2>
            <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
              <li>Оцени проекты всех студентов, кроме своего собственного</li>
              <li>Используй шкалу от 0 до 10 баллов</li>
              <li>0 — проект не понравился, 10 — отличный проект</li>
              <li>После заполнения всех оценок нажми «Отправить оценки»</li>
            </ul>
          </div>

          {/* Voting Table */}
          <ProjectVotingTable />
        </div>
      </div>
    </main>
  );
}
