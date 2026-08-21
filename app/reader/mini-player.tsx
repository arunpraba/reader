"use client";

import type { CSSProperties } from "react";

export function MiniPlayer({
  progress,
  playing,
  onExpand,
  onTogglePlay,
}: {
  progress: number;
  playing: boolean;
  onExpand: () => void;
  onTogglePlay: () => void;
}) {
  return (
    <div
      className="mini-player"
      style={
        {
          "--player-progress": `${Math.round(progress * 360)}deg`,
        } as CSSProperties
      }
      aria-label="Mini player"
    >
      <button
        className="expand-player"
        onClick={onExpand}
        aria-label="Expand player"
        title="Expand player"
      >
        ↗
      </button>
      <button
        className="mini-play"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Resume reading"}
      >
        {playing ? "Ⅱ" : "▶"}
      </button>
      <span className="sr-only" aria-live="polite">
        {Math.round(progress * 100)} percent complete
      </span>
    </div>
  );
}
