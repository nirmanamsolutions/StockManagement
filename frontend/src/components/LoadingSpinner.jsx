import React from 'react';
import { StoreIcon } from '@animateicons/react/lucide';

export default function LoadingSpinner({ text = 'माहिती लोड होत आहे...', size = 'md', inline = false }) {
  const dimensions = size === 'sm' ? '28px' : size === 'lg' ? '56px' : '42px';
  const borderWidth = size === 'sm' ? '2.5px' : '3.5px';

  if (inline) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <div 
          className="pos-loading-spinner-ring" 
          style={{ width: dimensions, height: dimensions, borderWidth }}
        />
        {text && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{text}</span>}
      </div>
    );
  }

  return (
    <div className="pos-loading-container">
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
        <div 
          className="pos-loading-spinner-ring" 
          style={{ width: dimensions, height: dimensions, borderWidth }}
        />
        <div className="pos-loading-icon-pulse" style={{ position: 'absolute', display: 'flex', opacity: 0.85 }}>
          <StoreIcon size={size === 'sm' ? 14 : size === 'lg' ? 24 : 18} color="var(--primary)" />
        </div>
      </div>
      
      {text && (
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.01em' }}>
          {text}
        </p>
      )}
    </div>
  );
}
