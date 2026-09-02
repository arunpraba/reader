let mermaidReady: Promise<typeof import("mermaid").default> | null = null;

export function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
      });
      return mermaid;
    });
  }
  return mermaidReady;
}

export const mermaidSvgCache = new Map<string, string>();
