import React from "react";
import { C, Look } from "./palette";

/* Герой. Чистый вектор без контуров: объём задают тени и блики.
   Ноль координат — между ступнями, рост ~630 единиц, голова ~1/6.
   Четыре образа: рокер в косухе (11–18), пальто и костюм (19–21),
   спорт (22–24), old money (сейчас). Лицо и русые волосы — общие. */

export type Eyes = "open" | "closed" | "happy" | "wide" | "side" | "down";
export type Mouth = "smile" | "talk" | "grin" | "o" | "flat" | "shout" | "smirk" | "frown";
export type Pose = {
  armL?: [number, number]; // угол плеча от вертикали (наружу +) и сгиб локтя
  armR?: [number, number];
  tilt?: number; // наклон головы, градусы
  lean?: number; // наклон корпуса, градусы
  walk?: number | null; // фаза шага
  spread?: number; // ширина стойки
};
export type Hands = { l: [number, number]; r: [number, number] };

type Props = {
  look: Look;
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  pose?: Pose;
  eyes?: Eyes;
  mouth?: Mouth;
  brows?: number; // подъём бровей: + удивление
  talk?: number; // время для анимации рта
  younger?: boolean; // 11–15: ниже ростом, лицо мягче
  hold?: (h: Hands) => React.ReactNode;
  holdBack?: (h: Hands) => React.ReactNode;
  opacity?: number;
};

type Outfit = {
  sleeve: string;
  sleeveLight: string;
  forearm: "sleeve" | "skin";
  pants: string;
  pantsLight: string;
  shoe: string;
  shoeSole: string;
};

const OUT: Record<Look, Outfit> = {
  rocker: { sleeve: "#1e1e24", sleeveLight: "#4a4a57", forearm: "sleeve", pants: "#262a36", pantsLight: "#3b4152", shoe: "#141418", shoeSole: "#3a3a3a" },
  suit: { sleeve: "#b98d5a", sleeveLight: "#d6ad7a", forearm: "sleeve", pants: "#27324d", pantsLight: "#384769", shoe: "#5a3420", shoeSole: "#2b1a10" },
  sport: { sleeve: "#9aa1ab", sleeveLight: "#bfc5cd", forearm: "sleeve", pants: "#3b4150", pantsLight: "#525a6d", shoe: "#f3f3f1", shoeSole: "#d8d8d4" },
  oldmoney: { sleeve: "#f7f4ec", sleeveLight: "#ffffff", forearm: "skin", pants: "#cdb58f", pantsLight: "#dcc7a3", shoe: "#6b3d22", shoeSole: "#3a2012" },
};

const r = (v: number) => Math.round(v * 10) / 10;

const Limb: React.FC<{ pts: number[][]; w: number; base: string; light: string }> = ({ pts, w, base, light }) => {
  const d = "M" + pts.map((p) => r(p[0]) + "," + r(p[1])).join("L");
  return (
    <>
      <path d={d} fill="none" stroke={base} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={light} strokeWidth={w * 0.36} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} transform={`translate(${r(-w * 0.2)},0)`} />
    </>
  );
};

