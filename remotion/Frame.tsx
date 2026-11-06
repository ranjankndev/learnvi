import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, Seg, useSeg } from "./ui";
import { COMPONENTS, Placeholder } from "./components";
import { captionLines } from "./captions";
import type { Timeline, TimelineSegment } from "./types";

/** Night-sky map background: faint latitude/longitude lines + a warm glow. */
export const Backdrop: React.FC = () => (
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
        {tl.badge[0]} · <span style={{ color: C.sun }}>{tl.badge[1]}</span>
      </div>
    </>
  );
};

/** The caption line being spoken at this frame (null between cues). */
export function useCaption() {
  const { tl, seg } = useSeg();
  const frame = useCurrentFrame();
  const t = (seg.startFrame + frame) / tl.fps;
  const cue = seg.cues.find((c) => t >= c.start - 0.1 && t <= c.end + 0.35);
  if (!cue) return null;
  const lines = captionLines(cue.words, cue.end);
  const line = [...lines].reverse().find((l) => l.start <= t) ?? lines[0];
  return { t, words: line.words };
}

/** Burned-in captions: the current line, with words lighting up as they are spoken. */
export const Captions: React.FC<{ size?: number; bottom?: number; width?: number }> = ({ size = 40, bottom = 44, width = 1500 }) => {
  const c = useCaption();
  if (!c) return null;
  const { t, words } = c;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: width, textAlign: "center", fontFamily: F.body, fontWeight: 600, fontSize: size, lineHeight: 1.3, padding: "12px 28px", borderRadius: 14, background: "rgba(6,12,20,.72)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: w.start <= t ? C.text : "#7d8fa3" }}>{w.w} </span>
        ))}
      </div>
    </div>
  );
};

export const SegmentView: React.FC<{ tl: Timeline; seg: TimelineSegment; captions?: boolean; chrome?: boolean }> = ({ tl, seg, captions = true, chrome = true }) => {
  const Comp = COMPONENTS[seg.component] ?? Placeholder;
  return (
    <Seg.Provider value={{ tl, seg }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Backdrop />
        <Comp {...seg.props} />
        {chrome && <Chrome />}
        {captions && tl.video.burnCaptions && <Captions />}
      </AbsoluteFill>
    </Seg.Provider>
  );
};
