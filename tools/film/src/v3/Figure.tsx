import React from "react";

/* Силуэт героя в духе рекламы iPod: сплошная тёмная фигура, контровой свет
   по краю, лицо — только профиль. Скелет: таз → корпус → плечи → руки,
   таз → бёдра → голени → стопы. Все углы — радианы от вертикали вниз,
   плюс — в сторону взгляда (dir). */

export type Look = "rocker" | "suit" | "sport" | "oldmoney";
export type Limb = [number, number]; // [угол сегмента от вертикали, сгиб сустава]
export type Pose = {
  armB?: Limb; // рука дальняя от зрителя (сзади)
  armF?: Limb; // рука ближняя
  legB?: Limb;
  legF?: Limb;
  lean?: number; // наклон корпуса
  head?: number; // наклон головы
  hipX?: number; // сдвиг таза (перенос веса)
  crouch?: number; // присед, единицы
  pocketB?: boolean; // кисть в кармане
  pocketF?: boolean;
  fistB?: boolean;
  fistF?: boolean;
  hornsF?: boolean; // «коза»
};
export type Hands = { b: [number, number]; f: [number, number] };

const P = (x: number, y: number) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];

/* сужающийся сегмент: трапеция + круглые суставы */
const seg = (x1: number, y1: number, x2: number, y2: number, w1: number, w2: number) => {
  const dx = x2 - x1,
    dy = y2 - y1,
    L = Math.hypot(dx, dy) || 1,
    nx = -dy / L,
    ny = dx / L;
  const a = P(x1 + (nx * w1) / 2, y1 + (ny * w1) / 2),
    b = P(x2 + (nx * w2) / 2, y2 + (ny * w2) / 2),
    c = P(x2 - (nx * w2) / 2, y2 - (ny * w2) / 2),
    d = P(x1 - (nx * w1) / 2, y1 - (ny * w1) / 2);
  const c1 = `M${x1 + w1 / 2},${y1} a${w1 / 2},${w1 / 2} 0 1,0 ${-w1},0 a${w1 / 2},${w1 / 2} 0 1,0 ${w1},0Z`;
  const c2 = `M${x2 + w2 / 2},${y2} a${w2 / 2},${w2 / 2} 0 1,0 ${-w2},0 a${w2 / 2},${w2 / 2} 0 1,0 ${w2},0Z`;
  return `M${a}L${b}L${c}L${d}Z|${c1}|${c2}`;
};
const end = (x: number, y: number, ang: number, len: number) => [x + Math.sin(ang) * len, y + Math.cos(ang) * len];

type Build = { d: string; detail: string; hands: Hands; light: string };

const DEF: Required<Omit<Pose, "pocketB" | "pocketF" | "fistB" | "fistF" | "hornsF">> = {
  armB: [-0.12, 0.35],
  armF: [0.1, 0.45],
  legB: [-0.06, 0.1],
  legF: [0.1, 0.02],
  lean: 0,
  head: 0,
  hipX: 0,
  crouch: 0,
};

