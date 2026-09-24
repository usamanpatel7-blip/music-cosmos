import React from "react";
import { AbsoluteFill } from "remotion";
import { Character, CharacterDefs } from "./Character";

// Лист персонажей: все версии рядом.
export const Cast2: React.FC = () => (
  <AbsoluteFill style={{ background: "#efe4d2" }}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs><CharacterDefs /></defs>
      <rect x={0} y={880} width={1920} height={200} fill="#d9c3a2" />
      <Character look="rocker" younger x={260} y={900} mouth="grin" />
      <Character look="rocker" x={600} y={900} mouth="smirk" eyes="side" />
      <Character look="suit" x={950} y={900} mouth="flat" />
      <Character look="sport" x={1300} y={900} mouth="smile" pose={{ armR: [0.5, 1.9] }} />
      <Character look="oldmoney" x={1650} y={900} mouth="smile" />
    </svg>
  </AbsoluteFill>
);
