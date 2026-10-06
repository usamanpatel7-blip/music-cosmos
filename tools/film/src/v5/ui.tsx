import React from "react";
import { Img, staticFile } from "remotion";
import { BG, INK, INK2, INK3, SANS, SERIF } from "./theme";

/* Типографика сайта, увеличенная для кадра 1920×1080 (≈×1.6). */
const K = 1.6;

/* «А1 · 11–15 ЛЕТ» — метка главы с цветной плашкой */
export const Side: React.FC<{ tag: string; text: string; color: string; style?: React.CSSProperties }> = ({ tag, text, color, style }) => (
  <div style={{ display: "flex", gap: 12 * K, alignItems: "center", font: `600 ${12 * K}px/1 ${SANS}`, letterSpacing: ".18em", textTransform: "uppercase", ...style }}>
    <i style={{ fontStyle: "normal", display: "inline-grid", placeItems: "center", minWidth: 34 * K, height: 22 * K, padding: `0 ${8 * K}px`, borderRadius: 99, background: color, color: BG, letterSpacing: ".06em" }}>{tag}</i>
    <span style={{ color: INK2 }}>{text}</span>
  </div>
);

export const H2: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 64 * K, style }) => (
  <div style={{ font: `italic 500 ${size}px/.98 ${SERIF}`, letterSpacing: "-.01em", color: INK, ...style }}>{children}</div>
);

export const Num: React.FC<{ value: React.ReactNode; small?: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ value, small, color = INK, size = 88 * K, style }) => (
  <div style={style}>
    <div style={{ font: `500 ${size}px/.9 ${SERIF}`, color, fontVariantNumeric: "lining-nums", fontFeatureSettings: '"lnum" 1' }}>{value}</div>
    {small ? <div style={{ font: `500 ${14 * K}px/1.35 ${SANS}`, color: INK2, marginTop: 6 * K, letterSpacing: ".02em" }}>{small}</div> : null}
  </div>
);

export const Kick: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ font: `600 ${11.5 * K}px/1.4 ${SANS}`, letterSpacing: ".2em", textTransform: "uppercase", color: INK2, ...style }}>{children}</div>
);

/* кнопка-трек «чем это звучало»: кружок цвета возраста, название, исполнитель */
export const Cue: React.FC<{ title: string; artist: string; color: string; playing?: boolean; style?: React.CSSProperties }> = ({ title, artist, color, playing, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 9 * K, border: "1px solid rgba(239,231,218,.12)", background: "rgba(12,11,13,.6)", borderRadius: 99, padding: `${7 * K}px ${14 * K}px ${7 * K}px ${8 * K}px`, fontFamily: SANS, ...style }}>
    <span style={{ width: 22 * K, height: 22 * K, borderRadius: "50%", background: color, position: "relative", flex: "none" }}>
      {playing ? (
        <span style={{ position: "absolute", left: 11, top: 10, width: 4, height: 15, borderLeft: `5px solid ${BG}`, borderRight: `5px solid ${BG}` }} />
      ) : (
        <span style={{ position: "absolute", left: 13, top: 10, borderLeft: `13px solid ${BG}`, borderTop: "8px solid transparent", borderBottom: "8px solid transparent" }} />
      )}
    </span>
    <span style={{ font: `500 ${14 * K}px/1.2 ${SANS}`, color: INK, textAlign: "left" }}>
      {title}
      <small style={{ display: "block", color: INK3, fontSize: 12 * K }}>{artist}</small>
    </span>
  </div>
);

/* подпись-«таблетка» у точки или кольца */
export const Pill: React.FC<{ children: React.ReactNode; x: number; y: number; style?: React.CSSProperties }> = ({ children, x, y, style }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", background: "rgba(12,11,13,.82)", color: INK, padding: `${3 * K}px ${9 * K}px`, borderRadius: 99, border: "1px solid rgba(239,231,218,.12)", font: `500 ${11.5 * K}px/1.2 ${SANS}`, letterSpacing: ".04em", whiteSpace: "nowrap", ...style }}>{children}</div>
);

/* Титры — как эпиграф сайта: курсив, полоска слева, слова проявляются по времени */
export const Epi: React.FC<{ words: { w: string; on: number }[]; color: string; cite?: string; style?: React.CSSProperties; size?: number }> = ({ words, color, cite = "эссе", style, size = 46 }) => (
  <div style={{ position: "absolute", left: 120, bottom: 86, maxWidth: 1180, paddingLeft: 26, isolation: "isolate", borderLeft: `3px solid ${color}`, ...style }}>
    <div style={{ position: "absolute", left: -60, right: -120, top: -50, bottom: -40, background: "radial-gradient(ellipse 60% 70% at 40% 55%, rgba(12,11,13,.82), rgba(12,11,13,.5) 55%, transparent 80%)", zIndex: -1 }} />
    <div style={{ font: `italic 500 ${size}px/1.24 ${SERIF}`, color: INK, textWrap: "balance" as React.CSSProperties["textWrap"], textShadow: "0 0 14px rgba(12,11,13,.9), 0 0 3px rgba(12,11,13,.9)", fontVariantNumeric: "lining-nums" }}>
      {words.map((x, i) => (
        <span key={i} style={{ opacity: 0.28 + 0.72 * x.on }}>
          {x.w}{" "}
        </span>
      ))}
    </div>
    {cite ? <div style={{ marginTop: 12, font: `500 ${16}px/1 ${SANS}`, letterSpacing: ".14em", textTransform: "uppercase", color: INK3 }}>{cite}</div> : null}
  </div>
);

/* вырезка-персонаж (наклейка с белой каймой) */
export const Cutout: React.FC<{ src: string; x: number; y: number; h: number; rot?: number; flip?: boolean; opacity?: number; style?: React.CSSProperties; shadow?: boolean }> = ({ src, x, y, h, rot = 0, flip, opacity = 1, style, shadow = true }) => (
  <div style={{ position: "absolute", left: x, top: y, height: h, transform: `translate(-50%,-100%) rotate(${rot}deg) scaleX(${flip ? -1 : 1})`, transformOrigin: "50% 100%", opacity, filter: shadow ? "drop-shadow(0 18px 28px rgba(0,0,0,.55))" : undefined, ...style }}>
    <Img src={staticFile(`stickers/${src}.png`)} style={{ height: h, display: "block" }} />
  </div>
);

/* обложка альбома из Apple — как фотография в коллаже */
export const Cover: React.FC<{ id: string; x: number; y: number; w: number; rot?: number; tape?: boolean; style?: React.CSSProperties }> = ({ id, x, y, w, rot = 0, tape = false, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: w, transform: `translate(-50%,-50%) rotate(${rot}deg)`, boxShadow: "0 22px 40px rgba(0,0,0,.6)", ...style }}>
    <Img src={staticFile(`covers/${id}.jpg`)} style={{ width: w, height: w, display: "block" }} />
    {tape ? <div style={{ position: "absolute", left: w * 0.32, top: -w * 0.06, width: w * 0.36, height: w * 0.12, background: "rgba(239,231,218,.55)", transform: "rotate(-4deg)", boxShadow: "0 2px 4px rgba(0,0,0,.2)" }} /> : null}
  </div>
);
