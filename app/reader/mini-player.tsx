"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, Pause, Play } from "lucide-react";

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
      aria-label="Mini player"
      data-playing={playing ? "true" : undefined}
    >
      <button
        type="button"
        className="mini-play"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Resume reading"}
      >
        {playing ? (
          <Pause size={18} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Play size={18} strokeWidth={2} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        className="expand-player"
        onClick={onExpand}
        aria-label="Expand player"
        title="Expand player"
      >
        <ChevronUp size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        {Math.round(progress * 100)} percent complete
      </span>
    </div>
  );

  if (!mounted) return null;
  return createPortal(player, document.body);
}
