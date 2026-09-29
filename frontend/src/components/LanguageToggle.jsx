import React from 'react';
import { GlobeIcon } from '@animateicons/react/lucide';

export default function LanguageToggle({ lang, setLang, bg = '#f1f5f9' }) {
  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        border: '1px solid var(--border-color)',
        borderRadius: '30px',
        padding: '3px',
        userSelect: 'none',
        boxShadow: 'var(--shadow-subtle)',
        position: 'relative'
      }}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
        style={{
          background: 'none',
          border: 'none',
          padding: '0 6px 0 8px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'var(--primary)',
          borderRadius: '50%'
        }}
        title="Toggle Language"
        aria-label="Toggle Language"
      >
        <GlobeIcon size={18} color="var(--primary)" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (lang !== 'en') setLang('en');
        }}
        style={{
          border: 'none',
          outline: 'none',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 700,
          minWidth: '68px',
          textAlign: 'center',
          cursor: 'pointer',
          background: lang === 'en' ? 'var(--primary)' : 'transparent',
          color: lang === 'en' ? '#ffffff' : 'var(--text-muted)',
          boxShadow: lang === 'en' ? '0 2px 8px var(--primary-glow)' : 'none',
          transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
          lineHeight: '1.2'
        }}
        aria-pressed={lang === 'en'}
      >
        मराठी
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (lang !== 'mr') setLang('mr');
        }}
        style={{
          border: 'none',
          outline: 'none',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 700,
          minWidth: '68px',
          textAlign: 'center',
          cursor: 'pointer',
          background: lang === 'mr' ? 'var(--primary)' : 'transparent',
          color: lang === 'mr' ? '#ffffff' : 'var(--text-muted)',
          boxShadow: lang === 'mr' ? '0 2px 8px var(--primary-glow)' : 'none',
          transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
          lineHeight: '1.2'
        }}
        aria-pressed={lang === 'mr'}
      >
        मराठी
      </button>
    </div>
  );
}
