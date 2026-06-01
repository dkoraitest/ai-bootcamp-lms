import type { CaseData } from "@/lib/data/cases";

type Props = {
  data: CaseData;
};

export default function MyCaseCard({ data }: Props) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">Мой кейс за 3 недели</h2>

      <ul className="space-y-2.5">
        {data.items.map((text, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-zinc-700">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      {data.wip && data.wip.length > 0 && (
        <>
          <p className="mt-5 mb-2 text-xs font-medium text-zinc-400">В процессе</p>
          <ul className="space-y-2.5">
            {data.wip.map((text, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-zinc-500">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
