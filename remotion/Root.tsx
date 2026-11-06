import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/bricolage-grotesque/800.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Composition, Folder, Sequence, continueRender, delayRender, staticFile } from "remotion";
import { SegmentView } from "./Frame";
import { ShortView, Thumbnail } from "./Short";
import { TIMELINES } from "./generated";
import type { Timeline } from "./types";

/** Hold every frame until the fonts are ready, so no frame renders in a fallback font. */
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = ['800 40px "Bricolage Grotesque"', '700 40px "Bricolage Grotesque"', '400 40px "Source Sans 3"', '600 40px "Source Sans 3"', '700 40px "Source Sans 3"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];
    Promise.all(faces.map((f) => document.fonts.load(f))).then(() => continueRender(h), () => continueRender(h));
  }, [h]);
};

/** The whole episode: every segment in sequence, plus the narration. */
const Episode: React.FC<{ episode: string; muted?: boolean }> = ({ episode, muted }) => {
  useFonts();
  const tl = TIMELINES.find((t) => t.key === episode)!;
  return (
    <AbsoluteFill>
      {!muted && <Audio src={staticFile(`${episode}/narration.wav`)} />}
      {tl.segments.map((s) => (
        <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames} name={s.id}>
          <SegmentView tl={tl} seg={s} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** One segment on its own: what the renderer caches, and what you preview in the studio. */
const Segment: React.FC<{ episode: string; segment: string; muted?: boolean }> = ({ episode, segment, muted }) => {
  useFonts();
  const tl = TIMELINES.find((t) => t.key === episode)!;
  const seg = tl.segments.find((s) => s.id === segment)!;
  return (
    <AbsoluteFill>
      {!muted && <Audio src={staticFile(`${episode}/narration.wav`)} trimBefore={seg.startFrame} />}
      <SegmentView tl={tl} seg={seg} />
    </AbsoluteFill>
  );
};

/** A segment as a vertical Short, with its own slice of the narration. */
const Short: React.FC<{ episode: string; segment: string }> = ({ episode, segment }) => {
  useFonts();
  const tl = TIMELINES.find((t) => t.key === episode)!;
  const seg = tl.segments.find((s) => s.id === segment)!;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`${episode}/narration.wav`)} trimBefore={seg.startFrame} />
      <ShortView tl={tl} seg={seg} />
    </AbsoluteFill>
  );
};

const Thumb: React.FC<{ episode: string }> = ({ episode }) => {
  useFonts();
  return <Thumbnail tl={TIMELINES.find((t) => t.key === episode)!} />;
};

export const Root: React.FC = () => (
  <>
    {TIMELINES.map((tl: Timeline) => (
      <Folder key={tl.key} name={tl.key}>
        <Composition id={tl.key} component={Episode} fps={tl.fps} width={tl.video.width} height={tl.video.height}
          durationInFrames={tl.durationInFrames} defaultProps={{ episode: tl.key, muted: false }} />
        {tl.segments.map((s) => (
          <Composition key={s.id} id={`${tl.key}-${s.id}`} component={Segment} fps={tl.fps} width={tl.video.width} height={tl.video.height}
            durationInFrames={s.durationInFrames} defaultProps={{ episode: tl.key, segment: s.id, muted: false }} />
        ))}
        {tl.segments.filter((s) => s.short).map((s) => (
          <Composition key={"short-" + s.id} id={`${tl.key}-short-${s.id}`} component={Short} fps={tl.fps} width={tl.shorts.width} height={tl.shorts.height}
            durationInFrames={s.durationInFrames} defaultProps={{ episode: tl.key, segment: s.id }} />
        ))}
        <Composition id={`${tl.key}-thumbnail`} component={Thumb} fps={tl.fps} width={1280} height={720} durationInFrames={1} defaultProps={{ episode: tl.key }} />
      </Folder>
    ))}
  </>
);
