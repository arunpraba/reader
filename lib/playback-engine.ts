import {
  activate as activateMediaPlayer,
  deactivate as deactivateMediaPlayer,
  setPlaybackState,
  updatePosition,
} from "./media-player";
import { createBrowserProvider } from "./tts/browser-provider";
import { browserTtsAvailable } from "./tts/capabilities";
import type { TtsSpeakContext } from "./tts/types";
import type { Word } from "./reader";
import { LARGE_DOC_WORD_THRESHOLD } from "./word-index";

export type PlaybackSettings = {
  wpm: number;
  wordGap: number;
  sentenceGap: number;
  paragraphGap: number;
  pauseEnabled: { word: boolean; sentence: boolean; paragraph: boolean };
  wordRepeats: number;
  sentenceRepeats: number;
  paragraphRepeats: number;
  preferredVoice: string;
};

export type PlaybackDocument = {
  id: string;
  title: string;
  words: Word[];
};

export type PlaybackSnapshot = {
  doc: PlaybackDocument | null;
  playing: boolean;
  progress: number;
  active: Word | null;
};

const defaultSettings: PlaybackSettings = {
  wpm: 150,
  wordGap: 0,
  sentenceGap: 0,
  paragraphGap: 0,
  pauseEnabled: { word: false, sentence: false, paragraph: false },
  wordRepeats: 1,
  sentenceRepeats: 1,
  paragraphRepeats: 1,
  preferredVoice: "",
};

export function estimatePlayheadDuration(wordCount: number, wpm: number) {
  if (wordCount <= 0 || wpm <= 0) return 0;
  return (wordCount / wpm) * 60;
}

