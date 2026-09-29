import React, { useState } from 'react';
import LegalDocumentation from './LegalDocumentation';
import {
  StoreIcon,
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  LogInIcon,
  TriangleAlertIcon
} from '@animateicons/react/lucide';

export default function LoginPage({ onLogin, lang, setLang, t }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      // Validate credentials strictly: username = '9763950797', password = 'kirana@123'
      if (username.trim() === '9763950797' && password === 'kirana@123') {
        onLogin();
      } else {
        setErrorMsg(t.invalidCredentials || 'Invalid Admin Username or Password!');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const [showLegalModal, setShowLegalModal] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'radial-gradient(circle at 50% 20%, #e0e7ff 0%, #f7f7f6 60%, #eef2ff 100%)',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Main Glassmorphism Login Card */}
      <div className="card-surface" style={{
        width: '100%',
        maxWidth: '430px',
        padding: '2.2rem 2rem',
        background: '#ffffff',
        boxShadow: '0 20px 40px -15px rgba(67, 56, 202, 0.18), 0 0 1px 1px rgba(0,0,0,0.05)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        position: 'relative'
      }}>

        {/* Animated Brand Header */}
        <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 8px 20px var(--primary-glow)' }}>
          <StoreIcon size={34} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-heading)', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
          {t.loginTitle}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.6rem', lineHeight: 1.4 }}>
          {t.loginSubtitle}
        </p>

        {/* Error Alert Message */}
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
            gap: '0.5rem',
            textAlign: 'left'
          }}>
            <TriangleAlertIcon size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>

          {/* Username Field */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              {t.usernameLabel} *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <UserIcon size={18} color="var(--primary)" />
              </div>
              <input
                type="text"
                className="input-field"
                required
                maxLength={10}
                placeholder="मोबाईल नंबर टाका"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ paddingLeft: '2.6rem', height: '42px' }}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1.4rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              {t.passwordLabel} *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <LockIcon size={18} color="var(--primary)" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                required
                placeholder="पासवर्ड टाका"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem', height: '42px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text-muted)'
                }}
                title={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '44px',
              fontSize: '0.98rem',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner" />
                <span>लॉगइन होत आहे...</span>
              </>
            ) : (
              <>
                <LogInIcon size={18} color="#ffffff" />
                <span>{t.loginBtn}</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Footer Branding & Legal Documentation Access */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div>© {new Date().getFullYear()} {t.appName} • निर्माम सोल्युशन्स</div>
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontWeight: 700 }}>
          <button
            onClick={() => setShowLegalModal(true)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
          >
            📜 {t.footerTerms || 'Terms of Service'}
          </button>
          <span>•</span>
          <button
            onClick={() => setShowLegalModal(true)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
          >
            🛡️ {t.footerPrivacy || 'Privacy Policy'}
          </button>
          <span>•</span>
          <button
            onClick={() => setShowLegalModal(true)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
          >
            🏛️ {t.footerLegalCenter || 'Legal Documentation'}
          </button>
        </div>
      </div>

      {/* Legal Documentation Modal on Login Page */}
      {showLegalModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 10000,
          overflowY: 'auto',
          padding: '1.5rem 1rem'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <LegalDocumentation lang={lang} onBack={() => setShowLegalModal(false)} fullScreen={true} />
          </div>
        </div>
      )}

    </div>
  );
}
