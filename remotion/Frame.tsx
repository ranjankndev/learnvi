import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, Seg, useSeg } from "./ui";
import { COMPONENTS, Placeholder } from "./components";
import type { Timeline, TimelineSegment } from "./types";

/** Night-sky map background: faint latitude/longitude lines + a warm glow. */
const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 85% -10%, ${C.night2}, transparent 70%), radial-gradient(900px 600px at -10% 110%, #2a2236, transparent 65%), ${C.night}` }}>
    <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07 }}>
      {Array.from({ length: 9 }, (_, i) => <path key={"h" + i} d={`M0 ${120 * i + 60} Q960 ${120 * i + 20} 1920 ${120 * i + 60}`} stroke={C.sky} strokeWidth={2} fill="none" />)}
      {Array.from({ length: 13 }, (_, i) => <path key={"v" + i} d={`M${160 * i} 0 Q${160 * i + 40} 540 ${160 * i} 1080`} stroke={C.sky} strokeWidth={2} fill="none" />)}
    </svg>
  </AbsoluteFill>
);

const Chrome: React.FC = () => {
  const { tl } = useSeg();
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 40, fontFamily: F.display, fontWeight: 700, fontSize: 28, color: C.mute, letterSpacing: 1 }}>
        <span style={{ color: C.teal }}>●</span> {tl.video.brand}
      </div>
      <div style={{ position: "absolute", right: 110, top: 34, fontFamily: F.mono, fontSize: 22, letterSpacing: 4, color: C.mute, border: `2px solid ${C.line}`, borderRadius: 40, padding: "8px 22px" }}>
        STOP {String(tl.stop.number).padStart(2, "0")} · <span style={{ color: C.sun }}>{tl.stop.name.toUpperCase()}</span>
      </div>
    </>
  );
};

/** Burned-in captions: the current cue, with words lighting up as they are spoken. */
const Captions: React.FC = () => {
  const { tl, seg } = useSeg();
  const frame = useCurrentFrame();
  const t = (seg.startFrame + frame) / tl.fps;
  const cue = seg.cues.find((c) => t >= c.start - 0.1 && t <= c.end + 0.35);
  if (!cue || !tl.video.burnCaptions) return null;
  // split long cues into caption lines of up to ~12 words, preferring to break after punctuation
  const chunks: number[] = [0];
  cue.words.forEach((w, i) => {
    const n = i + 1 - chunks[chunks.length - 1];
    if (i + 1 < cue.words.length && (n >= 12 || (n >= 6 && /[.,;:!?]["”’)]?$/.test(w.w)))) chunks.push(i + 1);
  });
  const cur = Math.max(0, cue.words.findLastIndex((w) => w.start <= t));
  const from = chunks.filter((c) => c <= cur).pop() ?? 0;
  const words = cue.words.slice(from, chunks.find((c) => c > from) ?? cue.words.length);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1500, textAlign: "center", fontFamily: F.body, fontWeight: 600, fontSize: 40, lineHeight: 1.3, padding: "12px 28px", borderRadius: 14, background: "rgba(6,12,20,.72)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: w.start <= t ? C.text : "#7d8fa3" }}>{w.w} </span>
        ))}
      </div>
    </div>
  );
};

export const SegmentView: React.FC<{ tl: Timeline; seg: TimelineSegment }> = ({ tl, seg }) => {
  const Comp = COMPONENTS[seg.component] ?? Placeholder;
  return (
    <Seg.Provider value={{ tl, seg }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Backdrop />
        <Comp {...seg.props} />
        <Chrome />
        <Captions />
      </AbsoluteFill>
    </Seg.Provider>
  );
};
