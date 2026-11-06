import fs from "node:fs";
process.stdout.on("error", (e: NodeJS.ErrnoException) => { if (e.code === "EPIPE") process.exit(0); });
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { Command } from "commander";
import { CODE_ROOT, ConfigError, loadEpisode, loadProject, findRoot, listSeries, setDefaultSeries } from "../core/project.js";
import { assignIds } from "../core/script.js";
import { checkAll } from "../core/check.js";
import { buildAudio, importTake, loadTakes, plan, readLock, readScript, selectTake, type CueState } from "../core/audio/pipeline.js";
import { buildTimeline, writeTimelineOutputs, outDir } from "../core/timeline.js";
import { readTimeline, renderEpisode, still } from "../core/render.js";
import { clock, packageEpisode } from "../core/package.js";
import { startReviewServer } from "../review/server.js";
import { KIT } from "../../remotion/kit/specs.js";
import { draftEpisode } from "../core/draft.js";

const C = process.stdout.isTTY ? { r: "\x1b[31m", g: "\x1b[32m", y: "\x1b[33m", b: "\x1b[36m", d: "\x1b[2m", x: "\x1b[0m", B: "\x1b[1m" } : { r: "", g: "", y: "", b: "", d: "", x: "", B: "" };
/** the series folder this command works on (see `press series`) */
const root = () => findRoot(program.opts().series);
const ep = (ref: string) => loadEpisode(loadProject(root()), ref);
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const STATUS: Record<CueState["status"], string> = {
  ready: `${C.g}ready${C.x}`, "needs-build": `${C.b}needs build${C.x}`, "needs-voice": `${C.b}needs voice${C.x}`,
  "stale-take": `${C.y}stale take${C.x}`, "missing-take": `${C.r}missing take${C.x}`,
};

const program = new Command().name("press").description("learnvi studio: config-driven video production")
  .option("-s, --series <id>", "which series (folder under series/); see `press series`");

program.command("series [id]").description("list the series, or set the default one")
  .action((id?: string) => {
    if (id) { setDefaultSeries(id); console.log(`${C.g}✓${C.x} default series is now ${id}`); return; }
    let cur = ""; try { cur = path.basename(root()); } catch { /* none chosen */ }
    for (const s of listSeries()) {
      const p = loadProject(path.join(CODE_ROOT, "series", s));
      console.log(`${s === cur ? "▶" : " "} ${s.padEnd(16)} ${p.series.title}  ${C.d}(${p.series.episodes.length} episodes)${C.x}`);
    }
  });

program.command("check [episode]").description("validate config, template and scripts")
  .action((e?: string) => {
    const f = checkAll(loadProject(root()), e);
    for (const x of f) {
      const tag = x.level === "error" ? `${C.r}error${C.x}` : x.level === "warn" ? `${C.y}warn ${C.x}` : `${C.d}info ${C.x}`;
      console.log(`${tag}  ${C.B}${x.where}${C.x}  ${x.msg}`);
    }
    const errs = f.filter((x) => x.level === "error").length;
    console.log(errs ? `\n${C.r}${errs} error(s)${C.x}` : `\n${C.g}✓ all checks passed${C.x}`);
    if (errs) process.exitCode = 1;
  });

program.command("ids <episode>").description("add cue ids to script paragraphs that have none")
  .action((e: string) => { const c = ep(e); const a = assignIds(c.scriptFile); console.log(a.length ? `added ${a.join(", ")}` : "every paragraph already has an id"); });

