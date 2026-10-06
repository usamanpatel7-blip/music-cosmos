import React from "react";
import { Img, interpolate, spring, staticFile, Easing } from "remotion";
import TIMING from "../timing.json";
import ENV from "./env.json";
import ASSETS from "./assets.json";

/* Комикс-движок фильма. Всё — функции времени фильма t (секунды):
   S[i] / SE[i] — начало и конец i-й фразы озвучки. */

export const FPS = 24;
export const END = 170;
export const S: number[] = TIMING.sent.map((s: { t0: number }) => s.t0);
export const SE: number[] = TIMING.sent.map((s: { t1: number }) => s.t1);
export const CUES: { t0: number; t1: number; s: string }[] = TIMING.cues;

export const INK = "#16161c";
export const PAPER = "#f2ead8";
export const C = {
  red: "#e2483d",
  yellow: "#ffd84a",
  cap: "#ffe76a",
  blue: "#3f6fd8",
  sky: "#8ec9f0",
  navy: "#1f2f5c",
  pink: "#f48fb1",
  green: "#5fbf7a",
  orange: "#f39a3d",
  teal: "#3fb7b0",
  lilac: "#b49ae8",
  cream: "#fff6e3",
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ph = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (u: number) => Easing.bezier(0.22, 1, 0.36, 1)(clamp(u));
export const inout = (u: number) => Easing.inOut(Easing.cubic)(clamp(u));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const pop = (t: number, t0: number, stiff = 170, damp = 12) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { stiffness: stiff, damping: damp, mass: 0.7 } });
export const move = (t: number, t0: number, t1: number, a: number, b: number) =>
  interpolate(t, [t0, t1], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 1, 0.68, 1) });

/* огибающая фонограммы: громкость и удар в низах (0…1.5) */
const RMS: number[] = ENV.rms;
const BASS: number[] = ENV.bass;
export const loud = (t: number) => RMS[clamp(Math.round(t * FPS), 0, RMS.length - 1)] || 0;
export const kick = (t: number) => {
  const i = clamp(Math.round(t * FPS), 0, BASS.length - 1);
  return Math.max(BASS[i] || 0, (BASS[i - 1] || 0) * 0.6);
};
/* сглаженная громкость голоса: «персонаж говорит» */
export const voice = (t: number) => {
  let s = 0;
  for (let k = -2; k <= 2; k++) s += loud(t + k / FPS);
  return clamp(s / 5);
};

/* ---------------------------------------------------------- фигуры
   Вырезанные персонажи из листов Higgsfield. Фигура ставится по нижней
   середине (x, y) и высоте h; голова отделяется по линии шеи и может
   кивать (nod), трястись (bang) и наклоняться отдельно от тела. */
type AssetKey = keyof typeof ASSETS;
const NECK: Record<string, number> = {
  "poses/now-explain.png": 0.3,
  "poses/now-listen.png": 0.3,
  "poses/r2-shout.png": 0.31,
  "poses/su-point.png": 0.33,
  "poses/sp-argue.png": 0.33,
  "poses/r1-peek.png": 0.32,
};
export type FigProps = {
  src: string; // cast/r1.png …
  x: number;
  y: number;
  h: number;
  t: number;
  flip?: boolean;
  rot?: number; // наклон всей фигуры, градусы
  head?: number; // наклон головы, градусы
  bob?: number; // подскок, px
  squash?: number; // сплющивание: 0 — нет
  breathe?: boolean;
  shadow?: boolean;
  opacity?: number;
  seed?: number;
  clip?: string; // CSS clip-path для обрезки (например, за краем панели)
  style?: React.CSSProperties;
  mis?: number; // сдвиг печатных красок (несовпадение приводки), px
  fade?: number; // выцветание старого оттиска, 0…1
  filter?: string; // свой фильтр вместо печатного (например, PENCIL)
};
/* синий карандаш эскиза («non-photo blue»): фигура как набросок под тушь */
export const PENCIL = "grayscale(1) contrast(2.4) brightness(1.55) sepia(1) hue-rotate(165deg) saturate(2.6)";
/* печатные фильтры: приводка красок и выцветание */
export const printFilter = (mis = 0, fade = 0) =>
  [
    `saturate(${0.94 - fade * 0.75}) contrast(${1.02 - fade * 0.32}) brightness(${1 + fade * 0.14}) sepia(${0.08 + fade * 0.45})`,
    mis > 0.05 ? `drop-shadow(${mis}px ${mis * 0.4}px 0 rgba(0,160,215,.55)) drop-shadow(${-mis}px ${-mis * 0.3}px 0 rgba(228,30,110,.5))` : "",
  ].join(" ");
