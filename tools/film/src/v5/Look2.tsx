import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AV, KEY, N, VER, hash } from "../lib/data";
import { AGEC, AGEL, BG, INK, INK2, INK3, PAPER, PAPER_INK, SANS, SERIF, VERC } from "./theme";
import { Dots, DotData } from "./Dots";
import { blank, rgb, siteRecord, SHELF } from "./forms5";
import { Record3D, useSiteLabel } from "./Record3D";
import { Cover, Cue, Epi, Kick, Pill, Side } from "./ui";
import TR from "./tracks.json";

const FOV = 40;
const pxAt = (z: number) => 1080 / (2 * z * Math.tan((FOV * Math.PI) / 360));
const T = TR as Record<string, { id: string; artist: string; track: string; year: string }>;
const words = (s: string, upto: number) => s.split(" ").map((w, i) => ({ w, on: i < upto ? 1 : 0 }));

const Frame: React.FC<{ children: React.ReactNode; warm?: number }> = ({ children, warm = 0 }) => (
  <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 55% 45%, rgba(255,220,170,${0.05 + warm}), transparent 70%)` }} />
    {children}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("paper.png")})`, backgroundSize: "512px", opacity: 0.05, mixBlendMode: "screen", pointerEvents: "none" }} />
  </AbsoluteFill>
);
const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} camera={{ position: [0, 0, 12], fov: FOV, near: 0.1, far: 200 }} gl={{ alpha: true, antialias: true }}>
    {children}
  </ThreeCanvas>
);

