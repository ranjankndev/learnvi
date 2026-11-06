import fs from "node:fs";
import path from "node:path";
import { TakesFileSchema, type TakesFile } from "../../schema/index.js";
import { ConfigError, fileHash, sha, templateContext, type EpisodeCtx } from "../project.js";
import { parseScript, type Cue } from "../script.js";
import { duration, postProcess, runWorker, type WorkerJob } from "./tools.js";
import { alignScript, type HeardWord } from "./align.js";

export type Source = "tts" | "human";
export type CueStatus = "ready" | "needs-build" | "needs-voice" | "stale-take" | "missing-take";

export interface CueState {
  cue: Cue;
  source: Source;
  takeId: string; // "tts" or "v3"
  status: CueStatus;
  warning?: string;
  raw: string; // unprocessed audio
  proc: string; // processed audio (cache)
  align: string; // word timings (cache)
  voice: { voice: string; speed: number; lang: string };
}

export interface LockCue {
  segment: string;
  display: string;
  spoken: string;
  textHash: string;
  source: Source;
  take: string;
  audio: string; // path relative to the repo root
  duration: number;
  marks: Record<string, number>; // seconds from the start of the cue
  words: { w: string; start: number }[]; // script words with times, for captions
  matchScore: number;
  /** extra silence after this cue, e.g. [c12 after=3] for a pause-and-predict moment */
  after?: number;
  warning?: string;
}
export interface Lock { version: 1; episode: string; cues: Record<string, LockCue>; order: string[] }

const rel = (ctx: EpisodeCtx, p: string) => path.relative(ctx.project.root, p).split(path.sep).join("/");
const cacheDir = (ctx: EpisodeCtx, kind: string) => path.join(ctx.project.root, ".cache", kind);

export function readScript(ctx: EpisodeCtx) {
  return parseScript(ctx.scriptFile, templateContext(ctx), ctx.project.lexicon);
}

// ---------- takes ----------
export function takesPath(ctx: EpisodeCtx, cueId: string) { return path.join(ctx.takesDir, cueId, "takes.json"); }
export function loadTakes(ctx: EpisodeCtx, cueId: string): TakesFile {
  const f = takesPath(ctx, cueId);
  return fs.existsSync(f) ? TakesFileSchema.parse(JSON.parse(fs.readFileSync(f, "utf8"))) : { selected: "tts", takes: [] };
}
export function saveTakes(ctx: EpisodeCtx, cueId: string, t: TakesFile) {
  fs.mkdirSync(path.dirname(takesPath(ctx, cueId)), { recursive: true });
  fs.writeFileSync(takesPath(ctx, cueId), JSON.stringify(t, null, 2) + "\n");
}

