import type { ReactNode } from "react";

export function ReaderControls({
  settingsOpen,
  onMinimize,
  onClose,
  children,
}: {
  settingsOpen: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <aside
      className={`reader-controls ${settingsOpen ? "open" : ""}`}
      aria-label="Reading settings"
    >
      <header className="controls-header">
        <div>
          <div className="control-kicker">Listen</div>
          <h2>Player & settings</h2>
        </div>
        <div className="controls-header-actions">
          <button
            type="button"
            className="minimize-player"
            onClick={onMinimize}
            aria-label="Minimize to floating player"
            title="Minimize to floating player"
          >
            −
          </button>
          <button
            type="button"
            className="close-settings"
            onClick={onClose}
            aria-label="Close settings"
            title="Close settings"
          >
            ×
          </button>
        </div>
      </header>
      <div className="controls-scroll">{children}</div>
    </aside>
  );
}
