import Link from "next/link";

export function LibraryTopbar({
  search,
  hasDocs,
  onSearchChange,
  onClearSearch,
  onExport,
  onImportFile,
  onCreateDoc,
}: {
  search: string;
  hasDocs: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onExport: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateDoc: () => void;
}) {
  return (
    <header className="library-topbar">
      <div className="mobile-brand">Margin</div>
      <div className="search" role="search">
        <span>⌕</span>
        <input
          aria-label="Search library"
          type="search"
          placeholder="Search titles, text, or folders"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button onClick={onClearSearch} aria-label="Clear search">
            ×
          </button>
        )}
      </div>
      <div className="top-actions">
        <Link className="secondary-button top-action-themes" href="/settings">
          <span className="top-action-label">Themes</span>
        </Link>
        <button
          className="secondary-button export-zip-button top-action-export"
          onClick={onExport}
          disabled={!hasDocs}
          aria-label="Export library as ZIP"
        >
          <span className="top-action-label">↓ Export ZIP</span>
        </button>
        <label className="secondary-button library-import-button top-action-import">
          <span className="top-action-label">Import</span>
          <input
            type="file"
            accept=".md,.markdown,.txt"
            onChange={onImportFile}
          />
        </label>
        <button className="primary-button top-action-new" onClick={onCreateDoc}>
          <span className="top-action-label">＋ New page</span>
        </button>
      </div>
    </header>
  );
}
