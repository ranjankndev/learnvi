/**
 * Caption lines from word timings. Used by the burned-in captions (browser) and by the
 * SRT/VTT export (Node), so on-screen and uploaded captions break in exactly the same places.
 */
export interface Word { w: string; start: number }
export interface CaptionLine { start: number; end: number; text: string; words: Word[] }

/** Up to `max` words per line, breaking early after punctuation once a line has `min` words. */
export function captionLines(words: Word[], cueEnd: number, max = 12, min = 6): CaptionLine[] {
  const lines: CaptionLine[] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const last = i === words.length - 1;
    if (last || cur.length >= max || (cur.length >= min && /[.,;:!?]["”’)]?$/.test(w.w))) {
      const end = last ? cueEnd : words[i + 1].start;
      lines.push({ start: cur[0].start, end, text: cur.map((x) => x.w).join(" "), words: cur });
      cur = [];
    }
  });
  // never leave a line of one or two words on its own: fold it into the previous line
  const last = lines[lines.length - 1], prev = lines[lines.length - 2];
  if (last && prev && last.words.length < 3 && prev.words.length + last.words.length <= max + 2) {
    lines.splice(-2, 2, { start: prev.start, end: last.end, text: prev.text + " " + last.text, words: [...prev.words, ...last.words] });
  }
  return lines;
}
