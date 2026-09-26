import React, { useEffect, useState } from 'react';
import { 
  SearchIcon, 
  PlusIcon, 
  PhoneIcon, 
  CreditCardIcon, 
  MessageCircleIcon, 
  HistoryIcon, 
  ArrowUpRightIcon, 
  ArrowDownRightIcon,
  ArrowLeftIcon
} from '@animateicons/react/lucide';
import { ledgerAPI } from '../services/api';

export default function LedgerManagement({ setActiveTab, t }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer for detail view
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNote, setPayNote] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      const res = await ledgerAPI.getCustomers(query);
      const list = res.data.data || [];
      setCustomers(list);

      // Default select first customer if available & none selected
      if (list.length > 0 && !selectedCustomerId) {
        selectCustomer(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch ledger customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchCustomers(val);
  };

  const selectCustomer = async (id) => {
    setSelectedCustomerId(id);
    try {
      setDetailsLoading(true);
      const res = await ledgerAPI.getCustomerDetails(id);
      setCustomerDetails(res.data.data);
    } catch (err) {
      console.error('Failed to fetch customer details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Name and Phone are required');
      return;
    }

    try {
      const res = await ledgerAPI.addCustomer({ name: newCustName, phone: newCustPhone });
      setShowAddModal(false);
      setNewCustName('');
      setNewCustPhone('');
      fetchCustomers(searchQuery);
      selectCustomer(res.data.data._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add customer');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await ledgerAPI.recordPayment({
        customerId: selectedCustomerId,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        note: payNote || `Paid via ${payMethod}`,
      });

      setShowPayModal(false);
      setPayAmount('');
      setPayNote('');

      // Refresh customer details & list
      selectCustomer(selectedCustomerId);
      fetchCustomers(searchQuery);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  // Marathi WhatsApp Link Trigger
  const handleSendWhatsAppReminder = async () => {
    if (!selectedCustomerId) return;
    try {
      const res = await ledgerAPI.getWhatsAppReminder(selectedCustomerId, 'किराणा आणि जनरल स्टोअर्स');
      const { whatsappUrl } = res.data.data;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      alert('Failed to generate WhatsApp reminder link');
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1.25rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('home')}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
              title={t.btnBack}
            >
              <ArrowLeftIcon size={16} color="var(--primary)" />
              <span>{t.btnBack}</span>
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.7rem', margin: 0, color: 'var(--text-heading)' }}>{t.ledgerTitle}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{t.ledgerSubtitle}</p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <PlusIcon size={18} color="#ffffff" />
          {t.addNewCustomer}
        </button>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem' }}>
        
        {/* Left Column: Customer Search & Directory */}
        <div>
          {/* Search Input */}
          <div className="card-surface" style={{ padding: '0.85rem 1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#ffffff' }}>
            <SearchIcon size={20} color="var(--text-muted)" />
            <input
              type="text"
              className="input-field"
              placeholder={t.searchCustomer}
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
            />
          </div>

          {/* Customers Directory List */}
          <div className="card-surface" style={{ maxHeight: '600px', overflowY: 'auto', padding: '0.5rem', background: '#ffffff' }}>
            {customers.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
                {t.noCustomers}
              </p>
            ) : (
              customers.map((c) => {
                const isSelected = c._id === selectedCustomerId;
                return (
                  <div
                    key={c._id}
                    onClick={() => selectCustomer(c._id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.45rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.92rem', margin: 0, color: 'var(--text-heading)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whitespace: 'nowrap' }}>{c.name}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <PhoneIcon size={12} color="var(--primary)" /> {c.phone}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 800, 
                        color: c.totalDue > 0 ? 'var(--danger)' : 'var(--success)',
                        display: 'block'
                      }}>
                        ₹{c.totalDue}
                      </span>
                      <span className={c.totalDue > 0 ? 'badge-unpaid' : 'badge-paid'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', marginTop: '0.2rem', display: 'inline-block' }}>
                        {c.totalDue > 0 ? t.dueStatusBadge : t.clearStatusBadge}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Due Detail & Payment Ledger Timeline */}
        <div className="card-surface" style={{ padding: '1.25rem 1.4rem', background: '#ffffff' }}>
          {detailsLoading ? (
            <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>{t.loadingKathaHistory}</p>
          ) : !customerDetails ? (
            <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>{t.selectCustomerPrompt}</p>
          ) : (
            <div>
              {/* Customer Profile Banner */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                paddingBottom: '1rem', 
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '1.1rem',
                flexWrap: 'wrap',
                gap: '0.85rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.15rem', color: 'var(--text-heading)' }}>{customerDetails.customer.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <PhoneIcon size={14} color="var(--primary)" /> {t.phoneNo}: <strong>{customerDetails.customer.phone}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.totalDue}</span>
                  <h2 style={{ fontSize: '1.8rem', color: customerDetails.totalDue > 0 ? 'var(--danger)' : 'var(--success)', margin: 0, fontWeight: 800 }}>
                    ₹{customerDetails.totalDue}
                  </h2>
                </div>
              </div>

              {/* Action Buttons for Selected Customer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  className="btn-success"
                  onClick={() => setShowPayModal(true)}
                  disabled={customerDetails.totalDue <= 0}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.88rem' }}
                >
                  <CreditCardIcon size={16} color="#ffffff" />
                  {t.payDue}
                </button>

                <button
                  className="btn-secondary"
                  onClick={handleSendWhatsAppReminder}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    background: '#ecfdf5', 
                    color: '#047857',
                    borderColor: '#a7f3d0',
                    padding: '0.6rem',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  <MessageCircleIcon size={16} color="#047857" />
                  {t.sendWhatsApp}
                </button>
              </div>

              {/* Due History Timeline */}
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.75rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <HistoryIcon size={18} color="var(--primary)" />
                {t.dueHistory}
              </h4>

              <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {customerDetails.history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '1rem 0', fontSize: '0.82rem', textAlign: 'center' }}>{t.noHistory}</p>
                ) : (
                  customerDetails.history.map((tx) => {
                    const isDue = tx.type === 'DUE';
                    return (
                      <div
                        key={tx._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.95rem',
                          background: 'var(--bg-surface-raised)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '0.5rem',
                          borderLeft: `4px solid ${isDue ? 'var(--danger)' : 'var(--success)'}`,
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                            {isDue ? <ArrowUpRightIcon size={16} color="var(--danger)" /> : <ArrowDownRightIcon size={16} color="var(--success)" />}
                            <span>{isDue ? t.creditAddedLabel : `${t.paymentReceivedLabel} (${tx.paymentMethod})`}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 1.25rem' }}>
                            {tx.note || t.noNotes || 'No notes'} • {new Date(tx.date).toLocaleString()}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: isDue ? 'var(--danger)' : 'var(--success)' }}>
                            {isDue ? '+' : '-'}₹{tx.amount}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(28, 25, 23, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#ffffff' }}>
            <h3 style={{ marginBottom: '1.4rem', fontSize: '1.3rem', color: 'var(--text-heading)' }}>{t.addNewCustomer}</h3>
            <form onSubmit={handleAddCustomer}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.customerName} *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Ramesh Patil / रमेश पाटील"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.6rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.phoneNo} *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t.cancelBtn}
                </button>
                <button type="submit" className="btn-primary">
                  {t.saveCustomerBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && customerDetails && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(28, 25, 23, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#ffffff' }}>
            <h3 style={{ marginBottom: '0.4rem', fontSize: '1.3rem', color: 'var(--text-heading)' }}>{t.recordPaymentTitle || t.payDue}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.4rem' }}>
              {t.customerLabel || 'Customer'}: <strong>{customerDetails.customer.name}</strong> ({t.currentDueLabel || 'Current Due'}: ₹{customerDetails.totalDue})
            </p>

            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.paymentAmountLabel} *
                </label>
                <input
                  type="number"
                  step="any"
                  max={customerDetails.totalDue}
                  className="input-field"
                  required
                  placeholder={`Max ₹${customerDetails.totalDue}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.paymentType} *
                </label>
                <select
                  className="input-field"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="CASH">{t.payCash}</option>
                  <option value="UPI">{t.payUpi}</option>
                  <option value="CARD">{t.payCard}</option>
                  <option value="OTHER">{t.payOther}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.6rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.noteLabel}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t.notePlaceholder || "e.g. Paid in full"}
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>
                  {t.cancelBtn}
                </button>
                <button type="submit" className="btn-success">
                  {t.confirmPaymentBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
