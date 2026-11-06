import { z } from "zod";

/** Segment kinds the standard episode template knows about. */
export const SEGMENT_KINDS = ["passport", "hook", "routeMap", "core", "tryIt", "blooper", "myth", "useIt", "recapNext"] as const;
export const SegmentKind = z.enum(SEGMENT_KINDS);

const Voice = z.object({
  provider: z.literal("kokoro").default("kokoro"),
  voice: z.string().default("af_heart"),
  speed: z.number().min(0.5).max(2).default(1),
  lang: z.string().default("en-us"),
});

export const SeriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().default(""),
  runningPrompt: z.string(),
  language: z.string().default("en"),
  theme: z.string().default("travel"),
  fps: z.number().int().positive().default(30),
  video: z.object({
    width: z.number().int().default(1920),
    height: z.number().int().default(1080),
    /** draw captions into the video (for people watching on mute) */
    burnCaptions: z.boolean().default(true),
    /** shown in the corner of every frame */
    brand: z.string().default("learnvi.in"),
  }).default({}),
  shorts: z.object({
    width: z.number().int().default(1080),
    height: z.number().int().default(1920),
    maxSeconds: z.number().default(60),
    /** line shown at the bottom of every Short */
    cta: z.string().default("Full episode on YouTube · {{series.title}}"),
  }).default({}),
  audioOnly: z.object({
    /** silences longer than this (countdowns, pause-and-predict) are shortened for listeners */
    maxPause: z.number().default(2.5),
    bitrate: z.string().default("128k"),
  }).default({}),
  youtube: z.object({
    /** title template; {{episode.title}}, {{series.title}}, {{stop.name}}, {{episode.number}} … */
    title: z.string().default("{{episode.title}} | {{series.title}} #{{episode.number}}"),
    /** description lines; "{{chapters}}" is replaced by the timestamped chapter list */
    description: z.array(z.string()).default(["{{episode.question}}", "", "{{chapters}}"]),
    tags: z.array(z.string()).default([]),
  }).default({}),
  voice: Voice.default({}),
  audio: z.object({
    sampleRate: z.number().int().default(48000),
    loudnessLUFS: z.number().default(-16),
    truePeak: z.number().default(-1.5),
    trimSilence: z.boolean().default(true),
    padSeconds: z.number().default(0.08),
    leadIn: z.number().default(0.6),
    gapAfterCue: z.number().default(0.4),
    gapAfterSegment: z.number().default(0.9),
    tail: z.number().default(1.5),
    /** what to do when a recorded take no longer matches its edited text */
    staleTakePolicy: z.enum(["tts-fallback", "keep", "error"]).default("tts-fallback"),
    /** gross check on your recordings ("did I read the right paragraph?"): warn when fewer than this
        share of the script's content words are heard. Recognisers slip on short words, so keep it low. */
    minMatchScore: z.number().min(0).max(1).default(0.5),
  }).default({}),
  /** the episode template: order and rules for segment kinds */
  template: z.array(z.object({
    kind: SegmentKind,
    required: z.boolean().default(true),
    repeat: z.boolean().default(false),
    narrated: z.boolean().default(true),
  })),
  /** one entry per video: titles and stops live here so they can be changed in one place */
  episodes: z.array(z.object({
    id: z.string(),
    number: z.number().int(),
    title: z.string(),
    stop: z.string(),
    stamp: z.string(),
    topic: z.string(),
    question: z.string(),
    tryIt: z.string(),
    useIt: z.string(),
    folder: z.string().optional(),
  })),
});
export type Series = z.infer<typeof SeriesSchema>;
export type EpisodeMeta = Series["episodes"][number];

/** A reference into the narration: "c07" (cue start) or "c07@ids" (a marked word). */
export const CueRef = z.string().regex(/^c\d+(@[a-z][\w-]*)?$/i, "expected a cue reference like c07 or c07@ids");

export const EpisodeSchema = z.object({
  id: z.string(),
  segments: z.array(z.object({
    id: z.string().regex(/^[a-z][\w-]*$/i),
    kind: SegmentKind,
    component: z.string(),
    props: z.record(z.any()).default({}),
    /** seconds of screen time for a segment with little or no narration */
    minDuration: z.number().nonnegative().optional(),
    /** also cut this segment as a 9:16 Short */
    short: z.boolean().default(false),
    /** chapter title (YouTube timestamps, audio-only chapters); defaults from the segment kind */
    title: z.string().optional(),
    /** headline at the top of the Short; defaults to the chapter title */
    shortTitle: z.string().optional(),
  })).min(1),
  thumbnail: z.object({
    headline: z.string(),
    big: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
});
export type Episode = z.infer<typeof EpisodeSchema>;

export const LexiconSchema = z.record(z.string());

export const TakesFileSchema = z.object({
  selected: z.string().default("tts"),
  takes: z.array(z.object({
    id: z.string(),
    file: z.string(),
    textHash: z.string(),
    text: z.string(),
    importedAt: z.string(),
    original: z.string().optional(),
  })).default([]),
});
export type TakesFile = z.infer<typeof TakesFileSchema>;
