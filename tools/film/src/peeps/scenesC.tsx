import React from "react";
import { Bubble, COL, FILL, INK, Layer, Person, S, SE, Stage, Title, VK, ease, hash, ink, lerp, ph, pop } from "./kit";
import { Couch, Door, Gremlin, Knob, Machine, Notes, Phone, Record, Speaker, Spring, Stamp, Turntable } from "./props";
import { ChapterLabel } from "./scenesA";

/* Главы IX–XI */

/* IX. Её портят: A$AP Rocky до дыр, трек из TikTok, вещи вне схемы */
export const C9: React.FC<{ t: number }> = ({ t }) => {
  const a = S[26];
  const roll = ease(ph(t, a + 0.3, a + 2.2));
  const rx = lerp(-200, 560, roll);
  const shocked = t > a + 1.5;
  const good = t > S[29];
  return (
    <Stage bg={COL.rose} cam={{ s: 1 + (t - a) * 0.003 }}>
      <Layer>
        <circle cx={1500} cy={220} r={300} fill="#f5a3b8" />
      </Layer>
      <Layer>
        {t > S[28]
          ? Array.from({ length: 7 }).map((_, i) => {
              const t0 = S[28] + 0.2 + i * 0.35;
              if (t < t0) return null;
              const u = (t - t0) * 0.18;
              const x = ((hash(i) * 1700 + u * 900 * (i % 2 ? 1 : -1)) % 2100 + 2100) % 2100 - 90;
              return <Gremlin key={i} x={x} y={880 - (i % 3) * 120 + Math.sin(t * 6 + i) * 14} s={0.9 * pop(t, t0)} t={t + i} color={[COL.yellow, COL.blue, COL.green, COL.lilac][i % 4]} />;
            })
          : null}
      </Layer>
      <Person v="now" t={t} x={1480} y={380} h={1250} flip face={good ? "SmileBig" : t > S[28] ? "Cheeky" : shocked ? "Awe" : "SmileBig"} />
      {/* венок съезжает набок */}
      <Layer>
        <g transform={`translate(1470,${500 + (shocked ? 24 : 0)}) rotate(${shocked ? -18 : 0})`}>
          {Array.from({ length: 9 }).map((_, q) => {
            const an = Math.PI + (q / 8) * Math.PI;
            return <ellipse key={q} cx={Math.cos(an) * 150} cy={Math.sin(an) * 56} rx={42} ry={20} fill={COL.green} {...ink} strokeWidth={6} />;
          })}
        </g>
        <Record x={rx} y={720} r={170} label={COL.pink} spin={roll * 720} holes />
        <text x={rx} y={730} textAnchor="middle" fontFamily="Rubik Mono One" fontSize={34} fill={FILL} stroke={INK} strokeWidth={2}>
          A$AP
        </text>
      </Layer>
      <Title t={t} t0={a + 2.5} x={560} y={480} text="до дыр" font="hand" size={100} rot={-6} color={INK} />
      {/* телефон на пружине поёт */}
      {t > S[27] ? (
        <>
          <Layer>
            {(() => {
              const j = pop(t, S[27], 190, 9);
              const top = 1180 - j * 480 - Math.abs(Math.sin((t - S[27]) * 6)) * 30;
              return (
                <>
                  <Spring x={1000} y1={top + 200} y2={1200} />
                  <Phone x={1000} y={top} s={0.7} screen={COL.blue}>
                    <text y={30} textAnchor="middle" fontSize={120} fill={COL.pink} stroke={INK} strokeWidth={4}>
                      ♪
                    </text>
                  </Phone>
                </>
              );
            })()}
          </Layer>
          <Bubble t={t} t0={S[27] + 0.3} t1={S[28] + 1} x={760} y={200} text="возьми телефоон деткаа ♪" tail="r" rot={-4 + Math.sin(t * 9) * 2} bg={COL.yellow} size={52} />
        </>
      ) : null}
      {t > S[28] + 1.8 && !good ? <Title t={t} t0={S[28] + 1.8} x={660} y={220} text="НЕ ПО СХЕМЕ" size={100} rot={-4} color={COL.pink} shadow={INK} /> : null}
      {good ? <Title t={t} t0={S[29]} x={700} y={260} text="И ХОРОШО." size={140} rot={-4} shadow={COL.yellow} /> : null}
      <ChapterLabel t={t} t0={a} text="IX · не по схеме" />
    </Stage>
  );
};

