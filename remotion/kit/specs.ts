/**
 * Scene kit specs: one entry per general-purpose scene.
 * Used in three places: the components (prop types), `press check` (validation),
 * and `press draft` (the menu of scenes the AI may use, with examples).
 * Keep descriptions short and concrete: they are part of the AI prompt.
 */
import { z } from "zod";

/** optional cue reference: "c07" (start of paragraph) or "c07@word" (a marked word) */
const At = z.string().regex(/^c\d+(@[a-z][\w-]*)?$/i).optional()
  .describe("when it appears: 'c07' or 'c07@mark'. Leave out to appear one per narrated paragraph");

export const KIT = {
  TitleCard: {
    use: "Opening or chapter card: one big title.",
    props: z.object({ kicker: z.string().max(40).optional(), title: z.string().max(70), subtitle: z.string().max(120).optional() }),
    example: { kicker: "Unit 1 · Lesson 1", title: "The stages of NLP", subtitle: "From raw text to meaning, one layer at a time" },
  },
  BigIdea: {
    use: "One key sentence on screen, with a few words highlighted. Good for hooks and takeaways.",
    props: z.object({ kicker: z.string().max(40).optional(), text: z.string().max(140), highlight: z.array(z.string()).max(4).default([]) }),
    example: { kicker: "Key idea", text: "Language is understood in layers, from letters up to intent.", highlight: ["layers"] },
  },
  Bullets: {
    use: "Title plus 2–6 short points revealed one by one.",
    props: z.object({ kicker: z.string().max(40).optional(), title: z.string().max(70), items: z.array(z.object({ text: z.string().max(90), at: At })).min(2).max(6), numbered: z.boolean().default(false) }),
    example: { title: "Why tokenize first?", items: [{ text: "Models need fixed units" }, { text: "Units map to IDs" }, { text: "Errors flow downstream" }] },
  },
  Steps: {
    use: "A process or pipeline: 3–6 boxes joined by arrows, lit up in order.",
    props: z.object({ kicker: z.string().max(40).optional(), title: z.string().max(70), steps: z.array(z.object({ label: z.string().max(22), detail: z.string().max(60).optional(), at: At })).min(3).max(6) }),
    example: { title: "The NLP pipeline", steps: [{ label: "Lexical", detail: "words and tokens" }, { label: "Syntactic", detail: "sentence structure" }, { label: "Semantic", detail: "meaning" }] },
  },
  Compare: {
    use: "2–3 options side by side, each with short pros/cons; optional verdict line.",
    props: z.object({
      kicker: z.string().max(40).optional(), title: z.string().max(70),
      columns: z.array(z.object({ title: z.string().max(24), items: z.array(z.string().max(48)).min(1).max(4), tone: z.enum(["good", "bad", "neutral"]).default("neutral"), at: At })).min(2).max(3),
      verdict: z.object({ text: z.string().max(80), at: At }).optional(),
    }),
    example: { title: "Stemming vs lemmatization", columns: [{ title: "Stemming", items: ["chops endings", "fast, rough"], tone: "neutral" }, { title: "Lemmatization", items: ["uses a dictionary", "real words"], tone: "good" }] },
  },
  Definition: {
    use: "A term with its definition, plus optional example and everyday analogy.",
    props: z.object({ kicker: z.string().max(40).optional(), term: z.string().max(40), definition: z.string().max(160), example: z.string().max(120).optional(), analogy: z.string().max(120).optional(), exampleAt: At, analogyAt: At }),
    example: { term: "Morpheme", definition: "The smallest unit of a word that carries meaning.", example: "un + break + able", analogy: "Like LEGO bricks that snap together into words." },
  },
  Table: {
    use: "A small table (≤4 columns, ≤6 rows) whose rows appear one by one; cells can be highlighted.",
    props: z.object({
      kicker: z.string().max(40).optional(), title: z.string().max(70),
      columns: z.array(z.string().max(24)).min(2).max(4),
      rows: z.array(z.array(z.string().max(40))).min(1).max(6),
      rowsAt: z.array(At).optional(),
      highlight: z.array(z.object({ row: z.number().int().min(0), col: z.number().int().min(0).optional(), at: At })).max(4).default([]),
    }),
    example: { title: "Part-of-speech tags", columns: ["Word", "Tag"], rows: [["The", "DET"], ["cat", "NOUN"], ["sleeps", "VERB"]] },
  },
  BarChart: {
    use: "2–6 labelled bars to compare sizes or counts.",
    props: z.object({ kicker: z.string().max(40).optional(), title: z.string().max(70), unit: z.string().max(16).optional(), bars: z.array(z.object({ label: z.string().max(24), value: z.number().nonnegative(), at: At })).min(2).max(6), note: z.string().max(100).optional() }),
    example: { title: "Tokens for the same sentence", unit: "tokens", bars: [{ label: "English", value: 9 }, { label: "Hindi", value: 27 }] },
  },
  Quiz: {
    use: "Pause-and-predict question with 2–4 options; the answer is revealed later.",
    props: z.object({ kicker: z.string().max(40).default("Pause and predict"), question: z.string().max(120), options: z.array(z.string().max(60)).min(2).max(4), answer: z.number().int().min(0), revealAt: At, explain: z.string().max(120).optional() }),
    example: { question: "Which stage decides that 'bank' means a river bank?", options: ["Lexical", "Syntactic", "Semantic"], answer: 2, explain: "Choosing the meaning is semantic analysis." },
  },
  Chat: {
    use: "A chat conversation on a phone, messages appearing in turn.",
    props: z.object({ kicker: z.string().max(40).optional(), title: z.string().max(70).optional(), messages: z.array(z.object({ role: z.enum(["user", "ai"]), text: z.string().max(140), at: At })).min(1).max(5) }),
    example: { title: "Ambiguity in action", messages: [{ role: "user", text: "I saw her duck." }, { role: "ai", text: "Did you see her pet duck, or see her bend down?" }] },
  },
  Timeline: {
    use: "3–6 dated events on a line, revealed in order.",
    props: z.object({ kicker: z.string().max(40).optional(), title: z.string().max(70), events: z.array(z.object({ when: z.string().max(12), label: z.string().max(40), at: At })).min(3).max(6) }),
    example: { title: "A short history of NLP", events: [{ when: "1950s", label: "Rule-based translation" }, { when: "1990s", label: "Statistical methods" }, { when: "2018", label: "BERT" }] },
  },
  Recap: {
    use: "Closing card: 2–5 takeaways and an optional 'next' teaser.",
    props: z.object({ title: z.string().max(40).default("Recap"), points: z.array(z.string().max(90)).min(2).max(5), next: z.object({ title: z.string().max(60), question: z.string().max(110).optional(), at: At }).optional() }),
    example: { points: ["NLP works in layers", "Each layer builds on the one below"], next: { title: "Tokenization", question: "How does text become numbers?" } },
  },
} as const;

export type KitName = keyof typeof KIT;
export type KitProps<N extends KitName> = z.infer<(typeof KIT)[N]["props"]>;
export const KIT_NAMES = Object.keys(KIT) as KitName[];
