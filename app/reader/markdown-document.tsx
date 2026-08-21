"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { rehypeReadingBlocks } from "../../lib/rehype-reading-blocks";
import { MermaidDiagram } from "./mermaid-diagram";

export function MarkdownDocument({
  content,
  onStartAt,
}: {
  content: string;
  onStartAt: (blockIndex: number, wordOrdinal: number) => void;
}) {
  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const block = target.closest<HTMLElement>("[data-read-block]");
    if (!block) return;

    const selection = window.getSelection();
    if (!selection?.anchorNode || !block.contains(selection.anchorNode)) return;

    const range = document.createRange();
    range.selectNodeContents(block);
    range.setEnd(selection.anchorNode, selection.anchorOffset);
    const ordinal = Math.max(
      0,
      (range.toString().match(/[\p{L}\p{M}\p{N}'’-]+/gu) ?? []).length - 1,
    );
    onStartAt(Number(block.dataset.readBlock), ordinal);
  };

  return (
    <div
      className="markdown-doc rich-markdown"
      onDoubleClick={handleDoubleClick}
      title="Double-click text to read from that position"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeReadingBlocks]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            if (match?.[1] === "mermaid") {
              return (
                <MermaidDiagram source={String(children).replace(/\n$/, "")} />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
