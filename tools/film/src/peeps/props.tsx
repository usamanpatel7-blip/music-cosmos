import React from "react";
import { COL, FILL, INK, ink } from "./kit";

/* Реквизит в манере Open Peeps: толстая чёрная линия, кремовая заливка,
   один-два цветных акцента. Все компоненты — SVG-группы в координатах 1920×1080. */

type XY = { x: number; y: number; s?: number; rot?: number };
const G: React.FC<XY & { children: React.ReactNode; op?: number }> = ({ x, y, s = 1, rot = 0, children, op }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    {children}
  </g>
);

export const Record: React.FC<XY & { r?: number; label?: string; spin?: number; holes?: boolean }> = ({ r = 100, label = COL.pink, spin = 0, holes, ...p }) => (
  <G {...p}>
    <g transform={`rotate(${spin})`}>
      <circle r={r} fill={INK} />
      <circle r={r * 0.78} fill="none" stroke="#4a4a52" strokeWidth={3} />
      <circle r={r * 0.6} fill="none" stroke="#4a4a52" strokeWidth={3} />
      <path d={`M${-r * 0.62},${-r * 0.5} Q${-r * 0.35},${-r * 0.78} ${-r * 0.02},${-r * 0.8}`} stroke={FILL} strokeWidth={r * 0.06} fill="none" strokeLinecap="round" opacity={0.6} />
      <circle r={r * 0.33} fill={label} stroke={INK} strokeWidth={Math.max(3, r * 0.05)} />
      <circle r={r * 0.05} fill={FILL} />
      {holes
        ? [
            [0.55, 0.2, 0.12],
            [-0.4, 0.5, 0.1],
            [0.1, -0.62, 0.13],
            [-0.66, -0.2, 0.09],
            [0.62, -0.42, 0.08],
            [0.2, 0.7, 0.1],
          ].map((h, i) => <circle key={i} cx={h[0] * r} cy={h[1] * r} r={h[2] * r} fill={FILL} stroke={INK} strokeWidth={4} />)
        : null}
    </g>
  </G>
);

export const Turntable: React.FC<XY & { spin: number; arm: number }> = ({ spin, arm, ...p }) => (
  <G {...p}>
    <rect x={-300} y={-90} width={600} height={110} rx={22} fill={FILL} {...ink} />
    <rect x={-300} y={0} width={600} height={20} rx={8} fill={COL.orange} {...ink} />
    <g transform="translate(-50,-92) scale(1,0.26)">
      <Record x={0} y={0} r={220} label={COL.yellow} spin={spin} />
    </g>
    <g transform={`translate(215,-130) rotate(${arm})`}>
      <path d="M0,0 L-24,120" {...ink} strokeWidth={11} fill="none" />
      <rect x={-44} y={110} width={34} height={22} rx={5} fill={INK} />
      <circle r={20} fill={FILL} {...ink} />
    </g>
    <circle cx={230} cy={-40} r={14} fill={COL.pink} {...ink} strokeWidth={6} />
  </G>
);

export const Speaker: React.FC<XY & { pulse?: number; w?: number; h?: number }> = ({ pulse = 0, w = 300, h = 520, ...p }) => (
  <G {...p}>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={18} fill={INK} />
    <circle cy={-h * 0.72} r={w * 0.22 * (1 + pulse * 0.07)} fill="#44444c" stroke={FILL} strokeWidth={6} />
    <circle cy={-h * 0.72} r={w * 0.07} fill={FILL} />
    <circle cy={-h * 0.3} r={w * 0.34 * (1 + pulse * 0.09)} fill="#44444c" stroke={FILL} strokeWidth={6} />
    <circle cy={-h * 0.3} r={w * 0.1} fill={FILL} />
  </G>
);