export const Fig: React.FC<FigProps> = ({ src, x, y, h, t, flip, rot = 0, head = 0, bob = 0, squash = 0, breathe = true, shadow = true, opacity = 1, seed = 1, clip, style, mis = 0, fade = 0, filter }) => {
  const a = (ASSETS as Record<string, { w: number; h: number; cx: number }>)[src as AssetKey] || { w: 1, h: 1, cx: 0.5 };
  const w = (h * a.w) / a.h;
  const neck = NECK[src] ?? 0.155;
  const br = breathe ? Math.sin(t * 2.2 + seed) * 0.006 : 0;
  const sy = 1 - squash + br;
  const sx = 1 + squash * 0.6;
  const img = (part: "top" | "bottom" | "all") => (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: h,
        clipPath: part === "top" ? `inset(0 0 ${(1 - neck - 0.004) * 100}% 0)` : part === "bottom" ? `inset(${neck * 100}% 0 0 0)` : undefined,
      }}
    />
  );
  const split = Math.abs(head) > 0.05;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h - bob,
        width: w,
        height: h,
        opacity,
        transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * sx},${sy})`,
        transformOrigin: "50% 100%",
        clipPath: clip,
        filter: (filter ?? printFilter(mis, fade)) + (shadow ? " drop-shadow(8px 6px 0 rgba(22,22,28,.16))" : ""),
        ...style,
      }}
    >
      {split ? (
        <>
          {img("bottom")}
          <div style={{ position: "absolute", inset: 0, transform: `rotate(${head}deg)`, transformOrigin: `${a.cx * 100}% ${neck * 100}%` }}>{img("top")}</div>
        </>
      ) : (
        img("all")
      )}
    </div>
  );
};

/* ---------------------------------------------------------- страница
   Бумага с лёгким растром; панели — рамки с толстой линией. */
export const Page: React.FC<{ children: React.ReactNode; bg?: string; t?: number; shake?: number }> = ({ children, bg = PAPER, t = 0, shake = 0 }) => (
  <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: shake ? `translate(${Math.sin(t * 83) * shake}px,${Math.cos(t * 71) * shake}px)` : undefined,
      }}
    >
      {children}
    </div>
    <Paper />
  </div>
);

/* бумага поверх всего: зерно, волокна, пожелтевшие края */
export const Paper: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("paper.png")})`, backgroundSize: "512px 512px", opacity: 0.55 * strength, mixBlendMode: "multiply", pointerEvents: "none" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(120,80,30,.16) 100%)", pointerEvents: "none" }} />
  </>
);

/* растр Бен-Дэй: точки на цветном фоне */
export const dots = (color: string, dot = "rgba(255,255,255,.22)", size = 18) => ({
  backgroundColor: color,
  backgroundImage: `radial-gradient(${dot} ${size * 0.28}px, transparent ${size * 0.3}px)`,
  backgroundSize: `${size}px ${size}px`,
});

/* лучи «взрыва» из точки (conic-gradient) */
export const rays = (c1: string, c2: string, x = 50, y = 50, n = 18, rot = 0) => ({
  background: `repeating-conic-gradient(from ${rot}deg at ${x}% ${y}%, ${c1} 0deg ${180 / n}deg, ${c2} ${180 / n}deg ${360 / n}deg)`,
});

