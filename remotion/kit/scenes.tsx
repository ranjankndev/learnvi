/**
 * General-purpose scenes. All content comes from props (see specs.ts); timing comes from
 * `at` marks or, when left out, from the segment's paragraphs (useTimes).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, Chip, F, Heading, Kicker, Paper, enter, progress, useMark, usePop, useRefs, useSeg, useTimes } from "../ui";
import type { KitProps } from "./specs";

const TONE = { good: C.good, bad: C.bad, neutral: C.sky } as const;
const ACCENTS = [C.teal, C.sun, C.sky, C.stamp, "#b58df0", C.good];
/** visible once its frame is reached; dimmed-but-present before, so layouts never jump */
const reveal = (frame: number, at: number, dim = 0.12) => ({ opacity: dim + (1 - dim) * progress(frame, at, 14), transform: `translateY(${(1 - progress(frame, at, 14)) * 24}px)` });

export const TitleCard: React.FC<KitProps<"TitleCard">> = ({ kicker, title, subtitle }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 160, right: 160, top: 0, bottom: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {kicker && <div style={enter(frame, 0)}><Kicker>{kicker}</Kicker></div>}
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 120, lineHeight: 1.02, letterSpacing: -3, color: C.text, marginTop: 20, ...enter(frame, 6, 20, 50) }}>{title}</div>
      <div style={{ width: 160, height: 10, borderRadius: 5, background: C.sun, margin: "36px 0", transform: `scaleX(${progress(frame, 16, 20)})`, transformOrigin: "left" }} />
      {subtitle && <div style={{ fontFamily: F.body, fontSize: 46, color: C.mute, maxWidth: 1300, ...enter(frame, 22) }}>{subtitle}</div>}
    </div>
  );
};

export const BigIdea: React.FC<KitProps<"BigIdea">> = ({ kicker, text, highlight = [] }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/);
  const isHl = (w: string) => highlight.some((h) => h.toLowerCase().split(/\s+/).includes(w.toLowerCase().replace(/[^\w'-]/g, "")));
  return (
    <div style={{ position: "absolute", left: 180, right: 180, top: 0, bottom: 140, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {kicker && <div style={enter(frame, 0)}><Kicker>{kicker}</Kicker></div>}
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 84, lineHeight: 1.15, color: C.text, marginTop: 24 }}>
        {words.map((w, i) => (
          <span key={i} style={{ display: "inline-block", marginRight: 22, ...enter(frame, 6 + i * 3, 12, 20), color: isHl(w) ? C.sun : C.text }}>{w}</span>
        ))}
      </div>
    </div>
  );
};

export const Bullets: React.FC<KitProps<"Bullets">> = ({ kicker, title, items, numbered }) => {
  const frame = useCurrentFrame();
  const at = useTimes(items.map((x) => x.at));
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 110, right: 160, top: 300, display: "flex", flexDirection: "column", gap: 30 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, ...reveal(frame, at[i]) }}>
            <div style={{ flex: "none", width: 64, height: 64, borderRadius: 32, background: ACCENTS[i % ACCENTS.length], color: C.night, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 32 }}>{numbered ? i + 1 : "✓"}</div>
            <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 52, color: C.text, lineHeight: 1.2 }}>{it.text}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export const Steps: React.FC<KitProps<"Steps">> = ({ kicker, title, steps }) => {
  const frame = useCurrentFrame();
  const at = useTimes(steps.map((x) => x.at));
  const active = at.filter((a) => frame >= a).length - 1;
  const w = Math.min(330, (1700 - (steps.length - 1) * 60) / steps.length);
  // shrink labels so the longest one fits its box (bold display face ≈ 0.6 em per character)
  const longest = Math.max(...steps.map((s) => s.label.length));
  const labelSize = Math.min(44, Math.floor((w - 50) / (longest * 0.6)));
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 110, right: 110, top: 380, display: "flex", alignItems: "stretch", justifyContent: "center" }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ width: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, color: frame >= at[i] ? C.sun : C.line }}>→</div>}
            <div style={{ width: w, padding: "34px 24px", borderRadius: 24, textAlign: "center", background: i === active ? `${ACCENTS[i % 6]}26` : C.panel, border: `4px solid ${frame >= at[i] ? ACCENTS[i % 6] : C.line}`, ...reveal(frame, at[i], 0.25), transform: `${reveal(frame, at[i], 0.25).transform} scale(${i === active ? 1.05 : 1})` }}>
              <div style={{ fontFamily: F.mono, fontSize: 26, color: ACCENTS[i % 6], fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: labelSize, color: C.text, marginTop: 10, lineHeight: 1.1 }}>{s.label}</div>
              {s.detail && <div style={{ fontFamily: F.body, fontSize: 30, color: C.mute, marginTop: 14, lineHeight: 1.25 }}>{s.detail}</div>}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export const Compare: React.FC<KitProps<"Compare">> = ({ kicker, title, columns, verdict }) => {
  const frame = useCurrentFrame();
  const at = useTimes(columns.map((c) => c.at));
  const v = useMark(verdict?.at);
  const vAt = v ?? (at[at.length - 1] + 90);
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 110, right: 110, top: 300, display: "flex", gap: 36 }}>
        {columns.map((c, i) => (
          <div key={i} style={{ flex: 1, background: C.panel, borderRadius: 24, padding: 38, border: `4px solid ${frame >= at[i] ? TONE[c.tone ?? "neutral"] : C.line}`, minHeight: 420, ...reveal(frame, at[i]) }}>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 52, color: TONE[c.tone ?? "neutral"] }}>{c.title}</div>
            {c.items.map((t, j) => (
              <div key={j} style={{ fontFamily: F.body, fontSize: 38, color: C.text, marginTop: 22, display: "flex", gap: 16 }}>
                <span style={{ color: TONE[c.tone ?? "neutral"] }}>{c.tone === "bad" ? "✗" : c.tone === "good" ? "✓" : "•"}</span><span>{t}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {verdict && <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.sun, opacity: progress(frame, vAt, 14) }}>{verdict.text}</div>}
    </>
  );
};

