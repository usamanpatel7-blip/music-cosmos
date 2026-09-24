import React from "react";

/* Декорации: комната, сцена, реквизит. Всё — плоский вектор со светом
   градиентами; без контуров и дрожания. */

export const SetDefs: React.FC = () => (
  <>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#e9dcc5" />
      <stop offset="1" stopColor="#dccab0" />
    </linearGradient>
    <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#ffe3a8" stopOpacity={0.75} />
      <stop offset="1" stopColor="#ffe3a8" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#b9875a" />
      <stop offset="1" stopColor="#9c6d44" />
    </linearGradient>
    <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f3b37a" />
      <stop offset="0.55" stopColor="#e98c6b" />
      <stop offset="1" stopColor="#8f6c9e" />
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#1a0f08" stopOpacity={0.35} />
    </radialGradient>
    <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff2c4" stopOpacity={0.85} />
      <stop offset="1" stopColor="#ffd36b" stopOpacity={0.1} />
    </linearGradient>
    <radialGradient id="stageFloor" cx="0.5" cy="0.3" r="0.6">
      <stop offset="0" stopColor="#4a3a5e" />
      <stop offset="1" stopColor="#141019" />
    </radialGradient>
    <linearGradient id="vinyl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#2b2b31" />
      <stop offset="0.5" stopColor="#111114" />
      <stop offset="1" stopColor="#2b2b31" />
    </linearGradient>
  </>
);

export const Record: React.FC<{ x: number; y: number; r: number; label?: string; rot?: number }> = ({ x, y, r, label = "#d9623b", rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <circle r={r} fill="url(#vinyl)" />
    {[0.55, 0.7, 0.85].map((k) => (
      <circle key={k} r={r * k} fill="none" stroke="#3a3a42" strokeWidth={1.2} opacity={0.7} />
    ))}
    <path d={`M${-r * 0.8},${-r * 0.3} A${r * 0.85},${r * 0.85} 0 0,1 ${-r * 0.3},${-r * 0.8}`} stroke="#fff" strokeOpacity={0.18} strokeWidth={r * 0.08} fill="none" strokeLinecap="round" />
    <circle r={r * 0.33} fill={label} />
    <circle r={r * 0.05} fill="#efe4d2" />
  </g>
);

export const Turntable: React.FC<{ x: number; y: number; s?: number; rot: number; armOn: boolean }> = ({ x, y, s = 1, rot, armOn }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {/* тумба */}
    <rect x={-230} y={0} width={460} height={250} rx={10} fill="#7a4e2e" />
    <rect x={-230} y={0} width={460} height={16} rx={6} fill="#8f5f3a" />
    <rect x={-210} y={40} width={200} height={190} rx={6} fill="#6b4327" />
    <rect x={10} y={40} width={200} height={190} rx={6} fill="#6b4327" />
    {[-20, 200].map((xx) => (
      <circle key={xx} cx={xx - 100 + 90} cy={135} r={6} fill="#c9a24e" />
    ))}
    {/* пластинки в тумбе */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={-196 + i * 10} y={70} width={8} height={150} fill={["#d9623b", "#2e4a6b", "#e0a93b", "#1d2230", "#8a5a7a", "#3c6e5a"][i]} />
    ))}
    {/* проигрыватель */}
    <rect x={-190} y={-60} width={380} height={62} rx={10} fill="#efe4d2" />
    <rect x={-190} y={-12} width={380} height={14} rx={4} fill="#d8c8ae" />
    <ellipse cx={-30} cy={-62} rx={140} ry={30} fill="#1a1a1e" />
    <g transform="translate(-30,-66) scale(1,0.22)">
      <Record x={0} y={0} r={132} rot={rot} />
    </g>
    <g transform={`translate(140,-70) rotate(${armOn ? 28 : 8})`}>
      <circle r={16} fill="#b8b8bc" />
      <path d="M0,0 L-14,110" stroke="#c9c9cd" strokeWidth={7} strokeLinecap="round" />
      <rect x={-26} y={104} width={24} height={16} rx={3} fill="#2a2a2e" />
    </g>
    <circle cx={150} cy={-26} r={9} fill="#d9623b" />
  </g>
);

