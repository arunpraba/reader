"use client";

import { useEffect } from "react";
import { Folder, X } from "lucide-react";
import type { RefObject } from "react";

export function FolderCreateModal({
  open,
  newFolder,
  folderInputRef,
  onNewFolderChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  newFolder: string;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onNewFolderChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const canSave = newFolder.trim().length > 0;

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
        aria-labelledby="folder-modal-title"
      >
        <div className="folder-modal-header">
          <div className="folder-modal-title-row">
            <Folder size={18} aria-hidden="true" />
            <h2 id="folder-modal-title">New folder</h2>
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
        <form
          className="folder-modal-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) onSubmit();
          }}
        >
          <label className="folder-modal-label" htmlFor="folder-modal-input">
            Name
          </label>
          <input
            id="folder-modal-input"
            ref={folderInputRef}
            value={newFolder}
            onChange={(event) => onNewFolderChange(event.target.value)}
            placeholder="Folder name"
            aria-label="New folder name"
            autoComplete="off"
          />
          <div className="folder-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={!canSave}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
