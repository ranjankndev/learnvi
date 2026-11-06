/**
 * script.md format
 *
 *   ## segmentId                    ← heading = the segment in episode.json this narration belongs to
 *   > speak slowly, smile           ← speaker note (not spoken, shown when recording)
 *   [c07] The model never sees {@word}rain. It sees numbers like {@ids}4,812.
 *   [c08 speed=0.9 voice=bf_emma] Per-cue voice settings are optional.
 *
 *   {@name}         marks the next word; animations can wait for it (c07@ids)
 *   [[BPE|B P E]]   shown | spoken  (captions show the left, the voice says the right)
 *   {{stop.name}}   value from series.json / the episode entry
 *   <!-- ... -->    comment, ignored
 * A paragraph ends at a blank line. Every paragraph needs a cue id (`press ids` adds missing ones).
 */
import fs from "node:fs";
import { ConfigError, fillTemplate, sha } from "./project.js";

export interface Cue {
  id: string;
  segment: string;
  display: string; // caption text
  spoken: string; // what the voice says (after overrides + lexicon)
  marks: Record<string, number>; // mark name -> index of the display word it points at
  attrs: Record<string, string>;
  note: string;
  line: number;
  textHash: string; // hash of what is spoken (a recorded take must match this)
}

export interface ParsedScript {
  cues: Cue[];
  segmentsWithNarration: string[];
  problems: { line: number; msg: string }[];
}

const CUE_RE = /^\[(c\d+)((?:\s+\w+=[^\]\s]+)*)\]\s*/i;

