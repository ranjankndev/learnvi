import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { SeriesSchema, EpisodeSchema, LexiconSchema, type Series, type Episode, type EpisodeMeta } from "../schema/index.js";

export class ConfigError extends Error {}

/** The engine's own folder (holds remotion/, py/, .models/, .cache/, out/). */
export const CODE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SERIES_DIR = path.join(CODE_ROOT, "series");
const DEFAULT_FILE = path.join(CODE_ROOT, ".press-series");

export function listSeries(): string[] {
  return fs.existsSync(SERIES_DIR) ? fs.readdirSync(SERIES_DIR).filter((d) => fs.existsSync(path.join(SERIES_DIR, d, "config", "series.json"))).sort() : [];
}
export function setDefaultSeries(id: string) {
  if (!listSeries().includes(id)) throw new ConfigError(`No series "${id}". Series: ${listSeries().join(", ")}`);
  fs.writeFileSync(DEFAULT_FILE, id + "\n");
}

/**
 * Which series a command works on, in order: --series flag, PRESS_SERIES, the series folder you are in,
 * the default set with `press series <id>`, or the only series there is.
 */
export function findRoot(series?: string): string {
  const pick = series || process.env.PRESS_SERIES;
  if (pick) {
    const d = path.join(SERIES_DIR, pick);
    if (!fs.existsSync(path.join(d, "config", "series.json"))) throw new ConfigError(`No series "${pick}". Series: ${listSeries().join(", ") || "none yet"}`);
    return d;
  }
  for (let d = path.resolve(process.cwd()); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, "config", "series.json"))) return d;
    if (path.dirname(d) === d) break;
  }
  if (fs.existsSync(DEFAULT_FILE)) return findRoot(fs.readFileSync(DEFAULT_FILE, "utf8").trim());
  const all = listSeries();
  if (all.length === 1) return path.join(SERIES_DIR, all[0]);
  throw new ConfigError(all.length ? `Which series? Use -s <id>, or set a default: press series <id>. Series: ${all.join(", ")}` : "No series found under series/.");
}

export const sha = (...parts: unknown[]) =>
  crypto.createHash("sha256").update(parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join("\u0000")).digest("hex").slice(0, 16);

export function fileHash(file: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 16);
}

function readJson<T>(file: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T {
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { throw new ConfigError(`${file}: ${(e as Error).message}`); }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const lines = r.error.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new ConfigError(`${path.relative(process.cwd(), file)} is invalid:\n${lines.join("\n")}`);
  }
  return r.data;
}

export interface Project {
  /** the series folder: config/, episodes/, takes/ */
  root: string;
  /** the engine folder: remotion/, py/, .models/, .cache/, out/ */
  code: string;
  id: string;
  series: Series;
  lexicon: Record<string, string>;
}

export function loadProject(root = findRoot()): Project {
  root = path.resolve(root);
  const series = readJson(path.join(root, "config", "series.json"), SeriesSchema);
  const lexFile = path.join(root, "config", "lexicon.json");
  const lexicon = fs.existsSync(lexFile) ? readJson(lexFile, LexiconSchema) : {};
  return { root, code: CODE_ROOT, id: path.basename(root), series, lexicon };
}

export interface EpisodeCtx {
  project: Project;
  /** unique across series, e.g. "press-enter-ep03": used for outputs, caches and composition ids */
  key: string;
  meta: EpisodeMeta;
  dir: string;
  episode: Episode;
  scriptFile: string;
  lockFile: string;
  takesDir: string;
}

/** Accepts "ep03", "3" or the folder name. */
export function loadEpisode(project: Project, ref: string): EpisodeCtx {
  const { series, root } = project;
  const meta = series.episodes.find((e) => e.id === ref || String(e.number) === ref.replace(/^ep0*/, "") || e.folder === ref);
  if (!meta) throw new ConfigError(`Unknown episode "${ref}". Known: ${series.episodes.map((e) => e.id).join(", ")}`);
  const folder = meta.folder ?? meta.id;
  const dir = path.join(root, "episodes", folder);
  const epFile = path.join(dir, "episode.json");
  if (!fs.existsSync(epFile)) throw new ConfigError(`${meta.id} has no ${path.relative(root, epFile)} yet. Run: press new ${meta.id}`);
  const episode = readJson(epFile, EpisodeSchema);
  if (episode.id !== meta.id) throw new ConfigError(`${path.relative(root, epFile)}: id "${episode.id}" does not match series.json entry "${meta.id}"`);
  return {
    project, meta, dir, episode, key: `${project.id}-${meta.id}`,
    scriptFile: path.join(dir, "script.md"),
    lockFile: path.join(dir, "audio.lock.json"),
    takesDir: path.join(root, "takes", meta.id),
  };
}

/** Template values available as {{...}} in scripts and props. */
export function templateContext(ctx: EpisodeCtx) {
  const { series } = ctx.project;
  const idx = series.episodes.findIndex((e) => e.id === ctx.meta.id);
  const asStop = (e?: EpisodeMeta) => (e ? { ...e, name: e.stop ?? e.title } : null);
  return { series, episode: ctx.meta, stop: asStop(ctx.meta), next: asStop(series.episodes[idx + 1]), prev: asStop(series.episodes[idx - 1]) };
}

const FILTERS: Record<string, (s: string) => string> = {
  upper: (s) => s.toUpperCase(), lower: (s) => s.toLowerCase(), pad2: (s) => s.padStart(2, "0"),
};
/** {{a.b}} values, with optional filters: {{episode.number|pad2}}, {{stop.name|upper}} */
export function fillTemplate(text: string, vars: Record<string, unknown>, where: string): string {
  return text.replace(/\{\{\s*([\w.]+)((?:\|\w+)*)\s*\}\}/g, (_, p: string, f: string) => {
    const v = p.split(".").reduce<any>((o, k) => (o == null ? undefined : o[k]), vars);
    if (v == null) throw new ConfigError(`${where}: unknown template value {{${p}}}`);
    return f.split("|").filter(Boolean).reduce((s, name) => {
      if (!FILTERS[name]) throw new ConfigError(`${where}: unknown filter |${name} (known: ${Object.keys(FILTERS).join(", ")})`);
      return FILTERS[name](s);
    }, String(v));
  });
}
