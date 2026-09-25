import React from "react";
import { Bubble, COL, FILL, INK, Layer, Person, S, SE, Stage, Title, ease, ink, lerp, ph, pop } from "./kit";
import { BachBust, Book, Cassette, Gauge, GrandPiano, Magnifier, Notes, Phone, Pie, Record, Speaker, Star, Trash, Waves } from "./props";
import { ChapterLabel } from "./scenesA";

/* Главы V–VIII */

/* V. Слышать больше; тщеславие; внутренний комментатор */
export const C5: React.FC<{ t: number }> = ({ t }) => {
  if (t < S[12]) {
    return (
      <Stage bg={COL.green} cam={{ s: 1.05 + (t - S[11]) * 0.02 }}>
        <Layer>
          <Waves t={t} x={560} y={560} dir={1} n={5} r={300} />
          <Notes t={t} x={420} y={640} n={6} />
        </Layer>
        <Person v="now" t={t} x={1150} y={300} h={1400} face="Calm" />
        <ChapterLabel t={t} t0={S[11]} text="V · слышать больше" />
      </Stage>
    );
  }
  if (t < S[13]) {
    const parts: [string, number, number, string][] = [
      ["исполнитель", -380, -170, COL.yellow],
      ["тема", -30, -270, COL.pink],
      ["гармония", 360, -160, COL.blue],
      ["бас", -360, 150, COL.lilac],
      ["вдох", 330, 170, FILL],
    ];
    const mx = lerp(520, 1250, ease(ph(t, S[12] + 0.5, SE[12])));
    return (
      <Stage bg={COL.green} cam={{ s: 1.02 }}>
        <Layer>
          <g transform="translate(860,480)">
            {parts.map(([name, x, y, c], i) => {
              const u = pop(t, S[12] + 0.3 + i * 0.55);
              return (
                <g key={name} opacity={Math.min(1, u * 2)}>
                  <path d={`M0,0 L${x * u * 0.8},${y * u * 0.8}`} {...ink} strokeWidth={5} strokeDasharray="4 16" />
                  <g transform={`translate(${x * u},${y * u}) scale(${u})`}>
                    <rect x={-150} y={-52} width={300} height={104} rx={24} fill={c} {...ink} />
                    <text y={16} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={56} fill={INK}>
                      {name}
                    </text>
                  </g>
                </g>
              );
            })}
            <circle r={110} fill={FILL} {...ink} strokeWidth={10} />
            <text y={18} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={50} fill={INK}>
              вещь
            </text>
          </g>
          <Magnifier x={mx} y={420 + Math.sin(t * 2) * 30} s={1.1} />
        </Layer>
        <Person v="now" t={t} x={1640} y={560} h={1000} face="Driven" flip />
      </Stage>
    );
  }
  if (t < S[14]) {
    return (
      <Stage bg={COL.green} cam={{ s: 1 + (t - S[13]) * 0.015 }}>
        <Layer>
          <Star x={620} y={300} r={60 + Math.sin(t * 5) * 8} rot={t * 40} />
          <Star x={1320} y={250} r={46} color={COL.pink} rot={-t * 50} />
          <Star x={1420} y={560} r={34} rot={t * 60} />
          <Star x={480} y={620} r={30} color={COL.blue} rot={-t * 30} />
        </Layer>
        <Person v="now" body="Sweater" t={t} x={960} y={340} h={1300} face={t < S[13] + 1.6 ? "Cheeky" : "SmileBig"} />
        <div style={{ position: "absolute", left: 1320, top: 700, transform: `rotate(-7deg) scale(${pop(t, S[13] + 1.8)})`, background: COL.pink, border: `8px solid ${INK}`, borderRadius: 18, padding: "18px 34px", font: '400 48px "Rubik Mono One"', color: FILL }}>
          Я ЗАМЕТИЛ
        </div>
        <Title t={t} t0={S[13] + 0.3} x={520} y={180} text="немного тщеславия" font="hand" size={78} rot={-5} />
      </Stage>
    );
  }
  const quiet = t > SE[14] - 2.4;
  return (
    <Stage bg={COL.green} cam={{ s: 1.04 }}>
      <Person v="now" t={t} x={760} y={320} h={1350} face={quiet ? "EyesClosed" : "Tired"} />
      {/* комментатор на плече: маленький, в наушниках-очках */}
      <div style={{ position: "absolute", left: 1010, top: 555, width: 1, height: 1, transform: `scale(${pop(t, S[14] + 0.2)})`, transformOrigin: "0 300px" }}>
        <Person v="su" body="Explaining" hair="Short" accessory="GlassRound" t={t} seed={40} x={0} y={-60} h={560} flip face={quiet ? "CalmNM" : "Smile"} talk={quiet ? false : 0} rot={quiet ? 14 : Math.sin(t * 6) * 3} />
      </div>
      {!quiet ? (
        <Bubble t={t} t0={S[14] + 0.5} x={1440} y={260} text={<>…а вот здесь пианист<br />чуть придержал тему, и…</>} tail="l" size={42} />
      ) : (
        <>
          <Title t={t} t0={SE[14] - 2.3} x={1300} y={300} text="z z z" font="hand" size={90} rot={-10} />
          <Title t={t} t0={SE[14] - 1.9} x={500} y={200} text="тишина" font="hand" size={90} rot={-4} color={FILL} />
          <Layer>
            <Notes t={t} x={760} y={320} n={5} />
          </Layer>
        </>
      )}
    </Stage>
  );
};

