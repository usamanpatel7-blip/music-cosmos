import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { E5, FPS, KEY, KW, N, S, SE, VER, WORD, band, clamp, ease, hash, inout, kick, lerp, loud, ph, spr } from "./time5";
import { Tonearm } from "../lib/Vinyl3D";
import { CamKey, CamRig } from "../lib/Cloud";
import { AGEC, AGEL, BG, INK, INK2, INK3, PAPER, PAPER_INK, SANS, SERIF, VERC, VERL } from "./theme";
import { Dots, DotData } from "./Dots";
import { blank, halos, nebula, rgb, siteRecord, SHELF } from "./forms5";
import { Record3D, useSiteLabel, useTextures } from "./Record3D";
import { Cutout, Epi, H2 } from "./ui";
import { PianoStage } from "./Pianists";
import { Seg, flowAt } from "./flow";
import TR from "./tracks.json";

export type Film5Props = { subtitles: boolean; at?: number[] };

const FOV = 40;
const PX = 1080 / (2 * 12 * Math.tan((FOV * Math.PI) / 360)); // пикселей на единицу при камере z = 12
const wx = (x: number) => (x - 960) / PX;
const wy = (y: number) => (540 - y) / PX;
const T = TR as Record<string, { id: string; artist: string; track: string }>;
const cov = (k: string) => `covers/${T[k].id}.jpg`;

/* ---------------------------------------------------------------- ключевые моменты */
const OFF = KW.off, THREE_ = KW.three, LOUD = KW.louder;
const wt = (re: RegExp, si: number, fb: number) => WORD.find(([w, , , s]) => s === si && re.test(w))?.[1] ?? fb;
const NB = wt(/Nickelback/, 21, 101.1), BACH = KW.bach, AVANT = KW.avant;
const P11 = 78.39, P16 = 79.53, P20 = 80.85;
const TIK = SE[25] + 0.15; // «возьми…» в превью «NOBODY»
const ASAP = wt(/A\$AP/, 24, 120.1);
const END = E5;