/* Комната: стена, окно с закатом, полка с пластинками, лампа, ковёр */
export const Room: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-200} y={-100} width={2320} height={1080} fill="url(#wall)" />
    {/* обои: тонкие полосы */}
    {Array.from({ length: 30 }).map((_, i) => (
      <rect key={i} x={-200 + i * 80} y={-100} width={2} height={1080} fill="#d6c3a5" opacity={0.5} />
    ))}
    {/* окно */}
    <g transform="translate(1340,170)">
      <rect x={-12} y={-12} width={384} height={464} rx={6} fill="#f7efe2" />
      <rect x={0} y={0} width={360} height={440} fill="url(#window)" />
      <circle cx={250} cy={300} r={46} fill="#ffd9a0" opacity={0.9} />
      <path d="M0,360 L60,330 L120,350 L190,310 L260,340 L360,300 L360,440 L0,440Z" fill="#6c5484" opacity={0.8} />
      <path d="M0,400 L90,380 L170,395 L260,370 L360,390 L360,440 L0,440Z" fill="#4c3a63" />
      <rect x={176} y={0} width={10} height={440} fill="#f7efe2" />
      <rect x={0} y={214} width={360} height={10} fill="#f7efe2" />
      <path d="M-40,-24 C20,120 10,300 -30,470 L-60,470 L-60,-24Z" fill="#c8553d" />
      <path d="M400,-24 C340,120 350,300 390,470 L420,470 L420,-24Z" fill="#b84a34" />
    </g>
    {/* свет из окна на полу */}
    <path d="M1280,860 L1760,860 L2000,1080 L1180,1080Z" fill="#ffd9a0" opacity={0.18} />
    {/* полка с пластинками */}
    <g transform="translate(120,280)">
      <rect x={0} y={0} width={560} height={16} rx={3} fill="#7a4e2e" />
      {Array.from({ length: 22 }).map((_, i) => (
        <rect key={i} x={10 + i * 22} y={-150 + (i % 3) * 4} width={18} height={150 - (i % 3) * 4} rx={2} fill={["#d9623b", "#2e4a6b", "#e0a93b", "#1d2230", "#8a5a7a", "#3c6e5a", "#c9b79a"][i % 7]} />
      ))}
      <rect x={0} y={200} width={560} height={16} rx={3} fill="#7a4e2e" />
      <g transform="translate(90,120)">
        <rect x={-50} y={-50} width={100} height={100} fill="#1d2230" transform="rotate(-6)" />
        <path d="M-20,-30 L-38,6 L-24,6 L-32,36 L-4,-6 L-18,-6 L-8,-30Z" fill="#e0a93b" transform="rotate(-6)" />
      </g>
      <g transform="translate(260,130)">
        <rect x={-46} y={-46} width={92} height={92} fill="#efe4d2" transform="rotate(4)" />
        <circle r={24} fill="#d9623b" transform="rotate(4)" />
      </g>
      <g transform="translate(420,128)">
        <rect x={-48} y={-48} width={96} height={96} fill="#2e4a6b" transform="rotate(-3)" />
        <path d="M-30,20 Q0,-40 30,20" stroke="#efe4d2" strokeWidth={6} fill="none" transform="rotate(-3)" />
      </g>
    </g>
    {/* торшер */}
    <g transform="translate(1860,880)">
      <circle cx={0} cy={-600} r={260 + Math.sin(t * 1.3) * 6} fill="url(#lampGlow)" />
      <rect x={-4} y={-580} width={8} height={580} fill="#3a2a20" />
      <ellipse cx={0} cy={0} rx={60} ry={10} fill="#3a2a20" />
      <path d="M-80,-560 L80,-560 L50,-680 L-50,-680Z" fill="#f2d7a4" />
      <path d="M-80,-560 L80,-560 L76,-548 L-76,-548Z" fill="#e2c188" />
    </g>
    {/* пол и ковёр */}
    <rect x={-200} y={860} width={2320} height={300} fill="url(#floor)" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={-200 + i * 200} y={860} width={2} height={300} fill="#8a5c36" opacity={0.5} />
    ))}
    <rect x={-200} y={852} width={2320} height={12} fill="#c9a37a" />
    <ellipse cx={960} cy={960} rx={700} ry={70} fill="#8a3b2e" />
    <ellipse cx={960} cy={960} rx={640} ry={56} fill="none" stroke="#e0a93b" strokeWidth={4} opacity={0.6} />
  </g>
);

/* Сцена концерта: темнота, прожектор, колонки */
export const Speaker: React.FC<{ x: number; y: number; s?: number; pulse: number }> = ({ x, y, s = 1, pulse }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-110} y={-330} width={220} height={330} rx={10} fill="#16151a" />
    <rect x={-110} y={-330} width={220} height={330} rx={10} fill="none" stroke="#2c2a33" strokeWidth={6} />
    <circle cx={0} cy={-235} r={48 * (1 + pulse * 0.06)} fill="#2a2830" />
    <circle cx={0} cy={-235} r={18} fill="#3d3a46" />
    <circle cx={0} cy={-100} r={72 * (1 + pulse * 0.08)} fill="#2a2830" />
    <circle cx={0} cy={-100} r={26} fill="#3d3a46" />
    <path d={`M-60,-150 A72,72 0 0,1 -10,-170`} stroke="#fff" strokeOpacity={0.12} strokeWidth={6} fill="none" />
  </g>
);
