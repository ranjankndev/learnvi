/** A 2D "map of meaning": groups of words appear on cue, and distance lines compare pairs. */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, Heading, TOK, progress, useTimes } from "../ui";
import type { SegProps } from "../types";

type Pt = { word: string; x: number; y: number };
type Group = { label: string; points: Pt[]; at?: string };
type Link = { from: string; to: string; label?: string; good?: boolean; at?: string };

/** Map area: x/y are 0–100 inside a 1500×560 box below the heading. */
export const MeaningMap: React.FC<SegProps> = ({ kicker, title, groups = [], links = [] }) => {
  const frame = useCurrentFrame();
  const gAt = useTimes((groups as Group[]).map((g) => g.at));
  const lAt = useTimes((links as Link[]).map((l) => l.at));
  const W = 1500, H = 560, X0 = 210, Y0 = 300;
  const pos = (p: Pt) => ({ x: X0 + (p.x / 100) * W, y: Y0 + (p.y / 100) * H });
  const all = new Map<string, Pt>();
  (groups as Group[]).forEach((g) => g.points.forEach((p) => all.set(p.word, p)));
  const linkStart = Math.min(...lAt, Infinity);
  return (
    <>
      <Heading kicker={kicker}>{title}</Heading>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* faint map grid */}
        {Array.from({ length: 6 }, (_, i) => <line key={"h" + i} x1={X0} x2={X0 + W} y1={Y0 + (i * H) / 5} y2={Y0 + (i * H) / 5} stroke={C.line} strokeWidth={1.5} opacity={0.5} />)}
        {Array.from({ length: 9 }, (_, i) => <line key={"v" + i} y1={Y0} y2={Y0 + H} x1={X0 + (i * W) / 8} x2={X0 + (i * W) / 8} stroke={C.line} strokeWidth={1.5} opacity={0.5} />)}
        {(links as Link[]).map((l, i) => {
          const a = all.get(l.from), b = all.get(l.to);
          if (!a || !b) return null;
          const p = progress(frame, lAt[i], 18), A = pos(a), B = pos(b);
          const col = l.good === false ? C.bad : C.sun;
          return (
            <g key={"l" + i} opacity={p > 0 ? 1 : 0}>
              <line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * p} y2={A.y + (B.y - A.y) * p} stroke={col} strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      {(groups as Group[]).map((g, gi) => {
        const col = TOK[gi % TOK.length];
        const xs = g.points.map((p) => pos(p).x), ys = g.points.map((p) => pos(p).y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, top = Math.min(...ys) - 70;
        const dim = frame >= linkStart && !(links as Link[]).some((l) => g.points.some((p) => p.word === l.from || p.word === l.to));
        return (
          <div key={gi} style={{ opacity: progress(frame, gAt[gi], 14) * (dim ? 0.45 : 1) }}>
            <div style={{ position: "absolute", left: cx - 200, width: 400, top, display: "flex", justifyContent: "center" }}><span style={{ padding: "2px 10px", borderRadius: 8, background: C.night, fontFamily: F.mono, fontSize: 24, letterSpacing: 4, color: col, textTransform: "uppercase" }}>{g.label}</span></div>
            {g.points.map((p, pi) => {
              const P = pos(p);
              return (
                <div key={pi} style={{ position: "absolute", left: P.x, top: P.y, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * progress(frame, (gAt[gi] ?? 0) + pi * 5, 12)})` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 30, background: `linear-gradient(${col}2e, ${col}2e), ${C.night}`, border: `3px solid ${col}`, fontFamily: F.body, fontWeight: 700, fontSize: 34, color: C.text, whiteSpace: "nowrap" }}>
                    <span style={{ width: 14, height: 14, borderRadius: 7, background: col }} />{p.word}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {/* link labels sit above the chips, nudged off the line on a backing pill */}
      {(links as Link[]).map((l, i) => {
        const a = all.get(l.from), b = all.get(l.to);
        if (!a || !b || !l.label) return null;
        const A = pos(a), B = pos(b);
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
        let nx = -dy / len, ny = dx / len;
        if (ny > 0) { nx = -nx; ny = -ny; } // always push the label upward
        const col = l.good === false ? C.bad : C.sun;
        return (
          <div key={"t" + i} style={{ position: "absolute", left: (A.x + B.x) / 2 + nx * 46, top: (A.y + B.y) / 2 + ny * 46, transform: "translate(-50%, -50%)", opacity: progress(frame, lAt[i] + 12, 10), padding: "4px 14px", borderRadius: 10, background: C.night, border: `2px solid ${col}`, fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: col, whiteSpace: "nowrap" }}>{l.label}</div>
        );
      })}
    </>
  );
};
