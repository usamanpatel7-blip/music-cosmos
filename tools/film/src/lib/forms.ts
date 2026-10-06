import { ACAD, AGE, BYVER, KEY, MINI, N, POR, RANK_IN_VER, VER, Ver, hash, NAMES } from "./data";

/* Форма облака: где стоит каждая из 4334 бусин, какого она цвета и размера.
   Мир: высота кадра ≈ 10 единиц при камере на z = 12. */
export type Form = { p: Float32Array; c: Float32Array; s: Float32Array };
export type P = { x: number; y: number; z: number; r: number; g: number; b: number; s: number };

export const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
const AGERGB = AGE.map(rgb);

export const build = (fn: (i: number, o: P) => void): Form => {
  const f: Form = { p: new Float32Array(N * 3), c: new Float32Array(N * 3), s: new Float32Array(N) };
  const o: P = { x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, s: 0.04 };
  for (let i = 0; i < N; i++) {
    o.x = 0; o.y = 0; o.z = 0; o.r = 1; o.g = 1; o.b = 1; o.s = 0.04;
    fn(i, o);
    f.p[i * 3] = o.x; f.p[i * 3 + 1] = o.y; f.p[i * 3 + 2] = o.z;
    f.c[i * 3] = o.r; f.c[i * 3 + 1] = o.g; f.c[i * 3 + 2] = o.b;
    f.s[i] = o.s;
  }
  return f;
};
const memo = new Map<string, Form>();
export const cached = (key: string, make: () => Form) => {
  let f = memo.get(key);
  if (!f) memo.set(key, (f = make()));
  return f;
};
export const setAge = (o: P, k: number, mul = 1) => {
  const c = AGERGB[k];
  o.r = c[0] * mul; o.g = c[1] * mul; o.b = c[2] * mul;
};
/* спрятать бусину: улетает в сторону и сжимается в ноль */
export const hide = (i: number, o: P, R = 14) => {
  const a = hash(i) * Math.PI * 2, b = hash(i + 7) * 2 - 1;
  o.x = Math.cos(a) * R; o.y = b * R * 0.6; o.z = Math.sin(a) * R - 6; o.s = 0;
};

/* ---- портрет версии из всех 4334 треков (стипплинг) */
export const portrait = (v: Ver, o: { x?: number; y?: number; z?: number; h?: number; depth?: number; tint?: number; dark?: boolean } = {}) => {
  const { x = 0, y = 0, z = 0, h = 8.6, depth = 0.9, tint = 0, dark = false } = o;
  return cached(`por:${v}:${x}:${y}:${z}:${h}:${depth}:${tint}:${dark}`, () => {
    const P0 = POR[v];
    const tc = AGERGB[NAMES.indexOf(v)];
    return build((i, q) => {
      const X = P0.xy[i * 2], Y = P0.xy[i * 2 + 1];
      let r = P0.rgb[i * 3], g = P0.rgb[i * 3 + 1], b = P0.rgb[i * 3 + 2];
      const lum = 0.3 * r + 0.59 * g + 0.11 * b;
      if (dark && lum < 0.34) {
        // на тёмной бумаге контур рисуется светлым, как мелом
        const k = lum / 0.34;
        r = 0.97 + (r - 0.97) * k; g = 0.93 + (g - 0.93) * k; b = 0.85 + (b - 0.85) * k;
      }
      q.x = x + (X / 1000) * h;
      q.y = y + h / 2 - (Y / 1000) * h;
      q.z = z + (lum - 0.55) * depth + (hash(i + 3) - 0.5) * 0.12;
      q.r = r + (tc[0] - r) * tint; q.g = g + (tc[1] - g) * tint; q.b = b + (tc[2] - b) * tint;
      q.s = 0.041 * (h / 8.6);
    });
  });
};

/* ---- пять мини-портретов: у каждой версии ровно её треки (104 … 1741) */
export const XS5 = [-6.4, -3.2, 0, 3.2, 6.4];
export const miniRow = (o: { y?: number; h?: number; xs?: number[]; z?: number } = {}) => {
  const { y = 0.3, h = 3.6, xs = XS5, z = 0 } = o;
  return cached(`mini:${y}:${h}:${xs.join(",")}:${z}`, () =>
    build((i, q) => {
      const k = VER[i];
      const M = MINI[NAMES[k]];
      const r = RANK_IN_VER[i] % M.n;
      const X = M.xy[r * 2], Y = M.xy[r * 2 + 1];
      q.x = xs[k] + (X / 1000) * h;
      q.y = y + h / 2 - (Y / 1000) * h;
      q.z = z + (hash(i) - 0.5) * 0.2;
      q.r = M.rgb[r * 3]; q.g = M.rgb[r * 3 + 1]; q.b = M.rgb[r * 3 + 2];
      q.s = 0.041 * (h / 8.6) * Math.sqrt(4334 / M.n) * 0.85;
    }),
  );
};

