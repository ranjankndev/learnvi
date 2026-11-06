/**
 * Travel theme + shared building blocks. Components only use what's here,
 * so restyling the whole series means editing this one file.
 */
import React, { createContext, useContext } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Timeline, TimelineSegment } from "./types";

export const C = {
  night: "#0e1b29", night2: "#152a3d", panel: "#1a3248", line: "#2b4560",
  paper: "#f4ecdc", paperEdge: "#dfd0b2", ink: "#1d2834", inkSoft: "#5b6a78",
  teal: "#2fb3ad", stamp: "#e0532a", sun: "#f3b443", sky: "#8fb8d8",
  text: "#eef3f8", mute: "#8ea3b6", good: "#43c38a", bad: "#ef5b5b",
};
export const F = {
  display: '"Bricolage Grotesque", "Segoe UI", sans-serif',
  body: '"Source Sans 3", "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", Consolas, monospace',
};
/** colours for token blocks, like an online tokenizer */
export const TOK = ["#2fb3ad", "#f3b443", "#e0532a", "#8fb8d8", "#b58df0", "#7fd48a", "#f28fb1"];

// ---------- segment context ----------
interface SegCtx { tl: Timeline; seg: TimelineSegment }
export const Seg = createContext<SegCtx | null>(null);
export function useSeg() {
  const c = useContext(Seg);
  if (!c) throw new Error("useSeg outside a segment");
  return c;
}
/** Frame (relative to this segment) of a script reference like "c18" or "c18@merge". */
export function useMark(ref?: unknown): number | undefined {
  const { tl, seg } = useSeg();
  if (typeof ref !== "string") return undefined;
  const t = tl.refs[ref.toLowerCase()];
  return t === undefined ? undefined : Math.round(t * tl.fps) - seg.startFrame;
}
/** Start/end frames (relative) of one cue in this segment. */
export function useCue(id: string) {
  const { tl, seg } = useSeg();
  const c = seg.cues.find((x) => x.id === id);
  if (!c) return undefined;
  return { from: Math.round(c.start * tl.fps) - seg.startFrame, to: Math.round(c.end * tl.fps) - seg.startFrame };
}

// ---------- motion ----------
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const progress = (frame: number, start: number | undefined, dur = 15) =>
  start === undefined ? 1 : interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

/** fade + rise in at `start` (frames). Undefined start = always visible. */
export function enter(frame: number, start: number | undefined, dur = 15, dist = 36): React.CSSProperties {
  const p = progress(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
}
export function usePop(start: number | undefined, damping = 11) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (start === undefined) return 1;
  return spring({ frame: frame - start, fps, config: { damping, stiffness: 160 } });
}
/** deterministic pseudo-random 0..1 (never Math.random: renders must be repeatable) */
export const rand = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

// ---------- building blocks ----------
export const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.teal, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color, fontWeight: 700, ...style }}>{children}</div>
);

export const Heading: React.FC<{ kicker?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ kicker, children, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 110, top: 96, ...enter(frame, 0, 18), ...style }}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 74, color: C.text, letterSpacing: -1.5, lineHeight: 1.05, marginTop: 10 }}>{children}</div>
    </div>
  );
};

/** One token / symbol block. `i` picks a colour; `plain` keeps it neutral. */
export const Chip: React.FC<{ children: React.ReactNode; i?: number; plain?: boolean; size?: number; style?: React.CSSProperties; glow?: string }> = ({ children, i = 0, plain, size = 44, style, glow }) => {
  const col = plain ? C.line : TOK[i % TOK.length];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "pre",
      fontFamily: F.mono, fontWeight: 500, fontSize: size, color: C.text, lineHeight: 1,
      padding: `${size * 0.28}px ${size * 0.34}px`, margin: size * 0.09, borderRadius: size * 0.22,
      background: plain ? C.panel : `${col}33`, border: `3px solid ${col}`,
      boxShadow: glow ? `0 0 0 6px ${glow}55, 0 0 40px ${glow}88` : undefined, ...style,
    }}>{children}</span>
  );
};

