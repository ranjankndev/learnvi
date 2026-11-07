/** Components that frame every episode as a stop on the journey. */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F, Kicker, Paper, Stamp, enter, progress, rand, useMark, usePop, useSeg } from "../ui";
import type { SegProps } from "../types";

/** Opening: "Next stop: …!" and the passport stamp slamming down on the word "Stamped". */
export const PassportStamp: React.FC<SegProps> = ({ stop, stamp, number, stampAt }) => {
  const frame = useCurrentFrame();
  const { tl } = useSeg();
  const at = useMark(stampAt);
  const p = usePop(at, 9);
  const shake = at !== undefined && frame >= at && frame < at + 8 ? (rand(frame) - 0.5) * 14 : 0;
  const n = Number(number);
  const visited = tl.series.stops.filter((s) => s.number < n);
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 300 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.mute, ...enter(frame, 4) }}>Next stop:</div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: Math.min(150, Math.floor(950 / ((String(stop).length + 1) * 0.56))), color: C.sun, letterSpacing: -4, lineHeight: 1, whiteSpace: "nowrap", ...enter(frame, 12, 18, 60) }}>{stop}!</div>
        <div style={{ fontFamily: F.body, fontSize: 38, color: C.text, marginTop: 30, maxWidth: 720, ...enter(frame, 26) }}>
          Stop {n} of {tl.series.stops.length} · following one prompt from your keyboard to an answer
        </div>
      </div>
      <div style={{ position: "absolute", right: 130, top: 200, transform: `rotate(4deg) translateX(${shake}px)`, ...enter(frame, 8, 20, 80) }}>
        <Paper style={{ width: 640, height: 640, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 20, letterSpacing: 4, color: C.inkSoft }}>
            <span>PASSPORT</span><span>PROMPT · TRAVELLER</span>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 24, color: C.inkSoft, marginTop: 18 }}>Carrying</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, color: C.ink }}>“{tl.series.runningPrompt}”</div>
          <div style={{ borderTop: `2px dashed ${C.paperEdge}`, margin: "24px 0" }} />
          <div style={{ display: "flex", gap: visited.length > 4 ? 8 : 14, flexWrap: "wrap" }}>
            {visited.map((s, i) => (
              <div key={s.id} style={{ opacity: 0.55 }}><Stamp title={s.name.toUpperCase()} sub={`STOP ${String(s.number).padStart(2, "0")}`} size={visited.length > 4 ? 0.42 : 0.55} rotate={i % 2 ? 8 : -6} color={i % 2 ? "#2d6f8c" : "#7a4fa0"} /></div>
            ))}
          </div>
          {at !== undefined && frame >= at - 1 && (
            <div style={{ position: "absolute", left: 150, bottom: visited.length > 4 ? 30 : 70 }}>
              <Stamp title={stamp} sub={`STOP ${String(n).padStart(2, "0")}`} p={p} size={String(stamp).length > 11 ? 0.95 : 1.25} />
            </div>
          )}
        </Paper>
      </div>
    </>
  );
};

/** Hook: the word the model never sees, and the number it sees instead. */
export const TitleHook: React.FC<SegProps> = ({ title, word, id, revealAt }) => {
  const frame = useCurrentFrame();
  const { tl } = useSeg();
  const at = useMark(revealAt);
  const r = progress(frame, at, 20);
  const pop = usePop(at === undefined ? undefined : at + 6);
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 96, ...enter(frame, 0) }}>
        <Kicker>Episode {tl.stop.number}</Kicker>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.text, marginTop: 10, maxWidth: 1500 }}>{title}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", alignItems: "center", justifyContent: "center", gap: 70 }}>
        <div style={{ textAlign: "center", transform: `scale(${1 - r * 0.35})`, opacity: 1 - r * 0.35, ...enter(frame, 10, 20) }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 230, color: C.sky, lineHeight: 1 }}>“{word}”</div>
          <div style={{ fontFamily: F.mono, fontSize: 30, color: C.mute, marginTop: 10, letterSpacing: 3 }}>WHAT YOU TYPE</div>
        </div>
        <div style={{ fontFamily: F.display, fontSize: 120, color: C.mute, opacity: r }}>→</div>
        <div style={{ textAlign: "center", opacity: r, transform: `scale(${0.6 + 0.4 * pop})`, width: r ? undefined : 0 }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 200, color: C.sun, lineHeight: 1 }}>{id}</div>
          <div style={{ fontFamily: F.mono, fontSize: 30, color: C.mute, marginTop: 10, letterSpacing: 3 }}>WHAT THE MODEL SEES</div>
        </div>
      </div>
    </>
  );
};

