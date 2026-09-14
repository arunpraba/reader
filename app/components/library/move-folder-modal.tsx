"use client";

import { useEffect } from "react";
import { FolderInput, X } from "lucide-react";
import type { Folder } from "../../../lib/storage";

export function MoveFolderModal({
  open,
  title,
  folders,
  currentFolderId,
  onMove,
  onCancel,
}: {
  open: boolean;
  title: string;
  folders: Folder[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const destinations = [
    { id: null as string | null, name: "Unfiled" },
    ...folders.map((folder) => ({ id: folder.id, name: folder.name })),
  ];

  return (
    <div
      className="folder-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="folder-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-folder-title"
      >
        <div className="folder-modal-header">
          <div className="folder-modal-title-row">
            <FolderInput size={18} aria-hidden="true" />
            <h2 id="move-folder-title">Move to folder</h2>
          </div>
          <button
            type="button"
            className="folder-modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="folder-modal-copy">{title}</p>
        {folders.length === 0 && currentFolderId === null ? (
          <p className="folder-modal-copy">Create a folder first.</p>
        ) : (
          <div className="folder-picker" role="listbox" aria-label="Folders">
            {destinations.map((destination) => {
              const current = destination.id === currentFolderId;
              return (
                <button
                  key={destination.id ?? "unfiled"}
                  type="button"
                  role="option"
                  aria-selected={current}
                  disabled={current}
                  onClick={() => onMove(destination.id)}
                >
                  <span>{destination.name}</span>
                  {current ? <small>Current</small> : null}
                </button>
              );
            })}
          </div>
        )}
        <div className="folder-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
