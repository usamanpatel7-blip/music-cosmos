import React from "react";
import { AbsoluteFill } from "remotion";
import Peep from "react-peeps";

type PP = React.ComponentProps<typeof Peep>;
const BODIES = [
  "BlazerBlackTee", "Shirt", "ButtonShirt", "Gaming", "Geek", "Hoodie", "PointingUp", "Thunder", "Turtleneck", "ArmsCrossed", "Coffee", "Device", "DotJacket", "Explaining", "FurJacket", "Killer", "Paper", "PocketShirt", "PoloSweater", "ShirtCoat", "ShirtFilled", "SportyShirt", "StripedShirt", "Sweater", "SweaterDots", "Whatever",
  "BlazerWB", "BlazerPantsWB", "CrossedArmsWB", "EasingWB", "PointingFingerWB", "RestingWB", "RoboDanceWB", "ShirtWB", "ShirtPantsWB", "WalkingWB",
  "ClosedLegWB", "CrossedLegs", "HandsBackWB", "MediumWB", "OneLegUpWB", "Bike",
];
const FACES = ["Angry", "Awe", "Blank", "Calm", "CalmNM", "Cheeky", "CheersNM", "Concerned", "ConcernedFear", "Contempt", "Cute", "Driven", "EatingHappy", "Explaining", "EyesClosed", "Fear", "Hectic", "LoveGrin", "LoveGrinTeeth", "Rage", "Serious", "Smile", "SmileBig", "SmileLol", "SmileNM", "SmileTeeth", "Solemn", "Suspicious", "Tired", "VeryAngry"];

export const CatalogBodies: React.FC<{ page: number }> = ({ page }) => (
  <AbsoluteFill style={{ background: "#f3ead9", flexDirection: "row", flexWrap: "wrap", padding: 6, gap: 4 }}>
    {BODIES.slice(page * 21, page * 21 + 21).map((b) => (
      <div key={b} style={{ width: 268, height: 350, border: "1px solid #ccc", textAlign: "center", overflow: "hidden" }}>
        <Peep style={{ width: 268, height: 325 }} body={b as PP["body"]} hair="Short" face="Calm" strokeColor="#1d1d22" backgroundColor="#fffaf0" viewBox={{ x: "-300", y: "-100", width: "1500", height: "2200" }} />
        <div style={{ font: "600 15px sans-serif", marginTop: -6 }}>{b}</div>
      </div>
    ))}
  </AbsoluteFill>
);

export const CatalogFaces: React.FC = () => (
  <AbsoluteFill style={{ background: "#f3ead9", flexDirection: "row", flexWrap: "wrap", padding: 6, gap: 4 }}>
    {FACES.map((f) => (
      <div key={f} style={{ width: 230, height: 255, textAlign: "center" }}>
        <Peep style={{ width: 230, height: 230 }} body="Shirt" hair="Pomp" face={f as PP["face"]} strokeColor="#1d1d22" backgroundColor="#fffaf0" viewBox={{ x: "150", y: "0", width: "600", height: "600" }} />
        <div style={{ font: "600 15px sans-serif" }}>{f}</div>
      </div>
    ))}
  </AbsoluteFill>
);

const HAIRS = ["ShortMessy", "ShortScratch", "ShortWavy", "ShortCurly", "FlatTop", "FlatTopLong", "Medium", "MediumShort", "MediumStraight", "MediumShade", "Mohawk", "MohawkDino", "ShavedSides", "ShavedWavy", "Short", "ShortVolumed", "Pomp", "Bear", "HatHip", "Beanie"];
export const CatalogHair: React.FC = () => (
  <AbsoluteFill style={{ background: "#f3ead9", flexDirection: "row", flexWrap: "wrap", padding: 6, gap: 4 }}>
    {HAIRS.map((h) => (
      <div key={h} style={{ width: 370, height: 260, textAlign: "center" }}>
        <Peep style={{ width: 240, height: 230 }} body="FurJacket" hair={h as PP["hair"]} face="Calm" strokeColor="#1d1d22" backgroundColor="#fffaf0" viewBox={{ x: "100", y: "-60", width: "700", height: "700" }} />
        <div style={{ font: "600 15px sans-serif" }}>{h}</div>
      </div>
    ))}
  </AbsoluteFill>
);
