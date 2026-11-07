/** The recurring segments every episode has: Try it yourself, AI blooper, Myth vs reality, Use it tomorrow. */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, Ribbon, enter, progress, rand, useMark, usePop, useSeg } from "../ui";
import type { SegProps } from "../types";

const Phone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ width: 460, height: 820, borderRadius: 64, background: "#05090f", padding: 18, boxShadow: "0 40px 90px rgba(0,0,0,.55)", border: `3px solid ${C.line}`, ...style }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 48, background: "#f3f5f8", position: "relative", overflow: "hidden", padding: "70px 26px 26px", fontFamily: F.body }}>
      <div style={{ position: "absolute", top: 18, left: "50%", width: 120, height: 30, marginLeft: -60, borderRadius: 20, background: "#05090f" }} />
      {children}
    </div>
  </div>
);
const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ me, children, style }) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 16, ...style }}>
    <div style={{ maxWidth: 330, padding: "16px 20px", borderRadius: 24, fontSize: 28, lineHeight: 1.3, background: me ? C.teal : "#ffffff", color: me ? "#fff" : C.ink, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>{children}</div>
  </div>
);

/** A phone experiment: steps appear with the narration, then a countdown gives viewers time to try. */
export const TryIt: React.FC<SegProps> = ({ steps = [], chat }) => {
  const frame = useCurrentFrame();
  const { tl, seg } = useSeg();
  const lastEnd = seg.cues.length ? Math.round(seg.cues[seg.cues.length - 1].end * tl.fps) - seg.startFrame : 0;
  const total = seg.durationInFrames - lastEnd;
  const left = Math.max(0, Math.ceil((seg.durationInFrames - frame) / tl.fps));
  const counting = frame >= lastEnd && total > tl.fps * 3;
  const ring = counting ? (frame - lastEnd) / total : 0;
  const typed = Math.floor(progress(frame, 20, 50) * String(chat ?? "").length);
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, ...enter(frame, 0) }}><Ribbon color={C.sun}>TRY IT YOURSELF</Ribbon></div>
      <div style={{ position: "absolute", left: 110, top: 290, width: 1000 }}>
        {(steps as { text: string; at: string }[]).map((s, i) => <Step key={i} s={s} i={i} frame={frame} />)}
        {counting && (
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 30, ...enter(frame, lastEnd) }}>
            <svg width={150} height={150} viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={42} stroke={C.line} strokeWidth={9} fill="none" />
              <circle cx={50} cy={50} r={42} stroke={C.sun} strokeWidth={9} fill="none" pathLength={1} strokeDasharray={`${1 - ring} 1`} transform="rotate(-90 50 50)" strokeLinecap="round" />
              <text x={50} y={62} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={34} fill={C.text}>{left}</text>
            </svg>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.text }}>Pause the video if you need more time</div>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", right: 170, top: 150, ...enter(frame, 6, 20, 80) }}>
        <Phone>
          {typed > 0 && <Bubble me>{String(chat).slice(0, typed)}</Bubble>}
          {typed >= String(chat ?? "").length && <Bubble><span style={{ letterSpacing: 4 }}>{"•••".slice(0, 1 + (Math.floor(frame / 10) % 3))}</span></Bubble>}
        </Phone>
      </div>
    </>
  );
};
const Step: React.FC<{ s: { text: string; at: string }; i: number; frame: number }> = ({ s, i, frame }) => {
  const at = useMark(s.at);
  return (
    <div style={{ display: "flex", gap: 26, alignItems: "flex-start", marginBottom: 34, opacity: at === undefined ? 0.3 : 0.3 + 0.7 * progress(frame, at, 12) }}>
      <div style={{ flex: "none", width: 72, height: 72, borderRadius: 36, background: C.sun, color: C.night, fontFamily: F.display, fontWeight: 800, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
      <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 44, color: C.text, lineHeight: 1.25 }}>{s.text}</div>
    </div>
  );
};