/* ---------------------------------------------------------------- раскладки точек */
const hidden = (() => {
  let f: DotData | null = null;
  return (): DotData => {
    if (f) return f;
    f = nebula(9, -6, 7);
    f.a!.fill(0);
    return f;
  };
})();
const recAt = (Ro: number, cx: number, cy: number, spin: number, dot = 1): DotData => {
  const r = siteRecord(Ro, spin, 0.014, dot).data;
  for (let i = 0; i < N; i++) {
    r.p[i * 3] += cx;
    r.p[i * 3 + 1] += cy;
  }
  return r;
};
/* комната: нимбы пяти версий над их фигурами */
const XS = [270, 615, 960, 1305, 1650];
const roomHalo = (t: number) => halos(XS.map(wx), wy(330), 1.3, t * 0.12);
/* подросток: его 104 трека — кольцо вокруг фигуры, остальные гаснут */
const teenRing = (cx: number, cy: number, R: number) => {
  const d = hidden();
  const o = blank();
  o.p.set(d.p); o.a!.fill(0);
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 0) continue;
    const j = k++, th = (j / 104) * Math.PI * 2;
    const rr = R * (0.88 + 0.12 * hash(i));
    o.p[i * 3] = cx + Math.cos(th) * rr;
    o.p[i * 3 + 1] = cy + Math.sin(th) * rr;
    o.p[i * 3 + 2] = -0.3;
    const c = rgb(j % 3 ? AGEC[0] : AGEC[1]);
    o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    o.s[i] = 0.045;
    o.a![i] = 0.95;
  }
  return o;
};
/* подросток на пластинке: его треки — в бороздках, крутятся вместе с ней */
const teenGrooves = (cx: number, cy: number, R: number, tilt: number, spin: number) => {
  const o = teenRing(0, 0, 1);
  let k = 0;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 0) continue;
    const j = k++, track = j % 10;
    const rr = R * (0.46 + (track / 10) * 0.48);
    const th = (j / 104) * Math.PI * 2 * 3.1 + spin;
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr;
    o.p[i * 3] = cx + x;
    o.p[i * 3 + 1] = cy + y * ct;
    o.p[i * 3 + 2] = 0.02 - y * st;
    o.s[i] = 0.032;
  }
  return o;
};
/* алтарь: нимб вокруг пластинки и «дым» от свечей */
const altar = (t: number) => {
  const o = teenRing(0, 0, 1);
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 0) continue;
    const j = k++;
    if (j < 64) {
      const th = (j / 64) * Math.PI * 2 + t * 0.05;
      o.p[i * 3] = Math.cos(th) * 2.55;
      o.p[i * 3 + 1] = 0.7 + Math.sin(th) * 2.55;
      o.p[i * 3 + 2] = -0.2;
      o.s[i] = KEY[i] === 1 ? 0.075 : 0.05;
    } else {
      const side = j % 2 ? 1 : -1, u = ((j - 64) / 40 + hash(i) * 0.15 + t * 0.12) % 1;
      o.p[i * 3] = side * 2.45 + Math.sin(u * 9 + side + t) * 0.3 * u;
      o.p[i * 3 + 1] = 0.25 + u * 2.8;
      o.p[i * 3 + 2] = 0.6;
      o.s[i] = 0.04 * (1 - u * 0.5);
      o.a![i] = 0.9 * (1 - u);
    }
    if (KEY[i] === 1) {
      const c = rgb("#ffd27a");
      o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    }
  }
  return o;
};
/* ноты из трёх роялей: треки «сейчас» поднимаются над прожекторами */
const notes = (t: number, on: number[]) => {
  const o = blank();
  o.p.set(hidden().p);
  o.a!.fill(0);
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 4 || k > 300) continue;
    const j = k++, s = j % 3, u = (j / 100 + hash(i) * 0.3 + t * 0.18) % 1;
    const cx = wx(470 + (1420 / 3) * s + (1420 / 3) * 0.42);
    o.p[i * 3] = cx + Math.sin(u * 7 + s + t) * 0.5 * u;
    o.p[i * 3 + 1] = wy(380) + u * 3.0;
    o.p[i * 3 + 2] = -0.5;
    const c = rgb(VERC[4]);
    o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    o.s[i] = 0.03 * (1 - u * 0.5);
    o.a![i] = (1 - u) * on[s];
  }
  return o;
};
/* одна точка — тот самый трек; остальные — далёкий туман */
const I_SKIP = (() => {
  const want = T.skip.id;
  void want;
  return VER.findIndex((v, i) => v === 1 && hash(i) > 0.6);
})();
const oneDot = () => {
  const o = nebula(9, -9, 3);
  for (let i = 0; i < N; i++) o.a![i] = 0.18;
  o.p[I_SKIP * 3] = 0; o.p[I_SKIP * 3 + 1] = wy(470); o.p[I_SKIP * 3 + 2] = 1;
  o.s[I_SKIP] = 0.12; o.a![I_SKIP] = 1;
  const c = rgb(AGEC[1]);
  o.c[I_SKIP * 3] = c[0]; o.c[I_SKIP * 3 + 1] = c[1]; o.c[I_SKIP * 3 + 2] = c[2];
  return o;
};
/* поток треков в корешок книги */
const stream = (t: number) => {
  const o = blank();
  o.p.set(hidden().p);
  o.a!.fill(0);
  const x0 = -9.5, x1 = wx(1080) - 0.15;
  for (let i = 0; i < N; i++) {
    if (hash(i * 3.1) > 0.33) continue;
    const u = (hash(i * 7.7) + t * 0.07) % 1;
    o.p[i * 3] = x0 + (x1 - x0) * u;
    o.p[i * 3 + 1] = wy(470) + Math.sin(u * 5 + 1 + t * 0.4) * 0.9 * (1 - u) + (hash(i) - 0.5) * 0.8 * (1 - u * 0.9);
    o.p[i * 3 + 2] = (hash(i * 2.2) - 0.5) * 1.5 * (1 - u);
    const c = rgb(VERC[VER[i]]);
    o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    o.s[i] = 0.02;
    o.a![i] = (0.25 + 0.7 * (1 - u)) * Math.min(1, u * 8);
  }
  return o;
};
/* последние годы: матрица точек, академические — цветом «сейчас» */
const RECENT = Array.from({ length: N }, (_, i) => i).filter((i) => VER[i] >= 3);
const grid = (() => {
  let f: DotData | null = null;
  return () => {
    if (f) return f;
    f = blank();
    f.p.set(hidden().p);
    f.a!.fill(0);
    const sorted = RECENT.slice().sort((a, b) => (KEYACAD(b) - KEYACAD(a)) || hash(a) - hash(b));
    const cols = 80, gap = 0.112;
    const rows = Math.ceil(sorted.length / cols);
    const vio = rgb(VERC[4]), dim = rgb(INK3);
    sorted.forEach((i, j) => {
      const cx = j % cols, cy = Math.floor(j / cols);
      // заполнение по столбцам: академические занимают левую часть
      const col = Math.floor(j / rows), row = j % rows;
      void cx; void cy;
      f!.p[i * 3] = wx(1060) + (col - cols / 2) * gap;
      f!.p[i * 3 + 1] = wy(450) + (rows / 2 - row) * gap;
      f!.p[i * 3 + 2] = 0;
      const c = KEYACAD(i) ? vio : dim;
      f!.c[i * 3] = c[0]; f!.c[i * 3 + 1] = c[1]; f!.c[i * 3 + 2] = c[2];
      f!.s[i] = 0.024;
      f!.a![i] = KEYACAD(i) ? 0.95 : 0.55;
    });
    return f;
  };
})();
function KEYACAD(i: number) {
  return ACADI[i];
}
import D5 from "../lib/data.json";
const ACADI: number[] = D5.R;
const ACAD_SHARE = Math.round((RECENT.filter((i) => ACADI[i]).length / RECENT.length) * 100);
/* стрела «культурного роста»: слоновая кость, золотой наконечник, прогиб под обложками */
const A0 = [-6.4, -2.7], B0 = [4.4, 1.9];
type Sag = { u: number; k: number };
const sagAt = (u: number, sag: Sag[]) => sag.reduce((y, s) => y - s.k * Math.exp(-((u - s.u) ** 2) / 0.006), 0);
const arrow = (sag: Sag[]) => {
  const o = blank();
  const len = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]), ux = (B0[0] - A0[0]) / len, uy = (B0[1] - A0[1]) / len, nx = -uy, ny = ux;
  const ink = rgb(INK), gold = rgb("#e8c070");
  for (let i = 0; i < N; i++) {
    const head = i % 9 === 0;
    let x: number, y: number;
    if (head) {
      let r1 = hash(i * 1.3), r2 = hash(i * 2.9);
      if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
      const by = B0[1] + sagAt(1, sag);
      const Lx = B0[0] + nx * 0.62, Ly = by + ny * 0.62, Rx = B0[0] - nx * 0.62, Ry = by - ny * 0.62, Tx = B0[0] + ux, Ty = by + uy;
      x = Lx + r1 * (Rx - Lx) + r2 * (Tx - Lx);
      y = Ly + r1 * (Ry - Ly) + r2 * (Ty - Ly);
    } else {
      const u = hash(i * 0.73), w = (hash(i * 5.1) - 0.5) * 0.36;
      x = A0[0] + (B0[0] - A0[0]) * u + nx * w;
      y = A0[1] + (B0[1] - A0[1]) * u + ny * w + sagAt(u, sag);
    }
    o.p[i * 3] = x; o.p[i * 3 + 1] = y; o.p[i * 3 + 2] = (hash(i * 9.9) - 0.5) * 0.2;
    const c = head ? gold : ink;
    o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    o.s[i] = 0.019;
    o.a![i] = head ? 1 : 0.75;
  }
  return o;
};
const arrowPoint = (u: number, sag: Sag[]) => [960 + (A0[0] + (B0[0] - A0[0]) * u) * PX, 540 - (A0[1] + (B0[1] - A0[1]) * u + sagAt(u, sag)) * PX];
/* обложки, которые прилетают на стрелу, и прогиб, который они дают */
const MIS: { k: string; u: number; t: number; w: number; rot: number; dy: number; kk: number }[] = [
  { k: "asap", u: 0.56, t: ASAP - 0.1, w: 250, rot: 7, dy: -100, kk: 0.6 },
  { k: "abba", u: 0.33, t: S[26] + 0.6, w: 170, rot: -10, dy: -70, kk: 0.35 },
  { k: "nsync", u: 0.76, t: S[26] + 1.5, w: 170, rot: 9, dy: -80, kk: 0.3 },
  { k: "limahl", u: 0.17, t: S[26] + 2.4, w: 140, rot: -14, dy: -95, kk: 0.15 },
  { k: "salmon", u: 0.9, t: S[26] + 3.2, w: 140, rot: 12, dy: 150, kk: 0.15 },
];
const sagNow = (t: number): Sag[] => MIS.map((m) => ({ u: m.u, k: m.kk * clamp(spr(t, m.t + 0.15, 9, 4)) }));
/* годовые кольца: внутри 11–15, снаружи 26 */
const RANKV = (() => {
  const r = new Int32Array(N), c = [0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) r[i] = c[VER[i]]++;
  return r;
})();
const CNTV = [0, 1, 2, 3, 4].map((k) => VER.filter((v) => v === k).length);
const rings = (grow: number, spin: number, hl: number) => {
  const o = blank();
  const R0 = [0.62, 1.2, 1.75, 2.3, 3.0], R1 = [1.05, 1.62, 2.18, 2.88, 3.9];
  for (let i = 0; i < N; i++) {
    const k = VER[i], n = CNTV[k], r = RANKV[i];
    const vis = clamp(grow - k);
    const rad = R0[k] + (R1[k] - R0[k]) * Math.sqrt((r + 0.5) / n);
    const th = r * 2.39996 + spin * (1 - k * 0.1);
    o.p[i * 3] = Math.cos(th) * rad * (0.6 + 0.4 * vis);
    o.p[i * 3 + 1] = -0.1 + Math.sin(th) * rad * (0.6 + 0.4 * vis);
    o.p[i * 3 + 2] = 0;
    const c = rgb(VERC[k]);
    o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    o.s[i] = 0.022 + (k === 0 ? 0.012 : 0);
    o.a![i] = vis * (hl >= 0 ? (k === hl ? 1 : 0.4) : 0.92);
  }
  return o;
};
/* вдвоём: мягкое кольцо всех треков за скамейкой */
const duoRing = (t: number) => {
  const o = blank();
  for (let i = 0; i < N; i++) {
    const th = i * 2.39996 + t * 0.05, rr = 3.1 + (hash(i) - 0.5) * 0.9;
    o.p[i * 3] = Math.cos(th) * rr * 1.35;
    o.p[i * 3 + 1] = wy(560) + Math.sin(th) * rr * 0.85;
    o.p[i * 3 + 2] = -1.5;
    const c = rgb(VERC[VER[i]]);
    o.c[i * 3] = c[0]; o.c[i * 3 + 1] = c[1]; o.c[i * 3 + 2] = c[2];
    o.s[i] = 0.016;
    o.a![i] = 0.5;
  }
  return o;
};