function build(look: Look, pose: Pose): Build {
  const p = { ...DEF, ...pose };
  let d = "",
    detail = "",
    light = "";
  const add = (s: string) => (d += s + "|");
  const det = (s: string) => (detail += s + " ");

  /* ноги от таза */
  const hy = -330 + p.crouch;
  const hx = p.hipX;
  const pants = look === "sport" ? [56, 42, 28] : look === "rocker" ? [48, 36, 26] : [52, 39, 28];
  const leg = (ox: number, l: Limb, near: boolean) => {
    const hip = [hx + ox, hy];
    const knee = end(hip[0], hip[1], l[0], 166);
    const ang2 = l[0] - l[1];
    const ank = end(knee[0], knee[1], ang2, 158);
    add(seg(hip[0], hip[1], knee[0], knee[1], pants[0], pants[1]));
    add(seg(knee[0], knee[1], ank[0], ank[1], pants[1], pants[2]));
    /* обувь смотрит вперёд (в сторону взгляда) */
    const ax = ank[0],
      ay = ank[1];
    if (look === "rocker") add(`M${ax - 16},${ay - 26} L${ax + 16},${ay - 26} L${ax + 18},${ay - 8} L${ax + 50},${ay - 2} Q${ax + 56},${ay + 8} ${ax + 48},${ay + 10} L${ax - 18},${ay + 10}Z`);
    else if (look === "sport") add(`M${ax - 18},${ay - 12} Q${ax},${ay - 22} ${ax + 20},${ay - 12} L${ax + 46},${ay - 2} Q${ax + 58},${ay + 6} ${ax + 50},${ay + 12} L${ax - 20},${ay + 12}Z`);
    else add(`M${ax - 14},${ay - 10} L${ax + 14},${ay - 10} L${ax + 46},${ay - 2} Q${ax + 54},${ay + 6} ${ax + 46},${ay + 8} L${ax - 16},${ay + 8}Z`);
    if (look === "sport") det(`M${ax - 18},${ay + 6} L${ax + 52},${ay + 6}`);
    if (look === "sport" && near) det(`M${ax - 13},${ay - 34} L${ax + 13},${ay - 34}`);
    return ank;
  };
  leg(-16, p.legB, false);

  /* корпус с наклоном вокруг таза */
  const lean = p.lean;
  const R = (x: number, y: number) => {
    const dx = x - hx,
      dy = y - hy;
    return P(hx + dx * Math.cos(lean) - dy * Math.sin(lean), hy + dx * Math.sin(lean) + dy * Math.cos(lean));
  };
  const neck = R(hx + 4, -500);
  const shB = R(hx - 44, -462),
    shF = R(hx + 44, -462);

  /* руки */
  const hand = (sx: number, sy: number, l: Limb, near: boolean, pocket?: boolean, fist?: boolean, horns?: boolean) => {
    const wide = look === "sport" ? 1.12 : look === "suit" ? 1.06 : 1;
    if (pocket) {
      const el = end(sx, sy, l[0] + lean, 104);
      const pk = [hx + (near ? 30 : -30), hy + 6];
      add(seg(sx, sy, el[0], el[1], 30 * wide, 25 * wide));
      add(seg(el[0], el[1], pk[0], pk[1], 25 * wide, 20 * wide));
      return pk as [number, number];
    }
    const el = end(sx, sy, l[0] + lean, 108);
    const wr = end(el[0], el[1], l[0] + lean + l[1], 98);
    add(seg(sx, sy, el[0], el[1], 30 * wide, 25 * wide));
    add(seg(el[0], el[1], wr[0], wr[1], 25 * wide, 18));
    /* кисть: ладонь по направлению предплечья и большой палец */
    const a = l[0] + lean + l[1];
    const deg = (-a * 180) / Math.PI;
    const t = `translate(${P(wr[0], wr[1])}) rotate(${Math.round(deg)}) scale(1.35)`;
    if (fist) light += `<g transform="${t}"><path d="M-13,12 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0Z M10,4 Q20,10 16,20Z"/></g>`;
    else if (horns) {
      light += `<g transform="${t}"><path d="M-12,2 Q-14,22 0,24 Q14,22 12,2Z M-11,16 L-14,52 L-6,52 L-4,20Z M6,18 L10,52 L18,50 L12,14Z" /></g>`;
    } else light += `<g transform="${t}"><path d="M-11,0 Q-14,26 -6,38 Q2,44 9,36 Q13,24 11,0Z M9,6 Q20,12 18,24 L12,22Z" /></g>`;
    return wr as [number, number];
  };
  const hb = hand(shB[0], shB[1], p.armB, false, p.pocketB, p.fistB);

  /* торс и одежда */
  const T = (pts: number[][]) => "M" + pts.map((q) => R(q[0] + hx, q[1]).join(",")).join("L") + "Z";
  const S = (pts: number[][]) => {
    const q = pts.map((v) => R(v[0] + hx, v[1]));
    const n = q.length;
    let out = "M" + q[0].join(",");
    for (let i = 0; i < n; i++) {
      const p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
      const c1 = P(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6);
      const c2 = P(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6);
      out += `C${c1} ${c2} ${p2.join(",")}`;
    }
    return out + "Z";
  };
  if (look === "suit") {
    add(S([[-18, -504], [-50, -490], [-64, -462], [-60, -380], [-62, -300], [-72, -172], [0, -168], [72, -172], [62, -300], [60, -380], [64, -462], [50, -490], [18, -504]]));
    det(T([[4, -496], [22, -440], [14, -300], [18, -170]]).replace(/Z$/, ""));
    det(T([[4, -496], [30, -470], [22, -440]]).replace(/Z$/, ""));
  } else if (look === "sport") {
    add(S([[-20, -504], [-54, -490], [-68, -460], [-66, -380], [-64, -318], [-52, -302], [0, -300], [52, -302], [64, -318], [66, -380], [68, -460], [54, -490], [20, -504]]));
    add(T([[-48, -500], [-40, -530], [-8, -540], [0, -506]])); // капюшон за шеей
    det(T([[-30, -372], [34, -372], [42, -318], [-38, -318]]));
    det(T([[-60, -312], [60, -312]]).replace(/Z$/, ""));
  } else if (look === "rocker") {
    add(S([[-18, -504], [-50, -490], [-62, -462], [-56, -390], [-52, -330], [-50, -312], [0, -310], [50, -312], [52, -330], [56, -390], [62, -462], [50, -490], [18, -504]]));
    add(T([[-24, -500], [-30, -532], [-6, -510]])); // поднятый воротник
    add(T([[24, -500], [34, -530], [10, -508]]));
    det(T([[14, -490], [8, -312]]).replace(/Z$/, ""));
    det(T([[-54, -330], [54, -330]]).replace(/Z$/, ""));
  } else {
    add(S([[-16, -504], [-48, -490], [-60, -462], [-52, -390], [-46, -330], [-44, -316], [0, -314], [44, -316], [46, -330], [52, -390], [60, -462], [48, -490], [16, -504]]));
    // свитер на плечах: валик и рукава, завязанные на груди
    add(T([[-62, -466], [-40, -498], [40, -498], [62, -466], [40, -478], [-40, -478]]));
    det(T([[-46, -478], [-8, -430], [6, -432], [44, -478]]).replace(/Z$/, ""));
    det(T([[-4, -430], [-10, -392]]).replace(/Z$/, "") + " " + T([[6, -432], [14, -396]]).replace(/Z$/, ""));
    det(T([[-50, -334], [50, -334]]).replace(/Z$/, ""));
  }
  add(seg(neck[0] - 2, neck[1] + 10, neck[0] + 2, neck[1] - 30, 38, 34));

  /* голова в профиль, нос — прямой */
  const hc = R(hx + 6, -560);
  const ha = (lean * 180) / Math.PI + p.head;
  const hair: Record<Look, string> = {
    rocker: "M-46,6 C-54,-30 -40,-60 -8,-66 L-2,-80 L10,-66 L22,-78 L28,-62 L42,-68 L42,-52 C50,-46 52,-36 48,-24 L40,-30 L36,-18 L28,-30 L20,-22 L14,-36 C-2,-36 -20,-28 -30,-10 L-34,4 L-40,-2Z",
    suit: "M-46,0 C-50,-40 -24,-64 6,-64 C32,-64 48,-50 47,-28 C34,-40 12,-44 -6,-40 C-24,-36 -36,-24 -40,0Z",
    sport: "M-44,-8 C-46,-40 -22,-58 6,-58 C30,-58 44,-46 44,-32 C30,-40 -10,-40 -40,-4Z",
    oldmoney: "M-44,-6 C-50,-40 -30,-62 -4,-66 C12,-80 42,-78 52,-58 C56,-48 52,-38 46,-30 C36,-44 16,-46 -6,-40 C-24,-36 -36,-24 -40,-2Z",
  };
  const head = "M-44,-2 C-46,-40 -20,-60 8,-58 C34,-56 48,-38 46,-12 L52,4 L62,16 L50,22 L50,30 L46,34 L48,40 C44,54 30,62 14,60 C0,58 -12,52 -22,44 C-38,36 -44,20 -44,-2Z";
  const g = `translate(${P(hc[0], hc[1])}) rotate(${Math.round(ha * 10) / 10}) scale(0.86)`;
  light += `<g transform="${g}"><path d="${head}"/><path d="${hair[look]}"/></g>`;

  /* ближние нога и рука — поверх корпуса */
  leg(18, p.legF, true);
  const hf = hand(shF[0], shF[1], p.armF, true, p.pocketF, p.fistF, p.hornsF);
  return { d, detail, hands: { b: hb, f: hf }, light };
}

export const Figure: React.FC<{
  look: Look;
  x: number;
  y: number;
  s?: number;
  dir?: 1 | -1;
  pose?: Pose;
  fill?: string;
  rim?: string;
  detailColor?: string;
  younger?: boolean;
  hold?: (h: Hands) => React.ReactNode;
}> = ({ look, x, y, s = 1, dir = 1, pose = {}, fill = "#141218", rim = "#ffffff55", detailColor = "#3a3544", younger, hold }) => {
  const b = build(look, pose);
  const k = s * (younger ? 0.86 : 1);
  const body = (col: string) => (
    <g fill={col}>
      {b.d.split("|").filter(Boolean).map((q, i) => (
        <path key={i} d={q} />
      ))}
      <g dangerouslySetInnerHTML={{ __html: b.light }} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${k * dir},${k})`}>
      <ellipse cx={0} cy={6} rx={120} ry={14} fill="#000" opacity={0.18} />
      <g transform="translate(-5,-3)">{body(rim)}</g>
      {body(fill)}
      <path d={b.detail} fill="none" stroke={detailColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {hold ? hold(b.hands) : null}
    </g>
  );
};
