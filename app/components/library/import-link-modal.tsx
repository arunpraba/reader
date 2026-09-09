"use client";

import { useEffect } from "react";
import { Link2, X } from "lucide-react";

export function ImportLinkModal({
  open,
  importLink,
  importingLink,
  importLinkError,
  onImportLinkChange,
  onImportLinkPaste,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  importLink: string;
  importingLink: boolean;
  importLinkError: string;
  onImportLinkChange: (value: string) => void;
  onImportLinkPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const canImport = importLink.trim().length > 0 && !importingLink;

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
        aria-labelledby="import-link-modal-title"
      >
        <div className="folder-modal-header">
          <div className="folder-modal-title-row">
            <Link2 size={18} aria-hidden="true" />
            <h2 id="import-link-modal-title">Import link</h2>
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
            if (canImport) onSubmit();
          }}
        >
          <label className="folder-modal-label" htmlFor="import-link-modal-input">
            URL
          </label>
          <input
            id="import-link-modal-input"
            type="url"
            inputMode="url"
            value={importLink}
            disabled={importingLink}
            onChange={(event) => onImportLinkChange(event.target.value)}
            onPaste={onImportLinkPaste}
            placeholder="https://"
            aria-label="Page URL"
            autoComplete="off"
          />
          {importLinkError ? (
            <p className="import-link-error" role="alert">
              {importLinkError}
            </p>
          ) : null}
          <div className="folder-modal-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={!canImport}
            >
              {importingLink ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