/* тонарм в стиле сайта: стержень, ось, головка */
const Arm: React.FC<{ px: number; py: number; hx: number; hy: number }> = ({ px, py, hx, hy }) => {
  const len = Math.hypot(hx - px, hy - py), a = (Math.atan2(hy - py, hx - px) * 180) / Math.PI;
  return (
    <div style={{ position: "absolute", left: px, top: py, transform: `rotate(${a}deg)`, transformOrigin: "0 0" }}>
      <div style={{ position: "absolute", left: 0, top: -3, width: len, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#8a8378,#d8cfc0 40%,#b9b0a2)", boxShadow: "0 8px 18px rgba(0,0,0,.5)" }} />
      <div style={{ position: "absolute", left: -22, top: -22, width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle,#d8cfc0 0 30%,#3a3530 34% 100%)", boxShadow: "0 0 0 1px rgba(239,231,218,.22)" }} />
      <div style={{ position: "absolute", left: len - 20, top: -13, width: 38, height: 26, borderRadius: 5, background: "#2a2622", boxShadow: "inset 0 0 0 1px rgba(239,231,218,.22)" }} />
    </div>
  );
};

/* ---------------------------------------------------------------- 6: плейлисты на пластинке */
export const Playlists: React.FC = () => {
  const lbl = useSiteLabel("Одна вещь", "СТОРОНА А", "4334 · 33⅓");
  const P = pxAt(12), Ro = 3.75, gx = 2.05, gy = -0.05;
  const rec = useMemo(() => {
    const r = siteRecord(Ro, 0.8);
    for (let i = 0; i < N; i++) {
      const s = SHELF[i];
      const on = s === 0 ? 1 : s === 1 || s === 3 ? 0.6 : 0.2;
      r.data.a![i] *= on;
      if (s === 0) r.data.s[i] *= 1.5;
    }
    return r;
  }, []);
  const cx = 960 + gx * P, cy = 540 - gy * P;
  return (
    <Frame>
      {lbl ? (
        <Canvas>
          <group position={[gx, gy, 0]}>
            <Record3D R={Ro * 1.035} spin={0.8} label={lbl} />
            <Dots data={rec.data} />
          </group>
        </Canvas>
      ) : null}
      {rec.bands.map((b, s) => {
        if (!b || s > 5) return null;
        const a = ((-80 + s * 32) * Math.PI) / 180, lr = (b[0] + b[1]) / 2;
        const on = s === 0 || s === 1 || s === 3;
        return (
          <Pill key={s} x={cx + lr * Math.cos(a) * P} y={cy + lr * Math.sin(a) * P} style={{ opacity: on ? 1 : 0.45, borderColor: on ? AGEC[s] : "rgba(239,231,218,.12)", fontSize: on ? 22 : 18 }}>
            {AGEL[s]}
          </Pill>
        );
      })}
      <Arm px={cx + Ro * P * 1.02} py={cy - Ro * P * 0.98} hx={cx + Ro * P * 0.97} hy={cy - Ro * P * 0.08} />
      <div style={{ position: "absolute", left: 120, top: 300, width: 560 }}>
        <Side tag="А1" text="11–15 лет · пауза" color={AGEC[0]} />
        <div style={{ font: `500 120px/.9 ${SERIF}`, color: AGEC[0], marginTop: 34, fontVariantNumeric: "lining-nums" }}>11–15</div>
        <div style={{ font: `500 22px/1.4 ${SANS}`, color: INK2, marginTop: 10 }}>104 записи · старые песни</div>
        <Cue title={T.skillet.track} artist={`${T.skillet.artist} · 2009`} color={AGEC[0]} playing style={{ marginTop: 34 }} />
      </div>
      <Epi words={words("Я храню плейлисты с возрастом в названии: «11–15», «16–18», «20–21».", 11)} color={AGEC[0]} />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 7: биография — книга */
const Page: React.FC<{ id: string; title: string; sub: string; rot?: number; children?: React.ReactNode }> = ({ id, title, sub, rot = -4, children }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,.08), transparent 12%), ${PAPER}`, padding: "54px 50px", color: PAPER_INK }}>
    <div style={{ position: "relative", width: 300, height: 300, margin: "10px auto 0", transform: `rotate(${rot}deg)`, boxShadow: "0 14px 24px rgba(0,0,0,.28)" }}>
      <Img src={staticFile(`covers/${id}.jpg`)} style={{ width: 300, height: 300, display: "block" }} />
      <div style={{ position: "absolute", left: 100, top: -16, width: 110, height: 34, background: "rgba(255,250,235,.6)", transform: "rotate(-5deg)" }} />
    </div>
    <div style={{ font: `italic 500 64px/1 ${SERIF}`, marginTop: 44, textAlign: "center" }}>{title}</div>
    <div style={{ font: `600 17px/1.4 ${SANS}`, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.6, marginTop: 14, textAlign: "center" }}>{sub}</div>
    {children}
  </div>
);
const streamDots = (P: number): DotData => {
  const d = blank();
  for (let i = 0; i < N; i++) {
    if (hash(i * 3.1) > 0.33) continue;
    const u = hash(i * 7.7);
    // поток слева направо в корешок книги
    const x0 = -9.5, x1 = (1060 - 960) / P - 0.2;
    const x = x0 + (x1 - x0) * u;
    const y = (540 - 480) / P + Math.sin(u * 5 + 1) * 0.9 * (1 - u) + (hash(i) - 0.5) * 0.8 * (1 - u * 0.9);
    d.p[i * 3] = x;
    d.p[i * 3 + 1] = y;
    d.p[i * 3 + 2] = (hash(i * 2.2) - 0.5) * 1.5 * (1 - u);
    const c = rgb(VERC[VER[i]]);
    d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
    d.s[i] = 0.02;
    d.a![i] = 0.25 + 0.7 * (1 - u);
  }
  return d;
};
export const Biography: React.FC = () => {
  const P = pxAt(12);
  const d = useMemo(() => streamDots(P), [P]);
  const nb = KEY.filter((k) => k === 2).length, bach = KEY.filter((k) => k === 3).length, av = AV.reduce((a, b) => a + b, 0);
  const W = 540, H = 680, cx = 1080, top = 120;
  return (
    <Frame warm={0.04}>
      <Canvas>
        <Dots data={d} />
      </Canvas>
      <div style={{ position: "absolute", left: cx - W, top, width: 2 * W, height: H, perspective: 2600, perspectiveOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: "rotateY(10deg)", transformOrigin: "100% 50%", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
          <Page id={T.nickel.id} title="Nickelback" sub={`11–15 · ${nb} записи`} rot={-5} />
        </div>
        <div style={{ position: "absolute", left: W, top: 0, width: W, height: H, transform: "rotateY(-10deg)", transformOrigin: "0% 50%", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
          <Page id={T.avant.id} title="Лигети" sub={`сейчас · авангард · ${av} записей`} rot={4} />
        </div>
        <div style={{ position: "absolute", left: W, top: 0, width: W, height: H, transform: "rotateY(-68deg)", transformOrigin: "0% 50%" }}>
          <div style={{ position: "absolute", inset: 0, boxShadow: "-30px 20px 60px rgba(0,0,0,.45)" }}>
            <Page id={T.sp.id} title="Бах" sub={`22–24 · ${bach} записей`} rot={-3} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.25), transparent 40%, rgba(0,0,0,.12))" }} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 96 }}>
        <Side tag="А5" text="биография" color={VERC[4]} />
      </div>
      <Epi words={words("Например, можно рассказать, как человек, слушавший Nickelback, перешёл к Баху и послевоенному авангарду.", 10)} color={VERC[4]} />
    </Frame>
  );
};

/* ---------------------------------------------------------------- 8: стрела и то, чему в ней не место */
const arrowDots = (P: number, sag: { u: number; k: number }[]): DotData => {
  const d = blank();
  const A = [-6.4, -2.7], B = [4.4, 1.9];
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / len, uy = (B[1] - A[1]) / len, nx = -uy, ny = ux;
  const ink = rgb(INK), gold = rgb("#e8c070");
  for (let i = 0; i < N; i++) {
    const head = i % 9 === 0;
    let x: number, y: number;
    if (head) {
      // наконечник: точка в треугольнике (основание поперёк стрелы, вершина впереди)
      let r1 = hash(i * 1.3), r2 = hash(i * 2.9);
      if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
      const hl = 1.0, hw = 0.62;
      const Lx = B[0] + nx * hw, Ly = B[1] + ny * hw, Rx = B[0] - nx * hw, Ry = B[1] - ny * hw, Tx = B[0] + ux * hl, Ty = B[1] + uy * hl;
      x = Lx + r1 * (Rx - Lx) + r2 * (Tx - Lx);
      y = Ly + r1 * (Ry - Ly) + r2 * (Ty - Ly);
    } else {
      const u = hash(i * 0.73), w = (hash(i * 5.1) - 0.5) * 0.36;
      x = A[0] + (B[0] - A[0]) * u + nx * w;
      y = A[1] + (B[1] - A[1]) * u + ny * w;
      for (const s of sag) y -= s.k * Math.exp(-((u - s.u) ** 2) / 0.006);
    }
    d.p[i * 3] = x;
    d.p[i * 3 + 1] = y;
    d.p[i * 3 + 2] = (hash(i * 9.9) - 0.5) * 0.2;
    const c = head ? gold : ink;
    d.c[i * 3] = c[0]; d.c[i * 3 + 1] = c[1]; d.c[i * 3 + 2] = c[2];
    d.s[i] = 0.019;
    d.a![i] = head ? 1 : 0.75;
  }
  void P;
  return d;
};
const Wobble: React.FC<{ text: string; x: number; y: number; size?: number }> = ({ text, x, y, size = 84 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%) rotate(-4deg)", whiteSpace: "nowrap" }}>
    {[...text].map((ch, i) => (
      <span key={i} style={{ display: "inline-block", font: `italic 600 ${size}px/1 ${SERIF}`, color: INK, transform: `translateY(${Math.sin(i * 0.7) * 9}px) rotate(${Math.sin(i * 1.3) * 4}deg)`, minWidth: ch === " " ? size * 0.25 : undefined, textShadow: "0 0 18px rgba(12,11,13,.9)" }}>
        {ch}
      </span>
    ))}
  </div>
);
export const Misfits: React.FC = () => {
  const P = pxAt(12);
  const sag = [{ u: 0.33, k: 0.35 }, { u: 0.56, k: 0.6 }, { u: 0.76, k: 0.3 }];
  const d = useMemo(() => arrowDots(P, sag), [P]); // eslint-disable-line react-hooks/exhaustive-deps
  const at = (u: number) => {
    const A = [-6.4, -2.7], B = [4.4, 1.9];
    let y = A[1] + (B[1] - A[1]) * u;
    for (const s of sag) y -= s.k * Math.exp(-((u - s.u) ** 2) / 0.006);
    return [960 + (A[0] + (B[0] - A[0]) * u) * P, 540 - y * P];
  };
  const [ax, ay] = at(0.56), [bx, by] = at(0.33), [nx2, ny2] = at(0.76);
  return (
    <Frame>
      <Canvas>
        <Dots data={d} />
      </Canvas>
      <Cover id={T.abba.id} x={bx - 10} y={by - 70} w={170} rot={-10} tape />
      <Cover id={T.asap.id} x={ax + 10} y={ay - 100} w={250} rot={7} tape />
      <Cover id={T.nsync.id} x={nx2 + 20} y={ny2 - 80} w={170} rot={9} tape />
      <Cover id={T.limahl.id} x={at(0.15)[0]} y={at(0.15)[1] + 130} w={140} rot={-14} tape />
      <Cover id={T.salmon.id} x={at(0.9)[0] - 30} y={at(0.9)[1] + 150} w={140} rot={12} tape />
      {/* телефон с треком из TikTok */}
      <div style={{ position: "absolute", left: 1540, top: 140, width: 210, height: 420, borderRadius: 34, background: "#17151a", boxShadow: "0 0 0 2px rgba(239,231,218,.18), 0 30px 60px rgba(0,0,0,.6)", transform: "rotate(8deg)", overflow: "hidden" }}>
        <Img src={staticFile(`covers/${T.tiktok.id}.jpg`)} style={{ position: "absolute", left: 14, top: 60, width: 182, height: 182, borderRadius: 10 }} />
        <div style={{ position: "absolute", left: 18, top: 262, font: `600 18px/1.25 ${SANS}`, color: INK }}>
          {T.tiktok.track}
          <div style={{ color: INK3, fontSize: 14, fontWeight: 500 }}>{T.tiktok.artist}</div>
        </div>
        <div style={{ position: "absolute", left: 18, right: 18, top: 340, height: 4, borderRadius: 2, background: "rgba(239,231,218,.18)" }}>
          <div style={{ width: "38%", height: 4, borderRadius: 2, background: INK }} />
        </div>
      </div>
      <Wobble text="возьми телефоон деткаа" x={1180} y={130} />
      <div style={{ position: "absolute", left: 120, top: 96 }}>
        <Kick>образцовая история культурного роста</Kick>
      </div>
      <Epi words={words("И ещё несколько вещей, которым в этой красивой эволюционной схеме вообще не положено существовать.", 9)} color={INK2} />
    </Frame>
  );
};

