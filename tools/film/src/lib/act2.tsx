import React from "react";
import { AbsoluteFill } from "remotion";
import { MEM, SE, rt, AGE, AV, FIRST, INK, KEY, KW, N, POR, S, VER, band, clamp, ease, hash, kick, lerp, loud, ph, spr, RANK_IN_VER } from "./data";
import { Form, SHELF_COL, SHELF_LABEL, SHELF_X, STEP_X, arrow, build, galaxy, pie, portrait, portraitPart, record, rgb, rings, shelves, stairs, terrain, triRecord } from "./forms";
import { CamKey, Seg } from "./Cloud";
import { Chip, Sheet, Sticker, Wipe } from "./collage";
import { Tonearm, Vinyl3D } from "./Vinyl3D";

const PX = 1080 / (2 * 12 * Math.tan((22.5 * Math.PI) / 180));
const sx = (x: number) => 960 + x * PX;
const sy = (y: number) => 540 - y * PX;

/* ---------------------------------------------------------------- моды */
/* кивок: всё выше шеи слегка кивает в такт голосу */
const nod = (h: number, y0: number, amp: (t: number) => number) => (t: number, p: Float32Array) => {
  const pivot = y0 + h / 2 - 0.39 * h;
  for (let i = 0; i < N; i++) {
    const y = p[i * 3 + 1];
    const w = clamp((y - (pivot - 0.2)) / 0.5);
    if (w <= 0) continue;
    const a = amp(t - (y - pivot) * 0.02) * w;
    const dy = y - pivot;
    p[i * 3 + 1] = pivot + dy * Math.cos(a);
    p[i * 3 + 2] += dy * Math.sin(a);
  }
};
/* пульс под бас */
const pulse = (k = 0.35) => (t: number, _p: Float32Array, _c: Float32Array, s: Float32Array) => {
  const m = 1 + kick(t) * k;
  for (let i = 0; i < N; i++) s[i] *= m;
};
/* память: блёклая и рассыпчатая, на припеве — в полную силу */
const memory = (t: number, p: Float32Array, c: Float32Array, s: Float32Array) => {
  const weak = ph(t, SX20 - 0.2, SX20 + 1.5) * (1 - ease(ph(t, MEM - 0.05, MEM + 0.25)));
  const boom = ph(t, MEM - 0.05, MEM + 0.1);
  const k = kick(t) * boom;
  for (let i = 0; i < N; i++) {
    const lum = (c[i * 3] + c[i * 3 + 1] + c[i * 3 + 2]) / 3;
    const g = weak * 0.8;
    c[i * 3] = (c[i * 3] + (lum - c[i * 3]) * g) * (1 - weak * 0.45);
    c[i * 3 + 1] = (c[i * 3 + 1] + (lum - c[i * 3 + 1]) * g) * (1 - weak * 0.45);
    c[i * 3 + 2] = (c[i * 3 + 2] + (lum - c[i * 3 + 2]) * g) * (1 - weak * 0.4);
    s[i] *= 1 - weak * 0.35 + k * 0.45;
    p[i * 3] += Math.sin(t * 1.3 + i) * 0.12 * weak + (hash(i) - 0.5) * k * 0.25;
    p[i * 3 + 1] += Math.cos(t * 1.1 + i * 0.7) * 0.12 * weak + (hash(i + 3) - 0.5) * k * 0.25;
    p[i * 3 + 2] += (hash(i + 9) - 0.2) * k * 0.8;
  }
};

/* ---------------------------------------------------------------- формы-сцены */
/* зеркало: слева в раме отражение — подросток, справа — нынешний */
const mirrorPair = (() => {
  let f: Form | null = null;
  return () =>
    f ||
    (f = (() => {
      const A = POR.now, B = POR.r1;
      const h = 7.4;
      return build((i, q) => {
        const left = i % 2 === 1;
        const P0 = left ? B : A;
        const j = Math.floor(i / 2) * 2 + (left ? 1 : 0);
        const jj = Math.min(P0.n - 1, j);
        let r = P0.rgb[jj * 3], g = P0.rgb[jj * 3 + 1], b = P0.rgb[jj * 3 + 2];
        const X = P0.xy[jj * 2] * (left ? -1 : 1), Y = P0.xy[jj * 2 + 1];
        q.x = (left ? -2.85 : 2.85) + (X / 1000) * h;
        q.y = -0.4 + h / 2 - (Y / 1000) * h;
        q.z = left ? -0.6 : 0;
        if (left) {
          const lum = (r + g + b) / 3;
          r = r * 0.75 + lum * 0.1 + 0.08; g = g * 0.75 + lum * 0.1 + 0.1; b = b * 0.75 + lum * 0.1 + 0.16;
        }
        q.r = r; q.g = g; q.b = b;
        q.s = 0.041 * (h / 8.6) * 1.32;
      });
    })());
})();