/* X. Обмен вкуса не работает; ошибкой не объявлять; навещать прежнего себя */
export const C10: React.FC<{ t: number }> = ({ t }) => {
  if (t < S[31]) {
    const shake = t > S[30] + 1.8 ? Math.sin(t * 50) * 8 : 0;
    return (
      <Stage bg={COL.mint} cam={{ s: 1.02 }}>
        <Layer>
          <Machine x={1180} y={540} shake={shake} />
          {t > S[30] + 2
            ? Array.from({ length: 6 }).map((_, q) => {
                const u = (t * 0.7 + q / 6) % 1;
                return <circle key={q} cx={1120 + q * 24 + Math.sin(t + q) * 20} cy={170 - u * 200} r={20 + u * 30} fill="#8a8a8a" opacity={(1 - u) * 0.5} />;
              })
            : null}
        </Layer>
        {t > S[30] + 2.2 ? (
          <div style={{ position: "absolute", left: 1180, top: 700, transform: `translate(-50%,-50%) rotate(-8deg) scale(${pop(t, S[30] + 2.2)})`, background: COL.yellow, border: `8px solid ${INK}`, borderRadius: 14, padding: "16px 30px", font: '400 48px "Rubik Mono One"' }}>НЕ РАБОТАЕТ</div>
        ) : null}
        <Person v="r1" t={t} x={420} y={420} h={1150} face={t > S[30] + 2.2 ? "SmileTeeth" : "Suspicious"} />
        <ChapterLabel t={t} t0={S[30]} text="X · без ошибки" />
      </Stage>
    );
  }
  if (t < S[32]) {
    const order: VK[] = ["r1", "r2", "su", "sp", "now"];
    const sd = ease(ph(t, S[31] + 0.3, S[31] + 1.3));
    const fly = ease(ph(t, S[31] + 1.6, S[31] + 2.4));
    return (
      <Stage bg={COL.mint}>
        {order.map((v, k) => (
          <Person key={v} v={v} t={t} seed={80 + k} x={250 + k * 355} y={560} h={900} flip={k > 2} face={k === 0 ? (fly > 0 ? "SmileBig" : "ConcernedFear") : k === 4 ? "Smile" : "Cute"} rot={Math.sin(t * 2 + k) * 2} />
        ))}
        <Layer>
          <Stamp x={lerp(250, 1500, fly)} y={lerp(-160, 400, sd) - fly * 700} rot={-10 + fly * 200} text="ОШИБКА" />
        </Layer>
        <Title t={t} t0={S[31] + 2.2} x={1300} y={250} text="БЫЛО" size={120} rot={-8} color={COL.blue} shadow={INK} />
        <Title t={t} t0={S[31] + 2.7} x={1300} y={380} text="не ошибка" font="hand" size={80} rot={-6} />
      </Stage>
    );
  }
  const open = ease(ph(t, S[32] + 2.2, S[32] + 3));
  const walk = ease(ph(t, S[32], S[32] + 1.8));
  return (
    <Stage bg={COL.mint}>
      <Layer>
        <rect x={0} y={900} width={1920} height={200} fill="#a4d4b4" {...ink} strokeWidth={10} />
      </Layer>
      <Layer>
        <rect x={1100} y={350} width={300} height={560} fill={INK} />
      </Layer>
      {open > 0.05 ? (
        <div style={{ position: "absolute", left: 1100, top: 350, width: 300, height: 560, overflow: "hidden" }}>
          <Person v="r1" t={t} x={150 + (1 - open) * 120} y={60} h={920} face={t < S[32] + 3.6 ? "Awe" : "Smile"} flip />
        </div>
      ) : null}
      <Layer>
        <Door x={1110} y={360} open={open} color={COL.pink} label="11–15" sub="не входить!!!" frame={false} />
      </Layer>
      <Person v="now" body="Coffee" t={t} x={lerp(-200, 720, walk)} y={400 + (walk < 1 ? -Math.abs(Math.sin(t * 9)) * 16 : 0)} h={1150} face="Smile" />
      <div style={{ position: "absolute", left: lerp(-200, 720, walk) + 20, top: 780, transform: "rotate(8deg)", background: FILL, border: `6px solid ${INK}`, borderRadius: 10, padding: "6px 18px", font: '400 30px "Rubik Mono One"' }}>ГОСТЬ</div>
      <Title t={t} t0={S[32] + 3.3} x={560} y={200} text="без обязательства остаться" font="hand" size={70} rot={-3} />
    </Stage>
  );
};

