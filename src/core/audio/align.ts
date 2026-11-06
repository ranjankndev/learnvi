/**
 * Map the script's words onto the words the recogniser heard, then read off
 * the time of every mark. Works for TTS and for your own recordings, and
 * tolerates recognition slips ("rain" heard as "reign") and numbers
 * written as digits but spoken as words.
 */
export interface HeardWord { w: string; start: number; end: number }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function lev(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}
/** Recognisers slip on spelling; treat near-misses of longer words as the same word. */
const same = (a: string, b: string) => a === b || (a.length >= 5 && b.length >= 5 && lev(a, b) <= Math.floor(a.length / 4));

/** Classic LCS alignment on word lists; returns index pairs (scriptIdx, heardIdx). */
function lcsPairs(a: string[], b: string[]) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = same(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs: [number, number][] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (same(a[i], b[j])) { pairs.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return pairs;
}

const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
/** 4812 → ["four","thousand","eight","hundred","twelve"] (how a voice reads it aloud). */
export function numberWords(n: number): string[] {
  if (n < 20) return [ONES[n]];
  if (n < 100) return [TENS[Math.floor(n / 10)], ...(n % 10 ? [ONES[n % 10]] : [])];
  if (n < 1000) return [ONES[Math.floor(n / 100)], "hundred", ...(n % 100 ? numberWords(n % 100) : [])];
  for (const [v, w] of [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]] as const)
    if (n >= v) return [...numberWords(Math.floor(n / v)), w, ...(n % v ? numberWords(n % v) : [])];
  return [String(n)];
}

/** Script word → the word(s) a voice actually says. Numbers expand; everything else is normalised. */
function spokenForms(word: string): string[] {
  const m = word.replace(/[^\d.,]/g, "").replace(/[.,]+$/, "").match(/^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/);
  if (m && /\d/.test(word) && Number(m[1].replace(/,/g, "")) < 1e12) {
    const out = numberWords(Number(m[1].replace(/,/g, "")));
    if (m[2]) out.push("point", ...m[2].split("").map((d) => ONES[+d]));
    return out;
  }
  return [norm(word)];
}

export function alignScript(displayText: string, heard: HeardWord[], duration: number) {
  // expand each script word into its spoken words, remembering where each script word starts
  const display = displayText.split(/\s+/).filter(Boolean);
  const first: number[] = [], script: string[] = [];
  for (const w of display) { first.push(script.length); script.push(...spokenForms(w)); }
  const words = heard.map((h) => norm(h.w));
  const pairs = lcsPairs(script, words);
  const matched = pairs.length;
  // anchor times for matched script words, then interpolate the gaps
  const t: (number | null)[] = script.map(() => null);
  for (const [i, j] of pairs) t[i] = heard[j].start;
  const anchors: [number, number][] = [[-1, 0], ...t.map((v, i) => [i, v] as [number, number | null]).filter((x): x is [number, number] => x[1] !== null), [script.length, duration]];
  for (let k = 0; k + 1 < anchors.length; k++) {
    const [i0, t0] = anchors[k], [i1, t1] = anchors[k + 1];
    for (let i = i0 + 1; i < i1; i++) t[i] = +(t0 + ((t1 - t0) * (i - i0)) / (i1 - i0)).toFixed(3);
  }
  // score on content words only: short words and single letters are where recognisers slip most
  const content = script.map((w, i) => [w, i] as const).filter(([w]) => w.length >= 3);
  const hit = new Set(pairs.map(([i]) => i));
  const score = content.length ? content.filter(([, i]) => hit.has(i)).length / content.length : 1;
  void matched;
  return { wordTimes: first.map((i) => t[i] as number), score: +score.toFixed(3) };
}
