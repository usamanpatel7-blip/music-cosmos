import React from "react";
import { INK, hash } from "./kit";

/* Ретро-реквизит: тонкая тушь, приглушённые краски старой печати.
   SVG-группы в пиксельных координатах панели (кроме Room и Polaroid — это HTML). */

export const R = {
  wall: "#efdfbf",
  wall2: "#e6d2ab",
  floor: "#b77b4c",
  floor2: "#a56b40",
  wood: "#a8683c",
  woodD: "#74462a",
  green: "#557f5f",
  mustard: "#d9a640",
  rust: "#c0562f",
  teal: "#3f8f8a",
  navy: "#2a3a63",
  cream: "#fff4dd",
  paper: "#f6ecd6",
  red: "#c8443a",
  pink: "#e98fa6",
  sky1: "#f6b77c",
  sky2: "#c58bb0",
  night1: "#1f2a4d",
  night2: "#3f4f7c",
  metal: "#c9c6bd",
  black: "#1b1b20",
};
export const K = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type XY = { x: number; y: number; s?: number; rot?: number; op?: number };
export const G: React.FC<XY & { children: React.ReactNode }> = ({ x, y, s = 1, rot = 0, op, children }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    {children}
  </g>
);

/* ---------- пластинка сверху: дорожки, блик стоит на месте, пока диск крутится */
export const Vinyl: React.FC<XY & { r?: number; label?: string; spin?: number; wear?: number; pie?: number; pieColor?: string; text?: string }> = ({ r = 200, label = R.red, spin = 0, wear = 0, pie, pieColor = R.cream, text, ...p }) => (
  <G {...p}>
    <circle r={r} fill={R.black} {...K} />
    <g transform={`rotate(${spin})`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} r={r * (0.42 + i * 0.062)} fill="none" stroke="#3a3a42" strokeWidth={i % 3 === 0 ? 3 : 1.5} />
      ))}
      {wear > 0
        ? Array.from({ length: 14 }).map((_, i) => {
            const a = hash(i) * Math.PI * 2;
            const rr = r * (0.45 + hash(i + 9) * 0.5);
            return <path key={i} d={`M${Math.cos(a) * rr},${Math.sin(a) * rr} A${rr},${rr} 0 0,1 ${Math.cos(a + 0.5) * rr},${Math.sin(a + 0.5) * rr}`} stroke="#8d8a84" strokeWidth={1.5} fill="none" opacity={wear * 0.8} />;
          })
        : null}
      <circle r={r * 0.33} fill={label} stroke={INK} strokeWidth={4} />
      {pie != null && pie > 0 ? (
        <path
          d={`M0,0 L0,${-r * 0.33} A${r * 0.33},${r * 0.33} 0 ${pie > 0.5 ? 1 : 0},1 ${Math.sin(pie * Math.PI * 2) * r * 0.33},${-Math.cos(pie * Math.PI * 2) * r * 0.33}Z`}
          fill={pieColor}
          stroke={INK}
          strokeWidth={3}
        />
      ) : null}
      {text ? (
        <text y={-r * 0.12} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={r * 0.075} fill={INK} letterSpacing="0.08em">
          {text}
        </text>
      ) : null}
      <circle r={r * 0.025} fill={R.cream} />
    </g>
    <path d={`M${-r * 0.8},${-r * 0.42} A${r * 0.9},${r * 0.9} 0 0,1 ${-r * 0.35},${-r * 0.84}`} stroke="#fff" strokeOpacity={0.22} strokeWidth={r * 0.1} fill="none" strokeLinecap="round" />
    <path d={`M${r * 0.8},${r * 0.42} A${r * 0.9},${r * 0.9} 0 0,1 ${r * 0.35},${r * 0.84}`} stroke="#fff" strokeOpacity={0.12} strokeWidth={r * 0.08} fill="none" strokeLinecap="round" />
  </G>
);

