import fs from "node:fs";
import path from "node:path";
import { ConfigError, fillTemplate, templateContext, type EpisodeCtx } from "./project.js";
import type { Lock } from "./audio/pipeline.js";
import { mixAt } from "./audio/tools.js";

export interface TimelineCue { id: string; start: number; end: number; marks: Record<string, number>; text: string }
export interface TimelineSegment {
  id: string; kind: string; component: string; props: Record<string, unknown>; short: boolean;
  start: number; end: number; startFrame: number; durationInFrames: number; cues: TimelineCue[];
}
export interface Timeline {
  episode: string; title: string; fps: number; duration: number; durationInFrames: number;
  segments: TimelineSegment[];
  /** every addressable point: "c07" and "c07@ids" → absolute seconds */
  refs: Record<string, number>;
  audio: { file: string; start: number }[];
}

const REF = /^c\d+(@[a-z][\w-]*)?$/i;

/** Fill {{templates}} in props, and collect cue references found in them. */
function resolveProps(v: unknown, vars: Record<string, unknown>, where: string, refs: string[]): unknown {
  if (typeof v === "string") { if (REF.test(v)) refs.push(v.toLowerCase()); return fillTemplate(v, vars, where); }
  if (Array.isArray(v)) return v.map((x, i) => resolveProps(x, vars, `${where}[${i}]`, refs));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveProps(x, vars, `${where}.${k}`, refs)]));
  return v;
}

export function buildTimeline(ctx: EpisodeCtx, lock: Lock): Timeline {
  const { series } = ctx.project, a = series.audio, fps = series.fps;
  const vars = templateContext(ctx);
  const f = (s: number) => Math.round(s * fps);
  const refs: Record<string, number> = {};
  const audio: Timeline["audio"] = [];
  const segments: TimelineSegment[] = [];
  let t = a.leadIn;
  for (const seg of ctx.episode.segments) {
    const start = t;
    const ids = lock.order.filter((id) => lock.cues[id].segment === seg.id);
    const cues: TimelineCue[] = ids.map((id, i) => {
      const c = lock.cues[id];
      const cs = t;
      t += c.duration + (c.after ?? 0) + (i < ids.length - 1 ? a.gapAfterCue : 0);
      const marks = Object.fromEntries(Object.entries(c.marks).map(([k, v]) => [k, +(cs + v).toFixed(3)]));
      refs[id] = +cs.toFixed(3);
      for (const [k, v] of Object.entries(marks)) refs[`${id}@${k}`] = v;
      audio.push({ file: c.audio, start: +cs.toFixed(3) });
      return { id, start: +cs.toFixed(3), end: +(cs + c.duration).toFixed(3), marks, text: c.display };
    });
    if (seg.minDuration && t - start < seg.minDuration) t = start + seg.minDuration;
    if (!ids.length && !seg.minDuration) t += 2;
    const end = t;
    t += a.gapAfterSegment;
    segments.push({
      id: seg.id, kind: seg.kind, component: seg.component, short: seg.short, cues,
      props: resolveProps(seg.props, vars, `${seg.id}.props`, []) as Record<string, unknown>,
      start: +start.toFixed(3), end: +end.toFixed(3), startFrame: f(start), durationInFrames: Math.max(1, f(end + a.gapAfterSegment) - f(start)),
    });
  }
  const duration = +(t - a.gapAfterSegment + a.tail).toFixed(3);
  // every reference used in props must exist
  for (const seg of ctx.episode.segments) {
    const used: string[] = [];
    resolveProps(seg.props, vars, seg.id, used);
    for (const r of used) if (!(r in refs)) throw new ConfigError(`${seg.id}.props points at "${r}", which is not a cue or mark in script.md`);
  }
  return { episode: ctx.meta.id, title: ctx.meta.title, fps, duration, durationInFrames: f(duration), segments, refs, audio };
}

export function outDir(ctx: EpisodeCtx) { return path.join(ctx.project.root, "out", ctx.meta.id); }

/** Write timeline.json, narration.wav (voice only) and cue-level captions.srt. */
export function writeTimelineOutputs(ctx: EpisodeCtx, tl: Timeline) {
  const dir = outDir(ctx);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(tl, null, 2));
  mixAt(tl.audio.map((x) => ({ file: path.join(ctx.project.root, x.file), start: x.start })), tl.duration, path.join(dir, "narration.wav"), ctx.project.series.audio.sampleRate);
  const ts = (s: number) => { const ms = Math.round(s * 1000); const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  const srt = tl.segments.flatMap((s) => s.cues).map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end + 0.2)}\n${c.text}\n`).join("\n");
  fs.writeFileSync(path.join(dir, "captions.srt"), srt);
  return dir;
}