/* ---------------------------------------------------------------- сценарий облака */
const C_ROOM = 4.7, C_TEEN = S[3] - 0.25, C_ALB = S[4] - 0.1, C_ALT = S[5] - 0.25, C_PIANO = S[8] - 0.2, C_HEAR = S[11] - 0.4, C_PL = S[15] - 0.2, C_ONE = S[17] - 0.2, C_BOOK = S[20] - 0.6, C_GRID = S[22] - 0.3, C_ARROW = S[23] - 0.3, C_RINGS = S[28] - 0.3, C_ROOM2 = S[31] - 0.2, C_DUO = S[32] - 0.2, C_END = S[36] + 1.9;
const SEGS: Seg[] = [
  { t: -5, f: (t) => recAt(4.45, 0.9, -0.15, 0.35 + t * 0.05) },
  { t: C_ROOM, f: (t) => roomHalo(t), d: 1.8, order: "in", arc: 0.6, mod: (t, D) => {
      const off = ph(t, OFF, OFF + 0.7);
      const b = (1 - off) * band(t, 3);
      for (let i = 0; i < N; i++) {
        D.s[i] *= 1 + b * 0.35;
        D.p[i * 3 + 1] -= off * 0.35 * (0.5 + hash(i));
        D.a![i] *= 1 - off * 0.55;
      }
    } },
  { t: C_TEEN, f: () => teenRing(wx(760), wy(560), 2.0), d: 1.2, order: "rand", arc: 0.4, mod: (t, D) => {
      const k = kick(t);
      for (let i = 0; i < N; i++) if (VER[i] === 0) D.s[i] *= 1 + k * 0.6;
    } },
  { t: C_ALB, f: (t) => teenGrooves(2.6, 0.2, 2.4, 0.55, t * 2.2), d: 1.2, order: "rand", arc: 0.3 },
  { t: C_ALT, f: (t) => altar(t), d: 1.4, order: "rand", arc: 0.3 },
  { t: C_PIANO, f: (t) => notes(t, pianoOn(t)), d: 0.9, order: "rand", arc: 0.2 },
  { t: C_HEAR, f: () => nebula(7, -3, 0), d: 1.6, order: "rand", arc: 0.4, mod: (t, D) => {
      // «то, что прежде проходило мимо»: тусклые точки проявляются
      const rise = ph(t, 58.2, 59.8);
      for (let i = 0; i < N; i++) if (hash(i * 4.4) < 0.35) D.a![i] *= 0.25 + 0.75 * rise;
    } },
  { t: C_PL, f: (t) => recAt(3.75, 2.05, -0.05, 0.8 + t * 0.05), d: 1.8, order: "out", arc: 0.5, mod: (t, D) => {
      const on = [ph(t, P11 - 0.1, P11 + 0.3), ph(t, P16 - 0.1, P16 + 0.3), 0, ph(t, P20 - 0.1, P20 + 0.3)];
      const any = ph(t, P11 - 0.2, P11 + 0.2);
      for (let i = 0; i < N; i++) {
        const s = SHELF[i];
        const lit = s <= 3 ? on[s] : 0;
        D.a![i] *= 1 - any * 0.75 + lit * 0.75 * (1 / 0.92);
        if (lit) D.s[i] *= 1 + lit * 0.5 + (s === 0 ? kick(t) * 0.4 : 0);
      }
    } },
  { t: C_ONE, f: () => oneDot(), d: 1.3, order: "rand", arc: 0.3 },
  { t: C_BOOK, f: (t) => stream(t), d: 1.4, order: "left", arc: 0.3 },
  { t: C_GRID, f: () => grid(), d: 1.6, order: "left", arc: 0.25 },
  { t: C_ARROW, f: () => arrow([]), d: 1.4, order: "left", arc: 0.25 },
  { t: ASAP - 0.4, f: (t) => arrow(sagNow(t)), d: 0.2, order: "rand", arc: 0 },
  { t: C_RINGS, f: (t) => rings(lerp(0.3, 5, ph(t, S[28], S[28] + 3.2)), t * 0.12, t > S[29] - 0.2 && t < S[30] + 0.4 ? 0 : -1), d: 1.6, order: "in", arc: 0.4 },
  { t: C_ROOM2, f: (t) => roomHalo(t), d: 1.4, order: "rand", arc: 0.4 },
  { t: C_DUO, f: (t) => duoRing(t), d: 1.6, order: "rand", arc: 0.4 },
  { t: C_END, f: (t) => recAt(3.75, 1.75, 0, 1.1 + t * 0.06), d: 2.0, order: "out", arc: 0.5, mod: (t, D) => {
      const k = kick(t);
      for (let i = 0; i < N; i++) D.s[i] *= 1 + k * 0.45;
    } },
];

/* три прожектора по очереди на «трёх разных … пианистов» */
function pianoOn(t: number) {
  return [0, 1, 2].map((j) => clamp(spr(t, THREE_ - 0.6 + j * 1.25, 10, 6)) * (1 - 0.6 * ph(t, S[9], S[9] + 0.8)));
}

/* ---------------------------------------------------------------- камера */
const CAM: CamKey[] = [
  [0, [0, 0, 7.4], [0.9, -0.15, 0]],
  [4.4, [0, 0, 9.2], [0.6, -0.1, 0]],
  [5.4, [0, 0, 12], [0, 0, 0]],
  [S[5] - 0.4, [0, 0, 12], [0, 0, 0]],
  [S[5] + 0.6, [0, 0.4, 12], [0, 0.2, 0]],
  [S[7] - 0.6, [0, 0.4, 12], [0, 0.2, 0]],
  [S[7] + 1.4, [0, 0.6, 9.6], [0, 0.6, 0]],
  [S[8] - 0.3, [0, 0.6, 9.6], [0, 0.6, 0]],
  [S[8] + 0.4, [0, 0, 12], [0, 0, 0]],
  [S[11] - 0.4, [0, 0, 12], [0, 0, 0]],
  [S[15] - 0.4, [0.6, 0.2, 10.6], [0, 0, 0]],
  [S[15] + 0.6, [0, 0, 12], [0, 0, 0]],
  [S[30] - 0.1, [0, 0, 12], [0, 0, 0]],
  [S[30] + 2.4, [0, -0.05, 3.4], [0, -0.1, 0]],
  [SE[30] - 0.6, [0, -0.05, 3.6], [0, -0.1, 0]],
  [S[31] - 0.3, [0, 0, 12], [0, 0, 0]],
];