/* ---------- проигрыватель сверху: arm — положение иглы (−1 — на подставке, 0…1 — от края к центру) */
export const TurntableTop: React.FC<XY & { spin: number; arm: number; lift?: number; label?: string; wear?: number }> = ({ spin, arm, lift = 0, label = R.red, wear = 0, ...p }) => {
  const ang = arm < 0 ? -4 + arm * 6 : 17 + arm * 19;
  return (
    <G {...p}>
      <rect x={-330} y={-250} width={660} height={500} rx={18} fill={R.wood} {...K} />
      <rect x={-312} y={-232} width={624} height={464} rx={12} fill="none" stroke={R.woodD} strokeWidth={3} />
      <circle cx={-60} cy={0} r={212} fill="#3b3b42" {...K} />
      <Vinyl x={-60} y={0} r={200} spin={spin} label={label} wear={wear} />
      <circle cx={210} cy={-170} r={34} fill={R.metal} {...K} />
      <g transform={`translate(210,-170) rotate(${ang})`}>
        <g transform={`translate(${lift * 6},${lift * 10})`} opacity={0.25}>
          <path d="M0,0 L-18,300 L-60,345" stroke={INK} strokeWidth={12} fill="none" />
        </g>
        <path d="M0,0 L-18,300 L-60,345" stroke={R.metal} strokeWidth={10} fill="none" />
        <path d="M0,0 L-18,300 L-60,345" stroke={INK} strokeWidth={3} fill="none" />
        <rect x={-84} y={330} width={44} height={30} rx={5} fill={INK} transform="rotate(-20,-62,345)" />
        <rect x={-14} y={-46} width={28} height={40} rx={6} fill={R.metal} {...K} />
      </g>
      <circle cx={230} cy={170} r={22} fill={R.mustard} {...K} />
      <rect x={160} y={120} width={36} height={14} rx={4} fill={R.cream} {...K} strokeWidth={3} />
    </G>
  );
};

/* ---------- кассета: tape — сколько ленты на левой катушке (0…1) */
export const Cassette: React.FC<XY & { w?: number; label?: string; color?: string; spin?: number; tape?: number; hand?: string }> = ({ w = 320, label, color = R.cream, spin = 0, tape = 0.5, hand = "#2a3a63", ...p }) => {
  const h = w * 0.63;
  const reel = (cx: number, amt: number, sp: number) => (
    <g transform={`translate(${cx},${h * 0.06})`}>
      <circle r={w * (0.05 + amt * 0.085)} fill="#5a3a28" />
      <g transform={`rotate(${sp})`}>
        <circle r={w * 0.045} fill={R.cream} stroke={INK} strokeWidth={3} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x={-2.5} y={-w * 0.045} width={5} height={w * 0.018} fill={INK} transform={`rotate(${a})`} />
        ))}
      </g>
    </g>
  );
  return (
    <G {...p}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.04} fill="#2b2b31" {...K} />
      <rect x={-w * 0.44} y={-h * 0.42} width={w * 0.88} height={h * 0.62} rx={w * 0.025} fill={color} stroke={INK} strokeWidth={3} />
      <rect x={-w * 0.44} y={-h * 0.42} width={w * 0.88} height={h * 0.1} fill={R.rust} opacity={0.85} />
      <rect x={-w * 0.27} y={-h * 0.08} width={w * 0.54} height={h * 0.28} rx={h * 0.13} fill="#d9d2c2" stroke={INK} strokeWidth={3} />
      {reel(-w * 0.16, tape, spin)}
      {reel(w * 0.16, 1 - tape, spin)}
      {label ? (
        <text x={0} y={-h * 0.165} textAnchor="middle" fontFamily="Pangolin" fontSize={w * 0.1} fill={hand}>
          {label}
        </text>
      ) : null}
      <path d={`M${-w * 0.3},${h / 2} L${-w * 0.24},${h * 0.3} L${w * 0.24},${h * 0.3} L${w * 0.3},${h / 2}`} fill="#3a3a42" stroke={INK} strokeWidth={3} />
      {[-0.42, 0.42].map((k) => (
        <circle key={k} cx={w * k} cy={h * 0.4} r={w * 0.015} fill={R.metal} />
      ))}
    </G>
  );
};

