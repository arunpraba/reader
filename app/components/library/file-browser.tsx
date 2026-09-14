import Link from "next/link";
import {
  Ellipsis,
  FileText,
  Folder,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";
import type { Doc, Folder as FolderType } from "@/lib/storage";
import type { LibraryItem } from "../../hooks/use-library-search";
import type { LibrarySort } from "@/lib/reader-settings";

export type FileView = "list" | "grid";

function formatDate(value: number) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ItemMenu({
  name,
  href,
  onOpen,
  onMove,
  onDelete,
}: {
  name: string;
  href?: string;
  onOpen?: () => void;
  onMove?: () => void;
  onDelete: () => void;
}) {
  return (
    <details className="file-item-more">
      <summary aria-label={`Actions for ${name}`}>
        <Ellipsis size={16} aria-hidden="true" />
      </summary>
      <div className="top-more-panel">
        {href ? (
          <Link className="top-more-item" href={href}>
            Open
          </Link>
        ) : (
          <button type="button" className="top-more-item" onClick={onOpen}>
            Open
          </button>
        )}
        {onMove ? (
          <button
            type="button"
            className="top-more-item"
            onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
              onMove();
            }}
          >
            Move to folder
          </button>
        ) : null}
        <button
          type="button"
          className="top-more-item file-item-delete"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            onDelete();
          }}
        >
          Delete
        </button>
      </div>
    </details>
  );
}

