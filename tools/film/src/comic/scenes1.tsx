import React from "react";
import { Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { FPS, INK, PENCIL, S, Fig, Layer, Page, Panel, clamp, ease, hash, inout, kick, lerp, move, ph, voice, Box } from "./kit";
import { Clock, FrameRect, Lamp, Plank, R, Room, Sleeve, Vinyl, Window, K, G } from "./props";

/* камера по «миру» сцены: сдвиг и масштаб вокруг точки (ox, oy) */
export const Cam: React.FC<{ x?: number; y?: number; s?: number; ox?: number; oy?: number; children: React.ReactNode; w?: number }> = ({ x = 0, y = 0, s = 1, ox = 960, oy = 540, children, w = 1920 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 1080, transformOrigin: `${ox}px ${oy}px`, transform: `translate(${-x}px,${-y}px) scale(${s})` }}>{children}</div>
);

/* растр поверх панели: «отпечатано» */
export const Halftone: React.FC<{ op?: number; size?: number }> = ({ op = 1, size = 7 }) => (
  <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(40,25,10,.28) ${size * 0.22}px, transparent ${size * 0.26}px)`, backgroundSize: `${size}px ${size}px`, mixBlendMode: "multiply", opacity: op, pointerEvents: "none" }} />
);

/* проигрыватель сбоку на табурете */
export const TurntableSide: React.FC<{ x: number; y: number; t: number; s?: number; label?: string }> = ({ x, y, t, s = 1, label = R.red }) => (
  <G x={x} y={y} s={s}>
    <path d="M-120,0 L-140,260 M120,0 L140,260 M-130,150 L130,150" {...K} strokeWidth={10} />
    <rect x={-170} y={-24} width={340} height={30} rx={6} fill={R.woodD} {...K} />
    <rect x={-190} y={-110} width={380} height={86} rx={12} fill={R.wood} {...K} />
    <ellipse cx={-30} cy={-112} rx={150} ry={30} fill={R.black} {...K} />
    <ellipse cx={-30} cy={-112} rx={50} ry={10} fill={label} stroke={INK} strokeWidth={3} />
    {[0, 1, 2].map((i) => {
      const a = t * 5 + i * 2.1;
      return <path key={i} d={`M${-30 + Math.cos(a) * 110},${-112 + Math.sin(a) * 22} A110,22 0 0,1 ${-30 + Math.cos(a + 0.5) * 110},${-112 + Math.sin(a + 0.5) * 22}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" />;
    })}
    <path d="M150,-120 L150,-150 L40,-118" fill="none" stroke={R.metal} strokeWidth={8} />
    <path d="M150,-120 L150,-150 L40,-118" fill="none" stroke={INK} strokeWidth={2.5} />
    <circle cx={150} cy={-150} r={14} fill={R.metal} {...K} strokeWidth={4} />
  </G>
);

/* ================================================================ 1
   Тесная панель: нынешний он стоит в узкой рамке, плечами в края.
   Вокруг — пустые клетки страницы, где синим карандашом проступают
   наброски прежних версий. Ничего не подписано. */
const SKETCH: { b: Box; src: string; h: number; t0: number }[] = [
  { b: { x: 70, y: 210, w: 300, h: 690 }, src: "cast/r1.png", h: 560, t0: 0.9 },
  { b: { x: 410, y: 120, w: 330, h: 830 }, src: "cast/r2.png", h: 700, t0: 1.5 },
  { b: { x: 1180, y: 150, w: 330, h: 800 }, src: "cast/su.png", h: 690, t0: 1.9 },
  { b: { x: 1550, y: 230, w: 300, h: 680 }, src: "cast/sp.png", h: 590, t0: 1.2 },
];
export const C1: React.FC<{ t: number }> = ({ t }) => {
  const press = Math.sin(t * 1.7) * 0.5 + 0.5;
  return (
    <Page t={t}>
      {SKETCH.map(({ b, src, h, t0 }, i) => {
        const draw = ease(ph(t, 0.15 + i * 0.12, 1.1 + i * 0.12));
        const per = 2 * (b.w + b.h);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, overflow: "hidden" }}>
              <Fig src={src} x={b.w / 2} y={b.h - 20} h={h} t={t} seed={i} shadow={false} filter={PENCIL} opacity={0.5 * ease(ph(t, t0, t0 + 1.4))} />
            </div>
            <Layer>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke="#6fa2d8" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} opacity={0.8} />
            </Layer>
          </React.Fragment>
        );
      })}
      <Panel t={t} t0={0} box={{ x: 790, y: 70, w: 340, h: 940 }} bg={{ background: R.wall }}>
        <Room horizon={800} w={340} h={940} />
        <Fig src="cast/now.png" x={170 + press * 2} y={935} h={926 - press * 6} t={t} squash={0.01 * press} head={move(t, 1.6, 2.4, 0, -3)} seed={5} />
      </Panel>
    </Page>
  );
};

