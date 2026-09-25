import React from "react";
import { interpolate, spring, Easing } from "remotion";
import Peep from "react-peeps";
import TIMING from "../timing.json";

/* Общий набор фильма в стиле Open Peeps: персонажи, пузыри, титры, камера.
   Время везде — секунды фильма t; начала фраз — S[i], концы — SE[i]. */

export const FPS = 24;
export const S: number[] = TIMING.sent.map((s: { t0: number }) => s.t0);
export const SE: number[] = TIMING.sent.map((s: { t1: number }) => s.t1);
export const CUES: { t0: number; t1: number; s: string }[] = TIMING.cues;
export const END = 170;

export const INK = "#1d1d22";
export const FILL = "#fffaf0";
export const COL = {
  pink: "#f25d8e",
  rose: "#f7b8c8",
  yellow: "#f2d05d",
  sun: "#f5c842",
  blue: "#7ec8e3",
  sky: "#a9d8f0",
  green: "#9bd18b",
  mint: "#bfe6c8",
  lilac: "#c7b6f0",
  orange: "#f5a26b",
  peach: "#f8c9a8",
  cream: "#f3ead9",
  red: "#e85a4f",
};

type PP = React.ComponentProps<typeof Peep>;
export type Body = PP["body"];
export type Face = NonNullable<PP["face"]>;
export type Hair = PP["hair"];

/* Версии героя: причёска и одежда — его опознавательные знаки */
export const V = {
  r1: { hair: "ShortMessy" as Hair, body: "Thunder" as Body, tag: "11–15" },
  r2: { hair: "ShavedWavy" as Hair, body: "FurJacket" as Body, tag: "16–18" },
  su: { hair: "Pomp" as Hair, body: "ShirtCoat" as Body, tag: "19–21" },
  sp: { hair: "ShortVolumed" as Hair, body: "Hoodie" as Body, tag: "22–24" },
  now: { hair: "ShortWavy" as Hair, body: "PoloSweater" as Body, tag: "сейчас" },
};
export type VK = keyof typeof V;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ph = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (u: number) => Easing.bezier(0.22, 1, 0.36, 1)(clamp(u));
export const inout = (u: number) => Easing.inOut(Easing.cubic)(clamp(u));
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/* пружина Remotion от момента t0 */
export const pop = (t: number, t0: number, stiff = 170, damp = 12) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { stiffness: stiff, damping: damp, mass: 0.7 } });
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const move = (t: number, t0: number, t1: number, a: number, b: number) =>
  interpolate(t, [t0, t1], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 1, 0.68, 1) });

/* лицо с «липсинком» и морганием */
const TALK: Face[][] = [
  ["Explaining", "Smile", "Explaining", "SmileTeeth"],
  ["Rage", "Angry", "Rage", "VeryAngry"],
  ["Explaining", "Calm", "Explaining", "SmileNM"],
];
function faceAt(t: number, seed: number, face: Face, talk: false | 0 | 1 | 2): Face {
  if (talk !== false) {
    const k = Math.floor(t * 7 + hash(seed) * 3 + hash(Math.floor(t * 7) + seed) * 1.6);
    return TALK[talk][k % 4];
  }
  const blinkable: Partial<Record<Face, Face>> = { Smile: "Calm", SmileNM: "CalmNM", Serious: "CalmNM", Driven: "CalmNM", Cute: "Calm", Blank: "CalmNM", Suspicious: "CalmNM", Awe: "CalmNM" };
  const bl = blinkable[face];
  if (bl && (t + hash(seed) * 3.7) % 3.7 < 0.13) return bl;
  return face;
}

/* Персонаж. Рамка вида Peep: x −300…1200, y −100…2100 (голова сверху).
   (x, y) — центр верхнего края рамки, h — высота рамки в пикселях кадра.
   Голова: центр ~0.17h, подбородок ~0.26h, низ «бюста» ~0.58h. */
