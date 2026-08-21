"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

export function ProgressTrack({
  progress,
  hasWords,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: {
  progress: number;
  hasWords: boolean;
  onSeek: (ratio: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const scrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    onSeek(ratio);
  };

  return (
    <div
      className="progress-track"
      role="slider"
      tabIndex={0}
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuetext={`${Math.round(progress * 100)} percent`}
      onPointerDown={(event) => {
        onScrubStart();
        event.currentTarget.setPointerCapture(event.pointerId);
        scrub(event);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        scrub(event);
      }}
      onPointerUp={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        onScrubEnd();
      }}
      onKeyDown={(event) => {
        if (!hasWords) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const step = event.key === "ArrowRight" ? 0.05 : -0.05;
          onSeek(Math.min(1, Math.max(0, progress + step)));
        } else if (event.key === "Home") {
          event.preventDefault();
          onSeek(0);
        } else if (event.key === "End") {
          event.preventDefault();
          onSeek(1);
        }
      }}
    >
      <span style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
