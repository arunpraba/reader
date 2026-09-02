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
        <button
          className="secondary-button export-zip-button"
          onClick={onExport}
          disabled={!hasDocs}
        >
          ↓ Export ZIP
        </button>
        <label className="secondary-button library-import-button">
          Import
          <input
            type="file"
            accept=".md,.markdown,.txt"
            onChange={onImportFile}
          />
        </label>
        <button className="primary-button" onClick={onCreateDoc}>
          ＋ New page
        </button>
      </div>
    </header>
  );
}