export type Box = { x: number; y: number; w: number; h: number };
/* Панель: появляется пружиной из точки (from), содержимое обрезано рамкой,
   внутри — своя «камера» (zoom, pan). over=true — персонаж может вылезать за рамку. */
export const Panel: React.FC<{
  t: number;
  t0: number;
  box: Box;
  children: React.ReactNode;
  bg?: React.CSSProperties;
  from?: "left" | "right" | "top" | "bottom" | "pop";
  zoom?: number;
  pan?: [number, number];
  rot?: number;
  border?: number;
  over?: React.ReactNode; // слой поверх рамки (выход за край)
  t1?: number;
}> = ({ t, t0, box, children, bg = { background: C.cream }, from = "pop", zoom = 1, pan = [0, 0], rot = 0, border = 9, over, t1 }) => {
  const u = pop(t, t0, 160, 15);
  if (u <= 0.001) return null;
  const out = t1 != null ? ease(ph(t, t1, t1 + 0.35)) : 0;
  const d = 1 - u;
  const tr =
    from === "left"
      ? `translateX(${-d * 1200}px)`
      : from === "right"
        ? `translateX(${d * 1200}px)`
        : from === "top"
          ? `translateY(${-d * 900}px)`
          : from === "bottom"
            ? `translateY(${d * 900}px)`
            : `scale(${0.6 + u * 0.4})`;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, transform: `${tr} rotate(${rot}deg) scale(${1 - out * 0.2})`, opacity: from === "pop" ? Math.min(1, u * 2) * (1 - out) : 1 - out }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...bg }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${pan[0]}px,${pan[1]}px) scale(${zoom})`, transformOrigin: "50% 50%" }}>{children}</div>
      </div>
      <div style={{ position: "absolute", inset: 0, border: `${border}px solid ${INK}`, pointerEvents: "none" }} />
      {over ? <div style={{ position: "absolute", inset: 0 }}>{over}</div> : null}
    </div>
  );
};

/* ---------------------------------------------------------- надписи */
export const SFX: React.FC<{ t: number; t0: number; t1?: number; x: number; y: number; text: string; size?: number; rot?: number; fill?: string; stroke?: string }> = ({ t, t0, t1, x, y, text, size = 140, rot = -8, fill = C.yellow, stroke = INK }) => {
  const u = pop(t, t0, 240, 10);
  const out = t1 != null ? 1 - ph(t, t1, t1 + 0.2) : 1;
  if (u <= 0.001 || out <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${u * out})`,
        font: `400 ${size}px/1 "Rubik Mono One"`,
        color: fill,
        WebkitTextStroke: `${Math.max(4, size * 0.06)}px ${stroke}`,
        paintOrder: "stroke fill",
        textShadow: `${size * 0.05}px ${size * 0.05}px 0 ${stroke}`,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </div>
  );
};

