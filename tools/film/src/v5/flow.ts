import { N, clamp, hash, inout, lerp } from "../lib/data";
import { DotData } from "./Dots";

/* Одно облако на весь фильм: с момента t точки плавно перетекают в форму f
   за d секунд. order — кто трогается первым; arc — лёгкая дуга полёта
   (небольшая: точки не роятся, а скользят). mod — живая правка формы. */
export type Seg = {
  t: number;
  f: (t: number) => DotData;
  d?: number;
  order?: "rand" | "left" | "right" | "top" | "bottom" | "in" | "out";
  arc?: number;
  mod?: (t: number, D: DotData) => void;
};

const OUT: DotData = { p: new Float32Array(N * 3), c: new Float32Array(N * 3), s: new Float32Array(N), a: new Float32Array(N) };
const ORD = new Float32Array(N);

export const flowAt = (segs: Seg[], t: number): DotData => {
  let k = 0;
  for (let j = 0; j < segs.length; j++) if (t >= segs[j].t) k = j;
  const cur = segs[k];
  const B = cur.f(t);
  const prev = k > 0 ? segs[k - 1] : null;
  const d = cur.d ?? 1.6;
  const u = prev ? clamp((t - cur.t) / d) : 1;
  const { p, c, s } = OUT;
  const a = OUT.a!;
  if (u >= 1 || !prev) {
    p.set(B.p); c.set(B.c); s.set(B.s); a.set(B.a ?? new Float32Array(N).fill(1));
  } else {
    const A = prev.f(cur.t);
    const ord = cur.order ?? "rand";
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < N; i++) {
      let v: number;
      if (ord === "rand") v = hash(i * 1.37);
      else if (ord === "left") v = B.p[i * 3];
      else if (ord === "right") v = -B.p[i * 3];
      else if (ord === "top") v = -B.p[i * 3 + 1];
      else if (ord === "bottom") v = B.p[i * 3 + 1];
      else {
        const r = Math.hypot(B.p[i * 3], B.p[i * 3 + 1]);
        v = ord === "in" ? r : -r;
      }
      v += hash(i + 5) * 1e-4;
      ORD[i] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const W = 0.45, arc = cur.arc ?? 0.35;
    const Aa = A.a!, Ba = B.a!;
    for (let i = 0; i < N; i++) {
      const o = (ORD[i] - lo) / (hi - lo || 1);
      const ui = inout((u - o * W) / (1 - W));
      const bow = Math.sin(Math.PI * ui) * arc;
      p[i * 3] = lerp(A.p[i * 3], B.p[i * 3], ui) + (hash(i + 101) - 0.5) * bow;
      p[i * 3 + 1] = lerp(A.p[i * 3 + 1], B.p[i * 3 + 1], ui) + (hash(i + 202) - 0.5) * bow;
      p[i * 3 + 2] = lerp(A.p[i * 3 + 2], B.p[i * 3 + 2], ui) + bow * 0.8;
      c[i * 3] = lerp(A.c[i * 3], B.c[i * 3], ui);
      c[i * 3 + 1] = lerp(A.c[i * 3 + 1], B.c[i * 3 + 1], ui);
      c[i * 3 + 2] = lerp(A.c[i * 3 + 2], B.c[i * 3 + 2], ui);
      s[i] = lerp(A.s[i], B.s[i], ui);
      a[i] = lerp(Aa ? Aa[i] : 1, Ba ? Ba[i] : 1, ui);
    }
  }
  if (cur.mod) cur.mod(t, OUT);
  return OUT;
};
