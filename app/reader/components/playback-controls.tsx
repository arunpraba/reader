import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
} from "lucide-react";
import { browserTtsAvailable } from "@/lib/tts/capabilities";
import { ProgressTrack } from "../progress-track";

export function PlaybackControls({
  playing,
  progress,
  duration,
  hasWords,
  onJump,
  onTogglePlay,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: {
  playing: boolean;
  progress: number;
  duration: number;
  hasWords: boolean;
  onJump: (unit: "sentence" | "paragraph", direction: -1 | 1) => void;
  onTogglePlay: () => void;
  onSeek: (ratio: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const position = progress * duration;
  const canListen = browserTtsAvailable();

  return (
    <>
      <div
        className="playback navigation-player"
        role="group"
        aria-label="Playback controls"
      >
        <button
          type="button"
          onClick={() => onJump("paragraph", -1)}
          aria-label="Previous paragraph"
          title="Previous paragraph"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
          <span className="sr-only">Previous paragraph</span>
        </button>
        <button
          type="button"
          onClick={() => onJump("sentence", -1)}
          aria-label="Previous sentence"
          title="Previous sentence"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="sr-only">Previous sentence</span>
        </button>
        <button
          type="button"
          className="main-play"
          onClick={onTogglePlay}
          disabled={!canListen || !hasWords}
          aria-label={playing ? "Pause" : "Play from selected position"}
          aria-pressed={playing}
          title={
            !canListen
              ? "Listening unavailable in this WebView"
              : playing
                ? "Pause"
                : "Play"
          }
        >
          {playing ? (
            <Pause size={22} aria-hidden="true" />
          ) : (
            <Play size={22} aria-hidden="true" />
          )}
          <span className="sr-only">{playing ? "Pause" : "Play"}</span>
        </button>
        <button
          type="button"
          onClick={() => onJump("sentence", 1)}
          aria-label="Next sentence"
          title="Next sentence"
        >
          <ChevronRight size={16} aria-hidden="true" />
          <span className="sr-only">Next sentence</span>
        </button>
        <button
          type="button"
          onClick={() => onJump("paragraph", 1)}
          aria-label="Next paragraph"
          title="Next paragraph"
        >
          <ChevronsRight size={16} aria-hidden="true" />
          <span className="sr-only">Next paragraph</span>
        </button>
      </div>
      <ProgressTrack
        progress={progress}
        position={position}
        duration={duration}
        hasWords={hasWords}
        onSeek={onSeek}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />
      <div className="play-status" aria-live="polite">
        {!canListen
          ? "Listening unavailable — use HTTPS or localhost"
          : playing
            ? "Reading"
            : progress >= 1
              ? "Complete"
              : "Ready"}
      </div>
    </>
  );
}