export const Notes: React.FC<{ t: number; x: number; y: number; n?: number; spread?: number; colors?: string[]; size?: number; on?: number }> = ({ t, x, y, n = 5, spread = 160, colors = [COL.pink, COL.blue, COL.yellow, COL.green], size = 70, on = 1 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const u = (t * 0.45 + i / n) % 1;
      const sx = x + Math.sin(t * 1.3 + i * 2) * spread * 0.4 + (i - n / 2) * spread * 0.25;
      return (
        <text key={i} x={sx} y={y - u * 300} fontSize={size} fill={colors[i % colors.length]} stroke={INK} strokeWidth={3} opacity={(1 - u) * on} textAnchor="middle" fontFamily="Golos Text" fontWeight={600}>
          {i % 2 ? "♫" : "♪"}
        </text>
      );
    })}
  </>
);

/* волны звука: дуги, расходящиеся от точки */
export const Waves: React.FC<{ t: number; x: number; y: number; dir?: number; n?: number; r?: number; on?: number }> = ({ t, x, y, dir = 1, n = 4, r = 260, on = 1 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const u = (t * 1.4 + i / n) % 1;
      const rr = 40 + u * r;
      return <path key={i} d={`M${x + dir * rr * 0.35},${y - rr} Q${x + dir * rr * 1.05},${y} ${x + dir * rr * 0.35},${y + rr}`} fill="none" {...ink} strokeWidth={10 * (1 - u) + 2} opacity={(1 - u) * on} />;
    })}
  </>
);

export const PictureFrame: React.FC<XY & { w: number; h: number; color?: string }> = ({ w, h, color = COL.yellow, ...p }) => (
  <G {...p}>
    <rect x={-w / 2 - 40} y={-h / 2 - 40} width={w + 80} height={h + 80} rx={6} fill={color} {...ink} strokeWidth={10} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" {...ink} strokeWidth={8} />
    {[-1, 1].map((sx) => [-1, 1].map((sy) => <path key={`${sx}${sy}`} d={`M${(sx * (w + 80)) / 2},${(sy * (h + 80)) / 2} L${(sx * w) / 2},${(sy * h) / 2}`} {...ink} strokeWidth={6} />))}
  </G>
);

export const Door: React.FC<XY & { open?: number; color?: string; label?: string; sub?: string; frame?: boolean }> = ({ open = 0, color = COL.pink, label, sub, frame = true, ...p }) => (
  <G {...p}>
    {frame ? <rect x={-10} y={-10} width={300} height={560} fill={INK} /> : null}
    <g transform={`skewY(${open * 8}) scale(${1 - open * 0.75},1)`}>
      <rect x={0} y={0} width={280} height={540} rx={8} fill={color} {...ink} strokeWidth={10} />
      <rect x={34} y={40} width={212} height={180} rx={8} fill="none" {...ink} strokeWidth={6} />
      <rect x={34} y={270} width={212} height={220} rx={8} fill="none" {...ink} strokeWidth={6} />
      <circle cx={240} cy={290} r={14} fill={COL.yellow} {...ink} strokeWidth={6} />
      {label ? (
        <text x={140} y={150} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={84} fill={INK}>
          {label}
        </text>
      ) : null}
      {sub ? (
        <text x={140} y={205} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={40} fill={INK}>
          {sub}
        </text>
      ) : null}
    </g>
  </G>
);

export const GrandPiano: React.FC<XY> = (p) => (
  <G {...p}>
    <path d="M-150,0 L150,0 L150,-40 C140,-150 20,-170 -40,-110 C-80,-70 -110,-60 -150,-50Z" fill={INK} />
    <path d="M-40,-110 L60,-190" {...ink} strokeWidth={7} />
    <rect x={-150} y={0} width={300} height={34} rx={4} fill={FILL} {...ink} strokeWidth={6} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={-138 + i * 32} y={2} width={14} height={18} fill={INK} />
    ))}
    <path d="M-130,34 L-130,120 M130,34 L130,120 M40,34 L40,110" {...ink} strokeWidth={9} />
  </G>
);

