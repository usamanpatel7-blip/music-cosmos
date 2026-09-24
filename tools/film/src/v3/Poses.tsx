import React from "react";
import { AbsoluteFill } from "remotion";
import { Figure } from "./Figure";

// Лист поз силуэтов.
export const Poses: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #f25d8e, #c8326a)" }}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <Figure look="rocker" younger x={230} y={960} s={1} pose={{ armF: [2.7, 0.3], hornsF: true, armB: [0.5, 1.2], fistB: true, head: 18, lean: 0.12, legB: [-0.25, 0.05], legF: [0.25, 0.05] }} />
      <Figure look="rocker" x={560} y={960} pose={{ pocketB: true, pocketF: true, legF: [0.16, 0.12], hipX: 6, head: -4 }} />
      <Figure look="suit" x={900} y={960} dir={-1} pose={{ armF: [0.2, 1.7], armB: [0.05, 0.2], legB: [-0.05, 0], legF: [0.12, 0.05] }} />
      <Figure look="sport" x={1260} y={960} pose={{ armF: [1.9, 0.5], armB: [0.1, 0.3], lean: -0.05, legB: [-0.1, 0.05], legF: [0.14, 0.1] }} />
      <Figure look="oldmoney" x={1620} y={960} dir={-1} pose={{ pocketF: true, armB: [0.25, 1.9], head: 8, legF: [0.2, 0.2], legB: [-0.04, 0] }} />
    </svg>
  </AbsoluteFill>
);
