import React from "react";

/* Три пианиста за тремя роялями — как на сцене: тёплый конус прожектора,
   рояль и пианист — чёрные силуэты с контровым светом, внизу отражение.
   kind: 0 — высокий худой во фраке, 1 — коренастый, 2 — женщина с пучком.
   sway — наклон корпуса (градусы), lift — подъём кистей (0…1). */

const FILL = "#0b0a0c";
const RIM = "rgba(255,226,180,.62)";
const RIM2 = "rgba(255,226,180,.32)";

const Piano: React.FC<{ id: string }> = ({ id }) => (
  <g mask={`url(#fade${id})`}>
    {/* крышка на подпорке: изогнутый край */}
    <path d="M226,204 C300,200 420,170 600,58 L612,66 L612,204 Z" fill={FILL} stroke={RIM} strokeWidth={2} />
    <path d="M232,203 C320,196 430,166 598,64" fill="none" stroke="rgba(255,226,180,.18)" strokeWidth={6} />
    <path d="M430,204 L452,120" stroke={RIM} strokeWidth={3} />
    {/* корпус */}
    <path d="M200,204 L612,204 L612,256 L200,256 Q194,256 194,250 L194,210 Q194,204 200,204 Z" fill={FILL} stroke={RIM} strokeWidth={2} />
    <path d="M200,248 L612,248" stroke={RIM2} strokeWidth={1.5} />
    {/* клавиатура */}
    <rect x={150} y={216} width={52} height={11} rx={1.5} fill="#efe7da" />
    {Array.from({ length: 9 }).map((_, k) => (
      <rect key={k} x={152 + k * 5.6} y={216} width={2.6} height={6.5} fill={FILL} />
    ))}
    <rect x={146} y={227} width={58} height={8} rx={2} fill={FILL} stroke={RIM2} strokeWidth={1.5} />
    {/* пюпитр с нотами */}
    <path d="M206,204 L222,160 L236,162 L222,204 Z" fill={FILL} stroke={RIM2} strokeWidth={1.5} />
    <path d="M214,190 L224,164 L232,165 L222,191 Z" fill="#efe7da" opacity={0.75} />
    {/* ножки на колёсиках и лира с педалями */}
    {[214, 560].map((x) => (
      <g key={x}>
        <path d={`M${x},256 L${x + 5},344 L${x + 17},344 L${x + 22},256 Z`} fill={FILL} stroke={RIM2} strokeWidth={1.5} />
        <circle cx={x + 11} cy={350} r={6} fill={FILL} stroke={RIM2} strokeWidth={1.5} />
      </g>
    ))}
    <path d="M286,256 Q280,300 290,340 M306,256 Q312,300 302,340" fill="none" stroke={RIM2} strokeWidth={3} />
    <path d="M280,346 L312,346" stroke={RIM} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const limb = (pts: [number, number][], w: number) => (
  <g>
    <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={RIM} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={FILL} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const P: React.FC<{ d: string }> = ({ d }) => <path d={d} fill={FILL} stroke={RIM} strokeWidth={1.8} strokeLinejoin="round" />;

const Player: React.FC<{ kind: 0 | 1 | 2; sway: number; lift: number }> = ({ kind, sway, lift }) => {
  const hand: [number, number] = [190, 214 - lift * 12];
  if (kind === 0) {
    // высокий, худой, во фраке: длинный прямой корпус, длинная шея, фалды
    return (
      <g>
        <P d="M92,276 Q82,304 76,340 L90,342 Q98,306 112,282 Z" />
        {limb([[106, 284], [172, 280], [186, 344]], 16)}
        <P d="M176,348 Q188,340 204,348 Q204,354 178,354 Z" />
        <g transform={`rotate(${sway},104,284)`}>
          <P d="M90,288 Q84,232 104,160 Q118,148 136,158 Q130,226 122,292 Z" />
          {limb([[126, 164], [134, 140]], 10)}
          <ellipse cx={138} cy={122} rx={14} ry={17.5} fill={FILL} stroke={RIM} strokeWidth={1.8} />
          <P d="M124,116 Q132,98 154,108 Q146,106 132,122 Z" />
          {limb([[128, 172], [148, 226], hand], 9)}
          <ellipse cx={hand[0] + 5} cy={hand[1] + 2} rx={7} ry={4.5} fill={FILL} stroke={RIM} strokeWidth={1.5} />
        </g>
      </g>
    );
  }
  if (kind === 1) {
    // коренастый: круглая спина, живот, короткая шея, лысина
    return (
      <g>
        {limb([[104, 290], [164, 292], [176, 344]], 25)}
        <P d="M164,348 Q178,338 198,348 Q198,355 166,355 Z" />
        <g transform={`rotate(${sway},102,290)`}>
          <P d="M74,294 Q58,236 92,196 Q120,174 148,194 Q174,226 162,264 Q152,290 128,296 Z" />
          <circle cx={130} cy={164} r={21} fill={FILL} stroke={RIM} strokeWidth={1.8} />
          <path d="M112,158 Q118,150 128,150" stroke="rgba(255,226,180,.35)" strokeWidth={3} fill="none" />
          {limb([[134, 202], [156, 242], hand], 15)}
          <ellipse cx={hand[0] + 5} cy={hand[1] + 2} rx={9} ry={6} fill={FILL} stroke={RIM} strokeWidth={1.5} />
        </g>
      </g>
    );
  }
  // женщина: пучок, тонкие руки, длинное платье стекает со скамьи на пол
  return (
    <g>
      <P d="M86,262 Q70,316 50,354 L198,354 Q168,314 138,262 Z" />
      <g transform={`rotate(${sway},104,270)`}>
        <P d="M94,270 Q92,220 110,178 Q122,168 134,178 Q132,224 126,272 Z" />
        {limb([[122, 180], [126, 160]], 7)}
        <ellipse cx={128} cy={143} rx={12.5} ry={15.5} fill={FILL} stroke={RIM} strokeWidth={1.8} />
        <circle cx={113} cy={128} r={9.5} fill={FILL} stroke={RIM} strokeWidth={1.8} />
        {limb([[122, 188], [146, 232], hand], 7)}
        <ellipse cx={hand[0] + 4} cy={hand[1] + 2} rx={6} ry={4} fill={FILL} stroke={RIM} strokeWidth={1.5} />
      </g>
    </g>
  );
};

/* сцена: три прожектора, у каждого — рояль и пианист */
export const PianoStage: React.FC<{ x: number; y: number; w: number; t: number; on?: number[]; sway?: number[]; lift?: number[] }> = ({ x, y, w, on = [1, 1, 1], sway = [0, 0, 0], lift = [0, 0, 0] }) => {
  const kinds: (0 | 1 | 2)[] = [0, 1, 2];
  const bw = w / 3, bh = bw * (520 / 470);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: bh }}>
      {kinds.map((k, i) => (
        <svg key={k} viewBox="30 -80 470 520" style={{ position: "absolute", left: i * bw, top: 0, width: bw, height: bh, overflow: "visible", opacity: 0.3 + 0.7 * on[i] }}>
          <defs>
            <linearGradient id={`spot${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd89a" stopOpacity={0} />
              <stop offset="0.3" stopColor="#ffd89a" stopOpacity={0.14 * on[i]} />
              <stop offset="1" stopColor="#ffd08a" stopOpacity={0.42 * on[i]} />
            </linearGradient>
            <radialGradient id={`pool${i}`}>
              <stop offset="0" stopColor="#ffd89a" stopOpacity={0.55 * on[i]} />
              <stop offset="0.6" stopColor="#ffd89a" stopOpacity={0.16 * on[i]} />
              <stop offset="1" stopColor="#ffd89a" stopOpacity={0} />
            </radialGradient>
            <linearGradient id={`fg${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0.62" stopColor="#fff" />
              <stop offset="0.98" stopColor="#000" />
            </linearGradient>
            <mask id={`fade${i}`} maskUnits="userSpaceOnUse" x={30} y={-80} width={600} height={520}>
              <rect x={30} y={-80} width={600} height={520} fill={`url(#fg${i})`} />
            </mask>
            <linearGradient id={`refl${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
              <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <mask id={`rm${i}`} maskUnits="userSpaceOnUse" x={30} y={356} width={600} height={200}>
              <rect x={30} y={356} width={600} height={200} fill={`url(#refl${i})`} />
            </mask>
          </defs>
          <path d="M228,-80 L292,-80 L470,356 L40,356 Z" fill={`url(#spot${i})`} />
          <ellipse cx={250} cy={356} rx={250} ry={30} fill={`url(#pool${i})`} />
          <g>
            <Piano id={String(i)} />
            <rect x={56} y={284} width={96} height={10} rx={3} fill={FILL} stroke={RIM2} strokeWidth={1.5} />
            <path d="M64,294 L64,346 M144,294 L144,346" stroke={RIM2} strokeWidth={4} />
            <Player kind={k} sway={sway[i]} lift={lift[i]} />
          </g>
          {/* отражение в полу */}
          <g mask={`url(#rm${i})`} transform="translate(0,712) scale(1,-1)">
            <Piano id={String(i)} />
            <Player kind={k} sway={sway[i]} lift={lift[i]} />
          </g>
        </svg>
      ))}
    </div>
  );
};