export function FileBrowser({
  view,
  onViewChange,
  search,
  sort,
  onSortChange,
  selected,
  trail,
  items,
  onSelect,
  onDeleteFolder,
  onDeleteDoc,
  onMoveDoc,
  onCreateDoc,
}: {
  view: FileView;
  onViewChange: (view: FileView) => void;
  search: string;
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
  selected: string | null | "all";
  trail: FolderType[];
  items: LibraryItem[];
  onSelect: (id: string | null | "all") => void;
  onDeleteFolder: (id: string, name: string) => void;
  onDeleteDoc: (id: string, title: string) => void;
  onMoveDoc: (id: string, title: string, folderId: string | null) => void;
  onCreateDoc: () => void;
}) {
  const atRoot = selected === "all" || selected === null;
  const total = items.length;
  const empty = total === 0;

  return (
    <div className="file-browser">
      <div className="file-browser-toolbar">
        <nav className="file-breadcrumb" aria-label="Breadcrumb">
          {search ? (
            <span>Search results for “{search}”</span>
          ) : atRoot ? (
            <span>All files</span>
          ) : (
            <>
              <button type="button" onClick={() => onSelect("all")}>
                All files
              </button>
              {trail.map((folder, index) => (
                <span key={folder.id}>
                  <span className="file-breadcrumb-sep" aria-hidden="true">
                    /
                  </span>
                  {index === trail.length - 1 ? (
                    <span>{folder.name}</span>
                  ) : (
                    <button type="button" onClick={() => onSelect(folder.id)}>
                      {folder.name}
                    </button>
                  )}
                </span>
              ))}
            </>
          )}
          <small className="file-count">
            {total} {total === 1 ? "item" : "items"}
          </small>
        </nav>
        <div className="file-browser-actions">
          <select
            className="library-sort"
            aria-label="Sort"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as LibrarySort)
            }
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="modified-desc">Modified newest</option>
            <option value="modified-asc">Modified oldest</option>
          </select>
          <div className="view-toggle" role="group" aria-label="Library view">
            <button
              type="button"
              className={view === "list" ? "active" : undefined}
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
              aria-label="List view"
              title="List view"
            >
              <List size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={view === "grid" ? "active" : undefined}
              aria-pressed={view === "grid"}
              onClick={() => onViewChange("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {empty ? (
        <div className="file-empty">
          <p>
            {search
              ? "No matching files"
              : atRoot
                ? "This library is empty"
                : "This folder is empty"}
          </p>
          {!search ? (
            <button
              type="button"
              className="primary-button"
              onClick={onCreateDoc}
            >
              <Plus size={15} aria-hidden="true" />
              Create
            </button>
          ) : null}
        </div>
      ) : view === "list" ? (
        <div className="file-list" role="list">
          <div className="file-list-head">
            <span>Name</span>
            <span>Modified</span>
            <span className="file-list-head-actions" />
          </div>
          {items.map((item) =>
            item.kind === "folder" ? (
              <div className="file-row" role="listitem" key={item.folder.id}>
                <button
                  type="button"
                  className="file-row-main"
                  onClick={() => onSelect(item.folder.id)}
                >
                  <span className="file-icon" aria-hidden="true">
                    <Folder size={18} />
                  </span>
                  <span className="file-name">{item.folder.name}</span>
                  <time
                    className="file-date"
                    dateTime={new Date(item.folder.createdAt).toISOString()}
                  >
                    {formatDate(item.folder.createdAt)}
                  </time>
                </button>
                <ItemMenu
                  name={item.folder.name}
                  onOpen={() => onSelect(item.folder.id)}
                  onDelete={() =>
                    onDeleteFolder(item.folder.id, item.folder.name)
                  }
                />
              </div>
            ) : (
              <div className="file-row" role="listitem" key={item.doc.id}>
                <Link
                  href={`/reader/?id=${item.doc.id}`}
                  className="file-row-main"
                >
                  <span className="file-icon file-icon-page" aria-hidden="true">
                    <FileText size={18} />
                  </span>
                  <span className="file-name">{item.doc.title}</span>
                  <time
                    className="file-date"
                    dateTime={new Date(item.doc.updatedAt).toISOString()}
                  >
                    {formatDate(item.doc.updatedAt)}
                  </time>
                </Link>
                <ItemMenu
                  name={item.doc.title}
                  href={`/reader/?id=${item.doc.id}`}
                  onDelete={() => onDeleteDoc(item.doc.id, item.doc.title)}
                  onMove={() =>
                    onMoveDoc(item.doc.id, item.doc.title, item.doc.folderId)
                  }
                />
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="file-grid" role="list">
          {items.map((item) =>
            item.kind === "folder" ? (
              <div className="file-tile" role="listitem" key={item.folder.id}>
                <ItemMenu
                  name={item.folder.name}
                  onOpen={() => onSelect(item.folder.id)}
                  onDelete={() =>
                    onDeleteFolder(item.folder.id, item.folder.name)
                  }
                />
                <button
                  type="button"
                  className="file-tile-main"
                  onClick={() => onSelect(item.folder.id)}
                >
                  <span className="file-icon" aria-hidden="true">
                    <Folder size={28} />
                  </span>
                  <strong className="file-name">{item.folder.name}</strong>
                  <time
                    className="file-date"
                    dateTime={new Date(item.folder.createdAt).toISOString()}
                  >
                    {formatDate(item.folder.createdAt)}
                  </time>
                </button>
              </div>
            ) : (
              <div className="file-tile" role="listitem" key={item.doc.id}>
                <ItemMenu
                  name={item.doc.title}
                  href={`/reader/?id=${item.doc.id}`}
                  onDelete={() => onDeleteDoc(item.doc.id, item.doc.title)}
                  onMove={() =>
                    onMoveDoc(item.doc.id, item.doc.title, item.doc.folderId)
                  }
                />
                <Link
                  href={`/reader/?id=${item.doc.id}`}
                  className="file-tile-main"
                >
                  <span className="file-icon file-icon-page" aria-hidden="true">
                    <FileText size={28} />
                  </span>
                  <strong className="file-name">{item.doc.title}</strong>
                  <time
                    className="file-date"
                    dateTime={new Date(item.doc.updatedAt).toISOString()}
                  >
                    {formatDate(item.doc.updatedAt)}
                  </time>
                </Link>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
