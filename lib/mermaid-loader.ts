import type { ThemeKind } from "./themes";

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;
let activeKind: ThemeKind | null = null;

function mermaidThemeForKind(kind: ThemeKind) {
  return kind === "dark" ? "dark" : "neutral";
}

function readThemeKind(): ThemeKind {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.themeKind === "dark"
    ? "dark"
    : "light";
}

export function loadMermaid() {
  const kind = readThemeKind();

  if (!mermaidReady) {
    activeKind = kind;
    mermaidReady = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: mermaidThemeForKind(kind),
      });
      return mermaid;
    });
    return mermaidReady;
  }

  if (activeKind !== kind) {
    activeKind = kind;
    mermaidReady = mermaidReady.then(async (mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: mermaidThemeForKind(kind),
      });
      return mermaid;
    });
  }

  return mermaidReady;
}

export const mermaidSvgCache = new Map<string, string>();
