import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
} from "lucide-react";
import type { Doc, Folder as FolderType } from "../../../lib/storage";

export function LibrarySidebar({
  selected,
  folders,
  docs,
  sidebarCollapsed,
  onSelect,
  onToggleSidebar,
  onStartFolderCreate,
  onDeleteFolder,
}: {
  selected: string | null | "all";
  folders: FolderType[];
  docs: Doc[];
  sidebarCollapsed: boolean;
  onSelect: (id: string | null | "all") => void;
  onToggleSidebar: () => void;
  onStartFolderCreate: () => void;
  onDeleteFolder: (id: string, name: string) => void;
}) {
  return (
    <aside className="library-sidebar" aria-label="Library sidebar">
      <div className="sidebar-top">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>Margin</strong>
            <small>Library</small>
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
          {sidebarCollapsed ? (
            <ChevronRight size={16} aria-hidden="true" />
          ) : (
            <ChevronLeft size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      <button
        className={`nav-item ${selected === "all" ? "active" : ""}`}
        onClick={() => onSelect("all")}
        title="All pages"
      >
        <FileText className="nav-glyph" aria-hidden="true" size={16} />
        <span className="nav-item-label">All pages</span>
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
          <FolderPlus size={16} aria-hidden="true" />
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
              <Folder className="nav-glyph" aria-hidden="true" size={16} />
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
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
        {folders.length === 0 && (
          <button
            type="button"
            className="folder-empty-hint"
            onClick={onStartFolderCreate}
          >
            <Plus size={14} aria-hidden="true" />
            <span>New folder</span>
          </button>
        )}
      </nav>
      <div className="local-note">
        <div>
          <strong>On this device</strong>
          <small>Stored in this browser.</small>
        </div>
      </div>
    </aside>
  );
}
