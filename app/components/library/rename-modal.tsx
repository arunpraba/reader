"use client";

import { useEffect } from "react";
import { Pencil, X } from "lucide-react";

export function RenameModal({
  open,
  title,
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const canSave = value.trim().length > 0;

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
        aria-labelledby="rename-modal-title"
      >
        <div className="folder-modal-header">
          <div className="folder-modal-title-row">
            <Pencil size={18} aria-hidden="true" />
            <h2 id="rename-modal-title">{title}</h2>
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
          <label className="folder-modal-label" htmlFor="rename-modal-input">
            Name
          </label>
          <input
            id="rename-modal-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label="New name"
            autoComplete="off"
            autoFocus
          />
          <div className="folder-modal-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={!canSave}>
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
