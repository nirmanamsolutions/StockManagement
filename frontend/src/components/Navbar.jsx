import React from 'react';
import {
  StoreIcon,
  LogOutIcon,
  ShieldCheckIcon
} from '@animateicons/react/lucide';

export default function Navbar({ setActiveTab, t, onLogout }) {
  return (
    <header className="navbar-container">
      <div
        className="navbar-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          minHeight: '62px',
          gap: '0.5rem'
        }}
      >
        {/* Left Spacer for symmetry on desktop */}
        <div className="navbar-left-spacer" style={{ width: '40px', flexShrink: 0 }}></div>

        {/* Centered Shop Name Title & Subtle Clean Logo */}
        <div
          onClick={() => setActiveTab && setActiveTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            justifyContent: 'center',
            textAlign: 'center',
            flex: 1,
            minWidth: 0
          }}
        >
          {/* Minimalist Store Canopy & Wheat Grain Vector Icon Emblem */}
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(67, 56, 202, 0.28)',
            flexShrink: 0
          }}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Store Canopy Roof */}
              <path d="M10 16L12 11H28L30 16H10Z" fill="#f59e0b" />
              <path d="M10 16C10 17.1 10.9 18 12 18C13.1 18 14 17.1 14 16C14 17.1 14.9 18 16 18C17.1 18 18 17.1 18 16C18 17.1 18.9 18 20 18C21.1 18 22 17.1 22 16C22 17.1 22.9 18 24 18C25.1 18 26 17.1 26 16C26 17.1 26.9 18 28 18C29.1 18 30 17.1 30 16" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />

              {/* Store Front Pillars & Door */}
              <rect x="11.5" y="18" width="17" height="11" rx="1" fill="#ffffff" fillOpacity="0.15" stroke="#ffffff" strokeWidth="1.4" />
              <path d="M17 29V23H23V29" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              {/* Left & Right Wheat Grains Stalk Accents */}
              <path d="M7 26C8 24 9 22 10.5 21M7 26C7.5 24.5 8.5 23.5 10 23.5M7 26C6.5 24.5 5.5 23.5 4 23.5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M33 26C32 24 31 22 29.5 21M33 26C32.5 24.5 31.5 23.5 30 23.5M33 26C33.5 24.5 34.5 23.5 36 23.5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
            <h2 className="navbar-shop-title" style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--text-heading)',
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}>
              शिवरत्न किराणा & जनरल स्टोअर्स
            </h2>
            <span style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              margin: '0.1rem 0 0 0',
              lineHeight: 1.1,
              textAlign: 'center'
            }}>
              खंडोबाचीवाडी
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="btn-danger logout-btn"
            title="सिस्टममधून बाहेर पडा"
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <LogOutIcon size={16} color="#ffffff" />
            <span className="logout-text">{t.logoutBtn || 'बाहेर पडणे'}</span>
          </button>
        )}


      </div>
    </header>
  );
}
