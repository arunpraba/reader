import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Files,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
} from "lucide-react";
import type { Doc, Folder as FolderType } from "@/lib/storage";
import { folderAncestors, isRootFolder, subtreeIds } from "@/lib/folder-tree";

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
  const activeRoot =
    selected === "all" || selected === null
      ? null
      : (folderAncestors(folders, selected)[0]?.id ?? selected);
  return (
    <aside className="library-sidebar" aria-label="Library sidebar">
      <div className="sidebar-top">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>Margin</strong>
            <small>All files</small>
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
        className={`nav-item ${selected === "all" || selected === null ? "active" : ""}`}
        onClick={() => onSelect("all")}
        title="All files"
      >
        <Files className="nav-glyph" aria-hidden="true" size={16} />
        <span className="nav-item-label">All files</span>
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
        {folders.filter(isRootFolder).map((folder) => (
          <div className="nav-item-row" key={folder.id}>
            <button
              className={`nav-item ${activeRoot === folder.id ? "active" : ""}`}
              onClick={() => onSelect(folder.id)}
              title={folder.name}
            >
              <Folder className="nav-glyph" aria-hidden="true" size={16} />
              <span className="nav-item-label">{folder.name}</span>
              <small>
                {
                  docs.filter(
                    (doc) =>
                      doc.folderId && subtreeIds(folders, folder.id).has(doc.folderId),
                  ).length
                }
              </small>
            </button>
            {!sidebarCollapsed && (
              <button
                type="button"
                className="item-delete"
                onClick={() => onDeleteFolder(folder.id, folder.name)}
                aria-label={`Delete folder ${folder.name}`}
                title={`Delete folder ${folder.name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {!sidebarCollapsed && folders.length === 0 && (
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
      {!sidebarCollapsed && (
        <div className="local-note">
          <div>
            <strong>On this device</strong>
            <small>Stored in this browser.</small>
          </div>
        </div>
      )}
    </aside>
  );
}