export const Definition: React.FC<KitProps<"Definition">> = ({ kicker, term, definition, example, analogy, exampleAt, analogyAt }) => {
  const frame = useCurrentFrame();
  // the definition, then the example, then the analogy: each on its own paragraph unless marked
  const parts = [undefined, ...(example ? [exampleAt] : []), ...(analogy ? [analogyAt] : [])];
  const t = useTimes(parts);
  const d = t[0], exAt = example ? t[1] : Infinity, anAt = analogy ? t[example ? 2 : 1] : Infinity;
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, ...enter(frame, 0) }}><Kicker>{kicker ?? "Definition"}</Kicker></div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 190, display: "flex", gap: 50, alignItems: "flex-start" }}>
        <Paper style={{ flex: 1.2, padding: 54, ...enter(frame, 4, 18, 40) }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 92, color: C.ink, letterSpacing: -2 }}>{term}</div>
          <div style={{ fontFamily: F.body, fontSize: 46, color: C.ink, lineHeight: 1.3, marginTop: 20, ...reveal(frame, d, 0) }}>{definition}</div>
        </Paper>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 30, paddingTop: 20 }}>
          {example && <div style={{ background: C.panel, borderRadius: 22, padding: 34, borderLeft: `8px solid ${C.teal}`, ...reveal(frame, exAt, 0) }}>
            <Kicker style={{ fontSize: 22 }}>Example</Kicker>
            <div style={{ fontFamily: F.mono, fontSize: 40, color: C.text, marginTop: 12 }}>{example}</div>
          </div>}
          {analogy && <div style={{ background: C.panel, borderRadius: 22, padding: 34, borderLeft: `8px solid ${C.sun}`, ...reveal(frame, anAt, 0) }}>
            <Kicker color={C.sun} style={{ fontSize: 22 }}>Think of it like</Kicker>
            <div style={{ fontFamily: F.body, fontSize: 38, color: C.text, marginTop: 12, lineHeight: 1.3 }}>{analogy}</div>
          </div>}
        </div>
      </div>
    </>
  );
};

