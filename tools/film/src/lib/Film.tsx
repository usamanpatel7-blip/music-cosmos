import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AGE, AGE_LABEL, FPS, INK, IVORY, KEY, KW, N, S, VER, clamp, ease, hash, inout, kick, lerp, ph, spr } from "./data";
import { Form, XS5, hide, miniRow, only, portrait, record, rgb, rose, scatter, setAge } from "./forms";
import { CamKey, CamRig, Cloud, Seg } from "./Cloud";
import { Captions, CapStyle, Chip, Sheet, Sticker, Tape, WIPES, Wipe } from "./collage";
import { Tonearm, Vinyl3D } from "./Vinyl3D";
import { Back2, CAM2, Front2, SEGS2, Stage2 } from "./act2";

export type FilmProps = { subtitles: boolean; at?: number[]; q?: { aa?: boolean; cloud?: boolean; dom?: boolean } };

/* мир → экран: камера на z = 12, fov 45 → 108.6 px на единицу в плоскости z = 0 */
const PX = 1080 / (2 * 12 * Math.tan((22.5 * Math.PI) / 180));
const sx = (x: number) => 960 + x * PX;
const sy = (y: number) => 540 - y * PX;

/* ---------------------------------------------------------------- облако
   Один непрерывный сценарий: 4334 трека перетекают из формы в форму. */
const NECK = 0.39; // линия шеи в долях высоты портрета (по пояс)
/* кивок головой: всё выше шеи поворачивается вокруг неё, волосы запаздывают */
const headbang = (h: number, y0: number, amp: (t: number) => number) => (t: number, p: Float32Array) => {
  const top = y0 + h / 2, pivot = top - NECK * h;
  for (let i = 0; i < N; i++) {
    const y = p[i * 3 + 1];
    const w = clamp((y - (pivot - 0.25)) / 0.6);
    if (w <= 0) continue;
    const lag = (y - pivot) * 0.035 + hash(i) * 0.02;
    const a = amp(t - lag) * w;
    const dy = y - pivot, dz = p[i * 3 + 2];
    // кивок вперёд (вокруг X) и лёгкий наклон (вокруг Z)
    p[i * 3 + 1] = pivot + dy * Math.cos(a) - dz * Math.sin(a) * 0.3;
    p[i * 3 + 2] = dz + dy * Math.sin(a) * 1.4;
    p[i * 3] += Math.sin(a * 0.6) * dy * 0.25;
  }
};
/* сжатие в тесной рамке: x мягко упирается в стенки */
const squeeze = (L: (t: number) => number) => (t: number, p: Float32Array) => {
  const l = L(t);
  for (let i = 0; i < N; i++) {
    const x = p[i * 3];
    p[i * 3] = l * Math.tanh(x / l);
    p[i * 3 + 2] += (Math.abs(x) / l) * 0.3 * (5 - l) * 0.2;
  }
};
const BEAT = 60 / 132;

/* пять версий танцуют под музыку, пока её не выключили */
const roomMod = (t: number, p: Float32Array, c: Float32Array, s: Float32Array) => {
  const off = ph(t, KW.off, KW.off + 0.6);
  const back = ph(t, S[2] + 0.8, S[2] + 1.6);
  for (let i = 0; i < N; i++) {
    const k = VER[i];
    const ph0 = k * 0.9;
    const bob = Math.max(0, Math.sin(((t / BEAT) * Math.PI) + ph0)) * 0.12 * (1 - off);
    p[i * 3 + 1] += bob - off * (1 - back) * 0.25 * (1 + hash(i));
    // «каждый требует своё»: версии напирают к центру и дрожат
    const push = ph(t, S[2] + 1.2, S[2] + 2.2) * (1 - ph(t, S[3] - 0.5, S[3]));
    p[i * 3] += -XS5[k] * 0.09 * push + Math.sin(t * 31 + k) * 0.05 * push;
    // без музыки краски уходят
    const g = off * (1 - back) * 0.75;
    const lum = (c[i * 3] + c[i * 3 + 1] + c[i * 3 + 2]) / 3;
    c[i * 3] += (lum - c[i * 3]) * g;
    c[i * 3 + 1] += (lum - c[i * 3 + 1]) * g;
    c[i * 3 + 2] += (lum - c[i * 3 + 2]) * g;
  }
};