export const Person: React.FC<{
  v: VK;
  t: number;
  x: number;
  y: number;
  h: number;
  body?: Body;
  face?: Face;
  hair?: Hair;
  talk?: false | 0 | 1 | 2;
  flip?: boolean;
  rot?: number;
  scale?: number;
  bob?: number; // амплитуда «дыхания»
  seed?: number;
  opacity?: number;
  accessory?: PP["accessory"];
  origin?: string;
}> = ({ v, t, x, y, h, body, face = "Smile", hair, talk = false, flip, rot = 0, scale = 1, bob = 1, seed = 1, opacity = 1, accessory, origin = "50% 60%" }) => {
  const w = (h * 1500) / 2200;
  const breathe = 1 + Math.sin(t * 2.1 + seed) * 0.006 * bob;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y,
        width: w,
        height: h,
        opacity,
        transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * scale},${scale * breathe})`,
        transformOrigin: origin,
      }}
    >
      <Peep
        style={{ width: "100%", height: "100%" }}
        body={body || V[v].body}
        hair={hair || V[v].hair}
        face={faceAt(t, seed, face, talk)}
        accessory={accessory}
        strokeColor={INK}
        backgroundColor={FILL}
        viewBox={{ x: "-300", y: "-100", width: "1500", height: "2200" }}
      />
    </div>
  );
};

/* Пузырь реплики: впрыгивает пружиной с момента t0 */
export const Bubble: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  x: number;
  y: number;
  text: React.ReactNode;
  tail?: "l" | "r" | "none";
  rot?: number;
  size?: number;
  bg?: string;
  color?: string;
  think?: boolean;
}> = ({ t, t0, t1, x, y, text, tail = "l", rot = 0, size = 42, bg = FILL, color = INK, think }) => {
  const u = pop(t, t0);
  const out = t1 != null ? 1 - ph(t, t1, t1 + 0.25) : 1;
  if (u <= 0.001 || out <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${u * out})`, transformOrigin: tail === "r" ? "80% 120%" : "20% 120%" }}>
      <div style={{ background: bg, border: `7px solid ${INK}`, borderRadius: think ? 80 : 44, padding: `${size * 0.36}px ${size * 0.75}px`, font: `600 ${size}px/1.15 "Golos Text"`, color, whiteSpace: "nowrap", position: "relative", textAlign: "center" }}>
        {text}
        {tail === "none" ? null : think ? (
          <svg width="90" height="80" style={{ position: "absolute", top: "100%", [tail === "l" ? "left" : "right"]: 30 }}>
            <circle cx={tail === "l" ? 24 : 66} cy={22} r={14} fill={bg} stroke={INK} strokeWidth={6} />
            <circle cx={tail === "l" ? 12 : 78} cy={58} r={8} fill={bg} stroke={INK} strokeWidth={5} />
          </svg>
        ) : (
          <svg width="70" height="56" style={{ position: "absolute", top: "100%", marginTop: -7, [tail === "l" ? "left" : "right"]: 44 }}>
            <path d={tail === "l" ? "M4,0 L10,48 L50,0" : "M20,0 L60,48 L66,0"} fill={bg} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
            <path d={tail === "l" ? "M8,0 L46,0" : "M24,0 L62,0"} stroke={bg} strokeWidth={9} />
          </svg>
        )}
      </div>
    </div>
  );
};

/* Надпись-«удар»: крупно, с пружиной и лёгким наклоном */
export const Title: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  x: number;
  y: number;
  text: React.ReactNode;
  size?: number;
  rot?: number;
  color?: string;
  font?: "mono" | "hand" | "sans";
  shadow?: string;
}> = ({ t, t0, t1, x, y, text, size = 120, rot = 0, color = INK, font = "mono", shadow }) => {
  const u = pop(t, t0, 200, 11);
  const out = t1 != null ? 1 - ph(t, t1, t1 + 0.2) : 1;
  if (u <= 0.001 || out <= 0) return null;
  const ff = font === "mono" ? '400 1em "Rubik Mono One"' : font === "hand" ? '700 1em "Caveat"' : '600 1em "Golos Text"';
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${u * out})`,
        font: ff,
        fontSize: size,
        color,
        whiteSpace: "nowrap",
        textShadow: shadow ? `6px 6px 0 ${shadow}` : undefined,
        lineHeight: 1.05,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
};

/* Кадр главы: фон и «камера» (плавный наезд) */
export const Stage: React.FC<{ bg: string; cam?: { s: number; x?: number; y?: number }; children: React.ReactNode; shake?: number; t?: number }> = ({ bg, cam = { s: 1 }, children, shake = 0, t = 0 }) => (
  <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${(cam.x || 0) + shake * Math.sin(t * 91)}px,${(cam.y || 0) + shake * Math.cos(t * 77)}px) scale(${cam.s})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </div>
  </div>
);

/* SVG-слой во весь кадр, 1920×1080 */
export const Layer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>
    {children}
  </svg>
);

/* обводка «как у Peeps»: толстая чёрная линия */
export const ink = { stroke: INK, strokeWidth: 8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