program.command("status <episode>").description("show every cue: source, status, length")
  .action((e: string) => {
    const c = ep(e);
    const states = plan(c);
    let lock: ReturnType<typeof readLock> | null = null;
    try { lock = readLock(c); } catch { /* not built yet */ }
    console.log(`${C.B}${c.meta.id} · ${c.meta.title}${C.x}\n`);
    console.log(`${C.d}cue   segment      source   status        length  text${C.x}`);
    let seg = "";
    for (const s of states) {
      const l = lock?.cues[s.cue.id];
      const len = l && l.textHash === s.cue.textHash && l.take === s.takeId ? `${l.duration.toFixed(1)}s` : "  —  ";
      const src = s.source === "human" ? `${C.g}${s.takeId.padEnd(8)}${C.x}` : `tts     `;
      console.log(`${s.cue.id.padEnd(5)} ${(s.cue.segment === seg ? "" : s.cue.segment).padEnd(12)} ${src} ${STATUS[s.status].padEnd(22)} ${len.padStart(6)}  ${C.d}${clip(s.cue.display, 52)}${C.x}`);
      if (s.warning) console.log(`      ${C.y}↳ ${s.warning}${C.x}`);
      seg = s.cue.segment;
    }
    const todo = states.filter((s) => s.status !== "ready").length;
    console.log(`\n${states.length} cues · ${states.filter((s) => s.source === "human").length} recorded by you · ${todo ? `${todo} need \`press audio ${c.meta.id}\`` : "all ready"}`);
  });

program.command("audio <episode>").alias("build").description("voice, process and align every cue that changed; write lock, timeline, narration")
  .action((e: string) => {
    const c = ep(e), t0 = Date.now();
    const { lock, report } = buildAudio(c, (s) => console.log(`${C.d}…${C.x} ${s}`));
    const tl = buildTimeline(c, lock);
    const dir = writeTimelineOutputs(c, tl);
    report.warnings.forEach((w) => console.log(`${C.y}warn${C.x}  ${w}`));
    console.log(`\n${C.g}✓${C.x} ${c.meta.id}: ${Object.keys(lock.cues).length} cues · ${report.tts} voiced · ${report.processed} processed · ${report.aligned} aligned · ${report.reused} reused from cache · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`  running time ${fmt(tl.duration)} · ${tl.durationInFrames} frames at ${tl.fps} fps`);
    console.log(`  ${path.relative(process.cwd(), dir)}/narration.wav · timeline.json · captions.srt`);
  });

program.command("timeline <episode>").description("print segment and cue start times from the current lock")
  .option("--refs", "also list every cue/mark reference")
  .action((e: string, o: { refs?: boolean }) => {
    const c = ep(e), tl = buildTimeline(c, readLock(c));
    for (const s of tl.segments) {
      console.log(`${C.B}${fmt(s.start).padStart(7)}${C.x}  ${s.id.padEnd(12)} ${C.d}${s.component.padEnd(16)} ${(s.end - s.start).toFixed(1)}s${C.x}`);
      for (const q of s.cues) console.log(`         ${fmt(q.start).padStart(7)} ${q.id}  ${C.d}${clip(q.text, 60)}${C.x}`);
    }
    console.log(`\ntotal ${fmt(tl.duration)}`);
    if (o.refs) for (const [k, v] of Object.entries(tl.refs)) if (k.includes("@")) console.log(`  ${k.padEnd(14)} ${fmt(v)}`);
  });

program.command("take <episode> <cue> <file>").description("import your recording of one cue and select it")
  .action((e: string, cueId: string, file: string) => {
    const c = ep(e);
    const cue = readScript(c).cues.find((x) => x.id === cueId.toLowerCase());
    if (!cue) throw new ConfigError(`No cue ${cueId} in ${c.meta.id}`);
    const id = importTake(c, cue, path.resolve(file));
    console.log(`${C.g}✓${C.x} saved as takes/${c.meta.id}/${cue.id}/${id} and selected. Now run: press audio ${c.meta.id}`);
  });

program.command("takes <episode> <cue>").description("list the takes of one cue")
  .action((e: string, cueId: string) => {
    const c = ep(e), t = loadTakes(c, cueId.toLowerCase());
    const cue = readScript(c).cues.find((x) => x.id === cueId.toLowerCase());
    console.log(`${t.selected === "tts" ? "▶" : " "} tts   generated voice`);
    for (const x of t.takes) console.log(`${t.selected === x.id ? "▶" : " "} ${x.id.padEnd(5)} ${x.importedAt.slice(0, 16).replace("T", " ")}  ${x.original ?? ""}${cue && x.textHash !== cue.textHash ? `  ${C.y}(older script text)${C.x}` : ""}`);
  });

