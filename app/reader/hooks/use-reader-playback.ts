import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { Word } from "../../../lib/reader";
import { Doc, storage } from "../../../lib/storage";
import { usePlayback } from "../../playback-provider";

type ReaderSettingsSlice = {
  wpm: number;
  wordGap: number;
  sentenceGap: number;
  paragraphGap: number;
  pauseEnabled: {
    word: boolean;
    sentence: boolean;
    paragraph: boolean;
  };
  wordRepeats: number;
  sentenceRepeats: number;
  paragraphRepeats: number;
  preferredVoice: string;
  ttsEngine: "browser" | "edge";
  preferredEdgeVoice: string;
};

export function useReaderPlayback({
  doc,
  words,
  settings,
  positionRef,
  setMinimized,
}: {
  doc: Doc | null;
  words: Word[];
  settings: ReaderSettingsSlice;
  positionRef: MutableRefObject<Doc["readingPosition"]>;
  setMinimized: (value: boolean) => void;
}) {
  const {
    playing,
    progress,
    active,
    bindDocument,
    updateSettings,
    play,
    togglePlay,
    jump: jumpPlayback,
    seekToRatio: seekPlayback,
    activeIndex,
  } = usePlayback();
  const scrubbingRef = useRef<{ resume: boolean; target: number } | null>(null);

  useEffect(() => {
    if (!doc) return;
    bindDocument({ id: doc.id, title: doc.title, words });
  }, [bindDocument, doc, words]);

  useEffect(() => {
    updateSettings({
      wpm: settings.wpm,
      wordGap: settings.wordGap,
      sentenceGap: settings.sentenceGap,
      paragraphGap: settings.paragraphGap,
      pauseEnabled: settings.pauseEnabled,
      wordRepeats: settings.wordRepeats,
      sentenceRepeats: settings.sentenceRepeats,
      paragraphRepeats: settings.paragraphRepeats,
      preferredVoice: settings.preferredVoice,
      ttsEngine: settings.ttsEngine,
      preferredEdgeVoice: settings.preferredEdgeVoice,
    });
  }, [
    updateSettings,
    settings.wpm,
    settings.wordGap,
    settings.sentenceGap,
    settings.paragraphGap,
    settings.pauseEnabled,
    settings.wordRepeats,
    settings.sentenceRepeats,
    settings.paragraphRepeats,
    settings.preferredVoice,
    settings.ttsEngine,
    settings.preferredEdgeVoice,
  ]);

  useEffect(() => {
    if (!doc || active || !doc.readingPosition || !words.length || playing)
      return;
    const saved = doc.readingPosition;
    const restoredIndex = words.findIndex(
      (word) =>
        word.blockIndex === saved.blockIndex &&
        word.sentenceIndex === saved.sentenceIndex &&
        word.wordIndex === saved.wordIndex,
    );
    if (restoredIndex >= 0)
      seekPlayback(restoredIndex / Math.max(1, words.length - 1 || 1), false);
  }, [active, doc, playing, seekPlayback, words]);

  useEffect(() => {
    if (!doc || !active) return;
    const position = {
      blockIndex: active.blockIndex,
      sentenceIndex: active.sentenceIndex,
      wordIndex: active.wordIndex,
      progress,
      savedAt: Date.now(),
    };
    positionRef.current = position;
    storage.save({ ...doc, readingPosition: position });
  }, [active, progress]);

  const startAt = useCallback(
    (blockIndex: number, wordOrdinal: number) => {
      const blockWords = words.filter((word) => word.blockIndex === blockIndex);
      const target =
        blockWords[Math.min(blockWords.length - 1, Math.max(0, wordOrdinal))];
      const index = target ? words.indexOf(target) : -1;
      if (index >= 0) {
        setMinimized(true);
        play(index);
      }
    },
    [play, setMinimized, words],
  );

  const jump = useCallback(
    (unit: "sentence" | "paragraph", direction: -1 | 1) => {
      setMinimized(true);
      jumpPlayback(unit, direction);
    },
    [jumpPlayback, setMinimized],
  );

  const seekToRatio = useCallback(
    (ratio: number, resume = true) => {
      const target = seekPlayback(ratio, resume);
      if (scrubbingRef.current) scrubbingRef.current.target = target;
      return target;
    },
    [seekPlayback],
  );

  const seekFromProgress = useCallback(
    (ratio: number) => seekToRatio(ratio, scrubbingRef.current === null),
    [seekToRatio],
  );

  const onScrubStart = useCallback(() => {
    scrubbingRef.current = {
      resume: playing,
      target: activeIndex(),
    };
  }, [activeIndex, playing]);

  const onScrubEnd = useCallback(() => {
    const scrub = scrubbingRef.current;
    scrubbingRef.current = null;
    if (scrub?.resume) queueMicrotask(() => play(Math.max(0, scrub.target)));
  }, [play]);

  return {
    playing,
    progress,
    active,
    play,
    togglePlay,
    startAt,
    jump,
    seekToRatio,
    seekFromProgress,
    onScrubStart,
    onScrubEnd,
    activeIndex,
  };
}