/* ---------------------------------------------------------------- 3D-сцена */
const flameTex = (() => {
  let tx: THREE.CanvasTexture | null = null;
  return () => {
    if (tx) return tx;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 76, 2, 64, 70, 60);
    gr.addColorStop(0, "rgba(255,255,230,1)");
    gr.addColorStop(0.25, "rgba(255,210,120,.9)");
    gr.addColorStop(0.6, "rgba(255,140,40,.35)");
    gr.addColorStop(1, "rgba(255,120,30,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(64, 70, 34, 58, 0, 0, Math.PI * 2);
    g.fill();
    tx = new THREE.CanvasTexture(cv);
    return tx;
  };
})();
const Candle: React.FC<{ x: number; h: number; z: number; t: number; u: number }> = ({ x, h, z, t, u }) => (
  <group position={[x, -1.21, z]} scale={[1, Math.max(0.001, u), 1]}>
    <mesh position={[0, h / 2, 0]}>
      <cylinderGeometry args={[0.13, 0.14, h, 32]} />
      <meshStandardMaterial color="#efe3c8" roughness={0.55} emissive="#4a2c10" emissiveIntensity={0.35} />
    </mesh>
    <mesh position={[0, h + 0.2, 0.02]} scale={[1 + Math.sin(t * 13 + x) * 0.06, 1 + Math.sin(t * 9 + x * 3) * 0.1, 1]}>
      <planeGeometry args={[0.42, 0.7]} />
      <meshBasicMaterial map={flameTex()} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={u} />
    </mesh>
    <pointLight position={[0, h + 0.3, 0.45]} intensity={3.2 * u * (0.92 + Math.sin(t * 11 + x) * 0.08)} distance={6} color="#ffad55" />
  </group>
);
const CANDLES = [
  [-2.95, 0.55, 0.3], [-2.45, 1.05, 0.6], [-1.95, 0.7, 0.8], [1.95, 0.7, 0.8], [2.45, 1.05, 0.6], [2.95, 0.55, 0.3],
];

/* соседи в туманности — «устройство вещи» тонкими линиями */
const LINKS = (() => {
  const d = nebula(7, -3, 0);
  const pts: number[] = [];
  const idx = Array.from({ length: N }, (_, i) => i).filter((i) => hash(i * 2.7) < 0.28 && Math.abs(d.p[i * 3 + 2] + 0.5) < 2.2);
  for (let a = 0; a < idx.length; a++) {
    let best = -1, bd = 1e9;
    for (let b = 0; b < idx.length; b++) {
      if (a === b) continue;
      const i = idx[a], j = idx[b];
      const dd = (d.p[i * 3] - d.p[j * 3]) ** 2 + (d.p[i * 3 + 1] - d.p[j * 3 + 1]) ** 2 + (d.p[i * 3 + 2] - d.p[j * 3 + 2]) ** 2;
      if (dd < bd) { bd = dd; best = j; }
    }
    if (best >= 0 && bd < 1.0) pts.push(idx[a], best);
  }
  return pts;
})();
const Links: React.FC<{ D: DotData; op: number }> = ({ D, op }) => {
  const geom = useMemo(() => new THREE.BufferGeometry(), []);
  const pos = new Float32Array(LINKS.length * 3);
  LINKS.forEach((i, k) => {
    pos[k * 3] = D.p[i * 3]; pos[k * 3 + 1] = D.p[i * 3 + 1]; pos[k * 3 + 2] = D.p[i * 3 + 2];
  });
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={INK2} transparent opacity={op} />
    </lineSegments>
  );
};

const Stage: React.FC<{ t: number; tx: Record<string, THREE.Texture>; lbl: THREE.Texture | null; lblBlank: THREE.Texture | null }> = ({ t, tx, lbl, lblBlank }) => {
  const D = flowAt(SEGS, t);
  /* резкость: туманность расфокусирована, потом наводится слоями */
  const hear = t > C_HEAR - 0.5 && t < C_PL + 1.0;
  const focus = hear ? lerp(lerp(lerp(lerp(22, 12.5, inout(ph(t, 52.4, 53.4))), 16.5, inout(ph(t, 55.6, 56.8))), 13, inout(ph(t, 58.4, 59.6))), 6.5, inout(ph(t, 65.6, 68.4))) : 12;
  const aperture = hear ? lerp(2.2, 3.4, ph(t, 65.6, 68.4)) * (1 - ph(t, C_PL, C_PL + 1.0)) : 0;
  const linkOp = 0.22 * ph(t, 55.4, 56.6) * (1 - ph(t, 64.8, 66.2));
  /* пластинка из вступления */
  const openOp = 1 - ph(t, 4.6, 5.4);
  /* AC/DC: пластинка уходит из бороздок на алтарь */
  const albIn = ease(ph(t, C_ALB - 0.2, C_ALB + 0.6));
  const toAltar = inout(ph(t, C_ALT - 0.3, C_ALT + 0.9));
  const albOut = 1 - ph(t, S[8] - 0.5, S[8]);
  const albOn = t > C_ALB - 0.3 && t < S[8] + 0.1;
  const altOn = t > C_ALT - 0.4 && t < S[8] + 0.1;
  const armA = lerp(0.35, 0.95, ph(t, S[4] + 0.2, SE[4]));
  /* плейлисты: пластинка сайта; в паузе на этикетке — обложка Skillet */
  const plOp = ph(t, C_PL + 0.3, C_PL + 1.2) * (1 - ph(t, C_ONE - 0.2, C_ONE + 0.5));
  const skMix = ph(t, 77.4, 78.2);
  /* кольца → в центре этикетка с подростком */
  const ringLbl = ph(t, S[30] - 0.9, S[30] - 0.1) * (1 - ph(t, S[31] - 0.6, S[31]));
  /* финал: пластинка со старым альбомом */
  const fin = t > S[33] - 0.3 && t < C_END + 0.3;
  const drop = ease(ph(t, S[33] - 0.2, S[33] + 0.6));
  const endOp = ph(t, C_END + 0.6, C_END + 1.8);
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[2, 4, 6]} intensity={0.6} color="#ffe2c0" />
      <CamRig keys={CAM} t={t} drift={0.03} />
      {openOp > 0.001 ? (
        <group position={[0.9, -0.15, 0]}>
          <Record3D R={4.6} spin={0.35 + t * 0.05} label={tx["v5/now-label.png"]} labelK={0.3} opacity={openOp} />
        </group>
      ) : null}
      {openOp > 0.001 ? <Tonearm pos={[5.2, 3.3, 0.6]} a={0.35} scale={1.6} /> : null}
      {albOn ? (
        <Record3D
          R={lerp(2.4, 2.0, toAltar) * albIn}
          pos={[lerp(2.6, 0, toAltar), lerp(0.2, 0.7, toAltar), 0]}
          rot={[lerp(-0.55, 0, toAltar), 0, 0]}
          spin={t * lerp(2.2, 0.06, toAltar)}
          label={tx[cov("r1")]}
          labelK={0.42}
          opacity={albOut}
        />
      ) : null}
      {albOn && toAltar < 0.99 ? <Tonearm pos={[5.0, 2.3, 0.3]} a={armA} scale={1.4 * (1 - toAltar)} /> : null}
      {altOn ? (
        <group>
          <mesh position={[0, 0.7, -0.05]} scale={toAltar}>
            <ringGeometry args={[2.05, 2.25, 128]} />
            <meshStandardMaterial color="#c9a14a" metalness={0.8} roughness={0.3} emissive="#5a4010" emissiveIntensity={0.4} transparent opacity={albOut} />
          </mesh>
          <group position={[0, lerp(-1.4, 0, toAltar), 0]}>
            <mesh position={[0, -2.15, 0]}>
              <boxGeometry args={[6.6, 1.8, 1.8]} />
              <meshStandardMaterial color="#7a161c" roughness={0.72} transparent opacity={albOut} />
            </mesh>
            <mesh position={[0, -1.235, 0.02]}>
              <boxGeometry args={[6.8, 0.07, 1.95]} />
              <meshStandardMaterial color="#c9a14a" metalness={0.7} roughness={0.35} transparent opacity={albOut} />
            </mesh>
            <mesh position={[0, -1.85, 0.915]}>
              <planeGeometry args={[1.9, 1.2]} />
              <meshStandardMaterial color="#efe3c8" roughness={0.9} side={THREE.DoubleSide} transparent opacity={albOut} />
            </mesh>
            {CANDLES.map(([x, h, z], k) => (
              <Candle key={k} x={x} h={h} z={z} t={t} u={ease(ph(t, C_ALT + 0.3 + k * 0.12, C_ALT + 0.9 + k * 0.12)) * albOut} />
            ))}
          </group>
        </group>
      ) : null}
      {plOp > 0.001 ? (
        <group position={[2.05, -0.05, 0]}>
          <Record3D R={3.75 * 1.035} spin={0.8 + t * 0.05} label={lbl} label2={tx[cov("skillet")]} mix={skMix} opacity={plOp} />
        </group>
      ) : null}
      {ringLbl > 0.001 ? (
        <mesh position={[0, -0.1, 0.02]}>
          <circleGeometry args={[0.6, 96]} />
          <meshBasicMaterial map={tx["v5/r1-label.png"]} transparent opacity={ringLbl} />
        </mesh>
      ) : null}
      {ringLbl > 0.001 ? (
        <mesh position={[0, -0.1, 0.01]}>
          <circleGeometry args={[0.6, 96]} />
          <meshBasicMaterial color={PAPER} transparent opacity={ringLbl} />
        </mesh>
      ) : null}
      {fin ? (
        <Record3D R={2.3} pos={[lerp(8, 3.4, drop), -1.2, 0.5]} rot={[-0.75, 0, 0]} spin={t * 2.4 * ph(t, S[33] + 0.7, S[33] + 1.1)} label={tx[cov("hell")]} labelK={0.42} opacity={1 - ph(t, C_END - 0.3, C_END + 0.3)} />
      ) : null}
      {fin ? <Tonearm pos={[5.8, -0.4, 0.2]} a={lerp(-0.2, 0.5, ease(ph(t, S[33] + 0.2, S[33] + 0.7)))} lift={1 - ph(t, S[33] + 0.6, S[33] + 0.8)} scale={1.3 * (1 - ph(t, C_END - 0.3, C_END + 0.3))} /> : null}
      {endOp > 0.001 ? (
        <group position={[1.75, 0, 0]}>
          <Record3D R={3.88} spin={1.1 + t * 0.06} label={lblBlank} opacity={endOp} />
        </group>
      ) : null}
      {linkOp > 0.001 ? <Links D={D} op={linkOp} /> : null}
      <Dots data={D} stamp={t} focus={focus} aperture={aperture} maxBlur={70} />
    </>
  );
};

