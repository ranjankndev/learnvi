// Shared with the CLI so the timeline format is defined once. Type-only: no Node code reaches the browser bundle.
export type { Timeline, TimelineSegment, TimelineCue } from "../src/core/timeline";

/** Every visual component receives its segment's (template-resolved) props from episode.json. */
export type SegProps = Record<string, any>;