/* XI. Финал: перестаём спорить, старый альбом, припев, погромче */
export const C11: React.FC<{ t: number }> = ({ t }) => {
  const party = t > SE[37] + 0.2;
  if (!party) {
    const argue = t < S[33] + 2;
    const needle = t > S[34] + 0.6;
    const blast = ease(ph(t, S[36] + 0.2, S[36] + 0.9));
    const bang = blast > 0 ? Math.sin(t * 8.8) * 10 : 0;
    const bw = lerp(160, 640, ease(ph(t, S[35], S[35] + 2.4)));
    return (
      <Stage t={t} bg={COL.yellow} shake={blast > 0.2 && blast < 1 ? 3 : 0}>
        <Layer>
          <Turntable x={1600} y={880} s={0.8} spin={needle ? t * 200 : 0} arm={needle ? 30 : -4} />
          <rect x={1320} y={880} width={560} height={260} fill={COL.orange} {...ink} strokeWidth={10} />
        </Layer>
        <Layer>
          {blast > 0
            ? Array.from({ length: 6 }).map((_, w) => {
                const u = ((t * 2 + w / 6) % 1) * blast;
                return <path key={w} d={`M${1480 - u * 1000},${520 - u * 200} Q${1480 - u * 1200},760 ${1480 - u * 1000},${1000 + u * 120}`} fill="none" {...ink} strokeWidth={12 * (1 - u) + 3} />;
              })
            : null}
        </Layer>
        <Person v="r1" t={t} x={560} y={380} h={1000} face={argue ? "Rage" : blast > 0 ? "SmileTeeth" : "SmileBig"} talk={argue ? 1 : false} rot={bang} />
        <Person v="now" t={t} x={1040} y={380} h={1000} flip face={blast > 0.5 ? "SmileTeeth" : t > S[35] ? "Explaining" : argue ? "Angry" : "Smile"} talk={argue ? 1 : t > S[35] && t < S[36] + 0.3 ? 0 : false} rot={-bang} />
        <Layer>
          <Couch x={800} y={960} color={COL.blue} />
          {needle ? <Notes t={t} x={1560} y={700} n={5} on={1 - blast * 0.3} /> : null}
        </Layer>
        {argue ? (
          <>
            <Bubble t={t} t0={S[33] + 0.1} x={420} y={200} text="МОЁ!" tail="l" size={52} />
            <Bubble t={t} t0={S[33] + 0.5} x={1180} y={180} text="НЕТ, МОЁ!" tail="r" size={52} />
          </>
        ) : t < S[34] ? (
          <Title t={t} t0={S[33] + 2.1} x={800} y={230} text="мир" font="hand" size={130} rot={-4} />
        ) : null}
        {t > S[34] && t < S[35] ? <Title t={t} t0={S[34] + 0.6} x={1580} y={560} text="клац" font="hand" size={80} rot={8} color={COL.pink} /> : null}
        {t > S[35] ? (
          <div style={{ position: "absolute", left: 1180 + blast * 900, top: 230 - blast * 300, transform: `translate(-50%,-50%) rotate(${blast * 50}deg) scale(${pop(t, S[35])})` }}>
            <div style={{ width: bw, height: 220, background: FILL, border: `8px solid ${INK}`, borderRadius: 60, display: "flex", alignItems: "center", justifyContent: "space-around", font: '700 52px "Caveat"', overflow: "hidden", whiteSpace: "nowrap" }}>
              {["Бах", "3 пианиста", "авангард", "графики"].map((w, i) => (t > S[35] + 0.4 + i * 0.55 ? <span key={w} style={{ color: [COL.pink, INK, COL.blue, INK][i] }}>{w}</span> : null))}
            </div>
          </div>
        ) : null}
        {blast > 0 ? <Title t={t} t0={S[36] + 0.2} x={760} y={170} text="ПРИПЕВ" size={150} rot={-6} color={COL.pink} shadow={INK} /> : null}
        {t > S[37] ? (
          <Layer>
            <g transform={`scale(${pop(t, S[37])})`} style={{ transformOrigin: "1580px 330px" }}>
              <Knob x={1580} y={330} s={0.9} v={lerp(3, 11, ease(ph(t, S[37] + 0.7, SE[37] + 0.1)))} />
            </g>
          </Layer>
        ) : null}
        <ChapterLabel t={t} t0={S[33]} text="XI · погромче" />
      </Stage>
    );
  }
  const pt = t - SE[37];
  const order: VK[] = ["r1", "r2", "su", "sp", "now"];
  const tt = ph(t, SE[37] + 4.5, SE[37] + 5.3);
  return (
    <Stage bg={COL.yellow} cam={{ s: 1.02 + Math.abs(Math.sin(t * 8.8)) * 0.01 }}>
      <Layer>
        {Array.from({ length: 16 }).map((_, i) => {
          const an = (i / 16) * Math.PI * 2 + t * 0.35;
          return <path key={i} d={`M960,700 L${960 + Math.cos(an) * 1600},${700 + Math.sin(an) * 1600} L${960 + Math.cos(an + 0.2) * 1600},${700 + Math.sin(an + 0.2) * 1600}Z`} fill={COL.sun} />;
        })}
        <Speaker x={150} y={1080} s={0.9} pulse={Math.abs(Math.sin(t * 8.8))} />
        <Speaker x={1770} y={1080} s={0.9} pulse={Math.abs(Math.sin(t * 8.8 + 1))} />
      </Layer>
      <Layer>
        {Array.from({ length: 18 }).map((_, q) => {
          const cx = hash(q) * 1900;
          const cy = ((pt * 260 * (0.6 + hash(q + 4)) + hash(q + 8) * 1100) % 1250) - 120;
          return <Record key={q} x={cx} y={cy} r={26 + hash(q + 2) * 26} label={[COL.pink, COL.blue, COL.green, COL.lilac][q % 4]} spin={pt * 200 * (q % 2 ? 1 : -1)} />;
        })}
      </Layer>
      {order.map((v, k) => (
        <Person key={v} v={v} t={t} seed={90 + k} x={400 + k * 280} y={560 - Math.abs(Math.sin(t * 8.8 + k)) * 20} h={860} flip={k > 2} face={k % 2 ? "SmileTeeth" : "Rage"} rot={Math.sin(t * 8.8 + k * 0.4) * 9} />
      ))}
      {tt > 0 ? (
        <div style={{ position: "absolute", left: 960, top: 300, transform: `translate(-50%,-50%) scale(${pop(t, SE[37] + 4.5, 180, 12)})`, background: FILL, border: `12px solid ${INK}`, borderRadius: 34, padding: "30px 80px", textAlign: "center" }}>
          <div style={{ font: '400 110px "Rubik Mono One"', color: COL.pink, WebkitTextStroke: `3px ${INK}` }}>ОДНА ВЕЩЬ</div>
          <div style={{ font: '700 60px "Caveat"', color: INK }}>моя музыкальная эволюция</div>
        </div>
      ) : null}
    </Stage>
  );
};