/* один трек из полки 16–18 — крупная бусина; остальные ушли вглубь */
const I0 = FIRST.findIndex((g, i) => g === 1 && hash(i) > 0.5);
const oneTrack = (t: number): Form => {
  const fly = ease(ph(t, S[18] + 0.15, S[18] + 0.75));
  const bounce = spr(t, S[18] + 0.8, 10, 4.5);
  const x = lerp(0, 5.4, fly) - (t > S[18] + 0.8 ? bounce * 5.4 : 0);
  const y = 0.3 + (t > S[18] + 0.8 ? Math.sin(Math.min(1, bounce) * Math.PI) * 2.2 : Math.sin(fly * Math.PI) * 1.5);
  return build((i, q) => {
    if (i === I0) {
      q.x = x; q.y = y; q.z = 1.5; q.s = 0.7;
      q.r = 1; q.g = 0.71; q.b = 0.18;
      return;
    }
    const a = hash(i) * Math.PI * 2, R = 5 + hash(i + 1) * 9;
    q.x = Math.cos(a) * R; q.y = Math.sin(a) * R * 0.55; q.z = -9 - hash(i + 2) * 6;
    const c = rgb(AGE[VER[i]]);
    q.r = c[0] * 0.5; q.g = c[1] * 0.5; q.b = c[2] * 0.5;
    q.s = 0.05;
  });
};

/* навестить себя: внутреннее кольцо стягивается ореолом вокруг центра */
const visit = (t: number): Form => {
  const base = rings({ grow: 5, spin: t * 0.25, hl: -1 });
  const u = ease(ph(t, S[30] + 0.4, S[30] + 2.0));
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 0) continue;
    const a = (RANK_IN_VER[i] / 104) * Math.PI * 2 + t * 0.6;
    const tx = Math.cos(a) * 1.05, ty = -0.1 + Math.sin(a) * 1.05;
    base.p[i * 3] = lerp(base.p[i * 3], tx, u);
    base.p[i * 3 + 1] = lerp(base.p[i * 3 + 1], ty, u);
    base.p[i * 3 + 2] = lerp(base.p[i * 3 + 2], 0.4, u);
    base.s[i] = lerp(base.s[i], 0.06, u);
  }
  return base;
};

/* моменты выпавших фраз: память блёкнет к концу «не помню», вспыхивает на вставке */
const SX20 = SE[19] - 0.6;
const SX21 = MEM - 0.6;
const misfit = (i: number) => KEY[i] === 4 || hash(i * 13.7) < 0.055;
const STEP_TOP = [0, 1, 2, 3, 4].map((k) => -3.4 + k * 0.85 + Math.ceil(VER.filter((v) => v === k).length / 16) * 0.024 + 0.15);

