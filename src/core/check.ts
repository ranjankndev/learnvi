import fs from "node:fs";
import path from "node:path";
import { ConfigError, fillTemplate, loadEpisode, templateContext, type Project } from "./project.js";
import { readScript, loadTakes } from "./audio/pipeline.js";

export interface Finding { level: "error" | "warn" | "info"; where: string; msg: string }

const REF = /^c\d+(@[a-z][\w-]*)?$/i;

function walk(v: unknown, fn: (s: string, where: string) => void, where: string) {
  if (typeof v === "string") fn(v, where);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, `${where}[${i}]`));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, fn, `${where}.${k}`));
}

/** Validate one episode against the schema, the template and its own script. */
export function checkEpisode(project: Project, ref: string): Finding[] {
  const out: Finding[] = [];
  const add = (level: Finding["level"], where: string, msg: string) => out.push({ level, where, msg });
  let ctx;
  try { ctx = loadEpisode(project, ref); } catch (e) { add("error", ref, (e as Error).message); return out; }
  const { episode } = ctx, tpl = project.series.template;
  const epRel = path.relative(project.root, path.join(ctx.dir, "episode.json"));

  // template: order, required, repeat
  let pos = 0;
  const counts: Record<string, number> = {};
  for (const seg of episode.segments) {
    counts[seg.kind] = (counts[seg.kind] ?? 0) + 1;
    const at = tpl.findIndex((t) => t.kind === seg.kind);
    if (at === -1) add("error", `${epRel} → ${seg.id}`, `kind "${seg.kind}" is not in the series template`);
    else if (at < pos) add("error", `${epRel} → ${seg.id}`, `"${seg.kind}" is out of order; template order is ${tpl.map((t) => t.kind).join(" → ")}`);
    else pos = at;
  }
  for (const t of tpl) {
    if (t.required && !counts[t.kind]) add("error", epRel, `missing required segment kind "${t.kind}"`);
    if (!t.repeat && (counts[t.kind] ?? 0) > 1) add("error", epRel, `"${t.kind}" appears ${counts[t.kind]} times; only one allowed`);
  }
  const ids = episode.segments.map((s) => s.id);
  ids.filter((x, i) => ids.indexOf(x) !== i).forEach((x) => add("error", epRel, `duplicate segment id "${x}"`));

  // script
  let parsed;
  try { parsed = readScript(ctx); } catch (e) { add("error", "script.md", (e as Error).message); return out; }
  parsed.problems.forEach((p) => add("error", `script.md:${p.line}`, p.msg));
  for (const s of parsed.segmentsWithNarration) if (!ids.includes(s)) add("error", "script.md", `heading "## ${s}" has no matching segment in episode.json`);
  for (const seg of episode.segments) {
    const t = tpl.find((x) => x.kind === seg.kind);
    const has = parsed.cues.some((c) => c.segment === seg.id);
    if (t?.narrated && !has) add("error", `script.md`, `segment "${seg.id}" (${seg.kind}) needs narration: add "## ${seg.id}"`);
    if (!has && !seg.minDuration) add("warn", `${epRel} → ${seg.id}`, `no narration and no minDuration; it will get 2 s`);
  }
  // order of narration must follow segment order
  const segOrder = parsed.cues.map((c) => ids.indexOf(c.segment)).filter((i) => i >= 0);
  if (segOrder.some((v, i) => i && v < segOrder[i - 1])) add("error", "script.md", "segment headings are in a different order from episode.json");

  // props: templates resolve, cue refs exist
  const vars = templateContext(ctx);
  const cueMarks = new Map(parsed.cues.map((c) => [c.id, new Set(Object.keys(c.marks))]));
  for (const seg of episode.segments) walk(seg.props, (s, where) => {
    try { fillTemplate(s, vars, where); } catch (e) { add("error", `${epRel} → ${seg.id}${where}`, (e as Error).message); }
    if (REF.test(s)) {
      const [c, m] = s.toLowerCase().split("@");
      if (!cueMarks.has(c)) add("error", `${epRel} → ${seg.id}${where}`, `"${s}": no cue ${c} in script.md`);
      else if (m && !cueMarks.get(c)!.has(m)) add("error", `${epRel} → ${seg.id}${where}`, `"${s}": cue ${c} has no {@${m}} mark`);
    }
  }, "");

  // takes
  for (const c of parsed.cues) {
    const t = loadTakes(ctx, c.id);
    if (t.selected !== "tts") {
      const take = t.takes.find((x) => x.id === t.selected);
      if (!take) add("error", `takes/${ctx.meta.id}/${c.id}`, `selected take ${t.selected} does not exist`);
      else if (!fs.existsSync(path.join(ctx.takesDir, c.id, take.file))) add("error", `takes/${ctx.meta.id}/${c.id}`, `file ${take.file} is missing`);
      else if (take.textHash !== c.textHash) add("warn", `${c.id}`, `text changed since take ${take.id} was recorded (policy: ${project.series.audio.staleTakePolicy})`);
    }
  }
  const words = parsed.cues.reduce((n, c) => n + c.spoken.split(/\s+/).length, 0);
  add("info", ctx.meta.id, `${episode.segments.length} segments, ${parsed.cues.length} cues, ${words} words ≈ ${(words / 150).toFixed(1)} min of narration`);
  return out;
}

export function checkAll(project: Project, only?: string): Finding[] {
  const eps = only ? [only] : project.series.episodes.map((e) => e.id);
  const out: Finding[] = [];
  for (const id of eps) {
    const meta = project.series.episodes.find((e) => e.id === id);
    if (!only && meta && !fs.existsSync(path.join(project.root, "episodes", meta.folder ?? meta.id, "episode.json"))) {
      out.push({ level: "info", where: id, msg: "not started yet" }); continue;
    }
    out.push(...checkEpisode(project, id));
  }
  if (!out.length) throw new ConfigError("nothing to check");
  return out;
}
