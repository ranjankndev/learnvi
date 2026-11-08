import fs from "node:fs";
import path from "node:path";
import { ConfigError, fillTemplate, templateContext, type EpisodeCtx } from "./project.js";
import type { Lock } from "./audio/pipeline.js";
import { mixAt } from "./audio/tools.js";
import { KIT } from "../../remotion/kit/specs.js";

/** Scene-kit props go through their spec, so defaults are filled in before anything renders. */
function withKitDefaults(component: string, props: Record<string, unknown>) {
  const spec = (KIT as Record<string, { props: { safeParse: (v: unknown) => { success: boolean; data?: unknown } } }>)[component];
  const r = spec?.props.safeParse(props);
  return r?.success ? (r.data as Record<string, unknown>) : props;
}

export interface TimelineCue { id: string; start: number; end: number; marks: Record<string, number>; text: string; words: { w: string; start: number }[] }
export interface TimelineSegment {
  id: string; kind: string; component: string; props: Record<string, unknown>; short: boolean;
  title: string; shortTitle: string;
  start: number; end: number; startFrame: number; durationInFrames: number; cues: TimelineCue[];
}
export interface Timeline {
  /** unique id across series ("press-enter-ep03"): compositions, public files and caches use it */
  key: string; seriesId: string;
  episode: string; title: string; fps: number; duration: number; durationInFrames: number;
  video: { width: number; height: number; burnCaptions: boolean; brand: string };
  /** top-right badge, already filled in: [label, highlighted part] */
  badge: [string, string];
  series: { title: string; subtitle: string; runningPrompt: string; stops: { id: string; number: number; name: string; stamp: string; topic: string }[] };
  stop: { number: number; name: string; stamp: string };
  shorts: { width: number; height: number; maxSeconds: number; cta: string };
  thumbnail: { headline: string; big?: string } | null;
  segments: TimelineSegment[];
  /** every addressable point: "c07" and "c07@ids" → absolute seconds */
  refs: Record<string, number>;
  audio: { file: string; start: number }[];
}

const REF = /^c\d+(@[a-z][\w-]*)?$/i;

const KIND_TITLES: Record<string, string> = {
  passport: "Next stop", hook: "Introduction", routeMap: "Route map", core: "", tryIt: "Try it yourself",
  blooper: "AI blooper", myth: "Myth vs reality", useIt: "Use it tomorrow", recapNext: "Recap and next stop",
};
const titleFor = (seg: { id: string; kind: string; title?: string }) =>
  seg.title ?? (KIND_TITLES[seg.kind] || seg.id.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase()));

/** Fill {{templates}} in props, and collect cue references found in them. */
function resolveProps(v: unknown, vars: Record<string, unknown>, where: string, refs: string[]): unknown {
  if (typeof v === "string") { if (REF.test(v)) refs.push(v.toLowerCase()); return fillTemplate(v, vars, where); }
  if (Array.isArray(v)) return v.map((x, i) => resolveProps(x, vars, `${where}[${i}]`, refs));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveProps(x, vars, `${where}.${k}`, refs)]));
  return v;
}

