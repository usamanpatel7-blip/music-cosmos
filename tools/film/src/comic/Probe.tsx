import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Narration, S } from "./kit";
import { C1, C2, C3, C4 } from "./scenes1";
import { C5, C6, C7, C8 } from "./scenes2";
import { C9, C10, C11 } from "./scenes3";

// Главы комикса и их начала (по фразам озвучки).
export const CHAPTERS: [number, React.FC<{ t: number }>][] = [
  [0, C1], [S[1], C2], [S[3], C3], [S[8], C4], [S[11], C5], [S[15], C6],
  [S[17], C7], [S[22], C8], [S[26], C9], [S[30], C10], [S[33], C11],
];

// Проверочный кадр: глава по времени t (секунды фильма) вместе с плашкой рассказчика.
export const Probe: React.FC<{ t: number }> = ({ t }) => {
  let C = CHAPTERS[0][1];
  for (const [a, c] of CHAPTERS) if (t >= a) C = c;
  return (
    <AbsoluteFill>
      <C t={t} />
      <Narration t={t} pos={(x) => (x < S[1] ? "bl" : x >= S[19] - 0.05 && x < S[22] ? "tr" : "tl")} />
    </AbsoluteFill>
  );
};

// Лента проверочных кадров: кадр i — время times[i] (рендер одной сборкой).
export const Strip: React.FC<{ times: number[] }> = ({ times }) => {
  const f = useCurrentFrame();
  return <Probe t={times[Math.min(f, times.length - 1)]} />;
};
