"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getPlaybackEngine,
  type PlaybackDocument,
  type PlaybackSettings,
} from "@/lib/playback-engine";
import { GlobalMiniPlayer } from "../global-mini-player";
import { PlaybackContext, type PlaybackContextValue } from "./playback-context";

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const engine = getPlaybackEngine();
  const [sleepMinutes, setSleepMinutesState] = useState(0);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
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
  const setSleepMinutes = useCallback((minutes: number) => {
    setSleepMinutesState(minutes);
    setSleepEndsAt(minutes > 0 ? Date.now() + minutes * 60_000 : null);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!sleepEndsAt) return;
    const tick = window.setInterval(() => {
      const time = Date.now();
      if (time >= sleepEndsAt) {
        engine.stop(false);
        setSleepMinutesState(0);
        setSleepEndsAt(null);
        return;
      }
      setNow(time);
    }, 1000);
    return () => window.clearInterval(tick);
  }, [engine, sleepEndsAt]);

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
      sleepMinutes,
      sleepRemainingMs: sleepEndsAt ? Math.max(0, sleepEndsAt - now) : null,
      setSleepMinutes,
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
      sleepMinutes,
      sleepEndsAt,
      now,
      setSleepMinutes,
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
