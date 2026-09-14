import Link from "next/link";
import { languageNames } from "@/lib/language-names";
import { saveSelectedFolder } from "@/lib/reader-settings";

export function ReaderTopbar({
  title,
  folderTrail,
  languages,
  saveState,
  editing,
  onTitleChange,
  onToggleEditing,
  onOpenSettings,
}: {
  title: string;
  folderTrail: { id: string; name: string }[];
  languages: string[];
  saveState: "saved" | "saving";
  editing: boolean;
  onTitleChange: (title: string) => void;
  onToggleEditing: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="reader-topbar">
      <nav className="reader-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" onClick={() => saveSelectedFolder("all")}>
          All files
        </Link>
        {folderTrail.map((folder) => (
          <span key={folder.id}>
            <span className="file-breadcrumb-sep" aria-hidden="true">
              /
            </span>
            <Link href="/" onClick={() => saveSelectedFolder(folder.id)}>
              {folder.name}
            </Link>
          </span>
        ))}
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
