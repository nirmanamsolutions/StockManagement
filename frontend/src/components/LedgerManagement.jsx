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
  ArrowLeftIcon,
  EyeIcon,
  PrinterIcon,
  DownloadIcon,
  XIcon,
  CheckIcon,
  BookOpenIcon
} from '@animateicons/react/lucide';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ledgerAPI, billAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatQuantity, formatAmount, isIntegerUnit, sanitizeDecimalInput, sanitizeIntegerInput } from '../utils/formatters';

export default function LedgerManagement({ setActiveTab, t }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer for detail view
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Selected Transaction Bill Modal for viewing related invoice
  const [selectedTxBill, setSelectedTxBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

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

    if (!isValidPhone(newCustPhone)) {
      alert('कृपया १० अंकांचा योग्य मोबाईल नंबर टाका! (Please enter a valid 10-digit phone number)');
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
    const enteredAmt = Math.round((Number(payAmount) || 0) * 100) / 100;
    const maxDue = Math.round((Number(customerDetails?.totalDue) || 0) * 100) / 100;

    if (!payAmount || isNaN(enteredAmt) || enteredAmt <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (enteredAmt > maxDue) {
      alert(`जमा रक्कम बाकी उधारीपेक्षा जास्त असू शकत नाही! (Payment amount ₹${enteredAmt.toFixed(2)} cannot exceed total due balance of ₹${maxDue.toFixed(2)})`);
      return;
    }

    try {
      await ledgerAPI.recordPayment({
        customerId: selectedCustomerId,
        amount: enteredAmt,
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

  const handleViewBill = async (tx) => {
    if (!tx || tx.type !== 'DUE') return;
    try {
      if (tx.billId && typeof tx.billId === 'object' && tx.billId._id) {
        setSelectedTxBill(tx.billId);
        setShowBillModal(true);
      } else if (tx.billId) {
        const res = await billAPI.getById(tx.billId);
        setSelectedTxBill(res.data.data);
        setShowBillModal(true);
      } else {
        alert('या व्यवहाराची बिल माहिती उपलब्ध नाही (Bill details not linked)');
      }
    } catch (err) {
      console.error('Failed to load bill details:', err);
      alert('बिल लोड करण्यास अडचण आली (Failed to load bill)');
    }
  };

  const handleDownloadLedgerPDF = async () => {
    try {
      const receiptElem = document.getElementById('ledger-bill-receipt-paper');
      if (!receiptElem) return;

      const canvas = await html2canvas(receiptElem, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${selectedTxBill?.billId || 'Receipt'}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF receipt:', err);
      alert('Failed to download PDF receipt');
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1.25rem' }}>
      
      {/* Floating Fixed Circular Back Button */}
      {setActiveTab && (
        <button
          type="button"
          className="no-print"
          onClick={() => setActiveTab('home')}
          style={{
            position: 'fixed',
            top: '5.25rem',
            left: '1.25rem',
            zIndex: 9999,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: 'var(--primary, #4f46e5)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary, #4f46e5)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'var(--primary, #4f46e5)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(79, 70, 229, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = 'var(--primary, #4f46e5)';
            e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.14)';
          }}
          title={t.btnBack || 'मुख्यपृष्ठावर जा'}
        >
          <ArrowLeftIcon size={22} />
        </button>
      )}

      {/* Top Page Header Bar */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <BookOpenIcon size={24} color="var(--primary)" />
            {t.ledgerTitle || 'उधारी खाता (Katha Ledger)'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
            {t.ledgerSubtitle || 'ग्राहकांच्या उधारीचे व्यवस्थापन, जमा नोंद आणि व्हाट्सएप मेसेज'}
          </p>
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
            {loading ? (
              <LoadingSpinner text="उधारी खाते लोड होत आहेत..." />
            ) : customers.length === 0 ? (
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <PhoneIcon size={12} color="var(--primary)" /> {c.phone}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 800, 
                        color: c.totalDue > 0 ? 'var(--danger)' : 'var(--success)',
                        display: 'block'
                      }}>
                        ₹{Number(c.totalDue || 0).toFixed(2)}
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
            <LoadingSpinner text="व्यवहार इतिहास लोड होत आहे..." />
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
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <PhoneIcon size={14} color="var(--primary)" /> {t.phoneNo}: <strong>{customerDetails.customer.phone}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.totalDue}</span>
                  <h2 style={{ fontSize: '1.8rem', color: customerDetails.totalDue > 0 ? 'var(--danger)' : 'var(--success)', margin: 0, fontWeight: 800 }}>
                    ₹{Number(customerDetails.totalDue || 0).toFixed(2)}
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
                        onClick={() => isDue && handleViewBill(tx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.95rem',
                          background: isDue ? 'var(--danger-bg)' : 'var(--bg-surface-raised)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '0.5rem',
                          borderLeft: `4px solid ${isDue ? 'var(--danger)' : 'var(--success)'}`,
                          gap: '0.75rem',
                          cursor: isDue ? 'pointer' : 'default',
                          transition: 'all 0.15s ease'
                        }}
                        title={isDue ? 'ह्या व्यवहाराचे बील पहा (Click to view bill)' : ''}
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

                        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: isDue ? 'var(--danger)' : 'var(--success)' }}>
                            {isDue ? '+' : '-'}₹{Number(tx.amount || 0).toFixed(2)}
                          </span>
                          {isDue && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', background: '#ffffff', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--primary-light)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <EyeIcon size={12} color="var(--primary)" /> बील पहा
                            </span>
                          )}
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
                  maxLength={10}
                  placeholder="उदा. 9876543210 (10 Digits)"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(sanitizePhoneInput(e.target.value))}
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
                  step="0.01"
                  min="0.01"
                  max={customerDetails.totalDue}
                  className="input-field"
                  required
                  placeholder={`Max ₹${Number(customerDetails.totalDue || 0).toFixed(2)}`}
                  value={payAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = Number(val);
                    if (val !== '' && !isNaN(numVal) && numVal > customerDetails.totalDue) {
                      setPayAmount(String(Number(customerDetails.totalDue).toFixed(2)));
                    } else {
                      setPayAmount(val);
                    }
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  जास्तीत जास्त जमा रक्कम: <strong>₹{Number(customerDetails.totalDue || 0).toFixed(2)}</strong> (Max allowed: ₹{Number(customerDetails.totalDue || 0).toFixed(2)})
                </span>
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

      {/* VIEW CREDIT TRANSACTION BILL MODAL (Requirement 8) */}
      {showBillModal && selectedTxBill && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          
          <div className="card-surface" style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '560px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            
            {/* Modal Header Bar */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                उधारी बील पावती (Bill Receipt) #{selectedTxBill.billId}
              </h3>

              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XIcon size={22} />
              </button>
            </div>

            {/* Printable Paper Container */}
            <div 
              id="ledger-bill-receipt-paper"
              className="printable-area"
              style={{
                background: '#ffffff',
                border: '1.5px solid #000000',
                padding: '1.75rem 2.25rem',
                borderRadius: '0',
                textAlign: 'left',
                marginBottom: '1.25rem',
                fontSize: '0.84rem',
                color: '#000000',
                fontFamily: 'monospace, "Courier New", sans-serif',
                boxShadow: 'var(--shadow-subtle)',
                boxSizing: 'border-box'
              }}
            >
              {/* Shop Title */}
              <div style={{ textAlign: 'center', marginBottom: '0.65rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.15rem 0', fontFamily: 'Devanagari, "Plus Jakarta Sans", sans-serif' }}>
                  {t.shopOwnerTitle || 'शरद गौरीशंकर आंडगे'}
                </h2>
                <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {t.shopSubTitle || 'किराणा स्टोअर्स मोहोळ'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#333' }}>
                  प्लॉट नं. २१/२२, मार्केट यार्ड, मोहोळ, MOB NO:- 9921979797
                </div>
              </div>

              {/* Customer & Invoice Meta Header */}
              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.45rem 0', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div>
                  <div><strong>NAME :</strong> {selectedTxBill.customerName}</div>
                  <div><strong>PH :</strong> {selectedTxBill.customerPhone || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Bill No. :</strong> {selectedTxBill.billId}</div>
                  <div><strong>Date :</strong> {new Date(selectedTxBill.createdAt).toLocaleDateString('en-GB')}</div>
                  <div><strong>Time :</strong> {new Date(selectedTxBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.35rem 0.2rem', width: '7%' }}>S/N</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '38%', wordBreak: 'break-word' }}>Particulars</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '16%', textAlign: 'right', whiteSpace: 'nowrap' }}>Qty</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '11%', textAlign: 'center', whiteSpace: 'nowrap' }}>Unit</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '14%', textAlign: 'right', whiteSpace: 'nowrap' }}>Rate</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '14%', textAlign: 'right', whiteSpace: 'nowrap' }}>AMT</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedTxBill.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '0.4rem 0.2rem', verticalAlign: 'top' }}>{idx + 1}</td>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700, wordBreak: 'break-word' }}>{item.name}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatQuantity(item.quantity, item.unit)}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'center', textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{item.unit ? item.unit.toUpperCase() : 'UNIT'}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatAmount(item.sellingPrice)}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatAmount(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Items & Total Amount */}
              <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.45rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tot Items : {(selectedTxBill.items || []).length}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  एकूण रक्कम : {Number(selectedTxBill.totalAmount || 0).toFixed(2)}
                </span>
              </div>

              {/* Payment Details Section */}
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '0.45rem', marginBottom: '0.65rem', fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                  PAYMENT DETAILS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div>CASH REC. : {selectedTxBill.paymentType === 'CASH' && selectedTxBill.paymentStatus === 'PAID' ? Number(selectedTxBill.amountPaid).toFixed(2) : '0.00'}</div>
                    <div>PHONE PAY : {selectedTxBill.paymentType === 'UPI' && selectedTxBill.paymentStatus === 'PAID' ? Number(selectedTxBill.amountPaid).toFixed(2) : '0.00'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>RETURN AMT : 0.00</div>
                    <div>CREDIT : {selectedTxBill.paymentStatus === 'UNPAID' ? Number(selectedTxBill.totalAmount).toFixed(2) : '0.00'}</div>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.76rem', color: '#444' }}>
                धन्यवाद, पुन्हा या! • Thank You!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
              >
                <PrinterIcon size={16} />
                {t.printBtn || 'Print Receipt'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadLedgerPDF}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                <DownloadIcon size={16} color="var(--primary)" />
                Download PDF
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowBillModal(false)}
                style={{ padding: '0.55rem 1.2rem', fontSize: '0.88rem' }}
              >
                {t.closeBtn || 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
