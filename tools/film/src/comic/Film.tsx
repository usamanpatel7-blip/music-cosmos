import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming, TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { Narration, PAPER, S } from "./kit";
import { CHAPTERS } from "./Probe";

export type FilmProps = { subtitles: boolean };

/* Глава живёт в глобальном времени: t = начало главы + кадр внутри,
   поэтому рисунок совпадает с голосом и во время перехода. */
const Chapter: React.FC<{ C: React.FC<{ t: number }>; from: number }> = ({ C, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <C t={(from + frame) / fps} />;
};

/* Переход «растр»: новая страница проступает точками печатного растра,
   которые растут, пока не сольются. */
const HalftoneView: React.FC<TransitionPresentationComponentProps<Record<string, unknown>>> = ({ children, presentationDirection, presentationProgress }) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const cell = 34;
  const r = presentationProgress * cell * 0.75;
  const mask = `radial-gradient(circle at 50% 50%, #000 ${r}px, transparent ${r + 0.8}px)`;
  return <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: `${cell}px ${cell}px`, maskSize: `${cell}px ${cell}px` }}>{children}</AbsoluteFill>;
};
const halftone = (): TransitionPresentation<Record<string, unknown>> => ({ component: HalftoneView, props: {} });

/* Переход «страница»: старая страница откидывается вокруг корешка
   слева, под ней уже лежит следующая. */
const PageView: React.FC<TransitionPresentationComponentProps<Record<string, unknown>>> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === "entering")
    return (
      <AbsoluteFill style={{ zIndex: 0 }}>
        {children}
        <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(40,25,10,.35), transparent 60%)", opacity: 1 - p }} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ zIndex: 1, perspective: 2600, perspectiveOrigin: "0% 50%" }}>
      <AbsoluteFill style={{ transformOrigin: "0% 50%", transform: `rotateY(${p * 96}deg)`, backfaceVisibility: "hidden", boxShadow: `${30 * p}px 0 60px rgba(0,0,0,${0.35 * p})` }}>
        {children}
        <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 40%, rgba(40,25,10,.4))", opacity: p }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const pageTurn = (): TransitionPresentation<Record<string, unknown>> => ({ component: PageView, props: {} });

const W = 14; // длина перехода, кадров
const PRES = (i: number): TransitionPresentation<Record<string, unknown>> =>
  [halftone(), pageTurn(), halftone(), slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>, pageTurn()][i % 5];

/* где стоит плашка рассказчика, чтобы не закрывать главное */
const capPos = (t: number): "tl" | "bl" | "tr" => (t < S[1] ? "bl" : t >= S[19] - 0.05 && t < S[22] ? "tr" : "tl");

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <Narration t={frame / fps} pos={capPos} />;
};

export const Film: React.FC<FilmProps> = ({ subtitles }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const starts = CHAPTERS.map(([a]) => Math.round(a * fps));
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <TransitionSeries>
        {CHAPTERS.map(([, C], i) => {
          const last = i === CHAPTERS.length - 1;
          const len = (last ? durationInFrames : starts[i + 1] + W) - starts[i];
          return (
            <React.Fragment key={i}>
              {i > 0 ? <TransitionSeries.Transition presentation={PRES(i - 1)} timing={linearTiming({ durationInFrames: W })} /> : null}
              <TransitionSeries.Sequence durationInFrames={len} name={`Глава ${i + 1}`}>
                <Chapter C={C} from={starts[i]} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {subtitles ? <Captions /> : null}
      <Audio src={staticFile("film-audio.m4a")} />
    </AbsoluteFill>
  );
};