/* ---------- магнитола: кассета в окошке, нажимаемые клавиши, динамики дышат под бас */
export const Boombox: React.FC<XY & { pulse?: number; spin?: number; play?: number; ff?: number; eject?: number; label?: string; tape?: number }> = ({ pulse = 0, spin = 0, play = 0, ff = 0, eject = 0, label, tape = 0.5, ...p }) => (
  <G {...p}>
    <path d="M-300,-250 L-300,-320 Q-300,-350 -270,-350 L270,-350 Q300,-350 300,-320 L300,-250" fill="none" stroke={INK} strokeWidth={16} />
    <path d="M-300,-250 L-300,-320 Q-300,-350 -270,-350 L270,-350 Q300,-350 300,-320 L300,-250" fill="none" stroke={R.metal} strokeWidth={8} />
    <rect x={-480} y={-260} width={960} height={430} rx={34} fill="#cfcabd" {...K} />
    <rect x={-480} y={110} width={960} height={60} rx={20} fill="#b9b3a4" {...K} />
    {[-300, 300].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={-20} r={150} fill="#3c3c44" {...K} />
        {Array.from({ length: 7 }).map((_, i) => (
          <circle key={i} cx={cx} cy={-20} r={140 - i * 6} fill="none" stroke="#55555e" strokeWidth={1.5} />
        ))}
        <circle cx={cx} cy={-20} r={86 * (1 + pulse * 0.08)} fill="#2a2a30" stroke="#6b6b74" strokeWidth={4} />
        <circle cx={cx} cy={-20} r={30 * (1 + pulse * 0.12)} fill="#4a4a52" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <rect x={-130} y={-200} width={260} height={180} rx={10} fill="#2b2b31" {...K} />
    <g transform={`translate(0,${-110 - eject * 40}) rotate(${-eject * 4})`}>
      <Cassette x={0} y={0} w={220} spin={spin} label={label} tape={tape} />
    </g>
    <rect x={-130} y={-200} width={260} height={180} rx={10} fill="#9fc3c7" opacity={0.22 + eject * 0.2} />
    {["◀◀", "▶", "▶▶", "■", "⏏"].map((g, i) => {
      const down = (i === 1 ? play : i === 2 ? ff : i === 4 ? eject * 0.6 : 0) * 10;
      return (
        <g key={i} transform={`translate(${-125 + i * 62},${10 + down})`}>
          <rect x={-26} y={-6} width={52} height={40} rx={6} fill={i === 1 ? R.mustard : R.cream} {...K} strokeWidth={4} />
          <text y={22} textAnchor="middle" fontSize={20} fill={INK} fontFamily="Golos Text">
            {g}
          </text>
        </g>
      );
    })}
    <rect x={-160} y={-245} width={320} height={34} rx={6} fill="#2b2b31" />
    <rect x={-150} y={-238} width={60 + pulse * 120} height={20} rx={4} fill={R.mustard} opacity={0.9} />
    <circle cx={420} cy={-215} r={12} fill={play > 0.5 ? R.red : "#7a4040"} stroke={INK} strokeWidth={3} />
  </G>
);

/* ---------- обувная коробка с крышкой; children — то, что лежит внутри */
export const Shoebox: React.FC<XY & { open: number; w?: number; h?: number; children?: React.ReactNode; color?: string }> = ({ open, w = 760, h = 300, children, color = "#d8b98a", ...p }) => (
  <G {...p}>
    <path d={`M${-w / 2},${-h} L${-w / 2 + 40},${-h - 60} L${w / 2 - 40},${-h - 60} L${w / 2},${-h}Z`} fill="#8a6a44" {...K} />
    {children}
    <rect x={-w / 2} y={-h} width={w} height={h} fill={color} {...K} />
    <rect x={-w * 0.18} y={-h * 0.62} width={w * 0.36} height={h * 0.3} fill={R.cream} stroke={INK} strokeWidth={3} />
    <text x={0} y={-h * 0.43} textAnchor="middle" fontFamily="Pangolin" fontSize={30} fill={R.navy}>
      не трогать
    </text>
    <g transform={`translate(${w / 2},${-h - 60}) rotate(${-open * 112}) translate(${-w / 2},${h + 60})`}>
      <rect x={-w / 2 - 14} y={-h - 70} width={w + 28} height={56} fill="#c9a876" {...K} />
    </g>
  </G>
);

/* ---------- полароид (HTML): проявляется — dev от 0 до 1 */
export const Polaroid: React.FC<{ x: number; y: number; w: number; dev: number; rot?: number; children: React.ReactNode; caption?: string; style?: React.CSSProperties }> = ({ x, y, w, dev, rot = 0, children, caption, style }) => {
  const iw = w * 0.88;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - w * 0.6, width: w, height: w * 1.2, background: "#fbf8f1", border: `4px solid ${INK}`, transform: `rotate(${rot}deg)`, boxShadow: "10px 12px 0 rgba(22,22,28,.18)", ...style }}>
      <div style={{ position: "absolute", left: w * 0.06, top: w * 0.06, width: iw, height: iw, overflow: "hidden", background: "#d9cfbf", border: `3px solid ${INK}` }}>
        <div style={{ position: "absolute", inset: 0, filter: `sepia(${0.25 + (1 - dev) * 0.5}) saturate(${0.5 + dev * 0.5}) contrast(${0.75 + dev * 0.25})` }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, background: "#33403f", opacity: Math.pow(1 - dev, 1.4) }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse, transparent 50%, rgba(80,50,20,.35))" }} />
      </div>
      {caption ? <div style={{ position: "absolute", left: 0, right: 0, bottom: w * 0.05, textAlign: "center", font: `400 ${w * 0.09}px/1 "Pangolin"`, color: R.navy }}>{caption}</div> : null}
    </div>
  );
};