export const Cassette: React.FC<XY & { label?: string; color?: string; w?: number }> = ({ label, color = COL.pink, w = 280, ...p }) => {
  const h = w * 0.64;
  return (
    <G {...p}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={color} {...ink} />
      <rect x={-w * 0.38} y={-h * 0.36} width={w * 0.76} height={h * 0.42} rx={8} fill={FILL} {...ink} strokeWidth={6} />
      <circle cx={-w * 0.2} cy={h * 0.2} r={w * 0.08} fill={FILL} {...ink} strokeWidth={6} />
      <circle cx={w * 0.2} cy={h * 0.2} r={w * 0.08} fill={FILL} {...ink} strokeWidth={6} />
      <path d={`M${-w * 0.3},${h * 0.5} L${-w * 0.22},${h * 0.36} L${w * 0.22},${h * 0.36} L${w * 0.3},${h * 0.5}`} fill="none" {...ink} strokeWidth={6} />
      {label ? (
        <text x={0} y={-h * 0.08} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={w * 0.2} fill={INK}>
          {label}
        </text>
      ) : null}
    </G>
  );
};

export const Phone: React.FC<XY & { children?: React.ReactNode; w?: number; h?: number; screen?: string }> = ({ children, w = 300, h = 560, screen = FILL, ...p }) => (
  <G {...p}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={42} fill={INK} />
    <rect x={-w / 2 + 16} y={-h / 2 + 50} width={w - 32} height={h - 100} rx={12} fill={screen} />
    <rect x={-30} y={-h / 2 + 20} width={60} height={12} rx={6} fill="#44444c" />
    {children}
  </G>
);

export const Trash: React.FC<XY> = (p) => (
  <G {...p}>
    <path d="M-110,-150 L110,-150 L90,110 L-90,110Z" fill={FILL} {...ink} strokeWidth={10} />
    <rect x={-130} y={-190} width={260} height={40} rx={12} fill={COL.lilac} {...ink} strokeWidth={10} />
    <path d="M-40,-120 L-30,80 M0,-120 L0,80 M40,-120 L30,80" {...ink} strokeWidth={7} />
  </G>
);

export const Gauge: React.FC<XY & { v: number; label?: string }> = ({ v, label = "СИЛА", ...p }) => {
  const a = Math.PI + v * Math.PI;
  return (
    <G {...p}>
      <path d="M-200,0 A200,200 0 0,1 200,0Z" fill={FILL} {...ink} strokeWidth={10} />
      <path d="M-160,0 A160,160 0 0,1 -113,-113" fill="none" stroke={COL.red} strokeWidth={26} />
      <path d="M113,-113 A160,160 0 0,1 160,0" fill="none" stroke={COL.green} strokeWidth={26} />
      {Array.from({ length: 9 }).map((_, i) => {
        const aa = Math.PI + (i / 8) * Math.PI;
        return <path key={i} d={`M${Math.cos(aa) * 180},${Math.sin(aa) * 180} L${Math.cos(aa) * 150},${Math.sin(aa) * 150}`} {...ink} strokeWidth={6} />;
      })}
      <path d={`M0,0 L${Math.cos(a) * 150},${Math.sin(a) * 150}`} {...ink} strokeWidth={12} />
      <circle r={20} fill={COL.pink} {...ink} strokeWidth={6} />
      <text y={70} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={40} fill={INK}>
        {label}
      </text>
    </G>
  );
};

export const BachBust: React.FC<XY> = (p) => (
  <G {...p}>
    <rect x={-80} y={60} width={160} height={70} rx={6} fill={FILL} {...ink} />
    <path d="M-70,60 C-80,0 -50,-40 0,-40 C50,-40 80,0 70,60Z" fill={FILL} {...ink} />
    <path d="M-60,-20 C-90,-80 -60,-150 0,-152 C60,-150 90,-80 60,-20 C62,-60 44,-96 0,-96 C-44,-96 -62,-60 -60,-20Z" fill={FILL} {...ink} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <circle cx={-74} cy={-60 + i * 24} r={15} fill={FILL} {...ink} strokeWidth={6} />
        <circle cx={74} cy={-60 + i * 24} r={15} fill={FILL} {...ink} strokeWidth={6} />
      </g>
    ))}
    <path d="M-20,-70 q6,-6 12,0 M12,-70 q6,-6 12,0 M-6,-40 q8,6 16,0" fill="none" {...ink} strokeWidth={5} />
  </G>
);

