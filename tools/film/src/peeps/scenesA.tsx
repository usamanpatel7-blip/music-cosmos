import React from "react";
import { Bubble, COL, FILL, INK, Layer, Person, S, SE, Stage, Title, ease, ink, ph, pop } from "./kit";
import { Board, Candle, Door, Glass, GrandPiano, Notes, PictureFrame, Record, Speaker, Turntable } from "./props";

/* Главы I–IV. Каждая получает t — время фильма в секундах. */

export const ChapterLabel: React.FC<{ t: number; t0: number; text: string; color?: string }> = ({ t, t0, text, color = INK }) => {
  const u = pop(t, t0 + 0.25, 150, 14);
  return (
    <div style={{ position: "absolute", left: 70, top: 46, transform: `rotate(-3deg) scale(${u})`, transformOrigin: "0 50%", font: '700 64px "Caveat"', color }}>
      {text}
      <svg width={text.length * 30} height={20} style={{ display: "block", marginTop: -8 }}>
        <path d={`M4,12 Q${text.length * 14},20 ${text.length * 29},8`} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/* обои: мягкие вертикальные полосы */
const Wallpaper: React.FC<{ c: string }> = ({ c }) => (
  <Layer>
    {Array.from({ length: 25 }).map((_, i) => (
      <rect key={i} x={i * 80} y={0} width={34} height={1080} fill={c} opacity={0.35} />
    ))}
  </Layer>
);

/* I. Тесно в окончательной версии */
export const C1: React.FC<{ t: number }> = ({ t }) => {
  const creak = t > 1.5 ? Math.sin(t * 40) * ph(t, 1.5, 1.7) * (1 - ph(t, 1.9, 2.3)) * 3 : 0;
  return (
    <Stage bg={COL.cream} cam={{ s: 1 + t * 0.018 }}>
      <Wallpaper c="#eadcc4" />
      <Layer>
        <PictureFrame x={960} y={470} w={520} h={640} rot={creak} />
      </Layer>
      {/* герою тесно: рама обрезает плечи и макушку */}
      <div style={{ position: "absolute", left: 960 - 260, top: 470 - 320, width: 520, height: 640, overflow: "hidden", background: "#fbe6ec", transform: `rotate(${creak}deg)` }}>
        <Person v="now" t={t} x={275} y={-70} h={1250} face={t < 1.4 ? "Suspicious" : "Concerned"} scale={1} />
      </div>
      <div style={{ position: "absolute", left: 960 - 300, top: 870, width: 600, padding: "10px 0 12px", background: FILL, border: `6px solid ${INK}`, borderRadius: 8, textAlign: "center" }}>
        <div style={{ font: '400 26px "Rubik Mono One"', color: INK }}>«ОКОНЧАТЕЛЬНАЯ ВЕРСИЯ»</div>
        <div style={{ font: '700 32px "Caveat"', color: INK }}>масло, 2026. руками не трогать</div>
      </div>
      <Title t={t} t0={1.6} x={470} y={250} text="скрип" font="hand" size={90} rot={-14} color={COL.pink} />
      <Title t={t} t0={1.95} x={1460} y={330} text="скрип" font="hand" size={90} rot={10} color={COL.pink} />
      <ChapterLabel t={t} t0={0} text="I · тесно" />
    </Stage>
  );
};

/* II. Все версии в одной комнате */
const LINE: { v: "r1" | "r2" | "su" | "sp" | "now"; x: number; flip?: boolean; say: string; bx: number; by: number; tail: "l" | "r" }[] = [
  { v: "r1", x: 300, say: "Поставь моё!", bx: 290, by: 170, tail: "l" },
  { v: "r2", x: 630, say: "Нет, моё!", bx: 680, by: 90, tail: "l" },
  { v: "su", x: 960, flip: true, say: "Бах!", bx: 1060, by: 150, tail: "r" },
  { v: "sp", x: 1290, flip: true, say: "Блюз!", bx: 1330, by: 90, tail: "r" },
  { v: "now", x: 1620, flip: true, say: "Три пианиста!", bx: 1600, by: 190, tail: "r" },
];
export const C2: React.FC<{ t: number }> = ({ t }) => {
  const a = S[1];
  const off = a + 4.2; // «музыку пришлось бы выключить»
  const argue = t > S[2];
  const door = ease(ph(t, a + 0.1, a + 0.6)) * (1 - ease(ph(t, a + 3.3, a + 3.8)));
  return (
    <Stage t={t} bg={COL.rose} cam={{ s: 1.02 + (t - a) * 0.006, y: argue ? 0 : 0 }} shake={argue ? 1.2 : 0}>
      <Layer>
        <circle cx={1680} cy={170} r={280} fill="#f5a3b8" />
        <circle cx={220} cy={960} r={330} fill="#f5a3b8" />
      </Layer>
      <Layer>
        <Door x={-60} y={260} open={door} color={COL.pink} />
      </Layer>
      {LINE.map((p, k) => {
        const enter = a + 0.45 + k * 0.5;
        const u = pop(t, enter, 150, 13);
        if (u <= 0.001) return null;
        const jump = argue ? -Math.abs(Math.sin((t + k * 0.7) * 6)) * 22 : 0;
        return (
          <Person
            key={p.v}
            v={p.v}
            t={t}
            seed={k + 3}
            x={p.x + (1 - u) * -80}
            y={300 + (1 - u) * 300 + jump}
            h={1180}
            flip={p.flip}
            rot={argue ? Math.sin((t + k) * 7) * 3 : 0}
            face={t < off ? (k === 0 ? "SmileBig" : "Smile") : t < S[2] ? "Awe" : "Rage"}
            talk={argue ? (k % 2 ? 1 : 0) : false}
          />
        );
      })}
      <Layer>
        <rect x={-40} y={835} width={2000} height={300} fill={COL.pink} {...ink} strokeWidth={10} />
        <Turntable x={960} y={840} spin={t < off ? t * 200 : off * 200 + ease(ph(t, off, off + 1)) * 60} arm={t < off ? 30 : 30 - ease(ph(t, off, off + 0.5)) * 34} />
        <Notes t={t} x={900} y={640} on={1 - ph(t, off, off + 0.4)} />
      </Layer>
      <Title t={t} t0={off + 0.3} t1={S[2] - 0.1} x={960} y={200} text="ТССС…" size={130} />
      {argue ? LINE.map((p, k) => <Bubble key={p.v} t={t} t0={S[2] + 0.15 + k * 0.32} x={p.bx} y={p.by} text={p.say} tail={p.tail} rot={(k % 2 ? 3 : -3) + Math.sin(t * 5 + k) * 1.5} size={40} />) : null}
      <ChapterLabel t={t} t0={a} text="II · комната" />
    </Stage>
  );
};

/* III. Подросток: хэви-метал, альбом целиком, религия, монотеизм */
export const C3: React.FC<{ t: number }> = ({ t }) => {
  const beat = Math.abs(Math.sin(t * 8.8));
  if (t < S[5]) {
    const bang = Math.sin(t * 8.8) * 9;
    const p = ph(t, S[4], SE[4]);
    const m = Math.floor(p * 42),
      sec = Math.floor(p * 42 * 60 + p * 11) % 60;
    return (
      <Stage bg={COL.yellow} cam={{ s: 1.03 + beat * 0.012 }}>
        <Layer>
          {Array.from({ length: 16 }).map((_, i) => {
            const an = (i / 16) * Math.PI * 2 + t * 0.25;
            return <path key={i} d={`M960,620 L${960 + Math.cos(an) * 1500},${620 + Math.sin(an) * 1500} L${960 + Math.cos(an + 0.2) * 1500},${620 + Math.sin(an + 0.2) * 1500}Z`} fill={COL.sun} />;
          })}
          <Speaker x={270} y={1000} s={1} pulse={beat} />
          <Speaker x={1650} y={1000} s={1} pulse={beat} />
        </Layer>
        <Person v="r1" t={t} x={960} y={330} h={1250} rot={bang} origin="54% 30%" face={beat > 0.5 ? "Rage" : "SmileTeeth"} />
        <Title t={t} t0={S[3] + 0.05} x={960} y={150} text="ХЭВИ-МЕТАЛ" size={150} rot={-3} shadow={COL.pink} />
        {t > S[4] ? (
          <>
            <Layer>
              <g opacity={pop(t, S[4])}>
                <Record x={1580} y={430} r={150} label={COL.pink} spin={t * 160} />
                <rect x={1440} y={610} width={280} height={70} rx={14} fill={FILL} {...ink} />
                <text x={1580} y={660} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={38} fill={INK}>
                  {`${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} / 42:11`}
                </text>
              </g>
            </Layer>
            <div style={{ position: "absolute", left: 170, top: 250, transform: `rotate(-8deg) scale(${pop(t, S[4] + 0.4)})` }}>
              <div style={{ background: FILL, border: `7px solid ${INK}`, borderRadius: 14, padding: "20px 34px", font: '700 56px "Caveat"', position: "relative" }}>
                одна песня
                <svg width="300" height="120" style={{ position: "absolute", left: 0, top: 0 }}>
                  <path d="M10,10 L290,110 M10,110 L290,10" stroke={COL.red} strokeWidth={12} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </>
        ) : null}
        <ChapterLabel t={t} t0={S[3]} text="III · подросток" />
      </Stage>
    );
  }
  if (t < S[6]) {
    return (
      <Stage bg={COL.lilac} cam={{ s: 1 + (t - S[5]) * 0.02 }}>
        <Layer>
          <Glass x={560} y={300} color={COL.pink} />
          <Glass x={960} y={250} color={COL.yellow} />
          <Glass x={1360} y={300} color={COL.blue} />
          <path d="M930,160 L890,300 L940,300 L910,440 L1010,250 L960,250 L990,160Z" fill={FILL} {...ink} strokeWidth={7} />
          {[300, 640, 1280, 1620].map((x, i) => (
            <Candle key={x} x={x} y={1000} t={t + i} />
          ))}
        </Layer>
        <Person v="r1" t={t} x={960} y={420} h={1150} face="EyesClosed" />
        <Layer>
          <g transform="translate(975,425) scale(1,0.3)">
            <Record x={0} y={0} r={130} label={COL.yellow} spin={t * 60} />
          </g>
        </Layer>
        <Title t={t} t0={S[5] + 0.3} x={1540} y={640} text="почти религиозен" font="hand" size={84} rot={4} />
      </Stage>
    );
  }
  if (t < S[7]) {
    return (
      <Stage bg={COL.lilac} cam={{ s: 1.04 - (t - S[6]) * 0.01 }}>
        <Layer>
          {Array.from({ length: 14 }).map((_, i) => {
            const an = (i / 14) * Math.PI * 2 + t * 0.3;
            return <path key={i} d={`M1100,430 L${1100 + Math.cos(an) * 260},${430 + Math.sin(an) * 260}`} stroke={COL.yellow} strokeWidth={14} strokeLinecap="round" />;
          })}
          <rect x={870} y={640} width={460} height={440} rx={10} fill={COL.pink} {...ink} strokeWidth={10} />
          <Record x={1100} y={430} r={170} label={COL.red} spin={Math.sin(t) * 6} />
          <text x={1100} y={446} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={34} fill={FILL} stroke={INK} strokeWidth={2}>
            AC/DC
          </text>
        </Layer>
        <Person v="r1" t={t} x={420} y={430} h={1150} face="LoveGrin" />
        <div style={{ position: "absolute", left: 1470, top: 250, transform: `rotate(5deg) scale(${pop(t, S[6] + 1.4)})`, background: FILL, border: `8px solid ${INK}`, borderRadius: 16, padding: "18px 30px", font: '400 40px/1.3 "Rubik Mono One"', textAlign: "center" }}>
          СОМНЕНИЙ:
          <br />0
        </div>
        <div style={{ position: "absolute", left: 1500, top: 520, transform: `rotate(-4deg) scale(${pop(t, S[6] + 0.6)})`, background: FILL, border: `8px solid ${INK}`, borderRadius: 16, padding: "18px 30px", font: '400 40px/1.3 "Rubik Mono One"', textAlign: "center" }}>
          ПЛАСТИНОК:
          <br />1
        </div>
      </Stage>
    );
  }
  const u = pop(t, S[7], 160, 12);
  return (
    <Stage bg={COL.lilac} cam={{ s: 1 + (t - S[7]) * 0.02 }}>
      <div style={{ position: "absolute", left: 960, top: 420, transform: `translate(-50%,-50%) scale(${u})`, background: FILL, border: `12px solid ${INK}`, borderRadius: 30, padding: "40px 80px", textAlign: "center" }}>
        <div style={{ font: '400 78px "Rubik Mono One"', color: COL.pink, WebkitTextStroke: `3px ${INK}` }}>МУЗЫКАЛЬНЫЙ</div>
        <div style={{ font: '400 100px "Rubik Mono One"', color: INK }}>МОНОТЕИЗМ</div>
        <div style={{ font: '700 50px "Caveat"', color: INK, marginTop: 10 }}>служба: весь альбом, без перерыва</div>
      </div>
      <Layer>
        <path d="M560,560 L560,1100 M1360,560 L1360,1100" {...ink} strokeWidth={22} />
      </Layer>
      <Person v="r1" t={t} x={1700} y={560} h={900} face="Driven" rot={Math.sin(t * 8.8) * 4} />
    </Stage>
  );
};

/* IV. Нынешний я и три пианиста; подросток в ужасе */
export const C4: React.FC<{ t: number }> = ({ t }) => {
  const a = S[8];
  const peek = ease(ph(t, S[9] - 0.2, S[9] + 0.6));
  const hair = ["Bear", "GrayShort", "Bun"] as const;
  return (
    <Stage bg={COL.blue} cam={{ s: 1.02 + (t - a) * 0.004 }}>
      <Layer>
        <Board x={860} y={430} w={1060} h={520} />
        <text x={860} y={250} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={54} fill={FILL}>
          СОНАТА № 8 × 3
        </text>
      </Layer>
      {[0, 1, 2].map((k) => {
        const u = pop(t, a + 1.6 + k * 1.1);
        if (u <= 0.001) return null;
        const px = 520 + k * 340;
        const nod = Math.sin(t * (5 + k * 1.7)) * 5;
        return (
          <div key={k} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${px}px,540px) scale(${u})`, transformOrigin: "0 0" }}>
            <Person v="su" body="Turtleneck" hair={hair[k]} t={t} seed={20 + k} x={-80} y={-250} h={520} face={(["EyesClosed", "Driven", "Serious"] as const)[k]} rot={nod} />
            <svg width={400} height={260} style={{ position: "absolute", left: -120, top: -40, overflow: "visible" }}>
              <GrandPiano x={170} y={60} s={0.85} />
            </svg>
            <div style={{ position: "absolute", left: -60, top: 150, width: 260, textAlign: "center", font: '700 44px "Caveat"', color: FILL }}>{["пианист I", "пианист II", "пианист III"][k]}</div>
          </div>
        );
      })}
      <Title t={t} t0={a + 5.2} x={860} y={640} text="темп · вес · где вдохнуть" font="hand" size={62} color={COL.yellow} />
      <Person v="now" body={t < S[9] ? "PointingUp" : "PoloSweater"} t={t} x={1600} y={380} h={1250} flip talk={t < SE[8] ? 0 : false} face={t < S[10] ? (t > S[9] ? "Cheeky" : "Smile") : "Suspicious"} />
      {t > S[9] - 0.3 ? (
        <>
          <Person v="r1" t={t} x={-180 + peek * 440} y={420} h={1150} face={t < S[9] + 0.8 ? "Fear" : "ConcernedFear"} rot={-4} />
          <Bubble t={t} t0={S[9] + 0.9} x={560} y={330} text={<>это что, с нами<br />случится?!</>} tail="l" think size={44} />
        </>
      ) : null}
      {t > S[10] ? <Title t={t} t0={S[10] + 0.2} x={1330} y={330} text="?" size={260} color={COL.pink} rot={10} shadow={INK} /> : null}
      <ChapterLabel t={t} t0={a} text="IV · нынешний я" />
    </Stage>
  );
};

