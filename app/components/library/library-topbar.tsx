import Link from "next/link";
import {
  Download,
  Ellipsis,
  Palette,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";

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
      <div className="mobile-brand-row">
        <div className="mobile-brand">Margin</div>
        <div className="mobile-top-tools">
          <button
            className="primary-button top-action-new mobile-new-page"
            onClick={onCreateDoc}
          >
            <Plus size={15} aria-hidden="true" />
            <span className="top-action-label">New page</span>
          </button>
          <details className="top-more">
            <summary aria-label="More library actions">
              <Ellipsis size={18} aria-hidden="true" />
            </summary>
            <div className="top-more-panel">
              <Link className="top-more-item" href="/settings">
                <Palette size={15} aria-hidden="true" />
                Themes
              </Link>
              <button
                type="button"
                className="top-more-item"
                onClick={onExport}
                disabled={!hasDocs}
              >
                <Download size={15} aria-hidden="true" />
                Export
              </button>
              <label className="top-more-item">
                <Upload size={15} aria-hidden="true" />
                Import
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={onImportFile}
                />
              </label>
            </div>
          </details>
        </div>
      </div>
      <div className="search" role="search">
        <Search size={16} aria-hidden="true" />
        <input
          aria-label="Search library"
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button onClick={onClearSearch} aria-label="Clear search">
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="top-actions">
        <Link className="secondary-button top-action-themes" href="/settings">
          <Palette size={15} aria-hidden="true" />
          <span className="top-action-label">Themes</span>
        </Link>
        <button
          className="secondary-button export-zip-button top-action-export"
          onClick={onExport}
          disabled={!hasDocs}
          aria-label="Export library as ZIP"
        >
          <Download size={15} aria-hidden="true" />
          <span className="top-action-label">Export</span>
        </button>
        <label className="secondary-button library-import-button top-action-import">
          <Upload size={15} aria-hidden="true" />
          <span className="top-action-label">Import</span>
          <input
            type="file"
            accept=".md,.markdown,.txt"
            onChange={onImportFile}
          />
        </label>
        <button className="primary-button top-action-new" onClick={onCreateDoc}>
          <Plus size={15} aria-hidden="true" />
          <span className="top-action-label">New page</span>
        </button>
      </div>
    </header>
  );
}