/* ---------- конверт пластинки: обложки-узоры без надписей */
export const Sleeve: React.FC<XY & { w?: number; design?: number; color?: string; worn?: number; tilt?: number }> = ({ w = 300, design = 0, color = R.mustard, worn = 0, ...p }) => {
  const h2 = w / 2;
  const art = [
    <path key="bolt" d={`M${w * 0.06},${-w * 0.36} L${-w * 0.16},${w * 0.04} L${-w * 0.02},${w * 0.04} L${-w * 0.08},${w * 0.36} L${w * 0.17},${-w * 0.06} L${w * 0.03},${-w * 0.06}Z`} fill={R.mustard} {...K} />,
    <g key="pianist">
      <circle cx={-w * 0.05} cy={-w * 0.1} r={w * 0.11} fill={R.cream} {...K} />
      <path d={`M${-w * 0.28},${w * 0.36} Q${-w * 0.25},${w * 0.05} ${-w * 0.05},${w * 0.04} Q${w * 0.17},${w * 0.05} ${w * 0.2},${w * 0.36}`} fill={INK} />
      <rect x={-w * 0.36} y={w * 0.3} width={w * 0.72} height={w * 0.06} fill={R.cream} {...K} strokeWidth={3} />
    </g>,
    <g key="geo">
      <rect x={-w * 0.32} y={-w * 0.32} width={w * 0.3} height={w * 0.42} fill={R.red} {...K} strokeWidth={4} />
      <circle cx={w * 0.14} cy={w * 0.14} r={w * 0.16} fill="none" {...K} strokeWidth={4} />
      <path d={`M${-w * 0.3},${w * 0.3} L${w * 0.32},${-w * 0.3}`} {...K} strokeWidth={3} />
    </g>,
    <g key="waves">
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${-w * 0.36},${-w * 0.2 + i * w * 0.14} q${w * 0.12},${-w * 0.08} ${w * 0.24},0 t${w * 0.24},0 t${w * 0.24},0`} fill="none" {...K} strokeWidth={4} />
      ))}
    </g>,
    <g key="sun">
      <circle r={w * 0.2} fill={R.cream} {...K} />
      <rect x={-w * 0.5} y={w * 0.12} width={w} height={w * 0.38} fill={R.navy} opacity={0.8} />
    </g>,
    <g key="blank">
      <rect x={-w * 0.06} y={-w * 0.06} width={w * 0.12} height={w * 0.12} fill={INK} />
    </g>,
  ];
  return (
    <G {...p}>
      <rect x={-h2} y={-h2} width={w} height={w} fill={color} {...K} />
      <g clipPath="none">{art[design % art.length]}</g>
      {worn > 0 ? (
        <>
          <circle r={w * 0.4} fill="none" stroke="#fff" strokeOpacity={0.3 * worn} strokeWidth={w * 0.03} />
          <path d={`M${h2},${-h2} l${-w * 0.12},0 l${w * 0.12},${w * 0.12}Z`} fill={R.paper} stroke={INK} strokeWidth={3} opacity={worn} />
          <rect x={-w * 0.45} y={h2 - w * 0.12} width={w * 0.3} height={w * 0.06} fill="#e9dcae" opacity={0.85 * worn} transform={`rotate(-8,${-w * 0.3},${h2 - w * 0.1})`} />
        </>
      ) : null}
    </G>
  );
};

/* ---------- полка-корешки: spines — цвета; offsets — выдвинутость корешка */
export const Spines: React.FC<XY & { items: { c: string; w?: number; h?: number; out?: number; tilt?: number }[] }> = ({ items, ...p }) => {
  let cx = 0;
  return (
    <G {...p}>
      {items.map((it, i) => {
        const w = it.w ?? 22;
        const h = it.h ?? 300;
        const x0 = cx;
        cx += w;
        return (
          <g key={i} transform={`translate(${x0 + w / 2},0) rotate(${it.tilt ?? 0},0,0) translate(0,${(it.out ?? 0) * 0})`}>
            <rect x={-w / 2} y={-h - (it.out ?? 0)} width={w} height={h} fill={it.c} stroke={INK} strokeWidth={3} />
            <rect x={-w / 2 + 4} y={-h - (it.out ?? 0) + 22} width={w - 8} height={6} fill="#000" opacity={0.15} />
          </g>
        );
      })}
    </G>
  );
};

export const Plank: React.FC<XY & { w: number }> = ({ w, ...p }) => (
  <G {...p}>
    <rect x={0} y={0} width={w} height={24} fill={R.wood} {...K} />
    <path d={`M30,24 l20,40 M${w - 30},24 l-20,40`} {...K} strokeWidth={8} />
  </G>
);

/* ---------- телефон: светится и вибрирует */
export const Phone: React.FC<XY & { glow?: number; buzz?: number; t?: number }> = ({ glow = 0, buzz = 0, t = 0, ...p }) => (
  <G {...p}>
    <g transform={`translate(${Math.sin(t * 90) * buzz * 6},0) rotate(${Math.sin(t * 70) * buzz * 3})`}>
      {glow > 0 ? <ellipse rx={260} ry={300} fill="url(#phoneGlow)" opacity={glow} /> : null}
      <rect x={-95} y={-190} width={190} height={380} rx={30} fill={INK} />
      <rect x={-84} y={-170} width={168} height={340} rx={20} fill={glow > 0 ? "#f6eef6" : "#24242a"} />
      {glow > 0
        ? Array.from({ length: 12 }).map((_, i) => {
            const hh = 16 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 70;
            return <rect key={i} x={-70 + i * 12} y={40 - hh / 2} width={7} height={hh} rx={3} fill={i % 2 ? "#e2487a" : "#38c6d6"} opacity={glow} />;
          })
        : null}
      <rect x={-30} y={-180} width={60} height={10} rx={5} fill="#3a3a42" />
    </g>
    <defs>
      <radialGradient id="phoneGlow">
        <stop offset="0" stopColor="#fff2f8" stopOpacity={0.9} />
        <stop offset="1" stopColor="#fff2f8" stopOpacity={0} />
      </radialGradient>
    </defs>
  </G>
);

export const Pencil: React.FC<XY & { len?: number }> = ({ len = 420, ...p }) => (
  <G {...p}>
    <rect x={-16} y={-len} width={32} height={len - 50} fill={R.mustard} {...K} />
    <path d={`M-16,-50 L0,0 L16,-50Z`} fill="#f1d6aa" {...K} />
    <path d="M-5,-15 L0,0 L5,-15Z" fill={INK} />
    <rect x={-16} y={-len - 40} width={32} height={42} fill={R.pink} {...K} />
    <rect x={-17} y={-len - 6} width={34} height={22} fill={R.metal} {...K} />
    <path d={`M0,${-len} L0,-50`} stroke="#b88a2a" strokeWidth={3} />
  </G>
);

export const Clock: React.FC<XY & { h: number; m: number; r?: number }> = ({ h, m, r = 70, ...p }) => (
  <G {...p}>
    <circle r={r} fill={R.cream} {...K} />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={i} d={`M0,${-r * 0.82} L0,${-r * 0.7}`} transform={`rotate(${i * 30})`} stroke={INK} strokeWidth={3} />
    ))}
    <path d={`M0,0 L0,${-r * 0.48}`} transform={`rotate(${h * 30})`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d={`M0,0 L0,${-r * 0.7}`} transform={`rotate(${m * 6})`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <circle r={5} fill={R.red} />
  </G>
);

/* ---------- окно: небо от заката (day 1) до ночи (day 0) */
export const Window: React.FC<XY & { w: number; h: number; day?: number; id: string; curtain?: string }> = ({ w, h, day = 1, id, curtain = R.rust, ...p }) => {
  const mix = (a: string, b: string, u: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
  };
  return (
    <G {...p}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(R.night1, R.sky2, day)} />
          <stop offset="1" stopColor={mix(R.night2, R.sky1, day)} />
        </linearGradient>
      </defs>
      <rect x={-w / 2 - 16} y={-h / 2 - 16} width={w + 32} height={h + 32} fill={R.cream} {...K} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={`url(#${id})`} {...K} />
      {day < 0.5
        ? [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={-w / 2 + hash(i) * w} cy={-h / 2 + hash(i + 5) * h * 0.6} r={2.5} fill="#fff" opacity={1 - day * 2} />)
        : null}
      <path d={`M${-w / 2},${h * 0.25} L${-w * 0.3},${h * 0.1} L${-w * 0.1},${h * 0.22} L${w * 0.12},${h * 0.05} L${w * 0.32},${h * 0.2} L${w / 2},${h * 0.12} L${w / 2},${h / 2} L${-w / 2},${h / 2}Z`} fill={mix("#141a33", "#7a5a7a", day)} opacity={0.9} />
      <path d={`M0,${-h / 2} L0,${h / 2} M${-w / 2},0 L${w / 2},0`} stroke={R.cream} strokeWidth={14} />
      <path d={`M0,${-h / 2} L0,${h / 2} M${-w / 2},0 L${w / 2},0`} stroke={INK} strokeWidth={3} opacity={0.5} />
      <path d={`M${-w / 2 - 40},${-h / 2 - 40} Q${-w / 2 + 10},0 ${-w / 2 - 30},${h / 2 + 60} L${-w / 2 - 90},${h / 2 + 60} L${-w / 2 - 90},${-h / 2 - 40}Z`} fill={curtain} {...K} />
      <path d={`M${w / 2 + 40},${-h / 2 - 40} Q${w / 2 - 10},0 ${w / 2 + 30},${h / 2 + 60} L${w / 2 + 90},${h / 2 + 60} L${w / 2 + 90},${-h / 2 - 40}Z`} fill={curtain} {...K} />
    </G>
  );
};

export const Lamp: React.FC<XY & { on?: number; swing?: number }> = ({ on = 1, swing = 0, ...p }) => (
  <G {...p}>
    <g transform={`rotate(${swing})`}>
      <ellipse cx={0} cy={60} rx={260} ry={300} fill="url(#lampGlow)" opacity={on} />
      <path d="M0,-200 L0,-80" {...K} />
      <path d="M-80,0 L-50,-90 L50,-90 L80,0Z" fill={R.mustard} {...K} />
      <ellipse cx={0} cy={0} rx={80} ry={14} fill={on > 0.5 ? "#fff3c4" : R.mustard} {...K} strokeWidth={4} />
    </g>
    <defs>
      <radialGradient id="lampGlow">
        <stop offset="0" stopColor="#ffe9a8" stopOpacity={0.75} />
        <stop offset="1" stopColor="#ffe9a8" stopOpacity={0} />
      </radialGradient>
    </defs>
  </G>
);

export const Armchair: React.FC<XY & { color?: string }> = ({ color = R.green, ...p }) => (
  <G {...p}>
    <path d="M-170,-330 Q-170,-380 -120,-380 L120,-380 Q170,-380 170,-330 L170,-120 L-170,-120Z" fill={color} {...K} />
    <rect x={-150} y={-150} width={300} height={90} rx={22} fill={color} {...K} />
    <rect x={-215} y={-240} width={70} height={190} rx={30} fill={color} {...K} />
    <rect x={145} y={-240} width={70} height={190} rx={30} fill={color} {...K} />
    <path d="M-180,-50 L-190,0 M180,-50 L190,0" {...K} strokeWidth={10} />
  </G>
);

export const Plant: React.FC<XY & { g?: number; t?: number }> = ({ g = 1, t = 0, ...p }) => (
  <G {...p}>
    {Array.from({ length: 7 }).map((_, i) => {
      const u = Math.min(1, Math.max(0, g * 7 - i));
      if (u <= 0) return null;
      const a = -70 + i * 23 + Math.sin(t * 1.3 + i) * 3;
      const L = (90 + hash(i) * 60) * u;
      return (
        <g key={i} transform={`rotate(${a + 90})`}>
          <path d={`M0,0 Q${L * 0.3},${-L * 0.6} 0,${-L}`} stroke={INK} strokeWidth={3} fill="none" />
          <path d={`M0,${-L} q${-30 * u},${30 * u} 0,${60 * u} q${30 * u},${-30 * u} 0,${-60 * u}`} fill={R.green} stroke={INK} strokeWidth={3} transform={`rotate(-90,0,${-L})`} />
        </g>
      );
    })}
    <path d="M-60,0 L60,0 L45,90 L-45,90Z" fill={R.rust} {...K} />
  </G>
);

/* ---------- срез дерева, который становится пластинкой: годовые кольца = дорожки.
   n — сколько колец уже наросло, m — 0 дерево … 1 винил */
export const Rings: React.FC<XY & { n: number; m: number; r?: number; spin?: number; colors?: string[] }> = ({ n, m, r = 300, spin = 0, colors = [R.red, R.pink, "#8d8a84", R.wood, R.navy], ...p }) => {
  const mix = (a: string, b: string, u: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
  };
  const k = colors.length;
  return (
    <G {...p}>
      <g transform={`rotate(${spin})`}>
        <circle r={r * 1.06} fill={mix("#6b4428", R.black, m)} {...K} />
        {Array.from({ length: k }).map((_, j) => {
          const i = k - 1 - j;
          const vis = Math.min(1, Math.max(0, n - i));
          if (vis <= 0) return null;
          const rr = r * (0.3 + ((i + 1) / k) * 0.7) * (0.85 + vis * 0.15);
          return (
            <g key={i} opacity={vis}>
              <circle r={rr} fill={mix(i % 2 ? "#d9b07c" : "#cfa06b", "#222228", m)} stroke={mix("#8a5a34", colors[i], m)} strokeWidth={6 + m * 4} />
              <path d={`M${rr * 0.7},${-rr * 0.71} q${rr * 0.06},${rr * 0.1} 0,${rr * 0.2}`} stroke={mix("#8a5a34", "#222228", m)} strokeWidth={2} fill="none" />
            </g>
          );
        })}
        <circle r={r * 0.3 * Math.min(1, n)} fill={mix("#e2c08d", R.red, m)} stroke={INK} strokeWidth={4} />
        <circle r={r * 0.025} fill={R.cream} opacity={m} />
        <path d={`M${-r * 0.2},${r * 0.12} L${r * 0.75},${-r * 0.2}`} stroke="#5a3a20" strokeWidth={3} opacity={(1 - m) * 0.6} />
      </g>
      <path d={`M${-r * 0.8},${-r * 0.42} A${r * 0.9},${r * 0.9} 0 0,1 ${-r * 0.35},${-r * 0.84}`} stroke="#fff" strokeOpacity={0.2 * m} strokeWidth={r * 0.1} fill="none" strokeLinecap="round" />
    </G>
  );
};

/* ---------- ручка громкости усилителя со шкалой до 11 и стрелочным индикатором */
export const Amp: React.FC<XY & { v: number; vu: number }> = ({ v, vu, ...p }) => (
  <G {...p}>
    <rect x={-560} y={-250} width={1120} height={500} rx={24} fill="#d8d3c6" {...K} />
    {Array.from({ length: 40 }).map((_, i) => (
      <path key={i} d={`M-540,${-230 + i * 12} L540,${-230 + i * 12}`} stroke="#fff" strokeOpacity={0.25} strokeWidth={2} />
    ))}
    <rect x={-480} y={-170} width={380} height={240} rx={14} fill="#f3e3b0" {...K} />
    <path d="M-440,40 A250,250 0 0,1 -140,40" fill="none" stroke={INK} strokeWidth={3} transform="translate(0,-40)" />
    <path d="M-200,-20 A250,250 0 0,1 -150,0" fill="none" stroke={R.red} strokeWidth={10} />
    <text x={-290} y={30} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={30} fill={INK}>
      VU
    </text>
    <path d={`M-290,60 L${-290 + Math.cos(Math.PI * (1.15 + vu * 0.7)) * 200},${60 + Math.sin(Math.PI * (1.15 + vu * 0.7)) * 200}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <g transform="translate(260,0)">
      {Array.from({ length: 12 }).map((_, k) => {
        const a = ((-135 + k * 24.5 - 90) * Math.PI) / 180;
        return (
          <g key={k}>
            <path d={`M${Math.cos(a) * 150},${Math.sin(a) * 150} L${Math.cos(a) * 172},${Math.sin(a) * 172}`} stroke={INK} strokeWidth={k === 11 ? 8 : 4} />
            <text x={Math.cos(a) * 205} y={Math.sin(a) * 205 + 12} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={k === 11 ? 46 : 30} fill={k === 11 ? R.red : INK}>
              {k}
            </text>
          </g>
        );
      })}
      <circle r={130} fill="#bdb8ab" {...K} />
      <g transform={`rotate(${-135 + v * 24.5})`}>
        <circle r={110} fill="#2b2b31" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 24 }).map((_, i) => (
          <path key={i} d="M0,-110 L0,-98" transform={`rotate(${i * 15})`} stroke="#55555e" strokeWidth={4} />
        ))}
        <path d="M0,-30 L0,-96" stroke={R.cream} strokeWidth={10} strokeLinecap="round" />
      </g>
    </g>
  </G>
);

/* ---------- дверь с табличкой (вид спереди), open — 0…1 */
export const Door: React.FC<XY & { open?: number; color?: string; sign?: string; inside?: React.ReactNode }> = ({ open = 0, color = "#8fb1a6", sign, inside, ...p }) => (
  <G {...p}>
    <rect x={-20} y={-20} width={340} height={620} fill={R.cream} {...K} />
    <rect x={0} y={0} width={300} height={600} fill="#2c2420" />
    {inside}
    <g transform={`scale(${1 - open * 0.82},1) skewY(${open * 10})`}>
      <rect x={0} y={0} width={300} height={600} fill={color} {...K} />
      <rect x={36} y={40} width={228} height={220} fill="none" stroke={INK} strokeWidth={4} />
      <rect x={36} y={300} width={228} height={260} fill="none" stroke={INK} strokeWidth={4} />
      <circle cx={262} cy={320} r={14} fill={R.mustard} {...K} strokeWidth={4} />
      {sign ? (
        <g transform="translate(150,150) rotate(-4)">
          <rect x={-110} y={-60} width={220} height={120} fill="#fff" stroke={INK} strokeWidth={4} />
          {sign.split("\n").map((ln, i, a) => (
            <text key={i} y={(i - (a.length - 1) / 2) * 40 + 12} textAnchor="middle" fontFamily="Pangolin" fontSize={34} fill={R.red}>
              {ln}
            </text>
          ))}
        </g>
      ) : null}
    </g>
  </G>
);

/* настенная рамка (SVG) — содержимое кладётся отдельным HTML-слоем */
export const FrameRect: React.FC<XY & { w: number; h: number; color?: string }> = ({ w, h, color = R.wood, ...p }) => (
  <G {...p}>
    <rect x={-w / 2 - 22} y={-h / 2 - 22} width={w + 44} height={h + 44} fill={color} {...K} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={R.cream} stroke={INK} strokeWidth={3} />
  </G>
);

/* ---------- комната (HTML-фон): обои в мелкий ромбик, пол из досок, плинтус */
export const Room: React.FC<{ horizon?: number; wall?: string; floor?: string; dim?: number; w?: number; h?: number }> = ({ horizon = 760, wall = R.wall, floor = R.floor, dim = 0, w = 1920, h = 1080 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: horizon,
        backgroundColor: wall,
        backgroundImage: `radial-gradient(rgba(150,100,50,.18) 2.2px, transparent 2.6px), repeating-linear-gradient(90deg, transparent 0 58px, rgba(150,100,50,.08) 58px 62px)`,
        backgroundSize: "40px 40px, 120px 100%",
      }}
    />
    <div style={{ position: "absolute", left: 0, top: horizon, width: w, height: h - horizon, backgroundColor: floor, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 176px, rgba(60,30,10,.35) 176px 180px)` }} />
    <div style={{ position: "absolute", left: 0, top: horizon - 26, width: w, height: 30, background: R.cream, borderTop: `4px solid ${INK}`, borderBottom: `4px solid ${INK}` }} />
    {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: "#1a1530", opacity: dim }} /> : null}
  </div>
);
