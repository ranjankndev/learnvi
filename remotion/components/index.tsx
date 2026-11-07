/**
 * Component registry: the "component" name in episode.json picks an entry here.
 * To add a component: write it, then add one line below.
 */
import React from "react";
import { C, F, useSeg } from "../ui";
import type { SegProps } from "../types";
import { PassportStamp, RecapNext, RouteMap, TitleHook } from "./journey";
import { BpeMerge, TextToNumbers, ThreeOptions, TokenBlocks, WhyItMatters } from "./teach";
import { Blooper, ChatStream, MythVsReality, TryIt, UseIt } from "./recurring";
import { KIT_COMPONENTS } from "../kit/scenes";
import { AttentionArcs, MeaningMap } from "./maps";
import { NextToken, Temperature } from "./predict";
import { PromptStack } from "./app";

export const COMPONENTS: Record<string, React.FC<SegProps>> = {
  // general-purpose scene kit (remotion/kit): usable by any series, validated by kit/specs.ts
  ...(KIT_COMPONENTS as unknown as Record<string, React.FC<SegProps>>),
  // custom scenes for the press-enter series
  PassportStamp, TitleHook, RouteMap, RecapNext,
  TextToNumbers, ThreeOptions, BpeMerge, TokenBlocks, WhyItMatters,
  TryIt, Blooper, MythVsReality, UseIt, ChatStream, MeaningMap, AttentionArcs, NextToken, Temperature, PromptStack,
};

/** Shown for a component name that isn't registered yet, so a new episode still previews. */
export const Placeholder: React.FC<SegProps> = (props) => {
  const { seg } = useSeg();
  return (
    <div style={{ position: "absolute", inset: 140, border: `4px dashed ${C.line}`, borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F.mono, color: C.mute, gap: 20 }}>
      <div style={{ fontSize: 56, color: C.sun }}>{seg.component}</div>
      <div style={{ fontSize: 28 }}>component not built yet · segment “{seg.id}” ({seg.kind})</div>
      <div style={{ fontSize: 22, maxWidth: 1300, opacity: 0.7 }}>{JSON.stringify(props).slice(0, 300)}</div>
    </div>
  );
};
