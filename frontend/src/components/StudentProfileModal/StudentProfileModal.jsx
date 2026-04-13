'use client';

import { useEffect, useState } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import PexelsImagePicker from '@/components/PexelsImagePicker/PexelsImagePicker';
import './student-profile-modal.scss';

function splitName(full) {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() };
}

export default function StudentProfileModal({ isOpen, onClose, profile, onSaved }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const displayName = (profile?.name || '').trim() || 'Your profile';
  const { first: firstName, last: lastName } = splitName(profile?.name);

  useEffect(() => {
    if (!isOpen || !profile) return;
    setEmail(profile.email || '');
    setPassword('');
    setPasswordConfirm('');
    setAvatarUrl(profile.avatar_url || '');
    setError('');
  }, [isOpen, profile]);

  if (!isOpen || !profile) {
    return null;
  }

  const initials = `${(firstName || '?').slice(0, 1)}${(lastName || '').slice(0, 1)}`.toUpperCase() || '?';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

    const payload = {
      email: email.trim(),
      avatar_url: avatarUrl.trim(),
    };
    if (password) {
      payload.password = password;
      payload.password_confirm = passwordConfirm;
    }

    setSaving(true);
    try {
      await axiosInterceptor.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-profile/`,
        payload
      );
      onSaved?.();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      const msg =
        (typeof d?.error === 'string' && d.error) ||
        (typeof d?.detail === 'string' && d.detail) ||
        'Could not update profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="profile-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal__title-row">
            <h2 id="profile-modal-title" className="profile-modal__heading">
              {displayName}
            </h2>
            <button type="button" className="profile-modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <form className="profile-modal__body" onSubmit={handleSubmit}>
            {error ? <div className="profile-modal__error">{error}</div> : null}

            <div className="profile-modal__avatar-col">
              <div className="profile-modal__avatar-wrap">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" />
                ) : (
                  <div className="profile-modal__avatar-placeholder">{initials}</div>
                )}
              </div>
              <button type="button" className="profile-modal__select-img" onClick={() => setPickerOpen(true)}>
                Select image
              </button>
            </div>

            <div className="profile-modal__form-col">
              <div className="profile-modal__field">
                <label className="profile-modal__field-label" htmlFor="prof-email">
                  Email
                </label>
                <input
                  id="prof-email"
                  className="profile-modal__field-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="profile-modal__field">
                <label className="profile-modal__field-label" htmlFor="prof-pass">
                  New password (optional)
                </label>
                <input
                  id="prof-pass"
                  className="profile-modal__field-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="profile-modal__field">
                <label className="profile-modal__field-label" htmlFor="prof-pass2">
                  Confirm new password
                </label>
                <input
                  id="prof-pass2"
                  className="profile-modal__field-input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="profile-modal__actions">
              <button type="submit" className="profile-modal__submit" disabled={saving}>
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PexelsImagePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => setAvatarUrl(url)}
      />
    </>
  );
}
