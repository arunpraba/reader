"use client";

import { memo, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { markdownComponents } from "./markdown-components";
import { rehypeReadingBlocks } from "../../lib/rehype-reading-blocks";

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex, rehypeReadingBlocks];

export const MarkdownDocument = memo(function MarkdownDocument({
  content,
  onStartAt,
}: {
  content: string;
  onStartAt: (blockIndex: number, wordOrdinal: number) => void;
}) {
  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const block = target.closest<HTMLElement>("[data-read-block]");
      if (!block) return;

      const selection = window.getSelection();
      if (!selection?.anchorNode || !block.contains(selection.anchorNode))
        return;

      const range = document.createRange();
      range.selectNodeContents(block);
      range.setEnd(selection.anchorNode, selection.anchorOffset);
      const ordinal = Math.max(
        0,
        (range.toString().match(/[\p{L}\p{M}\p{N}'’-]+/gu) ?? []).length - 1,
      );
      onStartAt(Number(block.dataset.readBlock), ordinal);
    },
    [onStartAt],
  );

  return (
    <div
      className="markdown-doc markdown-body"
      onDoubleClick={handleDoubleClick}
      title="Double-click text to read from that position"
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
