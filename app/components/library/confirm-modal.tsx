"use client";

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
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
        aria-labelledby="confirm-modal-title"
      >
        <div className="folder-modal-header">
          <div className="folder-modal-title-row">
            <Trash2 size={18} aria-hidden="true" />
            <h2 id="confirm-modal-title">{title}</h2>
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
        <p className="folder-modal-copy">{message}</p>
        <div className="folder-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button danger-button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