/* альбом целиком: пластинка из десяти треков, игла идёт от края к центру */
const RED = rgb("#ff5a3c"), DARK = rgb("#3a2f33");
const SE4 = 20.04;
const albumColored = (t: number): Form => {
  const prog = ph(t, S[4] + 0.3, SE4 - 0.1);
  return record({
    r0: 1.05, r1: 4.2, tilt: 1.12, y: -0.6, spin: t * 2.2, turns: 30, s: 0.05,
    color: (i, q, u) => {
      // десять колец-треков; сыгранные — красные, текущий светится
      const ring = Math.floor(u * 10);
      const gap = Math.abs(u * 10 - ring - 0.5) > 0.42;
      const c = u < prog ? RED : DARK;
      const m = Math.abs(u - prog) < 0.035 ? 1.7 : 1;
      q.r = Math.min(1, c[0] * m); q.g = Math.min(1, c[1] * m); q.b = Math.min(1, c[2] * m);
      if (gap) q.s = 0.018;
    },
  });
};

/* AC/DC: пять бусин из 4334, остальные уходят */
const acdc = only(
  (i) => KEY[i] === 1,
  (i, q, k) => {
    q.x = (k - 2) * 1.5; q.y = 0.2; q.z = 1; q.s = 0.32;
    q.r = 1; q.g = 0.35; q.b = 0.24;
  },
);
const one = only(
  (i) => KEY[i] === 1,
  (i, q) => {
    q.x = 0; q.y = 0.2; q.z = 1; q.s = 0.5;
    q.r = 1; q.g = 0.35; q.b = 0.24;
  },
);

const SEGS: Seg[] = [
  { t: -10, f: () => scatter({ R: 10 }) },
  { t: 0.0, f: () => portrait("now", { y: -0.2 }), d: 1.5, order: "top", swirl: 1.4, mod: squeeze((t) => lerp(6, 2.15, ease(ph(t, 1.0, 2.3)))) },
  { t: S[1] - 0.6, f: () => miniRow({ y: 0.5, h: 3.7 }), d: 1.6, order: "center", swirl: 2.2, mod: roomMod },
  { t: S[3] - 0.35, f: () => portrait("r1", { y: -0.25, h: 9, dark: true }), d: 1.3, order: "top", swirl: 1.6, mod: headbang(9, -0.25, (t) => (t < S[3] + 0.3 ? 0 : Math.max(0, Math.sin((t / BEAT) * Math.PI)) * 0.42 + kick(t) * 0.06)) },
  { t: S[4] - 0.15, f: albumColored, d: 1.3, order: "out", swirl: 1.4 },
  { t: S[5] - 0.2, f: (t) => rose({ spin: t * 0.06, y: 0.4, z: -1.2, R: 4.6 }), d: 1.4, order: "center", swirl: 1.8 },
  { t: S[6] - 0.15, f: () => acdc, d: 1.1, order: "rand", swirl: 1.2 },
  { t: S[6] + 1.6, f: () => one, d: 0.9, order: "rand", swirl: 0.3 },
  { t: S[6] + 2.4, f: () => only(() => false, () => {}), d: 0.5, order: "rand", swirl: 0 },
  ...SEGS2,
];
void hide; void setAge; void inout;

const CAM: CamKey[] = [
  [0, [0, 0, 12], [0, 0, 0]],
  [3.4, [0, 0.1, 12.6], [0, 0, 0]],
  [13.4, [0, 0.1, 12.8], [0, 0, 0]],
  [14.2, [0, 0, 11.2], [0, 0.2, 0]],
  [15.5, [0, 0.3, 10.8], [0, 0.2, 0]],
  [16.8, [0, 2.2, 11.5], [0, -0.6, 0]],
  [20.4, [0, 1.6, 11.8], [0, -0.4, 0]],
  [21.2, [0, 0.4, 11.4], [0, 0.3, 0]],
  [23.4, [0, 0.3, 11.6], [0, 0.3, 0]],
  [27.6, [0, 0.2, 9.4], [0, 0.2, 0]],
  [30.0, [0, 0.2, 9.0], [0, 0.2, 0]],
  ...CAM2,
];