/* ---- пластинка: дорожки от края к центру в порядке лет (снаружи 11–15) */
const ORDER = (() => {
  const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => VER[a] - VER[b] || hash(a) - hash(b));
  const rank = new Int32Array(N);
  idx.forEach((i, r) => (rank[i] = r));
  return rank;
})();
export const record = (o: { x?: number; y?: number; z?: number; r0?: number; r1?: number; tilt?: number; spin?: number; turns?: number; color?: (i: number, q: P, u: number) => void; s?: number; roll?: number }) => {
  const { x = 0, y = 0, z = 0, r0 = 1.2, r1 = 4.6, tilt = 1.1, spin = 0, turns = 26, color, s = 0.05, roll = 0 } = o;
  const ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
  return build((i, q) => {
    const u = ORDER[i] / N;
    const r = r1 - u * (r1 - r0);
    const a = u * Math.PI * 2 * turns + spin;
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    // наклон диска к камере вокруг оси X, затем крен вокруг Z
    const yy = -pz * st, zz = pz * ct;
    q.x = x + px * cr - yy * sr;
    q.y = y + px * sr + yy * cr;
    q.z = z + zz;
    q.s = s;
    if (color) color(i, q, u);
    else setAge(q, VER[i]);
  });
};

/* ---- витраж-роза: кольца ячеек, 12-кратная симметрия, свинцовые перемычки */
export const rose = (o: { x?: number; y?: number; z?: number; R?: number; spin?: number; glow?: number }) => {
  const { x = 0, y = 0, z = 0, R = 4.4, spin = 0, glow = 1 } = o;
  const pal = ["#e8402e", "#f7b733", "#2f6fd6", "#1fa38e", "#f7d35c", "#c2304a", "#5f8dff"].map(rgb);
  const lead = rgb("#2a2326");
  // кольца: радиус и число бусин пропорционально длине окружности
  const rings: [number, number][] = [];
  let total = 0;
  for (let r = 0.18; r <= R; r += 0.105) {
    const n = Math.max(6, Math.round((2 * Math.PI * r) / 0.105));
    rings.push([r, n]);
    total += n;
  }
  const scale = total / N;
  return build((i, q) => {
    let k = Math.floor(i * scale), j = 0;
    while (j < rings.length - 1 && k >= rings[j][1]) k -= rings[j++][1];
    const [r, n] = rings[j];
    const th = (k / n) * Math.PI * 2 + spin * (j % 2 ? 1 : -1) * 0.3;
    q.x = x + Math.cos(th + spin) * r;
    q.y = y + Math.sin(th + spin) * r;
    q.z = z + (r / R) * -0.6;
    const u = r / R;
    const band = Math.floor(u * 7);
    const sec = Math.floor((((th / (Math.PI * 2)) * 12) % 12 + 12) % 12);
    const local = ((th / (Math.PI * 2)) * 12) % 1;
    const sym = Math.min(local, 1 - local); // зеркально внутри сектора
    const isLead = Math.abs(u * 7 - band - 0.5) > 0.4 || sym < 0.035;
    const c = isLead ? lead : pal[(band * 3 + (sym < 0.22 ? 0 : 1) + (sec % 2) * 2) % pal.length];
    const m = isLead ? 1 : glow;
    q.r = c[0] * m; q.g = c[1] * m; q.b = c[2] * m;
    q.s = isLead ? 0.035 : 0.052;
  });
};

/* ---- облако-галактика (свободный полёт) */
export const scatter = (o: { R?: number; z?: number; colorBy?: "age" | "white" } = {}) => {
  const { R = 9, z = -2, colorBy = "age" } = o;
  return cached(`sc:${R}:${z}:${colorBy}`, () =>
    build((i, q) => {
      const a = hash(i) * Math.PI * 2, b = Math.acos(2 * hash(i + 11) - 1), r = R * Math.cbrt(hash(i + 23));
      q.x = Math.cos(a) * Math.sin(b) * r * 1.4;
      q.y = Math.cos(b) * r * 0.7;
      q.z = z + Math.sin(a) * Math.sin(b) * r;
      if (colorBy === "age") setAge(q, VER[i]);
      q.s = 0.045;
    }),
  );
};

