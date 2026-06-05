import { ComputedSkill } from "@/lib/hooks/useSkillData";
import { MASTERY_LABELS, Mastery } from "@/lib/data/skills";

type Props = {
  skill: ComputedSkill;
};

// Цвета уровня владения: серый → голубой → indigo (brand) → emerald.
const LEVEL_STYLES: Record<Mastery, { badge: string; bar: string; ring: string }> = {
  0: { badge: "bg-zinc-100 text-zinc-500", bar: "bg-zinc-300", ring: "bg-zinc-50 border-zinc-100" },
  1: { badge: "bg-sky-50 text-sky-700", bar: "bg-sky-500", ring: "bg-sky-50 border-sky-100" },
  2: { badge: "bg-indigo-50 text-indigo-700", bar: "bg-indigo-600", ring: "bg-indigo-50 border-indigo-100" },
  3: { badge: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", ring: "bg-emerald-50 border-emerald-100" },
};

export default function SkillCard({ skill }: Props) {
  const style = LEVEL_STYLES[skill.mastery];
  const started = skill.mastery > 0;

  const source = [
    skill.lessons.length > 1
      ? `Уроки ${skill.lessons[0]}–${skill.lessons[skill.lessons.length - 1]}`
      : `Урок ${skill.lessons[0]}`,
    skill.hw ? `HW${skill.hw}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xl ${style.ring}`}
        >
          <span className={started ? "" : "opacity-40 grayscale"}>{skill.emoji}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-zinc-900 leading-tight">{skill.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
            >
              {MASTERY_LABELS[skill.mastery]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">{source}</p>
        </div>
      </div>

      <p className="text-sm text-zinc-500 leading-snug">{skill.description}</p>

      <div className="mt-auto">
        <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${style.bar}`}
            style={{ width: `${Math.round(skill.score * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