export const Pie: React.FC<XY & { u: number; r?: number }> = ({ u, r = 180, ...p }) => {
  const a = -Math.PI / 2 + u * 2 * Math.PI;
  return (
    <G {...p}>
      <circle r={r} fill={FILL} {...ink} strokeWidth={10} />
      {u > 0 ? <path d={`M0,0 L0,${-r} A${r},${r} 0 ${u > 0.5 ? 1 : 0},1 ${Math.cos(a) * r},${Math.sin(a) * r}Z`} fill={COL.pink} {...ink} strokeWidth={10} /> : null}
    </G>
  );
};

export const Stamp: React.FC<XY & { text: string; color?: string }> = ({ text, color = COL.red, ...p }) => (
  <G {...p}>
    <rect x={-40} y={-170} width={80} height={120} rx={14} fill="#b8875a" {...ink} />
    <rect x={-150} y={-60} width={300} height={60} rx={10} fill="#8a5a3a" {...ink} />
    <rect x={-170} y={0} width={340} height={80} rx={10} fill={color} {...ink} />
    <text y={56} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={40} fill={FILL}>
      {text}
    </text>
  </G>
);

export const Couch: React.FC<XY & { color?: string }> = ({ color = COL.blue, ...p }) => (
  <G {...p}>
    <rect x={-520} y={-260} width={1040} height={200} rx={50} fill={color} {...ink} strokeWidth={10} />
    <rect x={-520} y={-80} width={1040} height={170} rx={30} fill={color} {...ink} strokeWidth={10} />
    <rect x={-600} y={-180} width={140} height={270} rx={50} fill={color} {...ink} strokeWidth={10} />
    <rect x={460} y={-180} width={140} height={270} rx={50} fill={color} {...ink} strokeWidth={10} />
    <path d="M0,-70 L0,80" {...ink} strokeWidth={7} />
    <path d="M-480,90 L-480,140 M480,90 L480,140" {...ink} strokeWidth={14} />
  </G>
);

export const Knob: React.FC<XY & { v: number }> = ({ v, ...p }) => {
  const ang = -135 + v * 27;
  return (
    <G {...p}>
      <rect x={-230} y={-230} width={460} height={460} rx={40} fill={FILL} {...ink} strokeWidth={10} />
      {Array.from({ length: 12 }).map((_, k) => {
        const a = ((-135 + k * 27 - 90) * Math.PI) / 180;
        return (
          <g key={k}>
            <path d={`M${Math.cos(a) * 130},${Math.sin(a) * 130} L${Math.cos(a) * (k === 11 ? 165 : 150)},${Math.sin(a) * (k === 11 ? 165 : 150)}`} {...ink} strokeWidth={k === 11 ? 10 : 6} />
            <text x={Math.cos(a) * 190} y={Math.sin(a) * 190 + 14} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={k === 11 ? 56 : 36} fill={k === 11 ? COL.red : INK}>
              {k}
            </text>
          </g>
        );
      })}
      <circle r={110} fill={COL.yellow} {...ink} strokeWidth={10} />
      <g transform={`rotate(${ang})`}>
        <path d="M0,0 L0,-92" {...ink} strokeWidth={14} />
      </g>
    </G>
  );
};

export const Star: React.FC<XY & { r?: number; color?: string }> = ({ r = 40, color = COL.yellow, ...p }) => {
  const pts = Array.from({ length: 10 }).map((_, k) => {
    const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = k % 2 ? r * 0.45 : r;
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  });
  return (
    <G {...p}>
      <path d={"M" + pts.join("L") + "Z"} fill={color} {...ink} strokeWidth={6} />
    </G>
  );
};

export const Candle: React.FC<XY & { t: number }> = ({ t, ...p }) => (
  <G {...p}>
    <rect x={-22} y={-150} width={44} height={150} rx={6} fill={FILL} {...ink} />
    <path d={`M0,-160 q${-18 + Math.sin(t * 9) * 4},-30 0,-66 q${18 + Math.sin(t * 7) * 4},34 0,66Z`} fill={COL.yellow} {...ink} strokeWidth={6} />
  </G>
);

export const Glass: React.FC<XY & { color: string }> = ({ color, ...p }) => (
  <G {...p}>
    <path d="M-120,320 L-120,-60 Q0,-230 120,-60 L120,320Z" fill={color} {...ink} strokeWidth={10} />
    <path d="M-120,90 L120,90 M0,-150 L0,320" {...ink} strokeWidth={8} />
  </G>
);

