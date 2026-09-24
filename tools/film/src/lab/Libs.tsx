import React from "react";
import { AbsoluteFill } from "remotion";
import Peep from "react-peeps";
// @ts-expect-error — у пакета нет типов
import * as H from "react-humaaans";

const HUM = Array.from({ length: 24 }, (_, i) => "Standing" + (i + 1));
export const LibHumaaans: React.FC = () => (
  <AbsoluteFill style={{ background: "#f3ead9", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", padding: 20, gap: 6 }}>
    {HUM.map((n, i) => {
      const C = (H as Record<string, React.FC<Record<string, unknown>>>)[n];
      return (
        <div key={n} style={{ width: 150, height: 520, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <C height={480} hairColor="#c9a25e" skinColor="#f2c9a8" shirtColor="#e3dccc" coatColor="#1d1d22" pantColor="#2c3246" shoeColor="#1d1d22" />
          <div style={{ font: "600 18px sans-serif" }}>{i + 1}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

const POSES = ["BlazerBW", "BlazerPantsBW", "CrossedArmsBW", "EasingBW", "PointingFingerBW", "RestingBW", "RoboDanceBW", "ShirtBW", "ShirtPantsBW", "WalkingBW"] as const;
const HAIR = ["Pomp", "ShortMessy", "Medium", "ShortVolumed", "MediumShort"] as const;
export const LibPeeps: React.FC = () => (
  <AbsoluteFill style={{ background: "#f3ead9", flexDirection: "row", flexWrap: "wrap", padding: 20, gap: 4 }}>
    {POSES.map((b, i) => (
      <div key={b} style={{ width: 370, height: 510, textAlign: "center" }}>
        <Peep style={{ width: 360, height: 480 }} viewBox={{ x: "-150", y: "-50", width: "1300", height: "1750" }} body={b} hair={HAIR[i % HAIR.length]} face={(["Calm", "Smile", "Explaining", "EyesClosed", "SmileBig"] as const)[i % 5]} strokeColor="#1d1d22" backgroundColor="#fffaf0" />
        <div style={{ font: "600 18px sans-serif" }}>{b}</div>
      </div>
    ))}
  </AbsoluteFill>
);
