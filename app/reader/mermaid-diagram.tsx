"use client";

import { memo, useEffect, useId, useState } from "react";
import { loadMermaid, mermaidSvgCache } from "../../lib/mermaid-loader";

export const MermaidDiagram = memo(function MermaidDiagram({
  source,
}: {
  source: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const displaySvg = mermaidSvgCache.get(source) ?? svg;

  useEffect(() => {
    if (mermaidSvgCache.has(source)) return;

    let active = true;
    loadMermaid()
      .then(async (mermaid) => {
        const result = await mermaid.render(`mermaid-${reactId}`, source);
        mermaidSvgCache.set(source, result.svg);
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
