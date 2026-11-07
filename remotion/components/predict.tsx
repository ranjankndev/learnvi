/** Next-token prediction scenes: candidate bars, picking a token, and the temperature dial. */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F, Heading, enter, progress, useTimes } from "../ui";
import type { SegProps } from "../types";

type Opt = { token: string; p: number };
type Step = { options: Opt[]; pick: number; at?: string };

const show = (t: string) => t.replace(/ /g, "·");

const Bars: React.FC<{ options: Opt[]; start: number; pick?: number; pickAt?: number; top: number; maxP?: number }> = ({ options, start, pick, pickAt, top, maxP }) => {
  const frame = useCurrentFrame();
  const m = maxP ?? Math.max(...options.map((o) => o.p), 0.01);
  return (
    <div style={{ position: "absolute", left: 200, top, width: 1520 }}>
      {options.map((o, i) => {
        const chosen = pick === i && pickAt !== undefined && frame >= pickAt;
        const col = chosen ? C.sun : C.sky;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", height: 74, ...enter(frame, start + i * 4, 12, 20) }}>
            <div style={{ width: 340, textAlign: "right", paddingRight: 24, fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: chosen ? C.sun : C.text, whiteSpace: "nowrap" }}>{show(o.token)}</div>
            <div style={{ height: 46, borderRadius: 10, background: col, opacity: chosen ? 1 : 0.75, width: Math.max(6, (o.p / m) * 900 * progress(frame, start + 8 + i * 4, 18)) }} />
            <div style={{ marginLeft: 20, fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: col }}>{Math.round(o.p * 100)}%</div>
            {chosen && <div style={{ marginLeft: 24, fontFamily: F.body, fontWeight: 700, fontSize: 30, color: C.night, background: C.sun, borderRadius: 10, padding: "4px 14px", ...enter(frame, pickAt!, 10, 10) }}>picked</div>}
          </div>
        );
      })}
    </div>
  );
};

/** The answer grows token by token; each step shows the candidates and which one was picked. */
export const NextToken: React.FC<SegProps> = ({ kicker, title, prompt, steps = [] }) => {
  const frame = useCurrentFrame();
  const list = steps as Step[];
  const ats = useTimes(list.map((s) => s.at));
  let cur = -1;
  ats.forEach((a, i) => { if (a !== undefined && frame >= a) cur = i; });
  const pickAt = (i: number) => (ats[i] ?? 0) + 40;
  const done = list.map((s, i) => (frame >= pickAt(i) + 12 ? s.options[s.pick]?.token ?? "" : ""));
  const s = list[cur];
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 200, top: 290, width: 1520, padding: "22px 30px", borderRadius: 18, background: C.night2, border: `2px solid ${C.line}`, fontFamily: F.mono, fontSize: 38, lineHeight: 1.4, ...enter(frame, 6) }}>
        <span style={{ color: C.mute }}>{prompt}</span>
        <span style={{ color: C.line }}>{"  ⏎  "}</span>
        {done.map((t, i) => <span key={i} style={{ color: i === cur ? C.sun : C.text, whiteSpace: "pre" }}>{t}</span>)}
        <span style={{ display: "inline-block", width: 18, height: 40, marginLeft: 4, verticalAlign: "middle", background: C.teal, opacity: Math.floor(frame / 15) % 2 ? 0.2 : 1 }} />
      </div>
      {s && (
        <div key={cur}>
          <div style={{ position: "absolute", left: 200, top: 440, fontFamily: F.mono, fontSize: 24, letterSpacing: 4, color: C.mute, ...enter(frame, ats[cur]!, 10) }}>CANDIDATES FOR THE NEXT TOKEN</div>
          <Bars options={s.options} start={ats[cur]! + 4} pick={s.pick} pickAt={pickAt(cur)} top={490} />
        </div>
      )}
    </>
  );
};

/** Same candidates, reshaped by temperature: p^(1/T), renormalised. */
export const Temperature: React.FC<SegProps> = ({ kicker, title, context, options = [], settings = [] }) => {
  const frame = useCurrentFrame();
  const opts = options as Opt[];
  const sets = settings as { t: number; label: string; at?: string }[];
  const ats = useTimes(sets.map((x) => x.at));
  // temperature eases from one setting to the next
  let T = sets[0]?.t ?? 1, label = sets[0]?.label ?? "";
  sets.forEach((x, i) => {
    const a = ats[i];
    if (a === undefined || frame < a) return;
    const prev = i > 0 ? sets[i - 1].t : x.t;
    T = interpolate(frame, [a, a + 30], [prev, x.t], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    label = x.label;
  });
  const w = opts.map((o) => Math.pow(o.p, 1 / T));
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  const shaped = opts.map((o, i) => ({ token: o.token, p: w[i] / sum }));
  const dial = Math.min(1, T / 2);
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 200, top: 290, fontFamily: F.mono, fontSize: 38, color: C.text, ...enter(frame, 6) }}>
        <span style={{ color: C.mute }}>{context}</span><span style={{ color: C.sun }}> ___</span>
      </div>
      <div style={{ position: "absolute", right: 200, top: 270, width: 420, ...enter(frame, 10) }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 4, color: C.mute }}>TEMPERATURE</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 64, color: C.sun }}>{T.toFixed(1)}</div>
          <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 32, color: C.text }}>{label}</div>
        </div>
        <div style={{ position: "relative", height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${C.teal}, ${C.sun}, ${C.stamp})` }}>
          <div style={{ position: "absolute", top: -9, left: `calc(${dial * 100}% - 16px)`, width: 32, height: 32, borderRadius: 16, background: C.text, border: `4px solid ${C.night}` }} />
        </div>
      </div>
      <Bars options={shaped} start={14} top={430} maxP={0.7} />
    </>
  );
};
