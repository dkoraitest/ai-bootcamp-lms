type RadarSkill = {
  shortName: string;
  score: number; // 0..1
};

type Props = {
  skills: RadarSkill[];
};

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 108;
const RINGS = [0.25, 0.5, 0.75, 1];

function point(angle: number, r: number) {
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

export default function SkillRadar({ skills }: Props) {
  const n = skills.length;
  // Старт сверху (-90°), по часовой стрелке.
  const angleOf = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const ringPolys = RINGS.map((ring) =>
    skills
      .map((_, i) => {
        const p = point(angleOf(i), RADIUS * ring);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ")
  );

  const valuePoly = skills
    .map((s, i) => {
      const p = point(angleOf(i), RADIUS * Math.max(0.02, s.score));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-[340px] mx-auto"
      role="img"
      aria-label="Радар компетенций"
    >
      {/* кольца сетки */}
      {ringPolys.map((poly, idx) => (
        <polygon
          key={idx}
          points={poly}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={1}
        />
      ))}

      {/* оси */}
      {skills.map((_, i) => {
        const p = point(angleOf(i), RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke="#e4e4e7"
            strokeWidth={1}
          />
        );
      })}

      {/* заполненный многоугольник значений */}
      <polygon
        points={valuePoly}
        fill="#4f46e5"
        fillOpacity={0.18}
        stroke="#4f46e5"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* точки на вершинах */}
      {skills.map((s, i) => {
        const p = point(angleOf(i), RADIUS * Math.max(0.02, s.score));
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#4f46e5" />;
      })}

      {/* подписи навыков */}
      {skills.map((s, i) => {
        const a = angleOf(i);
        const p = point(a, RADIUS + 16);
        const cos = Math.cos(a);
        const anchor =
          Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-zinc-500"
            fontSize={10}
          >
            {s.shortName}
          </text>
        );
      })}
    </svg>
  );
}
