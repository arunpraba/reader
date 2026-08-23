import { detectLanguage, type Word } from "./reader";

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

type Listener = () => void;

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

function createPlaybackEngine() {
  let doc: PlaybackDocument | null = null;
  let playing = false;
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

  const emit = () => {
    cached = { doc, playing, progress, active };
    listeners.forEach((listener) => listener());
  };

  let intentionalCancel = false;

  const stop = (clearActive = true) => {
    intentionalCancel = true;
    runId += 1;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    playing = false;
    if (clearActive) active = null;
    emit();
  };

  const configureUtterance = (
    utterance: SpeechSynthesisUtterance,
    language: string,
  ) => {
    utterance.lang = language;
    utterance.rate = Math.min(10, Math.max(0.1, settings.wpm / 150));
    const available = speechSynthesis.getVoices();
    const preferred = available.find(
      (voice) =>
        voice.voiceURI === settings.preferredVoice &&
        voice.lang
          .toLowerCase()
          .startsWith(utterance.lang.slice(0, 2).toLowerCase()),
    );
    utterance.voice =
      preferred ??
      available.find(
        (voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase(),
      ) ??
      available.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(utterance.lang.slice(0, 2).toLowerCase()),
      ) ??
      null;
  };

  const isInterruptError = (error: string) =>
    error === "interrupted" || error === "canceled";

  const speakWord = async (word: Word, id: number) => {
    for (;;) {
      if (id !== runId) return;
      const result = await new Promise<"end" | "retry">((resolve) => {
        intentionalCancel = false;
        const utterance = new SpeechSynthesisUtterance(word.text);
        configureUtterance(utterance, detectLanguage(word.text));
        utterance.onend = () => resolve("end");
        utterance.onerror = (event) => {
          if (intentionalCancel || id !== runId) resolve("end");
          else if (isInterruptError(event.error)) resolve("retry");
          else resolve("end");
        };
        speechSynthesis.speak(utterance);
      });
      if (result === "end" || id !== runId) return;
      await wait(0.12, id);
    }
  };

  const speakRun = async (run: Word[], id: number) => {
    for (;;) {
      if (id !== runId) return;
      const text = run.map((word) => word.text).join(" ");
      const starts: number[] = [];
      let cursor = 0;
      run.forEach((word) => {
        starts.push(cursor);
        cursor += word.text.length + 1;
      });
      const result = await new Promise<"end" | "retry">((resolve) => {
        intentionalCancel = false;
        const utterance = new SpeechSynthesisUtterance(text);
        configureUtterance(utterance, run[0].language);
        active = run[0];
        emit();
        utterance.onboundary = (event) => {
          let index = 0;
          starts.forEach((start, item) => {
            if (start <= event.charIndex) index = item;
          });
          active = run[index];
          emit();
        };
        utterance.onend = () => {
          active = run.at(-1) ?? null;
          emit();
          resolve("end");
        };
        utterance.onerror = (event) => {
          if (intentionalCancel || id !== runId) resolve("end");
          else if (isInterruptError(event.error)) resolve("retry");
          else resolve("end");
        };
        speechSynthesis.speak(utterance);
      });
      if (result === "end" || id !== runId) return;
      await wait(0.12, id);
    }
  };

  const wait = (seconds: number, id: number) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        if (id === runId) resolve();
        else resolve();
      }, seconds * 1000);
    });

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

  const play = async (startIndex = 0) => {
    const words = doc?.words ?? [];
    if (!words.length) return;
    const normalizedStart = Math.min(words.length - 1, Math.max(0, startIndex));
    stop(false);
    const id = ++runId;
    playing = true;
    progress = normalizedStart / words.length;
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
      progress = 1;
      emit();
    }
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
    stop,
    togglePlay() {
      if (playing) stop(false);
      else void play(Math.max(0, activeIndex()));
    },
    jump(unit: "sentence" | "paragraph", direction: -1 | 1) {
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
      const resume = playing;
      stop(false);
      active = words[target];
      progress = target / Math.max(1, words.length);
      emit();
      if (resume) queueMicrotask(() => void play(target));
    },
    seekToRatio(ratio: number, resume = true) {
      const words = doc?.words ?? [];
      if (!words.length) return 0;
      const target = Math.min(
        words.length - 1,
        Math.max(0, Math.round(ratio * (words.length - 1))),
      );
      const shouldResume = resume && playing;
      stop(false);
      active = words[target];
      progress = target / Math.max(1, words.length);
      emit();
      if (shouldResume) queueMicrotask(() => void play(target));
      return target;
    },
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
