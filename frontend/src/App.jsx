import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import StockManagement from './components/StockManagement';
import BillingManagement from './components/BillingManagement';
import LedgerManagement from './components/LedgerManagement';
import BillHistory from './components/BillHistory';
import LoginPage from './components/LoginPage';
import MobileBottomNav from './components/MobileBottomNav';
import WebsitePageLoader from './components/WebsitePageLoader';
import { translations } from './i18n/translations';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kirana_admin_auth') === 'true';
  });
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('kirana_active_tab') || 'home';
  });
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingSubtext, setLoadingSubtext] = useState('माहिती लोड होत आहे...');

  const tabMessages = {
    home: 'मुख्य डॅशबोर्ड लोड होत आहे...',
    stock: 'स्टॉक माहिती व वस्तूंची यादी लोड होत आहे...',
    billing: 'स्मार्ट बिलिंग काउंटर उघडत आहे...',
    ledger: 'ग्राहक उधारी व जमा खाते लोड होत आहे...',
    history: 'पूर्वीच्या बिलांचा इतिहास लोड होत आहे...'
  };

  const setActiveTab = (tab, pushHistory = true) => {
    if (tab !== activeTab) {
      setIsPageLoading(true);
      setLoadingSubtext(tabMessages[tab] || 'माहिती लोड होत आहे...');
      setTimeout(() => {
        setIsPageLoading(false);
      }, 320);
    }
    setActiveTabState(tab);
    localStorage.setItem('kirana_active_tab', tab);
    if (pushHistory) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
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

    // Remove preloader splash element from index.html once React is mounted
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 300);
    }

    // Set initial history state
    if (!window.history.state || !window.history.state.tab) {
      window.history.replaceState({ tab: activeTab }, '', `#${activeTab}`);
    }

    // Handle browser back / forward button navigation
    const handlePopState = (e) => {
      const targetTab = e.state?.tab || 'home';
      setIsPageLoading(true);
      setLoadingSubtext(tabMessages[targetTab] || 'माहिती लोड होत आहे...');
      setTimeout(() => {
        setIsPageLoading(false);
      }, 320);
      setActiveTabState(targetTab);
      localStorage.setItem('kirana_active_tab', targetTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
    <div style={{ minHeight: '100vh', paddingBottom: '5.5rem', background: 'var(--bg-base)' }}>
      {isPageLoading && (
        <WebsitePageLoader 
          text="शिवरत्न किराणा & जनरल स्टोअर्स" 
          subtext={loadingSubtext} 
          fullScreen={true} 
        />
      )}

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lang={lang} 
        setLang={setLang} 
        t={t}
        onLogout={handleLogout}
      />

      <main className="page-enter-animation" key={activeTab}>
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

      <MobileBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        t={t} 
      />
    </div>
  );
}

