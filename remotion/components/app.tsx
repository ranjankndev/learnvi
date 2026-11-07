/** Beyond the model: what a chat app actually sends to the model. */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, Heading, TOK, enter, progress, useTimes } from "../ui";
import type { SegProps } from "../types";

type Block = { label: string; text: string; at?: string; you?: boolean };

/** Blocks drop into a "context window" frame one by one; the user's own message is the last, small one. */
export const PromptStack: React.FC<SegProps> = ({ kicker, title, blocks = [], note }) => {
  const frame = useCurrentFrame();
  const list = blocks as Block[];
  const ats = useTimes(list.map((b) => b.at), { reserveEnd: note ? 1 : 0 });
  const last = Math.max(...ats.map((a) => a ?? 0));
  const gap = 14, top = 290, height = 600;
  const h = (height - gap * (list.length - 1) - 70) / list.length;
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <div style={{ position: "absolute", left: 110, top, width: 1180, height, borderRadius: 22, border: `3px dashed ${C.line}`, padding: 22, ...enter(frame, 6) }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 4, color: C.mute, marginBottom: 12 }}>WHAT THE MODEL ACTUALLY SEES</div>
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {list.map((b, i) => {
            const col = b.you ? C.teal : TOK[(i + 1) % TOK.length];
            return (
              <div key={i} style={{ height: h, display: "flex", alignItems: "center", gap: 24, padding: "0 24px", borderRadius: 14, background: b.you ? `${C.teal}30` : C.night2, borderLeft: `10px solid ${col}`, ...enter(frame, ats[i], 14, 40) }}>
                <div style={{ width: 300, flexShrink: 0, fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 2, color: col, textTransform: "uppercase" }}>{b.label}</div>
                <div style={{ fontFamily: b.you ? F.body : F.mono, fontWeight: b.you ? 700 : 400, fontSize: b.you ? 34 : 26, color: b.you ? C.text : C.mute, lineHeight: 1.3 }}>{b.text}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 1350, top: 420, width: 460, textAlign: "center", ...enter(frame, last + 30) }}>
        <div style={{ margin: "0 auto", width: 190, height: 190, borderRadius: 40, background: `${C.sun}22`, border: `5px solid ${C.sun}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 58, color: C.sun }}>LLM</div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 44, color: C.text, marginTop: 10 }}>the model</div>
        <div style={{ fontFamily: F.body, fontSize: 30, color: C.mute, marginTop: 8 }}>reads all of it, every turn</div>
        <div style={{ fontFamily: F.mono, fontSize: 70, color: C.sun, marginTop: 6 }}>←</div>
      </div>
      {note && <div style={{ position: "absolute", left: 110, top: 905, width: 1700, fontFamily: F.body, fontSize: 32, color: C.sun, ...enter(frame, last + 60) }}>{note}</div>}
    </>
  );
};
