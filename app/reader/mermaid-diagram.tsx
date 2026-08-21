"use client";

import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ source }: { source: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
      });
      try {
        const result = await mermaid.render(`mermaid-${id}`, source);
        if (active) {
          setSvg(result.svg);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    });
    return () => {
      active = false;
    };
  }, [id, source]);

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
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
