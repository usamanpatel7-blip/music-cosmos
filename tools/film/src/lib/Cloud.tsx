import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { N, clamp, hash, inout, lerp } from "./data";
import { Form } from "./forms";

/* Отрезок сценария облака: с момента t бусины перетекают в форму f
   за d секунд. order — кто трогается первым, swirl — размах дуги полёта,
   mod — что делать с готовой формой каждый кадр (кивок головой, пульс). */
export type Seg = {
  t: number;
  f: (t: number) => Form;
  d?: number;
  order?: "rand" | "top" | "bottom" | "left" | "center" | "out";
  swirl?: number;
  mod?: (t: number, p: Float32Array, c: Float32Array, s: Float32Array) => void;
};

const OUT = { p: new Float32Array(N * 3), c: new Float32Array(N * 3), s: new Float32Array(N) };
const ORD = new Float32Array(N);

export const blendAt = (segs: Seg[], t: number) => {
  let k = 0;
  for (let j = 0; j < segs.length; j++) if (t >= segs[j].t) k = j;
  const cur = segs[k];
  const B = cur.f(t);
  const prev = k > 0 ? segs[k - 1] : null;
  const d = cur.d ?? 1.4;
  const u = prev ? clamp((t - cur.t) / d) : 1;
  const { p, c, s } = OUT;
  if (u >= 1 || !prev) {
    p.set(B.p); c.set(B.c); s.set(B.s);
  } else {
    const A = prev.f(Math.min(t, cur.t)); // прежняя форма застывает в момент начала перехода
    // порядок старта
    const ord = cur.order ?? "rand";
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < N; i++) {
      let v: number;
      if (ord === "rand") v = hash(i * 1.37);
      else if (ord === "top") v = -B.p[i * 3 + 1];
      else if (ord === "bottom") v = B.p[i * 3 + 1];
      else if (ord === "left") v = B.p[i * 3];
      else {
        const dx = B.p[i * 3], dy = B.p[i * 3 + 1];
        v = Math.hypot(dx, dy) * (ord === "center" ? 1 : -1);
      }
      v += hash(i + 5) * 0.0001;
      ORD[i] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const W = 0.5;
    const sw = cur.swirl ?? 1.2;
    for (let i = 0; i < N; i++) {
      const o = (ORD[i] - lo) / (hi - lo || 1);
      const ui = inout((u - o * W) / (1 - W));
      const arc = Math.sin(Math.PI * ui) * sw;
      const ax = hash(i + 101) - 0.5, ay = hash(i + 202) - 0.5, az = hash(i + 303) - 0.5;
      p[i * 3] = lerp(A.p[i * 3], B.p[i * 3], ui) + ax * arc * 2;
      p[i * 3 + 1] = lerp(A.p[i * 3 + 1], B.p[i * 3 + 1], ui) + ay * arc * 2;
      p[i * 3 + 2] = lerp(A.p[i * 3 + 2], B.p[i * 3 + 2], ui) + (az * 2 + 0.6) * arc * 2;
      c[i * 3] = lerp(A.c[i * 3], B.c[i * 3], ui);
      c[i * 3 + 1] = lerp(A.c[i * 3 + 1], B.c[i * 3 + 1], ui);
      c[i * 3 + 2] = lerp(A.c[i * 3 + 2], B.c[i * 3 + 2], ui);
      s[i] = lerp(A.s[i], B.s[i], ui);
    }
  }
  if (cur.mod) cur.mod(t, p, c, s);
  return OUT;
};

/* бусины: один InstancedMesh на все треки */
export const Cloud: React.FC<{ segs: Seg[]; t: number }> = ({ segs, t }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const { p, c, s } = blendAt(segs, t);
    for (let i = 0; i < N; i++) {
      tmp.position.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
      tmp.scale.setScalar(Math.max(0.0001, s[i]));
      tmp.updateMatrix();
      im.setMatrixAt(i, tmp.matrix);
      col.setRGB(c[i * 3], c[i * 3 + 1], c[i * 3 + 2], THREE.SRGBColorSpace);
      im.setColorAt(i, col);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [segs, t, tmp, col]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 7]} />
      <meshStandardMaterial roughness={0.35} metalness={0.05} />
    </instancedMesh>
  );
};

/* камера по ключам: [t, позиция, точка взгляда]; между ключами — плавно */
export type CamKey = [number, [number, number, number], [number, number, number]];
export const CamRig: React.FC<{ keys: CamKey[]; t: number; drift?: number }> = ({ keys, t, drift = 0.06 }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    let k = 0;
    for (let j = 0; j < keys.length; j++) if (t >= keys[j][0]) k = j;
    const a = keys[k], b = keys[Math.min(k + 1, keys.length - 1)];
    const u = b[0] > a[0] ? inout((t - a[0]) / (b[0] - a[0])) : 0;
    const L = (i: 1 | 2, j: number) => lerp(a[i][j], b[i][j], u);
    const dx = Math.sin(t * 0.7) * drift, dy = Math.cos(t * 0.53) * drift;
    camera.position.set(L(1, 0) + dx, L(1, 1) + dy, L(1, 2));
    camera.lookAt(L(2, 0), L(2, 1), L(2, 2));
    camera.updateProjectionMatrix();
  }, [camera, keys, t, drift]);
  return null;
};
