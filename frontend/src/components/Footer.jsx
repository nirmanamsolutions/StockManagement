import React from 'react';
import { ShieldCheckIcon, ScaleIcon, LockIcon, FileTextIcon } from 'lucide-react';

export default function Footer({ setActiveTab, lang = 'mr', t }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid var(--border-color)',
      padding: '0.85rem 1.25rem',
      marginTop: 'auto',
      color: 'var(--text-muted)',
      fontSize: '0.8rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>

        {/* Left: Copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-body)' }}>
          <span>© {currentYear} <strong>शिवरत्न किराणा & जनरल स्टोअर्स</strong></span>
          <span style={{ color: 'var(--border-highlight)' }}>•</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>निर्माम सोल्युशन्स</span>
        </div>

        {/* Center: Sleek Minimal Legal Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          fontWeight: 700,
          fontSize: '0.78rem'
        }}>
          <button
            onClick={() => setActiveTab && setActiveTab('legal')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <span>सेवा व नियम</span>
          </button>

          <span style={{ color: 'var(--border-color)' }}>|</span>

          <button
            onClick={() => setActiveTab && setActiveTab('legal')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <span>गोपनीयता धोरण</span>
          </button>

          <span style={{ color: 'var(--border-color)' }}>|</span>

          <button
            onClick={() => setActiveTab && setActiveTab('legal')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <span>कायदेशीर माहिती केंद्र</span>
          </button>
        </div>

        {/* Right: Minimal Compliance Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid var(--success-border)',
          padding: '0.2rem 0.55rem',
          borderRadius: '12px',
          fontSize: '0.74rem',
          fontWeight: 700
        }}>
          <ShieldCheckIcon size={13} color="var(--success)" />
          <span>डिजिटल गोपनीयता कायदा सुसंगत</span>
        </div>

      </div>
    </footer>
  );
}
