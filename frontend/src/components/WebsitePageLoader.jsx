import React from 'react';
import { StoreIcon, SparklesIcon } from '@animateicons/react/lucide';

export default function WebsitePageLoader({ 
  text = 'शिवरत्न किराणा & जनरल स्टोअर्स', 
  subtext = 'माहिती लोड होत आहे...',
  fullScreen = false
}) {
  return (
    <div className={fullScreen ? "website-loader-fullscreen" : "website-loader-container"}>
      {/* Top Animated Progress Bar */}
      <div className="website-top-progress-bar">
        <div className="website-top-progress-fill" />
      </div>

      <div className="website-loader-card card-surface">
        {/* Glowing Ambient Background Orb */}
        <div className="website-loader-glow" />

        <div className="website-loader-spinner-box">
          <div className="website-loader-ring" />
          <div className="website-loader-icon">
            <StoreIcon size={26} color="var(--primary)" />
          </div>
        </div>

        <h3 className="website-loader-title">{text}</h3>
        <div className="website-loader-subtext">
          <SparklesIcon size={14} color="var(--accent-gold)" style={{ display: 'inline', marginRight: '4px' }} />
          {subtext}
        </div>

        {/* Animated Progress Line */}
        <div className="website-loader-progress-track">
          <div className="website-loader-progress-fill" />
        </div>
      </div>
    </div>
  );
}
