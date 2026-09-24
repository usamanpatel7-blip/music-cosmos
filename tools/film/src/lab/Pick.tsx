import React from "react";
import { AbsoluteFill } from "remotion";
import Peep from "react-peeps";

type B = React.ComponentProps<typeof Peep>["body"];
type Hr = React.ComponentProps<typeof Peep>["hair"];
const ITEMS: [B, Hr, string, string][] = [
  ["Thunder", "ShortMessy", "#f25d8e", "Thunder"],
  ["BlazerWB", "MediumShort", "#e0a93b", "BlazerWB"],
  ["BlazerBlackTee", "ShortMessy", "#7ec8e3", "BlazerBlackTee"],
  ["ShirtCoat", "Short", "#9bd18b", "ShirtCoat"],
  ["BlazerPantsBW", "Short", "#c7b6f0", "BlazerPantsBW"],
  ["Turtleneck", "Short", "#f28c5d", "Turtleneck"],
  ["Hoodie", "ShortVolumed", "#5dd1c0", "Hoodie"],
  ["SportyShirt", "ShortVolumed", "#f2d05d", "SportyShirt"],
  ["PoloSweater", "Pomp", "#e9d5b8", "PoloSweater"],
  ["Sweater", "Pomp", "#b8d4e9", "Sweater"],
  ["EasingWB", "Pomp", "#f5b7b1", "EasingWB"],
  ["PocketShirt", "Pomp", "#d0e9b8", "PocketShirt"],
];
export const Pick: React.FC = () => (
  <AbsoluteFill style={{ background: "#fbf6ee", flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 10 }}>
    {ITEMS.map(([b, h, c, n]) => (
      <div key={n} style={{ width: 300, height: 520, background: c, borderRadius: 20, overflow: "hidden", textAlign: "center" }}>
        <Peep style={{ width: 300, height: 470 }} body={b} hair={h} face="Calm" strokeColor="#1d1d22" backgroundColor="#fffaf0" viewBox={{ x: "-100", y: "-50", width: "1100", height: "1700" }} />
        <div style={{ font: "600 18px sans-serif" }}>{n}</div>
      </div>
    ))}
  </AbsoluteFill>
);
