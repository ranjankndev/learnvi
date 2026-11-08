/**
 * HTML tutorials: one animated, readable page per episode, built from the same
 * episode.json + script.md as the video. Scenes animate as they scroll into view,
 * the narration sits beside them as text, quizzes are clickable, and each page ends
 * with a memory map of the lesson. A course index adds a course-wide map.
 *
 *   press html            → out/<series>/tutorials/index.html + one page per episode
 */
import fs from "node:fs";
import path from "node:path";
import { loadEpisode, templateContext, type EpisodeCtx, type Project } from "./project.js";
import { parseScript } from "./script.js";
import { segmentProps } from "./timeline.js";

type P = Record<string, any>;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** "I · do · n't" → token chips (the tokenizer convention used across the course). */
function tokens(s: string): string {
  if (!s.includes(" · ")) return esc(s);
  return `<span class="toks">${s.split(" · ").map((t, i) => `<span class="tok t${i % 6}">${esc(t)}</span>`).join("")}</span>`;
}
const a = (i: number, extra = "") => `data-a style="--i:${i}${extra}"`;

// ───────────────────────── scene renderers (one per kit component) ─────────────────────────

const R: Record<string, (p: P) => string> = {
  BigIdea: (p) => {
    const hi = new Set((p.highlight ?? []).map((h: string) => norm(h)));
    const words = String(p.text).split(/(\s+)/).map((w) => (hi.has(norm(w)) && norm(w) ? `<mark>${esc(w)}</mark>` : esc(w))).join("");
    return `<div class="bigidea">${p.kicker ? `<div class="eyebrow" ${a(0)}>${esc(p.kicker)}</div>` : ""}<p ${a(1)}>${words}</p></div>`;
  },
  Definition: (p) => `<div class="def">
      <div class="def-main" ${a(0)}>${p.kicker ? `<div class="eyebrow">${esc(p.kicker)}</div>` : ""}<dfn>${esc(p.term)}</dfn><p>${esc(p.definition)}</p></div>
      ${p.example ? `<div class="def-ex" ${a(1)}><div class="label">Example</div><div class="mono">${tokens(p.example)}</div></div>` : ""}
      ${p.analogy ? `<div class="def-an" ${a(2)}><div class="label">Think of it like</div><p>${esc(p.analogy)}</p></div>` : ""}
    </div>`,
  Bullets: (p) => `${head(p)}<${p.numbered ? "ol" : "ul"} class="bullets">${(p.items ?? []).map((it: P, i: number) => `<li ${a(i + 1)}><span class="tick" aria-hidden="true">${p.numbered ? i + 1 : "✓"}</span><span>${tokens(it.text)}</span></li>`).join("")}</${p.numbered ? "ol" : "ul"}>`,
  Steps: (p) => `${head(p)}<ol class="steps">${(p.steps ?? []).map((s: P, i: number) => `<li ${a(i + 1)}><span class="num">${String(i + 1).padStart(2, "0")}</span><strong>${esc(s.label)}</strong>${s.detail ? `<span>${tokens(s.detail)}</span>` : ""}</li>`).join("")}</ol>`,
  Compare: (p) => `${head(p)}<div class="compare c${(p.columns ?? []).length}">${(p.columns ?? []).map((c: P, i: number) => `<div class="col ${c.tone ?? "neutral"}" ${a(i + 1)}><h4>${esc(c.title)}</h4><ul>${c.items.map((x: string) => `<li>${tokens(x)}</li>`).join("")}</ul></div>`).join("")}</div>${p.verdict ? `<p class="verdict" ${a((p.columns ?? []).length + 1)}>${esc(p.verdict.text)}</p>` : ""}`,
  Table: (p) => {
    const hl = (r: number, c: number) => (p.highlight ?? []).some((h: P) => h.row === r && (h.col === undefined || h.col === c));
    return `${head(p)}<div class="tablewrap"><table><thead><tr>${p.columns.map((c: string) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${p.rows.map((row: string[], r: number) => `<tr ${a(r + 1)}>${row.map((cell, c) => `<td${hl(r, c) ? ' class="hl"' : ""}>${tokens(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  },
  BarChart: (p) => {
    const max = Math.max(...p.bars.map((b: P) => b.value), 1);
    return `${head(p)}<div class="bars">${p.bars.map((b: P, i: number) => `<div class="bar" ${a(i + 1, `;--w:${((b.value / max) * 100).toFixed(1)}%`)}><span class="bl">${esc(b.label)}</span><span class="track"><span class="fill"></span></span><span class="bv">${b.value}${p.unit ? ` <small>${esc(p.unit)}</small>` : ""}</span></div>`).join("")}</div>${p.note ? `<p class="note" ${a(p.bars.length + 1)}>${esc(p.note)}</p>` : ""}`;
  },
  Quiz: (p) => `<div class="quiz" data-answer="${p.answer}"><div class="eyebrow" ${a(0)}>${esc(p.kicker ?? "Pause and predict")}</div><p class="q" ${a(1)}>${esc(p.question)}</p>
      <div class="opts">${p.options.map((o: string, i: number) => `<button type="button" class="opt" data-i="${i}" ${a(i + 2)}><span class="letter">${"ABCD"[i]}</span>${esc(o)}</button>`).join("")}</div>
      <p class="explain" hidden><strong></strong> ${esc(p.explain ?? "")}</p>
      <button type="button" class="reveal">Show the answer</button></div>`,
  Chat: (p) => `${p.title ? head(p) : ""}<div class="chat">${p.messages.map((m: P, i: number) => `<div class="msg ${m.role}" ${a(i + 1)}><span class="who">${m.role === "user" ? "You" : "AI"}</span>${esc(m.text)}</div>`).join("")}</div>`,
  Timeline: (p) => `${head(p)}<ol class="timeline">${p.events.map((e: P, i: number) => `<li ${a(i + 1)}><span class="when">${esc(e.when)}</span>${esc(e.label)}</li>`).join("")}</ol>`,
  Recap: (p) => `<div class="recap"><ul class="bullets">${p.points.map((x: string, i: number) => `<li ${a(i + 1)}><span class="tick" aria-hidden="true">✓</span><span>${tokens(x)}</span></li>`).join("")}</ul></div>`,
};
function head(p: P) {
  return `<div class="fighead" ${a(0)}>${p.kicker ? `<div class="eyebrow">${esc(p.kicker)}</div>` : ""}${p.title ? `<h3>${esc(p.title)}</h3>` : ""}</div>`;
}

// ───────────────────────── memory map ─────────────────────────

interface Node { title: string; detail?: string; analogy?: string; href?: string; items?: string[] }

/** The one-line takeaway a scene contributes to the memory map. */
function takeaway(component: string, p: P): Omit<Node, "title" | "href"> {
  switch (component) {
    case "Definition": return { detail: `${p.term}: ${p.definition}`, analogy: p.analogy };
    case "Steps": return { detail: p.steps.map((s: P) => s.label).join(" → ") };
    case "Compare": return { detail: p.columns.map((c: P) => c.title).join(" vs "), analogy: p.verdict?.text };
    case "Bullets": return { detail: p.items.slice(0, 2).map((i: P) => i.text).join(" · ") };
    case "Table": return { detail: p.title };
    case "BarChart": return { detail: p.note ?? p.title };
    case "BigIdea": return { detail: p.text };
    case "Chat": return { detail: p.messages[0]?.text };
    case "Timeline": return { detail: p.events.map((e: P) => e.when).join(" → ") };
    default: return {};
  }
}

/** Radial map: centre topic, branches on an ellipse. Phones get the same content as a list. */
function memoryMap(center: string, nodes: Node[], tall = false): string {
  const W = 1200, H = tall ? 860 : 780, cx = W / 2, cy = H / 2, rx = 420, ry = tall ? 300 : 280;
  const bw = 290, bh = tall ? 200 : 175;
  const pos = nodes.map((_, i) => {
    const t = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
    return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) };
  });
  const box = (n: Node) => `<div class="mm-node">${n.href ? `<a href="${n.href}">${esc(n.title)}</a>` : `<strong>${esc(n.title)}</strong>`}${n.detail ? `<p>${esc(n.detail)}</p>` : ""}${n.analogy ? `<p class="mm-an">≈ ${esc(n.analogy)}</p>` : ""}${n.items ? `<ul>${n.items.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}</div>`;
  const svg = `<svg class="mm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Memory map: ${esc(center)}">
    ${pos.map((p, i) => `<path class="mm-link" style="--i:${i}" d="M${cx},${cy} Q${(cx + p.x) / 2},${cy} ${p.x},${p.y}" />`).join("")}
    <foreignObject x="${cx - 115}" y="${cy - 55}" width="230" height="110"><div class="mm-center">${esc(center)}</div></foreignObject>
    ${nodes.map((n, i) => `<foreignObject x="${(pos[i].x - bw / 2).toFixed(0)}" y="${(pos[i].y - bh / 2).toFixed(0)}" width="${bw}" height="${bh}">${box(n)}</foreignObject>`).join("")}
  </svg>`;
  const list = `<ol class="mm-list"><li class="mm-root">${esc(center)}</li>${nodes.map((n) => `<li>${box(n)}</li>`).join("")}</ol>`;
  return `<div class="mm">${svg}${list}</div>`;
}

// ───────────────────────── pages ─────────────────────────

const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@400;600&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap";

function doc(title: string, body: string, fragment: boolean) {
  const headBits = `<title>${esc(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="tutorial.css">`;
  if (fragment) return `${headBits}\n${body}\n<script src="tutorial.js"></script>\n`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${headBits}
</head><body>
${body}
<script src="tutorial.js"></script>
</body></html>
`;
}

const pageName = (ctx: EpisodeCtx) => `${ctx.meta.folder ?? ctx.meta.id}.html`;
const SKIP_MAP = new Set(["TitleCard", "Quiz", "Recap"]);

function lessonPage(ctx: EpisodeCtx, all: EpisodeCtx[], opts: { video: boolean; outDir: string }) {
  const { project, meta } = ctx;
  const vars = templateContext(ctx);
  const cues = parseScript(ctx.scriptFile, vars, project.lexicon).cues;
  const segs = ctx.episode.segments.map((s) => ({ seg: s, props: segmentProps(ctx, s) as P }));
  const intro = segs.find((s) => s.seg.component === "TitleCard");
  const scenes = segs.filter((s) => s !== intro);
  const i = all.findIndex((c) => c.meta.id === meta.id), prev = all[i - 1], next = all[i + 1];
  const label = meta.unit ? `Unit ${meta.unit} · Lesson ${meta.lesson}` : `Episode ${meta.number}`;
  const minutes = (() => {
    const t = path.join(project.code, "out", project.id, meta.id, "timeline.json");
    return fs.existsSync(t) ? Math.round(JSON.parse(fs.readFileSync(t, "utf8")).duration / 60) : Math.round(cues.reduce((n, c) => n + c.display.split(/\s+/).length, 0) / 150);
  })();

  // a local video sits next to the tutorials folder: out/<series>/<id>/<file>.mp4
  let video = "";
  if (opts.video) {
    const dir = path.join(project.code, "out", project.id, meta.id);
    const mp4 = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.endsWith(".mp4")) : undefined;
    if (mp4) video = `<video class="video" controls preload="metadata" src="${esc(path.relative(opts.outDir, path.join(dir, mp4)))}"></video>`;
  }

  const sceneHtml = scenes.map(({ seg, props }, n) => {
    const render = R[seg.component];
    const visual = render ? render(props) : `<p class="missing">${esc(seg.component)} scene: see the video.</p>`;
    const text = cues.filter((c) => c.segment === seg.id).map((c) => `<p>${esc(c.display)}</p>`).join("");
    const isNext = seg.component === "Recap" && next;
    const wide = (seg.component === "Compare" && (props.columns ?? []).length > 2) || (seg.component === "Table" && props.columns.length > 2) || (seg.component === "Steps" && props.steps.length > 3) || seg.component === "Timeline";
    return `<section class="scene${wide ? " wide" : ""}" id="${esc(seg.id)}" aria-labelledby="h-${esc(seg.id)}">
  <header class="scene-head"><span class="scene-n">${String(n + 1).padStart(2, "0")}</span><h2 id="h-${esc(seg.id)}">${esc(seg.title)}</h2></header>
  <div class="scene-body">
    <figure class="fig">${visual}<button type="button" class="replay" aria-label="Replay the animation for ${esc(seg.title)}">Replay</button></figure>
    <div class="narr">${text}${isNext ? `<a class="nextcard" href="${pageName(next)}"><span class="eyebrow">Next lesson</span><strong>${esc(next.meta.title)}</strong><span>${esc(next.meta.question ?? "")}</span></a>` : ""}</div>
  </div>
</section>`;
  }).join("\n");

  const nodes: Node[] = scenes.filter((s) => !SKIP_MAP.has(s.seg.component)).map(({ seg, props }) => ({ title: seg.title ?? seg.id, href: `#${seg.id}`, ...takeaway(seg.component, props) }));
  const toc = scenes.map(({ seg }, n) => `<li><a href="#${esc(seg.id)}"><span>${String(n + 1).padStart(2, "0")}</span>${esc(seg.title)}</a></li>`).join("");

  const body = `<div class="page lesson">
<nav class="topbar"><a href="index.html" class="brand">learnvi <span>${esc(project.series.title)}</span></a><span class="crumb">${esc(label)}</span></nav>
<header class="lesson-head">
  <div class="eyebrow">${esc(label)}${project.series.units[String(meta.unit)] ? ` · ${esc(project.series.units[String(meta.unit)])}` : ""}</div>
  <h1>${esc(meta.title)}</h1>
  ${intro?.props.subtitle ? `<p class="sub">${esc(intro.props.subtitle)}</p>` : ""}
  <div class="meta"><span class="qbox"><span class="label">The question</span>${esc(meta.question ?? "")}</span><span class="dur">${scenes.length} scenes · about ${minutes} min</span></div>
  ${video}
</header>
<div class="layout">
  <aside class="toc" aria-label="Scenes"><div class="label">In this lesson</div><ol>${toc}<li><a href="#map"><span>★</span>Memory map</a></li></ol></aside>
  <main>
${sceneHtml}
<section class="scene mapsec" id="map" aria-labelledby="h-map">
  <header class="scene-head"><span class="scene-n">★</span><h2 id="h-map">Memory map</h2></header>
  <p class="mapintro">The whole lesson on one page. Analogies are marked ≈. Tap a branch to jump back to that scene.</p>
  ${memoryMap(String(meta.short ?? meta.title), nodes)}
</section>
<nav class="pager">${prev ? `<a href="${pageName(prev)}" class="prev"><span class="label">Previous</span>${esc(prev.meta.title)}</a>` : "<span></span>"}${next ? `<a href="${pageName(next)}" class="next"><span class="label">Next</span>${esc(next.meta.title)}</a>` : `<a href="index.html" class="next"><span class="label">Finished</span>Back to the course</a>`}</nav>
  </main>
</div>
</div>`;
  return doc(`${meta.short ?? meta.title} · ${project.series.title}`, body, false);
}

function indexPage(project: Project, all: EpisodeCtx[], fragment: boolean) {
  const units = new Map<string, EpisodeCtx[]>();
  for (const c of all) { const u = String(c.meta.unit ?? ""); units.set(u, [...(units.get(u) ?? []), c]); }
  let total = 0;
  const mins = (c: EpisodeCtx) => {
    const t = path.join(project.code, "out", project.id, c.meta.id, "timeline.json");
    const m = fs.existsSync(t) ? JSON.parse(fs.readFileSync(t, "utf8")).duration / 60 : 0;
    total += m; return Math.round(m);
  };
  const cards = [...units].map(([u, cs]) => `<section class="unit" aria-labelledby="u${esc(u)}">
  <h2 id="u${esc(u)}"><span class="eyebrow">Unit ${esc(u)}</span>${esc(project.series.units[u] ?? "")}</h2>
  <ol class="cards">${cs.map((c) => `<li><a class="card" href="${pageName(c)}"><span class="cn">${esc(c.meta.unit)}.${esc(c.meta.lesson)}</span><strong>${esc(c.meta.title)}</strong><span class="cq">${esc(c.meta.question ?? "")}</span><span class="cm">${mins(c) || "?"} min</span></a></li>`).join("")}</ol>
</section>`).join("\n");
  const nodes: Node[] = [...units].map(([u, cs]) => ({ title: `Unit ${u}: ${project.series.units[u] ?? ""}`, items: cs.map((c) => `<a href="${pageName(c)}">${esc(c.meta.short ?? c.meta.title)}</a>`) }));
  const body = `<div class="page home">
<nav class="topbar"><span class="brand">learnvi <span>${esc(project.series.title)}</span></span><span class="crumb">${all.length} lessons</span></nav>
<header class="home-head">
  <div class="eyebrow">Animated tutorials</div>
  <h1>${esc(project.series.title)}</h1>
  <p class="sub">${esc(project.series.subtitle)}</p>
  <p class="howto">Each lesson is the video's script as a page you can read at your own pace. Every scene animates as you reach it; press Replay to watch it again. Try the quiz before you look at the answer, and finish with the lesson's memory map.</p>
  <div class="stats"><span><strong>${all.length}</strong> lessons</span><span><strong>${units.size}</strong> units</span><span><strong>${Math.round(total)}</strong> min of video</span></div>
</header>
<section class="coursemap" aria-labelledby="h-cm"><h2 id="h-cm">The course at a glance</h2>${memoryMap(project.series.title, nodes, true)}</section>
${cards}
</div>`;
  return doc(project.series.title, body, fragment);
}

export function buildTutorials(project: Project, opts: { outDir?: string; video?: boolean; fragmentIndex?: boolean } = {}) {
  const outDir = opts.outDir ?? path.join(project.code, "out", project.id, "tutorials");
  fs.mkdirSync(outDir, { recursive: true });
  const all = project.series.episodes.filter((e) => fs.existsSync(path.join(project.root, "episodes", e.folder ?? e.id, "episode.json"))).map((e) => loadEpisode(project, e.id));
  const files: string[] = [];
  const write = (name: string, text: string) => { const f = path.join(outDir, name); fs.writeFileSync(f, text); files.push(f); };
  const assets = path.join(project.code, "src", "core", "html-assets");
  for (const f of ["tutorial.css", "tutorial.js"]) write(f, fs.readFileSync(path.join(assets, f), "utf8"));
  write("index.html", indexPage(project, all, Boolean(opts.fragmentIndex)));
  for (const c of all) write(pageName(c), lessonPage(c, all, { video: opts.video ?? true, outDir }));
  return { outDir, files, lessons: all.length };
}