/* VI. Старые песни и плейлисты с возрастом в названии; пауза между частями */
export const C6: React.FC<{ t: number }> = ({ t }) => {
  if (t < S[16]) {
    return (
      <Stage bg={COL.orange} cam={{ s: 1 + (t - S[15]) * 0.02 }}>
        <Layer>
          <rect x={260} y={600} width={1400} height={34} rx={6} fill="#b8875a" {...ink} />
          <Cassette x={560} y={500} label="11–15" color={COL.pink} />
          <Cassette x={960} y={500} label="16–18" color={COL.yellow} />
          <Cassette x={1360} y={500} label="20–21" color={COL.blue} />
          {Array.from({ length: 16 }).map((_, i) => (
            <circle key={i} cx={300 + ((i * 97) % 1320)} cy={140 + ((t * 30 + i * 53) % 380)} r={5 + (i % 3) * 2} fill={FILL} opacity={0.7} />
          ))}
        </Layer>
        <Title t={t} t0={S[15] + 0.2} x={960} y={200} text="старые песни" font="hand" size={110} rot={-3} />
        <ChapterLabel t={t} t0={S[15]} text="VI · старые песни" />
      </Stage>
    );
  }
  const lists: [string, number, "r1" | "r2" | "su"][] = [
    ["11–15", S[16] + 1.1, "r1"],
    ["16–18", S[16] + 1.6, "r2"],
    ["20–21", S[16] + 2.1, "su"],
  ];
  const play = t > SE[16] + 0.6;
  return (
    <Stage bg={COL.orange} cam={{ s: 1 + (t - S[16]) * 0.006 }}>
      <Layer>
        <Phone x={960} y={560} s={1.25}>
          <text x={0} y={-180} textAnchor="middle" fontFamily="Golos Text" fontWeight={600} fontSize={30} fill={INK}>
            Плейлисты
          </text>
          {lists.map(([name, t0], i) => (
            <g key={name} opacity={Math.min(1, pop(t, t0) * 2)} transform={`translate(0,${-110 + i * 90})`}>
              <rect x={-120} y={-32} width={240} height={70} rx={14} fill={[COL.pink, COL.yellow, COL.blue][i]} {...ink} strokeWidth={5} />
              <text x={-60} y={14} fontFamily="Golos Text" fontWeight={600} fontSize={34} fill={INK}>
                {name}
              </text>
              <path d="M-100,-6 L-84,4 L-100,14Z" fill={INK} />
            </g>
          ))}
          {play ? <rect x={-120} y={170} width={240 * ph(t, SE[16] + 0.6, S[17])} height={10} rx={5} fill={COL.pink} /> : null}
        </Phone>
        {play ? <Notes t={t} x={960} y={300} n={6} spread={500} /> : null}
      </Layer>
      {/* во время паузы из плейлистов выглядывают прежние версии */}
      {lists.map(([name, , v], i) => {
        const u = pop(t, SE[16] + 0.9 + i * 0.8);
        if (u <= 0.001) return null;
        const x = [360, 1560, 420][i],
          y = [140, 200, 560][i];
        return (
          <div key={name} style={{ position: "absolute", left: x - 180, top: y, width: 360, height: 400, transform: `rotate(${[-6, 5, 4][i]}deg) scale(${u})` }}>
            <div style={{ position: "absolute", inset: 0, background: FILL, border: `8px solid ${INK}`, borderRadius: 10 }} />
            <div style={{ position: "absolute", left: 22, top: 22, width: 300, height: 290, overflow: "hidden", background: [COL.pink, COL.yellow, COL.blue][i], border: `5px solid ${INK}` }}>
              <Person v={v} t={t} seed={60 + i} x={150} y={-20} h={620} face={(["SmileTeeth", "Cheeky", "Smile"] as const)[i]} rot={Math.sin(t * 4 + i) * 3} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", font: '700 48px "Caveat"', color: INK }}>{name}</div>
          </div>
        );
      })}
      {t > SE[16] + 3.4 ? <Person v="now" t={t} x={1540} y={620} h={900} face="EyesClosed" rot={Math.sin(t * 3) * 4} flip /> : null}
    </Stage>
  );
};

