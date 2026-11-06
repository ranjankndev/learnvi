/**
 * Review studio: a local web app over the same files the CLI uses.
 * Nothing here has its own database; everything it changes is a file in the repo:
 *   script.md (text edits) · takes/<ep>/<cue>/ (recordings) · episodes/<ep>/review.json (notes, approvals)
 */
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadEpisode, loadProject, sha, type EpisodeCtx } from "../core/project.js";
import { getCueRaw, setCueRaw } from "../core/script.js";
import { importTake, loadTakes, plan, readLock, selectTake } from "../core/audio/pipeline.js";
import { outDir } from "../core/timeline.js";

// ---------- review.json ----------
type ReviewState = "open" | "approved" | "retake";
interface Comment { at: string; text: string }
interface Review { cues: Record<string, { state: ReviewState; textHash?: string; take?: string; comments: Comment[] }> }

const reviewFile = (ctx: EpisodeCtx) => path.join(ctx.dir, "review.json");
function loadReview(ctx: EpisodeCtx): Review {
  try { return JSON.parse(fs.readFileSync(reviewFile(ctx), "utf8")); } catch { return { cues: {} }; }
}
function saveReview(ctx: EpisodeCtx, r: Review) { fs.writeFileSync(reviewFile(ctx), JSON.stringify(r, null, 2) + "\n"); }

// ---------- state for the page ----------
function episodeState(root: string, ref: string) {
  const project = loadProject(root);
  const ctx = loadEpisode(project, ref);
  const states = plan(ctx);
  let lock: ReturnType<typeof readLock> | null = null;
  try { lock = readLock(ctx); } catch { /* not built */ }
  let tl: any = null;
  try { tl = JSON.parse(fs.readFileSync(path.join(outDir(ctx), "timeline.json"), "utf8")); } catch { /* not built */ }
  const review = loadReview(ctx);
  const starts: Record<string, number> = {};
  tl?.segments.forEach((s: any) => s.cues.forEach((c: any) => (starts[c.id] = c.start)));
  const video = !fs.existsSync(outDir(ctx)) ? undefined : fs.readdirSync(outDir(ctx)).find((f) => f.startsWith(ctx.meta.id + "-") && f.endsWith(".mp4"));
  const cues = states.map((s) => {
    const l = lock?.cues[s.cue.id];
    const built = !!l && l.textHash === s.cue.textHash && l.take === s.takeId;
    const r = review.cues[s.cue.id] ?? { state: "open", comments: [] };
    // an approval only holds for the text and take that were approved
    const changed = r.state === "approved" && (r.textHash !== s.cue.textHash || r.take !== s.takeId);
    return {
      id: s.cue.id, segment: s.cue.segment, display: s.cue.display, raw: getCueRaw(ctx.scriptFile, s.cue.id) ?? "",
      note: s.cue.note, source: s.source, take: s.takeId, status: s.status, warning: built ? l!.warning ?? s.warning : s.warning,
      duration: built ? l!.duration : null, matchScore: built ? l!.matchScore : null, start: starts[s.cue.id] ?? null,
      audio: built ? `/audio/${ctx.meta.id}/${s.cue.id}?v=${sha(l!.audio)}` : null,
      takes: loadTakes(ctx, s.cue.id).takes.map((t) => ({ id: t.id, importedAt: t.importedAt, current: t.textHash === s.cue.textHash, url: `/take/${ctx.meta.id}/${s.cue.id}/${t.id}` })),
      review: { ...r, state: changed ? "open" : r.state, changedSinceApproval: changed },
    };
  });
  const segments = ctx.episode.segments.map((s) => {
    const t = tl?.segments.find((x: any) => x.id === s.id);
    return { id: s.id, kind: s.kind, title: t?.title ?? s.title ?? s.id, start: t ? t.startFrame / tl.fps : null, short: s.short };
  });
  return {
    id: ctx.meta.id, title: ctx.meta.title, stop: ctx.meta.stop, number: ctx.meta.number, segments, cues,
    video: video ? `/video/${ctx.meta.id}/${video}?v=${fs.statSync(path.join(outDir(ctx), video)).mtimeMs}` : null,
    videoStale: !!video && !!lock && fs.statSync(ctx.lockFile).mtimeMs > fs.statSync(path.join(outDir(ctx), video)).mtimeMs,
    episodes: project.series.episodes.filter((e) => fs.existsSync(path.join(root, "episodes", e.folder ?? e.id, "episode.json"))).map((e) => ({ id: e.id, title: e.title })),
  };
}

