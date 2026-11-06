/** Teaching components used in core segments. All content arrives as props from episode.json. */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, Chip, F, Heading, Kicker, enter, progress, useCue, useMark, usePop } from "../ui";
import type { SegProps } from "../types";

/** Text → character codes → tokens → IDs. */
export const TextToNumbers: React.FC<SegProps> = ({ text, tokens = [], ids = [], bytesAt, lookupAt }) => {
  const frame = useCurrentFrame();
  const b = useMark(bytesAt), l = useMark(lookupAt);
  const chars = String(text).split("");
  return (
    <>
      <Heading kicker="Text to numbers">Computers only do maths on numbers</Heading>
      <div style={{ position: "absolute", left: 110, top: 300, width: 1700, ...enter(frame, 6) }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.mute, letterSpacing: 4, marginBottom: 12 }}>YOUR PROMPT</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {chars.map((ch, i) => (
            <div key={i} style={{ width: 50, textAlign: "center" }}>
              <div style={{ fontFamily: F.mono, fontSize: 46, color: C.text, height: 60 }}>{ch === " " ? "·" : ch}</div>
              <div style={{ fontFamily: F.mono, fontSize: 18, color: C.sky, opacity: progress(frame, b === undefined ? undefined : b + i, 8) * (b === undefined ? 0 : 1) }}>{ch.charCodeAt(0)}</div>
            </div>
          ))}
        </div>
        {b !== undefined && <div style={{ fontFamily: F.body, fontSize: 28, color: C.mute, marginTop: 10, ...enter(frame, b + 20) }}>one number per character: {chars.length} numbers, and each one means very little</div>}
      </div>
      {l !== undefined && (
        <div style={{ position: "absolute", left: 110, top: 590, width: 1700, ...enter(frame, l) }}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.mute, letterSpacing: 4, marginBottom: 6 }}>TOKENS → LOOKED UP IN THE VOCABULARY → IDs <span style={{ color: C.inkSoft }}>(example IDs)</span></div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start" }}>
            {(tokens as string[]).map((t, i) => (
              <div key={i} style={{ textAlign: "center", ...enter(frame, l + 8 + i * 5, 12) }}>
                <Chip i={i} size={42}>{t}</Chip>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.sun, marginTop: 6, opacity: progress(frame, l + 40 + i * 5, 10) }}>{ids[i]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

/** Characters vs words vs subwords, revealed one by one; subwords win. */
export const ThreeOptions: React.FC<SegProps> = ({ word, subwords = [], charsAt, wordsAt, subwordsAt }) => {
  const frame = useCurrentFrame();
  const c = useMark(charsAt), w = useMark(wordsAt), s = useMark(subwordsAt);
  const win = progress(frame, s === undefined ? undefined : s + 10, 15) * (s === undefined ? 0 : 1);
  const col = (title: string, at: number | undefined, body: React.ReactNode, lines: [string, boolean][], hl = false) => (
    <div style={{ flex: 1, background: C.panel, borderRadius: 24, padding: 34, border: `3px solid ${hl ? C.teal : C.line}`, boxShadow: hl ? `0 0 ${60 * win}px ${C.teal}66` : undefined, transform: hl ? `scale(${1 + 0.04 * win})` : undefined, opacity: at === undefined ? 0.15 : progress(frame, at, 15), minHeight: 520 }}>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 48, color: hl ? C.teal : C.text }}>{title}</div>
      <div style={{ minHeight: 200, display: "flex", flexWrap: "wrap", alignContent: "center", marginTop: 16 }}>{body}</div>
      {lines.map(([t, good], i) => (
        <div key={i} style={{ fontFamily: F.body, fontSize: 30, color: good ? C.good : C.bad, marginTop: 8 }}>{good ? "✓" : "✗"} {t}</div>
      ))}
    </div>
  );
  return (
    <>
      <Heading kicker="How big should a piece be?">Three choices for “{word}”</Heading>
      <div style={{ position: "absolute", left: 110, right: 110, top: 300, display: "flex", gap: 36 }}>
        {col("Characters", c, String(word).split("").map((ch, i) => <Chip key={i} plain size={36}>{ch}</Chip>), [["tiny vocabulary, never unknown", true], [`${String(word).length} pieces for one word`, false]])}
        {col("Words", w, <><Chip i={3} size={40}>{word}</Chip><div style={{ fontFamily: F.body, fontSize: 28, color: C.mute, width: "100%", marginTop: 14 }}>millions of words, names, typos…</div></>, [["one piece per word", true], ["missing words become “unknown”", false]])}
        {col("Subwords", s, (subwords as string[]).map((p, i) => <Chip key={i} i={i} size={44}>{p}</Chip>), [["common words stay whole", true], ["rare words built from pieces", true]], true)}
      </div>
      {s !== undefined && <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: F.display, fontWeight: 700, fontSize: 40, color: C.teal, ...enter(frame, s + 20) }}>Every modern chatbot uses subwords</div>}
    </>
  );
};