/* ---- только избранные бусины (например, AC/DC), остальные спрятаны */
export const only = (keep: (i: number) => boolean, place: (i: number, q: P, k: number) => void) => {
  let k = 0;
  return build((i, q) => {
    if (keep(i)) place(i, q, k++);
    else hide(i, q);
  });
};

export { ACAD, KEY, BYVER };

/* ================================================================ формы глав 4–11 */
import { AV, DUO, FIRST, POR as POR2 } from "./data";

/* портрет из части бусин: pick(i) решает, кто участвует; остальные — куда скажут */
export const portraitPart = (v: Ver | "duo", pick: (i: number) => boolean, o: { x?: number; y?: number; h?: number; flip?: boolean; dark?: boolean; rest?: (i: number, q: P) => void; s?: number } = {}) => {
  const { x = 0, y = 0, h = 7, flip = false, dark = false, rest, s } = o;
  const P0 = v === "duo" ? DUO : POR2[v];
  let k = 0;
  const cnt = (() => {
    let c = 0;
    for (let i = 0; i < N; i++) if (pick(i)) c++;
    return c;
  })();
  const step = P0.n / cnt;
  return build((i, q) => {
    if (!pick(i)) {
      if (rest) rest(i, q);
      else hide(i, q);
      return;
    }
    const j = Math.min(P0.n - 1, Math.floor(k++ * step));
    let r = P0.rgb[j * 3], g = P0.rgb[j * 3 + 1], b = P0.rgb[j * 3 + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    if (dark && lum < 0.34) {
      const kk = lum / 0.34;
      r = 0.97 + (r - 0.97) * kk; g = 0.93 + (g - 0.93) * kk; b = 0.85 + (b - 0.85) * kk;
    }
    const X = P0.xy[j * 2] * (flip ? -1 : 1);
    q.x = x + (X / 1000) * h;
    q.y = y + h / 2 - (P0.xy[j * 2 + 1] / 1000) * h;
    q.z = (lum - 0.55) * 0.6 + (hash(i) - 0.5) * 0.1;
    q.r = r; q.g = g; q.b = b;
    q.s = s ?? 0.041 * (h / 8.6) * Math.sqrt(P0.n / cnt) * 0.95;
  });
};

/* три пластинки одной сонаты — каждая крутится в своём темпе */
export const triRecord = (t: number, o: { y?: number; spins?: number[]; colors?: string[] } = {}) => {
  const { y = 0, spins = [1.0, 1.32, 0.78], colors = ["#c77dff", "#9b6bff", "#e2a6ff"] } = o;
  const cs = colors.map(rgb), dark = rgb("#2b2733");
  return build((i, q) => {
    const k = i % 3, m = Math.floor(i / 3), n = Math.ceil(N / 3);
    const u = m / n;
    const r = 1.75 - u * 1.25;
    const a = u * Math.PI * 2 * 18 + t * spins[k] * 2.4;
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    const tilt = 0.95;
    q.x = (k - 1) * 4.3 + px;
    q.y = y - pz * Math.sin(tilt);
    q.z = pz * Math.cos(tilt);
    const label = u > 0.84;
    const c = label ? cs[k] : Math.floor(u * 14) % 2 ? dark : cs[k];
    const mm = label ? 1 : Math.floor(u * 14) % 2 ? 1 : 0.55;
    q.r = c[0] * mm; q.g = c[1] * mm; q.b = c[2] * mm;
    q.s = 0.048;
  });
};

/* 3D-ландшафт звука: 24 полосы × 180 шагов назад по времени фонограммы */
export const terrain = (t: number, bandAt: (tt: number, b: number) => number, o: { calm?: number; amp?: number } = {}) => {
  const { calm = 0, amp = 2.2 } = o;
  const ROWS = 24, COLS = Math.floor(N / ROWS);
  const lo = rgb("#5f8dff"), mid = rgb("#c77dff"), hi = rgb("#ffb52e");
  return build((i, q) => {
    const row = i % ROWS, col = Math.floor(i / ROWS);
    if (col >= COLS) return hide(i, q);
    const bf = (row / (ROWS - 1)) * 11;
    const b0 = Math.floor(bf), bw = bf - b0;
    const tt = t - (COLS - col) * (1 / 24);
    const v = bandAt(tt, b0) * (1 - bw) + bandAt(tt, Math.min(11, b0 + 1)) * bw;
    const wave = 0.35 * Math.sin(col * 0.08 + t * 1.2 + row * 0.3);
    const hgt = (v * amp) * (1 - calm) + wave * calm;
    q.x = (col / COLS - 0.5) * 16;
    q.z = (row / (ROWS - 1) - 0.5) * 6;
    q.y = -1.6 + hgt;
    const u = Math.min(1, Math.max(0, hgt / amp));
    const c = u < 0.5 ? [lo[0] + (mid[0] - lo[0]) * u * 2, lo[1] + (mid[1] - lo[1]) * u * 2, lo[2] + (mid[2] - lo[2]) * u * 2] : [mid[0] + (hi[0] - mid[0]) * (u - 0.5) * 2, mid[1] + (hi[1] - mid[1]) * (u - 0.5) * 2, mid[2] + (hi[2] - mid[2]) * (u - 0.5) * 2];
    q.r = c[0]; q.g = c[1]; q.b = c[2];
    q.s = 0.05;
  });
};

/* шесть полок-столбиков: настоящие числа треков по возрастам */
export const SHELF_X = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25];
export const SHELF_LABEL = ["11–15", "16–18", "19", "20–21", "22–24", "сейчас"];
const SHELF_RANK = (() => {
  const r = new Int32Array(N), c = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) r[i] = c[FIRST[i]]++;
  return r;
})();
export const SHELF_COL = ["#ff5a3c", "#ffb52e", "#c6e84a", "#34d6b8", "#5f8dff", "#c77dff"];
export const shelves = (heights: (g: number) => number = () => 1, o: { dim?: (g: number) => number; y0?: number } = {}) => {
  const { dim = () => 1, y0 = -3.2 } = o;
  const cols = SHELF_COL.map(rgb);
  return build((i, q) => {
    const g = Math.min(5, FIRST[i]);
    const r = SHELF_RANK[i];
    const W = 12; // бусин в слое (4×3 в глубину)
    const layer = Math.floor(r / W), cell = r % W;
    const cx = (cell % 4) - 1.5, cz = Math.floor(cell / 4) - 1;
    q.x = SHELF_X[g] + cx * 0.42;
    q.z = cz * 0.42;
    q.y = y0 + layer * 0.027 * heights(g);
    const c = cols[g], m = dim(g);
    q.r = c[0] * m + 0.12 * (1 - m); q.g = c[1] * m + 0.11 * (1 - m); q.b = c[2] * m + 0.1 * (1 - m);
    q.s = 0.11;
  });
};

