import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import StockManagement from './components/StockManagement';
import BillingManagement from './components/BillingManagement';
import LedgerManagement from './components/LedgerManagement';
import BillHistory from './components/BillHistory';
import LoginPage from './components/LoginPage';
import ProfileModal from './components/ProfileModal';
import MobileBottomNav from './components/MobileBottomNav';
import WebsitePageLoader from './components/WebsitePageLoader';
import LegalDocumentation from './components/LegalDocumentation';
import Footer from './components/Footer';
import { translations } from './i18n/translations';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is authenticated and session is still valid (within 7 days)
    const authFlag = localStorage.getItem('kirana_admin_auth');
    const authSession = localStorage.getItem('kirana_auth_session');
    
    if (authFlag === 'true' && authSession) {
      try {
        const session = JSON.parse(authSession);
        const currentTime = Date.now();
        const sessionAge = currentTime - session.timestamp;
        
        // Check if session is still valid (within 7 days)
        if (sessionAge < session.expiresIn) {
          return true;
        } else {
          // Session expired - cleanup
          localStorage.removeItem('kirana_admin_auth');
          localStorage.removeItem('kirana_auth_session');
          localStorage.removeItem('kirana_user');
          return false;
        }
      } catch (e) {
        // Invalid session data - cleanup
        localStorage.removeItem('kirana_admin_auth');
        localStorage.removeItem('kirana_auth_session');
        return false;
      }
    }
    
    return false;
  });
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('kirana_active_tab') || 'home';
  });
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingSubtext, setLoadingSubtext] = useState('माहिती लोड होत आहे...');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const tabMessages = {
    home: 'मुख्य डॅशबोर्ड लोड होत आहे...',
    stock: 'स्टॉक माहिती व वस्तूंची यादी लोड होत आहे...',
    billing: 'स्मार्ट बिलिंग काउंटर उघडत आहे...',
    ledger: 'ग्राहक उधारी व जमा खाते लोड होत आहे...',
    history: 'पूर्वीच्या बिलांचा इतिहास लोड होत आहे...',
    legal: 'कायदेशीर अटी व गोपनीयतेची माहिती लोड होत आहे...'
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

    // Periodic session validation check (every 1 hour)
    const sessionCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        const authSession = localStorage.getItem('kirana_auth_session');
        if (authSession) {
          try {
            const session = JSON.parse(authSession);
            const currentTime = Date.now();
            const sessionAge = currentTime - session.timestamp;
            
            // If session expired, logout user
            if (sessionAge >= session.expiresIn) {
              handleLogout();
              alert('तुमचा session संपला आहे. कृपया पुन्हा लॉगिन करा.');
            }
          } catch (e) {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      }
    }, 60 * 60 * 1000); // Check every 1 hour

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    localStorage.setItem('kirana_admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('kirana_admin_auth');
    localStorage.removeItem('kirana_auth_session');
    localStorage.removeItem('kirana_user');
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
    <div className="app-root-container" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-base)'
    }}>
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
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        t={t}
      />

      <main className="page-enter-animation" key={activeTab} style={{ flex: 1, width: '100%' }}>
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

        {activeTab === 'legal' && (
          <LegalDocumentation 
            lang={lang} 
            onBack={() => setActiveTab('home')} 
          />
        )}
      </main>

      <Footer 
        setActiveTab={setActiveTab} 
        lang={lang} 
        t={t} 
      />

      <MobileBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        t={t} 
      />
    </div>
  );
}