// ---------- BPE ----------
type Word = { s: string[]; c: number };
function bpeStates(corpus: [string, number][], merges: number) {
  let words: Word[] = corpus.map(([w, c]) => ({ s: w.split(""), c }));
  const states = [words], tops: { a: string; b: string; n: number }[][] = [];
  for (let k = 0; k < merges; k++) {
    const cnt = new Map<string, number>(), order: string[] = [];
    for (const w of words) for (let i = 0; i < w.s.length - 1; i++) {
      const p = w.s[i] + "\u0001" + w.s[i + 1];
      if (!cnt.has(p)) { cnt.set(p, 0); order.push(p); }
      cnt.set(p, cnt.get(p)! + w.c);
    }
    const sorted = [...order].sort((x, y) => cnt.get(y)! - cnt.get(x)! || order.indexOf(x) - order.indexOf(y));
    tops.push(sorted.slice(0, 4).map((p) => { const [a, b] = p.split("\u0001"); return { a, b, n: cnt.get(p)! }; }));
    const { a, b } = tops[k][0];
    words = words.map((w) => { const o: string[] = []; for (let i = 0; i < w.s.length; i++) { if (i < w.s.length - 1 && w.s[i] === a && w.s[i + 1] === b) { o.push(a + b); i++; } else o.push(w.s[i]); } return { s: o, c: w.c }; });
    states.push(words);
  }
  return { states, tops };
}