/** Copy a recording into takes/<ep>/<cue>/vN.<ext> and select it. */
export function importTake(ctx: EpisodeCtx, cue: Cue, file: string) {
  if (!fs.existsSync(file)) throw new ConfigError(`No such file: ${file}`);
  const t = loadTakes(ctx, cue.id);
  const n = t.takes.reduce((m, x) => Math.max(m, +x.id.slice(1) || 0), 0) + 1;
  const id = `v${n}`, ext = path.extname(file).toLowerCase() || ".wav";
  const dest = path.join(ctx.takesDir, cue.id, `${id}${ext}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  t.takes.push({ id, file: path.basename(dest), textHash: cue.textHash, text: cue.spoken, importedAt: new Date().toISOString(), original: path.basename(file) });
  t.selected = id;
  saveTakes(ctx, cue.id, t);
  return id;
}

export function selectTake(ctx: EpisodeCtx, cueId: string, takeId: string) {
  const t = loadTakes(ctx, cueId);
  if (takeId !== "tts" && !t.takes.some((x) => x.id === takeId))
    throw new ConfigError(`${cueId} has no take ${takeId}. Takes: tts${t.takes.map((x) => ", " + x.id).join("")}`);
  t.selected = takeId;
  saveTakes(ctx, cueId, t);
}

// ---------- planning ----------
export function plan(ctx: EpisodeCtx): CueState[] {
  const { series } = ctx.project;
  const parsed = readScript(ctx);
  if (parsed.problems.length) throw new ConfigError("script.md has problems (run: press check)\n" + parsed.problems.map((p) => `  line ${p.line}: ${p.msg}`).join("\n"));
  return parsed.cues.map((cue) => {
    const voice = { voice: cue.attrs.voice ?? series.voice.voice, speed: +(cue.attrs.speed ?? series.voice.speed), lang: series.voice.lang };
    const takes = loadTakes(ctx, cue.id);
    let source: Source = "tts", takeId = "tts", raw = "", warning: string | undefined;
    let status: CueStatus = "ready";
    if (takes.selected !== "tts") {
      const take = takes.takes.find((t) => t.id === takes.selected);
      if (!take) { status = "missing-take"; warning = `selected take ${takes.selected} is not in takes.json`; }
      else if (take.textHash !== cue.textHash) {
        const pol = series.audio.staleTakePolicy;
        warning = `script text changed since take ${take.id} was recorded`;
        if (pol === "keep") { source = "human"; takeId = take.id; raw = path.join(ctx.takesDir, cue.id, take.file); }
        status = "stale-take";
      } else { source = "human"; takeId = take.id; raw = path.join(ctx.takesDir, cue.id, take.file); }
    }
    if (source === "tts") raw = path.join(cacheDir(ctx, "tts"), `${sha("kokoro", voice, cue.spoken)}.wav`);
    const rawKey = source === "human" && fs.existsSync(raw) ? fileHash(raw) : path.basename(raw);
    const { sampleRate, loudnessLUFS, truePeak, trimSilence, padSeconds } = series.audio; // only what changes the sound
    const procKey = sha(rawKey, { sampleRate, loudnessLUFS, truePeak, trimSilence, padSeconds });
    const proc = path.join(cacheDir(ctx, "proc"), `${procKey}.wav`);
    const align = path.join(cacheDir(ctx, "align"), `${procKey}.json`);
    if (status === "ready" || status === "stale-take") {
      if (!fs.existsSync(raw)) status = source === "tts" ? (status === "stale-take" ? status : "needs-voice") : "missing-take";
      else if (status === "ready" && (!fs.existsSync(proc) || !fs.existsSync(align))) status = "needs-build";
    }
    return { cue, source, takeId, status, warning, raw, proc, align, voice };
  });
}

// ---------- build ----------
export interface BuildReport { tts: number; processed: number; aligned: number; reused: number; warnings: string[] }

export function buildAudio(ctx: EpisodeCtx, log: (s: string) => void = console.log): { lock: Lock; report: BuildReport } {
  const { series, root } = ctx.project;
  const states = plan(ctx);
  const report: BuildReport = { tts: 0, processed: 0, aligned: 0, reused: 0, warnings: [] };
  for (const s of states) {
    if (s.status === "missing-take") throw new ConfigError(`${s.cue.id}: ${s.warning ?? "take file missing"}`);
    if (s.status === "stale-take" && series.audio.staleTakePolicy === "error")
      throw new ConfigError(`${s.cue.id}: ${s.warning}. Record a new take, or run: press use ${ctx.meta.id} ${s.cue.id} tts`);
    if (s.warning) report.warnings.push(`${s.cue.id}: ${s.warning}${s.source === "tts" ? " → using TTS until you record a new take" : ""}`);
  }
  // 1. TTS for anything without raw audio
  const tts: WorkerJob[] = states.filter((s) => s.source === "tts" && !fs.existsSync(s.raw))
    .map((s) => ({ type: "tts", id: s.cue.id, text: s.cue.spoken, ...s.voice, out: s.raw }));
  if (tts.length) {
    log(`voicing ${tts.length} cue(s) with Kokoro…`);
    fs.mkdirSync(cacheDir(ctx, "tts"), { recursive: true });
    const r = runWorker(root, tts);
    const bad = Object.entries(r).filter(([, v]) => !v.ok);
    if (bad.length) throw new Error("TTS failed: " + bad.map(([k, v]) => `${k}: ${v.error}`).join("; "));
    report.tts = tts.length;
  }
  // re-plan so cache keys reflect the new raw files
  const st2 = plan(ctx);
  // 2. post-process
  for (const s of st2) {
    if (!fs.existsSync(s.proc)) { postProcess(s.raw, s.proc, series.audio); report.processed++; log(`processed ${s.cue.id} (${s.source})`); }
  }
  // 3. align
  const al: WorkerJob[] = st2.filter((s) => !fs.existsSync(s.align)).map((s) => ({ type: "align", id: s.cue.id, wav: s.proc, out: s.align }));
  if (al.length) {
    log(`aligning ${al.length} cue(s)…`);
    fs.mkdirSync(cacheDir(ctx, "align"), { recursive: true });
    const r = runWorker(root, al);
    const bad = Object.entries(r).filter(([, v]) => !v.ok);
    if (bad.length) throw new Error("Alignment failed: " + bad.map(([k, v]) => `${k}: ${v.error}`).join("; "));
    report.aligned = al.length;
  }
  report.reused = st2.length - report.processed;
  // 4. lock
  const lock: Lock = { version: 1, episode: ctx.meta.id, order: st2.map((s) => s.cue.id), cues: {} };
  for (const s of st2) {
    const dur = duration(s.proc);
    const heard = JSON.parse(fs.readFileSync(s.align, "utf8")) as { words: HeardWord[] };
    const { wordTimes, score } = alignScript(s.cue.display, heard.words, dur);
    const marks = Object.fromEntries(Object.entries(s.cue.marks).map(([k, i]) => [k, +(wordTimes[Math.min(i, wordTimes.length - 1)] ?? 0).toFixed(3)]));
    let warning = s.warning;
    if (s.source === "human" && score < series.audio.minMatchScore) {
      warning = `take ${s.takeId} matches only ${Math.round(score * 100)}% of the script words — check it was read as written`;
      report.warnings.push(`${s.cue.id}: ${warning}`);
    }
    lock.cues[s.cue.id] = {
      segment: s.cue.segment, display: s.cue.display, spoken: s.cue.spoken, textHash: s.cue.textHash,
      source: s.source, take: s.takeId, audio: rel(ctx, s.proc), duration: dur, marks,
      words: s.cue.display.split(/\s+/).filter(Boolean).map((w, i) => ({ w, start: wordTimes[i] })),
      matchScore: score, ...(s.cue.attrs.after ? { after: +s.cue.attrs.after } : {}), ...(warning ? { warning } : {}),
    };
  }
  fs.writeFileSync(ctx.lockFile, JSON.stringify(lock, null, 2) + "\n");
  return { lock, report };
}

export function readLock(ctx: EpisodeCtx): Lock {
  if (!fs.existsSync(ctx.lockFile)) throw new ConfigError(`No audio.lock.json for ${ctx.meta.id} yet. Run: press audio ${ctx.meta.id}`);
  return JSON.parse(fs.readFileSync(ctx.lockFile, "utf8"));
}
