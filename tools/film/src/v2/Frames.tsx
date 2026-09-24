import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, CharacterDefs, Hands } from "./Character";
import { Record, Room, SetDefs, Speaker, Turntable } from "./Set";

/* Пробные кадры нового фильма (композиции Frame-*). */

const Bubble: React.FC<{ x: number; y: number; text: string; tail?: number; color?: string; ink?: string; size?: number }> = ({ x, y, text, tail = 0, color = "#fffaf1", ink = "#1d2230", size = 30 }) => {
  const w = text.length * size * 0.62 + 56;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-w / 2 + 6} y={-38 + 8} width={w} height={76} rx={38} fill="#000" opacity={0.12} />
      <path d={`M${tail - 16},30 L${tail},64 L${tail + 18},30Z`} fill={color} />
      <rect x={-w / 2} y={-38} width={w} height={76} rx={38} fill={color} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={size} fill={ink}>
        {text}
      </text>
    </g>
  );
};

export const Sub: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 54, display: "flex", justifyContent: "center" }}>
    <div
      style={{
        maxWidth: 1400,
        padding: "14px 34px 16px",
        borderRadius: 18,
        background: "rgba(20,16,24,.62)",
        backdropFilter: "blur(8px)",
        color: "#fffaf1",
        font: '600 42px/1.3 "Golos Text"',
        textAlign: "center",
        textWrap: "balance",
      }}
    >
      {text}
    </div>
  </div>
);

const Frame: React.FC<{ children: React.ReactNode; sub?: string; cam?: string }> = ({ children, sub, cam }) => (
  <AbsoluteFill style={{ background: "#1a141c" }}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <CharacterDefs />
        <SetDefs />
      </defs>
      <g transform={cam}>{children}</g>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vignette)" />
    </svg>
    {sub ? <Sub text={sub} /> : null}
  </AbsoluteFill>
);

const holdRecord = (label: string, rot: number) => (h: Hands) => <Record x={h.r[0] + 6} y={h.r[1] - 46} r={50} label={label} rot={rot} />;

export const FrameRoom: React.FC = () => {
  const t = useCurrentFrame() / useVideoConfig().fps + 12;
  const up: [number, number] = [2.5 + Math.sin(t * 4) * 0.1, 0.35];
  return (
    <Frame sub="Иначе мы бы так и не познакомились: каждый потребовал бы поставить своё." cam="translate(960,560) scale(1.04) translate(-960,-560)">
      <Room t={t} />
      <Turntable x={860} y={640} rot={t * 200} armOn={false} />
      <Character look="rocker" younger x={250} y={960} s={0.86} mouth="shout" brows={1} pose={{ armR: up, armL: [0.2, 0.3] }} hold={holdRecord("#d9623b", t * 90)} />
      <Character look="rocker" x={520} y={975} s={0.9} mouth="talk" talk={t} eyes="side" pose={{ armR: [2.3, 0.5], armL: [0.3, 0.9] }} hold={holdRecord("#e0a93b", -t * 80)} />
      <Character look="oldmoney" x={1150} y={955} s={0.9} mouth="smile" eyes="side" pose={{ armL: [0.9, 1.1], armR: [0.15, 0.2], tilt: -4 }} />
      <Character look="suit" x={1430} y={985} s={0.92} mouth="talk" talk={t + 1} pose={{ armR: up, armL: [0.1, 0.1] }} hold={holdRecord("#2e4a6b", t * 60)} />
      <Character look="sport" x={1700} y={965} s={0.9} mouth="grin" pose={{ armR: [2.6, 0.2], armL: [0.4, 1.4] }} hold={holdRecord("#3c6e5a", -t * 70)} />
      <Bubble x={260} y={300} text="Поставь моё!" tail={0} />
      <Bubble x={640} y={150} text="Нет, моё!" tail={-80} color="#e0a93b" />
      <Bubble x={1300} y={170} text="Бах!" tail={80} color="#2e4a6b" ink="#fffaf1" />
      <Bubble x={1640} y={250} text="Три пианиста!" tail={60} />
    </Frame>
  );
};

export const FrameStage: React.FC = () => {
  const t = useCurrentFrame() / useVideoConfig().fps + 16;
  const beat = Math.abs(Math.sin(t * 8.8));
  const bang = Math.sin(t * 8.8) * 16;
  return (
    <Frame sub="Причём не отдельную песню — альбом целиком, от первой секунды до последней.">
      <rect x={0} y={0} width={1920} height={1080} fill="#15111b" />
      <rect x={0} y={780} width={1920} height={300} fill="url(#stageFloor)" />
      {/* задник: огни */}
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={80 + i * 135} cy={90} r={14} fill={i % 2 ? "#e0a93b" : "#d9623b"} opacity={0.35 + 0.5 * Math.abs(Math.sin(t * 3 + i))} />
      ))}
      <path d="M800,0 L1120,0 L1420,1080 L500,1080Z" fill="url(#spot)" opacity={0.55} />
      <ellipse cx={960} cy={900} rx={380} ry={60} fill="#ffe7a8" opacity={0.35} />
      <Speaker x={330} y={900} s={1.3} pulse={beat} />
      <Speaker x={1590} y={900} s={1.3} pulse={beat} />
      <Character look="rocker" younger x={960} y={930} s={1.25} mouth="shout" eyes="closed" pose={{ tilt: bang, armR: [1.7, 1.3], armL: [0.7, 1.6], lean: bang * 0.25, spread: 60 }} />
      <text x={960} y={230} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={120} fill="#d9623b" transform={`rotate(-3 960 230)`}>
        ХЭВИ-МЕТАЛ
      </text>
      <g transform="translate(1590,250)">
        <Record x={0} y={0} r={110} label="#e0a93b" rot={t * 140} />
        <text x={0} y={-130} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={34} fill="#fffaf1">
          37:12 / 42:11
        </text>
      </g>
    </Frame>
  );
};

export const FrameNow: React.FC = () => {
  const t = useCurrentFrame() / useVideoConfig().fps + 160;
  return (
    <Frame sub="Ладно, эту погромче." cam="translate(960,540) scale(1.35) translate(-900,-560)">
      <Room t={t} />
      <Turntable x={560} y={640} rot={t * 200} armOn />
      <Character look="oldmoney" x={1000} y={1000} s={0.98} mouth="smile" eyes="closed" pose={{ tilt: Math.sin(t * 2.2) * 5, armL: [0.9, 1.3], armR: [0.25, 0.3] }} />
      {[0, 1, 2, 3].map((i) => {
        const u = (t * 0.35 + i / 4) % 1;
        return (
          <text key={i} x={700 + i * 60 + Math.sin(t + i) * 30} y={520 - u * 260} fontSize={54} fill={["#d9623b", "#2e4a6b", "#e0a93b", "#3c6e5a"][i]} opacity={1 - u}>
            ♪
          </text>
        );
      })}
    </Frame>
  );
};
