import React, { useState } from 'react';
import { 
  StoreIcon, 
  PackageIcon, 
  ReceiptIcon, 
  UsersIcon, 
  LogOutIcon, 
  HistoryIcon,
  MenuIcon,
  XIcon,
  ShieldCheckIcon
} from '@animateicons/react/lucide';

export default function Navbar({ activeTab, setActiveTab, lang, setLang, t, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t.navHome, icon: StoreIcon },
    { id: 'stock', label: t.navStockList, icon: PackageIcon },
    { id: 'billing', label: t.navBilling, icon: ReceiptIcon },
    { id: 'ledger', label: t.navLedger, icon: UsersIcon },
    { id: 'history', label: t.navBillHistory || 'बिल इतिहास', icon: HistoryIcon },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        
        {/* Brand Logo & Header */}
        <div 
          onClick={() => handleNavClick('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: '#ffffff',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <StoreIcon size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0, lineHeight: 1.1, color: 'var(--text-heading)', fontWeight: 800 }}>
              {t.appName}
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t.shopTagline}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Pill Bar */}
        <nav className="desktop-nav-pill">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-pill-btn ${isActive ? 'active' : ''}`}
              >
                <IconComponent size={17} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Admin Badge & Logout */}
        <div className="navbar-actions">
          {/* Admin User Badge */}
          <div className="admin-badge">
            <ShieldCheckIcon size={14} color="var(--primary)" />
            <span>ॲडमिन</span>
          </div>

          {/* Logout Button */}
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

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <XIcon size={22} color="var(--text-heading)" /> : <MenuIcon size={22} color="var(--text-heading)" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 800 : 600,
                    border: 'none',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-heading)',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <IconComponent size={20} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                <ShieldCheckIcon size={16} /> ॲडमिन (Admin Logged In)
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="btn-danger"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', borderRadius: '20px' }}
                >
                  <LogOutIcon size={15} />
                  <span>{t.logoutBtn || 'बाहेर पडणे'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  );
}