function createPlaybackEngine() {
  const browserProvider = createBrowserProvider();
  let doc: PlaybackDocument | null = null;
  let playing = false;
  let paused = false;
  let progress = 0;
  let active: Word | null = null;
  /** Absolute index into doc.words — avoids O(n) findIndex on every TTS tick. */
  let cursor = 0;
  let runId = 0;
  let settings: PlaybackSettings = { ...defaultSettings };
  let frozenMediaProgress: {
    position: number;
    duration: number;
    playbackRate: number;
  } | null = null;
  let cached: PlaybackSnapshot = {
    doc: null,
    playing: false,
    progress: 0,
    active: null,
  };
  const listeners = new Set<() => void>();
  let emitRaf = 0;

  const getProvider = () => browserProvider;

  const activeIndex = () => {
    const words = doc?.words ?? [];
    const current = active;
    if (!words.length || !current) return 0;
    const atCursor = words[cursor];
    if (
      atCursor &&
      atCursor.blockIndex === current.blockIndex &&
      atCursor.sentenceIndex === current.sentenceIndex &&
      atCursor.wordIndex === current.wordIndex
    ) {
      return cursor;
    }
    const found = words.findIndex(
      (word) =>
        word.blockIndex === current.blockIndex &&
        word.sentenceIndex === current.sentenceIndex &&
        word.wordIndex === current.wordIndex,
    );
    if (found >= 0) cursor = found;
    return found < 0 ? 0 : found;
  };

  const setActiveAt = (index: number) => {
    const words = doc?.words ?? [];
    if (!words.length) {
      active = null;
      cursor = 0;
      return;
    }
    const safe = Math.min(words.length - 1, Math.max(0, index));
    cursor = safe;
    active = words[safe];
  };

  const getMediaProgress = () => {
    if (frozenMediaProgress) return frozenMediaProgress;
    const words = doc?.words ?? [];
    const duration = estimatePlayheadDuration(words.length, settings.wpm);
    const index = activeIndex();
    const safeIndex = index < 0 ? 0 : index;
    const maxIndex = Math.max(1, words.length - 1);
    const position = words.length
      ? (Math.min(safeIndex, words.length - 1) / maxIndex) * duration
      : 0;
    return {
      position,
      duration,
      // macOS extrapolates the scrubber while rate > 0 — must be 0 when paused.
      playbackRate: playing ? settings.wpm / 150 : 0,
    };
  };

  const syncMediaPosition = () => {
    if (!playing && !paused) return;
    updatePosition(getMediaProgress());
  };

  const notifyListeners = () => {
    listeners.forEach((listener) => listener());
  };

  const emit = (immediate = false) => {
    cached = { doc, playing, progress, active };
    syncMediaPosition();
    const large =
      (doc?.words.length ?? 0) >= LARGE_DOC_WORD_THRESHOLD &&
      typeof requestAnimationFrame === "function";
    if (!large || immediate) {
      if (emitRaf) {
        cancelAnimationFrame(emitRaf);
        emitRaf = 0;
      }
      notifyListeners();
      return;
    }
    if (emitRaf) return;
    emitRaf = requestAnimationFrame(() => {
      emitRaf = 0;
      notifyListeners();
    });
  };

  let intentionalCancel = false;

  const speakContext = (id: number): TtsSpeakContext => ({
    runId: id,
    isActive: () => id === runId,
    markIntentionalCancel: () => {
      intentionalCancel = true;
    },
    isIntentionalCancel: () => intentionalCancel,
  });

  const mediaHandlers = () => ({
    title: doc?.title ?? "Reading",
    onPlay: () => {
      if (paused) resume();
      else if (!playing) void play(Math.max(0, activeIndex()));
    },
    onPause: () => {
      if (playing) pause();
    },
    onPrevious: () => jump("paragraph", -1),
    onNext: () => jump("paragraph", 1),
    onSeek: (ratio: number) => {
      seekToRatio(ratio, playing || paused);
    },
    getProgress: getMediaProgress,
  });

  const haltSpeech = () => {
    intentionalCancel = true;
    runId += 1;
    browserProvider.cancel();
  };

  const stop = (clearActive = true) => {
    haltSpeech();
    paused = false;
    playing = false;
    frozenMediaProgress = null;
    deactivateMediaPlayer();
    if (clearActive) {
      active = null;
      cursor = 0;
    }
    emit(true);
  };

  const pause = () => {
    if (!playing || paused) return;
    const snap = getMediaProgress();
    paused = true;
    playing = false;
    frozenMediaProgress = { ...snap, playbackRate: 0 };
    getProvider().pause?.();
    setPlaybackState("paused");
    emit(true);
  };

  const resume = () => {
    if (!paused) return;
    frozenMediaProgress = null;
    paused = false;
    playing = true;
    getProvider().resume?.();
    setPlaybackState("playing");
    emit(true);
  };

  const wait = (seconds: number, id: number) =>
    new Promise<void>((resolve) => {
      let remaining = seconds * 1000;
      const step = () => {
        if (id !== runId) {
          resolve();
          return;
        }
        if (paused) {
          window.setTimeout(step, 100);
          return;
        }
        if (remaining <= 0) {
          resolve();
          return;
        }
        const chunk = Math.min(100, remaining);
        window.setTimeout(() => {
          remaining -= chunk;
          step();
        }, chunk);
      };
      step();
    });

  const waitWhilePaused = (id: number) =>
    new Promise<void>((resolve) => {
      const step = () => {
        if (id !== runId || !paused) {
          resolve();
          return;
        }
        window.setTimeout(step, 100);
      };
      step();
    });

  const speakWord = async (word: Word, id: number) => {
    await waitWhilePaused(id);
    if (id !== runId) return;
    const ctx = speakContext(id);
    await getProvider().speakWord(word, settings, ctx);
  };

  const speakRun = async (run: Word[], runStart: number, id: number) => {
    await waitWhilePaused(id);
    if (id !== runId) return;
    const ctx = speakContext(id);
    let runCursor = 0;
    await getProvider().speakRun(run, settings, ctx, (word) => {
      if (paused) return;
      while (runCursor < run.length && run[runCursor] !== word) runCursor += 1;
      if (runCursor < run.length) {
        cursor = runStart + runCursor;
        active = word;
      } else {
        active = word;
      }
      emit();
    });
  };

  const play = async (startIndex = 0) => {
    const words = doc?.words ?? [];
    if (!words.length) return;
    if (!browserTtsAvailable()) return;
    const normalizedStart = Math.min(words.length - 1, Math.max(0, startIndex));
    // Cancel speech only — keep Media Session / silent track alive across seeks.
    haltSpeech();
    const id = ++runId;
    intentionalCancel = false;
    playing = true;
    paused = false;
    frozenMediaProgress = null;
    progress = normalizedStart / words.length;
    setActiveAt(normalizedStart);
    activateMediaPlayer(mediaHandlers(), {
      silentLoop: true,
      resumeSpeech: true,
    });
    setPlaybackState("playing");
    emit(true);
    const remainingCount = words.length - normalizedStart;
    const total =
      remainingCount *
      settings.wordRepeats *
      settings.sentenceRepeats *
      settings.paragraphRepeats;
    let completed = 0;
    // Walk remaining words lazily — do not pre-group all large-doc words into nested arrays.
    let i = normalizedStart;
    while (i < words.length) {
      if (id !== runId) return;
      const blockIndex = words[i].blockIndex;
      const paraStart = i;
      while (i < words.length && words[i].blockIndex === blockIndex) i += 1;
      const paragraph = words.slice(paraStart, i);
      for (let pr = 0; pr < settings.paragraphRepeats; pr++) {
        const sentences = paragraph.reduce<Word[][]>((groups, word) => {
          const last = groups.at(-1);
          if (!last || last[0].sentenceIndex !== word.sentenceIndex)
            groups.push([word]);
          else last.push(word);
          return groups;
        }, []);
        let sentenceOffset = 0;
        for (const sentence of sentences) {
          const sentenceStart = paraStart + sentenceOffset;
          sentenceOffset += sentence.length;
          for (let sr = 0; sr < settings.sentenceRepeats; sr++) {
            if (!settings.pauseEnabled.word && settings.wordRepeats === 1) {
              const runs = sentence.reduce<Word[][]>((groups, word) => {
                const last = groups.at(-1);
                if (!last || last[0].language !== word.language)
                  groups.push([word]);
                else last.push(word);
                return groups;
              }, []);
              let runOffset = 0;
              for (const run of runs) {
                if (id !== runId) return;
                await speakRun(run, sentenceStart + runOffset, id);
                runOffset += run.length;
                completed += run.length;
                progress = completed / total;
                emit();
              }
            } else
              for (let wi = 0; wi < sentence.length; wi++) {
                const word = sentence[wi];
                for (let wr = 0; wr < settings.wordRepeats; wr++) {
                  if (id !== runId) return;
                  setActiveAt(sentenceStart + wi);
                  emit();
                  await speakWord(word, id);
                  completed += 1;
                  progress = completed / total;
                  emit();
                  if (
                    (wr < settings.wordRepeats - 1 || !word.sentenceEnd) &&
                    settings.pauseEnabled.word
                  )
                    await wait(settings.wordGap, id);
                }
              }
            if (
              (sr < settings.sentenceRepeats - 1 ||
                !sentence.at(-1)?.paragraphEnd) &&
              settings.pauseEnabled.sentence
            )
              await wait(settings.sentenceGap, id);
          }
        }
        if (settings.pauseEnabled.paragraph)
          await wait(settings.paragraphGap, id);
      }
    }
    if (id === runId) {
      playing = false;
      paused = false;
      progress = 1;
      deactivateMediaPlayer();
      emit(true);
    }
  };

  const jump = (unit: "sentence" | "paragraph", direction: -1 | 1) => {
    const words = doc?.words ?? [];
    if (!words.length) return;
    const starts = words.reduce<number[]>((items, word, index) => {
      const previous = words[index - 1];
      if (
        !previous ||
        (unit === "paragraph"
          ? previous.blockIndex !== word.blockIndex
          : previous.blockIndex !== word.blockIndex ||
            previous.sentenceIndex !== word.sentenceIndex)
      )
        items.push(index);
      return items;
    }, []);
    const current = activeIndex();
    let group = Math.max(
      0,
      starts.findIndex(
        (start, index) =>
          start <= current && (starts[index + 1] ?? Infinity) > current,
      ),
    );
    group = Math.min(starts.length - 1, Math.max(0, group + direction));
    const target = starts[group] ?? 0;
    const shouldResume = playing || paused;
    haltSpeech();
    playing = false;
    paused = shouldResume ? false : paused;
    frozenMediaProgress = null;
    setActiveAt(target);
    progress = target / Math.max(1, words.length);
    emit(true);
    if (shouldResume) queueMicrotask(() => void play(target));
  };

  const seekToRatio = (ratio: number, resumePlayback = true) => {
    const words = doc?.words ?? [];
    if (!words.length) return 0;
    const target = Math.min(
      words.length - 1,
      Math.max(0, Math.round(ratio * (words.length - 1))),
    );
    const wasActive = playing || paused;
    const shouldResume = resumePlayback && wasActive;
    haltSpeech();
    playing = false;
    // Keep session alive while scrubbing / seeking without tearing Media Session down.
    paused = wasActive && !shouldResume;
    frozenMediaProgress = null;
    setActiveAt(target);
    progress = target / Math.max(1, words.length);
    if (paused) {
      frozenMediaProgress = { ...getMediaProgress(), playbackRate: 0 };
    }
    emit(true);
    if (shouldResume) {
      queueMicrotask(() => void play(target));
    } else if (wasActive) {
      setPlaybackState("paused");
    }
    return target;
  };

  return {
    getSnapshot: () => cached,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    bindDocument(next: PlaybackDocument) {
      if (doc?.id === next.id) {
        doc = next;
        emit(true);
        return;
      }
      stop(true);
      doc = next;
      progress = 0;
      active = null;
      cursor = 0;
      emit(true);
    },
    updateSettings(next: PlaybackSettings) {
      settings = next;
      syncMediaPosition();
    },
    play,
    pause,
    resume,
    stop,
    togglePlay() {
      if (paused) resume();
      else if (playing) pause();
      else void play(Math.max(0, activeIndex()));
    },
    jump,
    seekToRatio,
    activeIndex,
  };
}

export type PlaybackEngine = ReturnType<typeof createPlaybackEngine>;

const globalKey = "__marginPlaybackEngine";

export function getPlaybackEngine(): PlaybackEngine {
  const scope = globalThis as typeof globalThis & {
    [globalKey]?: PlaybackEngine;
  };
  if (!scope[globalKey]) scope[globalKey] = createPlaybackEngine();
  return scope[globalKey];
}
