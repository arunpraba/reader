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
  skipParentheticals: boolean;
  preferredVoice: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  guidedFocus: boolean;
  guidedFocusOpacity: number;
  settingsOpen: boolean;
  playerMinimized: boolean;
};

export const defaultReaderSettings: ReaderSettings = {
  levels: { word: true, sentence: true, paragraph: false },
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
  skipParentheticals: true,
  preferredVoice: "",
  fontSize: 1,
  lineHeight: 1.5,
  letterSpacing: 0,
  guidedFocus: false,
  guidedFocusOpacity: 0.4,
  settingsOpen: false,
  playerMinimized: false,
};

function normalizeGuidedFocusOpacity(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return defaultReaderSettings.guidedFocusOpacity;
  return Math.min(1, Math.max(0.1, Math.round(n * 20) / 20));
}

const SETTINGS_KEY = "margin-reader-settings";
const SELECTED_FOLDER_KEY = "margin-selected-folder";

function normalizeFontSizeRem(value: number) {
  if (value > 4) return Math.round((value / 16) * 8) / 8;
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readLegacySettings(): Partial<ReaderSettings> {
  const next: Partial<ReaderSettings> = {};
  const voice = localStorage.getItem("margin-preferred-voice");
  if (voice !== null) next.preferredVoice = voice;

  const minimized = localStorage.getItem("margin-player-minimized");
  if (minimized !== null) next.playerMinimized = minimized === "true";

  const settingsOpen = localStorage.getItem("margin-settings-open");
  if (settingsOpen !== null) next.settingsOpen = settingsOpen === "true";

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
      settingsOpen: Boolean(merged.settingsOpen),
      playerMinimized: Boolean(merged.playerMinimized),
      fontSize: normalizeFontSizeRem(Number(merged.fontSize)),
      lineHeight:
        typeof merged.lineHeight === "number"
          ? merged.lineHeight
          : defaultReaderSettings.lineHeight,
      letterSpacing:
        typeof merged.letterSpacing === "number"
          ? merged.letterSpacing
          : defaultReaderSettings.letterSpacing,
      guidedFocus:
        typeof merged.guidedFocus === "boolean"
          ? merged.guidedFocus
          : defaultReaderSettings.guidedFocus,
      guidedFocusOpacity: normalizeGuidedFocusOpacity(
        merged.guidedFocusOpacity,
      ),
      preferredVoice:
        typeof merged.preferredVoice === "string"
          ? merged.preferredVoice
          : defaultReaderSettings.preferredVoice,
      skipParentheticals:
        typeof merged.skipParentheticals === "boolean"
          ? merged.skipParentheticals
          : defaultReaderSettings.skipParentheticals,
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
    "margin-player-minimized",
    String(settings.playerMinimized),
  );
  localStorage.setItem("margin-settings-open", String(settings.settingsOpen));
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

export function loadSelectedFolder(): string | null | "all" {
  if (typeof window === "undefined") return "all";
  const raw = localStorage.getItem(SELECTED_FOLDER_KEY);
  if (raw === null || raw === "all") return "all";
  if (raw === "null") return null;
  return raw;
}

export function saveSelectedFolder(selected: string | null | "all") {
  localStorage.setItem(
    SELECTED_FOLDER_KEY,
    selected === null ? "null" : selected,
  );
}

const SIDEBAR_COLLAPSED_KEY = "margin-sidebar-collapsed";

export function loadSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export function saveSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
}

export type LibrarySort =
  | "name-asc"
  | "name-desc"
  | "modified-desc"
  | "modified-asc";

const LIBRARY_SORT_KEY = "margin-library-sort";

export function loadLibrarySort(): LibrarySort {
  if (typeof window === "undefined") return "name-asc";
  const raw = localStorage.getItem(LIBRARY_SORT_KEY);
  if (
    raw === "name-asc" ||
    raw === "name-desc" ||
    raw === "modified-desc" ||
    raw === "modified-asc"
  ) {
    return raw;
  }
  return "name-asc";
}

export function saveLibrarySort(sort: LibrarySort) {
  localStorage.setItem(LIBRARY_SORT_KEY, sort);
}