export const Gremlin: React.FC<XY & { t: number; color?: string }> = ({ t, color = COL.yellow, ...p }) => (
  <G {...p}>
    <path d={`M-22,40 L-32,${80 + Math.sin(t * 12) * 8} M22,40 L32,${80 - Math.sin(t * 12) * 8}`} {...ink} strokeWidth={8} />
    <Record x={0} y={0} r={60} label={color} spin={t * 120} />
    <circle cx={-18} cy={-10} r={9} fill={FILL} {...ink} strokeWidth={4} />
    <circle cx={18} cy={-10} r={9} fill={FILL} {...ink} strokeWidth={4} />
    <path d="M-14,18 Q0,30 14,18" fill="none" stroke={FILL} strokeWidth={5} strokeLinecap="round" />
  </G>
);

export const Magnifier: React.FC<XY> = (p) => (
  <G {...p}>
    <path d="M60,60 L150,150" {...ink} strokeWidth={26} />
    <circle r={90} fill={COL.sky} {...ink} strokeWidth={12} opacity={0.95} />
    <path d="M-50,-30 Q-40,-60 -10,-66" fill="none" stroke={FILL} strokeWidth={10} strokeLinecap="round" />
  </G>
);

export const Machine: React.FC<XY & { shake?: number }> = ({ shake = 0, ...p }) => (
  <G {...p}>
    <rect x={-260} y={-340} width={520} height={680} rx={30} fill={COL.blue} {...ink} strokeWidth={10} />
    <rect x={-210} y={-290} width={420} height={190} rx={16} fill={FILL} {...ink} />
    <text y={-215} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={38} fill={INK}>
      ОБМЕН ВКУСА
    </text>
    <text y={-140} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={54} fill={INK}>
      плохой → хороший
    </text>
    <rect x={-150} y={-50} width={300} height={80} rx={10} fill={INK} />
    <rect x={-80} y={100} width={160} height={150} rx={12} fill={FILL} {...ink} />
    <g transform={`translate(${shake},0)`}>
      <circle cx={190} cy={10} r={24} fill={COL.yellow} {...ink} strokeWidth={6} />
      <circle cx={190} cy={90} r={24} fill={COL.pink} {...ink} strokeWidth={6} />
    </g>
  </G>
);

export const Book: React.FC<XY & { open: number }> = ({ open, ...p }) => (
  <G {...p}>
    <path d={`M0,-240 L${-440 * open},-210 L${-440 * open},240 L0,270Z`} fill={FILL} {...ink} strokeWidth={10} />
    <path d={`M0,-240 L${440 * open},-210 L${440 * open},240 L0,270Z`} fill={FILL} {...ink} strokeWidth={10} />
    {open > 0.8
      ? Array.from({ length: 6 }).map((_, i) => (
          <g key={i}>
            <path d={`M-380,${-40 + i * 44} L-60,${-34 + i * 44}`} {...ink} strokeWidth={5} opacity={0.5} />
            <path d={`M60,${-34 + i * 44} L380,${-40 + i * 44}`} {...ink} strokeWidth={5} opacity={0.5} />
          </g>
        ))
      : null}
  </G>
);

export const Board: React.FC<XY & { w: number; h: number }> = ({ w, h, ...p }) => (
  <G {...p}>
    <rect x={-w / 2 - 20} y={-h / 2 - 20} width={w + 40} height={h + 40} rx={14} fill="#b8875a" {...ink} strokeWidth={10} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="#2f4a3f" {...ink} strokeWidth={6} />
  </G>
);

export const Spring: React.FC<{ x: number; y1: number; y2: number; n?: number }> = ({ x, y1, y2, n = 7 }) => {
  const d = Array.from({ length: n + 1 })
    .map((_, i) => `${i === 0 ? "M" : "L"}${x + (i % 2 ? 30 : -30)},${y1 + ((y2 - y1) * i) / n}`)
    .join(" ");
  return <path d={d} fill="none" {...ink} strokeWidth={8} />;
};
