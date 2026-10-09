import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  CheckIcon,
  TriangleAlertIcon,
  ShieldCheckIcon
} from '@animateicons/react/lucide';
import { authAPI } from '../services/api';

export default function ProfileModal({ isOpen, onClose, t }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchCurrentProfile();
    }
  }, [isOpen]);

  const fetchCurrentProfile = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data && res.data.data) {
        setNewUsername(res.data.data.username || '');
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('बदल करण्यासाठी चालू पासवर्ड आवश्यक आहे!');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('नवीन पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत!');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authAPI.updateCredentials({
        currentPassword,
        newUsername: newUsername.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.data && res.data.success) {
        setSuccessMsg('युझरनेम आणि पासवर्ड यशस्वीरित्या अपडेट झाले!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (res.data.data) {
          localStorage.setItem('kirana_user', JSON.stringify(res.data.data));
        }
      } else {
        setErrorMsg(res.data?.message || 'अपडेट करताना त्रुटी आली');
      }
    } catch (err) {
      console.error('Error updating credentials:', err);
      setErrorMsg(err.response?.data?.message || 'अपडेट करताना त्रुटी आली. कृपया चालू पासवर्ड तपासा.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '1.5rem 1rem',
      overflowY: 'auto'
    }}>
      <div className="card-surface" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.2rem 2rem',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>

        {/* Modal Close Icon */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
          title="बंद करा"
        >
          <XIcon size={18} />
        </button>

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '0.85rem', borderRadius: '50%', color: 'var(--primary)', marginBottom: '0.65rem' }}>
            <ShieldCheckIcon size={32} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-heading)', margin: 0, fontWeight: 800 }}>
            प्रोफाईल व पासवर्ड बदला
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            तुमचा युझरनेम किंवा पासवर्ड येथे सुरक्षितपणे अपडेट करा
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TriangleAlertIcon size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckIcon size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Current Password (Required to authorize changes) */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              चालू पासवर्ड (Current Password) *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <LockIcon size={18} color="var(--danger)" />
              </div>
              <input
                type={showCurrentPass ? 'text' : 'password'}
                className="input-field"
                required
                placeholder="चालू पासवर्ड टाका"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem', height: '42px', borderColor: 'var(--primary)' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
              >
                {showCurrentPass ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '1.2rem 0' }} />

          {/* New Username */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              नवीन युझरनेम (New Username)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <UserIcon size={18} color="var(--primary)" />
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="उदा. नवीन युझरनेम किंवा मोबाईल नंबर"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ paddingLeft: '2.6rem', height: '42px' }}
              />
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              नवीन पासवर्ड (New Password)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <LockIcon size={18} color="var(--primary)" />
              </div>
              <input
                type={showNewPass ? 'text' : 'password'}
                className="input-field"
                placeholder="नवीन पासवर्ड टाका (किमान ४ अक्षरे)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem', height: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
              >
                {showNewPass ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          {newPassword && (
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                नवीन पासवर्ड पुन्हा टाका (Confirm New Password)
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <LockIcon size={18} color="var(--primary)" />
                </div>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="नवीन पासवर्ड पुन्हा टाका"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem', height: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                >
                  {showConfirmPass ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              रद्द करा
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1.5, justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" />
                  <span>सेव्ह होत आहे...</span>
                </>
              ) : (
                'अपडेट करा'
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
