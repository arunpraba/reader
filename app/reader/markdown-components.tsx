"use client";

import type { Components } from "react-markdown";
import { MermaidDiagram } from "./mermaid-diagram";

export const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match?.[1] === "mermaid") {
      return <MermaidDiagram source={String(children).replace(/\n$/, "")} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};
