import fs from "node:fs";
process.stdout.on("error", (e: NodeJS.ErrnoException) => { if (e.code === "EPIPE") process.exit(0); });
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Command } from "commander";
import { ConfigError, loadEpisode, loadProject, findRoot } from "../core/project.js";
import { assignIds } from "../core/script.js";
import { checkAll } from "../core/check.js";
import { buildAudio, importTake, loadTakes, plan, readLock, readScript, selectTake, type CueState } from "../core/audio/pipeline.js";
import { buildTimeline, writeTimelineOutputs } from "../core/timeline.js";

const C = process.stdout.isTTY ? { r: "\x1b[31m", g: "\x1b[32m", y: "\x1b[33m", b: "\x1b[36m", d: "\x1b[2m", x: "\x1b[0m", B: "\x1b[1m" } : { r: "", g: "", y: "", b: "", d: "", x: "", B: "" };
const ep = (ref: string) => loadEpisode(loadProject(), ref);
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const STATUS: Record<CueState["status"], string> = {
  ready: `${C.g}ready${C.x}`, "needs-build": `${C.b}needs build${C.x}`, "needs-voice": `${C.b}needs voice${C.x}`,
  "stale-take": `${C.y}stale take${C.x}`, "missing-take": `${C.r}missing take${C.x}`,
};

const program = new Command().name("press").description("Press Enter Studio — config-driven video production");

program.command("check [episode]").description("validate config, template and scripts")
  .action((e?: string) => {
    const f = checkAll(loadProject(), e);
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

program.command("setup").description("download the offline voice and alignment models (once per machine)")
  .action(() => {
    const root = findRoot();
    const py = process.env.PRESS_PYTHON || (process.platform === "win32" ? "python" : "python3");
    const r = spawnSync(py, [path.join(root, "py", "setup_models.py")], { stdio: "inherit" });
    process.exitCode = r.status ?? 1;
  });

program.command("new <episode>").description("start an episode from the series template")
  .action((e: string) => {
    const p = loadProject();
    const meta = p.series.episodes.find((x) => x.id === e);
    if (!meta) throw new ConfigError(`Add "${e}" to series.json → episodes first.`);
    const dir = path.join(p.root, "episodes", meta.folder ?? meta.id);
    if (fs.existsSync(path.join(dir, "episode.json"))) throw new ConfigError(`${meta.id} already exists.`);
    fs.mkdirSync(dir, { recursive: true });
    const segs = p.series.template.filter((t) => t.required).map((t) => ({ id: t.kind, kind: t.kind, component: t.kind[0].toUpperCase() + t.kind.slice(1), props: {} }));
    fs.writeFileSync(path.join(dir, "episode.json"), JSON.stringify({ id: meta.id, segments: segs }, null, 2) + "\n");
    fs.writeFileSync(path.join(dir, "script.md"), `# ${meta.title}\n\n` + segs.map((s) => `## ${s.id}\n\nWrite the ${s.kind} narration here.\n`).join("\n"));
    console.log(`${C.g}✓${C.x} created ${path.relative(process.cwd(), dir)}. Write script.md, then: press ids ${meta.id} && press check ${meta.id}`);
  });

program.parseAsync().catch((err: Error) => {
  console.error(err instanceof ConfigError ? `${C.r}✗${C.x} ${err.message}` : err.stack);
  process.exitCode = 1;
});
