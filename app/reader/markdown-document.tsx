"use client";

import {
  memo,
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { readPositionFromPoint } from "../../lib/read-position";
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
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const lastStartRef = useRef(0);

  const startAtPoint = useCallback(
    (clientX: number, clientY: number, target: EventTarget | null) => {
      const element = target instanceof HTMLElement ? target : null;
      const block = element?.closest<HTMLElement>("[data-read-block]");
      if (!block) return;

      const ordinal = readPositionFromPoint(block, clientX, clientY);
      if (ordinal == null) return;

      const now = Date.now();
      if (now - lastStartRef.current < 400) return;
      lastStartRef.current = now;

      onStartAt(Number(block.dataset.readBlock), ordinal);
    },
    [onStartAt],
  );

  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      startAtPoint(event.clientX, event.clientY, event.target);
    },
    [startAtPoint],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const now = Date.now();
      const last = lastTapRef.current;
      const isDoubleTap =
        now - last.time < 350 &&
        Math.hypot(event.clientX - last.x, event.clientY - last.y) < 28;
      lastTapRef.current = {
        time: now,
        x: event.clientX,
        y: event.clientY,
      };
      if (!isDoubleTap) return;
      startAtPoint(event.clientX, event.clientY, event.target);
    },
    [startAtPoint],
  );

  return (
    <div
      className="markdown-doc markdown-body"
      onDoubleClick={handleDoubleClick}
      onPointerUp={handlePointerUp}
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