/* ================================================================ 2
   Ролик собирается в страницу комикса: на каждой склейке прошлый план
   застывает и «пропечатывается» растром, новый играет в своей клетке. */
const CLIP_N = 240;
/* Живая клетка играет ролик (кадр задан временем фильма через trimBefore),
   застывшая — показывает заранее вынутый кадр склейки. */
const VidPanel: React.FC<{ t: number; t0: number; frame: number; local: number; box: Box; freezeAt?: number; pos?: string; from?: "pop" | "left" | "right" | "bottom" | "top"; rot?: number }> = ({ t, t0, frame, local, box, freezeAt, pos = "50% 50%", from = "pop", rot = 0 }) => {
  const frozen = freezeAt != null && frame >= freezeAt;
  const pr = frozen ? ease(clamp((frame - freezeAt!) / 8)) : 0;
  const media: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: pos };
  return (
    <Panel t={t} t0={t0} box={box} from={from} rot={rot} bg={{ background: INK }}>
      <div style={{ position: "absolute", inset: 0, filter: `sepia(${0.08 + pr * 0.3}) saturate(${1 - pr * 0.25}) contrast(${1 + pr * 0.06})` }}>
        {frozen ? (
          <Img src={staticFile(`scenes/clip1-f${freezeAt}.jpg`)} style={media} />
        ) : (
          <OffthreadVideo src={staticFile("scenes/clip1.mp4")} muted trimBefore={Math.max(0, Math.min(CLIP_N - 1, frame) - local)} style={media} />
        )}
      </div>
      <Halftone op={0.25 + pr * 0.75} size={8} />
    </Panel>
  );
};
export const C2: React.FC<{ t: number }> = ({ t }) => {
  const local = useCurrentFrame();
  const ct = t - S[1];
  const frame = Math.round(ct * FPS);
  /* первый план: во весь лист, потом отъезжает в левый верхний угол */
  const k = inout(ph(ct, 2.95, 3.45));
  const b1: Box = { x: lerp(60, 40, k), y: lerp(40, 40, k), w: lerp(1800, 1060, k), h: lerp(1000, 596, k) };
  const v = { t, frame, local };
  return (
    <Page t={t} bg="#e9dcc0">
      <VidPanel {...v} t0={S[1] - 0.1} box={b1} freezeAt={70} />
      <VidPanel {...v} t0={S[1] + 3.0} box={{ x: 1130, y: 40, w: 750, h: 596 }} freezeAt={127} pos="26% 50%" from="right" />
      <VidPanel {...v} t0={S[1] + 5.375} box={{ x: 40, y: 666, w: 1840, h: 374 }} freezeAt={175} pos="50% 20%" from="bottom" />
      <VidPanel {...v} t0={S[1] + 7.375} box={{ x: 170, y: 95, w: 1580, h: 889 }} from="bottom" rot={-1.2} />
    </Page>
  );
};

/* ================================================================ 3
   Комната подростка — длинная панорама. Слева он трясёт головой у
   проигрывателя, за окном день уходит в ночь, часы бегут: альбом
   целиком. Камера уезжает к стене: одна пластинка в рамке в луче
   света и почти пустая полка. */