/** The route map: all stops, the path so far, and the traveller arriving at this stop. */
export const RouteMap: React.FC<SegProps> = ({ current, highlightAt }) => {
  const frame = useCurrentFrame();
  const { tl } = useSeg();
  const stops = tl.series.stops;
  const cur = stops.findIndex((s) => s.id === current);
  const at = useMark(highlightAt) ?? 60;
  const pts = stops.map((_, i) => ({ x: 200 + (i * 1520) / (stops.length - 1), y: i % 2 ? 640 : 470 }));
  const d = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `C${pts[i - 1].x + 120},${pts[i - 1].y} ${p.x - 120},${p.y} ${p.x},${p.y}`)).join(" ");
  const draw = progress(frame, 0, 45);
  // traveller moves from the previous stop to this one, arriving on the "here" mark
  const tp = interpolate(frame, [Math.max(0, at - 50), at], [Math.max(0, cur - 1), cur], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const i0 = Math.floor(tp), f = tp - i0, a = pts[i0], b = pts[Math.min(i0 + 1, pts.length - 1)];
  const tx = a.x + (b.x - a.x) * f, ty = a.y + (b.y - a.y) * f;
  const pulse = frame >= at ? 1 + 0.25 * Math.abs(Math.sin((frame - at) / 8)) : 1;
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 96, ...enter(frame, 0) }}>
        <Kicker>Route map</Kicker>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.text, marginTop: 10 }}>{tl.series.title}</div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke={C.line} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" pathLength={1} strokeDashoffset={0} opacity={draw} />
        <path d={d} fill="none" stroke={C.teal} strokeWidth={8} strokeLinecap="round" pathLength={1}
          strokeDasharray={`${(tp / (stops.length - 1)) * draw} 1`} />
        {pts.map((p, i) => {
          const done = i < cur, here = i === cur;
          const r = here ? 34 * pulse : 26;
          return (
            <g key={i} opacity={progress(frame, 8 + i * 4, 12)}>
              <circle cx={p.x} cy={p.y} r={r} fill={done ? C.teal : here ? C.sun : C.night2} stroke={here ? C.sun : done ? C.teal : C.line} strokeWidth={5} />
              <text x={p.x} y={p.y + 11} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={30} fill={done || here ? C.night : C.mute}>{done ? "✓" : i + 1}</text>
              <text x={p.x} y={i % 2 ? p.y + 86 : p.y - 64} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={32} fill={here ? C.sun : done ? C.text : C.mute}>{stops[i].name}</text>
              <text x={p.x} y={i % 2 ? p.y + 122 : p.y - 100} textAnchor="middle" fontFamily={F.body} fontSize={24} fill={C.mute}>{stops[i].topic}</text>
            </g>
          );
        })}
        {/* the traveller: our prompt, as a little ticket */}
        <g transform={`translate(${tx - 46}, ${Math.round(tp) % 2 ? ty - 112 : ty + 54})`}>
          <rect width={92} height={58} rx={10} fill={C.paper} stroke={C.stamp} strokeWidth={4} />
          <text x={46} y={38} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={22} fill={C.ink}>“…”</text>
          {Math.round(tp) % 2 ? <path d="M40 58 L46 72 L52 58" fill={C.paper} stroke={C.stamp} strokeWidth={4} /> : <path d="M40 0 L46 -14 L52 0" fill={C.paper} stroke={C.stamp} strokeWidth={4} />}
        </g>
      </svg>
    </>
  );
};

/** Ending: passport with this stop stamped, then the departure board for the next stop. */
export const RecapNext: React.FC<SegProps> = ({ nextStop, nextQuestion, questionAt }) => {
  const frame = useCurrentFrame();
  const { tl } = useSeg();
  const at = useMark(questionAt);
  const stamped = tl.series.stops.filter((s) => s.number <= tl.stop.number);
  const p = usePop(12, 9);
  const show = progress(frame, at === undefined ? undefined : at - 50, 18);
  const board = String(nextStop ?? "").toUpperCase();
  const flipEnd = (at ?? 0) - 50 + 30;
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 96, ...enter(frame, 0) }}>
        <Kicker>Passport stamped</Kicker>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.text, marginTop: 10 }}>{tl.stop.number} of {tl.series.stops.length} stops done</div>
      </div>
      <div style={{ position: "absolute", left: 110, top: 300, transform: "rotate(-3deg)", ...enter(frame, 4, 18, 60) }}>
        <Paper style={{ width: 700, minHeight: 420, display: "flex", flexWrap: "wrap", gap: 18, alignContent: "flex-start" }}>
          {stamped.map((s, i) => (
            <div key={s.id} style={{ opacity: s.number === tl.stop.number ? 1 : 0.6 }}>
              <Stamp title={s.name.toUpperCase()} sub={`STOP ${String(s.number).padStart(2, "0")}`} size={stamped.length > 5 ? 0.56 : 0.7} p={s.number === tl.stop.number ? p : 1} rotate={[-8, 6, -4, 9, -10, 5, -6][i % 7]} color={s.number === tl.stop.number ? C.stamp : ["#2d6f8c", "#7a4fa0"][i % 2]} />
            </div>
          ))}
        </Paper>
      </div>
      <div style={{ position: "absolute", right: 110, top: 300, width: 860, opacity: show, transform: `translateX(${(1 - show) * 80}px)` }}>
        <div style={{ background: "#0a121b", border: `3px solid ${C.line}`, borderRadius: 18, padding: 36 }}>
          <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: 6, color: C.sun }}>NEXT DEPARTURE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 30px", marginTop: 18 }}>
            {board.split(" ").map((word, wi, all) => {
              const offset = all.slice(0, wi).join(" ").length + (wi ? 1 : 0);
              return (
                <div key={wi} style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}>
                  {word.split("").map((ch, ci) => {
                    const i = offset + ci;
                    const glyph = frame >= flipEnd + i * 2 ? ch : String.fromCharCode(65 + Math.floor(rand(i * 31 + Math.floor(frame / 2)) * 26));
                    return <span key={ci} style={{ width: 58, height: 84, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#1b2633", borderRadius: 8, fontFamily: F.mono, fontWeight: 700, fontSize: 54, color: C.text }}>{glyph}</span>;
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.text, marginTop: 30, lineHeight: 1.2, ...enter(frame, at) }}>{nextQuestion}</div>
        </div>
      </div>
    </>
  );
};
