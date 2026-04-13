'use client';

import { useEffect, useState } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import './school-person-modal.scss';

const base = () => process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SchoolPersonModal({
  open,
  onClose,
  variant,
  mode,
  recordId,
  initialName = '',
  initialEmail = '',
  onSuccess,
  onDeleted,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const isStudent = variant === 'student';
  const isEdit = mode === 'edit';
  const title = isStudent
    ? isEdit
      ? 'Update student'
      : 'Add new student'
    : isEdit
      ? 'Update teacher'
      : 'Add new teacher';

  useEffect(() => {
    if (!open) return;
    setName(initialName || '');
    setEmail(initialEmail || '');
    setPassword('');
    setPasswordConfirm('');
    setError('');
    setDeleteOpen(false);
  }, [open, initialName, initialEmail, mode, recordId]);

  const close = () => {
    if (!busy && !deleteBusy) onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isEdit) {
      if (password || passwordConfirm) {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }
      }
    } else {
      if (!password || !passwordConfirm) {
        setError('Enter and confirm the password.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    }

    const nm = name.trim();
    const em = email.trim();
    if (!nm || !em) {
      setError('Name and email are required.');
      return;
    }

    setBusy(true);
    try {
      if (isEdit) {
        const body = { name: nm, email: em };
        if (password) {
          body.password = password;
          body.password_confirm = passwordConfirm;
        }
        const url = isStudent
          ? `${base()}/core/students/${recordId}/`
          : `${base()}/core/teachers/${recordId}/`;
        await axiosInterceptor.patch(url, body);
      } else {
        const url = isStudent ? `${base()}/core/students/create/` : `${base()}/core/teachers/create/`;
        await axiosInterceptor.post(url, {
          name: nm,
          email: em,
          password,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(
        (typeof d?.error === 'string' && d.error) ||
          (typeof d?.detail === 'string' && d.detail) ||
          'Request failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!recordId) return;
    setDeleteBusy(true);
    setError('');
    try {
      const url = isStudent
        ? `${base()}/core/students/${recordId}/`
        : `${base()}/core/teachers/${recordId}/`;
      await axiosInterceptor.delete(url);
      setDeleteOpen(false);
      onDeleted?.();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(
        (typeof d?.error === 'string' && d.error) ||
          (typeof d?.detail === 'string' && d.detail) ||
          'Could not delete.'
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!open) return null;

  const nameLabel = isStudent ? 'Student name' : 'Teacher name';

  return (
    <>
      <div className="school-person-modal-backdrop" role="presentation" onClick={close}>
        <div
          className="school-person-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="school-person-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="school-person-modal-title" className="school-person-modal__title">
            {title}
          </h2>
          <form onSubmit={submit}>
            <div className="school-person-modal__field">
              <label className="school-person-modal__field-label" htmlFor="spm-name">
                {nameLabel}
              </label>
              <input
                id="spm-name"
                className="school-person-modal__field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="school-person-modal__field">
              <label className="school-person-modal__field-label" htmlFor="spm-email">
                Email
              </label>
              <input
                id="spm-email"
                type="email"
                className="school-person-modal__field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="school-person-modal__field">
              <label className="school-person-modal__field-label" htmlFor="spm-pw">
                {isEdit ? 'New password (optional)' : 'Password'}
              </label>
              <input
                id="spm-pw"
                type="password"
                className="school-person-modal__field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isEdit ? 'new-password' : 'new-password'}
              />
            </div>

            <div className="school-person-modal__field">
              <label className="school-person-modal__field-label" htmlFor="spm-pw2">
                Confirm password
              </label>
              <input
                id="spm-pw2"
                type="password"
                className="school-person-modal__field-input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error ? <p className="school-person-modal__error">{error}</p> : null}

            <div className="school-person-modal__actions">
              {isEdit ? (
                <button
                  type="button"
                  className="school-person-modal__btn school-person-modal__btn--danger"
                  disabled={busy || deleteBusy}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="school-person-modal__actions-right">
                <button
                  type="button"
                  className="school-person-modal__btn school-person-modal__btn--ghost"
                  disabled={busy}
                  onClick={close}
                >
                  Cancel
                </button>
                <button type="submit" className="school-person-modal__btn school-person-modal__btn--primary" disabled={busy}>
                  {busy ? 'Saving…' : isEdit ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={isStudent ? 'Delete this student?' : 'Delete this teacher?'}
        message="This cannot be undone. The account and related profile data will be removed from the database."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteOpen(false)}
        onConfirm={() => runDelete()}
      />
    </>
  );
}
