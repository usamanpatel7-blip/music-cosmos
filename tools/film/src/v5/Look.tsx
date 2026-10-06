import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { N, VER, KEY, hash } from "../lib/data";
import { Tonearm } from "../lib/Vinyl3D";
import { BG, INK2, INK3, VERC, VERL, AGEC, SERIF, SANS } from "./theme";
import { Dots, DotData } from "./Dots";
import { blank, halos, nebula, rgb, siteRecord } from "./forms5";
import { Record3D, useSiteLabel, useTextures } from "./Record3D";
import { Cover, Cutout, Epi, H2, Kick, Num, Side } from "./ui";
import { PianoStage } from "./Pianists";
import TR from "./tracks.json";
import { Biography, Misfits, Playlists } from "./Look2";

/* Кадры-образцы новой эстетики (до полной пересборки фильма). */
const FOV = 40;
const pxAt = (z: number) => 1080 / (2 * z * Math.tan((FOV * Math.PI) / 360));

const Frame: React.FC<{ children: React.ReactNode; warm?: number }> = ({ children, warm = 0 }) => (
  <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 55% 45%, rgba(255,220,170,${0.05 + warm}), transparent 70%)` }} />
    {children}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("paper.png")})`, backgroundSize: "512px", opacity: 0.05, mixBlendMode: "screen", pointerEvents: "none" }} />
  </AbsoluteFill>
);

const words = (s: string, upto: number) => s.split(" ").map((w, i) => ({ w, on: i < upto ? 1 : 0 }));

const Canvas: React.FC<{ children: React.ReactNode; z?: number; y?: number; look?: [number, number, number] }> = ({ children, z = 12, y = 0, look = [0, 0, 0] }) => (
  <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} camera={{ position: [0, y, z], fov: FOV, near: 0.1, far: 200 }} gl={{ alpha: true, antialias: true }} onCreated={({ camera }) => camera.lookAt(...look)}>
    {children}
  </ThreeCanvas>
);

