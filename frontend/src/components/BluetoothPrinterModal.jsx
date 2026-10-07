import React, { useState, useEffect } from 'react';
import {
  XIcon,
  CheckIcon,
  RefreshCwIcon,
  PrinterIcon
} from '@animateicons/react/lucide';
import bluetoothPrinter from '../services/bluetoothPrinter';

export default function BluetoothPrinterModal({ isOpen, onClose, onPrintNow, onPaperChange, billData, t = {} }) {
  const [isSupported, setIsSupported] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [printerName, setPrinterName] = useState(null);
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const supported = bluetoothPrinter.isSupported();
      setIsSupported(supported);
      setIsConnected(bluetoothPrinter.isConnected());
      setPrinterName(bluetoothPrinter.getPrinterName());
      setPaperWidth(bluetoothPrinter.getPaperWidth());
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage('प्रिंटर शोधत आहे... कृपया लिस्टधून Epson TM-T82X निवडा');
      
      const result = await bluetoothPrinter.connect();
      setIsConnected(true);
      setPrinterName(result.deviceName);
      setStatusMessage(`यशस्वीरित्या कनेक्ट झाले: ${result.deviceName}`);
    } catch (err) {
      setIsConnected(false);
      setErrorMessage(err.message || 'कनेक्ट करताना अडचण आली.');
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    bluetoothPrinter.disconnect();
    setIsConnected(false);
    setStatusMessage('प्रिंटर डिस्कनेक्ट केले.');
  };

  const handlePaperChange = (width) => {
    setPaperWidth(width);
    bluetoothPrinter.setPaperWidth(width);
    // Keep the receipt preview and its PDF export in sync with the printer setting.
    onPaperChange?.(width);
  };

  const handleTestPrint = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage('टेस्ट पावती प्रिंट होत आहे...');
      await bluetoothPrinter.printTestPage();
      setStatusMessage('टेस्ट पावती यशस्वीरित्या प्रिंट झाली!');
    } catch (err) {
      setErrorMessage(err.message || 'प्रिंट करताना त्रुटी आली.');
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPrintBill = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage('पावती प्रिंटरवर पाठवत आहे...');
      await bluetoothPrinter.printBill(billData);
      setStatusMessage('पावती यशस्वीरित्या प्रिंट झाली!');
      if (onPrintNow) {
        onPrintNow();
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setErrorMessage(err.message || 'पावती प्रिंट करताना त्रुटी आली.');
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div className="card-surface" style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '480px',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '1.5rem',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box'
      }}>
        
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          paddingBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '0.55rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PrinterIcon size={24} color="#16a34a" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-heading, #0f172a)', fontWeight: 800 }}>
                बिल प्रिंटर (Epson TM-T82X)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                रोल साईझ: 80mm / 3-इंच (80mm Thermal Roll)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '0.25rem'
            }}
          >
            <XIcon size={22} />
          </button>
        </div>

        {/* Browser Support Alert */}
        {!isSupported && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>वेब ब्लूटूथ सपोर्ट उपलब्ध नाही</div>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
              कृपया <strong>Google Chrome</strong> किंवा <strong>Microsoft Edge</strong> ब्राऊझर वापरा.
            </p>
          </div>
        )}

        {/* Printer Connection Status Banner */}
        <div style={{
          background: isConnected ? '#f0fdf4' : '#f8fafc',
          border: `1.5px solid ${isConnected ? '#bbf7d0' : '#e2e8f0'}`,
          borderRadius: '12px',
          padding: '1rem 1.15rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#22c55e' : '#dc2626',
                display: 'inline-block'
              }} />
              {isConnected ? 'कनेक्ट केलेले डिव्हाइस:' : 'प्रिंटर स्थिती:'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isConnected ? '#15803d' : '#dc2626', marginTop: '0.25rem' }}>
              {isConnected ? (printerName || 'Epson TM-T82X Printer') : 'प्रिंटर कनेक्ट केलेले नाही'}
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDisconnect}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', color: '#dc2626', borderColor: '#fecaca' }}
              >
                डिस्कनेक्ट
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleConnect}
                disabled={loading || !isSupported}
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem', background: '#16a34a', borderColor: '#16a34a' }}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>शोधत आहे...</span>
                  </>
                ) : (
                  <>
                    <PrinterIcon size={16} />
                    <span>प्रिंटर शोधा & कनेक्ट करा</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Paper Roll Size Selector for Epson Printer */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-heading, #0f172a)', marginBottom: '0.45rem' }}>
            📦 तुमच्या Epson प्रिंटरमधील सध्याची रोल साईझ (Select Paper Roll Size):
          </div>

          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
            तुमच्या <strong>Epson TM-T82X-II</strong> प्रिंटरमध्ये जो पेपर रोल टाकला आहे तो निवडा. बिलाची साईझ आपोआप त्यानुसार सेट होईल.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handlePaperChange('80mm')}
              style={{
                padding: '0.6rem 0.35rem',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: paperWidth === '80mm' ? '#16a34a' : '#cbd5e1',
                background: paperWidth === '80mm' ? '#f0fdf4' : '#ffffff',
                color: paperWidth === '80mm' ? '#15803d' : 'var(--text-body, #334155)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: paperWidth === '80mm' ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div>80mm (3-इंच) ⭐</div>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: paperWidth === '80mm' ? '#16a34a' : '#64748b' }}>
                (Epson TM-T82)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePaperChange('100mm')}
              style={{
                padding: '0.6rem 0.35rem',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: paperWidth === '100mm' ? '#16a34a' : '#cbd5e1',
                background: paperWidth === '100mm' ? '#f0fdf4' : '#ffffff',
                color: paperWidth === '100mm' ? '#15803d' : 'var(--text-body, #334155)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: paperWidth === '100mm' ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div>100mm (4-इंच)</div>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: paperWidth === '100mm' ? '#16a34a' : '#64748b' }}>
                (Wide 4" Roll)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePaperChange('58mm')}
              style={{
                padding: '0.6rem 0.35rem',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: paperWidth === '58mm' ? '#16a34a' : '#cbd5e1',
                background: paperWidth === '58mm' ? '#f0fdf4' : '#ffffff',
                color: paperWidth === '58mm' ? '#15803d' : 'var(--text-body, #334155)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: paperWidth === '58mm' ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div>58mm (2-इंच)</div>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: paperWidth === '58mm' ? '#16a34a' : '#64748b' }}>
                (Small Roll)
              </span>
            </button>
          </div>

          <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: '#eff6ff', borderRadius: '8px', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, border: '1px solid #bfdbfe' }}>
            ℹ️ <strong>Epson TM-T82X-II माहिती:</strong> Epson च्या बॉडीमध्ये ३-इंच (80mm) पेपर रोल बसतो. 4-इंच (100mm) चा रोल वापरण्यासाठी 4-इंच लेबल/बिल प्रिंटर किंवा डायरेक्ट USB प्लग-इन वापरता येईल.
          </div>
        </div>

        {/* Feedback Banners */}
        {statusMessage && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <CheckIcon size={16} color="#15803d" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleTestPrint}
            disabled={loading || !isSupported}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCwIcon size={14} />
            <span>टेस्ट पावती छापा</span>
          </button>

          {billData && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleDirectPrintBill}
              disabled={loading || !isSupported}
              style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem', background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>प्रिंट होत आहे...</span>
                </>
              ) : (
                <>
                  <PrinterIcon size={16} />
                  <span>बिल प्रिंट करा</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
          >
            बंद करा
          </button>
        </div>

      </div>
    </div>
  );
}
