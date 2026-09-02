import type { PlaybackSettings } from "../playback-engine";
import type { Word } from "../reader";

export type SpeakResult = "end" | "retry";

export type TtsVoiceOption = {
  id: string;
  label: string;
  lang: string;
};

export type TtsSpeakContext = {
  runId: number;
  isActive: () => boolean;
  markIntentionalCancel: () => void;
  isIntentionalCancel: () => boolean;
};

export type TtsProvider = {
  cancel: () => void;
  pause?: () => void;
  resume?: () => void;
  speakWord: (
    word: Word,
    settings: PlaybackSettings,
    ctx: TtsSpeakContext,
  ) => Promise<SpeakResult>;
  speakRun: (
    run: Word[],
    settings: PlaybackSettings,
    ctx: TtsSpeakContext,
    onWord: (word: Word) => void,
  ) => Promise<SpeakResult>;
  listVoices?: () => Promise<TtsVoiceOption[]>;
};
