import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  staticFile,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { SCENES } from "./engine";
import { Chapter } from "./Chapter";
import { Subtitles } from "./Subtitles";

export type FilmProps = { subtitles: boolean };

// шторка между главами: новая глава наезжает слева направо на прежнюю
const WIPE = 9;

export const Film: React.FC<FilmProps> = ({ subtitles }) => {
  const { fps, durationInFrames, width } = useVideoConfig();
  // главы начинаются ровно на своих фразах; прежняя глава длится на шторку дольше
  const starts = SCENES.map((s, i) => (i === 0 ? 0 : Math.round(s.a * fps)));
  return (
    <AbsoluteFill style={{ backgroundColor: "#f4ecd9" }}>
      <div
        style={{
          position: "absolute",
          width: 1600,
          height: 900,
          transform: `scale(${width / 1600})`,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        <TransitionSeries>
          {SCENES.map((s, i) => {
            const last = i === SCENES.length - 1;
            const len =
              (last ? durationInFrames : starts[i + 1] + WIPE) - starts[i];
            return (
              <React.Fragment key={s.label}>
                {i > 0 ? (
                  <TransitionSeries.Transition
                    presentation={wipe({ direction: "from-left" })}
                    timing={linearTiming({
                      durationInFrames: WIPE,
                      easing: Easing.out(Easing.cubic),
                    })}
                  />
                ) : null}
                <TransitionSeries.Sequence
                  durationInFrames={len}
                  name={s.label}
                >
                  <Chapter idx={i} from={starts[i]} />
                </TransitionSeries.Sequence>
              </React.Fragment>
            );
          })}
        </TransitionSeries>
        {subtitles ? <Subtitles /> : null}
      </div>
      <Audio src={staticFile("film-audio.m4a")} />
    </AbsoluteFill>
  );
};
