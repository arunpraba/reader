import Link from "next/link";
import { languageNames } from "../../../lib/language-names";
import { saveSelectedFolder } from "../../../lib/reader-settings";

export function ReaderTopbar({
  title,
  folderId,
  folderName,
  languages,
  saveState,
  editing,
  onTitleChange,
  onToggleEditing,
  onSave,
  onOpenSettings,
}: {
  title: string;
  folderId: string | null;
  folderName: string | null;
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
      <nav className="reader-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" onClick={() => saveSelectedFolder("all")}>
          All files
        </Link>
        {folderId && folderName ? (
          <>
            <span className="file-breadcrumb-sep" aria-hidden="true">
              /
            </span>
            <Link href="/" onClick={() => saveSelectedFolder(folderId)}>
              {folderName}
            </Link>
          </>
        ) : null}
        <span className="file-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <input
          className="reader-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Page title"
        />
      </nav>
      <div className="reader-actions">
        <span
          className="auto-language"
          title="Languages are detected for every paragraph"
        >
          {languages.map((lang) => languageNames[lang] ?? lang).join(" · ") ||
            "Auto language"}
        </span>
        <span className="autosave-state" aria-live="polite">
          {saveState === "saving" ? "Saving…" : "Saved"}
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