/* лестница биографии: пять ступеней-версий слева направо */
export const STEP_X = [-6, -3, 0, 3, 6];
export const stairs = (hl: (i: number) => number = () => 0) => {
  const cols = AGE.map(rgb), gold = rgb("#ffd257");
  return build((i, q) => {
    const k = VER[i], r = RANK_IN_VER[i];
    const W = 16; // 4×4 в глубину
    const layer = Math.floor(r / W), cell = r % W;
    const cx = (cell % 4) - 1.5, cz = Math.floor(cell / 4) - 1.5;
    q.x = STEP_X[k] + cx * 0.5;
    q.z = cz * 0.5;
    q.y = -3.4 + k * 0.85 + layer * 0.024;
    const h = hl(i);
    const c = cols[k];
    q.r = c[0] + (gold[0] - c[0]) * h; q.g = c[1] + (gold[1] - c[1]) * h; q.b = c[2] + (gold[2] - c[2]) * h;
    q.s = 0.14 + h * 0.05;
  });
};

/* 3D-пирог: академическое (55%) против всего остального */
export const pie = (o: { spin?: number; split?: number } = {}) => {
  const { spin = 0, split = 0.4 } = o;
  const ac = rgb("#c77dff"), ot = rgb("#ffb52e");
  const nA = ACAD.reduce((a, b) => a + b, 0);
  const frac = nA / N;
  let ka = 0, ko = 0;
  return build((i, q) => {
    const isA = ACAD[i] === 1;
    const idx = isA ? ka++ : ko++;
    const cnt = isA ? nA : N - nA;
    const u = (idx + 0.5) / cnt;
    const a0 = isA ? 0 : frac * Math.PI * 2, span = (isA ? frac : 1 - frac) * Math.PI * 2;
    const layer = idx % 5;
    const rr = Math.sqrt(hash(idx * 3.1 + (isA ? 0 : 9))) * 3.6;
    const a = a0 + (hash(idx * 7.7 + (isA ? 1 : 5)) * span);
    const mid = a0 + span / 2;
    const off = split;
    void u;
    q.x = Math.cos(a + spin) * rr + Math.cos(mid + spin) * off;
    q.z = Math.sin(a + spin) * rr + Math.sin(mid + spin) * off;
    q.y = -0.8 + layer * 0.16 + (isA ? 0.35 : 0);
    const c = isA ? ac : ot;
    q.r = c[0]; q.g = c[1]; q.b = c[2];
    q.s = 0.075;
  });
};