/** Byte Pair Encoding on a tiny corpus: count pairs, pause and predict, merge, repeat. */
export const BpeMerge: React.FC<SegProps> = ({ corpus = [], merges = 3, countAt, pauseAt, firstMergeAt, merge2At, merge3At }) => {
  const frame = useCurrentFrame();
  const { states, tops } = bpeStates(corpus, merges);
  const ct = useMark(countAt), pz = useMark(pauseAt);
  const m = [useMark(firstMergeAt), useMark(merge2At), useMark(merge3At)];
  const cue = useCue("c17");
  // which state are we in? a merge first highlights its pair for ~0.8 s, then applies
  const HL = 24;
  let k = 0;
  m.forEach((at, i) => { if (at !== undefined && frame >= at + HL && i < merges) k = i + 1; });
  const highlighting = m.findIndex((at, i) => at !== undefined && i === k && frame >= at && frame < at + HL);
  const showPair = k < merges && (highlighting === k || (pz !== undefined && frame >= pz && k === 0));
  const top = tops[Math.min(k, tops.length - 1)];
  const merged = (s: string) => s.length > 1;
  const pausing = pz !== undefined && cue && frame >= pz && frame < (m[0] ?? cue.to + 90);
  const left = pausing ? Math.max(0, Math.ceil(((m[0] ?? cue!.to + 90) - frame) / 30)) : 0;
  const vocab = [...new Set((corpus as [string, number][]).flatMap(([w]) => w.split("")))].sort();
  const learned = tops.slice(0, k).map((t) => t[0].a + t[0].b);
  return (
    <>
      <Heading kicker="Byte Pair Encoding">Glue the most common pair. Repeat.</Heading>
      <div style={{ position: "absolute", left: 110, top: 290, width: 980 }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.mute, letterSpacing: 4, marginBottom: 6 }}>TRAINING TEXT</div>
        {states[k].map((w, wi) => (
          <div key={wi} style={{ display: "flex", alignItems: "center", height: 96, ...enter(frame, 6 + wi * 6) }}>
            <div style={{ width: 90, fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: C.sun }}>×{w.c}</div>
            {w.s.map((sym, si) => {
              const isPair = showPair && ((sym === top[0].a && w.s[si + 1] === top[0].b) || (sym === top[0].b && w.s[si - 1] === top[0].a));
              const isNew = k > 0 && sym === learned[k - 1];
              const fresh = isNew ? 1 + 0.3 * (1 - progress(frame, (m[k - 1] ?? 0) + HL, 12)) : 1;
              return <Chip key={si} plain={!merged(sym) && !isPair} i={learned.indexOf(sym) >= 0 ? learned.indexOf(sym) : 0} size={42}
                style={{ transform: `scale(${fresh})`, ...(isPair ? { background: C.sun, color: C.night, borderColor: C.sun } : {}) }}>{sym}</Chip>;
            })}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1170, top: 290, width: 640, opacity: ct === undefined ? 0 : progress(frame, ct, 15) }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.mute, letterSpacing: 4, marginBottom: 14 }}>PAIR COUNTS</div>
        {k < merges && top.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", height: 70 }}>
            <div style={{ width: 210, fontFamily: F.mono, fontSize: 36, color: i === 0 && (showPair || k > 0) ? C.sun : C.text }}>{t.a} + {t.b}</div>
            <div style={{ height: 30, borderRadius: 6, width: (t.n / top[0].n) * 320 * progress(frame, (ct ?? 0) + i * 4, 18), background: i === 0 && (showPair || k > 0) ? C.sun : C.line }} />
            <div style={{ fontFamily: F.mono, fontSize: 32, color: C.text, marginLeft: 16 }}>{t.n}</div>
          </div>
        ))}
        {k >= merges && <div style={{ fontFamily: F.body, fontSize: 32, color: C.text, lineHeight: 1.4 }}>…and real tokenizers keep going for tens of thousands of merges.</div>}
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.mute, letterSpacing: 4, margin: "36px 0 10px" }}>VOCABULARY</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {vocab.map((v) => <Chip key={v} plain size={30}>{v}</Chip>)}
          {learned.map((v, i) => <Chip key={v} i={i} size={30}>{v}</Chip>)}
        </div>
      </div>
      {pausing && (
        <div style={{ position: "absolute", left: 1170, top: 640, width: 640, background: C.sun, color: C.night, borderRadius: 22, padding: "24px 30px", fontFamily: F.display, fontWeight: 800, fontSize: 44, display: "flex", justifyContent: "space-between", alignItems: "center", ...enter(frame, pz) }}>
          <span>⏸ Pause and predict</span><span style={{ fontFamily: F.mono, fontSize: 60 }}>{left || ""}</span>
        </div>
      )}
    </>
  );
};