/** A sheet of passport paper. */
export const Paper: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: `linear-gradient(160deg, ${C.paper}, #efe3cb)`, color: C.ink, borderRadius: 26, padding: 44,
    border: `2px solid ${C.paperEdge}`, boxShadow: "0 30px 80px rgba(0,0,0,.45)", fontFamily: F.body, ...style,
  }}>{children}</div>
);

/** Ink stamp. `p` 0..1 drives the slam-in. */
export const Stamp: React.FC<{ title: string; sub: string; p?: number; rotate?: number; color?: string; size?: number }> = ({ title, sub, p = 1, rotate = -12, color = C.stamp, size = 1 }) => (
  <div style={{
    display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: `${18 * size}px ${30 * size}px`, border: `${6 * size}px double ${color}`, borderRadius: 18 * size, color,
    fontFamily: F.display, fontWeight: 800, textAlign: "center", mixBlendMode: "multiply",
    opacity: Math.min(1, p * 1.4) * 0.92, transform: `rotate(${rotate}deg) scale(${1 + (1 - p) * 1.6})`,
  }}>
    <div style={{ fontSize: 16 * size, letterSpacing: 4 * size, fontFamily: F.mono }}>{sub}</div>
    <div style={{ fontSize: 44 * size, letterSpacing: 2 * size, lineHeight: 1.05, whiteSpace: "nowrap" }}>{title}</div>
    <div style={{ fontSize: 14 * size, letterSpacing: 6 * size, fontFamily: F.mono }}>★ LEARNVI ★</div>
  </div>
);

/** Ribbon label for recurring segments ("TRY IT YOURSELF", "AI BLOOPER" …) */
export const Ribbon: React.FC<{ children: React.ReactNode; color: string; style?: React.CSSProperties }> = ({ children, color, style }) => (
  <div style={{ display: "inline-block", background: color, color: C.night, fontFamily: F.display, fontWeight: 800, fontSize: 40, letterSpacing: 3, padding: "14px 34px", borderRadius: 10, transform: "rotate(-2deg)", boxShadow: "0 12px 30px rgba(0,0,0,.35)", ...style }}>{children}</div>
);

/**
 * Appearance frames for a list of n items. An item's own `at` ("c07" / "c07@mark") wins.
 * Otherwise items line up with the segment's paragraphs: with as many paragraphs as items, one
 * each; with more, the last n paragraphs (the first ones usually introduce the scene); with fewer,
 * items are spread evenly through the narration.
 */
export function useTimes(ats: (string | undefined)[], opts: { reserveEnd?: number } = {}): number[] {
  const { tl, seg } = useSeg();
  const rel = (t: number) => Math.round(t * tl.fps) - seg.startFrame;
  // reserveEnd: leave the last paragraph(s) to something else (e.g. a recap's "next" teaser)
  const all = seg.cues.map((c) => ({ from: rel(c.start), to: rel(c.end) }));
  const cues = all.length > (opts.reserveEnd ?? 0) ? all.slice(0, all.length - (opts.reserveEnd ?? 0)) : all;
  const n = ats.length;
  return ats.map((at, i) => {
    if (at) { const t = tl.refs[at.toLowerCase()]; if (t !== undefined) return rel(t); }
    if (cues.length >= n && n > 0) return cues[cues.length - n + i].from;
    const from = cues[0]?.from ?? 10, to = cues.length ? cues[cues.length - 1].to : seg.durationInFrames - 30;
    return Math.round(from + 20 + ((to - from - 20) * i) / Math.max(1, n));
  });
}

/** Frames for explicit marks only (undefined where an item has no `at`). */
export function useRefs(ats: (string | undefined)[]): (number | undefined)[] {
  const { tl, seg } = useSeg();
  return ats.map((a) => {
    const t = a ? tl.refs[a.toLowerCase()] : undefined;
    return t === undefined ? undefined : Math.round(t * tl.fps) - seg.startFrame;
  });
}