export const SEGS2: Seg[] = [
  /* 4: соната, подросток, зеркало */
  { t: S[8] - 0.35, f: () => portrait("now", { y: -0.3 }), d: 1.4, order: "top", swirl: 1.6, mod: nod(8.6, -0.3, (t) => Math.sin(t * 6.5) * 0.09 * Math.min(1, loud(t) * 2)) },
  { t: rt(33.35), f: (t) => triRecord(t, { y: -1.0 }), d: 1.6, order: "center", swirl: 1.8 },
  { t: S[10] - 0.25, f: () => mirrorPair(), d: 1.5, order: "rand", swirl: 1.5 },
  /* 5: ландшафт звука → тишина */
  { t: S[11] - 0.3, f: (t) => terrain(t, band, { calm: ease(ph(t, rt(61.2), rt(63.4))) }), d: 1.9, order: "left", swirl: 1.4 },
  /* 6: полки плейлистов, потом танец в паузе */
  { t: S[15] - 0.3, f: () => shelves(), d: 1.6, order: "bottom", swirl: 1.2 },
  { t: S[16] - 0.1, f: () => shelves(() => 1, { dim: (g) => (g === 0 || g === 1 || g === 3 ? 1 : 0.3) }), d: 0.6, order: "rand", swirl: 0.1 },
  { t: rt(71.0), f: (t) => shelves((g) => 0.75 + band(t, [1, 3, 5, 6, 8, 10][g]) * 0.8 + kick(t) * 0.15), d: 0.8, order: "rand", swirl: 0.2 },
  /* 7: один трек, корзина, память, припев */
  { t: S[17] - 0.3, f: oneTrack, d: 1.3, order: "rand", swirl: 1.2 },
  { t: S[19] - 0.05, f: () => portrait("r2", { y: -0.3, dark: true }), d: 1.6, order: "center", swirl: 2.0, mod: memory },
  /* 8: биография: лестница, пирог, стрела */
  { t: S[20] - 0.3, f: () => stairs(), d: 1.6, order: "bottom", swirl: 1.3 },
  { t: S[21] + 1.4, f: (t) => stairs((i) => (KEY[i] === 2 ? ease(ph(t, rt(101.0), rt(101.6))) : KEY[i] === 3 ? ease(ph(t, KW.bach - 0.2, KW.bach + 0.4)) : AV[i] ? ease(ph(t, KW.avant - 0.2, KW.avant + 0.4)) : 0)), d: 0.4, order: "rand", swirl: 0 },
  { t: S[22] - 0.2, f: (t) => pie({ spin: t * 0.18, split: lerp(0, 0.5, ph(t, 110, 112)) }), d: 1.6, order: "rand", swirl: 1.6 },
  { t: S[23] - 0.25, f: () => arrow(), d: 1.4, order: "left", swirl: 1.0 },
  /* 9: неположенные вещи ломают стрелу */
  { t: S[24] - 0.1, f: (t) => arrow({ t, out: (i) => (KEY[i] === 4 ? ease(ph(t, S[24] + 0.6, S[24] + 1.6)) : 0) }), d: 0.3, order: "rand", swirl: 0, mod: (t, _p, c, s) => { for (let i = 0; i < N; i++) if (KEY[i] === 4) { s[i] = 0.26 + kick(t) * 0.08; c[i * 3] = 0.6; c[i * 3 + 1] = 0.38; c[i * 3 + 2] = 1; } } },
  { t: S[26] - 0.05, f: (t) => arrow({ t, out: (i) => (misfit(i) ? ease(ph(t, S[26] + hash(i) * 2.5, S[26] + 0.8 + hash(i) * 2.5)) * (1 - 0.35 * ph(t, S[27], S[27] + 1.2)) : 0), wobble: 0.12 * ph(t, S[26] + 2, S[26] + 4) }), d: 0.3, order: "rand", swirl: 0, mod: (t, _p, c, s) => { for (let i = 0; i < N; i++) if (KEY[i] === 4) { s[i] = 0.26; c[i * 3] = 0.6; c[i * 3 + 1] = 0.38; c[i * 3 + 2] = 1; } else if (misfit(i)) s[i] *= 1.8; } },
  /* 10: годовые кольца → пластинка; навестить себя */
  { t: S[28] - 0.3, f: (t) => rings({ grow: lerp(0.2, 5, ph(t, S[28], S[28] + 3.4)), spin: t * 0.25 }), d: 1.6, order: "center", swirl: 1.5 },
  { t: S[29] - 0.1, f: (t) => rings({ grow: 5, spin: t * 0.25, hl: t < S[29] + 3.6 ? 0 : -1 }), d: 0.5, order: "rand", swirl: 0 },
  { t: S[30] - 0.1, f: visit, d: 0.4, order: "rand", swirl: 0 },
  /* 11: вдвоём; припев; финал */
  { t: S[32] - 0.3, f: () => portraitPart("duo", () => true, { h: 8.4, y: -0.4, dark: true, s: 0.05 }), d: 1.7, order: "top", swirl: 1.8 },
  { t: S[35] - 0.05, f: (t) => galaxy(t), d: 0.9, order: "center", swirl: 2.4, mod: pulse(0.6) },
  { t: rt(159.6), f: (t) => record({ tilt: 1.02, y: -0.2, spin: t * 1.3, r0: 0.9, r1: 4.7, s: 0.055 }), d: 2.0, order: "out", swirl: 2.0, mod: (t, p, c, s) => { const k = kick(t); for (let i = 0; i < N; i++) { s[i] *= 1 + k * 0.5; p[i * 3 + 1] += Math.sin(t * 8 + p[i * 3] * 0.8) * 0.06 * k; } } },
];


