import Link from "next/link";
import { languageNames } from "../../../lib/language-names";

export function ReaderTopbar({
  title,
  languages,
  saveState,
  editing,
  onTitleChange,
  onToggleEditing,
  onSave,
  onOpenSettings,
}: {
  title: string;
  languages: string[];
  saveState: "saved" | "saving";
  editing: boolean;
  onTitleChange: (title: string) => void;
  onToggleEditing: () => void;
  onSave: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="reader-topbar">
      <Link href="/" className="back-link">
        <span className="back-link-icon" aria-hidden="true">
          ←
        </span>
        <span>Library</span>
      </Link>
      <input
        className="reader-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        aria-label="Page title"
      />
      <div className="reader-actions">
        <span
          className="auto-language"
          title="Languages are detected for every paragraph"
        >
          ◎{" "}
          {languages.map((lang) => languageNames[lang] ?? lang).join(" · ") ||
            "Auto language"}
        </span>
        <span className="autosave-state" aria-live="polite">
          {saveState === "saving" ? "Saving…" : "✓ Autosaved"}
        </span>
        <button
          className="secondary-button reader-edit-button"
          onClick={onToggleEditing}
        >
          {editing ? "Preview" : "Edit"}
        </button>
        <button className="primary-button" onClick={onSave}>
          Done
        </button>
        <button
          className="mobile-settings"
          onClick={onOpenSettings}
          aria-label="Open listen settings"
        >
          Listen
        </button>
      </div>
    </header>
  );
}
