import React from "react";
import { INK, PENCIL, S, Fig, Layer, Page, Bubble, clamp, ease, hash, inout, kick, lerp, move, ph, pop } from "./kit";
import { Armchair, Boombox, Cassette, FrameRect, Lamp, Pencil, Plank, Plant, Polaroid, R, Room, Shoebox, Sleeve, Spines, Vinyl, Window, K, G } from "./props";
import { Cam } from "./scenes1";

/* нотная закорючка вместо слов в пузыре комментатора */
const Scribble: React.FC<{ seed: number; w?: number }> = ({ seed, w = 170 }) => (
  <svg width={w} height={60} viewBox={`0 0 ${w} 60`} style={{ display: "block" }}>
    {[14, 24, 34, 44].map((y) => (
      <path key={y} d={`M4,${y} L${w - 4},${y}`} stroke={INK} strokeWidth={1.5} opacity={0.5} />
    ))}
    {Array.from({ length: 5 }).map((_, i) => {
      const x = 20 + i * ((w - 40) / 4);
      const y = 14 + Math.round(hash(seed * 7 + i) * 6) * 5;
      return (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={6} ry={4.5} fill={INK} transform={`rotate(-20,${x},${y})`} />
          <path d={`M${x + 5},${y} L${x + 5},${y - 22}`} stroke={INK} strokeWidth={2} />
        </g>
      );
    })}
    {seed % 2 ? <path d={`M${w - 26},50 l14,-8 l-14,-8`} stroke="#c8443a" strokeWidth={3} fill="none" /> : null}
  </svg>
);

/* ================================================================ 5
   Он слушает в наушниках, и комната проявляется: синие карандашные
   контуры по одному заливаются тушью и цветом, проступают мелочи.
   Потом на подлокотнике появляется маленький «комментатор» с нотными
   пузырями — и, исчерпав себя, тихо уходит. Свет теплеет. */