/* камера: облёт полок, полёт над ландшафтом, лестница сбоку */
const orbit = (t0: number, t1: number, r: number, y: number, look: [number, number, number], a0 = -0.5, a1 = 0.5): CamKey[] => {
  const out: CamKey[] = [];
  for (let k = 0; k <= 8; k++) {
    const u = k / 8, a = a0 + (a1 - a0) * u;
    out.push([t0 + (t1 - t0) * u, [Math.sin(a) * r, y, Math.cos(a) * r], look]);
  }
  return out;
};
export const CAM2: CamKey[] = [
  [S[8] - 0.4, [0, 0.2, 12], [0, 0, 0]],
  [33.3, [0, 0.4, 12.4], [0, -0.1, 0]],
  [35.0, [0, 2.6, 11.4], [0, -0.4, 0]],
  [S[10] - 0.3, [0, 1.4, 12], [0, -0.2, 0]],
  [S[10] + 0.6, [0, 0, 12], [0, 0, 0]],
  [S[11] - 0.3, [0, 0, 12], [0, 0, 0]],
  [S[11] + 1.6, [-3, 1.4, 8.5], [0, -1.2, 0]],
  [S[13], [3, 2.2, 8.2], [0, -1.0, 0]],
  [61, [1, 3.4, 9.5], [0, -1.2, 0]],
  [S[15] - 0.4, [0, 1.6, 11], [0, -1.2, 0]],
  [S[15] + 1.2, [0, 1.8, 13.5], [0, -0.6, 0]],
  [70.8, [0, 1.8, 13.5], [0, -0.6, 0]],
  ...orbit(rt(71.4), rt(77.6), 12.5, 2.2, [0, -1.3, 0], -0.2, Math.PI * 0.75),
  [S[17] - 0.2, [0, 0, 12], [0, 0, 0]],
  [S[19] + 0.4, [0, 0, 12], [0, 0, 0]],
  [SX21, [0, 0.1, 11.0], [0, 0, 0]],
  [S[20] - 0.4, [0, 0.4, 10.4], [0, 0, 0]],
  [S[20] + 1.0, [-4, 2.2, 13], [0, -0.6, 0]],
  [S[22] - 0.3, [4, 2.0, 13], [0, -0.4, 0]],
  [S[22] + 1.2, [0, 6.5, 9.5], [0, -0.6, 0]],
  [S[23] - 0.3, [0, 4.5, 11], [0, -0.4, 0]],
  [S[23] + 0.9, [0, 0.3, 12.6], [0, 0, 0]],
  [S[27], [0, 0.3, 13.2], [0, 0, 0]],
  [S[28] - 0.3, [0, 0.4, 12], [0, 0, 0]],
  [S[30] - 0.1, [0, 1.2, 11.5], [0, -0.2, 0]],
  [S[30] + 2.6, [0, 0.4, 4.6], [0, 0, 0]],
  [S[32] - 0.4, [0, 0.4, 5.2], [0, 0, 0]],
  [S[32] + 0.8, [0, 0.2, 12], [0, 0, 0]],
  [S[35] - 0.1, [0, 0.2, 12.4], [0, 0, 0]],
  ...orbit(rt(159.6), rt(169.8), 12.5, 2.4, [0, -0.3, 0], -0.4, 0.6),
];

/* ---------------------------------------------------------------- 3D-добавки */
export const Stage2: React.FC<{ t: number }> = ({ t }) => {
  const drop = ease(ph(t, S[33] - 0.1, S[33] + 0.6));
  const recOn = t > S[33] - 0.15 && t < S[35] + 0.3;
  return (
    <>
      {recOn ? <Vinyl3D pos={[4.2, lerp(6, -2.7, drop), 2.2]} rot={[0.55, 0, -0.1]} scale={2.1} spin={t * 3.2 * ph(t, S[33] + 0.9, S[33] + 1.3)} label="#ff5a3c" /> : null}
      {recOn ? <Tonearm pos={[6.6, -2.3, 1.8]} a={lerp(-0.2, 0.55, ease(ph(t, S[33] + 0.3, S[33] + 0.8)))} lift={1 - ph(t, S[33] + 0.8, S[33] + 1.0)} scale={1.5} /> : null}
    </>
  );
};

/* ---------------------------------------------------------------- коллаж */
const Pin: React.FC<{ x: number; y: number; t: number; t0: number; text: string; bg: string; font?: number; size?: number; rot?: number; fall?: number; seed?: number; line?: [number, number] }> = ({ x, y, t, t0, text, bg, font = 0, size = 40, rot = 0, fall, seed = 1, line }) => {
  const u = spr(t, t0, 12, 6);
  if (u <= 0.001) return null;
  const f = fall != null && t > fall ? t - fall : 0;
  const dy = f * f * 900, dr = f * 160 * (hash(seed) - 0.5);
  if (dy > 1400) return null;
  return (
    <>
      {line && f === 0 ? (
        <svg style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "visible", opacity: u }}>
          <path d={`M${x},${y} L${line[0]},${line[1]}`} stroke="#fff6e0" strokeWidth={3} strokeDasharray="6 6" />
          <circle cx={line[0]} cy={line[1]} r={7} fill="#fff6e0" />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: x, top: y + dy, transform: `translate(-50%,-50%) rotate(${rot + dr}deg)` }}>
        <Chip text={text} size={size} bg={bg} fg={INK} font={font} rot={0} seed={seed} u={u} />
      </div>
    </>
  );
};