/** A funny model mistake, replayed as a chat, with a glitch on the strange reply. */
export const Blooper: React.FC<SegProps> = ({ prompt, reply, replyAt, year, token,
  label = "A GLITCH TOKEN", explain = "In the vocabulary, but almost never seen in training. The model had no idea what it meant.", quoted = true }) => {
  const frame = useCurrentFrame();
  const at = useMark(replyAt);
  const glitch = at !== undefined && frame >= at && frame < at + 18;
  const jx = glitch ? (rand(frame) - 0.5) * 24 : 0;
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, ...enter(frame, 0) }}><Ribbon color={C.stamp} style={{ color: C.text }}>AI BLOOPER</Ribbon></div>
      <div style={{ position: "absolute", left: 110, top: 290, width: 860, ...enter(frame, 10) }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, color: C.mute, letterSpacing: 3 }}>{year} · {label}</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: String(token).length > 22 ? 48 : 64, color: C.sun, margin: "16px 0 26px", lineHeight: 1.2 }}>{quoted ? `“${String(token).replace(/^ /, "␣")}”` : token}</div>
        <div style={{ fontFamily: F.body, fontSize: 38, color: C.text, lineHeight: 1.35 }}>{explain}</div>
      </div>
      <div style={{ position: "absolute", right: 170, top: 150, ...enter(frame, 14, 20, 80) }}>
        <Phone>
          <Bubble me>{prompt}</Bubble>
          {at !== undefined && frame >= at && (
            <Bubble style={{ transform: `translateX(${jx}px)`, filter: glitch ? `drop-shadow(${jx / 2}px 0 0 ${C.stamp}) drop-shadow(${-jx / 2}px 0 0 ${C.teal})` : undefined }}>
              <b>{reply}</b>
            </Bubble>
          )}
          {at !== undefined && <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", fontSize: 30, color: C.stamp, fontWeight: 700, opacity: progress(frame, at + 25) }}>…that is not what we asked</div>}
        </Phone>
      </div>
    </>
  );
};

/** Myth on the left gets crossed out; reality slides in with a picture of the numbers. */
export const MythVsReality: React.FC<SegProps> = ({ myth, reality, revealAt, fact }) => {
  const frame = useCurrentFrame();
  const at = useMark(revealAt);
  const r = progress(frame, at, 16) * (at === undefined ? 0 : 1);
  const pop = usePop(at);
  const stampStyle = (col: string): React.CSSProperties => ({ display: "inline-block", fontFamily: F.display, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: col, border: `6px double ${col}`, borderRadius: 14, padding: "6px 20px", transform: "rotate(-6deg)" });
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: F.display, fontWeight: 800, fontSize: 80, color: C.text, ...enter(frame, 0) }}>
        Myth <span style={{ color: C.mute, fontSize: 56 }}>vs</span> Reality
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 300, display: "flex", gap: 40 }}>
        <div style={{ flex: 1, background: C.panel, borderRadius: 28, padding: 46, border: `3px solid ${C.bad}`, ...enter(frame, 10) }}>
          <div style={stampStyle(C.bad)}>MYTH</div>
          {/* long myths get smaller text; the strike-through is drawn on every line */}
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: String(myth).length > 24 ? 62 : 84, lineHeight: 1.15, color: C.text, marginTop: 40, opacity: 1 - 0.5 * r,
            textDecorationLine: "line-through", textDecorationThickness: 8, textDecorationColor: `rgba(239,91,91,${r})` }}>
            {myth}
          </div>
        </div>
        <div style={{ flex: 1.15, background: C.panel, borderRadius: 28, padding: 46, border: `3px solid ${C.good}`, opacity: r, transform: `translateX(${(1 - r) * 120}px) scale(${0.9 + 0.1 * pop})` }}>
          <div style={stampStyle(C.good)}>REALITY</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 50, color: C.text, marginTop: 34, lineHeight: 1.2 }}>{reality}</div>
          {fact && (
            <div style={{ marginTop: 40 }}>
              {[["words", fact.words, C.sky], ["tokens", fact.tokens, C.sun]].map(([label, n, col], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
                  <div style={{ width: 130, fontFamily: F.mono, fontSize: 28, color: C.mute }}>{label as string}</div>
                  <div style={{ height: 40, borderRadius: 8, background: col as string, width: (Number(n) / Math.max(fact.words, fact.tokens)) * 520 * progress(frame, (at ?? 0) + 20 + i * 8, 20) }} />
                  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: C.text }}>{n as number}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/** A practical tip, styled as a luggage tag, with its how-to bullets. */
export const UseIt: React.FC<SegProps> = ({ tip, bullets = [], bulletsAt }) => {
  const frame = useCurrentFrame();
  const at = useMark(bulletsAt);
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, ...enter(frame, 0) }}><Ribbon color={C.teal}>USE IT TOMORROW</Ribbon></div>
      <div style={{ position: "absolute", left: 110, top: 290, width: 1700, display: "flex", gap: 60, alignItems: "flex-start" }}>
        <div style={{ position: "relative", flex: "none", width: 760, background: C.paper, color: C.ink, borderRadius: "30px 30px 30px 30px", padding: "56px 50px 50px 90px", boxShadow: "0 30px 80px rgba(0,0,0,.45)", transform: "rotate(-2deg)", ...enter(frame, 8, 20, 60) }}>
          <div style={{ position: "absolute", left: 30, top: 60, width: 30, height: 30, borderRadius: 15, background: C.night, boxShadow: `0 0 0 6px ${C.paperEdge}` }} />
          <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 5, color: C.inkSoft }}>TIP FOR WORK</div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, lineHeight: 1.1, marginTop: 14 }}>{tip}</div>
        </div>
        <div style={{ paddingTop: 30 }}>
          {(bullets as string[]).map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 36, ...enter(frame, at === undefined ? undefined : at + i * 40) , opacity: at === undefined ? 0 : progress(frame, at + i * 40) }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, background: C.teal, color: C.night, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 32 }}>✓</div>
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 44, color: C.text }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/**
 * A chat answer streaming in word by word, the way chat apps show replies as they're generated.
 * Streaming starts at `streamAt` (a cue or mark) and runs at a steady, realistic pace.
 */
