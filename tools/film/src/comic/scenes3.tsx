import React from "react";
import { C as COL, INK, S, Fig, Layer, Page, clamp, ease, hash, inout, kick, lerp, loud, move, ph, pop } from "./kit";
import { Amp, Door, FrameRect, Lamp, Phone, R, Rings, Room, Sleeve, TurntableTop, Vinyl, Window, K, G } from "./props";
import { Cam, TurntableSide } from "./scenes1";
import { Board } from "./scenes2";

/* булавка с вещью, которой «не положено существовать» на схеме */
const Pinned: React.FC<{ t: number; t0: number; x: number; y: number; rot: number; children: React.ReactNode }> = ({ t, t0, x, y, rot, children }) => {
  const u = pop(t, t0, 220, 11);
  if (u <= 0.001) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot * u}) scale(${0.6 + u * 0.4})`} opacity={Math.min(1, u * 2)}>
      {children}
      <circle cx={0} cy={-70} r={11} fill={COL.yellow} {...K} strokeWidth={3} />
    </g>
  );
};

/* надпись-звук, буквы качаются волной (на экране, не в субтитрах) */
const Wobble: React.FC<{ t: number; t0: number; t1: number; x: number; y: number; text: string; size?: number }> = ({ t, t0, t1, x, y, text, size = 66 }) => {
  if (t < t0 - 0.01 || t > t1 + 0.3) return null;
  const out = 1 - ph(t, t1, t1 + 0.3);
  const colors = ["#e2487a", "#38c6d6", "#f3c23a"];
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%) rotate(-6deg)", whiteSpace: "nowrap", opacity: out }}>
      {[...text].map((ch, i) => {
        const u = pop(t, t0 + i * 0.03, 260, 10);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              font: `400 ${size}px/1 "Pangolin"`,
              color: colors[i % 3],
              WebkitTextStroke: `5px ${INK}`,
              paintOrder: "stroke fill",
              transform: `translateY(${Math.sin(t * 9 + i * 0.6) * 10}px) scale(${u})`,
              minWidth: ch === " " ? size * 0.3 : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/* ================================================================ 9
   На ровную схему прикалывают затёртый до белизны конверт — мимо нити.
   Рядом вибрирует телефон. Потом всё подряд: диск, кассета с наклейками,
   билет — доска перекашивается. Он смотрит на неё и наклоняет голову
   под тем же углом. */
export const C9: React.FC<{ t: number }> = ({ t }) => {
  const tilt = lerp(0, -2.2, ease(ph(t, 118.6, 119.2))) + lerp(0, 3.4, ease(ph(t, 125.0, 129.6)));
  const zoomA = ease(ph(t, 118.6, 120.5)) * (1 - ease(ph(t, 122.2, 122.9)));
  const buzz = t > S[27] && t < 125.6 ? 1 : 0;
  const now = ease(ph(t, 129.8, 130.6));
  return (
    <Page t={t} bg="#e8d9bb">
      <Cam s={1 + zoomA * 0.55} ox={520} oy={860}>
        <Board t={t} tilt={tilt} string={1} pie={0.56}>
          <Layer w={1840} h={1000}>
            <Pinned t={t} t0={117.9} x={470} y={860} rot={-7}>
              <Sleeve x={0} y={0} w={230} design={3} color="#7d5aa6" worn={1} />
            </Pinned>
            <Pinned t={t} t0={S[27] + 0.05} x={900} y={700} rot={9}>
              <Phone x={0} y={60} s={0.55} glow={buzz} buzz={buzz} t={t} />
            </Pinned>
            <Pinned t={t} t0={125.1} x={140} y={330} rot={-12}>
              <circle r={70} fill="#e9e6f2" {...K} />
              <circle r={70} fill="url(#cdRainbow)" opacity={0.6} />
              <circle r={14} fill="#c79a62" {...K} strokeWidth={3} />
              <defs>
                <linearGradient id="cdRainbow" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#ff9ad5" />
                  <stop offset="0.5" stopColor="#9af0ff" />
                  <stop offset="1" stopColor="#ffe39a" />
                </linearGradient>
              </defs>
            </Pinned>
            <Pinned t={t} t0={126.0} x={1120} y={760} rot={14}>
              <rect x={-110} y={-70} width={220} height={140} rx={12} fill="#2b2b31" {...K} />
              <rect x={-90} y={-55} width={180} height={70} fill="#f6c3d6" stroke={INK} strokeWidth={3} />
              <circle cx={-40} cy={30} r={18} fill={R.cream} />
              <circle cx={40} cy={30} r={18} fill={R.cream} />
              <circle cx={60} cy={-40} r={16} fill={COL.yellow} stroke={INK} strokeWidth={3} />
              <path d="M-80,-40 l12,-8 l6,14Z" fill="#38c6d6" />
            </Pinned>
            <Pinned t={t} t0={126.9} x={1500} y={600} rot={-18}>
              <rect x={-120} y={-45} width={240} height={90} fill="#f2e3a1" {...K} />
              <path d="M60,-45 L60,45" stroke={INK} strokeWidth={3} strokeDasharray="8 8" />
              <rect x={-100} y={-25} width={130} height={14} fill={R.rust} opacity={0.7} />
              <rect x={-100} y={2} width={90} height={10} fill={INK} opacity={0.4} />
            </Pinned>
            <Pinned t={t} t0={127.7} x={1000} y={150} rot={22}>
              <rect x={-60} y={-60} width={120} height={120} fill="#ffe36a" {...K} />
              <path d="M-35,-20 Q0,-50 35,-20 M-30,20 L30,20" stroke="#2a3a63" strokeWidth={5} fill="none" />
            </Pinned>
            <Pinned t={t} t0={128.4} x={1720} y={880} rot={-9}>
              <Vinyl x={0} y={0} r={90} label="#5fbf7a" spin={t * 30} />
            </Pinned>
          </Layer>
        </Board>
      </Cam>
      <Wobble t={t} t0={S[27] + 0.1} t1={125.6} x={1120} y={520} text="возьми телефоон деткаа" size={84} />
      <Fig src="cast/now.png" x={lerp(2250, 1650, now)} y={1130} h={1040} t={t} head={lerp(0, 4.5, ease(ph(t, 130.5, 131.4)))} seed={16} />
    </Page>
  );
};

/* ================================================================ 10
   Годовые кольца: дерево не меняет древесину, оно нарастает. Срез
   превращается в пластинку. Потом стена фотографий: упавшую рамку
   вешают обратно на гвоздь. Дверь в комнату подростка: заглянуть
   и аккуратно закрыть. */
const WALL = [
  { src: "cast/r1.png", x: 330 },
  { src: "cast/r2.png", x: 640 },
  { src: "cast/su.png", x: 950 },
  { src: "cast/sp.png", x: 1260 },
];
export const C10: React.FC<{ t: number }> = ({ t }) => {
  const rings = lerp(0, 5, ph(t, 132.2, 135.0));
  const m = inout(ph(t, 134.9, 136.2));
  const photos = t >= S[31] - 0.05 && t < S[32] - 0.05;
  const door = t >= S[32] - 0.05;
  /* рамка r2: с пола на гвоздь, качается и замирает */
  const lift = inout(ph(t, 137.2, 138.3));
  const sw = t > 138.3 ? Math.sin((t - 138.3) * 7) * 9 * Math.exp(-(t - 138.3) * 1.6) : 0;
  const op = ease(ph(t, S[32] + 0.9, S[32] + 1.7)) * (1 - ease(ph(t, 144.6, 145.5)));
  const walk = ease(ph(t, 145.4, 146.8));
  return (
    <Page t={t}>
      {!photos && !door ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#efe2c6" }} />
          <Layer>
            <Rings x={960} y={540} r={330} n={rings} m={m} spin={m * (t - 135) * 40} />
          </Layer>
        </>
      ) : null}
      {photos ? (
        <>
          <Room horizon={860} wall="#e4d8bd" />
          {WALL.map((w, i) => {
            const isR2 = i === 1;
            const y = isR2 ? lerp(900, 380, lift) : 380;
            const rot = isR2 ? lerp(-70, 0, lift) + sw : [-1.5, 0, 1, -0.8][i];
            return (
              <div key={i} style={{ position: "absolute", left: w.x - 120, top: y - 150, width: 240, height: 300, transform: `rotate(${rot}deg)`, transformOrigin: "50% 0%" }}>
                <Layer w={240} h={300} style={{ overflow: "visible" }}>
                  <path d="M120,-40 L40,10 M120,-40 L200,10" stroke={INK} strokeWidth={3} />
                  <FrameRect x={120} y={150} w={190} h={250} color={[R.woodD, R.mustard, "#7a7a80", R.wood][i]} />
                </Layer>
                <div style={{ position: "absolute", left: 25, top: 25, width: 190, height: 250, overflow: "hidden", background: "#e9dfcb" }}>
                  <Fig src={w.src} x={95} y={560} h={560} t={t} shadow={false} breathe={false} />
                </div>
              </div>
            );
          })}
          <Layer>
            {WALL.map((w, i) => (
              <circle key={i} cx={w.x} cy={190} r={7} fill={INK} />
            ))}
          </Layer>
          <Fig src="cast/now.png" x={1610} y={1060} h={930} t={t} head={lerp(0, -4, ease(ph(t, 137.0, 137.8)))} flip seed={17} />
        </>
      ) : null}
      {door ? (
        <>
          <Room horizon={900} wall="#d9e0d2" />
          <Layer>
            <G x={760} y={300}>
              <Door
                x={0}
                y={0}
                open={op}
                sign={"11–15\nне входить!!!"}
                inside={
                  <>
                    <rect x={0} y={0} width={300} height={600} fill="#ffcf7a" opacity={0.85} />
                    <rect x={0} y={0} width={300} height={600} fill="url(#roomGlow)" />
                    <defs>
                      <radialGradient id="roomGlow">
                        <stop offset="0" stopColor="#fff2c0" />
                        <stop offset="1" stopColor="#e08a3a" />
                      </radialGradient>
                    </defs>
                  </>
                }
              />
            </G>
          </Layer>
          <div style={{ position: "absolute", left: 760, top: 300, width: 300, height: 600, overflow: "hidden", opacity: op > 0.05 ? 1 : 0, clipPath: `inset(0 0 0 ${(1 - op * 0.82) * 100}%)` }}>
            <Fig src="poses/r1-headbang.png" x={190} y={640} h={560} t={t} rot={Math.sin(t * Math.PI * 4.1) * 3} bob={Math.max(0, Math.sin(t * Math.PI * 4.1)) * 8} shadow={false} filter="saturate(.9) sepia(.25) brightness(1.05)" />
          </div>
          <Fig src="cast/now.png" x={lerp(1340, 2300, walk)} y={1060} h={900} t={t} flip={walk > 0.02} head={op * -4} seed={18} />
        </>
      ) : null}
    </Page>
  );
};

/* ================================================================ 11
   Они сидят рядом и молчат. Игла опускается на старую пластинку.
   Он поднимает палец — начать рассказ… но начинается припев, и он
   кивает в такт рядом с подростком. Ручку — до 11. Все пятеро в комнате. */
export const C11: React.FC<{ t: number }> = ({ t }) => {
  const k = kick(t);
  const lv = loud(t);
  const seg = t < S[34] - 0.05 ? 0 : t < S[35] - 0.05 ? 1 : t < S[36] - 0.05 ? 2 : t < S[37] - 0.05 ? 3 : t < 159.85 ? 4 : 5;
  const beat = Math.sin(t * Math.PI * 2 * 2.0);
  return (
    <Page t={t} shake={seg >= 3 ? k * 2.5 : 0}>
      {seg === 0 ? (
        <Cam s={move(t, S[33], S[34], 1, 1.1)} ox={960} oy={760}>
          <Room horizon={760} wall="#e8d4b4" />
          <Layer>
            <Window x={960} y={330} w={420} h={380} day={0.8} id="w11a" />
            <Lamp x={1620} y={250} on={0.85} />
          </Layer>
          <Fig src="poses/duo-sit.png" x={960} y={1060} h={820} t={t} seed={19} />
        </Cam>
      ) : null}
      {seg === 1 ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#5a4030" }} />
          <Layer>
            <TurntableTop x={900} y={560} s={1.5} spin={t * 200 * ph(t, 151.3, 151.6)} arm={t < 150.9 ? -1 + ease(ph(t, 150.7, 150.9)) : 0.02} lift={1 - ease(ph(t, 151.0, 151.3))} label={R.red} wear={0.6} />
          </Layer>
        </>
      ) : null}
      {seg === 2 ? (
        <>
          <Room horizon={800} wall="#e8d4b4" />
          <Layer>
            <TurntableSide x={420} y={800} t={t} />
          </Layer>
          <Fig src="poses/now-explain.png" x={1160} y={1085} h={800} t={t} head={Math.sin(t * 4.3) * 2.5} bob={2} seed={20} />
          <Fig src="cast/r1.png" x={500} y={1040} h={700} t={t} head={-3} seed={21} />
        </>
      ) : null}
      {seg === 3 ? (
        <>
          <Room horizon={800} wall="#ead0a8" />
          <Layer>
            <TurntableSide x={1500} y={800} t={t} />
          </Layer>
          <Fig src="poses/r1-headbang.png" x={620} y={1050} h={900} t={t} rot={beat * 3 + k * 1.5} bob={Math.max(0, beat) * 16} seed={22} />
          <Fig src="cast/now.png" x={1150} y={1050} h={930} t={t} head={beat * 6} bob={Math.max(0, beat) * 6} seed={23} />
        </>
      ) : null}
      {seg === 4 ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#3e3a3a" }} />
          <Layer>
            <Amp x={960} y={540} s={1.35} v={lerp(6, 11, inout(ph(t, 157.6, 159.0)))} vu={clamp(lv * 1.1)} />
          </Layer>
        </>
      ) : null}
      {seg === 5 ? <Finale t={t} k={k} /> : null}
    </Page>
  );
};

const CAST = [
  { src: "cast/r1.png", x: 300, h: 650 },
  { src: "cast/r2.png", x: 640, h: 690 },
  { src: "cast/su.png", x: 960, h: 700 },
  { src: "cast/sp.png", x: 1280, h: 705 },
  { src: "cast/now.png", x: 1620, h: 720 },
];
const Finale: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  const title = ease(ph(t, 164.4, 165.4));
  const end = ease(ph(t, 168.6, 169.8));
  return (
    <>
      <Room horizon={820} wall="#ecd2a6" dim={0.12} />
      <Layer>
        <Window x={960} y={300} w={420} h={340} day={0.35} id="w11b" />
        <Lamp x={300} y={180} on={0.8 + k * 0.15} swing={Math.sin(t * 2) * 4} />
        <Lamp x={1640} y={180} on={0.8 + k * 0.15} swing={-Math.sin(t * 2) * 4} />
      </Layer>
      {CAST.map((c, i) => {
        const ph0 = i * 0.9;
        const b = Math.sin(t * Math.PI * 2 * 2.0 + ph0);
        return <Fig key={i} src={c.src} x={c.x + Math.sin(t * 1.3 + i) * 10} y={1010} h={c.h} t={t} head={b * (4 + (i === 0 ? 5 : 0))} bob={Math.max(0, b) * (8 + k * 6)} rot={Math.sin(t * 2 + i) * 1.4} seed={30 + i} />;
      })}
      {/* пластинки-конфетти */}
      <Layer>
        {Array.from({ length: 16 }).map((_, i) => {
          const u = ((t - 160) * 0.12 + hash(i)) % 1;
          return <Vinyl key={i} x={hash(i + 1) * 1920} y={-80 + u * 1200} r={22 + hash(i + 2) * 18} spin={t * 200 + i * 40} label={[R.red, R.mustard, R.teal, R.pink][i % 4]} op={0.9} />;
        })}
      </Layer>
      {title > 0 ? (
        <div style={{ position: "absolute", left: 960, top: 520, transform: `translate(-50%,-50%) rotate(-2deg) scale(${0.85 + title * 0.15})`, opacity: title }}>
          <div style={{ background: "#fbf3df", border: `6px solid ${INK}`, boxShadow: `12px 12px 0 ${INK}`, padding: "34px 70px 30px", textAlign: "center" }}>
            <div style={{ font: '400 110px/1 "Rubik Mono One"', color: INK, letterSpacing: "0.02em" }}>ОДНА ВЕЩЬ</div>
            <div style={{ font: '400 54px/1.2 "Pangolin"', color: R.rust, marginTop: 16 }}>моя музыкальная эволюция</div>
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "#f2ead8", opacity: end }} />
    </>
  );
};
