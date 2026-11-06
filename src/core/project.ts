import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { SeriesSchema, EpisodeSchema, LexiconSchema, type Series, type Episode, type EpisodeMeta } from "../schema/index.js";

export class ConfigError extends Error {}

/** Walk up from cwd to the folder that holds config/series.json. */
export function findRoot(start = process.cwd()): string {
  let d = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(d, "config", "series.json"))) return d;
    const up = path.dirname(d);
    if (up === d) throw new ConfigError("No config/series.json found here or in any parent folder.");
    d = up;
  }
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
  root: string;
  series: Series;
  lexicon: Record<string, string>;
}

export function loadProject(root = findRoot()): Project {
  const series = readJson(path.join(root, "config", "series.json"), SeriesSchema);
  const lexFile = path.join(root, "config", "lexicon.json");
  const lexicon = fs.existsSync(lexFile) ? readJson(lexFile, LexiconSchema) : {};
  return { root, series, lexicon };
}

export interface EpisodeCtx {
  project: Project;
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
    project, meta, dir, episode,
    scriptFile: path.join(dir, "script.md"),
    lockFile: path.join(dir, "audio.lock.json"),
    takesDir: path.join(root, "takes", meta.id),
  };
}

/** Template values available as {{...}} in scripts and props. */
export function templateContext(ctx: EpisodeCtx) {
  const { series } = ctx.project;
  const idx = series.episodes.findIndex((e) => e.id === ctx.meta.id);
  const asStop = (e?: EpisodeMeta) => (e ? { ...e, name: e.stop } : null);
  return { series, episode: ctx.meta, stop: asStop(ctx.meta), next: asStop(series.episodes[idx + 1]), prev: asStop(series.episodes[idx - 1]) };
}

export function fillTemplate(text: string, vars: Record<string, unknown>, where: string): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p: string) => {
    const v = p.split(".").reduce<any>((o, k) => (o == null ? undefined : o[k]), vars);
    if (v == null) throw new ConfigError(`${where}: unknown template value {{${p}}}`);
    return String(v);
  });
}