const Phone: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const u = spr(t, t0, 10, 5);
  if (u <= 0.001) return null;
  const buzz = Math.sin(t * 80) * 4 * (t < t0 + 2.8 ? 1 : 0);
  return (
    <svg viewBox="-110 -200 220 400" style={{ position: "absolute", left: 1380 + buzz, top: 230, width: 280, height: 500, transform: `rotate(${10 + Math.sin(t * 3) * 3}deg) scale(${u})`, filter: "drop-shadow(10px 12px 0 rgba(20,14,8,.3))" }}>
      <rect x={-100} y={-195} width={200} height={390} rx={34} fill="#fffaf0" />
      <rect x={-90} y={-185} width={180} height={370} rx={28} fill="#17161c" />
      <rect x={-80} y={-160} width={160} height={320} rx={14} fill="#26203a" />
      {Array.from({ length: 12 }).map((_, i) => {
        const hh = 20 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 90 * (0.4 + loud(t));
        return <rect key={i} x={-70 + i * 12} y={30 - hh / 2} width={8} height={hh} rx={4} fill={i % 2 ? "#ff3d7f" : "#3ee6f0"} />;
      })}
      <circle cx={0} cy={-120} r={22} fill="#ff3d7f" />
      <path d="M-6,-132 L-6,-112 Q-6,-104 -14,-106 M-6,-132 Q2,-122 10,-126" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
    </svg>
  );
};

/* надпись-звук из трека TikTok: буквы качаются волной (на экране, не в титрах) */
const Wobble: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  if (t < t0 - 0.01 || t > t1 + 0.3) return null;
  const text = "возьми телефоон деткаа";
  const out = 1 - ph(t, t1, t1 + 0.3);
  const cols = ["#ff3d7f", "#3ee6f0", "#ffe14d"];
  return (
    <div style={{ position: "absolute", left: 760, top: 250, transform: "translate(-50%,-50%) rotate(-5deg)", whiteSpace: "nowrap", opacity: out }}>
      {[...text].map((ch, i) => (
        <span key={i} style={{ display: "inline-block", font: '700 92px/1 "Amatic SC"', color: cols[i % 3], WebkitTextStroke: `6px ${INK}`, paintOrder: "stroke fill", transform: `translateY(${Math.sin(t * 9 + i * 0.6) * 12}px) scale(${spr(t, t0 + i * 0.03, 14, 6)})`, minWidth: ch === " " ? 26 : undefined }}>
          {ch}
        </span>
      ))}
    </div>
  );
};

const Knob: React.FC<{ v: number }> = ({ v }) => {
  const ang = -135 + v * 24.5;
  return (
    <svg viewBox="-260 -260 520 520" style={{ position: "absolute", left: 1330, top: 300, width: 480, height: 480, filter: "drop-shadow(10px 12px 0 rgba(20,14,8,.3))" }}>
      <rect x={-240} y={-240} width={480} height={480} rx={30} fill="#e8dcc6" />
      {Array.from({ length: 12 }).map((_, k) => {
        const a = ((-135 + k * 24.5 - 90) * Math.PI) / 180;
        return (
          <text key={k} x={Math.cos(a) * 195} y={Math.sin(a) * 195 + 14} textAnchor="middle" fontFamily="Unbounded" fontWeight={800} fontSize={k === 11 ? 50 : 32} fill={k === 11 ? "#ff3d2e" : INK}>
            {k}
          </text>
        );
      })}
      <circle r={140} fill="#2b2b31" />
      <g transform={`rotate(${ang})`}>
        <circle r={120} fill="#3b3b44" />
        <rect x={-9} y={-118} width={18} height={70} rx={9} fill="#ffe14d" />
      </g>
    </svg>
  );
};

