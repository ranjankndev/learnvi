/**
 * `press draft`: the one place the framework calls an AI service, and only when you run it.
 *
 * One request turns a short brief into episode.json + script.md, using only scenes from the
 * scene kit. The answer is checked exactly like a hand-written episode (`press check`); if that
 * finds problems, one follow-up request fixes them. Everything after that (voice, visuals, render)
 * runs offline as usual.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z as z4 } from "zod/v4";
import { KIT, KIT_NAMES } from "../../remotion/kit/specs.js";
import { ConfigError, type Project } from "./project.js";
import { checkEpisode } from "./check.js";

// ---------- what we ask for ----------
const DraftSchema = z4.object({
  segments: z4.array(z4.object({
    id: z4.string().describe("short lowercase id, unique, e.g. 'intro', 'stages', 'quiz'"),
    kind: z4.string().describe("a segment kind from the template"),
    component: z4.enum(KIT_NAMES as [string, ...string[]]),
    title: z4.string().describe("chapter title for YouTube timestamps, under 45 characters"),
    short: z4.boolean().describe("true for at most 2 self-contained scenes that work as a 60-second Short"),
    shortTitle: z4.string().nullable().describe("hook headline for the Short, or null"),
    props_json: z4.string().describe("the component's props as a JSON object string, following its field list"),
    narration: z4.array(z4.object({
      text: z4.string().describe("one paragraph, 1–3 sentences, as spoken"),
      note: z4.string().nullable().describe("optional delivery note for the narrator, or null"),
      pause: z4.number().nullable().describe("seconds of silence after this paragraph (e.g. 3 after a quiz question), or null"),
    })),
  })),
  thumbnail: z4.object({ headline: z4.string().describe("2–6 punchy words"), big: z4.string().nullable().describe("1–3 words or a number for the thumbnail card, or null") }),
  tags: z4.array(z4.string()).describe("5–8 YouTube tags specific to this lesson"),
  fact_check: z4.array(z4.string()).describe("claims, numbers or examples the author should verify before publishing"),
});
type Draft = z4.infer<typeof DraftSchema>;

/** Describe a scene-kit (zod v3) schema as a compact field list for the prompt. */
function describe(schema: any, depth = 0): string {
  const def = schema?._def;
  if (!def) return "any";
  switch (def.typeName) {
    case "ZodOptional": return describe(def.innerType, depth) + "?";
    case "ZodDefault": return describe(def.innerType, depth) + ` (default ${JSON.stringify(def.defaultValue())})`;
    case "ZodNullable": return describe(def.innerType, depth) + " | null";
    case "ZodString": { const max = def.checks?.find((c: any) => c.kind === "max"); const rx = def.checks?.find((c: any) => c.kind === "regex"); return rx ? "cue ref like \"c07\" or \"c07@mark\"" : `string${max ? ` ≤${max.value}` : ""}`; }
    case "ZodNumber": return def.checks?.some((c: any) => c.kind === "int") ? "integer" : "number";
    case "ZodBoolean": return "boolean";
    case "ZodEnum": return def.values.map((v: string) => JSON.stringify(v)).join(" | ");
    case "ZodArray": { const lim = [def.minLength && `min ${def.minLength.value}`, def.maxLength && `max ${def.maxLength.value}`].filter(Boolean).join(", "); return `${describe(def.type, depth)}[]${lim ? ` (${lim})` : ""}`; }
    case "ZodObject": {
      const shape = def.shape();
      return "{ " + Object.entries(shape).map(([k, v]) => `${k}: ${describe(v, depth + 1)}`).join("; ") + " }";
    }
    default: return "any";
  }
}

export function systemPrompt(project: Project) {
  const s = project.series;
  const catalogue = KIT_NAMES.map((n) => {
    const k = (KIT as any)[n];
    return `### ${n}\n${k.use}\nprops: ${describe(k.props)}\nexample: ${JSON.stringify(k.example)}`;
  }).join("\n\n");
  const template = s.template.map((t) => `- ${t.kind}${t.required ? "" : " (optional)"}${t.repeat ? " (one or more)" : ""}${t.component ? ` — usually ${t.component}` : ""}`).join("\n");
  return `You write narrated explainer videos for the series "${s.title}" (${s.subtitle}).
A video is a list of segments in a fixed order. Each segment shows one scene from the scene kit below and has narration paragraphs.

# Segment order (the template)
${template}
Use these kinds, in this order. "core" segments carry the teaching; aim for 4–6 of them.

# How narration drives the screen
- Each narration paragraph becomes one recorded clip, in order.
- A scene that reveals a list (Bullets items, Steps, Table rows, Compare columns, BarChart bars, Timeline events, Chat messages, Recap points) shows one item per paragraph. Give such a segment exactly one paragraph per item, optionally plus ONE introductory paragraph first. Recap: one paragraph per point, then one final paragraph teasing the next lesson.
- Definition: one paragraph for the definition, then one for the example, then one for the analogy (only for the parts you include).
- Quiz: a paragraph asking the question, a paragraph inviting the viewer to pause, then a paragraph revealing the answer.
- Leave out "at" fields; timing then follows the paragraphs automatically.
- Write narration for the ear: short sentences, no bullet symbols, no markdown, no formulas. Spell symbols as words.

# House style
${s.draft.style.map((l) => `- ${l}`).join("\n") || "- Plain, friendly, precise."}

# Scene kit (the only components you may use)
${catalogue}

# Output
props_json must be a JSON object string that matches the component's props exactly (respect the length limits: text that is too long will be rejected). Keep on-screen text much shorter than the narration: the screen shows keywords, the voice explains.`;
}

