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
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0.65rem 1.25rem',
          minHeight: '56px'
        }}
      >
        
        {/* Centered Brand Logo & Project Name */}
        <div 
          onClick={() => setActiveTab && setActiveTab('home')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            cursor: 'pointer',
            justifyContent: 'center'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: '#ffffff',
            padding: '0.55rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <StoreIcon size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, lineHeight: 1.1, color: 'var(--text-heading)', fontWeight: 800 }}>
              {t.appName}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t.shopTagline}
            </span>
          </div>
        </div>

        {/* Right Section: Admin Badge & Logout Button */}
        <div 
          className="navbar-actions" 
          style={{ 
            position: 'absolute', 
            right: '1.25rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <div className="admin-badge">
            <ShieldCheckIcon size={14} color="var(--primary)" />
            <span>ॲडमिन</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="btn-danger logout-btn"
              title="Logout from Store POS Admin"
            >
              <LogOutIcon size={15} />
              <span className="logout-text">{t.logoutBtn || 'बाहेर पडणे'}</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
