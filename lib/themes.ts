export type ThemeId =
  | "margin-light"
  | "paper"
  | "ocean"
  | "sage"
  | "dawn"
  | "sepia"
  | "margin-dark"
  | "high-contrast"
  | "forest-night"
  | "midnight"
  | "monokai-vibrant";

export type ThemeKind = "light" | "dark";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  description: string;
  kind: ThemeKind;
  preview: {
    bg: string;
    surface: string;
    ink: string;
    accent: string;
    green: string;
  };
};

export const DEFAULT_THEME_ID: ThemeId = "margin-light";
export const THEME_STORAGE_KEY = "margin-color-theme";

export const THEMES: ThemeMeta[] = [
  {
    id: "margin-light",
    label: "Margin Light",
    description: "Minimal Neutral — clean monochrome ebook chrome",
    kind: "light",
    preview: {
      bg: "#ffffff",
      surface: "#fdfdfd",
      ink: "#171717",
      accent: "#252525",
      green: "#252525",
    },
  },
  {
    id: "paper",
    label: "Paper",
    description: "Soft cool gray paper for calm daytime reading",
    kind: "light",
    preview: {
      bg: "#f4f5f7",
      surface: "#ffffff",
      ink: "#1a1d21",
      accent: "#3b82f6",
      green: "#334155",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Airy blue surfaces with deep sea accents",
    kind: "light",
    preview: {
      bg: "#f3f8fb",
      surface: "#ffffff",
      ink: "#0f2740",
      accent: "#0e7490",
      green: "#155e75",
    },
  },
  {
    id: "sage",
    label: "Sage",
    description: "Soft green reading surface with leafy accents",
    kind: "light",
    preview: {
      bg: "#f3f7f4",
      surface: "#ffffff",
      ink: "#1c2b22",
      accent: "#3f6b52",
      green: "#3f6b52",
    },
  },
  {
    id: "dawn",
    label: "Dawn",
    description: "Cool lilac mist with ink-blue accents",
    kind: "light",
    preview: {
      bg: "#f7f5fb",
      surface: "#ffffff",
      ink: "#1e1b2e",
      accent: "#5b4b8a",
      green: "#4c3d73",
    },
  },
  {
    id: "sepia",
    label: "Sepia",
    description: "Classic parchment tones for long reading sessions",
    kind: "light",
    preview: {
      bg: "#e8dcc8",
      surface: "#f3e9d8",
      ink: "#3b2f22",
      accent: "#a0502e",
      green: "#3d5246",
    },
  },
  {
    id: "margin-dark",
    label: "Margin Dark",
    description: "Minimal Neutral dark — flat monochrome reading chrome",
    kind: "dark",
    preview: {
      bg: "#292929",
      surface: "#1f1f1f",
      ink: "#fafafa",
      accent: "#ebebeb",
      green: "#ebebeb",
    },
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    description: "Near-black background with strong borders and ink",
    kind: "dark",
    preview: {
      bg: "#0a0a0a",
      surface: "#141414",
      ink: "#f5f5f5",
      accent: "#ff6b3d",
      green: "#1a5c4a",
    },
  },
  {
    id: "forest-night",
    label: "Forest Night",
    description: "Deep forest surfaces with green-forward chrome",
    kind: "dark",
    preview: {
      bg: "#121a17",
      surface: "#1a2621",
      ink: "#e4ebe7",
      accent: "#c96a45",
      green: "#2f5c4e",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Cool slate surfaces with terracotta accents",
    kind: "dark",
    preview: {
      bg: "#15181e",
      surface: "#1e222b",
      ink: "#e8eaef",
      accent: "#d4683a",
      green: "#2a4a55",
    },
  },
  {
    id: "monokai-vibrant",
    label: "Monokai Vibrant",
    description: "Classic Monokai with magenta accents and lime chrome",
    kind: "dark",
    preview: {
      bg: "#272822",
      surface: "#2f3129",
      ink: "#f8f8f2",
      accent: "#f92672",
      green: "#a6e22e",
    },
  },
];

const THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.has(value);
}

export function getTheme(id: ThemeId): ThemeMeta {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function resolveThemeId(value: unknown): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}
