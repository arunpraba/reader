import type { HighlightLevels } from "./reader";

export type ReaderSettings = {
  levels: HighlightLevels;
  highlightColors: {
    word: string;
    sentence: string;
    paragraph: string;
  };
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
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
};

export const defaultReaderSettings: ReaderSettings = {
  levels: { word: true, sentence: false, paragraph: false },
  highlightColors: {
    word: "#e6b54f",
    sentence: "#f2d78f",
    paragraph: "#cfe5d8",
  },
  wpm: 150,
  wordGap: 0,
  sentenceGap: 0,
  paragraphGap: 0,
  pauseEnabled: { word: false, sentence: false, paragraph: false },
  wordRepeats: 1,
  sentenceRepeats: 1,
  paragraphRepeats: 1,
  preferredVoice: "",
  fontSize: 21,
  lineHeight: 1.85,
  letterSpacing: 0,
};

const SETTINGS_KEY = "margin-reader-settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readLegacySettings(): Partial<ReaderSettings> {
  const next: Partial<ReaderSettings> = {};
  const voice = localStorage.getItem("margin-preferred-voice");
  if (voice !== null) next.preferredVoice = voice;

  try {
    const colors = localStorage.getItem("margin-highlight-colors");
    if (colors) next.highlightColors = JSON.parse(colors);
  } catch {}

  try {
    const typography = localStorage.getItem("margin-typography");
    if (typography) {
      const parsed = JSON.parse(typography) as Partial<ReaderSettings>;
      if (typeof parsed.fontSize === "number") next.fontSize = parsed.fontSize;
      if (typeof parsed.lineHeight === "number")
        next.lineHeight = parsed.lineHeight;
      if (typeof parsed.letterSpacing === "number")
        next.letterSpacing = parsed.letterSpacing;
    }
  } catch {}

  return next;
}

export function loadReaderSettings(): ReaderSettings {
  if (typeof window === "undefined") return defaultReaderSettings;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const saved = raw ? (JSON.parse(raw) as unknown) : null;
    const legacy = readLegacySettings();
    const merged = {
      ...defaultReaderSettings,
      ...legacy,
      ...(isRecord(saved) ? saved : {}),
    };

    return {
      ...defaultReaderSettings,
      ...merged,
      levels: {
        ...defaultReaderSettings.levels,
        ...(isRecord(merged.levels) ? merged.levels : {}),
      },
      highlightColors: {
        ...defaultReaderSettings.highlightColors,
        ...(isRecord(merged.highlightColors) ? merged.highlightColors : {}),
      },
      pauseEnabled: {
        ...defaultReaderSettings.pauseEnabled,
        ...(isRecord(merged.pauseEnabled) ? merged.pauseEnabled : {}),
      },
    } as ReaderSettings;
  } catch {
    return {
      ...defaultReaderSettings,
      ...readLegacySettings(),
    } as ReaderSettings;
  }
}

export function saveReaderSettings(settings: ReaderSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem("margin-preferred-voice", settings.preferredVoice);
  localStorage.setItem(
    "margin-highlight-colors",
    JSON.stringify(settings.highlightColors),
  );
  localStorage.setItem(
    "margin-typography",
    JSON.stringify({
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      letterSpacing: settings.letterSpacing,
    }),
  );
}
