import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUES, INK, PAPER } from "./engine";

// Субтитры: одна фраза на плашке, каждая новая чуть «впрыгивает».
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = CUES.find((q) => t >= q.t0 - 0.05 && t <= q.t1);
  if (!cue) return null;
  const start = Math.round((cue.t0 - 0.05) * fps);
  const u = spring({
    frame: frame - start,
    fps,
    config: { damping: 14, stiffness: 220 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 28,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          padding: "10px 32px 12px",
          background: PAPER + "eb",
          border: `3px solid ${INK}`,
          borderRadius: 14,
          color: INK,
          font: '600 36px/46px "Golos Text"',
          textAlign: "center",
          textWrap: "balance",
          opacity: Math.min(1, u * 1.6),
          transform: `translateY(${(1 - u) * 18}px) scale(${0.94 + 0.06 * u})`,
          transformOrigin: "50% 100%",
        }}
      >
        {cue.s}
      </div>
    </div>
  );
};
