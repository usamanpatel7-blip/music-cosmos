import D from "../lib/data.json";
import { FIRST, N, VER, hash } from "../lib/data";
import { AGEC, VERC } from "./theme";
import { DotData } from "./Dots";

/* Раскладки точек. Мир: камера на z = 12, fov 40 → кадр ≈ 8.7 единицы
   в высоту. Все цвета — sRGB 0…1. */
export const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
export const blank = (): DotData => ({ p: new Float32Array(N * 3), c: new Float32Array(N * 3), s: new Float32Array(N), a: new Float32Array(N).fill(1) });
const Y: number[] = D.y;
/* порядок внутри полки — по году записи, как на сайте */
const SHELF = FIRST.map((g) => Math.min(6, g));
export const SHC = [0, 1, 2, 3, 4, 5, 6].map((s) => SHELF.filter((x) => x === s).length);
const ORDER: number[] = Array.from({ length: N }, (_, i) => i).sort((a, b) => SHELF[a] - SHELF[b] || Y[a] - Y[b] || a - b);
const AGERGB = AGEC.map(rgb);
const VERRGB = VERC.map(rgb);

/* ---- пластинка сайта: полосы по возрастам, площадь — число записей;
   снаружи 11–15, внутри — сейчас. Плоскость z = 0, центр (0,0). */
export type Rec = { data: DotData; bands: [number, number][]; Ro: number; Ri: number };
export const siteRecord = (Ro = 3.6, spin = 0, gapK = 0.014, dot = 1): Rec => {
  const Ri = Ro * 0.34, gap = gapK * Ro;
  const d = blank();
  const bands: [number, number][] = [];
  const run = (sc: number, write: boolean) => {
    let r0 = Ro, start = 0;
    for (let s = 0; s < 7; s++) {
      const n = SHC[s];
      if (!n) continue;
      const area = (n / N) * Math.PI * (Ro * Ro - Ri * Ri) * sc;
      const r1 = Math.sqrt(Math.max(1e-6, r0 * r0 - area / Math.PI));
      if (write) {
        const p = Math.sqrt((Math.PI * (r0 * r0 - r1 * r1)) / n);
        bands[s] = [r1, r0];
        for (let k = 0; k < n; k++) {
          const i = ORDER[start + k];
          const rr = Math.sqrt(r0 * r0 - ((r0 * r0 - r1 * r1) * (k + 0.5)) / n);
          const th = (2 * Math.PI * (r0 - rr)) / p + s * 1.7 + spin;
          d.p[i * 3] = rr * Math.cos(th);
          d.p[i * 3 + 1] = rr * Math.sin(th);
          d.p[i * 3 + 2] = 0.004;
          const c = AGERGB[s];
          d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
          d.s[i] = Math.min(0.03, Math.max(0.011, p * 0.36)) * dot;
          d.a![i] = 0.92;
        }
      }
      start += n;
      r0 = r1 - gap;
    }
    return r0 + gap;
  };
  let lo = 0.3, hi = 1.2;
  for (let it = 0; it < 26; it++) {
    const m = (lo + hi) / 2;
    if (run(m, false) > Ri) lo = m;
    else hi = m;
  }
  run(lo, true);
  return { data: d, bands, Ro, Ri };
};

/* ---- ореол за фигурой: точки версии — кольцо-нимб (диск, повёрнутый к камере) */
export const halos = (cx: number[], cy: number, R = 1.15, spin = 0): DotData => {
  const d = blank();
  const cnt = [0, 0, 0, 0, 0];
  const tot = [0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) tot[VER[i]]++;
  for (let i = 0; i < N; i++) {
    const k = VER[i], j = cnt[k]++;
    const u = (j + 0.5) / tot[k];
    // золотой угол по кольцу толщиной 0.35R
    const rr = R * (0.72 + 0.28 * Math.sqrt(hash(i * 3.3)));
    const th = j * 2.39996 + spin * (k % 2 ? 1 : -1);
    d.p[i * 3] = cx[k] + Math.cos(th) * rr;
    d.p[i * 3 + 1] = cy + Math.sin(th) * rr;
    d.p[i * 3 + 2] = -0.4 - u * 0.02;
    const c = VERRGB[k];
    d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
    d.s[i] = 0.016 + Math.min(0.02, 0.6 / Math.sqrt(tot[k]));
    d.a![i] = 0.9;
  }
  return d;
};

/* ---- облако: сферическая туманность для расфокуса */
export const nebula = (R = 6, z0 = -2, seed = 0): DotData => {
  const d = blank();
  for (let i = 0; i < N; i++) {
    const a = hash(i + seed) * Math.PI * 2, b = Math.acos(2 * hash(i * 1.7 + 11 + seed) - 1), r = R * Math.cbrt(hash(i * 2.3 + 23 + seed));
    d.p[i * 3] = Math.cos(a) * Math.sin(b) * r * 1.5;
    d.p[i * 3 + 1] = Math.cos(b) * r * 0.75;
    d.p[i * 3 + 2] = z0 + Math.sin(a) * Math.sin(b) * r;
    const c = AGERGB[Math.min(5, FIRST[i])];
    d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
    d.s[i] = 0.022;
    d.a![i] = 0.85;
  }
  return d;
};

export { AGERGB, VERRGB, SHELF, ORDER };
