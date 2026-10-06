import React from "react";
import { Img, staticFile } from "remotion";
import { INK, S, WORD, clamp, hash, ph, spr } from "./data";

/* Коллаж: рваная цветная бумага, скотч, наклейки, слова-вырезки.
   Всё — функции времени фильма t. */

/* контур рваного края: точки по периметру с мелкими зубцами */
const tornPoly = (seed: number, sides = "trbl", amp = 1.2, step = 3) => {
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, torn: boolean, k: number) => {
    const n = Math.round(100 / step);
    for (let j = 0; j < n; j++) {
      const u = j / n;
      const off = torn ? (hash(seed * 13 + k * 101 + j) - 0.5) * amp * 2 + Math.sin(u * 17 + seed) * amp * 0.6 : 0;
      const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
      // смещение внутрь по нормали
      const nx = y1 - y0 ? Math.sign(y1 - y0) * -1 : 0, ny = x1 - x0 ? Math.sign(x1 - x0) : 0;
      pts.push(`${(x + nx * off).toFixed(2)}% ${(y + ny * off).toFixed(2)}%`);
    }
  };
  edge(0, 0, 100, 0, sides.includes("t"), 1);
  edge(100, 0, 100, 100, sides.includes("r"), 2);
  edge(100, 100, 0, 100, sides.includes("b"), 3);
  edge(0, 100, 0, 0, sides.includes("l"), 4);
  return `polygon(${pts.join(",")})`;
};

