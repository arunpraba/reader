"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Pause, Play } from "lucide-react";

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
        type="button"
        className="expand-player"
        onClick={onExpand}
        aria-label="Expand player"
        title="Expand player"
      >
        <Maximize2 size={10} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="mini-play"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Resume reading"}
      >
        {playing ? (
          <Pause size={16} aria-hidden="true" fill="currentColor" />
        ) : (
          <Play size={16} aria-hidden="true" fill="currentColor" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {Math.round(progress * 100)} percent complete
      </span>
    </div>
  );

  if (!mounted) return null;
  return createPortal(player, document.body);
}