program.command("use <episode> <cue> <take>").description('switch a cue to another take ("tts", "v1", "v2"…)')
  .action((e: string, cueId: string, take: string) => { const c = ep(e); selectTake(c, cueId.toLowerCase(), take); console.log(`${C.g}✓${C.x} ${cueId} now uses ${take}. Run: press audio ${c.meta.id}`); });

/** Resolve "--at c18@merge", "--t 3.5" (seconds into the segment) or "--frame 40" to a frame within the segment. */
function frameFor(tl: ReturnType<typeof readTimeline>, segId: string, o: { at?: string; t?: string; frame?: string }) {
  const seg = tl.segments.find((s) => s.id === segId);
  if (!seg) throw new ConfigError(`No segment "${segId}". Segments: ${tl.segments.map((s) => s.id).join(", ")}`);
  if (o.frame) return { seg, frame: +o.frame };
  if (o.t) return { seg, frame: Math.round(+o.t * tl.fps) };
  if (o.at) {
    const t = tl.refs[o.at.toLowerCase()];
    if (t === undefined) throw new ConfigError(`No cue or mark "${o.at}"`);
    return { seg, frame: Math.round(t * tl.fps) - seg.startFrame + 20 };
  }
  return { seg, frame: Math.round(seg.durationInFrames * 0.85) };
}

program.command("still <episode> <segment>").description("render one frame of a segment to PNG (default: near its end)")
  .option("--at <ref>", "just after a cue or mark, e.g. c18@merge").option("--t <seconds>", "seconds into the segment").option("--frame <n>", "frame within the segment")
  .option("-o, --out <file>", "output PNG")
  .action(async (e: string, segId: string, o: { at?: string; t?: string; frame?: string; out?: string }) => {
    const c = ep(e), tl = readTimeline(c);
    const { frame } = frameFor(tl, segId, o);
    const file = o.out ?? path.join(outDir(c), "stills", `${segId}-${frame}.png`);
    await still(c, segId, frame, file, (s) => console.log(`${C.d}…${C.x} ${s}`));
    console.log(`${C.g}✓${C.x} ${path.relative(process.cwd(), file)}`);
  });

program.command("sheet <episode>").description("contact sheet: one still per segment, in one PNG")
  .action(async (e: string) => {
    const c = ep(e), tl = readTimeline(c);
    const dir = path.join(outDir(c), "stills");
    const files: string[] = [];
    for (const s of tl.segments) {
      const f = path.join(dir, `sheet-${String(files.length).padStart(2, "0")}-${s.id}.png`);
      await still(c, s.id, frameFor(tl, s.id, {}).frame, f, (m) => console.log(`${C.d}…${C.x} ${m}`));
      files.push(f); console.log(`${C.d}…${C.x} ${s.id}`);
    }
    const out = path.join(outDir(c), `${c.meta.id}-sheet.png`);
    const cols = 3, rows = Math.ceil(files.length / cols);
    const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex",
      files.map((_, i) => `[${i}:v]scale=640:-1[s${i}]`).join(";") + ";" + files.map((_, i) => `[s${i}]`).join("") + `xstack=inputs=${files.length}:layout=` +
      files.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join("|") + `:fill=black`, "-frames:v", "1", out], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(r.stderr);
    console.log(`${C.g}✓${C.x} ${path.relative(process.cwd(), out)} (${files.length} segments, ${cols}×${rows})`);
  });

