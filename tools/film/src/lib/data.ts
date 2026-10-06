import D from "./data.json";
import TIMING from "../timing.json";
import WORDS from "../eras/words.json";
import ENV from "../comic/env.json";
import SPEC from "../comic/spec.json";

/* Библиотека: 4334 трека. Каждый трек — бусина в облаке фильма. */
export const FPS = 24;
export const END: number = TIMING.end; // конец фильма: последняя фраза + финальный рифф
export const N: number = D.mask.length;
export const VER: number[] = D.ver; // версия героя, в чьи годы трек впервые появился: 0 r1 … 4 now
export const ACAD: number[] = D.R; // академическая музыка
export const KEY: number[] = D.key; // 1 AC/DC, 2 Nickelback, 3 Бах, 4 A$AP Rocky
export const FIRST: number[] = D.first; // первая возрастная полка: 0 11–15 … 5 сейчас, 6 — нет
export const AV: number[] = D.av; // авангард XX века
export const NAMES = ["r1", "r2", "su", "sp", "now"] as const;
export type Ver = (typeof NAMES)[number];
/* цвета возрастов — те же, что на главной сайта */
export const AGE = ["#ff5a3c", "#ffb52e", "#34d6b8", "#5f8dff", "#c77dff"];
export const AGE_LABEL = ["11–15", "16–18", "19–21", "22–24", "сейчас"];
export const IVORY = "#efe7da";
export const INK = "#17161c";

export const S: number[] = TIMING.sent.map((s: { t0: number }) => s.t0);
export const SE: number[] = TIMING.sent.map((s: { t1: number }) => s.t1);
export const KW: Record<string, number> = TIMING.kw;
/* Сценарий писался под прежнюю запись голоса: OLD — начала её фраз.
   rt(t) переносит момент старой шкалы на новую — кусочно-линейно между
   соответствующими фразами (две выпавшие фразы пропущены). */
const OLD = [0.0, 3.42, 9.03, 13.59, 15.6, 20.55, 23.46, 27.81, 30.42, 37.77, 42.45, 44.97, 47.67, 54.51, 59.04, 64.95, 68.01, 77.88, 81.99, 84.18, 87.12, 93.33, 97.11, 99.63, 106.38, 113.91, 117.42, 122.79, 124.53, 130.26, 132.0, 136.47, 140.64, 146.73, 150.63, 152.07, 155.25, 157.23];
const PAIRS: [number, number][] = OLD.map((o, i) => [o, i <= 19 ? i : i <= 21 ? -1 : i <= 32 ? i - 2 : i - 1] as [number, number]).filter(([, j]) => j >= 0).map(([o, j]) => [o, TIMING.sent[j].t0]);
PAIRS.unshift([-10, -10 + PAIRS[0][1] - PAIRS[0][0]]);
PAIRS.push([OLD[OLD.length - 1] + 30, TIMING.sent[TIMING.sent.length - 1].t0 + 30]);
export const rt = (v: number) => {
  for (let k = 0; k < PAIRS.length - 1; k++) {
    const [a0, b0] = PAIRS[k], [a1, b1] = PAIRS[k + 1];
    if (v <= a1) return b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
  }
  return v;
};
/* «старый припев» — музыкальная вставка между первой и второй частью голоса */
export const MEM = 92.57;
export const WORD: [string, number, number, number][] = WORDS as [string, number, number, number][];

/* портреты-мишени: [x, y, r, g, b] × n, x от центра, y сверху, высота 1000 */
const unpack = (a: number[]) => {
  const n = a.length / 5;
  const xy = new Float32Array(n * 2);
  const rgb = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    xy[i * 2] = a[i * 5];
    xy[i * 2 + 1] = a[i * 5 + 1];
    rgb[i * 3] = a[i * 5 + 2] / 255;
    rgb[i * 3 + 1] = a[i * 5 + 3] / 255;
    rgb[i * 3 + 2] = a[i * 5 + 4] / 255;
  }
  return { n, xy, rgb };
};
export const POR = Object.fromEntries(NAMES.map((k) => [k, unpack((D.por as Record<string, number[]>)[k])])) as Record<Ver, ReturnType<typeof unpack>>;
export const DUO = unpack(D.duo as number[]);
export const MINI = Object.fromEntries(NAMES.map((k) => [k, unpack((D.mini as Record<string, number[]>)[k])])) as Record<Ver, ReturnType<typeof unpack>>;
/* треки каждой версии по порядку — i-й трек версии k садится в i-ю точку её мини-портрета */
export const BYVER: number[][] = [0, 1, 2, 3, 4].map((k) => VER.map((v, i) => (v === k ? i : -1)).filter((i) => i >= 0));
export const RANK_IN_VER = new Int32Array(N);
BYVER.forEach((list) => list.forEach((i, r) => (RANK_IN_VER[i] = r)));

/* служебное */
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ph = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const ease = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const inout = (u: number) => {
  const x = clamp(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const back = (u: number) => {
  const x = clamp(u), c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/* пружина без Remotion-контекста: затухающее колебание к 1 */
export const spr = (t: number, t0: number, k = 9, damp = 5) => {
  if (t < t0) return 0;
  const x = t - t0;
  return 1 - Math.exp(-damp * x) * Math.cos(k * x);
};

/* звук: громкость, удар баса, спектр (12 полос) на каждый кадр */
const RMS: number[] = ENV.rms;
const BASS: number[] = ENV.bass;
const SP: number[][] = SPEC as number[][];
const fi = (t: number) => clamp(Math.round(t * FPS), 0, RMS.length - 1);
export const loud = (t: number) => RMS[fi(t)] || 0;
export const kick = (t: number) => {
  const i = fi(t);
  return Math.max(BASS[i] || 0, (BASS[i - 1] || 0) * 0.6, (BASS[i - 2] || 0) * 0.3);
};
export const band = (t: number, b: number) => (SP[fi(t)]?.[b] ?? 0) / 99;