/* стрелка роста: все бусины выстраиваются в ровную восходящую стрелу */
export const arrow = (o: { wobble?: number; t?: number; out?: (i: number) => number } = {}) => {
  const { wobble = 0, t = 0, out } = o;
  const cols = AGE.map(rgb);
  return build((i, q) => {
    const u = (VER[i] + RANK_IN_VER[i] / BYVER[VER[i]].length) / 5; // 0…1 по годам
    const head = u > 0.93;
    const w = head ? (1 - u) / 0.07 * 1.4 : 0.32;
    const v = hash(i * 5.3) - 0.5;
    q.x = -7 + u * 13 + (head ? 0 : 0);
    q.y = -3 + u * 5.6 + v * w * 1.6;
    q.z = (hash(i * 2.2) - 0.5) * 0.5;
    const c = cols[VER[i]];
    q.r = c[0]; q.g = c[1]; q.b = c[2];
    q.s = 0.06;
    const o2 = out ? out(i) : 0;
    if (o2 > 0) {
      const a = hash(i * 9.1) * Math.PI * 2 + t * (0.6 + hash(i) * 1.4);
      const R = 2 + hash(i * 4.4) * 4.5;
      q.x += (Math.cos(a) * R - q.x * 0.3) * o2;
      q.y += (Math.sin(a * 1.3) * R * 0.6 + Math.sin(t * 3 + i) * 0.4) * o2;
      q.z += (Math.sin(a) * 2) * o2;
    }
    if (wobble) q.y += Math.sin(q.x * 1.3 + t * 4) * wobble;
  });
};

/* годовые кольца: внутри 11–15, снаружи «сейчас»; grow — сколько колец наросло */
export const rings = (o: { grow?: number; spin?: number; tilt?: number; y?: number; hl?: number } = {}) => {
  const { grow = 5, spin = 0, tilt = 0.9, y = -0.2, hl = -1 } = o;
  const cols = AGE.map(rgb);
  const R0 = [0.5, 1.25, 1.9, 2.55, 3.4], R1 = [1.15, 1.8, 2.45, 3.3, 4.6];
  return build((i, q) => {
    const k = VER[i], r = RANK_IN_VER[i], n = BYVER[k].length;
    const vis = Math.min(1, Math.max(0, grow - k));
    const u = (r + 0.5) / n;
    const rad = R0[k] + (R1[k] - R0[k]) * Math.sqrt(hash(r * 3.7 + k));
    const a = u * Math.PI * 2 * 7 + spin + hash(r) * 0.3;
    const px = Math.cos(a) * rad, pz = Math.sin(a) * rad;
    q.x = px;
    q.y = y - pz * Math.sin(tilt);
    q.z = pz * Math.cos(tilt);
    const c = cols[k];
    const m = hl >= 0 ? (k === hl ? 1.15 : 0.45) : 1;
    q.r = Math.min(1, c[0] * m); q.g = Math.min(1, c[1] * m); q.b = Math.min(1, c[2] * m);
    q.s = 0.055 * vis;
    if (vis <= 0) { q.x *= 1.6; q.z *= 1.6; }
  });
};

export { AV };

/* галактика: пять рукавов — пять версий, вращается и дышит под бас */
export const galaxy = (t: number, o: { R?: number; tilt?: number } = {}) => {
  const { R = 5.2, tilt = 0.75 } = o;
  const cols = AGE.map(rgb);
  return build((i, q) => {
    const k = VER[i];
    const u = Math.pow(hash(i * 1.9), 0.6);
    const arm = (k / 5) * Math.PI * 2;
    const a = arm + u * 3.6 + t * 0.5 + (hash(i * 4.1) - 0.5) * 0.5;
    const r = 0.3 + u * R + (hash(i * 7.3) - 0.5) * 0.4;
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    q.x = px;
    q.y = -pz * Math.sin(tilt) + (hash(i * 2.9) - 0.5) * 0.35 * (1 - u);
    q.z = pz * Math.cos(tilt);
    const c = cols[k];
    q.r = c[0]; q.g = c[1]; q.b = c[2];
    q.s = 0.05 + (1 - u) * 0.03;
  });
};
