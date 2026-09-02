"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const player = (
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

  if (!mounted) return null;
  return createPortal(player, document.body);
}