program.command("render <episode>").description("render the video; only segments whose look or timing changed are re-rendered")
  .option("--only <segments>", "force these segments (comma-separated)").option("--force", "re-render everything")
  .action(async (e: string, o: { only?: string; force?: boolean }) => {
    const c = ep(e);
    const r = await renderEpisode(c, { only: o.only?.split(","), force: o.force }, (s) => console.log(`${C.d}…${C.x} ${s}`));
    console.log(`\n${C.g}✓${C.x} ${path.relative(process.cwd(), r.output)} · rendered ${r.rendered.length} segment(s)${r.rendered.length ? ` (${r.rendered.join(", ")})` : ""} · reused ${r.reused.length} · ${r.seconds.toFixed(0)}s`);
  });

program.command("package <episode>").description("everything to publish: video, Shorts, thumbnail, audio-only MP3, captions, YouTube text")
  .option("--no-shorts", "skip the Shorts")
  .action(async (e: string, o: { shorts: boolean }) => {
    const c = ep(e);
    const r = await packageEpisode(c, { shorts: o.shorts }, (s) => console.log(`${C.d}…${C.x} ${s}`));
    const rel = (f: string) => path.relative(process.cwd(), f);
    console.log(`\n${C.B}${c.meta.id} · ${c.meta.title}${C.x}`);
    console.log(`  video       ${rel(r.video.output)}  (${r.video.rendered.length} segment(s) rendered, ${r.video.reused.length} reused)`);
    for (const s of r.shorts) console.log(`  short       ${rel(s.file)}  ${s.seconds.toFixed(0)}s${s.rendered ? "" : " (cached)"}${s.warning ? `  ${C.y}${s.warning}${C.x}` : ""}`);
    console.log(`  thumbnail   ${rel(r.thumbnail)}`);
    console.log(`  audio-only  ${rel(r.audio.file)}  ${clock(r.audio.seconds)} with ${r.audio.chapters} chapters (${r.audio.saved.toFixed(0)}s of silence trimmed)`);
    console.log(`  captions    ${r.captions.map(rel).join(", ")}`);
    console.log(`  youtube     ${rel(r.youtube)}  (title, description with ${r.chapters.length} chapters, tags)`);
  });

program.command("review [episode]").description("open the review studio: listen, record retakes, edit text, comment, approve")
  .option("-p, --port <port>", "port", "4310")
  .action((e: string | undefined, o: { port: string }) => {
    startReviewServer(root(), +o.port);
    console.log(`${C.g}✓${C.x} review studio running at ${C.B}http://localhost:${o.port}/${e ? `?ep=${e}` : ""}${C.x}  (Ctrl+C to stop)`);
  });

program.command("draft <episode>").description("AI step (optional): draft episode.json + script.md from a brief, using scene-kit scenes")
  .option("-b, --brief <file>", "a text/markdown file with the brief: key points, examples, audience")
  .option("-t, --text <brief>", "the brief inline instead of a file")
  .option("-m, --minutes <n>", "target narration length (default from series.json → draft.minutes)")
  .option("--model <id>", "override series.json → draft.model")
  .option("--dry-run", "print the prompt that would be sent, and send nothing")
  .option("--force", "replace an existing episode.json and script.md")
  .action(async (e: string, o: { brief?: string; text?: string; minutes?: string; model?: string; dryRun?: boolean; force?: boolean }) => {
    const p = loadProject(root());
    const brief = o.brief ? fs.readFileSync(o.brief, "utf8") : o.text ?? "";
    const r = await draftEpisode(p, e, { brief, minutes: o.minutes ? +o.minutes : undefined, model: o.model, dryRun: o.dryRun, force: o.force }, (s) => console.log(`${C.d}…${C.x} ${s}`));
    if (r.dryRun) {
      console.log(`${C.B}SYSTEM (cached between calls)${C.x}\n${r.system}\n\n${C.B}USER${C.x}\n${r.user}`);
      console.log(`\n${C.d}${r.system.length + r.user.length} characters ≈ ${Math.round((r.system.length + r.user.length) / 4)} tokens in. Nothing was sent.${C.x}`);
      return;
    }
    const rel = path.relative(process.cwd(), r.dir);
    console.log(`\n${r.problems.length ? C.y + "!" : C.g + "✓"}${C.x} drafted ${e} with ${r.model} in ${r.usage.calls} call(s): ${r.usage.input} tokens in, ${r.usage.output} out${r.fixed ? " (second call fixed validation problems)" : ""}`);
    console.log(`  ${rel}/episode.json · script.md · fact-check.md`);
    if (r.problems.length) { console.log(`${C.y}Still to fix by hand:${C.x}`); r.problems.forEach((x) => console.log(`  • ${x}`)); }
    console.log(`Next: read and edit script.md, tick fact-check.md, then: press audio ${e} && press review ${e}`);
  });

