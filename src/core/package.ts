/**
 * Everything to publish one episode: main video, Shorts, thumbnail, audio-only MP3 with
 * chapters, caption files, and the YouTube title/description/tags, all from config.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { captionLines } from "../../remotion/captions.js";
import { fillTemplate, sha, templateContext, type EpisodeCtx } from "./project.js";
import { readLock } from "./audio/pipeline.js";
import { mixAt } from "./audio/tools.js";
import { outDir, type Timeline } from "./timeline.js";
import { codeHash, getBundle, readTimeline, renderEpisode, segmentKey } from "./render.js";

const browserExecutable = () => process.env.REMOTION_BROWSER_EXECUTABLE || null;
const ff = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg: " + r.stderr);
};

export const clock = (s: number) => {
  const t = Math.floor(s), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};
const stamp = (s: number, sep: "," | ".") => {
  const ms = Math.round(s * 1000), p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`;
};

/** YouTube chapters: first at 0:00, each at least 10 s (short segments merge into the next). */
export function chapters(tl: Timeline) {
  const out: { t: number; title: string }[] = [];
  tl.segments.forEach((s, i) => {
    const t = i === 0 ? 0 : s.startFrame / tl.fps;
    const prev = out[out.length - 1];
    if (prev && t - prev.t < 10) return; // too short to be its own chapter: stays with the previous one
    out.push({ t, title: s.title });
  });
  return out;
}

export function writeCaptions(ctx: EpisodeCtx, tl: Timeline) {
  const lines = tl.segments.flatMap((s) => s.cues).flatMap((c) => captionLines(c.words, c.end));
  const dir = outDir(ctx), base = path.join(dir, ctx.meta.id);
  fs.writeFileSync(base + ".srt", lines.map((l, i) => `${i + 1}\n${stamp(l.start, ",")} --> ${stamp(l.end, ",")}\n${l.text}\n`).join("\n"));
  fs.writeFileSync(base + ".vtt", "WEBVTT\n\n" + lines.map((l) => `${stamp(l.start, ".")} --> ${stamp(l.end, ".")}\n${l.text}\n`).join("\n"));
  return [base + ".srt", base + ".vtt"];
}

export function writeYoutube(ctx: EpisodeCtx, tl: Timeline) {
  const y = ctx.project.series.youtube;
  const vars = templateContext(ctx);
  const ch = chapters(tl).map((c) => `${clock(c.t)} ${c.title}`).join("\n");
  const title = fillTemplate(y.title, vars, "youtube.title");
  const description = y.description.map((l) => (l.trim() === "{{chapters}}" ? ch : fillTemplate(l, vars, "youtube.description"))).join("\n");
  const tags = [...new Set([...y.tags, ...ctx.episode.tags])];
  const warn = title.length > 100 ? `\n[!] title is ${title.length} characters; YouTube allows 100\n` : "";
  const file = path.join(outDir(ctx), "youtube.txt");
  fs.writeFileSync(file, `TITLE\n${title}\n${warn}\nDESCRIPTION\n${description}\n\nTAGS\n${tags.join(", ")}\n`);
  return file;
}

/** Narration only, with long silences shortened for listeners, and chapter markers. */
export function writeAudioOnly(ctx: EpisodeCtx, tl: Timeline) {
  const { maxPause, bitrate } = ctx.project.series.audioOnly;
  const lock = readLock(ctx);
  const clips: { file: string; start: number }[] = [];
  const marks: { t: number; title: string }[] = [];
  let t = 0.4, prevEnd: number | null = null;
  for (const s of tl.segments) {
    s.cues.forEach((c, i) => {
      if (prevEnd !== null) t += Math.min(c.start - prevEnd, maxPause);
      if (i === 0) marks.push({ t: marks.length ? t : 0, title: s.title });
      clips.push({ file: path.join(ctx.project.code, lock.cues[c.id].audio), start: +t.toFixed(3) });
      t += c.end - c.start; prevEnd = c.end;
    });
  }
  const total = t + 1.5;
  const dir = outDir(ctx), wav = path.join(ctx.project.code, ".cache", `${ctx.key}-audio-only.wav`);
  mixAt(clips, total, wav, ctx.project.series.audio.sampleRate);
  const ms = (x: number) => Math.round(x * 1000);
  const meta = [";FFMETADATA1", `title=${tl.title}`, `artist=${tl.video.brand}`, `album=${tl.series.title}`, `track=${tl.stop.number}`, ""]
    .concat(marks.flatMap((m, i) => ["[CHAPTER]", "TIMEBASE=1/1000", `START=${ms(m.t)}`, `END=${ms(marks[i + 1]?.t ?? total)}`, `title=${m.title}`, ""])).join("\n");
  const metaFile = path.join(ctx.project.code, ".cache", `${ctx.key}-chapters.txt`);
  fs.writeFileSync(metaFile, meta);
  const out = path.join(dir, `${ctx.meta.id}-audio-only.mp3`);
  ff(["-i", wav, "-i", metaFile, "-map", "0:a", "-map_metadata", "1", "-map_chapters", "1", "-c:a", "libmp3lame", "-b:a", bitrate, "-id3v2_version", "3", out]);
  return { file: out, seconds: total, chapters: marks.length, saved: tl.duration - total };
}