const DETAILS: { t0: number; cx: number; cy: number; r: number; el: (t: number) => React.ReactNode }[] = [
  { t0: 45.4, cx: 300, cy: 380, r: 420, el: () => <Window x={300} y={360} w={300} h={380} day={0.75} id="w5" curtain={R.teal} /> },
  {
    t0: 46.4,
    cx: 1500,
    cy: 330,
    r: 420,
    el: () => (
      <>
        <Spines x={1250} y={300} items={Array.from({ length: 22 }).map((_, i) => ({ c: [R.rust, R.cream, R.navy, R.mustard, R.teal, "#8d8a84"][Math.floor(hash(i) * 6)], w: 18 + hash(i + 4) * 10, h: 190 + hash(i + 2) * 40 }))} />
        <Plank x={1230} y={300} w={560} />
      </>
    ),
  },
  { t0: 47.9, cx: 1640, cy: 700, r: 330, el: () => <Lamp x={1640} y={520} on={0.9} /> },
  { t0: 49.6, cx: 1500, cy: 140, r: 160, el: () => <FrameRect x={1500} y={130} w={170} h={110} color={R.mustard} /> },
  { t0: 51.0, cx: 560, cy: 760, r: 220, el: (t) => <Plant x={560} y={690} g={1} t={t} /> },
  /* мелочь, которую раньше не замечал: кот на полке */
  {
    t0: 52.4,
    cx: 1700,
    cy: 290,
    r: 120,
    el: (t) => (
      <G x={1700} y={292}>
        <path d="M-50,0 Q-50,-46 0,-46 Q46,-46 50,0Z" fill="#8a8a92" {...K} strokeWidth={4} />
        <path d="M24,-40 L30,-62 L42,-40Z M4,-44 L8,-64 L20,-44Z" fill="#8a8a92" {...K} strokeWidth={4} />
        <path d={`M-50,-6 q-30,${-10 + Math.sin(t * 2) * 8} -40,-40`} fill="none" {...K} strokeWidth={6} />
      </G>
    ),
  },
];
export const C5: React.FC<{ t: number }> = ({ t }) => {
  const calm = ease(ph(t, 62.0, 64.5));
  const com = ease(ph(t, S[13] + 0.3, S[13] + 1.0)) * (1 - ease(ph(t, 61.6, 62.6)));
  return (
    <Page t={t}>
      <Room horizon={780} wall="#e9dcc2" dim={0.08 + calm * 0.12} />
      {/* карандашная разметка всей комнаты */}
      <Layer style={{ filter: PENCIL, opacity: 0.55 }}>{DETAILS.map((d, i) => <React.Fragment key={i}>{d.el(t)}</React.Fragment>)}</Layer>
      {DETAILS.map((d, i) => {
        const u = ease(ph(t, d.t0, d.t0 + 1.1));
        if (u <= 0) return null;
        return (
          <Layer key={i} style={{ clipPath: `circle(${u * d.r}px at ${d.cx}px ${d.cy}px)` }}>
            {d.el(t)}
          </Layer>
        );
      })}
      <Layer>
        <Armchair x={960} y={1080} s={1.5} />
      </Layer>
      <Fig src="poses/now-listen.png" x={960} y={1090} h={800} t={t} head={Math.sin(t * 1.4) * 2 + calm * -3} seed={8} />
      {/* комментатор на подлокотнике */}
      <Fig src="poses/su-point.png" x={lerp(470, 520, com)} y={735} h={300} t={t} opacity={com} bob={Math.abs(Math.sin(t * 6)) * 6 * com} seed={9} shadow={false} />
      {[0, 1, 2, 3].map((i) => {
        const t0 = S[13] + 1.1 + i * 1.55;
        return <Bubble key={i} t={t} t0={t0} t1={i < 3 ? t0 + 1.4 : 61.5} x={360 + (i % 2) * 70} y={360 - (i % 2) * 30} tail={[60, 110]} size={30} text={<Scribble seed={i + 1} w={170 - i * 30} />} />;
      })}
      <Bubble t={t} t0={60.9} t1={61.7} x={380} y={350} tail={[60, 110]} size={30} text="…" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(255,214,140,.0) 30%, rgba(60,30,10,.35) 100%)", opacity: calm, pointerEvents: "none" }} />
    </Page>
  );
};

/* ================================================================ 6
   Из-под кровати выезжает обувная коробка, в ней кассеты, подписанные
   от руки. Одна уходит в магнитолу — щёлк, play. Пока играет музыка,
   в комнате, как плохо совмещённая печать, проступают прежние версии
   и понемногу «сходятся» в чёткий оттиск. */