/* ---------------------------------------------------------------- 0: тесно */
const Open: React.FC = () => {
  const tx = useTextures(["v5/now-label.png"]);
  const lbl = tx ? tx["v5/now-label.png"] : null;
  const rec = useMemo(() => siteRecord(4.45, 0.4), []);
  const cream = useMemo(() => new THREE.Color("#e8dcc4"), []);
  return (
    <Frame>
      {tx ? <Canvas z={9.2}>
        <group position={[0.9, -0.15, 0]} rotation={[0, 0, 0]}>
          <Record3D R={4.6} spin={0.4} label={null} />
          <mesh position={[0, 0, 0.006]}>
            <circleGeometry args={[4.6 * 0.3, 128]} />
            <meshBasicMaterial color={cream} />
          </mesh>
          {lbl ? (
            <mesh position={[0, 0, 0.01]}>
              <circleGeometry args={[4.6 * 0.3 * 0.985, 128]} />
              <meshBasicMaterial map={lbl} transparent />
            </mesh>
          ) : null}
          <Dots data={rec.data} />
        </group>
        <Tonearm pos={[5.2, 3.3, 0.6]} a={0.35} scale={1.6} />
      </Canvas> : null}
      <Kick style={{ position: "absolute", left: 120, top: 92 }}>4334 записи · 14 лет · один слушатель</Kick>
      <Epi words={words("Мне, кажется, тесно в окончательной версии себя.", 6)} color={VERC[4]} />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 1: комната */
const XS = [270, 615, 960, 1305, 1650];
const COUNTS = [0, 1, 2, 3, 4].map((k) => VER.filter((v) => v === k).length);
const KEYS = ["r1", "r2", "su", "sp", "now"] as const;
const Room: React.FC = () => {
  const P = pxAt(12);
  const d = useMemo(() => halos(XS.map((x) => (x - 960) / P), (540 - 330) / P, 1.3, 0.3), [P]);
  return (
    <Frame warm={0.03}>
      <Canvas>
        <Dots data={d} />
      </Canvas>
      {KEYS.map((k, i) => (
        <Cutout key={k} src={k} x={XS[i]} y={770} h={i === 0 ? 500 : 580} />
      ))}
      {KEYS.map((k, i) => (
        <Cover key={k} id={(TR as Record<string, { id: string }>)[k].id} x={XS[i] + [40, 26, 0, -26, -40][i]} y={[132, 118, 110, 118, 128][i]} w={170} rot={[-9, 6, -3, 8, -6][i]} tape />
      ))}
      {KEYS.map((k, i) => (
        <div key={k} style={{ position: "absolute", left: XS[i], top: 790, transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ font: `500 64px/1 ${SERIF}`, color: VERC[i], fontVariantNumeric: "lining-nums" }}>{COUNTS[i]}</div>
          <div style={{ font: `600 17px/1.4 ${SANS}`, letterSpacing: ".2em", color: INK2, marginTop: 6 }}>{VERL[i]}</div>
        </div>
      ))}
      <Epi words={words("Иначе мы бы так и не познакомились: каждый потребовал бы поставить своё.", 10)} color={INK2} style={{ bottom: 56, left: 120 }} size={42} cite="" />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 2: алтарь */
const altarDots = (P: number): DotData => {
  const d = blank();
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 0) continue;
    const j = k++;
    const c = rgb(KEY[i] === 1 ? "#ffd27a" : j % 3 ? "#ff5a3c" : "#ffb52e");
    if (j < 64) {
      // нимб вокруг пластинки
      const th = (j / 64) * Math.PI * 2;
      d.p[i * 3] = Math.cos(th) * 2.55;
      d.p[i * 3 + 1] = 0.7 + Math.sin(th) * 2.55;
      d.p[i * 3 + 2] = -0.2;
      d.s[i] = 0.05;
    } else {
      // «дым» от свечей
      const side = j % 2 ? 1 : -1, u = ((j - 64) / 40 + hash(i) * 0.15) % 1;
      d.p[i * 3] = side * 2.45 + Math.sin(u * 9 + side) * 0.3 * u;
      d.p[i * 3 + 1] = 0.25 + u * 2.8;
      d.p[i * 3 + 2] = 0.6;
      d.s[i] = 0.04 * (1 - u * 0.5);
      d.a![i] = 0.9 * (1 - u);
    }
    d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
  }
  void P;
  return d;
};
const flameTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
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
    t = new THREE.CanvasTexture(cv);
    return t;
  };
})();
const Candle: React.FC<{ x: number; h?: number; z?: number }> = ({ x, h = 0.9, z = 0.6 }) => (
  <group position={[x, -1.21, z]}>
    <mesh position={[0, h / 2, 0]}>
      <cylinderGeometry args={[0.13, 0.14, h, 32]} />
      <meshStandardMaterial color="#efe3c8" roughness={0.55} emissive="#4a2c10" emissiveIntensity={0.35} />
    </mesh>
    <mesh position={[0, h + 0.2, 0.02]}>
      <planeGeometry args={[0.42, 0.7]} />
      <meshBasicMaterial map={flameTex()} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
    <pointLight position={[0, h + 0.3, 0.45]} intensity={3.2} distance={6} color="#ffad55" />
  </group>
);
const Altar: React.FC = () => {
  const P = pxAt(12);
  const tx = useTextures([`covers/${TR.r1.id}.jpg`]);
  const cover = tx ? tx[`covers/${TR.r1.id}.jpg`] : null;
  const d = useMemo(() => altarDots(P), [P]);
  return (
    <Frame warm={0.04}>
      <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 36%, rgba(255,210,140,.07) 0deg 5deg, transparent 5deg 14deg)", maskImage: "radial-gradient(circle at 50% 36%, #000 0, #000 30%, transparent 62%)", WebkitMaskImage: "radial-gradient(circle at 50% 36%, #000 0, #000 30%, transparent 62%)" }} />
      {tx ? <Canvas y={0.4}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 4, 6]} intensity={0.6} color="#ffe2c0" />
        {/* алтарь: бархат, золотая кромка, белая дорожка с бахромой */}
        <mesh position={[0, -2.15, 0]}>
          <boxGeometry args={[6.6, 1.8, 1.8]} />
          <meshStandardMaterial color="#7a161c" roughness={0.72} />
        </mesh>
        <mesh position={[0, -1.235, 0.02]}>
          <boxGeometry args={[6.8, 0.07, 1.95]} />
          <meshStandardMaterial color="#c9a14a" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, -1.85, 0.915]}>
          <planeGeometry args={[1.9, 1.2]} />
          <meshStandardMaterial color="#efe3c8" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 13 }).map((_, k) => (
          <mesh key={k} position={[-0.9 + k * 0.15, -2.5, 0.92]}>
            <boxGeometry args={[0.035, 0.12, 0.01]} />
            <meshStandardMaterial color="#c9a14a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* золотой оклад и пластинка-икона */}
        <mesh position={[0, 0.7, -0.05]}>
          <ringGeometry args={[2.05, 2.25, 128]} />
          <meshStandardMaterial color="#c9a14a" metalness={0.8} roughness={0.3} emissive="#5a4010" emissiveIntensity={0.4} />
        </mesh>
        <Record3D R={2.0} pos={[0, 0.7, 0]} rot={[0, 0, 0]} spin={0.2} label={cover} labelK={0.42} />
        <Candle x={-2.95} h={0.55} z={0.3} />
        <Candle x={-2.45} h={1.05} />
        <Candle x={-1.95} h={0.7} z={0.8} />
        <Candle x={1.95} h={0.7} z={0.8} />
        <Candle x={2.45} h={1.05} />
        <Candle x={2.95} h={0.55} z={0.3} />
        <Dots data={d} />
      </Canvas> : null}
      <Cutout src="r1-headbang" x={1560} y={1000} h={600} rot={4} flip />
      <div style={{ position: "absolute", left: 120, top: 150, width: 420 }}>
        <Side tag="А1" text="11–15 лет" color={AGEC[0]} />
        <div style={{ display: "flex", gap: 46, marginTop: 40 }}>
          <Num value="1" small="группа" color={AGEC[0]} size={120} />
          <Num value="1" small="пластинка" color={AGEC[0]} size={120} />
          <Num value="0" small="сомнений" color={AGEC[0]} size={120} />
        </div>
      </div>
      <Epi words={words("Один AC/DC, одна пластинка или альбом, никаких сомнений.", 8)} color={AGEC[0]} />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 3: три пианиста */
const pianoNotes = (P: number): DotData => {
  const d = blank();
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (VER[i] !== 4 || k > 260) continue;
    const j = k++, s = j % 3, u = (j / 87 + hash(i) * 0.3) % 1;
    const cx = (470 + 1420 * (s / 3) + 1420 / 3 * 0.42 - 960) / P;
    d.p[i * 3] = cx + Math.sin(u * 7 + s) * 0.5 * u;
    d.p[i * 3 + 1] = (540 - 380) / P + u * 3.0;
    d.p[i * 3 + 2] = -0.5;
    const c = rgb("#c77dff");
    d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
    d.s[i] = 0.03 * (1 - u * 0.5);
    d.a![i] = 1 - u;
  }
  return d;
};
const Pianos: React.FC = () => {
  const P = pxAt(12);
  const d = useMemo(() => pianoNotes(P), [P]);
  return (
    <Frame warm={0.02}>
      <Canvas>
        <Dots data={d} />
      </Canvas>
      <PianoStage x={470} y={150} w={1420} t={0} sway={[-5, 4, -2]} lift={[0.7, 0.2, 0.9]} />
      <div style={{ position: "absolute", left: 560, top: 96 }}>
        <Kick>соната № 8 «патетическая» · i часть · три прочтения</Kick>
      </div>
      <Cutout src="now-explain" x={260} y={1090} h={700} />
      <Epi words={words("…почему одну сонату полезно и увлекательно слушать от трёх разных первоклассных пианистов.", 13)} color={VERC[4]} style={{ left: 580, maxWidth: 1180, bottom: 70 }} />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 4: тишина */
const Calm: React.FC = () => {
  const d = useMemo(() => nebula(7, -3, 0), []);
  return (
    <Frame warm={0.02}>
      <Canvas>
        <Dots data={d} focus={12.5} aperture={2.2} maxBlur={70} />
      </Canvas>
      {[
        ["модуляция", 520, 260, 0.18],
        ["кода", 1430, 330, 0.12],
        ["темп ↓", 1260, 190, 0.08],
      ].map(([s, x, y, o], i) => (
        <div key={i} style={{ position: "absolute", left: x as number, top: y as number, font: `500 22px ${SANS}`, color: INK3, borderLeft: "1px solid rgba(239,231,218,.2)", paddingLeft: 10, opacity: o as number }}>
          {s}
        </div>
      ))}
      <Cutout src="now-listen" x={1430} y={1110} h={840} />
      <Epi words={words("Но лучшие минуты всё равно наступают тогда, когда внутреннему комментатору наконец нечего сказать.", 14)} color={VERC[4]} />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 5: финал */
const Final: React.FC = () => {
  const lbl = useSiteLabel("", "СТОРОНА А", "4334 · 33⅓");
  const rec = useMemo(() => siteRecord(3.75, 1.1), []);
  return (
    <Frame>
      <Canvas>
        <group position={[1.75, 0, 0]}>
          <Record3D R={3.88} spin={1.1} label={lbl} />
          <Dots data={rec.data} />
        </group>
        <Tonearm pos={[5.6, 2.9, 0.4]} a={0.62} scale={1.3} />
      </Canvas>
      <div style={{ position: "absolute", left: 120, top: 330, width: 640 }}>
        <Kick>4334 записи · 14 лет · один слушатель</Kick>
        <H2 size={128} style={{ marginTop: 26, lineHeight: 0.92 }}>моя музыкальная эволюция</H2>
      </div>
    </Frame>
  );
};

export const LOOKS = [Open, Room, Altar, Pianos, Calm, Playlists, Biography, Misfits, Final];
export const Look: React.FC<{ n?: number }> = ({ n }) => {
  const f = useCurrentFrame();
  const C = LOOKS[Math.min(LOOKS.length - 1, n ?? f)];
  return <C />;
};
