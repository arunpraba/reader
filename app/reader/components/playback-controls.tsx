import { ProgressTrack } from "../progress-track";

export function PlaybackControls({
  playing,
  progress,
  hasWords,
  onJump,
  onTogglePlay,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: {
  playing: boolean;
  progress: number;
  hasWords: boolean;
  onJump: (unit: "sentence" | "paragraph", direction: -1 | 1) => void;
  onTogglePlay: () => void;
  onSeek: (ratio: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  return (
    <>
      <div className="playback navigation-player">
        <button
          onClick={() => onJump("paragraph", -1)}
          aria-label="Previous paragraph"
          title="Previous paragraph"
        >
          ¶←
        </button>
        <button
          onClick={() => onJump("sentence", -1)}
          aria-label="Previous sentence"
          title="Previous sentence"
        >
          ‹
        </button>
        <button
          className="main-play"
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Play from selected position"}
        >
          {playing ? "Ⅱ" : "▶"}
        </button>
        <button
          onClick={() => onJump("sentence", 1)}
          aria-label="Next sentence"
          title="Next sentence"
        >
          ›
        </button>
        <button
          onClick={() => onJump("paragraph", 1)}
          aria-label="Next paragraph"
          title="Next paragraph"
        >
          →¶
        </button>
      </div>
      <ProgressTrack
        progress={progress}
        hasWords={hasWords}
        onSeek={onSeek}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />
      <div className="play-status" aria-live="polite">
        {playing
          ? `Reading · ${Math.round(progress * 100)}%`
          : progress === 1
            ? "Complete"
            : "Ready"}
      </div>
    </>
  );
}