const TAPES = [
  { l: "11–15", c: "#f3d9a8", t0: 68.9 },
  { l: "16–18", c: "#f1b7b7", t0: 69.7 },
  { l: "20–21", c: "#bfd8d2", t0: 70.4 },
];
export const C6: React.FC<{ t: number }> = ({ t }) => {
  const slide = ease(ph(t, S[15] + 0.1, S[15] + 1.6));
  const lid = ease(ph(t, 66.6, 67.6));
  const push = move(t, 67.6, 70.9, 1, 1.45);
  const deck = t >= 71.0;
  const k = kick(t);
  return (
    <Page t={t}>
      {!deck ? (
        <Cam s={push} ox={960} oy={700}>
          <div style={{ position: "absolute", inset: 0, background: "#4b3a33" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 300, background: R.rust, borderBottom: `5px solid ${INK}`, backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 40px, transparent 40px 80px), repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 40px, transparent 40px 80px)" }} />
          <Layer>
            {Array.from({ length: 48 }).map((_, i) => (
              <path key={i} d={`M${i * 40 + 10},300 l${Math.sin(t * 2 + i) * 3},${30 + hash(i) * 14}`} stroke="#8a3424" strokeWidth={5} strokeLinecap="round" />
            ))}
            <rect x={0} y={330} width={1920} height={750} fill={R.floor2} />
            <G x={lerp(2500, 960, slide)} y={900}>
              <Shoebox x={0} y={0} open={lid}>
                {TAPES.map((tp, i) => {
                  const up = ease(ph(t, tp.t0, tp.t0 + 0.6));
                  return (
                    <g key={i} transform={`translate(${-210 + i * 210},${-330 - up * 150}) rotate(${-90 + (i - 1) * 4})`}>
                      <Cassette x={0} y={0} w={300} color={tp.c} label={up > 0.2 ? tp.l : undefined} tape={0.6} />
                    </g>
                  );
                })}
              </Shoebox>
            </G>
          </Layer>
        </Cam>
      ) : (
        <>
          <Room horizon={800} wall="#e2cfae" dim={0.3 - k * 0.05} />
          <Layer>
            <Window x={1600} y={340} w={300} h={360} day={0.55} id="w6" curtain={R.rust} />
          </Layer>
          {[
            { src: "cast/r1.png", x: 470, h: 640, t0: 72.2 },
            { src: "cast/r2.png", x: 960, h: 700, t0: 73.6 },
            { src: "cast/su.png", x: 1440, h: 720, t0: 75.0 },
          ].map((g, i) => {
            const u = ease(ph(t, g.t0, g.t0 + 1.6));
            const beat = Math.sin((t - g.t0) * Math.PI * 2 * 1.02 + i);
            return <Fig key={i} src={g.src} x={g.x} y={960} h={g.h} t={t} opacity={u * 0.82} mis={lerp(18, 2.5, u)} fade={0.35 - u * 0.2} bob={Math.max(0, beat) * 8 + k * 4} head={beat * 3} seed={i + 11} shadow={false} />;
          })}
          <Layer>
            <Boombox x={960} y={1010} s={0.62} pulse={k} spin={t * 160} play={ease(ph(t, 71.6, 71.8))} label="11–15" tape={0.7 - ph(t, 71.7, 78) * 0.1} />
          </Layer>
        </>
      )}
    </Page>
  );
};

/* ================================================================ 7
   Перемотка вперёд, «извлечь» — кассета зависает над корзиной и
   возвращается в коробку. Из коробки выпадает полароид: проявляется,
   но блёкло, краски не совпадают. Карандаш в катушку, перемотка назад —
   и на припеве снимок вспыхивает, а он сам высовывается из рамки. */
