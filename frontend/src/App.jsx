import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import StockManagement from './components/StockManagement';
import BillingManagement from './components/BillingManagement';
import LedgerManagement from './components/LedgerManagement';
import BillHistory from './components/BillHistory';
import LoginPage from './components/LoginPage';
import { translations } from './i18n/translations';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kirana_admin_auth') === 'true';
  });
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('kirana_active_tab') || 'home';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('kirana_active_tab', tab);
  };

  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('kirana_lang') || 'mr';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('kirana_lang', newLang);
  };
  
  // Cross-component state to trigger add/edit modal in stock tab from home action buttons
  const [stockModalState, setStockModalState] = useState({ open: false, mode: 'add', item: null });

  const t = translations[lang] || translations.en;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('kirana_admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('kirana_admin_auth');
    localStorage.removeItem('kirana_active_tab');
    setIsAuthenticated(false);
    setActiveTabState('home');
  };

  // If not logged in, show the Admin Login Screen
  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={handleLoginSuccess} 
        lang={lang} 
        setLang={setLang} 
        t={t} 
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3.5rem', background: 'var(--bg-base)' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lang={lang} 
        setLang={setLang} 
        t={t}
        onLogout={handleLogout}
      />

      <main>
        {activeTab === 'home' && (
          <HomeScreen 
            setActiveTab={setActiveTab} 
            setStockModalState={setStockModalState} 
            t={t} 
          />
        )}

        {activeTab === 'stock' && (
          <StockManagement 
            modalState={stockModalState} 
            setModalState={setStockModalState} 
            setActiveTab={setActiveTab}
            t={t} 
          />
        )}

        {activeTab === 'billing' && (
          <BillingManagement 
            setActiveTab={setActiveTab}
            t={t} 
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerManagement 
            setActiveTab={setActiveTab}
            t={t} 
          />
        )}

        {activeTab === 'history' && (
          <BillHistory 
            setActiveTab={setActiveTab}
            t={t} 
          />
        )}
      </main>
    </div>
  );
}
