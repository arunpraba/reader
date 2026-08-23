"use client";

import { memo, useEffect, useId, useState } from "react";

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
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

const svgCache = new Map<string, string>();

export const MermaidDiagram = memo(function MermaidDiagram({
  source,
}: {
  source: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const displaySvg = svgCache.get(source) ?? svg;

  useEffect(() => {
    if (svgCache.has(source)) return;

    let active = true;
    loadMermaid()
      .then(async (mermaid) => {
        const result = await mermaid.render(`mermaid-${reactId}`, source);
        svgCache.set(source, result.svg);
        if (active) {
          setSvg(result.svg);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [reactId, source]);

  if (error) {
    return (
      <pre className="mermaid-error">
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <div
      className="mermaid-diagram"
      role="img"
      aria-label="Mermaid diagram"
      dangerouslySetInnerHTML={{ __html: displaySvg }}
    />
  );
});
