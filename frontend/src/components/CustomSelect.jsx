import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@animateicons/react/lucide';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'निवडा...',
  style = {},
  className = '',
  compact = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        display: 'inline-block',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`custom-select-trigger ${isOpen ? 'active' : ''} ${compact ? 'compact' : ''} ${className}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          background: '#ffffff',
          border: isOpen ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
          borderRadius: compact ? '6px' : 'var(--radius-sm, 10px)',
          padding: compact ? '0.25rem 0.65rem' : '0.55rem 0.85rem',
          height: compact ? '36px' : '42px',
          color: 'var(--text-heading)',
          fontWeight: 700,
          fontSize: compact ? '0.82rem' : '0.88rem',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 0 3.5px var(--primary-glow), 0 4px 14px rgba(67, 56, 202, 0.1)'
            : 'var(--shadow-subtle)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          size={compact ? 14 : 18}
          color="var(--primary)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }}
        />
      </button>

      {isOpen && (
        <div
          className="custom-select-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 10px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(67, 56, 202, 0.08)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '0.35rem',
            animation: 'selectDropdownSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: compact ? '0.4rem 0.6rem' : '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: compact ? '0.8rem' : '0.86rem',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? 'var(--primary)' : 'var(--text-heading)',
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = 'var(--primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-heading)';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckIcon size={compact ? 14 : 16} color="var(--primary)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
