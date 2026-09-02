import {
  activate as activateMediaPlayer,
  deactivate as deactivateMediaPlayer,
  setPlaybackState,
  updatePosition,
} from "./media-player";
import { createBrowserProvider } from "./tts/browser-provider";
import { createEdgeProvider } from "./tts/edge-provider";
import type { TtsSpeakContext } from "./tts/types";
import type { Word } from "./reader";

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
  ttsEngine: "browser" | "edge";
  preferredEdgeVoice: string;
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
  ttsEngine: "browser",
  preferredEdgeVoice: "",
};

function estimateDuration(wordCount: number, wpm: number) {
  if (wordCount <= 0 || wpm <= 0) return 0;
  return (wordCount / wpm) * 60;
}

function createPlaybackEngine() {
  const browserProvider = createBrowserProvider();
  const edgeProvider = createEdgeProvider();
  let doc: PlaybackDocument | null = null;
  let playing = false;
  let paused = false;
  let progress = 0;
  let active: Word | null = null;
  let runId = 0;
  let settings: PlaybackSettings = { ...defaultSettings };
  let cached: PlaybackSnapshot = {
    doc: null,
    playing: false,
    progress: 0,
    active: null,
  };
  const listeners = new Set<() => void>();

  const getProvider = () =>
    settings.ttsEngine === "edge" ? edgeProvider : browserProvider;

  const activeIndex = () => {
    const words = doc?.words ?? [];
    const current = active;
    if (!current) return 0;
    return words.findIndex(
      (word) =>
        word.blockIndex === current.blockIndex &&
        word.sentenceIndex === current.sentenceIndex &&
        word.wordIndex === current.wordIndex,
    );
  };

  const getMediaProgress = () => {
    const words = doc?.words ?? [];
    const duration = estimateDuration(words.length, settings.wpm);
    const index = activeIndex();
    const position = words.length ? (index / words.length) * duration : 0;
    return { position, duration, playbackRate: settings.wpm / 150 };
  };

  const syncMediaPosition = () => {
    if (!playing && !paused) return;
    updatePosition(getMediaProgress());
  };

  const emit = () => {
    cached = { doc, playing, progress, active };
    syncMediaPosition();
    listeners.forEach((listener) => listener());
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

  const stop = (clearActive = true) => {
    intentionalCancel = true;
    runId += 1;
    paused = false;
    browserProvider.cancel();
    edgeProvider.cancel();
    deactivateMediaPlayer();
    playing = false;
    if (clearActive) active = null;
    emit();
  };

  const pause = () => {
    if (!playing || paused) return;
    paused = true;
    playing = false;
    getProvider().pause?.();
    setPlaybackState("paused");
    emit();
  };

  const resume = () => {
    if (!paused) return;
    paused = false;
    playing = true;
    getProvider().resume?.();
    setPlaybackState("playing");
    emit();
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

  const speakWord = async (word: Word, id: number) => {
    const ctx = speakContext(id);
    await getProvider().speakWord(word, settings, ctx);
  };

  const speakRun = async (run: Word[], id: number) => {
    const ctx = speakContext(id);
    await getProvider().speakRun(run, settings, ctx, (word) => {
      active = word;
      emit();
    });
  };

  const play = async (startIndex = 0) => {
    const words = doc?.words ?? [];
    if (!words.length) return;
    const normalizedStart = Math.min(words.length - 1, Math.max(0, startIndex));
    stop(false);
    const id = ++runId;
    intentionalCancel = false;
    playing = true;
    paused = false;
    progress = normalizedStart / words.length;
    active = words[normalizedStart];
    activateMediaPlayer(mediaHandlers(), {
      silentLoop: settings.ttsEngine === "browser",
      resumeSpeech: settings.ttsEngine === "browser",
    });
    emit();
    const remainingWords = words.slice(normalizedStart);
    const paragraphs = remainingWords.reduce<Word[][]>((groups, word) => {
      const last = groups.at(-1);
      if (!last || last[0].blockIndex !== word.blockIndex) groups.push([word]);
      else last.push(word);
      return groups;
    }, []);
    let completed = 0;
    const total =
      remainingWords.length *
      settings.wordRepeats *
      settings.sentenceRepeats *
      settings.paragraphRepeats;
    for (const paragraph of paragraphs)
      for (let pr = 0; pr < settings.paragraphRepeats; pr++) {
        const sentences = paragraph.reduce<Word[][]>((groups, word) => {
          const last = groups.at(-1);
          if (!last || last[0].sentenceIndex !== word.sentenceIndex)
            groups.push([word]);
          else last.push(word);
          return groups;
        }, []);
        for (const sentence of sentences)
          for (let sr = 0; sr < settings.sentenceRepeats; sr++) {
            if (!settings.pauseEnabled.word && settings.wordRepeats === 1) {
              const runs = sentence.reduce<Word[][]>((groups, word) => {
                const last = groups.at(-1);
                if (!last || last[0].language !== word.language)
                  groups.push([word]);
                else last.push(word);
                return groups;
              }, []);
              for (const run of runs) {
                if (id !== runId) return;
                await speakRun(run, id);
                completed += run.length;
                progress = completed / total;
                emit();
              }
            } else
              for (const word of sentence)
                for (let wr = 0; wr < settings.wordRepeats; wr++) {
                  if (id !== runId) return;
                  active = word;
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
            if (
              (sr < settings.sentenceRepeats - 1 ||
                !sentence.at(-1)?.paragraphEnd) &&
              settings.pauseEnabled.sentence
            )
              await wait(settings.sentenceGap, id);
          }
        if (settings.pauseEnabled.paragraph)
          await wait(settings.paragraphGap, id);
      }
    if (id === runId) {
      playing = false;
      paused = false;
      progress = 1;
      deactivateMediaPlayer();
      emit();
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
    const resumePlayback = playing || paused;
    stop(false);
    active = words[target];
    progress = target / Math.max(1, words.length);
    emit();
    if (resumePlayback) queueMicrotask(() => void play(target));
  };

  const seekToRatio = (ratio: number, resumePlayback = true) => {
    const words = doc?.words ?? [];
    if (!words.length) return 0;
    const target = Math.min(
      words.length - 1,
      Math.max(0, Math.round(ratio * (words.length - 1))),
    );
    const shouldResume = resumePlayback && (playing || paused);
    stop(false);
    active = words[target];
    progress = target / Math.max(1, words.length);
    emit();
    if (shouldResume) queueMicrotask(() => void play(target));
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
        emit();
        return;
      }
      stop(true);
      doc = next;
      progress = 0;
      active = null;
      emit();
    },
    updateSettings(next: PlaybackSettings) {
      settings = next;
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