/* ---------------------------------------------------------------- коллаж поверх */
const pop = (t: number, t0: number, t1 = 1e9, k = 11) => clamp(spr(t, t0, k, 6)) * (1 - ph(t, t1, t1 + 0.35));
const Pop: React.FC<{ u: number; children: React.ReactNode; origin?: string }> = ({ u, children, origin = "50% 100%" }) =>
  u > 0.002 ? <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, u * 1.6), transform: `scale(${0.88 + 0.12 * u})`, transformOrigin: origin }}>{children}</div> : null;

const CutoutAt: React.FC<{ src: string; x: number; y: number; h: number; u: number; rot?: number; flip?: boolean; bob?: number; style?: React.CSSProperties }> = ({ src, x, y, h, u, rot = 0, flip, bob = 0, style }) =>
  u > 0.002 ? <Cutout src={src} x={x} y={y - bob} h={h * (0.9 + 0.1 * u)} rot={rot + (1 - u) * 6} flip={flip} opacity={Math.min(1, u * 1.5)} style={style} /> : null;

const CoverAt: React.FC<{ k: string; x: number; y: number; w: number; rot: number; u: number }> = ({ k, x, y, w, rot, u }) =>
  u > 0.002 ? (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: w, transform: `translate(-50%,-50%) rotate(${rot + (1 - u) * 18}deg) scale(${0.6 + 0.4 * u})`, opacity: Math.min(1, u * 2), boxShadow: "0 22px 40px rgba(0,0,0,.6)" }}>
      <Img src={staticFile(cov(k))} style={{ width: w, height: w, display: "block" }} />
      <div style={{ position: "absolute", left: w * 0.32, top: -w * 0.06, width: w * 0.36, height: w * 0.12, background: "rgba(239,231,218,.55)", transform: "rotate(-4deg)" }} />
    </div>
  ) : null;

const Rays: React.FC<{ op: number; t: number }> = ({ op, t }) =>
  op > 0.002 ? (
    <AbsoluteFill style={{ opacity: op, background: `repeating-conic-gradient(from ${t * 3}deg at 50% 36%, rgba(255,210,140,.07) 0deg 5deg, transparent 5deg 14deg)`, maskImage: "radial-gradient(circle at 50% 36%, #000 0, #000 30%, transparent 62%)", WebkitMaskImage: "radial-gradient(circle at 50% 36%, #000 0, #000 30%, transparent 62%)" }} />
  ) : null;