export const ChatStream: React.FC<SegProps> = ({ kicker = "Streaming", title, prompt, answer, streamAt, wordsPerSecond = 7, notes = [] }) => {
  const frame = useCurrentFrame();
  const { tl } = useSeg();
  const at = useMark(streamAt) ?? 30;
  const words = String(answer ?? "").split(/(\s+)/); // keep spaces and line breaks
  const shownWords = Math.max(0, Math.floor(((frame - at) / tl.fps) * wordsPerSecond));
  let count = 0;
  const visible = words.filter((w) => (/\S/.test(w) ? ++count <= shownWords : count < shownWords)).join("");
  const total = words.filter((w) => /\S/.test(w)).length;
  const streaming = frame >= at && shownWords < total;
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, width: 900, ...enter(frame, 0) }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: C.teal, fontWeight: 700 }}>{kicker}</div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 70, color: C.text, marginTop: 10, lineHeight: 1.08 }}>{title}</div>
      </div>
      <div style={{ position: "absolute", left: 110, top: 400, width: 880 }}>
        <div style={{ fontFamily: F.mono, fontSize: 30, color: C.mute, letterSpacing: 2 }}>WORDS STREAMED</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 120, color: streaming ? C.sun : C.text, lineHeight: 1.1 }}>{Math.min(shownWords, total)}<span style={{ fontSize: 48, color: C.mute }}> / {total}</span></div>
        {(notes as string[]).map((n, i) => (
          <div key={i} style={{ fontFamily: F.body, fontSize: 38, color: C.text, marginTop: 22, lineHeight: 1.3, opacity: progress(frame, at + 30 + i * 45, 15) }}>• {n}</div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 170, top: 120, ...enter(frame, 6, 20, 80) }}>
        <Phone>
          <Bubble me>{prompt}</Bubble>
          {frame >= at - 10 && (
            <Bubble style={{ whiteSpace: "pre-wrap" }}>
              {visible}
              {frame >= at && shownWords < total && <span style={{ display: "inline-block", width: 12, height: 28, marginLeft: 4, background: C.teal, opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2, verticalAlign: "middle" }} />}
              {frame < at && <span style={{ letterSpacing: 4 }}>{"•••".slice(0, 1 + (Math.floor(frame / 10) % 3))}</span>}
            </Bubble>
          )}
        </Phone>
      </div>
    </>
  );
};
