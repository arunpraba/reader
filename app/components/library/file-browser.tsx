import Link from "next/link";
import { Ellipsis, FileText, Folder, LayoutGrid, List, Plus } from "lucide-react";
import type { Doc, Folder as FolderType } from "../../../lib/storage";

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
  onDelete,
}: {
  name: string;
  href?: string;
  onOpen?: () => void;
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
  selected,
  folderName,
  folders,
  docs,
  onSelect,
  onDeleteFolder,
  onDeleteDoc,
  onCreateDoc,
}: {
  view: FileView;
  onViewChange: (view: FileView) => void;
  search: string;
  selected: string | null | "all";
  folderName?: string;
  folders: FolderType[];
  docs: Doc[];
  onSelect: (id: string | null | "all") => void;
  onDeleteFolder: (id: string, name: string) => void;
  onDeleteDoc: (id: string, title: string) => void;
  onCreateDoc: () => void;
}) {
  const atRoot = selected === "all" || selected === null;
  const total = folders.length + docs.length;
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
              <span className="file-breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <span>{folderName}</span>
            </>
          )}
          <small className="file-count">
            {total} {total === 1 ? "item" : "items"}
          </small>
        </nav>
        <div
          className="view-toggle"
          role="group"
          aria-label="Library view"
        >
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
            <button type="button" className="primary-button" onClick={onCreateDoc}>
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
          {folders.map((folder) => (
            <div className="file-row" role="listitem" key={folder.id}>
              <button
                type="button"
                className="file-row-main"
                onClick={() => onSelect(folder.id)}
              >
                <span className="file-icon" aria-hidden="true">
                  <Folder size={18} />
                </span>
                <span className="file-name">{folder.name}</span>
                <time className="file-date" dateTime={new Date(folder.createdAt).toISOString()}>
                  {formatDate(folder.createdAt)}
                </time>
              </button>
              <ItemMenu
                name={folder.name}
                onOpen={() => onSelect(folder.id)}
                onDelete={() => onDeleteFolder(folder.id, folder.name)}
              />
            </div>
          ))}
          {docs.map((doc) => (
            <div className="file-row" role="listitem" key={doc.id}>
              <Link href={`/reader/?id=${doc.id}`} className="file-row-main">
                <span className="file-icon file-icon-page" aria-hidden="true">
                  <FileText size={18} />
                </span>
                <span className="file-name">{doc.title}</span>
                <time className="file-date" dateTime={new Date(doc.updatedAt).toISOString()}>
                  {formatDate(doc.updatedAt)}
                </time>
              </Link>
              <ItemMenu
                name={doc.title}
                href={`/reader/?id=${doc.id}`}
                onDelete={() => onDeleteDoc(doc.id, doc.title)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="file-grid" role="list">
          {folders.map((folder) => (
            <div className="file-tile" role="listitem" key={folder.id}>
              <ItemMenu
                name={folder.name}
                onOpen={() => onSelect(folder.id)}
                onDelete={() => onDeleteFolder(folder.id, folder.name)}
              />
              <button
                type="button"
                className="file-tile-main"
                onClick={() => onSelect(folder.id)}
              >
                <span className="file-icon" aria-hidden="true">
                  <Folder size={28} />
                </span>
                <strong className="file-name">{folder.name}</strong>
                <time className="file-date" dateTime={new Date(folder.createdAt).toISOString()}>
                  {formatDate(folder.createdAt)}
                </time>
              </button>
            </div>
          ))}
          {docs.map((doc) => (
            <div className="file-tile" role="listitem" key={doc.id}>
              <ItemMenu
                name={doc.title}
                href={`/reader/?id=${doc.id}`}
                onDelete={() => onDeleteDoc(doc.id, doc.title)}
              />
              <Link href={`/reader/?id=${doc.id}`} className="file-tile-main">
                <span className="file-icon file-icon-page" aria-hidden="true">
                  <FileText size={28} />
                </span>
                <strong className="file-name">{doc.title}</strong>
                <time className="file-date" dateTime={new Date(doc.updatedAt).toISOString()}>
                  {formatDate(doc.updatedAt)}
                </time>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