function applyLexicon(text: string, lex: Record<string, string>) {
  let out = text;
  for (const [k, v] of Object.entries(lex)) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\w-])${esc}(?![\\w-])`, "g"), v);
  }
  return out;
}

/** Turn one paragraph's raw text into display text, spoken text and mark positions. */
export function renderParagraph(raw: string, lex: Record<string, string>) {
  const parts = raw.split(/(\[\[[^\]|]+\|[^\]]+\]\]|\{@[a-z][\w-]*\})/i);
  let display = "", spoken = "";
  const marks: Record<string, number> = {};
  for (const p of parts) {
    const ov = p.match(/^\[\[([^\]|]+)\|([^\]]+)\]\]$/);
    const mk = p.match(/^\{@([a-z][\w-]*)\}$/i);
    if (ov) { display += ov[1]; spoken += ov[2]; }
    else if (mk) { marks[mk[1]] = display.trim() === "" ? 0 : display.trim().split(/\s+/).length - (/\s$/.test(display) || display === "" ? 0 : 1); }
    else { display += p; spoken += applyLexicon(p, lex); }
  }
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  return { display: clean(display), spoken: clean(spoken), marks };
}

export function parseScript(file: string, vars: Record<string, unknown>, lex: Record<string, string>): ParsedScript {
  if (!fs.existsSync(file)) throw new ConfigError(`Missing ${file}`);
  const src = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ""));
  const lines = src.split(/\r?\n/);
  const cues: Cue[] = [], problems: ParsedScript["problems"] = [], segs: string[] = [];
  let segment = "", buf: string[] = [], notes: string[] = [], start = 0;
  const seen = new Set<string>();

  const flush = () => {
    if (!buf.length) { notes = []; return; }
    const text = buf.join(" ");
    const m = text.match(CUE_RE);
    if (!segment) problems.push({ line: start, msg: "narration before the first ## segment heading" });
    if (!m) { problems.push({ line: start, msg: `paragraph has no cue id (run: press ids) — "${text.slice(0, 40)}…"` }); buf = []; notes = []; return; }
    const id = m[1].toLowerCase();
    if (seen.has(id)) problems.push({ line: start, msg: `duplicate cue id ${id}` });
    seen.add(id);
    const attrs = Object.fromEntries((m[2].match(/\w+=[^\s]+/g) ?? []).map((kv) => kv.split("=") as [string, string]));
    let body = text.slice(m[0].length);
    try { body = fillTemplate(body, vars, `script line ${start}`); } catch (e) { problems.push({ line: start, msg: (e as Error).message }); }
    const r = renderParagraph(body, lex);
    if (!r.spoken) problems.push({ line: start, msg: `${id} is empty` });
    cues.push({ id, segment, ...r, attrs, note: notes.join(" "), line: start, textHash: sha(r.spoken) });
    buf = []; notes = [];
  };

  lines.forEach((l, i) => {
    const t = l.trim();
    if (/^##\s+/.test(t)) { flush(); segment = t.replace(/^##\s+/, "").trim(); segs.push(segment); return; }
    if (/^#\s/.test(t) || /^---/.test(t)) { flush(); return; }
    if (!t) { flush(); return; }
    if (t.startsWith(">")) { notes.push(t.replace(/^>\s?/, "")); return; }
    if (!buf.length) start = i + 1;
    buf.push(t);
  });
  flush();
  return { cues, segmentsWithNarration: segs, problems };
}

/** Give every paragraph without a cue id the next free id. Rewrites the file; returns ids added. */
export function assignIds(file: string): string[] {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let max = 0;
  for (const l of lines) { const m = l.trim().match(/^\[c(\d+)/i); if (m) max = Math.max(max, +m[1]); }
  const added: string[] = [];
  let inPara = false, inComment = false;
  const out = lines.map((l) => {
    const t = l.trim();
    if (t.includes("<!--")) inComment = !t.includes("-->");
    else if (inComment) { if (t.includes("-->")) inComment = false; return l; }
    if (!t || /^#/.test(t) || /^---/.test(t)) { inPara = false; return l; }
    if (t.startsWith(">") || t.startsWith("<!--")) return l;
    if (!inPara) {
      inPara = true;
      if (!/^\[c\d+/i.test(t)) { const id = `c${String(++max).padStart(2, "0")}`; added.push(id); return `[${id}] ${l.trimStart()}`; }
    }
    return l;
  });
  if (added.length) fs.writeFileSync(file, out.join("\n"));
  return added;
}

/** Locate a cue's paragraph in script.md: its line range and the raw text after the [cNN …] tag. */
function findParagraph(lines: string[], cueId: string) {
  const re = new RegExp(`^\\[${cueId}((?:\\s+\\w+=[^\\]\\s]+)*)\\]\\s*`, "i");
  const start = lines.findIndex((l) => re.test(l.trim()));
  if (start < 0) return null;
  let end = start;
  while (end + 1 < lines.length) {
    const t = lines[end + 1].trim();
    if (!t || /^#/.test(t) || t.startsWith(">") || /^\[c\d+/i.test(t)) break;
    end++;
  }
  const first = lines[start].trim(), m = first.match(re)!;
  const raw = [first.slice(m[0].length), ...lines.slice(start + 1, end + 1).map((l) => l.trim())].join(" ").trim();
  return { start, end, tag: m[0].trim(), raw };
}

/** The raw (unrendered) text of one cue: marks, overrides and {{templates}} included. */
export function getCueRaw(file: string, cueId: string): string | null {
  return findParagraph(fs.readFileSync(file, "utf8").split(/\r?\n/), cueId)?.raw ?? null;
}

/** Replace one cue's raw text in script.md, keeping its id, attributes and every other line as is. */
export function setCueRaw(file: string, cueId: string, raw: string) {
  const text = raw.replace(/\s*\n\s*/g, " ").trim();
  if (!text) throw new Error("text cannot be empty");
  const src = fs.readFileSync(file, "utf8"), nl = src.includes("\r\n") ? "\r\n" : "\n";
  const lines = src.split(/\r?\n/);
  const p = findParagraph(lines, cueId);
  if (!p) throw new Error(`no cue ${cueId} in ${file}`);
  lines.splice(p.start, p.end - p.start + 1, `${p.tag} ${text}`);
  fs.writeFileSync(file, lines.join(nl));
}
