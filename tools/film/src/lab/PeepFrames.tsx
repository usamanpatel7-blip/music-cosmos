import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import Peep from "react-peeps";

/* Пробные кадры в стиле Open Peeps: чёрная линия от руки, один цвет фона
   на главу, реквизит — той же толстой линией. */

type PeepP = React.ComponentProps<typeof Peep>;
const INK = "#1d1d22";
const FILL = "#fffaf0";

const Guy: React.FC<{ x: number; y: number; h: number; body: PeepP["body"]; hair: PeepP["hair"]; face: PeepP["face"]; flip?: boolean; rot?: number }> = ({ x, y, h, body, hair, face, flip, rot = 0 }) => (
  <div style={{ position: "absolute", left: x - h * 0.33, top: y, width: h * 0.66, height: h, transform: `scaleX(${flip ? -1 : 1}) rotate(${rot}deg)`, transformOrigin: "50% 100%" }}>
    <Peep style={{ width: "100%", height: "100%" }} body={body} hair={hair} face={face} strokeColor={INK} backgroundColor={FILL} viewBox={{ x: "-60", y: "-40", width: "1000", height: "1500" }} />
  </div>
);

const Bubble: React.FC<{ x: number; y: number; text: string; tail?: "l" | "r"; rot?: number }> = ({ x, y, text, tail = "l", rot = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)` }}>
    <div style={{ background: FILL, border: `6px solid ${INK}`, borderRadius: 40, padding: "14px 30px", font: '600 40px "Golos Text"', color: INK, whiteSpace: "nowrap", position: "relative" }}>
      {text}
      <svg width="60" height="50" style={{ position: "absolute", top: "100%", marginTop: -6, [tail === "l" ? "left" : "right"]: 40 }}>
        <path d={tail === "l" ? "M4,0 L10,44 L44,0" : "M16,0 L50,44 L56,0"} fill={FILL} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={tail === "l" ? "M8,0 L44,0" : "M16,0 L52,0"} stroke={FILL} strokeWidth={8} />
      </svg>
    </div>
  </div>
);

const Sub: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center" }}>
    <div style={{ maxWidth: 1500, padding: "12px 30px 14px", background: INK, color: FILL, borderRadius: 16, font: '600 40px/1.3 "Golos Text"', textAlign: "center", textWrap: "balance" }}>{text}</div>
  </div>
);

const Record: React.FC<{ r: number; label: string; rot: number }> = ({ r, label, rot }) => (
  <g transform={`rotate(${rot})`}>
    <circle r={r} fill={INK} />
    <circle r={r * 0.72} fill="none" stroke="#45454d" strokeWidth={3} />
    <circle r={r * 0.34} fill={label} stroke={INK} strokeWidth={5} />
    <circle r={r * 0.05} fill={FILL} />
    <path d={`M${-r * 0.55},${-r * 0.45} q${r * 0.2},${-r * 0.2} ${r * 0.45},${-r * 0.25}`} stroke={FILL} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

export const PeepRoom: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 24;
  return (
    <AbsoluteFill style={{ background: "#f7b8c8" }}>
      {/* фон: большие круги-пластинки */}
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <circle cx={1650} cy={170} r={260} fill="#f5a3b8" />
        <circle cx={240} cy={930} r={320} fill="#f5a3b8" />
      </svg>
      <Guy x={290} y={260} h={760} body="Thunder" hair="ShortMessy" face="Rage" rot={-3} />
      <Guy x={620} y={220} h={800} body="BlazerBlackTee" hair="ShortMessy" face="Explaining" />
      <Guy x={960} y={210} h={810} body="ShirtCoat" hair="Short" face="Serious" flip />
      <Guy x={1290} y={225} h={800} body="Hoodie" hair="ShortVolumed" face="Cheeky" flip />
      <Guy x={1620} y={210} h={820} body="PoloSweater" hair="Pomp" face="Concerned" flip rot={2} />
      {/* передний план: тумба с проигрывателем */}
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <rect x={-20} y={800} width={1960} height={300} fill="#e7556f" stroke={INK} strokeWidth={8} />
        <g transform="translate(960,800)">
          <rect x={-260} y={-60} width={520} height={70} rx={14} fill={FILL} stroke={INK} strokeWidth={8} />
          <g transform="translate(-40,-64) scale(1,0.24)">
            <Record r={190} label="#f2d05d" rot={t * 200} />
          </g>
          <path d="M200,-130 L170,-40" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <circle cx={200} cy={-134} r={16} fill={FILL} stroke={INK} strokeWidth={7} />
        </g>
      </svg>
      <Bubble x={90} y={70} text="Поставь моё!" rot={-3} />
      <Bubble x={540} y={30} text="Нет, моё!" rot={2} />
      <Bubble x={1080} y={40} text="Бах!" tail="r" rot={-2} />
      <Bubble x={1370} y={80} text="Три пианиста!" tail="r" rot={3} />
      <Sub text="Иначе мы бы так и не познакомились: каждый потребовал бы поставить своё." />
    </AbsoluteFill>
  );
};

export const PeepStage: React.FC = () => {
  const t = useCurrentFrame() / 24 + 16;
  const bang = Math.sin(t * 8.8) * 7;
  return (
    <AbsoluteFill style={{ background: "#f2d05d" }}>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2 + t * 0.2;
          return <path key={i} d={`M960,560 L${960 + Math.cos(a) * 1400},${560 + Math.sin(a) * 1400} L${960 + Math.cos(a + 0.2) * 1400},${560 + Math.sin(a + 0.2) * 1400}Z`} fill="#f5c842" />;
        })}
        {[330, 1590].map((x) => (
          <g key={x} transform={`translate(${x},600)`}>
            <rect x={-150} y={-260} width={300} height={560} rx={16} fill={INK} />
            <circle cy={-140} r={70 + Math.abs(Math.sin(t * 8.8)) * 6} fill="#45454d" stroke={FILL} strokeWidth={6} />
            <circle cy={100} r={110 + Math.abs(Math.sin(t * 8.8)) * 8} fill="#45454d" stroke={FILL} strokeWidth={6} />
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", font: '400 150px "Rubik Mono One"', color: INK, transform: "rotate(-3deg)" }}>ХЭВИ-МЕТАЛ</div>
      <Guy x={960} y={250} h={900} body="Thunder" hair="ShortMessy" face="Rage" rot={bang} />
      <Sub text="Причём не отдельную песню — альбом целиком, от первой секунды до последней." />
    </AbsoluteFill>
  );
};
