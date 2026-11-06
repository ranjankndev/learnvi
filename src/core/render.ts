/**
 * Visual track → video files, through Remotion's Node API.
 *
 * Each segment renders on its own (silent) and is cached by a hash of everything that
 * affects its pixels: the component code, its props, and its cue/word timings measured
 * *relative to the segment*. A retake earlier in the episode only shifts later segments
 * in time, so they are reused. Segments are joined losslessly, then the narration is laid in.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { sha, type EpisodeCtx } from "./project.js";
import type { Timeline, TimelineSegment } from "./timeline.js";
import { outDir } from "./timeline.js";

const browserExecutable = () => process.env.REMOTION_BROWSER_EXECUTABLE || null;

export function readTimeline(ctx: EpisodeCtx): Timeline {
  const f = path.join(outDir(ctx), "timeline.json");
  if (!fs.existsSync(f)) throw new Error(`No timeline for ${ctx.meta.id}. Run: press audio ${ctx.meta.id}`);
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

/** Hash of the visual code (everything in remotion/ except generated timelines). */
export function codeHash(root: string) {
  const dir = path.join(root, "remotion");
  const files: string[] = [];
  const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "generated") walk(p); } else files.push(p);
  });
  walk(dir);
  return sha(...files.sort().map((f) => path.relative(root, f) + fs.readFileSync(f, "utf8")));
}

/** Everything that changes a segment's pixels, with all times made relative to the segment start. */
export function segmentKey(tl: Timeline, seg: TimelineSegment, code: string) {
  const rel = (t: number) => Math.round((t - seg.start) * tl.fps);
  const cues = seg.cues.map((c) => ({ id: c.id, text: c.text, s: rel(c.start), e: rel(c.end), m: Object.fromEntries(Object.entries(c.marks).map(([k, v]) => [k, rel(v)])), w: c.words.map((w) => [w.w, rel(w.start)]) }));
  return sha(code, seg.id, seg.component, seg.props, seg.durationInFrames, cues, tl.video, tl.badge, tl.series, tl.stop, tl.fps);
}

let bundled: Promise<string> | null = null;
export function getBundle(root: string, log: (s: string) => void) {
  if (!bundled) {
    log("bundling the visual code…");
    bundled = bundle({ entryPoint: path.join(root, "remotion", "index.ts"), publicDir: path.join(root, ".cache", "public") });
  }
  return bundled;
}

async function composition(serveUrl: string, id: string, inputProps: Record<string, unknown>) {
  return selectComposition({ serveUrl, id, inputProps, browserExecutable: browserExecutable() });
}

/** One frame of one segment, as a PNG: for quick reviews. */
export async function still(ctx: EpisodeCtx, segId: string, frame: number, output: string, log: (s: string) => void) {
  const serveUrl = await getBundle(ctx.project.code, log);
  const inputProps = { episode: ctx.key, segment: segId, muted: true };
  const comp = await composition(serveUrl, `${ctx.key}-${segId}`, inputProps);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await renderStill({ composition: comp, serveUrl, output, frame: Math.max(0, Math.min(frame, comp.durationInFrames - 1)), inputProps, browserExecutable: browserExecutable(), imageFormat: "png" });
  return output;
}

export interface RenderReport { rendered: string[]; reused: string[]; output: string; seconds: number }

export async function renderEpisode(ctx: EpisodeCtx, opts: { only?: string[]; force?: boolean }, log: (s: string) => void): Promise<RenderReport> {
  const t0 = Date.now();
  const root = ctx.project.code, tl = readTimeline(ctx);
  const segDir = path.join(root, ".cache", "segments", ctx.key);
  fs.mkdirSync(segDir, { recursive: true });
  const code = codeHash(root);
  const plan = tl.segments.map((s) => ({ seg: s, file: path.join(segDir, `${s.id}-${segmentKey(tl, s, code)}.mp4`) }));
  const todo = plan.filter((p) => opts.force || !fs.existsSync(p.file) || (opts.only && opts.only.includes(p.seg.id)));
  const rendered: string[] = [];
  if (todo.length) {
    const serveUrl = await getBundle(root, log);
    for (const { seg, file } of todo) {
      const inputProps = { episode: ctx.key, segment: seg.id, muted: true };
      const comp = await composition(serveUrl, `${ctx.key}-${seg.id}`, inputProps);
      let last = -10;
      await renderMedia({
        composition: comp, serveUrl, codec: "h264", crf: 18, outputLocation: file + ".part.mp4", inputProps, muted: true,
        imageFormat: "jpeg", jpegQuality: 92, browserExecutable: browserExecutable(),
        onProgress: ({ progress }) => { const pc = Math.floor(progress * 100); if (pc >= last + 25) { last = pc; log(`  ${seg.id.padEnd(10)} ${pc}%`); } },
      });
      fs.renameSync(file + ".part.mp4", file);
      // drop stale renders of this segment
      for (const f of fs.readdirSync(segDir)) if (f.startsWith(seg.id + "-") && path.join(segDir, f) !== file) fs.rmSync(path.join(segDir, f));
      rendered.push(seg.id);
    }
  }
  // join segments losslessly, then add the narration
  const out = outDir(ctx);
  const list = path.join(segDir, "concat.txt");
  fs.writeFileSync(list, plan.map((p) => `file '${p.file.replace(/'/g, "'\\''")}'`).join("\n"));
  // "<id>-<name>.mp4": the folder name without a leading copy of the id (ep03-token-city → ep03-token-city.mp4)
  const folder = ctx.meta.folder ?? ctx.meta.id;
  const name = (folder.startsWith(ctx.meta.id) ? folder.slice(ctx.meta.id.length) : "-" + folder).replace(/^-+/, "") || "episode";
  const output = path.join(out, `${ctx.meta.id}-${name}.mp4`);
  const ff = (args: string[]) => {
    const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
    if (r.status !== 0) throw new Error("ffmpeg: " + r.stderr);
  };
  const silent = path.join(segDir, "video.mp4");
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent]);
  ff(["-i", silent, "-i", path.join(out, "narration.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", output]);
  return { rendered, reused: plan.map((p) => p.seg.id).filter((id) => !rendered.includes(id)), output, seconds: (Date.now() - t0) / 1000 };
}
