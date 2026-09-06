"use client";

import { createContext, useContext } from "react";
import type { PlaybackDocument, PlaybackSettings } from "@/lib/playback-engine";
import type { Word } from "@/lib/reader";

export type PlaybackContextValue = {
  docId: string | null;
  playing: boolean;
  progress: number;
  active: Word | null;
  bindDocument: (doc: PlaybackDocument) => void;
  updateSettings: (settings: PlaybackSettings) => void;
  play: (startIndex?: number) => void;
  stop: (clearActive?: boolean) => void;
  togglePlay: () => void;
  jump: (unit: "sentence" | "paragraph", direction: -1 | 1) => void;
  seekToRatio: (ratio: number, resume?: boolean) => number;
  activeIndex: () => number;
};

export const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function usePlayback() {
  const value = useContext(PlaybackContext);
  if (!value)
    throw new Error("usePlayback must be used within PlaybackProvider");
  return value;
}

export type { PlaybackDocument, PlaybackSettings };