/* книга: страница — обложка на скотче и имя */
const PageC: React.FC<{ k?: string; title?: string; rot?: number }> = ({ k, title, rot = -4 }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,.08), transparent 12%), ${PAPER}`, padding: "64px 50px", color: PAPER_INK }}>
    {k ? (
      <>
        <div style={{ position: "relative", width: 300, height: 300, margin: "16px auto 0", transform: `rotate(${rot}deg)`, boxShadow: "0 14px 24px rgba(0,0,0,.28)" }}>
          <Img src={staticFile(cov(k))} style={{ width: 300, height: 300, display: "block" }} />
          <div style={{ position: "absolute", left: 100, top: -16, width: 110, height: 34, background: "rgba(255,250,235,.6)", transform: "rotate(-5deg)" }} />
        </div>
        <div style={{ font: `italic 500 66px/1 ${SERIF}`, marginTop: 50, textAlign: "center" }}>{title}</div>
      </>
    ) : (
      Array.from({ length: 14 }).map((_, i) => <div key={i} style={{ height: 2, margin: "26px 0", background: "rgba(42,36,32,.08)" }} />)
    )}
  </div>
);
const BOOK = [{}, { k: "nickel", title: "Nickelback" }, { k: "sp", title: "Бах" }, { k: "avant", title: "Лигети" }] as { k?: string; title?: string }[];
const Book: React.FC<{ t: number; u: number }> = ({ t, u }) => {
  if (u <= 0.002) return null;
  // перелистывания: пусто → Nickelback → Бах → Лигети
  const flips = [NB - 0.3, BACH - 0.3, AVANT - 0.3];
  const done = flips.filter((f) => t >= f + 0.7).length;
  const turning = flips.findIndex((f) => t >= f && t < f + 0.7);
  const W = 540, H = 680, cx = 1080, top = 110;
  const right = BOOK[turning >= 0 ? turning + 1 : done];
  const left = done === 0 && turning < 0 ? BOOK[0] : BOOK[Math.max(0, (turning >= 0 ? turning : done) - 1)];
  const front = turning >= 0 ? BOOK[turning] : null;
  return (
    <div style={{ position: "absolute", left: cx - W, top, width: 2 * W, height: H, perspective: 2600, perspectiveOrigin: "50% 40%", opacity: Math.min(1, u * 1.5), transform: `translateY(${(1 - u) * 60}px)` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: "rotateY(10deg)", transformOrigin: "100% 50%", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
        <PageC {...left} rot={-5} />
      </div>
      <div style={{ position: "absolute", left: W, top: 0, width: W, height: H, transform: "rotateY(-10deg)", transformOrigin: "0% 50%", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
        <PageC {...right} rot={4} />
      </div>
      {front ? (
        <div style={{ position: "absolute", left: W, top: 0, width: W, height: H, transform: `rotateY(${-10 - 160 * inout((t - flips[turning]) / 0.7)}deg)`, transformOrigin: "0% 50%" }}>
          <div style={{ position: "absolute", inset: 0, boxShadow: "-30px 20px 60px rgba(0,0,0,.45)" }}>
            <PageC {...front} rot={-3} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.25), transparent 40%, rgba(0,0,0,.12))" }} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* надпись-звук из TikTok: одним цветом, буквы качаются */
const Wobble: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  if (t < t0 - 0.01 || t > t1 + 0.3) return null;
  const text = "возьми телефоон деткаа";
  const out = 1 - ph(t, t1, t1 + 0.3);
  return (
    <div style={{ position: "absolute", left: 1150, top: 130, transform: "translate(-50%,-50%) rotate(-4deg)", whiteSpace: "nowrap", opacity: out }}>
      {[...text].map((ch, i) => (
        <span key={i} style={{ display: "inline-block", font: `italic 600 86px/1 ${SERIF}`, color: INK, transform: `translateY(${Math.sin(t * 8 + i * 0.7) * 9}px) rotate(${Math.sin(t * 5 + i * 1.3) * 4}deg) scale(${clamp(spr(t, t0 + i * 0.025, 14, 6))})`, minWidth: ch === " " ? 22 : undefined, textShadow: "0 0 18px rgba(12,11,13,.9)" }}>
          {ch}
        </span>
      ))}
    </div>
  );
};

/* ручка громкости — тонкое кольцо с делениями */
const Dial: React.FC<{ v: number; u: number }> = ({ v, u }) =>
  u > 0.002 ? (
    <svg viewBox="-150 -150 300 300" style={{ position: "absolute", left: 1500, top: 300, width: 300, height: 300, opacity: u }}>
      {Array.from({ length: 23 }).map((_, k) => {
        const a = ((-135 + k * 12.27) * Math.PI) / 180, on = k / 22 <= v;
        return <line key={k} x1={Math.sin(a) * 118} y1={-Math.cos(a) * 118} x2={Math.sin(a) * (k % 2 ? 128 : 136)} y2={-Math.cos(a) * (k % 2 ? 128 : 136)} stroke={on ? INK : INK3} strokeWidth={k % 2 ? 2 : 4} />;
      })}
      <circle r={96} fill="#141215" stroke="rgba(239,231,218,.22)" strokeWidth={2} />
      <line x1={0} y1={0} x2={Math.sin(((-135 + v * 270) * Math.PI) / 180) * 78} y2={-Math.cos(((-135 + v * 270) * Math.PI) / 180) * 78} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    </svg>
  ) : null;

const LECT: [string, number, number][] = [
  ["Бах", 1060, 230], ["Шостакович", 1500, 330], ["Райх", 900, 420], ["Пярт", 1380, 520], ["Лигети", 1120, 610], ["Шнитке", 1620, 650], ["Десятников", 1300, 170],
];
const COUNTS = CNTV;
const KEYS5 = ["r1", "r2", "su", "sp", "now"] as const;

const Front: React.FC<{ t: number }> = ({ t }) => {
  const k = kick(t);
  /* комната: пятеро, числа, обложки */
  const room = (t0: number, t1: number, j: number) => pop(t, t0 + j * 0.22, t1);
  const roomA = (j: number) => Math.max(room(C_ROOM + 0.5, S[3] - 0.5, j), room(C_ROOM2 + 0.3, S[32] - 0.1, j));
  const jost = ph(t, S[2] + 1.6, S[2] + 2.4) * (1 - ph(t, S[3] - 0.6, S[3] - 0.2));
  /* пианисты */
  const on = pianoOn(t);
  const sway = [Math.sin(t * 2 * Math.PI * 0.75) * 5 * on[0], Math.sin(t * 2 * Math.PI * 1.6) * 3.5 * on[1], Math.sin(t * 2 * Math.PI * 1.1) * 3 * on[2]];
  const lift = [0.5 + 0.5 * Math.sin(t * 9), 0.5 + 0.5 * Math.sin(t * 14 + 1), 0.5 + 0.5 * Math.sin(t * 11 + 2)];
  const stage = pop(t, S[8] + 0.2, S[10] - 0.4, 8);
  /* память: трек — обложка — полароид */
  const card = pop(t, S[17] + 0.4, S[20] - 1.2, 9);
  const drag = ease(ph(t, S[18] - 0.1, S[18] + 0.6)) - (t > S[18] + 1.1 ? clamp(spr(t, S[18] + 1.1, 9, 4.5)) : 0);
  const flip = inout(ph(t, S[19] - 0.2, S[19] + 0.6));
  const dev = ph(t, S[19] + 0.5, S[19] + 2.2);
  /* стрела */
  const sag = sagNow(t);
  const misOn = t > C_ARROW && t < C_RINGS + 0.4;
  const misOut = 1 - ph(t, C_RINGS - 0.2, C_RINGS + 0.4);
  return (
    <>
      {/* 1 · комната */}
      {KEYS5.map((v, j) => (
        <CutoutAt key={v} src={v} x={XS[j]} y={770} h={j === 0 ? 500 : 580} u={roomA(j) * (t > S[32] - 0.2 ? 1 - ph(t, S[32] - 0.2, S[32] + 0.4) : 1)} />
      ))}
      {KEYS5.map((v, j) => {
        const u = roomA(j);
        return u > 0.002 ? (
          <div key={v} style={{ position: "absolute", left: XS[j], top: 790, transform: "translateX(-50%)", textAlign: "center", opacity: u }}>
            <div style={{ font: `500 64px/1 ${SERIF}`, color: VERC[j], fontVariantNumeric: "lining-nums" }}>{COUNTS[j]}</div>
            <div style={{ font: `600 17px/1.4 ${SANS}`, letterSpacing: ".2em", color: INK2, marginTop: 6 }}>{VERL[j]}</div>
          </div>
        ) : null;
      })}
      {KEYS5.map((v, j) => (
        <CoverAt key={v} k={v} x={XS[j] + [40, 26, 0, -26, -40][j] + (960 - XS[j]) * 0.05 * jost + Math.sin(t * 17 + j) * 6 * jost} y={[132, 118, 110, 118, 128][j]} w={170} rot={[-9, 6, -3, 8, -6][j]} u={pop(t, S[2] + 1.0 + j * 0.13, S[3] - 0.5)} />
      ))}
      {/* 2 · подросток */}
      <CutoutAt src="r1-headbang" x={lerp(760, 470, ph(t, C_ALB, C_ALB + 0.8))} y={1020} h={lerp(760, 620, ph(t, C_ALB, C_ALB + 0.8))} u={pop(t, C_TEEN + 0.1, C_ALT - 0.3)} rot={-3 + k * 6} bob={k * 18} />
      <Rays op={ph(t, C_ALT + 0.2, C_ALT + 1.2) * (1 - ph(t, S[8] - 0.5, S[8]))} t={t} />
      <CutoutAt src="r1-headbang" x={1560} y={1000} h={600} u={pop(t, C_ALT + 0.4, S[8] - 0.4)} rot={4 + k * 3} flip bob={k * 8} />
      {/* 3 · соната, подросток в дверях, зеркало */}
      <Pop u={stage}>
        <PianoStage x={470} y={150} w={1420} t={t} on={on.map((x) => 0.25 + 0.75 * x)} sway={sway} lift={lift} />
      </Pop>
      <CutoutAt src="now-explain" x={260} y={1090} h={700} u={pop(t, S[8] + 0.1, S[10] - 0.3)} bob={Math.sin(t * 6) * 4 * loud(t)} />
      <CutoutAt src="r1-peek" x={lerp(2100, 1760, ease(ph(t, S[9] + 0.1, S[9] + 0.8))) + ease(ph(t, SE[9] - 0.4, SE[9] + 0.4)) * 260} y={1090} h={700} u={pop(t, S[9] + 0.05, S[10] - 0.2)} flip />
      {(() => {
        const u = pop(t, S[10] - 0.2, S[11] - 0.4, 9);
        if (u <= 0.002) return null;
        return (
          <div style={{ position: "absolute", inset: 0, opacity: u }}>
            <div style={{ position: "absolute", left: 1300 - 240, top: 470 - 420, width: 480, height: 840, borderRadius: "50%", overflow: "hidden", background: "radial-gradient(ellipse at 40% 30%, #2a2a36, #121218)" }}>
              <Cutout src="r1" x={240} y={900} h={720} flip shadow={false} style={{ filter: "saturate(.7) brightness(.85) hue-rotate(-10deg)", opacity: 0.85 * ph(t, S[10] + 0.3, S[10] + 1.2) }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,.14), transparent 40%, rgba(255,255,255,.06))" }} />
            </div>
            <div style={{ position: "absolute", left: 1300 - 258, top: 470 - 438, width: 516, height: 876, borderRadius: "50%", border: "18px solid #c69a4c", boxShadow: "0 0 0 4px #8a6427, 0 30px 60px rgba(0,0,0,.6)" }} />
            <Cutout src="now" x={640} y={1060} h={900} />
          </div>
        );
      })()}
      {/* 4 · слух и тишина */}
      <CutoutAt src="now-listen" x={1430} y={1110} h={840} u={pop(t, S[11] + 0.2, C_PL + 0.3, 8)} />
      {/* 5 · плейлисты: подписи колец */}
      {(() => {
        const u = ph(t, S[16] + 0.6, S[16] + 1.4) * (1 - ph(t, C_ONE - 0.3, C_ONE + 0.3));
        if (u <= 0.002) return null;
        const rec = siteRecord(3.75, 0);
        const cx = 960 + 2.05 * PX, cy = 540 + 0.05 * PX;
        const lit = [P11, P16, -1, P20];
        return rec.bands.map((b, s) => {
          if (!b || s > 5) return null;
          const a = ((-80 + s * 32) * Math.PI) / 180, lr = (b[0] + b[1]) / 2;
          const on = s <= 3 && lit[s] > 0 ? ph(t, lit[s] - 0.1, lit[s] + 0.3) : 0;
          return (
            <div key={s} style={{ position: "absolute", left: cx + lr * Math.cos(a) * PX, top: cy + lr * Math.sin(a) * PX, transform: `translate(-50%,-50%) scale(${1 + on * 0.25})`, background: "rgba(12,11,13,.82)", color: INK, padding: "5px 15px", borderRadius: 99, border: `1px solid ${on ? AGEC[s] : "rgba(239,231,218,.14)"}`, font: `500 ${19 + on * 4}px/1.2 ${SANS}`, letterSpacing: ".04em", opacity: u * (0.55 + 0.45 * Math.max(on, t < P11 ? 1 : 0)) }}>
              {AGEL[s]}
            </div>
          );
        });
      })()}
      {/* 6 · трек: обложка, которую не удалить, — и полароид */}
      {card > 0.002 ? (
        <div style={{ position: "absolute", left: 960 + drag * 760, top: 470, width: 420, height: 420, transform: `translate(-50%,-50%) rotate(${drag * 14}deg) scale(${(0.7 + 0.3 * card) * (1 - drag * 0.1)})`, opacity: Math.min(1, card * 1.6), perspective: 1800 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${flip * 180}deg)` }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
              <Img src={staticFile(cov("skip"))} style={{ width: 420, height: 420, display: "block" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: -26, height: 4, background: "rgba(239,231,218,.16)", borderRadius: 2 }}>
                <div style={{ width: `${lerp(8, 38, ph(t, S[17] + 0.4, S[18]))}%`, height: 4, background: AGEC[1], borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ position: "absolute", left: -20, top: -30, width: 460, height: 540, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#fbf8f1", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
              <div style={{ position: "absolute", left: 24, top: 24, width: 412, height: 412, overflow: "hidden", background: "linear-gradient(#9ed0e6, #f3e1b3 70%, #e9c98f)" }}>
                <Cutout src="r2" x={206} y={760} h={700} shadow={false} style={{ filter: `sepia(${0.5 - dev * 0.3}) saturate(${0.5 + dev * 0.5})` }} />
                <div style={{ position: "absolute", inset: 0, background: "#33403f", opacity: Math.pow(1 - dev, 1.4) }} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* 7 · биография */}
      <Book t={t} u={pop(t, S[20] - 0.2, S[22] - 0.6, 8)} />
      {(() => {
        const u = pop(t, KW.half - 0.3, S[23] - 0.5, 9);
        return u > 0.002 ? (
          <div style={{ position: "absolute", left: 120, top: 330, opacity: u }}>
            <div style={{ font: `500 200px/.9 ${SERIF}`, color: VERC[4], fontVariantNumeric: "lining-nums" }}>{ACAD_SHARE}%</div>
          </div>
        ) : null;
      })()}
      {/* 8 · стрела и то, чему в ней не место */}
      {misOn
        ? MIS.map((m) => {
            const [x, y] = arrowPoint(m.u, sag);
            return <CoverAt key={m.k} k={m.k} x={x + 10} y={y + m.dy} w={m.w} rot={m.rot} u={pop(t, m.t, 1e9) * misOut} />;
          })
        : null}
      {(() => {
        const u = pop(t, S[25] - 0.4, S[27] + 0.6, 9);
        if (u <= 0.002) return null;
        return (
          <div style={{ position: "absolute", left: 1540, top: 150 + (1 - u) * 80, width: 210, height: 420, borderRadius: 34, background: "#17151a", boxShadow: "0 0 0 2px rgba(239,231,218,.18), 0 30px 60px rgba(0,0,0,.6)", transform: `rotate(${8 + Math.sin(t * 40) * 1.5 * ph(t, TIK - 0.1, TIK + 0.1) * (1 - ph(t, TIK + 1.2, TIK + 1.5))}deg)`, overflow: "hidden", opacity: u }}>
            <Img src={staticFile(cov("tiktok"))} style={{ position: "absolute", left: 14, top: 60, width: 182, height: 182, borderRadius: 10 }} />
            <div style={{ position: "absolute", left: 18, top: 262, font: `600 18px/1.25 ${SANS}`, color: INK }}>
              {T.tiktok.track}
              <div style={{ color: INK3, fontSize: 14, fontWeight: 500 }}>{T.tiktok.artist}</div>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, top: 340, height: 4, borderRadius: 2, background: "rgba(239,231,218,.18)" }}>
              <div style={{ width: `${lerp(18, 40, ph(t, TIK - 1, TIK + 2))}%`, height: 4, borderRadius: 2, background: INK }} />
            </div>
          </div>
        );
      })()}
      <Wobble t={t} t0={TIK - 0.05} t1={TIK + 2.3} />
      {/* 9 · вдвоём, старый альбом, рассказ, припев */}
      <CutoutAt src="duo-sit" x={lerp(960, 720, ph(t, S[33] - 0.2, S[33] + 0.6))} y={980} h={760} u={pop(t, S[32] - 0.1, S[34] - 0.3, 8)} />
      <CutoutAt src="now-explain" x={520} y={1090} h={760} u={pop(t, S[34] - 0.1, S[35] - 0.1)} bob={Math.sin(t * 6) * 4 * loud(t)} />
      {LECT.map(([w, x, y], j) => {
        const u = pop(t, S[34] + 0.3 + j * 0.32, 1e9, 10);
        const blow = ph(t, S[35] - 0.1, S[35] + 0.8);
        if (u <= 0.002 || blow >= 1) return null;
        return (
          <div key={w} style={{ position: "absolute", left: x + (x - 960) * blow * 1.6, top: y - blow * 200 * hash(j), transform: "translate(-50%,-50%)", font: `italic 500 52px/1 ${SERIF}`, color: INK, opacity: Math.min(1, u * 1.5) * (1 - blow) * 0.92 }}>
            {w}
          </div>
        );
      })}
      <CutoutAt src="r1-headbang" x={700} y={1030} h={720} u={pop(t, S[35] - 0.05, C_END + 0.8)} rot={-3 + k * 6} bob={k * 20} />
      <CutoutAt src="now" x={1120} y={1050} h={860} u={pop(t, S[35] + 0.1, C_END + 0.8)} rot={k * 2.5} bob={k * 10} />
      <Dial v={ease(ph(t, S[36] + 0.2, LOUD + 0.4))} u={pop(t, S[36] - 0.1, C_END + 0.6, 9)} />
      {/* финальный титр */}
      {(() => {
        const u = ph(t, C_END + 1.6, C_END + 3.0) * (1 - ph(t, END - 1.4, END - 0.4));
        return u > 0.002 ? (
          <div style={{ position: "absolute", left: 120, top: 330, width: 640, opacity: u }}>
            <H2 size={128} style={{ lineHeight: 0.92 }}>моя музыкальная эволюция</H2>
          </div>
        ) : null;
      })()}
    </>
  );
};

