import React, { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  ReceiptIcon, 
  BookOpenIcon, 
  BoxesIcon, 
  TriangleAlertIcon, 
  UsersIcon, 
  BanknoteIcon,
  PackageIcon,
  ArrowRightIcon,
  XIcon,
  HistoryIcon
} from '@animateicons/react/lucide';
import { stockAPI, ledgerAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatAmount } from '../utils/formatters';

export default function HomeScreen({ setActiveTab, setStockModalState, t }) {
  const [stats, setStats] = useState({
    totalStockCount: 0,
    lowStockCount: 0,
    totalLedgerCustomers: 0,
    totalDueAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Interactive KPI Modals
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [stockRes, ledgerRes] = await Promise.all([
        stockAPI.getAll(),
        ledgerAPI.getCustomers(),
      ]);

      const items = stockRes.data.data || [];
      const custs = ledgerRes.data.data || [];

      const lowStock = items.filter(item => item.quantity <= (item.minStockAlert || 5));
      const totalDue = custs.reduce((acc, c) => acc + (c.totalDue || 0), 0);

      setStockItems(items);
      setCustomers(custs);

      setStats({
        totalStockCount: items.length,
        lowStockCount: lowStock.length,
        totalLedgerCustomers: custs.length,
        totalDueAmount: totalDue,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = stockItems.filter(item => item.quantity <= (item.minStockAlert || 5));
  const dueCustomers = customers.filter(c => (c.totalDue || 0) > 0);

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1rem' }}>
      


      {/* Action Buttons Grid */}
      <div 
        className="grid-4col"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', 
          gap: '0.85rem', 
          marginBottom: '1.4rem' 
        }}
      >
        
        {/* 1. Stock (Formerly Edit Stock) */}
        <div 
          onClick={() => {
            setActiveTab('stock');
          }}
          className="card-surface"
          style={{
            padding: '1.1rem 0.85rem',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#ffffff',
            color: 'var(--text-heading)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '0.75rem', borderRadius: '50%', display: 'flex' }}>
            <PencilIcon size={26} color="var(--info)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>{t.btnEditStock}</span>
        </div>

        {/* 2. Bill */}
        <div 
          onClick={() => setActiveTab('billing')}
          className="card-surface"
          style={{
            padding: '1.1rem 0.85rem',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#ffffff',
            color: 'var(--text-heading)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: '50%', display: 'flex' }}>
            <ReceiptIcon size={26} color="var(--success)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>{t.btnBill}</span>
        </div>

        {/* 3. Ledger Management */}
        <div 
          onClick={() => setActiveTab('ledger')}
          className="card-surface"
          style={{
            padding: '1.1rem 0.85rem',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#ffffff',
            color: 'var(--text-heading)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '50%', display: 'flex' }}>
            <BookOpenIcon size={26} color="var(--danger)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>{t.btnLedgerManagement}</span>
        </div>

        {/* 4. Bill History */}
        <div 
          onClick={() => setActiveTab('history')}
          className="card-surface"
          style={{
            padding: '1.1rem 0.85rem',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#ffffff',
            color: 'var(--text-heading)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.75rem', borderRadius: '50%', display: 'flex' }}>
            <HistoryIcon size={26} color="#0284c7" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>{t.btnBillHistory || '4. Bill History'}</span>
        </div>

      </div>

      {/* Summary KPI Cards */}
      <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-heading)', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center' }}>
        {t.storeStatusTitle}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        
        {/* KPI 1: Total Stock Products */}
        <div 
          onClick={() => setActiveTab('stock')}
          className="card-surface" 
          style={{ 
            padding: '1rem 1.1rem', 
            background: '#ffffff', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          title="Click to view full stock inventory"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>{t.totalProductsLabel}</span>
            <PackageIcon size={20} color="var(--primary)" />
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-heading)', fontWeight: 800, margin: '0 0 0.4rem 0', lineHeight: 1.1 }}>
              {loading ? <LoadingSpinner inline size="sm" text="" /> : stats.totalStockCount}
            </h2>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.74rem',
              color: 'var(--primary)',
              fontWeight: 700,
              background: 'var(--primary-light)',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px'
            }}>
              {t.goToStock} <ArrowRightIcon size={12} />
            </div>
          </div>
        </div>

        {/* KPI 2: Katha Customers */}
        <div 
          onClick={() => setActiveTab('ledger')}
          className="card-surface" 
          style={{ 
            padding: '1rem 1.1rem', 
            background: '#ffffff', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          title="Click to view Katha customers ledger"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>{t.kathaCustomersLabel}</span>
            <UsersIcon size={20} color="var(--info)" />
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-heading)', fontWeight: 800, margin: '0 0 0.4rem 0', lineHeight: 1.1 }}>
              {loading ? <LoadingSpinner inline size="sm" text="" /> : stats.totalLedgerCustomers}
            </h2>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.74rem',
              color: 'var(--info)',
              fontWeight: 700,
              background: 'var(--info-bg)',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px'
            }}>
              {t.goToLedger} <ArrowRightIcon size={12} />
            </div>
          </div>
        </div>

        {/* KPI 3: Total Katha Due */}
        <div 
          onClick={() => setShowDueModal(true)}
          className="card-surface" 
          style={{ 
            padding: '1rem 1.1rem', 
            background: stats.totalDueAmount > 0 ? 'var(--danger-bg)' : '#ffffff', 
            borderColor: stats.totalDueAmount > 0 ? 'var(--danger-border)' : 'var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          title="Click to see list of customers with pending due amounts"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: stats.totalDueAmount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>{t.totalDueLabel}</span>
            <BanknoteIcon size={20} color="var(--danger)" />
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: stats.totalDueAmount > 0 ? 'var(--danger)' : 'var(--text-heading)', fontWeight: 800, margin: '0 0 0.4rem 0', lineHeight: 1.1 }}>
              {loading ? <LoadingSpinner inline size="sm" text="" /> : `₹${formatAmount(stats.totalDueAmount)}`}
            </h2>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.74rem',
              color: stats.totalDueAmount > 0 ? 'var(--danger)' : 'var(--text-muted)',
              fontWeight: 700,
              background: stats.totalDueAmount > 0 ? '#fecaca' : 'var(--bg-surface-raised)',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px'
            }}>
              {t.clickToViewDetails} <ArrowRightIcon size={12} />
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Modal 1: Low Stock Items Detail Modal */}
      {showLowStockModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(28, 25, 23, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: '560px', padding: '1.6rem', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TriangleAlertIcon size={22} color="var(--warning)" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-heading)', margin: 0 }}>{t.lowStockModalTitle} ({lowStockItems.length})</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{t.lowStockModalSub}</p>
                </div>
              </div>
              <button className="btn-secondary" onClick={() => setShowLowStockModal(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {lowStockItems.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  ✓ All stock levels are sufficient! No low stock alerts.
                </p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.95rem',
                      background: 'var(--warning-bg)',
                      border: '1px solid var(--warning-border)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.55rem',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', margin: 0, color: 'var(--text-heading)', fontWeight: 700 }}>{item.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                        {t.category}: <strong>{item.category || 'General Kirana'}</strong> • {t.minStockAlert}: {item.minStockAlert || 5} {item.unit}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--warning)', display: 'block' }}>
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setShowLowStockModal(false);
                          if (setStockModalState) setStockModalState({ open: true, mode: 'edit', item });
                          setActiveTab('stock');
                        }}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', minHeight: '28px', marginTop: '0.25rem' }}
                      >
                        <PencilIcon size={12} color="#ffffff" /> {t.restockBtn}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowLowStockModal(false);
                  setActiveTab('stock');
                }}
              >
                {t.goToStock} <ArrowRightIcon size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Modal 2: Katha Due Customers Detail Modal */}
      {showDueModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(28, 25, 23, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: '560px', padding: '1.6rem', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BanknoteIcon size={22} color="var(--danger)" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-heading)', margin: 0 }}>{t.kathaDueModalTitle} ({dueCustomers.length})</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{t.kathaDueModalSub}</p>
                </div>
              </div>
              <button className="btn-secondary" onClick={() => setShowDueModal(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {dueCustomers.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  ✓ All customer Katha dues are fully paid! No pending credit amounts.
                </p>
              ) : (
                dueCustomers.map((cust) => (
                  <div
                    key={cust._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.95rem',
                      background: 'var(--danger-bg)',
                      border: '1px solid var(--danger-border)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.55rem',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', margin: 0, color: 'var(--text-heading)', fontWeight: 700 }}>{cust.name}</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{t.phoneNo}:</span>
                        <a
                          href={`tel:${cust.phone}`}
                          title={`कॉल करा: ${cust.phone}`}
                          style={{
                            color: 'var(--primary)',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          📞 {cust.phone}
                        </a>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--danger)', display: 'block' }}>
                        ₹{cust.totalDue}
                      </span>
                      <button
                        className="btn-success"
                        onClick={() => {
                          setShowDueModal(false);
                          setActiveTab('ledger');
                        }}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', minHeight: '28px', marginTop: '0.25rem' }}
                      >
                        {t.viewProfileBtn}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDueModal(false);
                  setActiveTab('ledger');
                }}
              >
                {t.goToLedger} <ArrowRightIcon size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