export const Back2: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Wipe t={t} t0={S[8] - 0.45} color="#f1e7d6" from="left" seed={31} />
    <Wipe t={t} t0={S[10] - 0.35} color="#e4dccf" from="top" seed={32} />
    <Wipe t={t} t0={S[11] - 0.4} color="#141a33" from="bottom" seed={33}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 70%, rgba(95,141,255,.25), transparent 60%)" }} />
    </Wipe>
    <Wipe t={t} t0={S[15] - 0.4} color="#d9b98c" from="right" seed={34} />
    <Wipe t={t} t0={rt(70.8)} color="#221c2c" from="bottom" seed={35}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 60%, rgba(255,90,60,${0.18 + kick(t) * 0.12}), transparent 60%)` }} />
    </Wipe>
    <Wipe t={t} t0={S[17] - 0.4} color="#2a1f2d" from="left" seed={36} />
    {/* припев: вспышка янтарём */}
    {t > MEM - 0.1 && t < S[20] ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,181,46,${0.55 * (1 - ph(t, MEM, MEM + 1.2)) + 0.15 + kick(t) * 0.1}), transparent 70%)` }} /> : null}
    <Wipe t={t} t0={S[20] - 0.4} color="#f3ead8" from="right" seed={37} />
    <Wipe t={t} t0={S[28] - 0.4} color="#c9a476" from="bottom" seed={38} />
    <Wipe t={t} t0={S[32] - 0.4} color="#2b2340" from="top" seed={39}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,214,150,.18), transparent 65%)" }} />
    </Wipe>
    {t > S[35] - 0.2 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(199,125,255,${0.2 + kick(t) * 0.25}), transparent 65%)` }} /> : null}
  </>
);

const TAGS1: [string, number, number, number, number][] = [
  ["тема", 520, 300, rt(48.3), 0],
  ["бас", 1450, 330, rt(49.2), 2],
  ["форма", 800, 220, rt(50.3), 1],
  ["модуляция", 1250, 200, rt(51.4), 3],
  ["темп", 380, 420, rt(52.4), 2],
  ["кода", 1600, 470, rt(53.3), 1],
];
const TAGS2: [string, number, number, number, number][] = [
  ["я заметил", 960, 140, rt(55.0), 0],
  ["и это", 1700, 250, rt(55.6), 4],
  ["о, вот здесь", 260, 230, rt(56.1), 1],
  ["rubato!", 1130, 390, rt(56.6), 3],
  ["знаю-знаю", 640, 470, rt(57.1), 2],
  ["а тут — Бах?", 1480, 600, rt(57.6), 1],
  ["и вот это", 330, 610, rt(58.1), 4],
  ["заметил, что заметил", 960, 300, rt(58.5), 0],
];
const LECTURE: [string, number, number][] = [
  ["Бах", 300, 220],
  ["Шостакович", 1500, 180],
  ["Райх", 520, 420],
  ["Пярт", 1640, 400],
  ["Лигети", 260, 620],
  ["Шнитке", 1420, 620],
  ["Десятников", 760, 160],
  ["Губайдулина", 1160, 300],
];

export const Front2: React.FC<{ t: number }> = ({ t }) => {
  return (
    <>
      {/* 4: подросток заглядывает из-за края кадра */}
      {t > S[9] && t < S[10] ? (
        <div style={{ position: "absolute", left: lerp(-200, 120, ease(ph(t, S[9] + 0.1, S[9] + 0.8))) - ease(ph(t, rt(41.2), rt(42.0))) * 160, top: 1080 }}>
          <Sticker src="r1-peek" x={0} y={0} h={640} t={t} t0={S[9] + 0.1} sway={0.5} />
        </div>
      ) : null}
      {t > S[9] + 1.2 && t < S[10] ? <Pin x={420} y={330} t={t} t0={S[9] + 1.4} text="?!" bg="#ff5a3c" size={80} rot={-8} seed={70} /> : null}
      {/* 4: рама зеркала */}
      {t > S[10] - 0.1 && t < S[11] ? (
        <svg style={{ position: "absolute", left: sx(-2.85) - 260, top: sy(-0.4) - 470, width: 520, height: 940, opacity: ease(ph(t, S[10], S[10] + 0.6)), filter: "drop-shadow(10px 12px 0 rgba(20,14,8,.25))" }} viewBox="0 0 520 940">
          <defs>
            <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,.35)" />
              <stop offset="0.5" stopColor="rgba(180,200,230,.08)" />
              <stop offset="1" stopColor="rgba(255,255,255,.25)" />
            </linearGradient>
          </defs>
          <ellipse cx={260} cy={470} rx={230} ry={440} fill="url(#glass)" />
          <ellipse cx={260} cy={470} rx={238} ry={448} fill="none" stroke="#c69a4c" strokeWidth={26} />
          <ellipse cx={260} cy={470} rx={252} ry={462} fill="none" stroke="#8a6427" strokeWidth={6} />
        </svg>
      ) : null}
      {/* 5: бирки на ландшафте, потом лишние, потом осыпаются */}
      {t > 48 && t < 64 ? TAGS1.map(([s, x, y, t0, f], j) => <Pin key={j} x={x} y={y} t={t} t0={t0} text={s} bg={["#f5eee0", "#ffb52e", "#c77dff", "#34d6b8"][j % 4]} font={f} size={42} rot={(hash(j) - 0.5) * 10} fall={rt(61.0) + j * 0.12} seed={80 + j} line={[x + 40, y + 160]} />) : null}
      {t > rt(54.8) && t < 64 ? TAGS2.map(([s, x, y, t0, f], j) => <Pin key={j} x={x} y={y} t={t} t0={t0} text={s} bg={["#fff8ea", "#ff8e6e", "#f3d36a", "#9fe6d6"][j % 4]} font={f} size={j === 7 ? 56 : 40} rot={(hash(j + 9) - 0.5) * 14} fall={rt(60.6) + j * 0.1} seed={90 + j} />) : null}
      <Sticker src="su-point" x={300} y={1100} h={560} t={t} t0={S[13] + 0.2} t1={rt(61.4)} rot={4} sway={2} />
      <Sticker src="now-listen" x={960} y={1110} h={620} t={t} t0={rt(62.4)} t1={S[15] - 0.3} sway={0.4} />
      {/* 6: подписи полок */}
      {t > S[15] && t < S[17] - 0.3
        ? SHELF_X.map((x, g) => (
            <div key={g} style={{ position: "absolute", left: sx(x * (12 / 13.5)), top: t < rt(70.8) ? 905 : 930, transform: "translate(-50%,0)", opacity: t < rt(71.2) ? 1 : 1 - ph(t, rt(71.2), rt(71.8)) }}>
              <Chip text={SHELF_LABEL[g]} size={g === 0 || g === 1 || g === 3 ? 52 : 40} bg={SHELF_COL[g]} fg={INK} font={g % 5} rot={(hash(g + 4) - 0.5) * 9} seed={100 + g} u={spr(t, S[15] + 0.6 + g * 0.12, 12, 6)} />
            </div>
          ))
        : null}
      {/* 7: полоса прогресса трека, корзина */}
      {t > S[17] && t < S[19] ? (
        <div style={{ position: "absolute", left: 610, top: 760, width: 700, opacity: 1 - ph(t, S[18], S[18] + 0.3) }}>
          <Sheet x={0} y={0} w={700} h={90} color="#f5eee0" seed={110}>
            <div style={{ position: "absolute", left: 30, top: 38, width: 640, height: 14, background: "#d8cbb4", borderRadius: 7 }} />
            <div style={{ position: "absolute", left: 30, top: 38, width: 640 * Math.min(0.32, ph(t, S[17] + 0.3, S[17] + 1.6) * 0.32) + (t > rt(79.6) ? ph(t, rt(79.6), rt(80.2)) * 640 * 0.68 : 0), height: 14, background: "#ffb52e", borderRadius: 7 }} />
          </Sheet>
          {t > rt(79.4) ? <div style={{ position: "absolute", left: 600, top: -70 }}><Chip text="▸▸" size={56} bg="#ffb52e" fg={INK} font={3} rot={-6} seed={111} u={spr(t, rt(79.4), 12, 6)} /></div> : null}
        </div>
      ) : null}
      {t > S[18] - 0.2 && t < S[19] + 0.4 ? (
        <svg viewBox="-130 -150 260 300" style={{ position: "absolute", left: sx(5.4) - 120, top: sy(0.3) - 40, width: 240, height: 280, transform: `scale(${spr(t, S[18] - 0.2, 11, 6) * (1 - ph(t, S[19], S[19] + 0.35))}) rotate(${t > S[18] + 0.75 && t < S[18] + 1.1 ? Math.sin(t * 60) * 6 : 0}deg)`, filter: "drop-shadow(8px 10px 0 rgba(0,0,0,.35))" }}>
          <path d="M-100,-90 L100,-90 L80,140 L-80,140Z" fill="#9fb0ad" />
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M${-60 + k * 40},-70 L${-50 + k * 33},120`} stroke="#6e7d7a" strokeWidth={8} />)}
          <rect x={-115} y={-125} width={230} height={38} rx={10} fill="#c9d6d3" />
        </svg>
      ) : null}
      {t > S[18] + 0.7 && t < S[19] ? <Pin x={sx(5.4)} y={sy(2.6)} t={t} t0={S[18] + 0.85} text="не-а" bg="#ff5a3c" size={64} rot={-10} seed={112} /> : null}
      <Sticker src="r2-shout" x={1560} y={1100} h={600} t={t} t0={MEM + 0.05} t1={S[20] - 0.3} rot={-4} sway={2.5} bob={kick(t) * 14} />
      {/* 8: версии на своих ступенях */}
      {t > S[20] && t < S[22] - 0.2
        ? (["r1", "r2", "su", "sp", "now"] as const).map((v, k) => (
            <Sticker key={v} src={v} x={sx(STEP_X[k] * 0.86) + (k - 2) * 18} y={sy(STEP_TOP[k] * 0.86) + 30} h={250} t={t} t0={S[20] + 0.9 + k * 0.22} t1={S[22] - 0.4} sway={0.8} seed={k} />
          ))
        : null}
      {t > 101 && t < S[22] ? <Pin x={sx(-6 * 0.86)} y={sy(-0.6)} t={t} t0={rt(101.1)} text="Nickelback" bg="#ffb52e" size={40} rot={-6} seed={120} /> : null}
      {t > KW.bach - 0.2 && t < S[22] ? <Pin x={sx(3 * 0.86) - 40} y={150} t={t} t0={KW.bach - 0.1} text="Бах" bg="#ffd257" size={52} rot={5} seed={121} /> : null}
      {t > KW.avant - 0.2 && t < S[22] ? <Pin x={sx(6 * 0.86) - 60} y={110} t={t} t0={KW.avant - 0.1} text="авангард" bg="#34d6b8" size={44} rot={-4} seed={122} /> : null}
      {t > rt(111.5) && t < S[23] ? <Pin x={1480} y={300} t={t} t0={KW.half} text="55%" bg="#c77dff" size={130} rot={-6} seed={123} /> : null}
      {t > rt(111.8) && t < S[23] ? <Pin x={1490} y={430} t={t} t0={KW.half + 0.3} text="академической" bg="#f5eee0" size={40} rot={3} seed={124} /> : null}
      {t > S[23] + 1.0 && t < S[24] + 0.6 ? (
        <div style={{ position: "absolute", left: 1350, top: 250, transform: `rotate(-12deg) scale(${lerp(2.2, 1, ease(ph(t, S[23] + 1.0, S[23] + 1.25)))})`, opacity: ph(t, S[23] + 1.0, S[23] + 1.1) * (1 - ph(t, S[24] + 0.3, S[24] + 0.6)), border: "8px solid #e2483d", color: "#e2483d", font: '800 64px/1 "Unbounded"', padding: "14px 26px", borderRadius: 12, mixBlendMode: "multiply" }}>ОБРАЗЦОВО</div>
      ) : null}
      {/* 9: телефон и звук из TikTok */}
      {t > S[25] - 0.1 && t < S[26] + 1.6 ? <Phone t={t} t0={S[25]} /> : null}
      <Wobble t={t} t0={S[25] + 0.15} t1={S[26] + 1.2} />
      {/* 10: «ошибка» — перечёркнута и отлетает */}
      {t > S[29] + 0.6 && t < S[30] ? (
        <div style={{ position: "absolute", left: 960, top: 540 - lerp(0, 600, ease(ph(t, rt(139.0), rt(139.8)))), transform: `translate(-50%,-50%) rotate(${-8 + ph(t, 139, rt(139.8)) * 40}deg)`, opacity: 1 - ph(t, rt(139.5), rt(139.9)) }}>
          <Chip text="ошибка" size={84} bg="#f5eee0" fg={INK} font={1} rot={0} seed={130} u={spr(t, S[29] + 0.7, 12, 6)} />
          <svg style={{ position: "absolute", left: -20, top: 10, width: 400, height: 100, overflow: "visible" }}>
            <path d={`M0,60 L${360 * ease(ph(t, rt(138.0), rt(138.5)))},20`} stroke="#e2483d" strokeWidth={14} strokeLinecap="round" />
          </svg>
        </div>
      ) : null}
      <Sticker src="r1" x={960} y={sy(-0.1) + 250} h={500} t={t} t0={S[30] + 2.0} t1={S[32] - 0.3} rot={3} sway={3} />
      {/* 11: лекция — имена вылетают, припев их сдувает */}
      {t > S[34] && t < S[35] + 1.2
        ? LECTURE.map(([s, x, y], j) => {
            const blow = ph(t, S[35], S[35] + 0.9);
            return (
              <div key={j} style={{ position: "absolute", left: x + (x - 960) * blow * 1.8, top: y - blow * 300 * hash(j), transform: `translate(-50%,-50%) rotate(${(hash(j) - 0.5) * 12 + blow * 90}deg)`, opacity: 1 - blow }}>
                <Chip text={s} size={44} bg={["#f5eee0", "#c77dff", "#ffb52e", "#34d6b8"][j % 4]} fg={INK} font={j % 5} rot={0} seed={140 + j} u={spr(t, S[34] + 0.25 + j * 0.3, 12, 6)} />
              </div>
            );
          })
        : null}
      {t > S[36] - 0.2 && t < rt(160.4) ? <div style={{ opacity: 1 - ph(t, rt(159.9), rt(160.4)), transform: `scale(${spr(t, S[36] - 0.2, 12, 6)})`, transformOrigin: "1570px 540px", position: "absolute", inset: 0 }}><Knob v={lerp(6, 11, ease(ph(t, S[36] + 0.4, KW.louder + 0.3)))} /></div> : null}
      {/* финальный титр */}
      {t > rt(164.2) ? (
        <div style={{ position: "absolute", left: 960, top: 470, transform: "translate(-50%,-50%)", textAlign: "center", opacity: 1 - ph(t, rt(168.8), rt(169.6)) }}>
          <div>
            {["ОДНА", "ВЕЩЬ"].map((w, j) => (
              <Chip key={j} text={w} size={150} bg={j ? "#ff5a3c" : "#f5eee0"} fg={INK} font={0} rot={j ? 3 : -4} seed={150 + j} u={spr(t, rt(164.4) + j * 0.25, 11, 6)} />
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Chip text="моя музыкальная эволюция" size={54} bg="#c77dff" fg={INK} font={2} rot={-2} seed={152} u={spr(t, rt(165.2), 11, 6)} />
          </div>
        </div>
      ) : null}
      {t > rt(168.9) ? <AbsoluteFill style={{ background: "#efe7da", opacity: ph(t, rt(168.9), rt(169.8)) }} /> : null}
    </>
  );
};


