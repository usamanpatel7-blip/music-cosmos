import React, { useMemo } from "react";
import * as THREE from "three";

/* 3D-пластинка: диск с дорожками и бликом, этикетка своего цвета. */
const texCache = new Map<string, THREE.CanvasTexture>();
const vinylTex = (label: string, text: string) => {
  const key = label + text;
  let tx = texCache.get(key);
  if (tx) return tx;
  const S = 1024;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#141418";
  g.fillRect(0, 0, S, S);
  for (let r = 160; r < 505; r += 2.2) {
    g.strokeStyle = `rgba(255,255,255,${0.025 + ((r * 7) % 5) * 0.008})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  [250, 330, 410].forEach((r) => {
    g.strokeStyle = "rgba(0,0,0,.6)";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.stroke();
  });
  g.fillStyle = label;
  g.beginPath();
  g.arc(S / 2, S / 2, 165, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(0,0,0,.18)";
  g.beginPath();
  g.arc(S / 2, S / 2, 120, 0, Math.PI * 2);
  g.fill();
  if (text) {
    g.fillStyle = "#fff8ea";
    g.font = "800 58px Unbounded";
    g.textAlign = "center";
    g.fillText(text, S / 2, S / 2 - 60);
  }
  g.fillStyle = "#f5eee0";
  g.beginPath();
  g.arc(S / 2, S / 2, 12, 0, Math.PI * 2);
  g.fill();
  tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  texCache.set(key, tx);
  return tx;
};

export const Vinyl3D: React.FC<{ pos?: [number, number, number]; rot?: [number, number, number]; spin?: number; scale?: number; label?: string; text?: string }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], spin = 0, scale = 1, label = "#ff5a3c", text = "" }) => {
  const map = useMemo(() => vinylTex(label, text), [label, text]);
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <group rotation={[0, -spin, 0]}>
        <mesh>
          <cylinderGeometry args={[1, 1, 0.03, 128]} />
          <meshStandardMaterial attach="material-0" color="#111114" roughness={0.4} />
          <meshStandardMaterial attach="material-1" map={map} roughness={0.28} metalness={0.25} />
          <meshStandardMaterial attach="material-2" map={map} roughness={0.28} metalness={0.25} />
        </mesh>
      </group>
    </group>
  );
};

/* тонарм: стойка, трубка, головка; a — угол поворота над пластинкой */
export const Tonearm: React.FC<{ pos: [number, number, number]; a: number; lift?: number; scale?: number }> = ({ pos, a, lift = 0, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.12, 0.14, 0.12, 32]} />
      <meshStandardMaterial color="#c9c6bd" metalness={0.7} roughness={0.3} />
    </mesh>
    <group rotation={[0, a, lift * 0.25]}>
      <mesh position={[-0.75, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.5, 16]} />
        <meshStandardMaterial color="#d8d4ca" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-1.52, 0.13, 0]}>
        <boxGeometry args={[0.16, 0.06, 0.1]} />
        <meshStandardMaterial color="#1b1b20" roughness={0.5} />
      </mesh>
      <mesh position={[0.25, 0.16, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.14, 24]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  </group>
);