function userPrompt(project: Project, epId: string, brief: string, minutes: number) {
  const s = project.series, i = s.episodes.findIndex((e) => e.id === epId), meta = s.episodes[i], next = s.episodes[i + 1];
  return `Draft this episode.

Episode: ${meta.title}
Question it answers: ${meta.question || "(none given)"}
${Object.entries(meta).filter(([k]) => !["id", "title", "question", "folder", "number"].includes(k)).map(([k, v]) => `${k}: ${v}`).join("\n")}
Target narration length: about ${minutes} minutes (${Math.round(minutes * 150)} words).
${next ? `Next lesson (tease it in the recap): ${next.title}. ${next.question ?? ""}` : "This is the last lesson in the series."}

Brief from the author:
${brief.trim() || "(no extra brief: use the title and question)"}`;
}

// ---------- write files ----------
export function writeDraft(project: Project, epId: string, d: Draft) {
  const meta = project.series.episodes.find((e) => e.id === epId)!;
  const dir = path.join(project.root, "episodes", meta.folder ?? meta.id);
  fs.mkdirSync(dir, { recursive: true });
  const bad: string[] = [];
  const segments = d.segments.map((sg) => {
    let props: unknown = {};
    try { props = JSON.parse(sg.props_json); } catch (e) { bad.push(`${sg.id}.props_json is not valid JSON: ${(e as Error).message}`); }
    return { id: sg.id, kind: sg.kind, component: sg.component, title: sg.title, ...(sg.short ? { short: true, shortTitle: sg.shortTitle ?? sg.title } : {}), props };
  });
  const episode = { id: epId, thumbnail: { headline: d.thumbnail.headline, ...(d.thumbnail.big ? { big: d.thumbnail.big } : {}) }, tags: d.tags, segments };
  fs.writeFileSync(path.join(dir, "episode.json"), JSON.stringify(episode, null, 2) + "\n");
  let n = 0;
  const md = [`# ${meta.title}: narration`, `<!-- Drafted by press draft (${new Date().toISOString().slice(0, 10)}). Edit freely: it is yours now. -->`, ""];
  for (const sg of d.segments) {
    md.push(`## ${sg.id}`);
    for (const p of sg.narration) {
      if (p.note) md.push(`> ${p.note}`);
      const after = p.pause ? ` after=${p.pause}` : "";
      md.push(`[c${String(++n).padStart(2, "0")}${after}] ${p.text.replace(/\s*\n\s*/g, " ").trim()}`, "");
    }
  }
  fs.writeFileSync(path.join(dir, "script.md"), md.join("\n"));
  fs.writeFileSync(path.join(dir, "fact-check.md"), `# Check before publishing\n\n${d.fact_check.map((f) => `- [ ] ${f}`).join("\n") || "- [ ] (nothing flagged)"}\n`);
  return { dir, bad };
}

// ---------- the call ----------
const KEY_HELP = "Set ANTHROPIC_API_KEY (an API key from the Claude Console) or run `ant auth login`, then try again.";

/** Any credential source the SDK can use: key, token, `ant auth login` profile, or workload identity. */
function hasCredentials() {
  const env = process.env;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE || env.ANTHROPIC_FEDERATION_RULE_ID) return true;
  const cfg = path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "anthropic");
  return fs.existsSync(cfg) && fs.readdirSync(cfg).length > 0;
}

/** Turn API failures into plain instructions; most specific first. */
async function callApi<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); }
  catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new ConfigError(`The API key was rejected. ${KEY_HELP}`);
    if (e instanceof Anthropic.PermissionDeniedError) throw new ConfigError(`This key can't use that model. Check series.json → draft.model or your Console workspace.`);
    if (e instanceof Anthropic.NotFoundError) throw new ConfigError(`Model not found. Check series.json → draft.model.`);
    if (e instanceof Anthropic.RateLimitError) throw new ConfigError(`Rate limited by the API. Wait a minute and run press draft again.`);
    if (e instanceof Anthropic.BadRequestError) throw new ConfigError(`The API rejected the request: ${e.message}`);
    if (e instanceof Anthropic.APIConnectionError) throw new ConfigError(`Could not reach the API (network problem). Check your connection and try again.`);
    if (e instanceof Anthropic.APIError) throw new ConfigError(`API error ${e.status}: ${e.message}`);
    throw e;
  }
}
export interface DraftOptions { brief: string; minutes?: number; model?: string; dryRun?: boolean; force?: boolean; from?: string }