/* трек №7 — кассета с лицом */
const Track: React.FC<{ t: number; x: number; y: number; mood: "guilty" | "cling" | "proud"; rot?: number }> = ({ t, x, y, mood, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <path d={`M-150,60 Q-190,${40 + Math.sin(t * 6) * 10} -210,${70 + Math.sin(t * 6) * 16} M150,60 Q190,${40 - Math.sin(t * 6) * 10} 210,${70 - Math.sin(t * 6) * 16}`} fill="none" {...ink} strokeWidth={10} />
    <path d="M-50,120 L-60,190 M50,120 L60,190" {...ink} strokeWidth={10} />
    <Cassette x={0} y={0} w={320} color={COL.pink} label="трек №7" />
    <circle cx={-50} cy={30} r={12} fill={INK} />
    <circle cx={50} cy={30} r={12} fill={INK} />
    {mood === "guilty" ? <path d="M-30,78 Q0,64 30,78" fill="none" {...ink} strokeWidth={6} /> : null}
    {mood === "cling" ? <ellipse cx={0} cy={78} rx={14} ry={10} fill={INK} /> : null}
    {mood === "proud" ? <path d="M-30,66 Q0,96 30,66Z" fill={FILL} {...ink} strokeWidth={6} /> : null}
  </g>
);

/* VII. Трек, который не дослушал бы, — и не удалить */
export const C7: React.FC<{ t: number }> = ({ t }) => {
  if (t < S[18]) {
    return (
      <Stage bg={COL.lilac} cam={{ s: 1.02 }}>
        <Layer>
          <Track t={t} x={600} y={560} mood="guilty" />
          <g transform={`translate(1060,700) scale(${pop(t, S[17] + 1.5)})`}>
            <rect x={-80} y={-60} width={160} height={120} rx={20} fill={COL.yellow} {...ink} />
            <path d="M-40,-30 L0,0 L-40,30Z M0,-30 L40,0 L0,30Z" fill={INK} />
          </g>
        </Layer>
        <Person v="now" t={t} x={1500} y={380} h={1250} face={t < S[17] + 2 ? "Blank" : "Tired"} flip />
        <Title t={t} t0={S[17] + 2.2} x={1500} y={220} text="зевок" font="hand" size={80} rot={6} />
        <ChapterLabel t={t} t0={S[17]} text="VII · трек №7" />
      </Stage>
    );
  }
  if (t < S[19]) {
    const p = ph(t, S[18], S[18] + 1.2);
    const tx = lerp(600, 1060, ease(p)) + (p >= 1 ? Math.sin(t * 30) * 10 : 0);
    return (
      <Stage bg={COL.lilac}>
        <Layer>
          <Trash x={1400} y={820} s={1.4} />
          <Track t={t} x={tx} y={520} mood="cling" rot={p >= 1 ? -10 : 0} />
          <path d={`M${tx + 220},560 L1260,600`} {...ink} strokeWidth={10} />
        </Layer>
        <Person v="now" t={t} x={320} y={460} h={1100} face="VeryAngry" />
        <Title t={t} t0={S[18] + 1.1} x={1320} y={260} text="НЕ-А" size={140} rot={-8} color={COL.pink} shadow={INK} />
      </Stage>
    );
  }
  if (t < S[20]) {
    return (
      <Stage bg={COL.lilac} cam={{ s: 1 + (t - S[19]) * 0.02 }}>
        <Layer>
          <Track t={t} x={520} y={640} mood="proud" />
          <path d="M700,560 L880,470" {...ink} strokeWidth={10} />
        </Layer>
        <div style={{ position: "absolute", left: 870, top: 150, width: 460, height: 540, transform: `rotate(${6 + Math.sin(t) * 2}deg) scale(${pop(t, S[19] + 0.2)})` }}>
          <div style={{ position: "absolute", inset: 0, background: FILL, border: `9px solid ${INK}`, borderRadius: 8 }} />
          <div style={{ position: "absolute", left: 28, top: 28, width: 386, height: 390, overflow: "hidden", background: COL.yellow, border: `6px solid ${INK}` }}>
            <Person v="r2" t={t} seed={70} x={193} y={-30} h={820} face="SmileBig" />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", font: '700 58px "Caveat"' }}>лето, 16–18</div>
        </div>
        <Person v="now" t={t} x={1620} y={520} h={1000} face="Awe" flip />
        <Title t={t} t0={S[19] + 0.7} x={420} y={250} text="помнишь?" font="hand" size={96} rot={-6} color={INK} />
      </Stage>
    );
  }
  if (t < S[21]) {
    const pw = t < S[20] + 2.6 ? 0.9 : lerp(0.9, 0.15, ease(ph(t, S[20] + 2.6, S[20] + 4.4)));
    return (
      <Stage bg={COL.lilac}>
        <Layer>
          {["…и тогда", "…мы", "…короче"].map((s, i) => (
            <g key={s} transform={`translate(${130 + i * 360},120) scale(${pop(t, S[20] + 0.2 + i * 0.5)})`}>
              <rect width={320} height={320} rx={8} fill={FILL} {...ink} strokeWidth={10} />
              <text x={160} y={180} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={64} fill={INK}>
                {s}
              </text>
            </g>
          ))}
          <Gauge x={1560} y={620} s={1.2} v={pw} />
        </Layer>
        <Person v="now" t={t} x={560} y={500} h={1050} talk={0} face="Explaining" />
      </Stage>
    );
  }
  const blast = ease(ph(t, S[21] + 0.4, S[21] + 1.1));
  const young = blast > 0.5;
  return (
    <Stage t={t} bg={young ? COL.yellow : COL.lilac} shake={blast > 0.3 && blast < 1 ? 4 : 0}>
      <Layer>
        <Speaker x={1640} y={900} s={1.2} pulse={Math.abs(Math.sin(t * 8.8)) * blast} />
        {Array.from({ length: 6 }).map((_, w) => {
          const u = ((t * 1.8 + w / 6) % 1) * blast;
          return blast > 0 ? <path key={w} d={`M${1500 - u * 800},${360 - u * 160} Q${1500 - u * 1000},620 ${1500 - u * 800},${880 + u * 160}`} fill="none" {...ink} strokeWidth={12 * (1 - u) + 3} /> : null;
        })}
      </Layer>
      <Person v={young ? "r2" : "now"} t={t} x={640} y={330} h={1250} face={young ? "SmileTeeth" : "Smile"} rot={-blast * 10 + (young ? Math.sin(t * 8.8) * 5 : 0)} />
      <Title t={t} t0={S[21] + 1.1} x={1100} y={200} text="ТОТ САМЫЙ ПРИПЕВ!" size={96} rot={-6} color={COL.pink} shadow={INK} />
    </Stage>
  );
};

/* лестница «культурного роста» */
const STEPS = 6;
const stepX = (i: number) => 260 + i * 240;
const stepY = (i: number) => 960 - i * 110;
const Stairs: React.FC = () => (
  <>
    {Array.from({ length: STEPS }).map((_, i) => (
      <rect key={i} x={stepX(i) - 120} y={stepY(i)} width={240} height={1200} fill={i % 2 ? COL.yellow : FILL} {...ink} strokeWidth={10} />
    ))}
  </>
);

/* VIII. Образцовая биография */
export const C8: React.FC<{ t: number }> = ({ t }) => {
  if (t < S[23]) {
    const o = ease(ph(t, S[22] + 0.2, S[22] + 1.2));
    return (
      <Stage bg={COL.sky} cam={{ s: 1 + (t - S[22]) * 0.02 }}>
        <Layer>
          <Book x={960} y={560} open={o} />
          {o > 0.8 ? (
            <>
              <text x={740} y={420} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={52} fill={INK}>
                БИОГРАФИЯ
              </text>
              <text x={1180} y={420} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={70} fill={INK}>
                глава 1
              </text>
            </>
          ) : null}
        </Layer>
        <ChapterLabel t={t} t0={S[22]} text="VIII · биография" />
      </Stage>
    );
  }
  const climb = ph(t, S[23] + 0.6, SE[23]);
  const si = Math.min(STEPS - 1, Math.floor(climb * STEPS));
  const fr = climb * STEPS - si;
  const top = t > S[24];
  const gx = top ? stepX(STEPS - 1) : stepX(si) + (si < STEPS - 1 ? fr * 240 : 0);
  const gy = top ? stepY(STEPS - 1) : stepY(si) - Math.sin(fr * Math.PI) * 50 - (si < STEPS - 1 ? fr * 110 : 0);
  const wreath = t > S[25];
  return (
    <Stage bg={COL.sky} cam={{ s: 1 }}>
      <Layer>
        <Stairs />
        <Record x={stepX(0)} y={stepY(0) - 80} r={70} label={COL.blue} />
        <text x={stepX(0)} y={stepY(0) + 70} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={46} fill={INK}>
          Nickelback
        </text>
        <BachBust x={stepX(3)} y={stepY(3) - 140} s={0.9} />
        <text x={stepX(3)} y={stepY(3) + 70} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={50} fill={INK}>
          Бах
        </text>
        <GrandPiano x={stepX(5) + 10} y={stepY(5) - 130} s={0.7} />
        <text x={stepX(5)} y={stepY(5) + 70} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={46} fill={INK}>
          авангард
        </text>
      </Layer>
      <Person v="now" body={top ? "PointingUp" : "PoloSweater"} t={t} x={gx} y={gy - 330} h={620} face={wreath ? "SmileBig" : top ? "Explaining" : "Driven"} talk={top && !wreath && t < SE[24] ? 0 : false} />
      {wreath ? (
        <Layer>
          <g transform={`translate(${gx + 10},${gy - 250}) scale(${pop(t, S[25] + 0.2)})`}>
            {Array.from({ length: 9 }).map((_, q) => {
              const an = Math.PI + (q / 8) * Math.PI;
              return <ellipse key={q} cx={Math.cos(an) * 90} cy={Math.sin(an) * 34} rx={26} ry={12} fill={COL.green} {...ink} strokeWidth={5} transform={`rotate(${(an * 180) / Math.PI + 90} ${Math.cos(an) * 90} ${Math.sin(an) * 34})`} />;
            })}
          </g>
        </Layer>
      ) : null}
      {top ? (
        <>
          <Layer>
            <Pie x={560} y={330} r={190} u={0.57 * ease(ph(t, S[24] + 0.8, S[24] + 3.4))} />
          </Layer>
          <Title t={t} t0={S[24] + 1.2} x={560} y={600} text="академическая > ½" font="hand" size={64} />
        </>
      ) : null}
      {wreath ? (
        <div style={{ position: "absolute", left: 1180, top: 700, transform: `translate(-50%,-50%) rotate(-14deg) scale(${pop(t, S[25] + 0.8, 260, 14)})`, border: `12px solid ${COL.red}`, borderRadius: 24, padding: "10px 40px", font: '400 76px "Rubik Mono One"', color: COL.red, background: "rgba(255,250,240,.7)" }}>
          ОБРАЗЦОВО
        </div>
      ) : null}
    </Stage>
  );
};
