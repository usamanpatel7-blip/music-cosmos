import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { PAPER, PAPER_INK } from "./theme";

/* картинка → текстура; рендер ждёт, пока она загрузится */
const texCache = new Map<string, THREE.Texture>();
export const useImageTexture = (src: string | null) => {
  const [tex, setTex] = useState<THREE.Texture | null>(() => (src ? texCache.get(src) ?? null : null));
  useEffect(() => {
    if (!src || texCache.has(src)) return;
    const h = delayRender(`texture ${src}`);
    new THREE.TextureLoader().load(
      staticFile(src),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        texCache.set(src, t);
        setTex(t);
        continueRender(h);
      },
      undefined,
      () => continueRender(h),
    );
  }, [src]);
  return src ? texCache.get(src) ?? tex : null;
};

/* несколько картинок сразу: пока не загрузились все, сцену не рисуем —
   так текстура гарантированно попадает в первый же кадр */
const loading = new Map<string, Promise<THREE.Texture>>();
const loadTex = (src: string) => {
  let p = loading.get(src);
  if (!p) {
    p = new Promise<THREE.Texture>((res) => {
      new THREE.TextureLoader().load(
        staticFile(src),
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          texCache.set(src, t);
          res(t);
        },
        undefined,
        () => res(new THREE.Texture()),
      );
    });
    loading.set(src, p);
  }
  return p;
};
export const useTextures = (srcs: string[]) => {
  const key = srcs.join("|");
  const [ready, setReady] = useState(() => srcs.every((s) => texCache.has(s)));
  useEffect(() => {
    if (srcs.every((s) => texCache.has(s))) {
      setReady(true);
      return;
    }
    const h = delayRender(`textures ${key}`);
    Promise.all(srcs.map(loadTex)).then(() => {
      setReady(true);
      requestAnimationFrame(() => requestAnimationFrame(() => continueRender(h)));
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return ready ? (Object.fromEntries(srcs.map((s) => [s, texCache.get(s)!])) as Record<string, THREE.Texture>) : null;
};

/* бороздки: тонкие кольца и блик — как фон пластинки на сайте */
let groovesTex: THREE.CanvasTexture | null = null;
const grooves = () => {
  if (groovesTex) return groovesTex;
  const S = 2048, cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#121014";
  g.fillRect(0, 0, S, S);
  for (let r = S * 0.16; r < S * 0.5; r += 3.1) {
    g.strokeStyle = `rgba(255,255,255,${0.018 + ((r * 13) % 7) * 0.004})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  // блик — конический, как conic-gradient на сайте
  for (let a = 0; a < 360; a += 1) {
    const k = Math.max(0, Math.cos(((a - 250) * Math.PI) / 90)) * 0.06 + Math.max(0, Math.cos(((a - 70) * Math.PI) / 80)) * 0.04;
    if (k < 0.002) continue;
    g.fillStyle = `rgba(255,255,255,${k})`;
    g.beginPath();
    g.moveTo(S / 2, S / 2);
    g.arc(S / 2, S / 2, S * 0.5, (a * Math.PI) / 180, ((a + 1.2) * Math.PI) / 180);
    g.fill();
  }
  groovesTex = new THREE.CanvasTexture(cv);
  groovesTex.colorSpace = THREE.SRGBColorSpace;
  groovesTex.anisotropy = 8;
  return groovesTex;
};

/* этикетка сайта: «Одна вещь · сторона А · 4334 · 33⅓» */
const labelCache = new Map<string, THREE.CanvasTexture>();
export const useSiteLabel = (title = "Одна вещь", side = "СТОРОНА А", foot = "4334 · 33⅓") => {
  const key = title + side + foot;
  const [ready, setReady] = useState(labelCache.has(key));
  useEffect(() => {
    if (labelCache.has(key)) return;
    const h = delayRender("label fonts");
    document.fonts.ready.then(() => {
      const S = 1024, cv = document.createElement("canvas");
      cv.width = cv.height = S;
      const g = cv.getContext("2d")!;
      g.fillStyle = PAPER;
      g.beginPath();
      g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,.08)";
      g.lineWidth = 18;
      g.stroke();
      g.fillStyle = PAPER_INK;
      g.textAlign = "center";
      g.font = 'italic 600 112px "Cormorant Garamond"';
      g.fillText(title, S / 2, S * 0.33);
      g.globalAlpha = 0.7;
      g.font = '600 40px "Golos Text"';
      (g as unknown as { letterSpacing: string }).letterSpacing = "10px";
      g.fillText(side, S / 2, S * 0.64);
      g.globalAlpha = 0.55;
      g.font = '500 36px "Golos Text"';
      (g as unknown as { letterSpacing: string }).letterSpacing = "6px";
      g.fillText(foot, S / 2, S * 0.86);
      g.globalAlpha = 1;
      g.fillStyle = "#0c0b0d";
      g.beginPath();
      g.arc(S / 2, S / 2, S * 0.025, 0, Math.PI * 2);
      g.fill();
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      labelCache.set(key, t);
      setReady(true);
      continueRender(h);
    });
  }, [key]);
  return ready ? labelCache.get(key)! : null;
};

/* Пластинка: диск R, этикетка 0.3R (картинка или надпись), вращение spin.
   Плоскость пластинки — XY, лицом к +Z. */
export const Record3D: React.FC<{ R: number; pos?: [number, number, number]; rot?: [number, number, number]; spin?: number; label?: THREE.Texture | null; labelK?: number; children?: React.ReactNode }> = ({ R, pos = [0, 0, 0], rot = [0, 0, 0], spin = 0, label, labelK = 0.3, children }) => {
  const tex = useMemo(() => grooves(), []);
  return (
    <group position={pos} rotation={rot}>
      <mesh position={[0, 0, -0.012]}>
        <circleGeometry args={[R * 1.004, 160]} />
        <meshBasicMaterial color="#070608" />
      </mesh>
      <group rotation={[0, 0, spin]}>
        <mesh position={[0, 0, 0.0]}>
          <circleGeometry args={[R, 160]} />
          <meshBasicMaterial map={tex} />
        </mesh>
        {label ? (
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[R * labelK, 128]} />
            <meshBasicMaterial map={label} transparent />
          </mesh>
        ) : null}
        {children}
      </group>
    </group>
  );
};
