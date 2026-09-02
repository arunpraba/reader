import { pauseAudio, playBlob, resumeAudio, stopAudio } from "../media-player";
import type { PlaybackSettings } from "../playback-engine";
import type { Word } from "../reader";
import { loadEdgeTts } from "./load-edge";
import type { SpeakResult, TtsProvider, TtsVoiceOption } from "./types";

type EdgeVoicesManager = {
  find: (filter: {
    Locale?: string;
    Language?: string;
  }) => Array<{ ShortName: string }>;
};

let voicesManager: EdgeVoicesManager | null = null;
let boundaryTimers: number[] = [];
let canceled = false;

function wpmToRate(wpm: number) {
  return `${Math.round((wpm / 150 - 1) * 100)}%`;
}

function clearPlayback() {
  boundaryTimers.forEach((timer) => window.clearTimeout(timer));
  boundaryTimers = [];
  stopAudio();
}

async function getVoicesManager() {
  if (!voicesManager) {
    const { VoicesManager } = await loadEdgeTts();
    voicesManager = await VoicesManager.create();
  }
  return voicesManager;
}

async function resolveEdgeVoice(language: string, settings: PlaybackSettings) {
  if (settings.preferredEdgeVoice) return settings.preferredEdgeVoice;
  const manager = await getVoicesManager();
  const exact = manager.find({ Locale: language });
  if (exact[0]) return exact[0].ShortName;
  const languageCode = language.slice(0, 2);
  const partial = manager.find({ Language: languageCode });
  if (partial[0]) return partial[0].ShortName;
  return "en-US-EmmaMultilingualNeural";
}

function scheduleWordBoundaries(
  run: Word[],
  boundaries: Array<{ offset: number; text: string }>,
  onWord: (word: Word) => void,
  isActive: () => boolean,
) {
  let wordIndex = 0;
  boundaries.forEach((boundary) => {
    const ms = boundary.offset / 10000;
    const timer = window.setTimeout(() => {
      if (!isActive() || canceled) return;
      const normalized = boundary.text.trim();
      while (wordIndex < run.length && run[wordIndex].text !== normalized)
        wordIndex += 1;
      if (wordIndex < run.length) {
        onWord(run[wordIndex]);
        wordIndex += 1;
      }
    }, ms);
    boundaryTimers.push(timer);
  });
}

async function playAudio(
  blob: Blob,
  isActive: () => boolean,
): Promise<SpeakResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: SpeakResult) => {
      if (settled) return;
      settled = true;
      window.clearInterval(poll);
      resolve(value);
    };
    const poll = window.setInterval(() => {
      if (!isActive() || canceled) {
        stopAudio();
        finish("end");
      }
    }, 100);
    void playBlob(blob).then(() => finish("end"));
  });
}

async function synthesizeAndPlay(
  text: string,
  language: string,
  settings: PlaybackSettings,
  isActive: () => boolean,
  onWord?: (word: Word) => void,
  run?: Word[],
) {
  if (!isActive() || canceled) return "end";
  const { EdgeTTS } = await loadEdgeTts();
  const voice = await resolveEdgeVoice(language, settings);
  const tts = new EdgeTTS(text, voice, { rate: wpmToRate(settings.wpm) });
  let result;
  try {
    result = await tts.synthesize();
  } catch {
    return "end";
  }
  if (!isActive() || canceled) return "end";
  if (run && onWord) {
    onWord(run[0]);
    scheduleWordBoundaries(run, result.subtitle, onWord, isActive);
  }
  return playAudio(result.audio, isActive);
}

export function createEdgeProvider(): TtsProvider {
  return {
    cancel() {
      canceled = true;
      clearPlayback();
    },
    pause() {
      pauseAudio();
    },
    resume() {
      resumeAudio();
    },
    async speakWord(word, settings, ctx) {
      for (;;) {
        if (!ctx.isActive()) return "end";
        canceled = false;
        const result = await synthesizeAndPlay(
          word.text,
          word.language,
          settings,
          ctx.isActive,
        );
        if (result === "end" || !ctx.isActive()) return "end";
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
    },
    async speakRun(run, settings, ctx, onWord) {
      for (;;) {
        if (!ctx.isActive()) return "end";
        canceled = false;
        clearPlayback();
        const text = run.map((word) => word.text).join(" ");
        const result = await synthesizeAndPlay(
          text,
          run[0].language,
          settings,
          ctx.isActive,
          onWord,
          run,
        );
        clearPlayback();
        if (result === "end" || !ctx.isActive()) return "end";
        onWord(run.at(-1) ?? run[0]);
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
    },
    async listVoices(): Promise<TtsVoiceOption[]> {
      const { listVoices } = await loadEdgeTts();
      const voices = await listVoices();
      return voices.map((voice) => ({
        id: voice.ShortName,
        label: voice.FriendlyName,
        lang: voice.Locale,
      }));
    },
  };
}
