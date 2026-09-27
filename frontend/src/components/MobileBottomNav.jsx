import React from 'react';
import {
  StoreIcon,
  PackageIcon,
  ShoppingCartIcon,
  BookOpenIcon,
  HistoryIcon
} from '@animateicons/react/lucide';

export default function MobileBottomNav({ activeTab, setActiveTab, t }) {
  const navItems = [
    { id: 'home', label: 'मुख्य', icon: StoreIcon },
    { id: 'stock', label: 'माल', icon: PackageIcon },
    { id: 'billing', label: 'नवीन बिल', icon: ShoppingCartIcon, highlight: true },
    { id: 'ledger', label: 'उधारी', icon: BookOpenIcon },
    { id: 'history', label: 'इतिहास', icon: HistoryIcon },
  ];

  return (
    <nav className="mobile-bottom-dock no-print">
      <div className="mobile-bottom-dock-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`mobile-dock-btn ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-btn' : ''}`}
            >
              <div className="dock-icon-wrapper">
                <Icon size={22} color={isActive ? (item.highlight ? '#ffffff' : 'var(--primary)') : 'var(--text-muted)'} />
              </div>
              <span className="dock-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
