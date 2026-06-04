import Leaderboard from "@/components/peer-review/Leaderboard";

export default function PeerReviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Пир-ревью</h1>
        <p className="text-sm text-[#71717a] mt-1">
          Рейтинг участников по набранным баллам
        </p>
      </div>

      <div className="max-w-2xl">
        <Leaderboard />
      </div>
    </div>
  );
}