program.command("studio").description("open the Remotion preview studio; edits to config/ and episodes/ rebuild the timeline live")
  .action(() => {
    const series = root();
    let timer: NodeJS.Timeout | null = null, busy = false;
    const rebuild = () => {
      if (busy) return; busy = true;
      try {
        const p = loadProject(series);
        for (const m of p.series.episodes) {
          if (!fs.existsSync(path.join(series, "episodes", m.folder ?? m.id, "episode.json"))) continue;
          const c = loadEpisode(p, m.id);
          const { lock } = buildAudio(c, (s) => console.log(`${C.d}[press]${C.x} ${s}`));
          writeTimelineOutputs(c, buildTimeline(c, lock));
        }
        console.log(`${C.g}[press]${C.x} timeline updated`);
      } catch (err) { console.log(`${C.r}[press]${C.x} ${(err as Error).message}`); }
      busy = false;
    };
    for (const d of ["config", "episodes", "takes"]) {
      const dir = path.join(series, d);
      if (fs.existsSync(dir)) fs.watch(dir, { recursive: true }, (_ev, f) => {
        if (!f || /audio\.lock\.json$|takes\.json$|review\.json$/.test(f)) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(rebuild, 400);
      });
    }
    rebuild();
    // non-blocking, so the file watcher above keeps running while the studio is open
    const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["remotion", "studio"], { cwd: CODE_ROOT, stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => process.exit(code ?? 0));
  });

program.command("setup").description("download the offline voice and alignment models (once per machine)")
  .action(() => {
    const py = process.env.PRESS_PYTHON || (process.platform === "win32" ? "python" : "python3");
    const r = spawnSync(py, [path.join(CODE_ROOT, "py", "setup_models.py")], { stdio: "inherit" });
    process.exitCode = r.status ?? 1;
  });

program.command("new <episode>").description("start an episode from the series template")
  .action((e: string) => {
    const p = loadProject(root());
    const meta = p.series.episodes.find((x) => x.id === e);
    if (!meta) throw new ConfigError(`Add "${e}" to series.json → episodes first.`);
    const dir = path.join(p.root, "episodes", meta.folder ?? meta.id);
    if (fs.existsSync(path.join(dir, "episode.json"))) throw new ConfigError(`${meta.id} already exists.`);
    fs.mkdirSync(dir, { recursive: true });
    // start from the template; scene-kit components get their example content so the episode previews at once
    const segs = p.series.template.filter((t) => t.required).map((t) => {
      const component = t.component ?? t.kind[0].toUpperCase() + t.kind.slice(1);
      const ex = (KIT as Record<string, { example: unknown }>)[component]?.example ?? {};
      return { id: t.kind, kind: t.kind, component, props: ex };
    });
    fs.writeFileSync(path.join(dir, "episode.json"), JSON.stringify({ id: meta.id, segments: segs }, null, 2) + "\n");
    fs.writeFileSync(path.join(dir, "script.md"), `# ${meta.title}\n\n` + segs.map((s) => `## ${s.id}\n\nWrite the ${s.kind} narration here.\n`).join("\n"));
    console.log(`${C.g}✓${C.x} created ${path.relative(process.cwd(), dir)}. Write script.md, then: press ids ${meta.id} && press check ${meta.id}`);
  });

program.parseAsync().catch((err: Error) => {
  console.error(err instanceof ConfigError ? `${C.r}✗${C.x} ${err.message}` : err.stack);
  process.exitCode = 1;
});
