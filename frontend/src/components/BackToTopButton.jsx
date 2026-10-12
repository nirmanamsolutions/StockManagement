import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from '@animateicons/react/lucide';

export default function BackToTopButton({ threshold = 220 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="back-to-top-btn no-print"
      aria-label="Back to Top (वर जा)"
      title="वर जा (Back to Top)"
      style={{
        position: 'fixed',
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary, #4f46e5)',
        color: '#ffffff',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: isHovered
          ? '0 12px 28px rgba(79, 70, 229, 0.45)'
          : '0 6px 20px rgba(79, 70, 229, 0.3)',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: 0,
      }}
    >
      <ArrowUpIcon size={22} color="#ffffff" />
    </button>
  );
}