/** Real tokens as coloured blocks, one example at a time. */
export const TokenBlocks: React.FC<SegProps> = ({ examples = [], promptAt, longWordAt, strawberryAt, rememberLast = true }) => {
  const frame = useCurrentFrame();
  const ats = [useMark(promptAt), useMark(longWordAt), useMark(strawberryAt)];
  return (
    <>
      <Heading kicker="Live demo">What a tokenizer actually does</Heading>
      <div style={{ position: "absolute", left: 110, top: 300, width: 1700 }}>
        {(examples as { text: string; tokens: string[] }[]).map((ex, i) => {
          const at = ats[i];
          const last = rememberLast && i === examples.length - 1;
          return (
            <div key={i} style={{ marginBottom: 46, opacity: at === undefined ? 0 : progress(frame, at, 14) }}>
              <div style={{ fontFamily: F.mono, fontSize: 24, color: C.mute, letterSpacing: 2 }}>“{ex.text}” · <span style={{ color: C.sun }}>{ex.tokens.length} tokens</span></div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                {ex.tokens.map((t, j) => <span key={j} style={enter(frame, at === undefined ? undefined : at + 6 + j * 4, 10, 20)}><Chip i={j} size={50}>{t.replace(/ /g, "␣")}</Chip></span>)}
                {last && at !== undefined && <span style={{ marginLeft: 30, fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.stamp, ...enter(frame, at + 40) }}>← remember this one</span>}
              </div>
            </div>
          );
        })}
        <div style={{ fontFamily: F.body, fontSize: 26, color: C.mute, opacity: progress(frame, ats[0] === undefined ? undefined : ats[0] + 30) }}>␣ = a space, which usually travels at the start of a token · splits vary between tokenizers</div>
      </div>
    </>
  );
};

const Icon: React.FC<{ name: string }> = ({ name }) => {
  const s = { fill: "none", stroke: C.night, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={86} height={86} viewBox="0 0 100 100">
      {name === "coin" && <><circle cx={50} cy={50} r={36} {...s} /><path d="M38 38h24M38 50h24M48 38c14 0 14 24 0 24l14 14" {...s} /></>}
      {name === "window" && <><rect x={14} y={22} width={72} height={56} rx={8} {...s} /><path d="M14 36h72M26 50h30M26 62h44" {...s} /></>}
      {name === "globe" && <><circle cx={50} cy={50} r={36} {...s} /><path d="M14 50h72M50 14c-16 18-16 54 0 72M50 14c16 18 16 54 0 72" {...s} /></>}
      {name === "letters" && <><path d="M14 74l14-46 14 46M19 58h18M56 28v46h12a12 12 0 000-24H56h10a10 10 0 000-22H56" {...s} /></>}
    </svg>
  );
};

/** A grid of reasons; each card lights up when the narration reaches it. */
export const WhyItMatters: React.FC<SegProps> = ({ cards = [] }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Heading kicker="Why tokens matter">Four reasons you should care</Heading>
      <div style={{ position: "absolute", left: 110, right: 110, top: 290, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {(cards as { title: string; text: string; icon: string; at: string }[]).map((c, i) => <Card key={i} c={c} i={i} frame={frame} />)}
      </div>
    </>
  );
};
const Card: React.FC<{ c: { title: string; text: string; icon: string; at: string }; i: number; frame: number }> = ({ c, i, frame }) => {
  const at = useMark(c.at);
  const on = progress(frame, at, 12) * (at === undefined ? 0 : 1);
  const pop = usePop(at);
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center", padding: 34, borderRadius: 24, background: C.panel, border: `3px solid ${on ? ["#2fb3ad", "#f3b443", "#8fb8d8", "#e0532a"][i % 4] : C.line}`, opacity: 0.35 + 0.65 * on, transform: `scale(${0.97 + 0.03 * pop})`, minHeight: 230 }}>
      <div style={{ flex: "none", width: 120, height: 120, borderRadius: 60, display: "flex", alignItems: "center", justifyContent: "center", background: ["#2fb3ad", "#f3b443", "#8fb8d8", "#e0532a"][i % 4] }}><Icon name={c.icon} /></div>
      <div>
        <Kicker color={C.mute} style={{ fontSize: 22 }}>{String(i + 1).padStart(2, "0")}</Kicker>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 52, color: C.text }}>{c.title}</div>
        <div style={{ fontFamily: F.body, fontSize: 32, color: C.text, opacity: 0.85, lineHeight: 1.3, marginTop: 6 }}>{c.text}</div>
      </div>
    </div>
  );
};
