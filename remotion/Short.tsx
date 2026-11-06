/**
 * Vertical (9:16) Short built from any segment: headline on top, the 16:9 scene in the
 * middle, big captions below. No component needs its own vertical layout.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Captions, SegmentView } from "./Frame";
import { C, F, Kicker, Paper, Seg, Stamp, enter } from "./ui";
import type { Timeline, TimelineSegment } from "./types";

export const ShortView: React.FC<{ tl: Timeline; seg: TimelineSegment }> = ({ tl, seg }) => {
  const frame = useCurrentFrame();
  // scale the scene up, trimming the empty side margins (content stays inside 110 px of each edge)
  const crop = 70, W = tl.shorts.width, H = tl.shorts.height, scale = W / (tl.video.width - 2 * crop), sceneH = tl.video.height * scale;
  const top = 430;
  // keep captions and the call to action above the area YouTube covers with its own buttons and title
  const capBottom = H - (top + sceneH) - 300, ctaBottom = 330;
  return (
    <Seg.Provider value={{ tl, seg }}>
      <AbsoluteFill style={{ width: W, height: H, overflow: "hidden" }}>
        <Backdrop />
        <div style={{ position: "absolute", left: 70, right: 70, top: 90 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.mute }}><span style={{ color: C.teal }}>●</span> {tl.video.brand}</div>
            <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: 4, color: C.mute }}>{tl.badge[0]} · <span style={{ color: C.sun }}>{tl.badge[1]}</span></div>
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 76, color: C.text, lineHeight: 1.08, marginTop: 50, letterSpacing: -1, ...enter(frame, 0, 14) }}>{seg.shortTitle}</div>
        </div>
        <div style={{ position: "absolute", left: 0, top, width: W, height: sceneH, overflow: "hidden", borderTop: `3px solid ${C.line}`, borderBottom: `3px solid ${C.line}` }}>
          <div style={{ width: tl.video.width, height: tl.video.height, transform: `translateX(${-crop * scale}px) scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
            <SegmentView tl={tl} seg={seg} captions={false} chrome={false} />
          </div>
        </div>
        <Captions size={60} bottom={capBottom} width={960} />
        <div style={{ position: "absolute", left: 70, right: 70, bottom: ctaBottom }}>
          <div style={{ height: 8, borderRadius: 4, background: C.line, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(frame / seg.durationInFrames) * 100}%`, background: C.sun }} />
          </div>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.mute, marginTop: 24, textAlign: "center" }}>{tl.shorts.cta}</div>
        </div>
      </AbsoluteFill>
    </Seg.Provider>
  );
};

/** YouTube thumbnail: a short, bold headline and the episode's stamp. Text comes from episode.json → thumbnail. */
export const Thumbnail: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const th = tl.thumbnail ?? { headline: tl.title };
  return (
    <AbsoluteFill style={{ width: 1280, height: 720 }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 64, top: 70, width: 690 }}>
        <Kicker style={{ fontSize: 22 }}>{tl.badge[0]} · {tl.badge[1]}</Kicker>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 96, lineHeight: 0.98, color: C.text, letterSpacing: -2, marginTop: 22 }}>{th.headline}</div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.mute, marginTop: 30 }}>{tl.video.brand}</div>
      </div>
      <div style={{ position: "absolute", right: 56, top: 120, transform: "rotate(4deg)" }}>
        <Paper style={{ width: 430, height: 470, padding: 36, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: 4, color: C.inkSoft }}>PASSPORT · PROMPT</div>
          {th.big && <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 58, color: C.ink, lineHeight: 1.1 }}>{th.big}</div>}
          <div style={{ alignSelf: "center" }}><Stamp title={tl.stop.stamp} sub={`STOP ${String(tl.stop.number).padStart(2, "0")}`} size={0.95} /></div>
        </Paper>
      </div>
    </AbsoluteFill>
  );
};
