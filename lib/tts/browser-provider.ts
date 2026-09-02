import type { PlaybackSettings } from "../playback-engine";
import type { Word } from "../reader";
import type { SpeakResult, TtsProvider, TtsSpeakContext } from "./types";

export function createBrowserProvider(): TtsProvider {
  let intentionalCancel = false;
  let userPaused = false;

  const cancel = () => {
    intentionalCancel = true;
    userPaused = false;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  };

  const pause = () => {
    userPaused = true;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.pause();
  };

  const resume = () => {
    userPaused = false;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.resume();
  };

  const configureUtterance = (
    utterance: SpeechSynthesisUtterance,
    language: string,
    settings: PlaybackSettings,
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

  const speakUtterance = (
    utterance: SpeechSynthesisUtterance,
    ctx: TtsSpeakContext,
    onEnd: () => void,
  ) =>
    new Promise<SpeakResult>((resolve) => {
      intentionalCancel = false;
      let settled = false;
      let started = false;
      let resumeTimer = 0;
      const finish = (value: SpeakResult) => {
        if (settled) return;
        settled = true;
        window.clearInterval(resumeTimer);
        resolve(value);
      };
      utterance.onstart = () => {
        started = true;
      };
      utterance.onend = () => {
        onEnd();
        finish("end");
      };
      utterance.onerror = (event) => {
        if (intentionalCancel || ctx.isIntentionalCancel() || !ctx.isActive())
          finish("end");
        else if (isInterruptError(event.error)) finish("retry");
        else finish("end");
      };
      resumeTimer = window.setInterval(() => {
        if (!ctx.isActive()) {
          finish("end");
          return;
        }
        if (typeof speechSynthesis === "undefined") return;
        if (speechSynthesis.paused && !userPaused) speechSynthesis.resume();
        if (
          started &&
          !userPaused &&
          !speechSynthesis.speaking &&
          !speechSynthesis.pending
        )
          finish("retry");
      }, 1500);
      speechSynthesis.speak(utterance);
    });

  const speakWord = async (
    word: Word,
    settings: PlaybackSettings,
    ctx: TtsSpeakContext,
  ): Promise<SpeakResult> => {
    for (;;) {
      if (!ctx.isActive()) return "end";
      const utterance = new SpeechSynthesisUtterance(word.text);
      configureUtterance(utterance, word.language, settings);
      const result = await speakUtterance(utterance, ctx, () => undefined);
      if (result === "end" || !ctx.isActive()) return "end";
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
  };

  const speakRun = async (
    run: Word[],
    settings: PlaybackSettings,
    ctx: TtsSpeakContext,
    onWord: (word: Word) => void,
  ): Promise<SpeakResult> => {
    for (;;) {
      if (!ctx.isActive()) return "end";
      const text = run.map((word) => word.text).join(" ");
      const starts: number[] = [];
      let cursor = 0;
      run.forEach((word) => {
        starts.push(cursor);
        cursor += word.text.length + 1;
      });
      const utterance = new SpeechSynthesisUtterance(text);
      configureUtterance(utterance, run[0].language, settings);
      onWord(run[0]);
      utterance.onboundary = (event) => {
        let index = 0;
        starts.forEach((start, item) => {
          if (start <= event.charIndex) index = item;
        });
        onWord(run[index]);
      };
      const result = await speakUtterance(utterance, ctx, () => {
        onWord(run.at(-1) ?? run[0]);
      });
      if (result === "end" || !ctx.isActive()) return "end";
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
  };

  return {
    cancel,
    pause,
    resume,
    speakWord,
    speakRun,
  };
}
