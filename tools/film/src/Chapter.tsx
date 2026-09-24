import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { drawCast, drawScene, paper } from "./engine";

// Одна глава фильма. Время сцены — глобальное: начало главы + кадр внутри неё,
// поэтому рисунок совпадает с озвучкой, даже когда шторка тянет главу дальше.
export const Chapter: React.FC<{ idx: number; from: number }> = ({
  idx,
  from,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (from + frame) / fps;
  const html = useMemo(() => drawScene(idx, t), [idx, t]);
  return <Sheet html={html} t={t} id={`boil${idx}`} />;
};

// Лист персонажа: все версии героя рядом (композиция Cast в Studio).
export const Cast: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  return (
    <div
      style={{
        position: "absolute",
        width: 1600,
        height: 900,
        transform: `scale(${width / 1600})`,
        transformOrigin: "0 0",
      }}
    >
      <Sheet html={drawCast(t)} t={t} id="boilCast" />
    </div>
  );
};

const Sheet: React.FC<{ html: string; t: number; id: string }> = ({
  html,
  t,
  id: boil,
}) => {
  // линии «кипят» — двенадцать рисунков в секунду, как в покадровой анимации
  const seed = 1 + (Math.floor(t * 12) % 9);
  return (
    <svg
      viewBox="0 0 1600 900"
      width={1600}
      height={900}
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <filter id={boil} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022"
            numOctaves={2}
            seed={seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <pattern
          id="ht"
          width={9}
          height={9}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(28)"
        >
          <circle cx={4.5} cy={4.5} r={2} fill="#23308a" />
        </pattern>
        <pattern
          id="htp"
          width={9}
          height={9}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <circle cx={4.5} cy={4.5} r={2.4} fill="#ff5d8f" />
        </pattern>
        <pattern
          id="eye"
          width={12}
          height={12}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle
            cx={6}
            cy={6}
            r={1.8}
            fill="none"
            stroke="#c9bfae"
            strokeWidth={1.2}
          />
        </pattern>
        <pattern
          id="hty"
          width={10}
          height={10}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(10)"
        >
          <circle cx={5} cy={5} r={3} fill="#ffd23c" />
        </pattern>
      </defs>
      <style>{".m{mix-blend-mode:multiply}"}</style>
      <image
        href={paper()}
        x={0}
        y={0}
        width={1600}
        height={900}
        preserveAspectRatio="none"
      />
      <g filter={`url(#${boil})`} dangerouslySetInnerHTML={{ __html: html }} />
    </svg>
  );
};
