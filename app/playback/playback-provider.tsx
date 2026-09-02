"use client";

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  getPlaybackEngine,
  type PlaybackDocument,
  type PlaybackSettings,
} from "../../lib/playback-engine";
import { GlobalMiniPlayer } from "../global-mini-player";
import {
  PlaybackContext,
  type PlaybackContextValue,
} from "./playback-context";

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const engine = getPlaybackEngine();
  const snapshot = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );

  const bindDocument = useCallback(
    (next: PlaybackDocument) => engine.bindDocument(next),
    [engine],
  );
  const updateSettings = useCallback(
    (settings: PlaybackSettings) => engine.updateSettings(settings),
    [engine],
  );
  const play = useCallback(
    (startIndex?: number) => {
      void engine.play(startIndex);
    },
    [engine],
  );
  const stop = useCallback(
    (clearActive?: boolean) => engine.stop(clearActive),
    [engine],
  );
  const togglePlay = useCallback(() => engine.togglePlay(), [engine]);
  const jump = useCallback(
    (unit: "sentence" | "paragraph", direction: -1 | 1) =>
      engine.jump(unit, direction),
    [engine],
  );
  const seekToRatio = useCallback(
    (ratio: number, resume?: boolean) => engine.seekToRatio(ratio, resume),
    [engine],
  );
  const activeIndex = useCallback(() => engine.activeIndex(), [engine]);

  const value = useMemo<PlaybackContextValue>(
    () => ({
      docId: snapshot.doc?.id ?? null,
      playing: snapshot.playing,
      progress: snapshot.progress,
      active: snapshot.active,
      bindDocument,
      updateSettings,
      play,
      stop,
      togglePlay,
      jump,
      seekToRatio,
      activeIndex,
    }),
    [
      snapshot.doc?.id,
      snapshot.playing,
      snapshot.progress,
      snapshot.active,
      bindDocument,
      updateSettings,
      play,
      stop,
      togglePlay,
      jump,
      seekToRatio,
      activeIndex,
    ],
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
      <GlobalMiniPlayer
        docId={snapshot.doc?.id ?? null}
        playing={snapshot.playing}
        progress={snapshot.progress}
        onTogglePlay={togglePlay}
      />
    </PlaybackContext.Provider>
  );
}
