import React from 'react';
import { CheckIcon, TriangleAlertIcon, PackageIcon, XIcon, SparklesIcon } from '@animateicons/react/lucide';

export default function CustomModal({
  isOpen,
  type = 'alert', // 'alert' | 'confirm' | 'success' | 'danger' | 'warning'
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm' || Boolean(onCancel);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckIcon size={30} color="var(--success)" />;
      case 'danger':
      case 'warning':
        return <TriangleAlertIcon size={30} color="var(--danger)" />;
      case 'confirm':
        return <SparklesIcon size={30} color="var(--primary)" />;
      default:
        return <PackageIcon size={30} color="var(--primary)" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'var(--success-bg)';
      case 'danger':
      case 'warning':
        return 'var(--danger-bg)';
      case 'confirm':
        return 'var(--primary-light)';
      default:
        return 'var(--primary-light)';
    }
  };

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        animation: 'fadeInSmooth 0.2s ease-out',
      }}
      onClick={() => isConfirm ? onCancel && onCancel() : onConfirm && onConfirm()}
    >
      <div
        className="card-surface"
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 24px)',
          maxWidth: '440px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          animation: 'rowFadeSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={() => isConfirm ? onCancel && onCancel() : onConfirm && onConfirm()}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="बंद करा"
        >
          <XIcon size={20} />
        </button>

        {/* Modal Header Icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              background: getIconBg(),
              padding: '0.75rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getIcon()}
          </div>

          <div style={{ flex: 1, paddingTop: '0.2rem' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-heading)',
                margin: '0 0 0.4rem 0',
                lineHeight: 1.25,
              }}
            >
              {title || (type === 'danger' ? 'सावधान!' : type === 'success' ? 'यशस्वी!' : 'माहिती')}
            </h3>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-body)',
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}
            >
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          {isConfirm && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onCancel && onCancel()}
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
            >
              {cancelText || 'रद्द करा (Cancel)'}
            </button>
          )}

          <button
            type="button"
            className={type === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={() => onConfirm && onConfirm()}
            style={{ padding: '0.55rem 1.35rem', fontSize: '0.88rem', fontWeight: 800 }}
            autoFocus
          >
            {confirmText || (isConfirm ? 'होय (Confirm)' : 'ठीक आहे (OK)')}
          </button>
        </div>
      </div>
    </div>
  );
}
