'use client';

import './confirm-dialog.scss';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="confirm-dialog__message">
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