/**
 * Import a draft written elsewhere (by hand, or pasted from a Claude.ai chat given the --dry-run prompt),
 * with no API call. Same validation as an API draft.
 */
export function importDraft(project: Project, epId: string, file: string, force = false) {
  const meta = project.series.episodes.find((e) => e.id === epId);
  if (!meta) throw new ConfigError(`Add "${epId}" to series.json → episodes first.`);
  const dir = path.join(project.root, "episodes", meta.folder ?? meta.id);
  if (fs.existsSync(path.join(dir, "episode.json")) && !force) throw new ConfigError(`${epId} already has an episode.json. Use --force to replace it.`);
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "")); }
  catch (e) { throw new ConfigError(`${file} is not valid JSON: ${(e as Error).message}`); }
  // accept props as an object as well as a JSON string, and pause/note/shortTitle left out
  const segs = (raw as any)?.segments;
  if (Array.isArray(segs)) for (const s of segs) {
    if (s.props && typeof s.props === "object" && s.props_json === undefined) s.props_json = JSON.stringify(s.props);
    s.shortTitle ??= null; s.short ??= false;
    for (const p of s.narration ?? []) { p.note ??= null; p.pause ??= null; }
  }
  if (raw && typeof raw === "object") { (raw as any).fact_check ??= []; (raw as any).tags ??= []; }
  const r = DraftSchema.safeParse(raw);
  if (!r.success) throw new ConfigError(`${file} doesn't match the draft format:\n` + r.error.issues.slice(0, 12).map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n"));
  const { bad } = writeDraft(project, epId, r.data);
  const problems = [...bad, ...checkEpisode(project, epId).filter((f) => f.level === "error").map((f) => `${f.where}: ${f.msg}`)];
  return { dir, problems };
}

export async function draftEpisode(project: Project, epId: string, opts: DraftOptions, log: (s: string) => void) {
  const meta = project.series.episodes.find((e) => e.id === epId);
  if (!meta) throw new ConfigError(`Add "${epId}" to series.json → episodes first (id, number, title, question).`);
  const dir = path.join(project.root, "episodes", meta.folder ?? meta.id);
  if (fs.existsSync(path.join(dir, "episode.json")) && !opts.force && !opts.dryRun)
    throw new ConfigError(`${epId} already has an episode.json. Use --force to replace it (script.md is replaced too).`);
  const cfg = project.series.draft, minutes = opts.minutes ?? cfg.minutes, model = opts.model ?? cfg.model;
  const system = systemPrompt(project), first = userPrompt(project, epId, opts.brief, minutes);
  if (opts.dryRun) return { dryRun: true as const, system, user: first };

  if (!hasCredentials()) throw new ConfigError(`No Claude API credentials found. ${KEY_HELP}`);
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or an `ant auth login` profile
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: first }];
  const usage = { input: 0, output: 0, calls: 0 };
  let problems: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    log(attempt === 1 ? `asking ${model} for a draft…` : `asking for fixes to ${problems.length} problem(s)…`);
    const res = await callApi(() => client.beta.messages.parse({
      model, max_tokens: cfg.maxTokens,
      // the long, unchanging instructions are cached; a fix-up call reuses them cheaply
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      output_config: { effort: cfg.effort, format: betaZodOutputFormat(DraftSchema) },
      // if a safety filter declines, the API retries on a suitable model automatically
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
    }));
    usage.calls++; usage.input += res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0); usage.output += res.usage.output_tokens;
    if (res.stop_reason === "refusal") throw new Error(`The model declined to draft this (${res.stop_details?.category ?? "no category"}). Try rephrasing the brief.`);
    if (res.stop_reason === "max_tokens") throw new Error(`The draft hit the ${cfg.maxTokens}-token limit. Raise series.json → draft.maxTokens, or ask for fewer minutes.`);
    const d = res.parsed_output;
    if (!d) throw new Error("The response could not be read as a draft.");
    const { bad } = writeDraft(project, epId, d);
    problems = [...bad, ...checkEpisode(project, epId).filter((f) => f.level === "error").map((f) => `${f.where}: ${f.msg}`)];
    if (!problems.length) return { dryRun: false as const, dir, usage, problems, model, fixed: attempt > 1 };
    if (attempt === 2) break;
    messages.push({ role: "assistant", content: res.content });
    messages.push({ role: "user", content: `The draft has these problems. Return the full corrected draft.\n${problems.map((p) => `- ${p}`).join("\n")}` });
  }
  return { dryRun: false as const, dir, usage, problems, model, fixed: false };
}
