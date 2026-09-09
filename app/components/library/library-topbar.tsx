"use client";

import Link from "next/link";
import {
  ChevronDown,
  Download,
  Ellipsis,
  FileText,
  FolderPlus,
  Link2,
  MonitorDown,
  Palette,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { usePwaInstall } from "../../hooks/use-pwa-install";

function closeDetails(event: React.MouseEvent<HTMLElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function LibraryTopbar({
  search,
  hasDocs,
  onSearchChange,
  onClearSearch,
  onExport,
  onImportFile,
  onCreateDoc,
  onCreateFolder,
  onImportLink,
}: {
  search: string;
  hasDocs: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onExport: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateDoc: () => void;
  onCreateFolder: () => void;
  onImportLink: () => void;
}) {
  const { canPrompt, isIosSafari, showIosTip, install, dismissTip } =
    usePwaInstall();
  const showInstall = canPrompt || isIosSafari;

  return (
    <header className="library-topbar">
      <div className="mobile-brand">Margin</div>
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
        <details className="create-menu">
          <summary className="primary-button">
            <Plus size={15} aria-hidden="true" />
            <span className="top-action-label">Create</span>
            <ChevronDown size={14} aria-hidden="true" />
          </summary>
          <div className="top-more-panel">
            <button
              type="button"
              className="top-more-item"
              onClick={(event) => {
                closeDetails(event);
                onCreateDoc();
              }}
            >
              <FileText size={15} aria-hidden="true" />
              New page
            </button>
            <button
              type="button"
              className="top-more-item"
              onClick={(event) => {
                closeDetails(event);
                onCreateFolder();
              }}
            >
              <FolderPlus size={15} aria-hidden="true" />
              New folder
            </button>
            <label className="top-more-item">
              <Upload size={15} aria-hidden="true" />
              Import file
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={onImportFile}
              />
            </label>
            <button
              type="button"
              className="top-more-item"
              onClick={(event) => {
                closeDetails(event);
                onImportLink();
              }}
            >
              <Link2 size={15} aria-hidden="true" />
              Import link
            </button>
          </div>
        </details>
        <details className="top-more">
          <summary aria-label="More library actions">
            <Ellipsis size={18} aria-hidden="true" />
          </summary>
          <div className="top-more-panel">
            <Link className="top-more-item" href="/settings">
              <Palette size={15} aria-hidden="true" />
              Themes
            </Link>
            {showInstall ? (
              <button
                type="button"
                className="top-more-item"
                onClick={() => void install()}
              >
                <MonitorDown size={15} aria-hidden="true" />
                Install
              </button>
            ) : null}
            {showIosTip ? (
              <p className="pwa-install-tip" role="status">
                Tap Share, then Add to Home Screen.
                <button type="button" onClick={dismissTip}>
                  Dismiss
                </button>
              </p>
            ) : null}
            <button
              type="button"
              className="top-more-item"
              onClick={onExport}
              disabled={!hasDocs}
            >
              <Download size={15} aria-hidden="true" />
              Export
            </button>
          </div>
        </details>
      </div>
      {showIosTip ? (
        <p className="pwa-install-tip pwa-install-tip-desktop" role="status">
          On iPhone or iPad: tap Share, then Add to Home Screen.
          <button type="button" onClick={dismissTip}>
            Dismiss
          </button>
        </p>
      ) : null}
    </header>
  );
}