/* ---------------------------------------------------------------- титры */
const SENTS = (() => {
  const by: { si: number; words: [string, number, number][] }[] = [];
  WORD.forEach(([w, t0, t1, si]) => {
    let s = by.find((x) => x.si === si);
    if (!s) by.push((s = { si, words: [] }));
    s.words.push([w, t0, t1]);
  });
  return by;
})();
const CAPPOS = (t: number): React.CSSProperties => {
  if (t > S[8] - 0.2 && t < S[10] - 0.2) return { left: 580, maxWidth: 1180 };
  if (t > S[11] - 0.4 && t < S[15] - 0.3) return { left: 120, maxWidth: 1000 };
  return {};
};
const CAPCOL = (t: number) => (t < S[3] - 0.3 ? INK2 : t < S[8] - 0.3 ? AGEC[0] : t < S[17] - 0.3 ? VERC[4] : t < S[20] - 0.3 ? AGEC[1] : t < S[31] - 0.3 ? VERC[4] : INK2);
const Subs: React.FC<{ t: number }> = ({ t }) => {
  const k = SENTS.findIndex((s, j) => {
    const next = SENTS[j + 1];
    const a = s.words[0][1] - 0.15, b = Math.min(s.words[s.words.length - 1][2] + 0.9, next ? next.words[0][1] - 0.2 : 1e9);
    return t >= a && t <= b;
  });
  if (k < 0) return null;
  const s = SENTS[k];
  const a = s.words[0][1] - 0.15;
  const next = SENTS[k + 1];
  const b = Math.min(s.words[s.words.length - 1][2] + 0.9, next ? next.words[0][1] - 0.2 : 1e9);
  const op = ph(t, a, a + 0.25) * (1 - ph(t, b - 0.2, b));
  return (
    <div style={{ opacity: op }}>
      <Epi words={s.words.map(([w, t0]) => ({ w, on: ph(t, t0 - 0.05, t0 + 0.12) }))} color={CAPCOL(t)} cite="" size={44} style={CAPPOS(t)} />
    </div>
  );
};

