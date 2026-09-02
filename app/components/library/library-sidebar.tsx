import Link from "next/link";
import type { Doc, Folder } from "../../../lib/storage";
import { FolderCompose } from "./folder-compose";
import type { RefObject } from "react";

export function LibrarySidebar({
  selected,
  folders,
  docs,
  sidebarCollapsed,
  isMobile,
  creatingFolder,
  newFolder,
  folderInputRef,
  onSelect,
  onToggleSidebar,
  onStartFolderCreate,
  onNewFolderChange,
  onCreateFolder,
  onFolderBlur,
  onCancelFolderCreate,
  onDeleteFolder,
}: {
  selected: string | null | "all";
  folders: Folder[];
  docs: Doc[];
  sidebarCollapsed: boolean;
  isMobile: boolean;
  creatingFolder: boolean;
  newFolder: string;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onSelect: (id: string | null | "all") => void;
  onToggleSidebar: () => void;
  onStartFolderCreate: () => void;
  onNewFolderChange: (value: string) => void;
  onCreateFolder: () => void;
  onFolderBlur: () => void;
  onCancelFolderCreate: () => void;
  onDeleteFolder: (id: string, name: string) => void;
}) {
  return (
    <aside className="library-sidebar" aria-label="Library sidebar">
      <div className="sidebar-top">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>Margin</strong>
            <small>Reading workspace</small>
          </span>
        </Link>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
      </div>
      <button
        className={`nav-item ${selected === "all" ? "active" : ""}`}
        onClick={() => onSelect("all")}
        title="All pages"
      >
        <span>⌂</span> <span className="nav-item-label">All pages</span>
      </button>
      <div className="nav-label">
        <span className="nav-label-text">Folders</span>
        <button
          type="button"
          className="folder-add"
          onClick={onStartFolderCreate}
          aria-label="Create folder"
          title="Create folder"
        >
          ＋
        </button>
      </div>
      <nav aria-label="Folders">
        {folders.map((folder) => (
          <div className="nav-item-row" key={folder.id}>
            <button
              className={`nav-item ${selected === folder.id ? "active" : ""}`}
              onClick={() => onSelect(folder.id)}
              title={folder.name}
            >
              <span>▰</span>
              <span className="nav-item-label">{folder.name}</span>
              <small>
                {docs.filter((doc) => doc.folderId === folder.id).length}
              </small>
            </button>
            <button
              type="button"
              className="item-delete"
              onClick={() => onDeleteFolder(folder.id, folder.name)}
              aria-label={`Delete folder ${folder.name}`}
              title={`Delete folder ${folder.name}`}
            >
              ×
            </button>
          </div>
        ))}
        {!isMobile && creatingFolder && (
          <FolderCompose
            isMobile={isMobile}
            newFolder={newFolder}
            folderInputRef={folderInputRef}
            onNewFolderChange={onNewFolderChange}
            onSubmit={onCreateFolder}
            onBlur={onFolderBlur}
            onCancel={onCancelFolderCreate}
          />
        )}
      </nav>
      <div className="local-note">
        <span>●</span>
        <div>
          <strong>Private on this device</strong>
          <small>Files are stored in your browser.</small>
        </div>
      </div>
    </aside>
  );
}