// ---------- jobs: run the CLI, stream its output ----------
const clients = new Set<http.ServerResponse>();
const send = (event: string, data: unknown) => { for (const c of clients) c.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
let job: { cmd: string; started: number } | null = null;

function runJob(root: string, args: string[]) {
  if (job) throw new Error(`"${job.cmd}" is still running`);
  job = { cmd: `press ${args.join(" ")}`, started: Date.now() };
  send("job", { state: "start", cmd: job.cmd });
  const p = spawn(process.execPath, [path.join(root, "bin", "press.mjs"), ...args], { cwd: root, env: { ...process.env, FORCE_COLOR: "0" } });
  const line = (b: Buffer) => b.toString().split("\n").filter((l) => l.trim() && !/memory|cgroup|docker/i.test(l)).forEach((l) => send("log", l.replace(/\x1b\[[0-9;]*m/g, "")));
  p.stdout.on("data", line); p.stderr.on("data", line);
  p.on("close", (code) => { send("job", { state: code === 0 ? "done" : "failed", cmd: job!.cmd, seconds: (Date.now() - job!.started) / 1000 }); job = null; });
}

// ---------- http ----------
const json = (res: http.ServerResponse, code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const readBody = (req: http.IncomingMessage) => new Promise<Buffer>((ok, bad) => { const b: Buffer[] = []; req.on("data", (c) => b.push(c)); req.on("end", () => ok(Buffer.concat(b))); req.on("error", bad); });

/** Serve a file with Range support, so audio and video can seek. */
function serveFile(req: http.IncomingMessage, res: http.ServerResponse, file: string, type: string) {
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const size = fs.statSync(file).size, range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : size - 1;
    res.writeHead(206, { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "content-length": size });
    fs.createReadStream(file).pipe(res);
  }
}

export function startReviewServer(root: string, port: number) {
  const page = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "app.html"), "utf8");
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x"), parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    try {
      if (req.method === "GET" && url.pathname === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(page); return; }
      if (url.pathname === "/api/events") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
        res.write(`event: hello\ndata: ${JSON.stringify({ job: job?.cmd ?? null })}\n\n`);
        clients.add(res); req.on("close", () => clients.delete(res)); return;
      }
      if (parts[0] === "api" && parts[1] === "episode" && req.method === "GET") return json(res, 200, episodeState(root, parts[2] ?? "ep03"));
      if (parts[0] === "audio") {
        const ctx = loadEpisode(loadProject(root), parts[1]);
        const c = readLock(ctx).cues[parts[2]];
        return serveFile(req, res, path.join(root, c.audio), "audio/wav");
      }
      if (parts[0] === "take") {
        const ctx = loadEpisode(loadProject(root), parts[1]);
        const t = loadTakes(ctx, parts[2]).takes.find((x) => x.id === parts[3]);
        return serveFile(req, res, path.join(ctx.takesDir, parts[2], t?.file ?? "-"), "audio/wav");
      }
      if (parts[0] === "video") {
        const ctx = loadEpisode(loadProject(root), parts[1]);
        return serveFile(req, res, path.join(outDir(ctx), path.basename(parts[2])), "video/mp4");
      }
      // POST /api/cue/:ep/:cue/(take|use|text|review)
      if (req.method === "POST" && parts[0] === "api" && parts[1] === "cue") {
        const ctx = loadEpisode(loadProject(root), parts[2]), cueId = parts[3], action = parts[4];
        const cue = plan(ctx).find((s) => s.cue.id === cueId)?.cue;
        if (!cue) return json(res, 404, { error: `no cue ${cueId}` });
        const body = await readBody(req);
        if (action === "take") {
          // browser recordings arrive as webm/ogg; store every take as 48 kHz mono WAV
          const ext = /ogg/.test(req.headers["content-type"] ?? "") ? ".ogg" : /wav/.test(req.headers["content-type"] ?? "") ? ".wav" : ".webm";
          const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "take-"));
          const src = path.join(tmp, "upload" + ext), wav = path.join(tmp, `${cueId}-${Date.now()}.wav`);
          fs.writeFileSync(src, body);
          const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", wav], { encoding: "utf8" });
          if (r.status !== 0) return json(res, 400, { error: "could not read that audio: " + r.stderr.trim() });
          const id = importTake(ctx, cue, wav);
          fs.rmSync(tmp, { recursive: true, force: true });
          send("changed", { episode: ctx.meta.id, cue: cueId });
          return json(res, 200, { take: id });
        }
        const data = body.length ? JSON.parse(body.toString()) : {};
        if (action === "use") { selectTake(ctx, cueId, String(data.take)); send("changed", { episode: ctx.meta.id, cue: cueId }); return json(res, 200, { ok: true }); }
        if (action === "text") { setCueRaw(ctx.scriptFile, cueId, String(data.raw ?? "")); send("changed", { episode: ctx.meta.id, cue: cueId }); return json(res, 200, { ok: true }); }
        if (action === "review") {
          const rv = loadReview(ctx), cur = rv.cues[cueId] ?? { state: "open" as ReviewState, comments: [] };
          if (data.state) {
            cur.state = data.state;
            if (data.state === "approved") { cur.textHash = cue.textHash; cur.take = plan(ctx).find((s) => s.cue.id === cueId)!.takeId; }
          }
          if (data.comment) cur.comments.push({ at: new Date().toISOString(), text: String(data.comment).slice(0, 2000) });
          if (typeof data.removeComment === "number") cur.comments.splice(data.removeComment, 1);
          rv.cues[cueId] = cur; saveReview(ctx, rv);
          return json(res, 200, { ok: true });
        }
      }
      // POST /api/run/:ep/(audio|render|package)
      if (req.method === "POST" && parts[0] === "api" && parts[1] === "run") {
        const what = parts[3];
        if (!["audio", "render", "package"].includes(what)) return json(res, 400, { error: "unknown job" });
        runJob(root, [what, parts[2]]);
        return json(res, 200, { ok: true });
      }
      json(res, 404, { error: "not found" });
    } catch (e) {
      json(res, 500, { error: (e as Error).message });
    }
  });
  server.listen(port, "127.0.0.1");
  return server;
}