export const Table: React.FC<KitProps<"Table">> = ({ kicker, title, columns, rows, rowsAt, highlight = [] }) => {
  const frame = useCurrentFrame();
  const at = useTimes(rows.map((_, i) => rowsAt?.[i]));
  // a highlight lands on its own mark, or shortly after its row appears
  const hl = useRefs(highlight.map((h) => h.at)).map((t, i) => t ?? (at[highlight[i].row] ?? 0) + 30);
  const lit = (r: number, c: number) => highlight.some((h, i) => h.row === r && (h.col === undefined || h.col === c) && frame >= hl[i]);
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 110, right: 110, top: 290 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, borderRadius: 22, overflow: "hidden", border: `3px solid ${C.line}` }}>
          {columns.map((c, i) => <div key={i} style={{ background: C.panel, padding: "22px 30px", fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.sun, textTransform: "uppercase" }}>{c}</div>)}
          {rows.map((r, ri) => r.slice(0, columns.length).map((cell, ci) => (
            <div key={`${ri}-${ci}`} style={{ padding: "22px 30px", fontFamily: ci === 0 ? F.body : F.mono, fontWeight: ci === 0 ? 700 : 500, fontSize: 40, color: lit(ri, ci) ? C.night : C.text, background: lit(ri, ci) ? C.sun : ri % 2 ? "#13263a" : C.night2, borderTop: `2px solid ${C.line}`, ...reveal(frame, at[ri], 0.08) }}>{cell}</div>
          )))}
        </div>
      </div>
    </>
  );
};

export const BarChart: React.FC<KitProps<"BarChart">> = ({ kicker, title, unit, bars, note }) => {
  const frame = useCurrentFrame();
  const at = useTimes(bars.map((b) => b.at));
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 110, right: 160, top: 320, display: "flex", flexDirection: "column", gap: 34 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, opacity: 0.2 + 0.8 * progress(frame, at[i], 10) }}>
            <div style={{ width: 300, fontFamily: F.body, fontWeight: 700, fontSize: 42, color: C.text, textAlign: "right" }}>{b.label}</div>
            <div style={{ height: 70, borderRadius: 12, background: ACCENTS[i % 6], width: Math.max(8, (b.value / max) * 1100 * progress(frame, at[i], 24)) }} />
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: C.text, opacity: progress(frame, at[i] + 18, 8) }}>{b.value.toLocaleString("en-US")}{unit ? <span style={{ fontSize: 28, color: C.mute }}> {unit}</span> : null}</div>
          </div>
        ))}
      </div>
      {note && <div style={{ position: "absolute", left: 110, top: 880, fontFamily: F.body, fontSize: 34, color: C.mute, ...enter(frame, at[at.length - 1] + 30) }}>{note}</div>}
    </>
  );
};