export const Character: React.FC<Props> = (p) => {
  const o = OUT[p.look];
  const pose = p.pose || {};
  const [aL, bL] = pose.armL || [0.1, 0.12];
  const [aR, bR] = pose.armR || [0.1, 0.12];
  const s = (p.s ?? 1) * (p.younger ? 0.88 : 1);

  /* руки: плечо → локоть → кисть */
  const arm = (side: number, a: number, b: number) => {
    const sx = side * 58,
      sy = -458;
    const ex = sx + side * Math.sin(a) * 106,
      ey = sy + Math.cos(a) * 106;
    const hx = ex + side * Math.sin(a + b) * 98,
      hy = ey + Math.cos(a + b) * 98;
    return { s: [sx, sy], e: [ex, ey], h: [hx, hy] };
  };
  const L = arm(-1, aL, bL),
    R = arm(1, aR, bR);
  const hands: Hands = { l: L.h as [number, number], r: R.h as [number, number] };

  /* ноги */
  const w = pose.walk != null ? Math.sin(pose.walk) * 38 : 0;
  const lift = pose.walk != null ? Math.max(0, Math.cos(pose.walk)) * 16 : 0;
  const sp = pose.spread ?? 30;
  const legs = [
    { hip: [-26, -322], knee: [-sp * 0.9 - w * 0.5, -165], foot: [-sp - w, -lift], dir: -1 },
    { hip: [26, -322], knee: [sp * 0.9 + w * 0.5, -165], foot: [sp + w, -(pose.walk != null ? Math.max(0, -Math.cos(pose.walk)) * 16 : 0)], dir: 1 },
  ];

  const armEl = (A: ReturnType<typeof arm>) => {
    if (o.forearm === "skin")
      return (
        <>
          <Limb pts={[A.e, A.h]} w={27} base={C.skin} light={C.skinLight} />
          <Limb pts={[A.s, A.e]} w={39} base={o.sleeve} light={o.sleeveLight} />
          {/* подвёрнутый рукав */}
          <Limb pts={[[A.s[0] + (A.e[0] - A.s[0]) * 0.86, A.s[1] + (A.e[1] - A.s[1]) * 0.8], A.e]} w={37} base="#ebe5d8" light="#ffffff" />
        </>
      );
    return (
      <>
        <Limb pts={[A.s, A.e, A.h]} w={38} base={o.sleeve} light={o.sleeveLight} />
        {p.look === "sport" ? <Limb pts={[[A.e[0] + (A.h[0] - A.e[0]) * 0.86, A.e[1] + (A.h[1] - A.e[1]) * 0.86], A.h]} w={30} base="#8a919b" light="#aab0b8" /> : null}
      </>
    );
  };
  const hand = (h: number[], side: number) => (
    <g transform={`translate(${r(h[0])},${r(h[1])})`}>
      <ellipse cx={0} cy={7} rx={16} ry={18} fill={C.skin} />
      <ellipse cx={-side * 11} cy={0} rx={6} ry={10} fill={C.skin} transform={`rotate(${side * 25})`} />
      <ellipse cx={3} cy={10} rx={7} ry={6} fill={C.skinShade} opacity={0.35} />
    </g>
  );

  const torso = "M-30,-484 C-52,-482 -67,-472 -69,-452 L-59,-342 C-57,-324 -49,-319 -45,-317 L45,-317 C49,-319 57,-324 59,-342 L69,-452 C67,-472 52,-482 30,-484Z";
  const torsoShade = "M22,-484 C52,-480 67,-470 69,-452 L59,-342 C57,-324 49,-319 45,-317 L26,-317 C34,-380 34,-440 22,-484Z";

  return (
    <g transform={`translate(${r(p.x)},${r(p.y)}) scale(${r(s * (p.flip ? -1 : 1) * 1000) / 1000},${r(s * 1000) / 1000})`} opacity={p.opacity}>
      {/* тень на полу */}
      <ellipse cx={0} cy={4} rx={110} ry={16} fill="url(#floorShadow)" />
      <g transform={`rotate(${pose.lean || 0} 0 -320)`}>
        {/* ноги */}
        {legs.map((g, i) => (
          <g key={i}>
            <Limb pts={[g.hip, g.knee]} w={46} base={o.pants} light={o.pantsLight} />
            <Limb pts={[g.knee, [g.foot[0], g.foot[1] - 18]]} w={38} base={o.pants} light={o.pantsLight} />
            {p.look === "rocker" && i === 0 ? <path d={`M${r(g.knee[0] - 10)},${r(g.knee[1] - 4)} q10,-5 20,1 q-10,7 -20,-1Z`} fill={C.skin} /> : null}
            {p.look === "sport" ? <Limb pts={[[g.foot[0], g.foot[1] - 28], [g.foot[0], g.foot[1] - 18]]} w={36} base="#2f3440" light="#454b5a" /> : null}
            <path
              d={`M${r(g.foot[0] - g.dir * 22)},${r(g.foot[1] + 3)} C${r(g.foot[0] - g.dir * 24)},${r(g.foot[1] - 18)} ${r(g.foot[0] + g.dir * 10)},${r(g.foot[1] - 22)} ${r(g.foot[0] + g.dir * 26)},${r(g.foot[1] - 10)} C${r(g.foot[0] + g.dir * 36)},${r(g.foot[1] - 4)} ${r(g.foot[0] + g.dir * 34)},${r(g.foot[1] + 4)} ${r(g.foot[0] + g.dir * 22)},${r(g.foot[1] + 5)}Z`}
              fill={o.shoe}
            />
            <path d={`M${r(g.foot[0] - g.dir * 22)},${r(g.foot[1] + 1)} L${r(g.foot[0] + g.dir * 30)},${r(g.foot[1] + 1)}`} stroke={o.shoeSole} strokeWidth={5} strokeLinecap="round" />
          </g>
        ))}

        {p.holdBack ? p.holdBack(hands) : null}

        {/* капюшон за шеей */}
        {p.look === "sport" ? <path d="M-46,-478 C-54,-520 54,-520 46,-478 C30,-492 -30,-492 -46,-478Z" fill="#878e98" /> : null}

        {/* шея */}
        <path d="M-17,-515 L17,-515 L19,-470 L-19,-470Z" fill={C.skin} />
        <path d="M-17,-508 C-6,-496 6,-496 17,-508 L18,-490 C6,-484 -6,-484 -18,-490Z" fill={C.skinShade} opacity={0.6} />

        {/* корпус */}
        {p.look === "suit" ? (
          <>
            <path d="M-30,-484 C-54,-482 -69,-472 -71,-452 L-68,-190 C-40,-184 40,-184 68,-190 L71,-452 C69,-472 54,-482 30,-484Z" fill={o.sleeve} />
            <path d="M-22,-484 L-10,-188 L10,-188 L22,-484Z" fill="#27324d" />
            <path d="M-13,-484 L0,-430 L13,-484Z" fill={C.white} />
            <path d="M-4,-478 L4,-478 L8,-414 L0,-400 L-8,-414Z" fill="#7a2b33" />
            <path d="M-4,-478 L4,-478 L3,-468 L-3,-468Z" fill="#5c1f26" />
            <path d="M-22,-484 L-34,-460 L-14,-430Z M22,-484 L34,-460 L14,-430Z" fill="#1e2740" />
            <path d="M-28,-486 L-54,-462 L-30,-404 L-16,-440Z" fill={o.sleeveLight} />
            <path d="M28,-486 L54,-462 L30,-404 L16,-440Z" fill="#a67c4c" />
            <path d="M26,-484 C54,-480 69,-470 71,-452 L68,-190 C60,-188 50,-187 40,-186 C46,-300 44,-420 26,-484Z" fill="#000" opacity={0.1} />
            <circle cx={-26} cy={-370} r={4} fill="#6b4a2a" />
            <circle cx={-24} cy={-300} r={4} fill="#6b4a2a" />
            <path d="M-60,-300 L-34,-300" stroke="#9a7345" strokeWidth={4} strokeLinecap="round" />
          </>
        ) : p.look === "rocker" ? (
          <>
            <path d={torso} fill={o.sleeve} />
            <path d="M-20,-482 L20,-482 L16,-317 L-16,-317Z" fill="#3a3b42" />
            {/* принт на футболке: молния */}
            <path d="M3,-452 L-10,-418 L0,-418 L-6,-392 L10,-428 L0,-428 L7,-452Z" fill="#d9483b" />
            <path d="M-24,-486 L-44,-470 L-24,-420 L-17,-470Z" fill="#34343d" />
            <path d="M24,-486 L44,-470 L24,-420 L17,-470Z" fill="#2a2a31" />
            <path d="M-18,-470 L-17,-320" stroke="#b9bcc4" strokeWidth={2.5} />
            <path d="M-50,-400 L-30,-398" stroke="#b9bcc4" strokeWidth={2.5} strokeLinecap="round" />
            <path d={torsoShade} fill="#000" opacity={0.18} />
            <path d="M-56,-342 L-19,-342 M19,-342 L56,-342" stroke="#2c2c34" strokeWidth={9} />
          </>
        ) : p.look === "sport" ? (
          <>
            <path d="M-32,-484 C-56,-482 -72,-472 -74,-452 L-68,-336 C-66,-318 -56,-312 -50,-310 L50,-310 C56,-312 66,-318 68,-336 L74,-452 C72,-472 56,-482 32,-484Z" fill={o.sleeve} />
            <path d="M-44,-374 L44,-374 L52,-326 L-52,-326Z" fill="#8a919b" />
            <path d="M-68,-322 L68,-322" stroke="#858c96" strokeWidth={14} strokeLinecap="round" />
            <path d="M-8,-480 L-10,-430 M8,-480 L10,-430" stroke={C.white} strokeWidth={3} strokeLinecap="round" />
            <path d="M22,-484 C54,-480 72,-470 74,-452 L68,-336 C66,-318 56,-312 50,-310 L28,-310 C38,-380 36,-440 22,-484Z" fill="#000" opacity={0.1} />
          </>
        ) : (
          <>
            <path d={torso} fill={o.sleeve} />
            <path d="M0,-470 L0,-330" stroke="#e2ddd2" strokeWidth={2.5} />
            {[-440, -400, -360].map((yy) => (
              <circle key={yy} cx={4} cy={yy} r={2.5} fill="#d8d1c3" />
            ))}
            <path d="M-2,-486 L-20,-492 L-24,-472 L-4,-462Z M2,-486 L20,-492 L24,-472 L4,-462Z" fill="#ffffff" />
            <path d={torsoShade} fill="#8a7a60" opacity={0.14} />
            {/* ремень */}
            <path d="M-57,-326 L57,-326" stroke="#6b3d22" strokeWidth={11} />
            <rect x={-8} y={-332} width={16} height={12} rx={2} fill="#c9a24e" />
            {/* свитер на плечах */}
            <path d="M-70,-458 C-50,-498 50,-498 70,-458 C52,-474 -52,-474 -70,-458Z" fill="#e8d9b8" />
            <path d="M-54,-470 C-40,-450 -20,-440 -2,-436 M54,-470 C40,-450 20,-440 2,-436" fill="none" stroke="#e8d9b8" strokeWidth={20} strokeLinecap="round" />
            <path d="M-54,-470 C-40,-450 -20,-440 -2,-436" fill="none" stroke="#f6ecd4" strokeWidth={6} strokeLinecap="round" opacity={0.7} transform="translate(-3,-4)" />
            <circle cx={0} cy={-434} r={13} fill="#dccaa4" />
            <path d="M-6,-424 L-14,-380 M6,-424 L12,-384" stroke="#e1d0ad" strokeWidth={16} strokeLinecap="round" />
          </>
        )}

        {/* руки */}
        {armEl(L)}
        {armEl(R)}
        {p.look === "oldmoney" ? <Limb pts={[[L.e[0] + (L.h[0] - L.e[0]) * 0.8, L.e[1] + (L.h[1] - L.e[1]) * 0.8], [L.e[0] + (L.h[0] - L.e[0]) * 0.86, L.e[1] + (L.h[1] - L.e[1]) * 0.86]]} w={25} base="#c9a24e" light="#f0d58a" /> : null}
        {p.holdBack ? null : null}
        {hand(hands.l, -1)}
        {hand(hands.r, 1)}

        {/* голова */}
        <g transform={`rotate(${pose.tilt || 0} 0 -500)`}>
          <Head {...p} />
        </g>

        {p.hold ? p.hold(hands) : null}
      </g>
    </g>
  );
};