/** A segment's props with templates filled and kit defaults applied, exactly as the video sees them. */
export function segmentProps(ctx: EpisodeCtx, seg: { id: string; component: string; props: unknown }) {
  return withKitDefaults(seg.component, resolveProps(seg.props, templateContext(ctx), `${seg.id}.props`, []) as Record<string, unknown>);
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
    // start every segment on a whole frame, so a retake earlier in the episode shifts later
    // segments by whole frames and their internal timing (and cached render) stays identical
    t = Math.ceil(t * fps - 1e-6) / fps;
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
      const words = c.words.map((w) => ({ w: w.w, start: +(cs + w.start).toFixed(3) }));
      return { id, start: +cs.toFixed(3), end: +(cs + c.duration).toFixed(3), marks, text: c.display, words };
    });
    if (seg.minDuration && t - start < seg.minDuration) t = start + seg.minDuration;
    if (!ids.length && !seg.minDuration) t += 2;
    const end = t;
    t += a.gapAfterSegment;
    segments.push({
      id: seg.id, kind: seg.kind, component: seg.component, short: seg.short, cues,
      title: fillTemplate(titleFor(seg), vars, `${seg.id}.title`), shortTitle: fillTemplate(seg.shortTitle ?? titleFor(seg), vars, `${seg.id}.shortTitle`),
      props: withKitDefaults(seg.component, resolveProps(seg.props, vars, `${seg.id}.props`, []) as Record<string, unknown>),
      start: +start.toFixed(3), end: +end.toFixed(3), startFrame: f(start), durationInFrames: Math.max(1, f(end + a.gapAfterSegment) - f(start)),
    });
  }
  const duration = +(t - a.gapAfterSegment + a.tail).toFixed(3);
  // make segments cover every frame: the first starts at 0, each runs until the next, the last until the end
  const total = f(duration);
  segments.forEach((s, i) => {
    s.startFrame = i === 0 ? 0 : f(s.start);
    const next = i + 1 < segments.length ? f(segments[i + 1].start) : total;
    s.durationInFrames = Math.max(1, next - s.startFrame);
  });
  // every reference used in props must exist
  for (const seg of ctx.episode.segments) {
    const used: string[] = [];
    resolveProps(seg.props, vars, seg.id, used);
    for (const r of used) if (!(r in refs)) throw new ConfigError(`${seg.id}.props points at "${r}", which is not a cue or mark in script.md`);
  }
  return {
    key: ctx.key, seriesId: ctx.project.id,
    episode: ctx.meta.id, title: ctx.meta.title, fps, duration, durationInFrames: total,
    video: { width: series.video.width, height: series.video.height, burnCaptions: series.video.burnCaptions, brand: series.video.brand },
    badge: [fillTemplate(series.video.badge[0], vars, "video.badge"), fillTemplate(series.video.badge[1], vars, "video.badge")],
    series: { title: series.title, subtitle: series.subtitle, runningPrompt: series.runningPrompt,
      stops: series.episodes.map((e) => ({ id: e.id, number: e.number, name: e.stop ?? e.title, stamp: e.stamp ?? (e.stop ?? e.title).toUpperCase(), topic: e.topic ?? "" })) },
    stop: { number: ctx.meta.number, name: ctx.meta.stop ?? ctx.meta.title, stamp: ctx.meta.stamp ?? (ctx.meta.stop ?? ctx.meta.title).toUpperCase() },
    shorts: { ...series.shorts, cta: fillTemplate(series.shorts.cta, vars, "series.shorts.cta") },
    thumbnail: ctx.episode.thumbnail ? { headline: fillTemplate(ctx.episode.thumbnail.headline, vars, "thumbnail"), big: ctx.episode.thumbnail.big } : null,
    segments, refs, audio,
  };
}

export function outDir(ctx: EpisodeCtx) { return path.join(ctx.project.code, "out", ctx.project.id, ctx.meta.id); }

/** Write timeline.json, narration.wav (voice only) and cue-level captions.srt. */
export function writeTimelineOutputs(ctx: EpisodeCtx, tl: Timeline) {
  const dir = outDir(ctx);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(tl, null, 2));
  writeRemotionManifest(ctx.project.code, tl);
  mixAt(tl.audio.map((x) => ({ file: path.join(ctx.project.code, x.file), start: x.start })), tl.duration, path.join(dir, "narration.wav"), ctx.project.series.audio.sampleRate);
  // Remotion's public folder holds only what the visuals need (keeps bundles small)
  const pub = path.join(ctx.project.code, ".cache", "public", ctx.key);
  fs.mkdirSync(pub, { recursive: true });
  fs.copyFileSync(path.join(dir, "narration.wav"), path.join(pub, "narration.wav"));
  const ts = (s: number) => { const ms = Math.round(s * 1000); const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  const srt = tl.segments.flatMap((s) => s.cues).map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end + 0.2)}\n${c.text}\n`).join("\n");
  fs.writeFileSync(path.join(dir, "captions.srt"), srt);
  return dir;
}

/**
 * Remotion reads timelines from remotion/generated/, so the preview studio hot-reloads
 * whenever `press audio` (or `press studio`'s watcher) regenerates them.
 */
export function writeRemotionManifest(code: string, tl: Timeline) {
  const dir = path.join(code, "remotion", "generated");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${tl.key}.json`), JSON.stringify(tl));
  const keys = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort();
  const ident = (k: string) => "t_" + k.replace(/\W/g, "_");
  const src = `// Generated by \`press audio\`. Do not edit.\n` +
    keys.map((k) => `import ${ident(k)} from "./${k}.json";`).join("\n") +
    `\nimport type { Timeline } from "../types";\n\nexport const TIMELINES = [${keys.map(ident).join(", ")}] as unknown as Timeline[];\n`;
  fs.writeFileSync(path.join(dir, "index.ts"), src);
}