export const C7: React.FC<{ t: number }> = ({ t }) => {
  const k = kick(t);
  const ff = ph(t, 79.5, 79.7) * (1 - ph(t, 81.6, 81.8));
  const spin = t * 160 + Math.max(0, Math.min(t, 81.7) - 79.6) * 1400;
  const ej = ease(ph(t, 82.1, 82.5));
  const fly = inout(ph(t, 82.5, 83.2));
  const back = inout(ph(t, 83.4, 84.0));
  const tapeX = lerp(lerp(560, 1500, fly), 300, back);
  const tapeY = lerp(lerp(540, 520, fly), 760, back) - Math.sin(fly * Math.PI) * 120 - Math.sin(back * Math.PI) * 140;
  const wob = t > 83.0 && t < 83.5 ? Math.sin(t * 40) * 6 : 0;
  const photo = t >= S[19] - 0.05;
  const dev = ease(ph(t, S[19] + 0.4, S[19] + 2.8)) * 0.82;
  const snap = ease(ph(t, 93.95, 94.25));
  const shout = pop(t, 94.0, 140, 11);
  return (
    <Page t={t} shake={snap > 0 && snap < 1 ? 6 : k > 1 && t > 94 ? 2 : 0}>
      {!photo ? (
        <>
          <Room horizon={820} wall="#e6d6b6" />
          <Layer>
            <G x={300} y={1020} s={0.7}>
              <Shoebox x={0} y={0} open={1} />
            </G>
            <G x={1500} y={1040}>
              <path d="M-120,-260 L120,-260 L95,0 L-95,0Z" fill="#9aa6a0" {...K} />
              {Array.from({ length: 7 }).map((_, i) => (
                <path key={i} d={`M${-100 + i * 33},-250 L${-82 + i * 27},-10`} stroke={INK} strokeWidth={3} opacity={0.5} />
              ))}
              <ellipse cx={0} cy={-260} rx={120} ry={20} fill="#6e7a74" {...K} />
            </G>
            <Boombox x={720} y={760} s={0.9} spin={spin} ff={ff} eject={ej * (1 - fly)} label="16–18" pulse={k * 0.5} tape={0.55 - ph(t, 79.6, 81.7) * 0.3} />
            {fly > 0 ? (
              <g transform={`translate(${tapeX},${tapeY}) rotate(${wob + back * 20})`}>
                <Cassette x={0} y={0} w={200} label="16–18" color="#f1b7b7" tape={0.25} />
              </g>
            ) : null}
          </Layer>
        </>
      ) : (
        <Cam s={move(t, 87.1, 93.3, 1, 1.12)} ox={760} oy={520}>
          <div style={{ position: "absolute", inset: 0, background: "#7a5a44", backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 3px, transparent 3px 90px)" }} />
          <Layer>
            <G x={1480} y={640} rot={-8}>
              <Cassette x={0} y={0} w={460} label="16–18" color="#f1b7b7" spin={t < 93.3 ? 0 : -(t - 93.3) * 900} tape={0.3 + ph(t, 93.3, 94.0) * 0.25} />
            </G>
            {t > 92.6 ? (
              <g transform={`translate(${1480 - 80},${640 + 30}) rotate(${-8})`}>
                <g transform={`translate(${-Math.sin((t - 93.3) * 18) * 18 * ph(t, 93.3, 93.5)},${Math.cos((t - 93.3) * 18) * 18 * ph(t, 93.3, 93.5) - (1 - ease(ph(t, 92.6, 93.2))) * 500}) rotate(${12})`}>
                  <Pencil x={0} y={0} len={460} />
                </g>
              </g>
            ) : null}
          </Layer>
          {/* полароид: блёклый оттиск, на припеве совпадает */}
          <Polaroid x={720} y={lerp(-300, 540, ease(ph(t, S[19] - 0.05, S[19] + 0.5)))} w={560} dev={dev + snap * 0.18} rot={-4} caption="лето">
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(#9ed0e6, #f3e1b3 70%, #e9c98f)` }} />
            <Fig src="cast/r2.png" x={250} y={720} h={640} t={t} mis={lerp(lerp(2, 9, ph(t, 87.1, 89)), 0, snap)} fade={lerp(0.75, 0, snap)} shadow={false} seed={13} opacity={1 - clamp(shout * 3)} />
          </Polaroid>
          {shout > 0.01 ? (
            <div style={{ position: "absolute", left: 720 - 280, top: 0, width: 560, height: 728, overflow: "hidden", transform: "rotate(-4deg)", transformOrigin: "50% 540px" }}>
              <Fig src="poses/r2-shout.png" x={280} y={lerp(1150, 732, shout)} h={620} t={t} head={Math.sin(t * 7) * 3 + k * 2} seed={14} />
            </div>
          ) : null}
        </Cam>
      )}
    </Page>
  );
};

/* ================================================================ 8
   Доска с булавками: пять полароидов-версий и конверты между ними,
   красная нить по одной растягивается вверх — так «сочиняют биографию».
   Пластинка с наклейкой-диаграммой заполняется больше чем наполовину.
   Человек в пиджаке выравнивает доску по уровню. */
export const BOARD = [
  { src: "cast/r1.png", x: 260, y: 700, sl: 4, slc: "#e3a33d" },
  { src: "cast/r2.png", x: 600, y: 590, sl: 3, slc: R.pink },
  { src: "cast/su.png", x: 940, y: 480, sl: 1, slc: "#9cc0bd" },
  { src: "cast/sp.png", x: 1280, y: 370, sl: 1, slc: R.cream },
  { src: "cast/now.png", x: 1620, y: 260, sl: 2, slc: "#e8e2d4" },
];
export const Board: React.FC<{ t: number; tilt: number; string: number; pie: number; children?: React.ReactNode }> = ({ t, tilt, string, pie, children }) => {
  const pts = BOARD.map((b) => [b.x, b.y - 150]);
  const d = "M" + pts.map((p) => p.join(",")).join(" L");
  const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  return (
    <div style={{ position: "absolute", left: 40, top: 40, width: 1840, height: 1000, transform: `rotate(${tilt}deg)`, transformOrigin: "50% 0%" }}>
      <div style={{ position: "absolute", inset: 0, background: "#c79a62", border: `14px solid ${R.woodD}`, boxShadow: "12px 14px 0 rgba(22,22,28,.25)", backgroundImage: "radial-gradient(rgba(80,40,10,.25) 1.5px, transparent 2px)", backgroundSize: "11px 9px" }} />
      {BOARD.map((b, i) => {
        const u = ease(ph(t, S[22] + 0.2 + i * 0.35, S[22] + 0.6 + i * 0.35));
        return (
          <React.Fragment key={i}>
            <Layer w={1840} h={1000}>
              <g opacity={u}>
                <Sleeve x={b.x + 120} y={b.y + 60} w={170} design={b.sl} color={b.slc} rot={8 - i * 3} />
              </g>
            </Layer>
            <Polaroid x={b.x} y={b.y} w={210} dev={1} rot={-5 + i * 2.5} style={{ opacity: u }}>
              <div style={{ position: "absolute", inset: 0, background: "#e8dcc4" }} />
              <Fig src={b.src} x={92} y={b.src === "cast/now.png" ? 560 : 520} h={b.src === "cast/now.png" ? 560 : 500} t={t} shadow={false} breathe={false} />
            </Polaroid>
          </React.Fragment>
        );
      })}
      <Layer w={1840} h={1000}>
        <path d={d} fill="none" stroke="#b3261e" strokeWidth={6} strokeDasharray={len} strokeDashoffset={len * (1 - string)} strokeLinejoin="round" />
        {pts.map((p, i) => (string * (pts.length - 1) >= i - 0.01 ? <circle key={i} cx={p[0]} cy={p[1]} r={12} fill="#d23a2e" {...K} strokeWidth={3} /> : null))}
        {pie > 0 ? <Vinyl x={1530} y={800} r={140} pie={pie} label={R.navy} pieColor={R.cream} spin={t * 4} /> : null}
      </Layer>
      {children}
    </div>
  );
};
export const C8: React.FC<{ t: number }> = ({ t }) => {
  /* нить: к Nickelback (r1→r2), к Баху (→sp), к авангарду (→now) */
  const string = lerp(0, 0.25, ph(t, 100.2, 101.6)) + lerp(0, 0.25, ph(t, 101.8, 102.8)) + lerp(0, 0.25, ph(t, 103.4, 104.2)) + lerp(0, 0.25, ph(t, 104.6, 105.4));
  const pie = ease(ph(t, 109.3, 112.2)) * 0.56;
  const tilt = lerp(2.4, 0, inout(ph(t, 114.6, 115.6))) + (t > 115.6 && t < 116.2 ? Math.sin((t - 115.6) * 30) * 0.3 * (1 - ph(t, 115.6, 116.2)) : 0);
  const sp = ease(ph(t, S[25] - 0.2, S[25] + 0.5));
  return (
    <Page t={t} bg="#e8d9bb">
      <Cam s={move(t, 106.0, 107.0, 1, 1.0) + ease(ph(t, 107.5, 112.5)) * 0.18} ox={1530} oy={820}>
        <Board t={t} tilt={tilt} string={string} pie={pie} />
      </Cam>
      <Fig src="cast/sp.png" x={lerp(2200, 1700, sp)} y={1120} h={1000} t={t} head={-3} seed={15} />
    </Page>
  );
};