export const C3: React.FC<{ t: number }> = ({ t }) => {
  const day = 1 - ph(t, 14.2, 20.4);
  const min = lerp(0, 45, ph(t, 14.0, 20.4)) + (t > 20.4 ? (t - 20.4) * 0.3 : 0);
  const pan = move(t, 20.3, 22.0, 0, 1500);
  const push = move(t, 27.6, 30.5, 1, 1.32);
  const beat = Math.sin(t * Math.PI * 2 * 2.05);
  const k = kick(t);
  return (
    <Page t={t}>
      <Cam x={pan} s={push} ox={2620} oy={640} w={3420}>
        <Room horizon={800} w={3420} wall="#e7d3b0" dim={(1 - day) * 0.25} />
        <Layer w={3420}>
          <Window x={330} y={330} w={300} h={380} day={day} id="w3" curtain="#8a3a2e" />
          <Clock x={1030} y={210} h={4 + min / 60} m={min} r={62} />
          <g transform="translate(1530,330) rotate(3)">
            <Sleeve x={0} y={0} w={330} design={0} color="#2b2b31" />
            <rect x={-185} y={-185} width={60} height={22} fill="#efe6c8" opacity={0.85} transform="rotate(-35,-155,-174)" />
            <rect x={130} y={150} width={60} height={22} fill="#efe6c8" opacity={0.85} transform="rotate(-35,160,161)" />
          </g>
          {/* луч света из окна на стену */}
          <path d="M1960,120 L2250,120 L2780,560 L2440,700Z" fill="#fff1c4" opacity={0.35 + (1 - day) * 0.2} />
          {Array.from({ length: 18 }).map((_, i) => {
            const u = (t * 0.05 + hash(i)) % 1;
            return <circle key={i} cx={2150 + hash(i + 3) * 500 + u * 120} cy={180 + hash(i + 7) * 460 - u * 60} r={2 + hash(i) * 2.5} fill="#fff" opacity={0.7 * Math.sin(u * Math.PI)} />;
          })}
          <FrameRect x={2600} y={360} w={330} h={330} color="#6b4a2c" />
          <Vinyl x={2600} y={360} r={150} spin={t * 3} label={R.red} />
          <Plank x={2160} y={640} w={940} />
          <Sleeve x={2240} y={566} w={150} design={0} color="#2b2b31" rot={-4} />
        </Layer>
        <Layer w={3420}>
          <TurntableSide x={1150} y={790} t={t} />
        </Layer>
        <Fig src="poses/r1-headbang.png" x={700} y={1035} h={930} t={t} rot={beat * 2.6 + k * 1.5} bob={Math.max(0, beat) * 14} squash={Math.max(0, -beat) * 0.02} seed={2} />
        <Fig src="cast/r1.png" x={2090} y={1010} h={720} t={t} head={-5} opacity={ease(ph(t, 20.6, 21.6))} seed={3} />
      </Cam>
    </Page>
  );
};

/* ================================================================ 4
   Он раскладывает три пластинки одной сонаты, как пасьянс.
   Подросток заглядывает из-за двери и тихо пятится.
   Потом ночное окно: в отражении — не он. */
const SONATA = [
  { c: R.cream, x: 360, t0: S[8] + 0.6 },
  { c: "#9cc0bd", x: 690, t0: S[8] + 2.6 },
  { c: "#e3a37d", x: 1020, t0: 35.22 },
];
export const C4: React.FC<{ t: number }> = ({ t }) => {
  const peek = t < S[9] ? 0 : ease(ph(t, S[9] + 0.1, S[9] + 0.9)) - ease(ph(t, 40.6, 41.6)) * 0.55;
  return (
    <Page t={t}>
      <Room horizon={700} wall="#dfe2cf" />
      <Layer>
        <Lamp x={1780} y={260} on={0.8} />
        <rect x={180} y={790} width={1120} height={40} rx={8} fill={R.wood} {...K} />
        <path d="M230,830 L210,1080 M1250,830 L1270,1080" {...K} strokeWidth={14} />
        {SONATA.map((s, i) => {
          const u = ease(ph(t, s.t0, s.t0 + 0.7));
          if (u <= 0) return null;
          const x = lerp(1360, s.x, u);
          const y = lerp(560, 640, u) - Math.sin(u * Math.PI) * 120;
          return (
            <g key={i}>
              <Vinyl x={x + 70 * u} y={y - 20} r={130} spin={t * 20} label={s.c} s={1} />
              <Sleeve x={x} y={y} w={300} design={1} color={s.c} rot={lerp(25, -4 + i * 4, u)} />
            </g>
          );
        })}
      </Layer>
      <Fig src="poses/now-explain.png" x={1500} y={1085} h={780} t={t} head={Math.sin(t * 4.3) * 3 * voice(t)} bob={voice(t) * 4} seed={4} />
      <Fig src="poses/r1-peek.png" x={lerp(-160, 120, peek)} y={1085} h={760} t={t} head={Math.sin(t * 9) * 1.2} seed={6} />
      {/* ночное окно */}
      <Panel t={t} t0={S[10] - 0.1} box={{ x: 0, y: 0, w: 1920, h: 1080 }} border={0} bg={{ background: "#26263a" }}>
        <Room horizon={820} wall="#3c3a52" floor="#4a3a3a" />
        <Layer>
          <Window x={1240} y={420} w={560} h={600} day={0} id="w4" curtain="#5a3048" />
        </Layer>
        <div style={{ position: "absolute", left: 960, top: 120, width: 560, height: 600, overflow: "hidden", opacity: 0.45, mixBlendMode: "screen" }}>
          <Fig src="cast/r1.png" x={300 + Math.sin(t) * 6} y={720} h={560} t={t} flip shadow={false} filter="blur(1.2px) saturate(.6)" opacity={ease(ph(t, S[10] + 0.6, S[10] + 1.8))} />
        </div>
        <Fig src="cast/now.png" x={620} y={1060} h={900} t={t} head={move(t, S[10] + 0.4, S[10] + 1.2, 0, 4)} filter="brightness(.72) saturate(.75) hue-rotate(-8deg)" seed={7} />
      </Panel>
    </Page>
  );
};