export const Quiz: React.FC<KitProps<"Quiz">> = ({ kicker, question, options, answer, revealAt, explain }) => {
  const frame = useCurrentFrame();
  const { tl, seg } = useSeg();
  const r = useMark(revealAt) ?? (seg.cues.length > 1 ? Math.round(seg.cues[seg.cues.length - 1].start * tl.fps) - seg.startFrame : Math.round(seg.durationInFrames * 0.6));
  const shown = frame >= r;
  const left = Math.max(0, Math.ceil((r - frame) / tl.fps));
  const pop = usePop(r);
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, ...enter(frame, 0) }}><Kicker color={C.sun}>{kicker}</Kicker></div>
      <div style={{ position: "absolute", left: 110, right: 400, top: 180, fontFamily: F.display, fontWeight: 800, fontSize: 66, lineHeight: 1.12, color: C.text, ...enter(frame, 4) }}>{question}</div>
      {!shown && left <= 9 && <div style={{ position: "absolute", right: 140, top: 190, width: 180, height: 180, borderRadius: 90, border: `8px solid ${C.sun}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 84, color: C.sun }}>{left}</div>}
      <div style={{ position: "absolute", left: 110, right: 110, top: 470, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
        {options.map((o, i) => {
          const right = i === answer;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, padding: "28px 34px", borderRadius: 22, background: shown && right ? `${C.good}2b` : C.panel, border: `4px solid ${shown ? (right ? C.good : C.line) : C.line}`, opacity: shown && !right ? 0.45 : 1, transform: shown && right ? `scale(${0.96 + 0.04 * pop})` : undefined, ...enter(frame, 12 + i * 6) }}>
              <div style={{ flex: "none", width: 60, height: 60, borderRadius: 14, background: shown && right ? C.good : C.line, color: C.night, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 34 }}>{shown && right ? "✓" : String.fromCharCode(65 + i)}</div>
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 42, color: C.text }}>{o}</div>
            </div>
          );
        })}
      </div>
      {explain && <div style={{ position: "absolute", left: 110, right: 110, top: 820, fontFamily: F.body, fontSize: 38, color: C.text, opacity: progress(frame, r + 15, 14) }}>{explain}</div>}
    </>
  );
};

export const Chat: React.FC<KitProps<"Chat">> = ({ kicker, title, messages }) => {
  const frame = useCurrentFrame();
  const at = useTimes(messages.map((m) => m.at));
  return (
    <>
      {title && <Heading kicker={kicker}>{title}</Heading>}
      <div style={{ position: "absolute", left: 420, right: 420, top: title ? 290 : 140, display: "flex", flexDirection: "column", gap: 26 }}>
        {messages.map((m, i) => frame >= at[i] - 4 && (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", ...enter(frame, at[i], 12, 20) }}>
            <div style={{ maxWidth: 820, padding: "24px 32px", borderRadius: 30, fontFamily: F.body, fontSize: 42, lineHeight: 1.3, background: m.role === "user" ? C.teal : C.paper, color: m.role === "user" ? C.night : C.ink, borderBottomRightRadius: m.role === "user" ? 6 : 30, borderBottomLeftRadius: m.role === "ai" ? 6 : 30 }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: 3, opacity: 0.7, marginBottom: 6 }}>{m.role === "user" ? "YOU" : "AI"}</div>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const Timeline: React.FC<KitProps<"Timeline">> = ({ kicker, title, events }) => {
  const frame = useCurrentFrame();
  const at = useTimes(events.map((e) => e.at));
  const n = events.length, x = (i: number) => 200 + (i * 1520) / Math.max(1, n - 1);
  const reached = at.filter((a) => frame >= a).length;
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={200} y1={560} x2={1720} y2={560} stroke={C.line} strokeWidth={8} strokeLinecap="round" />
        <line x1={200} y1={560} x2={reached ? x(Math.max(0, reached - 1)) : 200} y2={560} stroke={C.teal} strokeWidth={8} strokeLinecap="round" />
      </svg>
      {events.map((e, i) => (
        <div key={i} style={{ position: "absolute", left: x(i) - 150, width: 300, top: i % 2 ? 600 : 360, textAlign: "center", ...reveal(frame, at[i], 0.15) }}>
          {i % 2 === 1 && <div style={{ width: 34, height: 34, borderRadius: 17, background: frame >= at[i] ? C.sun : C.line, margin: "-56px auto 22px" }} />}
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: C.sun }}>{e.when}</div>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.text, marginTop: 8, lineHeight: 1.2 }}>{e.label}</div>
          {i % 2 === 0 && <div style={{ width: 34, height: 34, borderRadius: 17, background: frame >= at[i] ? C.sun : C.line, margin: "24px auto 0" }} />}
        </div>
      ))}
    </>
  );
};

export const Recap: React.FC<KitProps<"Recap">> = ({ title, points, next }) => {
  const frame = useCurrentFrame();
  const { tl, seg } = useSeg();
  const at = useTimes(points.map(() => undefined), { reserveEnd: next ? 1 : 0 });
  const n = useMark(next?.at);
  const lastCue = seg.cues[seg.cues.length - 1];
  const nAt = n ?? (next && seg.cues.length > points.length && lastCue ? Math.round(lastCue.start * tl.fps) - seg.startFrame : at[at.length - 1] + 75);
  return (
    <>
      <Heading kicker="Remember">{title}</Heading>
      <div style={{ position: "absolute", left: 110, width: next ? 1000 : 1600, top: 290, display: "flex", flexDirection: "column", gap: 26 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start", ...reveal(frame, at[i]) }}>
            <Chip i={i} size={34}>{i + 1}</Chip>
            <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 44, color: C.text, lineHeight: 1.25, paddingTop: 6 }}>{p}</div>
          </div>
        ))}
      </div>
      {next && (
        <div style={{ position: "absolute", right: 110, width: 600, top: 300, background: "#0a121b", border: `3px solid ${C.line}`, borderRadius: 24, padding: 40, opacity: progress(frame, nAt, 16), transform: `translateX(${(1 - progress(frame, nAt, 16)) * 60}px)` }}>
          <Kicker color={C.sun}>Next</Kicker>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 58, color: C.text, marginTop: 14, lineHeight: 1.05 }}>{next.title}</div>
          {next.question && <div style={{ fontFamily: F.body, fontSize: 36, color: C.mute, marginTop: 20, lineHeight: 1.3 }}>{next.question}</div>}
        </div>
      )}
    </>
  );
};

export const KIT_COMPONENTS = { TitleCard, BigIdea, Bullets, Steps, Compare, Definition, Table, BarChart, Quiz, Chat, Timeline, Recap };