/* ---------------------------------------------------------------- 3D-сцена */
const Stage: React.FC<{ t: number }> = ({ t }) => {
  const spinOn = 1 - ph(t, KW.off - 0.1, KW.off + 1.4);
  const bigRec = t > S[1] - 0.2 && t < S[3] + 0.4;
  const recU = ease(ph(t, S[1] - 0.2, S[1] + 0.8)) * (1 - ease(ph(t, S[3] - 0.4, S[3] + 0.3)));
  const albumOn = t > S[4] - 0.2 && t < S[5] + 0.3;
  const armA = lerp(0.55, 1.05, ph(t, S[4] + 0.3, SE4 - 0.1));
  const vinylOne = ease(ph(t, S[6] + 2.3, S[6] + 3.2));
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 7, 9]} intensity={1.7} />
      <directionalLight position={[-6, 2, 4]} intensity={0.5} color="#ffd9b0" />
      <CamRig keys={CAM} t={t} />
      <Cloud segs={SEGS} t={t} />
      {bigRec ? <Vinyl3D pos={[0, -3.35, 0.5]} rot={[0.32, 0, 0]} scale={2.2 * recU} spin={t * 3.5 * spinOn + (1 - spinOn) * KW.off * 3.5} label="#f3d36a" /> : null}
      {bigRec ? <Tonearm pos={[2.6, -3.1, 0.2]} a={KW.off < t ? 0.15 : 0.62} lift={ph(t, KW.off - 0.15, KW.off + 0.1)} scale={1.4 * recU} /> : null}
      {albumOn ? <Tonearm pos={[4.5, -0.3, -1.6]} a={armA} scale={2.1} /> : null}
      <Stage2 t={t} />
      {t > S[6] + 2.2 && t < S[8] + 0.6 ? <Vinyl3D pos={[0, 0.2, 1]} rot={[1.25 - vinylOne * 0.2, 0, 0]} scale={vinylOne * 2.6} spin={t * 1.4} label="#e8402e" text="AC/DC" /> : null}
    </>
  );
};

/* ---------------------------------------------------------------- коллаж */
WIPES.push(S[1] - 0.7, S[3] - 0.45, S[8] - 0.45, S[10] - 0.35, S[11] - 0.4, S[15] - 0.4, 70.8, S[17] - 0.4, S[22] - 0.4, S[30] - 0.4, S[33] - 0.4);
const Bolt: React.FC<{ x: number; y: number; s: number; rot?: number; color?: string }> = ({ x, y, s, rot = 0, color = "#ff5a3c" }) => (
  <svg style={{ position: "absolute", left: x, top: y, width: 300 * s, height: 520 * s, transform: `rotate(${rot}deg)`, filter: "drop-shadow(8px 10px 0 rgba(0,0,0,.35))" }} viewBox="0 0 300 520">
    <path d="M190,0 L40,290 L140,290 L90,520 L270,200 L160,200 L230,0Z" fill={color} />
  </svg>
);