export const Sheet: React.FC<{ x: number; y: number; w: number; h: number; color: string; rot?: number; seed?: number; torn?: string; amp?: number; shadow?: boolean; children?: React.ReactNode; style?: React.CSSProperties; grain?: number }> = ({ x, y, w, h, color, rot = 0, seed = 1, torn = "trbl", amp = 1.1, shadow = true, children, style, grain = 0.5 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: shadow ? "drop-shadow(6px 9px 0 rgba(20,14,8,.22))" : undefined, ...style }}>
    <div style={{ position: "absolute", inset: 0, clipPath: tornPoly(seed, torn, amp * (400 / Math.max(200, Math.min(w, h)))), background: color, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("paper.png")})`, backgroundSize: "512px", mixBlendMode: "multiply", opacity: grain }} />
      {children}
    </div>
  </div>
);

export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number; seed?: number }> = ({ x, y, w = 150, rot = -8, seed = 3 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - 20, width: w, height: 40, transform: `rotate(${rot}deg)`, background: "rgba(244,236,206,.78)", clipPath: tornPoly(seed, "lr", 3, 10), boxShadow: "inset 0 0 0 1px rgba(255,255,255,.3)" }} />
);

/* наклейка: фигура с белой каймой; появляется шлепком, чуть «дышит» */
export const Sticker: React.FC<{ src: string; x: number; y: number; h: number; t: number; t0: number; t1?: number; rot?: number; flip?: boolean; bob?: number; sway?: number; seed?: number; style?: React.CSSProperties }> = ({ src, x, y, h, t, t0, t1, rot = 0, flip, bob = 0, sway = 1.2, seed = 1, style }) => {
  const u = spr(t, t0, 11, 6);
  const out = t1 != null ? 1 - clamp((t - t1) / 0.3) : 1;
  if (u <= 0.001 || out <= 0) return null;
  const sc = (0.6 + 0.4 * u) * (0.85 + 0.15 * out);
  return (
    <div style={{ position: "absolute", left: x, top: y - bob, height: h, transform: `translate(-50%,-100%) rotate(${rot + Math.sin(t * 1.6 + seed) * sway + (1 - u) * 14}deg) scale(${(flip ? -1 : 1) * sc},${sc})`, transformOrigin: "50% 100%", opacity: Math.min(1, u * 3) * out, filter: "drop-shadow(8px 10px 0 rgba(20,14,8,.25))", ...style }}>
      <Img src={staticFile(`stickers/${src}.png`)} style={{ height: h, display: "block" }} />
    </div>
  );
};

/* бумажная плашка со словом */
const FONTS = [
  { f: '800 1em "Unbounded"', k: 0.82 },
  { f: '900 1em "Playfair Display"', k: 1 },
  { f: '700 1em "Oswald"', k: 1.05 },
  { f: '400 1em "Russo One"', k: 0.92 },
  { f: '700 1em "Amatic SC"', k: 1.35 },
];
export const Chip: React.FC<{ text: string; size: number; bg: string; fg: string; font: number; rot: number; seed: number; u: number }> = ({ text, size, bg, fg, font, rot, seed, u }) => {
  const F = FONTS[font % FONTS.length];
  return (
    <span style={{ display: "inline-block", margin: `0 ${size * 0.06}px ${size * 0.12}px`, transform: `rotate(${rot}deg) translateY(${(1 - u) * 40}px) scale(${0.4 + 0.6 * u})`, opacity: Math.min(1, u * 2.5), filter: "drop-shadow(4px 5px 0 rgba(20,14,8,.25))" }}>
      <span style={{ display: "inline-block", background: bg, color: fg, font: F.f, fontSize: size * F.k, lineHeight: 1.05, padding: `${size * 0.1}px ${size * 0.2}px ${size * 0.14}px`, clipPath: tornPoly(seed, "trbl", 2.2, 9), whiteSpace: "nowrap" }}>{text}</span>
    </span>
  );
};

/* Титры словами: фраза бьётся на куски по 1–4 слова, каждое слово
   вылетает в момент, когда его произносят. */
type Chunk = { words: { w: string; t0: number; i: number }[]; t0: number; t1: number; si: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Chunk | null = null;
  WORD.forEach(([w, t0, t1, si], i) => {
    const len = cur ? cur.words.reduce((a, x) => a + x.w.length + 1, 0) : 0;
    if (!cur || cur.si !== si || len + w.length > 26 || t0 - cur.t1 > 0.45) {
      if (cur) out.push(cur);
      cur = { words: [], t0, t1, si };
    }
    cur.words.push({ w, t0, i });
    cur.t1 = t1;
    if (/[,.:;!?—]$/.test(w) && cur.words.length >= 1) {
      out.push(cur);
      cur = null;
    }
  });
  if (cur) out.push(cur);
  return out;
})();
export type CapStyle = { pal: [string, string][]; fonts?: number[]; size?: number; y?: number; big?: boolean };
export const Captions: React.FC<{ t: number; style: (t: number, si: number) => CapStyle }> = ({ t, style }) => {
  let k = -1;
  for (let j = 0; j < CHUNKS.length; j++) if (t >= CHUNKS[j].t0 - 0.08) k = j;
  if (k < 0) return null;
  const ch = CHUNKS[k];
  const next = CHUNKS[k + 1];
  const end = Math.min(ch.t1 + 0.7, next ? next.t0 - 0.08 : 1e9);
  if (t > end) return null;
  const st = style(t, ch.si);
  const size = st.size ?? (st.big ? 124 : 76);
  const fonts = st.fonts ?? [0, 1, 2, 3, 4];
  const out = 1 - clamp((t - (end - 0.12)) / 0.12);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: st.y ?? 850, transform: "translateY(-50%)", textAlign: "center", opacity: out }}>
      {ch.words.map(({ w, t0, i }) => {
        const u = spr(t, t0 - 0.06, 14, 7);
        const [bg, fg] = st.pal[Math.floor(hash(i * 7.1) * st.pal.length)];
        return <Chip key={i} text={w} size={size} bg={bg} fg={fg} font={fonts[Math.floor(hash(i * 3.3) * fonts.length)]} rot={(hash(i * 5.7) - 0.5) * 7} seed={i} u={u} />;
      })}
    </div>
  );
};

/* лист бумаги, который въезжает и закрывает кадр (смена главы) */
/* порядок листов-смен: лист, полностью закрытый следующим, снимается со сцены */
export const WIPES: number[] = [];
export const Wipe: React.FC<{ t: number; t0: number; color: string; seed?: number; from?: "left" | "right" | "top" | "bottom"; children?: React.ReactNode; rot?: number }> = ({ t, t0, color, seed = 1, from = "right", children, rot = -2 }) => {
  if (t < t0 - 0.01) return null;
  const next = WIPES.filter((w) => w > t0 + 0.01).sort((a, b) => a - b)[0];
  if (next != null && t > next + 0.6) return null;
  const u = 1 - Math.pow(1 - clamp((t - t0) / 0.55), 3);
  const d = (1 - u) * 2300;
  const tr = from === "left" ? `translateX(${-d}px)` : from === "right" ? `translateX(${d}px)` : from === "top" ? `translateY(${-d}px)` : `translateY(${d}px)`;
  return (
    <div style={{ position: "absolute", inset: -120, transform: `${tr} rotate(${rot * (1 - u)}deg)` }}>
      <Sheet x={0} y={0} w={2160} h={1320} color={color} seed={seed} amp={0.5} grain={0.6} shadow={u < 0.999}>
        {children}
      </Sheet>
    </div>
  );
};

export { S, INK, ph };