export const Hand: React.FC<{ t: number; t0: number; t1?: number; x: number; y: number; text: React.ReactNode; size?: number; rot?: number; color?: string }> = ({ t, t0, t1, x, y, text, size = 64, rot = -4, color = INK }) => {
  const u = pop(t, t0, 180, 13);
  const out = t1 != null ? 1 - ph(t, t1, t1 + 0.2) : 1;
  if (u <= 0.001 || out <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${u * out})`, font: `400 ${size}px/1.1 "Pangolin"`, color, whiteSpace: "nowrap", textAlign: "center" }}>{text}</div>;
};

/* пузырь реплики комикса */
export const Bubble: React.FC<{ t: number; t0: number; t1?: number; x: number; y: number; text: React.ReactNode; tail?: [number, number]; size?: number; rot?: number; bg?: string; shout?: boolean; think?: boolean }> = ({ t, t0, t1, x, y, text, tail, size = 44, rot = 0, bg = "#fff", shout, think }) => {
  const u = pop(t, t0, 200, 12);
  const out = t1 != null ? 1 - ph(t, t1, t1 + 0.2) : 1;
  if (u <= 0.001 || out <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${u * out})` }}>
      {tail ? (
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", width: 1, height: 1 }}>
          {think ? (
            <>
              <circle cx={tail[0] * 0.55} cy={tail[1] * 0.55} r={14} fill={bg} stroke={INK} strokeWidth={6} />
              <circle cx={tail[0] * 0.9} cy={tail[1] * 0.9} r={8} fill={bg} stroke={INK} strokeWidth={5} />
            </>
          ) : (
            <path d={`M-26,0 L${tail[0]},${tail[1]} L26,0Z`} fill={bg} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          )}
        </svg>
      ) : null}
      <div
        style={{
          position: "relative",
          transform: "translate(-50%,-50%)",
          background: bg,
          border: `7px solid ${INK}`,
          borderRadius: shout ? 12 : think ? 90 : 60,
          padding: `${size * 0.35}px ${size * 0.7}px`,
          font: `400 ${size}px/1.15 "Pangolin"`,
          color: INK,
          whiteSpace: "nowrap",
          textAlign: "center",
          boxShadow: `8px 8px 0 rgba(22,22,28,.25)`,
          clipPath: shout ? "polygon(0 8%,6% 0,20% 6%,35% 0,50% 7%,65% 0,80% 6%,94% 0,100% 10%,97% 50%,100% 90%,92% 100%,78% 94%,62% 100%,48% 93%,33% 100%,18% 94%,5% 100%,0 90%,3% 50%)" : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------- рассказчик
   Субтитры — жёлтые плашки рассказчика комикса, фраза за фразой. */
export const Narration: React.FC<{ t: number; pos?: (t: number) => "tl" | "bl" | "tr" }> = ({ t, pos }) => {
  const cue = CUES.find((q) => t >= q.t0 - 0.05 && t <= q.t1 + 0.15);
  if (!cue) return null;
  const u = pop(t, cue.t0 - 0.05, 260, 18);
  const p = pos ? pos(t) : "tl";
  const st: React.CSSProperties = p === "tl" ? { left: 40, top: 34 } : p === "tr" ? { right: 40, top: 34 } : { left: 40, bottom: 34 };
  return (
    <div style={{ position: "absolute", ...st, maxWidth: 980, transform: `rotate(-0.6deg) translateY(${(1 - u) * (p === "bl" ? 30 : -30)}px)`, opacity: Math.min(1, u * 1.6) }}>
      <div style={{ background: "#fbf3df", border: `4px solid ${INK}`, padding: "12px 24px 14px", font: '600 36px/1.3 "Golos Text"', color: INK, boxShadow: `6px 6px 0 rgba(22,22,28,.85)`, textWrap: "balance" }}>{cue.s}</div>
    </div>
  );
};

/* SVG-слой во весь кадр 1920×1080 */
export const Layer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; w?: number; h?: number }> = ({ children, style, w = 1920, h = 1080 }) => (
  <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>
    {children}
  </svg>
);

/* линии скорости из центра */
export const Speed: React.FC<{ t: number; x?: number; y?: number; n?: number; color?: string; on?: number }> = ({ t, x = 960, y = 540, n = 40, color = INK, on = 1 }) => (
  <Layer>
    {Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * Math.PI * 2 + hash(i) * 0.1;
      const r0 = 420 + hash(i + Math.floor(t * 12)) * 160;
      return <path key={i} d={`M${x + Math.cos(a) * r0},${y + Math.sin(a) * r0} L${x + Math.cos(a) * 1500},${y + Math.sin(a) * 1500}`} stroke={color} strokeWidth={3 + hash(i + 3) * 6} opacity={on * 0.8} strokeLinecap="round" />;
    })}
  </Layer>
);