export async function renderShorts(ctx: EpisodeCtx, tl: Timeline, log: (s: string) => void) {
  const root = ctx.project.code, dir = path.join(outDir(ctx), "shorts");
  const cache = path.join(root, ".cache", "shorts", ctx.key);
  fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(cache, { recursive: true });
  // the whole visual code (scenes and the Short layout), so any change to either re-renders the Short
  const code = codeHash(root);
  const results: { id: string; file: string; seconds: number; rendered: boolean; warning?: string }[] = [];
  for (const seg of tl.segments.filter((s) => s.short)) {
    const key = sha(code, segmentKey(tl, seg, code), seg.shortTitle, tl.shorts, tl.badge);
    const cached = path.join(cache, `${seg.id}-${key}.mp4`);
    const out = path.join(dir, `${ctx.meta.id}-short-${seg.id}.mp4`);
    const seconds = seg.durationInFrames / tl.fps;
    let rendered = false;
    if (!fs.existsSync(cached)) {
      const serveUrl = await getBundle(root, log);
      const id = `${ctx.key}-short-${seg.id}`, inputProps = { episode: ctx.key, segment: seg.id };
      const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: browserExecutable() });
      log(`rendering Short: ${seg.id}`);
      await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, outputLocation: cached + ".part.mp4", inputProps, imageFormat: "jpeg", jpegQuality: 92, browserExecutable: browserExecutable(), audioBitrate: "160k" });
      fs.renameSync(cached + ".part.mp4", cached);
      for (const f of fs.readdirSync(cache)) if (f.startsWith(seg.id + "-") && path.join(cache, f) !== cached) fs.rmSync(path.join(cache, f));
      rendered = true;
    }
    fs.copyFileSync(cached, out);
    results.push({ id: seg.id, file: out, seconds, rendered, ...(seconds > tl.shorts.maxSeconds ? { warning: `${seconds.toFixed(0)} s is over the ${tl.shorts.maxSeconds} s limit for Shorts` } : {}) });
  }
  return results;
}

export async function renderThumbnail(ctx: EpisodeCtx, log: (s: string) => void) {
  const serveUrl = await getBundle(ctx.project.code, log);
  const id = `${ctx.key}-thumbnail`, inputProps = { episode: ctx.key };
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: browserExecutable() });
  const out = path.join(outDir(ctx), `${ctx.meta.id}-thumbnail.jpg`);
  await renderStill({ composition, serveUrl, output: out, frame: 0, inputProps, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: browserExecutable() });
  return out;
}

export async function packageEpisode(ctx: EpisodeCtx, opts: { shorts?: boolean }, log: (s: string) => void) {
  const video = await renderEpisode(ctx, {}, log);
  const tl = readTimeline(ctx);
  const shorts = opts.shorts === false ? [] : await renderShorts(ctx, tl, log);
  const thumbnail = await renderThumbnail(ctx, log);
  const captions = writeCaptions(ctx, tl);
  const audio = writeAudioOnly(ctx, tl);
  const youtube = writeYoutube(ctx, tl);
  return { video, shorts, thumbnail, captions, audio, youtube, chapters: chapters(tl) };
}