/* ---------------------------------------------------------------- фильм */
const TEX = ["v5/now-label.png", "v5/r1-label.png", cov("r1"), cov("skillet"), cov("hell")];
export const Film5: React.FC<Film5Props> = ({ subtitles, at }) => {
  const frame = useCurrentFrame();
  const t = at ? at[Math.min(frame, at.length - 1)] : frame / FPS;
  const tx = useTextures(TEX);
  const lbl = useSiteLabel("Одна вещь", "СТОРОНА А", "4334 · 33⅓");
  const lblBlank = useSiteLabel("", "СТОРОНА А", "4334 · 33⅓");
  const warm = 0.04 * ph(t, C_ALT, C_ALT + 1) * (1 - ph(t, S[8] - 0.5, S[8])) + 0.03 * ph(t, C_DUO, C_DUO + 1);
  const fadeOut = ph(t, END - 1.6, END - 0.2);
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 55% 45%, rgba(255,220,170,${0.05 + warm}), transparent 70%)` }} />
      {tx && lbl && lblBlank ? (
        <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} camera={{ position: [0, 0, 12], fov: FOV, near: 0.1, far: 200 }} gl={{ alpha: true, antialias: true }}>
          <Stage t={t} tx={tx} lbl={lbl} lblBlank={lblBlank} />
        </ThreeCanvas>
      ) : null}
      <Front t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("paper.png")})`, backgroundSize: "512px", opacity: 0.05, mixBlendMode: "screen", pointerEvents: "none" }} />
      {subtitles ? <Subs t={t} /> : null}
      <AbsoluteFill style={{ background: BG, opacity: fadeOut, pointerEvents: "none" }} />
      {at ? null : <Audio src={staticFile("film-audio.m4a")} />}
    </AbsoluteFill>
  );
};