const Head: React.FC<Props> = (p) => {
  const eyes = p.eyes || "open";
  const mouth = p.mouth || "smile";
  const by = -(p.brows || 0) * 6;
  const look = p.look;
  const face =
    "M0,-614 C38,-614 54,-590 54,-558 C54,-538 51,-524 44,-512 C36,-500 20,-492 0,-491 C-20,-492 -36,-500 -44,-512 C-51,-524 -54,-538 -54,-558 C-54,-590 -38,-614 0,-614Z";
  const eye = (cx: number) => {
    const y = -556;
    const look = eyes === "side" ? 4 : eyes === "down" ? 0 : 0;
    const dy = eyes === "down" ? 2 : 0;
    if (eyes === "closed" || eyes === "down")
      return eyes === "closed" ? (
        <path d={`M${cx - 11},${y} Q${cx},${y + 6} ${cx + 11},${y}`} stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : (
        <>
          <path d={`M${cx - 11},${y + dy} Q${cx},${y + 5} ${cx + 11},${y + dy}`} stroke={C.ink} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <path d={`M${cx - 10},${y - 3} Q${cx},${y - 6} ${cx + 10},${y - 3}`} stroke={C.skinShade} strokeWidth={2} fill="none" opacity={0.7} />
        </>
      );
    if (eyes === "happy") return <path d={`M${cx - 11},${y + 2} Q${cx},${y - 8} ${cx + 11},${y + 2}`} stroke={C.ink} strokeWidth={3.2} fill="none" strokeLinecap="round" />;
    const big = eyes === "wide" ? 1.35 : 1;
    return (
      <>
        <path d={`M${cx - 11 * big},${y} Q${cx},${y - 9 * big} ${cx + 11 * big},${y} Q${cx},${y + 7 * big} ${cx - 11 * big},${y}Z`} fill={C.white} />
        <circle cx={cx + look + 0.5} cy={y - 0.5} r={5.2 * (eyes === "wide" ? 1.05 : 1)} fill={C.iris} />
        <circle cx={cx + look + 0.5} cy={y - 0.5} r={2.6} fill={C.ink} />
        <circle cx={cx + look + 2.3} cy={y - 2.4} r={1.4} fill="#fff" />
        <path d={`M${cx - 12 * big},${y + 0.5} Q${cx},${y - 10.5 * big} ${cx + 12 * big},${y - 0.5}`} stroke={C.ink} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      </>
    );
  };
  const t = p.talk || 0;
  const open = 3 + Math.abs(Math.sin(t * 17)) * 7 + Math.abs(Math.sin(t * 7.3)) * 3;
  return (
    <>
      {/* волосы сзади (у рокера — до шеи) */}
      {/* уши */}
      <ellipse cx={-53} cy={-552} rx={9} ry={15} fill={C.skin} />
      <ellipse cx={53} cy={-552} rx={9} ry={15} fill={C.skinShade} />
      {/* лицо */}
      <path d={face} fill="url(#skinG)" />
      <path d="M30,-606 C48,-594 55,-574 54,-554 C53,-532 48,-518 40,-508 C30,-498 18,-493 6,-491 C26,-504 38,-526 40,-552 C42,-574 38,-594 30,-606Z" fill={C.skinShade} opacity={0.45} />
      <ellipse cx={-30} cy={-530} rx={11} ry={6} fill={C.blush} opacity={0.22} />
      <ellipse cx={32} cy={-530} rx={10} ry={6} fill={C.blush} opacity={0.22} />
      {/* брови */}
      {[-19, 21].map((cx) => (
        <path key={cx} d={`M${cx - 14},${-571 + by} Q${cx},${-577 + by} ${cx + 14},${-572 + by} L${cx + 14},${-567 + by} Q${cx},${-572 + by} ${cx - 14},${-566 + by}Z`} fill={C.brow} />
      ))}
      {eye(-19)}
      {eye(21)}
      {/* нос: прямой, тень справа */}
      <path d="M5,-552 C8,-540 11,-531 13,-525 C10,-521 4,-520 -1,-522" fill="none" stroke={C.skinShade} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M6,-548 C9,-538 12,-530 13,-525 C15,-529 13,-540 6,-548Z" fill={C.skinShade} opacity={0.6} />
      {/* рот */}
      {mouth === "smile" ? <path d="M-13,-510 Q1,-501 15,-511" stroke="#a45e52" strokeWidth={3.2} fill="none" strokeLinecap="round" /> : null}
      {mouth === "smirk" ? <path d="M-10,-508 Q4,-504 16,-513" stroke="#a45e52" strokeWidth={3.2} fill="none" strokeLinecap="round" /> : null}
      {mouth === "flat" ? <path d="M-10,-508 L13,-509" stroke="#a45e52" strokeWidth={3.2} strokeLinecap="round" /> : null}
      {mouth === "frown" ? <path d="M-11,-503 Q1,-511 14,-503" stroke="#a45e52" strokeWidth={3.2} fill="none" strokeLinecap="round" /> : null}
      {mouth === "grin" ? (
        <>
          <path d="M-16,-514 Q1,-490 18,-514 Q1,-508 -16,-514Z" fill="#6d2c2c" />
          <path d="M-13,-513 Q1,-509 15,-513 L14,-507 Q1,-504 -12,-507Z" fill="#fff" />
        </>
      ) : null}
      {mouth === "talk" ? <ellipse cx={1} cy={-508} rx={10} ry={r(open / 2 + 1)} fill="#6d2c2c" /> : null}
      {mouth === "o" ? <ellipse cx={1} cy={-507} rx={7} ry={9} fill="#6d2c2c" /> : null}
      {mouth === "shout" ? (
        <>
          <path d="M-15,-518 Q1,-522 17,-518 Q16,-490 1,-488 Q-14,-490 -15,-518Z" fill="#6d2c2c" />
          <path d="M-8,-496 Q1,-502 10,-496 Q1,-490 -8,-496Z" fill="#d46a6a" />
        </>
      ) : null}
      <Hair look={look} />
    </>
  );
};

const Hair: React.FC<{ look: Look }> = ({ look }) => {
  if (look === "rocker")
    return (
      <>
        <path d="M-60,-548 C-66,-602 -30,-634 6,-632 C46,-630 68,-602 61,-548 C57,-561 51,-571 45,-575 C47,-563 43,-553 37,-549 C35,-563 27,-575 15,-579 C13,-567 5,-561 -3,-559 C-5,-571 -13,-579 -23,-579 C-25,-567 -33,-557 -43,-553 C-43,-563 -45,-569 -49,-573 C-53,-563 -56,-555 -60,-548Z" fill={C.hair} />
        <path d="M-58,-560 C-62,-548 -60,-540 -55,-536 L-52,-560Z M59,-560 C63,-548 61,-540 56,-536 L53,-560Z" fill={C.hair} />
        <path d="M-10,-632 L-4,-652 L6,-630 Z M18,-628 L32,-644 L30,-622Z M-34,-620 L-44,-636 L-24,-626Z" fill={C.hair} />
        <path d="M-40,-600 C-24,-618 4,-624 26,-614 M-30,-590 C-14,-604 10,-608 30,-598" stroke={C.hairLight} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d="M40,-610 C54,-596 60,-576 58,-556" stroke={C.hairShade} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />
      </>
    );
  if (look === "suit")
    return (
      <>
        <path d="M-55,-560 C-59,-602 -30,-628 4,-628 C40,-628 61,-606 57,-560 C53,-584 41,-598 21,-601 C5,-602 -11,-599 -21,-595 L-29,-601 C-40,-593 -51,-579 -55,-560Z" fill={C.hair} />
        <path d="M-26,-600 C-8,-616 22,-618 44,-604" stroke={C.hairLight} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d="M-29,-601 C-36,-610 -40,-612 -44,-606" stroke={C.hairShade} strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    );
  if (look === "sport")
    return (
      <>
        <path d="M-54,-566 C-55,-606 -28,-624 2,-624 C35,-624 57,-606 54,-566 C49,-587 31,-597 2,-597 C-26,-597 -47,-589 -54,-566Z" fill={C.hair} />
        <path d="M-30,-606 C-10,-616 16,-616 34,-608" stroke={C.hairLight} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8} />
      </>
    );
  return (
    <>
      <path d="M-55,-560 C-59,-598 -45,-626 -15,-636 C7,-648 45,-642 55,-618 C61,-602 59,-582 55,-560 C51,-585 41,-597 25,-601 C29,-593 25,-589 19,-591 C11,-601 -5,-605 -21,-601 C-35,-597 -49,-583 -55,-560Z" fill={C.hair} />
      <path d="M-34,-606 C-26,-624 -8,-634 12,-636 M-10,-604 C0,-622 20,-632 40,-626" stroke={C.hairLight} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d="M8,-600 C22,-612 38,-616 50,-606" stroke={C.hairShade} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
    </>
  );
};

/* общие градиенты: вставить один раз в <svg> */
export const CharacterDefs: React.FC = () => (
  <>
    <radialGradient id="skinG" cx="38%" cy="35%" r="75%">
      <stop offset="0" stopColor={C.skinLight} />
      <stop offset="0.6" stopColor={C.skin} />
      <stop offset="1" stopColor={C.skinShade} />
    </radialGradient>
    <radialGradient id="floorShadow">
      <stop offset="0" stopColor="#000" stopOpacity={0.28} />
      <stop offset="1" stopColor="#000" stopOpacity={0} />
    </radialGradient>
  </>
);