const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: IVORY }} />
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("paper.png")})`, backgroundSize: "512px", mixBlendMode: "multiply", opacity: 0.6 }} />
    {/* глава 2: комната из бумаги — стена и пол */}
    <Wipe t={t} t0={S[1] - 0.7} color="#e9d9bd" from="bottom" seed={4}>
      <Sheet x={0} y={890} w={2160} h={430} color="#b98a5b" seed={7} torn="t" amp={0.6} />
      <Sheet x={1560} y={70} w={330} h={250} color="#2f3a66" seed={9} rot={2}>
        <div style={{ position: "absolute", inset: 22, background: "linear-gradient(#f6b77c,#c58bb0)" }} />
      </Sheet>
    </Wipe>
    {/* глава 3: чёрный ксерокс подростка */}
    <Wipe t={t} t0={S[3] - 0.45} color="#1a1719" from="right" seed={11}>
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("tex/xerox.png")})`, backgroundSize: "768px", opacity: 0.35, filter: "invert(1)", mixBlendMode: "screen" }} />
    </Wipe>
    {t > S[3] - 0.4 && t < S[5] - 0.1 ? <Bolt x={1330} y={130 + Math.sin(t * 9) * 4 * kick(t)} s={1.25 + kick(t) * 0.05} rot={12} /> : null}
    {t > S[3] - 0.4 && t < S[5] - 0.1 ? <Bolt x={170} y={520} s={0.7} rot={-18} color="#f3d36a" /> : null}
    {/* «почти религиозен»: лучи за розой */}
    {t > S[5] - 0.3 && t < S[6] + 0.2 ? (
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${t * 6}deg at 50% 46%, rgba(255,210,120,.16) 0deg 6deg, transparent 6deg 15deg)`, opacity: ease(ph(t, S[5] - 0.3, S[5] + 0.6)) }} />
    ) : null}
    {/* AC/DC и монотеизм: прожектор */}
    {t > S[6] - 0.2 && t < S[8] ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 40% 55% at 50% 48%, rgba(255,236,200,.22), transparent 70%)", opacity: ease(ph(t, S[6], S[6] + 1)) }} /> : null}
    <Back2 t={t} />
  </>
);

const Front: React.FC<{ t: number }> = ({ t }) => {
  /* глава 1: стенки рамки из крафта сжимают портрет */
  const wall = ease(ph(t, 1.0, 2.3)) * (1 - ease(ph(t, S[1] - 0.8, S[1] - 0.2)));
  const burst = ph(t, S[1] - 0.8, S[1] - 0.2);
  return (
    <>
      {wall > 0.001 ? (
        <>
          <Sheet x={lerp(-1000, sx(-2.35) - 960, wall) - burst * 300} y={-60} w={960} h={1200} color="#c79a62" seed={21} torn="r" rot={1.5 - burst * 6} />
          <Sheet x={lerp(1960, sx(2.35), wall) + burst * 300} y={-60} w={960} h={1200} color="#d9b07c" seed={22} torn="l" rot={-1.2 + burst * 6} />
          <Tape x={sx(-2.35)} y={140} rot={-70} />
          <Tape x={sx(2.35)} y={880} rot={70} />
        </>
      ) : null}
      {/* глава 2: бирки возрастов под мини-портретами */}
      {t > S[1] && t < S[3] - 0.3
        ? XS5.map((x, k) => (
            <div key={k} style={{ position: "absolute", left: sx(x * (12 / 12.6)), top: sy(-1.55), transform: "translate(-50%,0)" }}>
              <Chip text={AGE_LABEL[k]} size={46} bg={AGE[k]} fg={INK} font={k} rot={(hash(k) - 0.5) * 10} seed={k + 40} u={spr(t, S[1] + 0.5 + k * 0.22, 12, 6) * (1 - ph(t, S[3] - 0.7, S[3] - 0.35))} />
            </div>
          ))
        : null}
      {/* «каждый потребовал бы поставить своё»: пластинки над головами */}
      {t > S[2] + 1.0 && t < S[3] - 0.3
        ? XS5.map((x, k) => {
            const u = spr(t, S[2] + 1.1 + k * 0.18, 13, 6);
            return (
              <svg key={k} viewBox="-50 -50 100 100" style={{ position: "absolute", left: sx(x * 0.95 - XS5[k] * 0.06 * ph(t, S[2] + 1.2, S[2] + 2.2)) - 55, top: sy(3.1) - 55 + Math.sin(t * 20 + k) * 5, width: 110, height: 110, transform: `scale(${u}) rotate(${t * 200 + k * 40}deg)`, filter: "drop-shadow(5px 6px 0 rgba(0,0,0,.25))" }}>
                <circle r={48} fill="#141418" />
                <circle r={40} fill="none" stroke="#3a3a42" strokeWidth={2} />
                <circle r={30} fill="none" stroke="#3a3a42" strokeWidth={2} />
                <circle r={17} fill={AGE[k]} />
                <circle r={2.5} fill="#f5eee0" />
              </svg>
            );
          })
        : null}
      {/* глава 3: подросток-наклейка в углу трясёт головой, пока играет альбом */}
      <Sticker src="r1-headbang" x={330} y={1100} h={700} t={t} t0={S[4] + 0.2} t1={S[5] - 0.3} rot={-6} bob={Math.max(0, Math.sin((t / BEAT) * Math.PI)) * 22} sway={3} />
      <Sticker src="r1" x={960} y={1110} h={560} t={t} t0={S[5] + 0.5} t1={S[6] - 0.2} sway={0.6} />
      {/* счётчики монотеизма */}
      {t > S[6] && t < S[7] + 0.1
        ? [
            ["группа", "×1", S[6] + 0.25],
            ["пластинка", "×1", S[6] + 1.3],
            ["сомнений", "0", S[6] + 2.4],
          ].map(([a, b, t0], j) => (
            <div key={j} style={{ position: "absolute", left: 150, top: 220 + j * 120 }}>
              <Chip text={`${a} ${b}`} size={54} bg={j === 2 ? "#ff5a3c" : "#f5eee0"} fg={INK} font={j + 1} rot={-4 + j * 3} seed={60 + j} u={spr(t, t0 as number, 12, 6) * (1 - ph(t, S[7] - 0.3, S[7]))} />
            </div>
          ))
        : null}
      <Front2 t={t} />
    </>
  );
};

const DARK_PAL: [string, string][] = [["#f5eee0", INK], ["#ffb52e", INK], ["#c77dff", INK], [INK, "#f5eee0"]];
const LIGHT_PAL: [string, string][] = [["#fff8ea", INK], ["#f3d36a", INK], [INK, "#fff8ea"], ["#c77dff", INK]];
const capStyle = (t: number, si: number): CapStyle => {
  if (si === 29) return { pal: [["#ff5a3c", INK], ["#f5eee0", INK]], big: true, y: 860 };
  if (t > S[15] - 0.4 && t < S[17] - 0.3) return { pal: LIGHT_PAL, y: 150 };
  if (t > S[22] - 0.4 && t < S[24] - 0.2) return { pal: LIGHT_PAL, y: 1000, size: 64 };
  if (t > S[8] - 0.4) return { pal: (t > S[11] && t < S[15]) || (t > S[17] && t < S[22]) || t > S[33] ? DARK_PAL : LIGHT_PAL };
  if (si === 7) return { pal: [["#ff5a3c", INK], ["#f5eee0", INK], ["#f3d36a", INK]], big: true, y: 860, size: 118 };
  if (t > S[3] - 0.4) return { pal: [["#f5eee0", INK], ["#ff5a3c", INK], ["#f3d36a", INK], [INK, "#f5eee0"]] };
  return { pal: [["#fff8ea", INK], ["#f3d36a", INK], [INK, "#fff8ea"], ["#ff8e6e", INK]] };
};

export const LibFilm: React.FC<FilmProps> = ({ subtitles, at, q = {} }) => {
  const frame = useCurrentFrame();
  const t = at ? at[Math.min(frame, at.length - 1)] : frame / FPS; // at — проверочные кадры по времени
  const audio = !at;
  return (
    <AbsoluteFill style={{ background: IVORY, overflow: "hidden" }}>
      {q.dom !== false ? <Back t={t} /> : null}
      {q.cloud !== false ? (
        <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} camera={{ position: [0, 0, 12], fov: 45, near: 0.1, far: 100 }} gl={{ alpha: true, antialias: q.aa !== false }}>
          <Stage t={t} />
        </ThreeCanvas>
      ) : null}
      {q.dom !== false ? <Front t={t} /> : null}
      {subtitles ? <Captions t={t} style={capStyle} /> : null}
      {audio ? <Audio src={staticFile("film-audio.m4a")} /> : null}
    </AbsoluteFill>
  );
};
