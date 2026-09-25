import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming, springTiming, TransitionPresentation } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { iris } from "@remotion/transitions/iris";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { CUES, FILL, INK, pop } from "./kit";
import { CHAPTERS } from "./Probe";

export type FilmProps = { subtitles: boolean };

/* Одна глава: время сцены — глобальное (начало главы + кадр внутри),
   поэтому рисунок совпадает с голосом, даже пока идёт переход. */
const Chapter: React.FC<{ C: React.FC<{ t: number }>; from: number }> = ({ C, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <C t={(from + frame) / fps} />;
};

/* Субтитры: тёмная плашка, фраза впрыгивает пружиной */
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = CUES.find((q) => t >= q.t0 - 0.05 && t <= q.t1);
  if (!cue) return null;
  const u = pop(t, cue.t0 - 0.05, 260, 20);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: 1500,
          padding: "12px 34px 15px",
          background: INK,
          color: FILL,
          borderRadius: 18,
          font: '600 42px/1.3 "Golos Text"',
          textAlign: "center",
          textWrap: "balance",
          opacity: Math.min(1, u * 1.5),
          transform: `translateY(${(1 - u) * 16}px)`,
        }}
      >
        {cue.s}
      </div>
    </div>
  );
};

const W = 14; // длина перехода, кадров
const PRES = (i: number, w: number, h: number): TransitionPresentation<Record<string, unknown>> =>
  [
    slide({ direction: "from-right" }),
    wipe({ direction: "from-left" }),
    iris({ width: w, height: h }),
    slide({ direction: "from-bottom" }),
    clockWipe({ width: w, height: h }),
    wipe({ direction: "from-top-left" }),
    slide({ direction: "from-left" }),
    iris({ width: w, height: h }),
    wipe({ direction: "from-right" }),
    slide({ direction: "from-top" }),
  ][i % 10] as TransitionPresentation<Record<string, unknown>>;

export const Film: React.FC<FilmProps> = ({ subtitles }) => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const starts = CHAPTERS.map(([a]) => Math.round(a * fps));
  return (
    <AbsoluteFill style={{ background: FILL }}>
      <TransitionSeries>
        {CHAPTERS.map(([, C], i) => {
          const last = i === CHAPTERS.length - 1;
          const len = (last ? durationInFrames : starts[i + 1] + W) - starts[i];
          return (
            <React.Fragment key={i}>
              {i > 0 ? <TransitionSeries.Transition presentation={PRES(i - 1, width, height)} timing={i % 3 === 0 ? springTiming({ durationInFrames: W, config: { damping: 200 } }) : linearTiming({ durationInFrames: W })} /> : null}
              <TransitionSeries.Sequence durationInFrames={len} name={`Глава ${i + 1}`}>
                <Chapter C={C} from={starts[i]} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {subtitles ? <Subtitles /> : null}
      <Audio src={staticFile("film-audio.m4a")} />
    </AbsoluteFill>
  );
};
