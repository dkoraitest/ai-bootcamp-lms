type SegmentStatus = "reviewed" | "submitted" | "in_progress" | "not_started" | "locked";

type Segment = {
  label: string;
  status: SegmentStatus;
};

type Props = {
  segments: Segment[];
};

const COLOR: Record<SegmentStatus, string> = {
  reviewed:    "bg-[#16a34a]",
  submitted:   "bg-[#2563eb]",
  in_progress: "bg-[#d97706]",
  not_started: "bg-zinc-300",
  locked:      "bg-zinc-100",
};

export default function AssignmentSummaryBar({ segments }: Props) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <div className="flex items-end gap-1 mb-2">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-zinc-500">{seg.label}</span>
            <div
              className={`w-full h-3 ${COLOR[seg.status]} ${
                i === 0 ? "rounded-l-full" : i === segments.length - 1 ? "rounded-r-full" : ""
              }`}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {(
          [
            ["reviewed",    "#16a34a", "Проверено"],
            ["submitted",   "#2563eb", "Сдано"],
            ["in_progress", "#d97706", "В процессе"],
            ["not_started", "#a1a1aa", "Не начато"],
            ["locked",      "#d4d4d8", "Заблокировано"],
          ] as [SegmentStatus, string, string][]
        ).map(([, hex, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: hex }}
            />
            <span className="text-xs text-zinc-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
