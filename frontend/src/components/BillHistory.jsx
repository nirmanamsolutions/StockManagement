import React, { useEffect, useState } from 'react';
import { 
  HistoryIcon, 
  SearchIcon, 
  FilterIcon, 
  PrinterIcon, 
  DownloadIcon, 
  EyeIcon, 
  ArrowLeftIcon, 
  CheckIcon, 
  XIcon, 
  BanknoteIcon, 
  BookOpenIcon, 
  UserIcon, 
  PhoneIcon, 
  CalendarIcon,
  ReceiptIcon,
  SparklesIcon
} from '@animateicons/react/lucide';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { billAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import CustomModal from './CustomModal';
import { formatQuantity, formatAmount, isIntegerUnit, sanitizeDecimalInput, sanitizeIntegerInput } from '../utils/formatters';

export default function BillHistory({ setActiveTab, t }) {
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'PAID', 'UNPAID'
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Selected Bill Modal for viewing receipt
  const [selectedBill, setSelectedBill] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Custom UI Dialog Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: '',
    cancelText: ''
  });

  const showAlert = (message, title = 'माहिती', type = 'info') => {
    setModalConfig({
      isOpen: true,
      type: type,
      title: title,
      message: message,
      onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      onCancel: null,
      confirmText: 'ठीक आहे',
      cancelText: ''
    });
  };

  useEffect(() => {
    fetchBills();
  }, [statusFilter, selectedDate]);

  const fetchBills = async (query = searchQuery, dateVal = selectedDate) => {
    try {
      setLoading(true);
      const res = await billAPI.getAll(statusFilter, query, dateVal);
      setBills(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch bill history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchBills(val);
  };

  const openReceiptModal = (bill) => {
    setSelectedBill(bill);
    setShowReceiptModal(true);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      const receiptElem = document.getElementById('history-bill-receipt-paper');
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
      pdf.save(`Invoice_${selectedBill?.billId || 'Receipt'}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF receipt:', err);
      showAlert('PDF पावती डाऊनलोड करताना अडचण आली.', 'त्रुटी', 'danger');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Metrics Calculations
  const totalBillsCount = bills.length;
  const totalRevenue = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaidRevenue = bills
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalKathaDue = bills
    .filter(b => b.paymentStatus === 'UNPAID')
    .reduce((sum, b) => sum + (b.amountDue || b.totalAmount || 0), 0);

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1rem', paddingBottom: '4rem' }}>
      
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

      {/* Page Header Bar */}
      <div className="no-print" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        marginBottom: '1.25rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, textAlign: 'center' }}>
          <HistoryIcon size={26} color="var(--primary)" />
          {t.billHistoryTitle || 'जुनी बिलं'}
        </h2>
      </div>

      {/* Summary KPI Cards */}
      <div className="no-print grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* Card 1: Total Bills */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t.totalBillsCount || 'एकूण बिलं'}
            </span>
            <div style={{ background: 'var(--primary-light)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <ReceiptIcon size={18} color="var(--primary)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-heading)', fontWeight: 800 }}>
            {totalBillsCount}
          </h3>
        </div>

        {/* Card 2: Total Sales Revenue */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t.totalCollection || 'एकूण विक्री'}
            </span>
            <div style={{ background: 'var(--primary-light)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <BanknoteIcon size={18} color="var(--primary)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary)', fontWeight: 800 }}>
            ₹{formatAmount(totalRevenue)}
          </h3>
        </div>

        {/* Card 3: Paid Revenue */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t.paidCollection || 'नगद / ऑनलाईन जमा'}
            </span>
            <div style={{ background: 'var(--success-bg)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <CheckIcon size={18} color="var(--success)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success)', fontWeight: 800 }}>
            ₹{formatAmount(totalPaidRevenue)}
          </h3>
        </div>

        {/* Card 4: Katha Unpaid Revenue */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t.totalKathaDue || 'एकूण उधारी'}
            </span>
            <div style={{ background: 'var(--danger-bg)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <BookOpenIcon size={18} color="var(--danger)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--danger)', fontWeight: 800 }}>
            ₹{formatAmount(totalKathaDue)}
          </h3>
        </div>

      </div>

      {/* Toolbar: Search & Status Filter Pills */}
      <div className="card-surface no-print" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <SearchIcon size={18} color="var(--primary)" />
            </div>
            <input
              type="text"
              className="input-field"
              placeholder={t.searchBillPlaceholder || 'ग्राहकाचे नाव, नंबर किंवा बिल नंबर शोधा...'}
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.88rem' }}
            />
          </div>

          {/* Single-Date Filter (Requirement 7) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CalendarIcon size={14} color="var(--primary)" /> तारीख:
            </span>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ height: '38px', padding: '0.35rem 0.6rem', fontSize: '0.82rem', fontWeight: 700 }}
            />
            {selectedDate && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDate('')}
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                title="सर्व तारखांचे बील दाखवा"
              >
                सर्व दाखवा
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FilterIcon size={14} color="var(--primary)" /> {t.statusLabel || 'स्थिती:'}
            </span>

            {[
              { id: '', label: t.allStatus || 'सर्व बिलं' },
              { id: 'PAID', label: t.paidStatus || 'जमा बिलं' },
              { id: 'UNPAID', label: t.unpaidStatus || 'उधारी बिलं' }
            ].map((f) => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                    background: isActive ? 'var(--primary)' : '#f8fafc',
                    color: isActive ? '#ffffff' : 'var(--text-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Bill History List Table */}
      <div className="card-surface no-print" style={{ padding: '1rem', background: '#ffffff' }}>
        {loading ? (
          <LoadingSpinner text="बिलांचा इतिहास लोड होत आहे..." />
        ) : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <ReceiptIcon size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>{t.noBillRecords || 'कोणताही बिलाचा रेकॉर्ड सापडला नाही.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>बिल नंबर</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>तारीख व वेळ</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>ग्राहकाची माहिती</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>खरेदी केलेले सामान</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>पेमेंट स्थिती</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>एकूण रक्कम</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>पावती</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const isPaid = bill.paymentStatus === 'PAID';
                  const firstItem = bill.items?.[0]?.name || 'सामान';
                  const extraCount = (bill.items?.length || 0) - 1;
                  const itemPreview = extraCount > 0 
                    ? `${firstItem} (+${extraCount} इतर)` 
                    : firstItem;

                  return (
                    <tr key={bill._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      {/* Bill ID */}
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        #{bill.billId}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(bill.createdAt).toLocaleString('mr-IN')}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                          {bill.customerName}
                        </div>
                        {bill.customerPhone && (
                          <a
                            href={`tel:${bill.customerPhone}`}
                            title={`कॉल करा: ${bill.customerPhone}`}
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              textDecoration: 'none',
                              marginTop: '0.15rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <PhoneIcon size={12} color="var(--primary)" />
                            <span>{bill.customerPhone}</span>
                          </a>
                        )}
                      </td>

                      {/* Items Preview */}
                      <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-body)' }}>
                        <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {itemPreview}
                        </span>
                      </td>

                      {/* Payment Status Badge */}
                      <td style={{ padding: '0.75rem' }}>
                        <span className={isPaid ? 'badge-paid' : 'badge-unpaid'}>
                          {isPaid ? `जमा (${bill.paymentType || 'रोख'})` : 'उधारी'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: 'var(--text-heading)' }}>
                        ₹{formatAmount(bill.totalAmount)}
                      </td>

                      {/* View / Print Action Button */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openReceiptModal(bill)}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <EyeIcon size={14} color="var(--primary)" />
                          <span>{t.viewReceiptBtn || 'पावती पहा'}</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW RECEIPT MODAL */}
      {showReceiptModal && selectedBill && (
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
                बिलाची पावती #{selectedBill.billId}
              </h3>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XIcon size={22} />
              </button>
            </div>

            {/* Printable Paper Container */}
            <div 
              id="history-bill-receipt-paper"
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
                  {t.receiptHeaderTitle || 'शिवरत्न किराणा & जनरल स्टोअर्स'}
                </h2>
                <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {t.receiptHeaderSubtitle || 'किराणा आणि जनरल स्टोअर्स खंडोबाचीवाडी'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#333' }}>
                  {t.receiptHeaderAddress || 'खंडोबाचीवाडी, MOB NO:- 9763950797'}
                </div>
              </div>

              {/* Customer & Invoice Meta Header */}
              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.45rem 0', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div>
                  <div><strong>नाव :</strong> {selectedBill.customerName}</div>
                  <div>
                    <strong>मोबाईल :</strong> {selectedBill.customerPhone ? (
                      <a href={`tel:${selectedBill.customerPhone}`} style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline' }}>
                        {selectedBill.customerPhone}
                      </a>
                    ) : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>बिल नंबर :</strong> {selectedBill.billId}</div>
                  <div><strong>दिनांक :</strong> {new Date(selectedBill.createdAt).toLocaleDateString('en-GB')}</div>
                  <div><strong>वेळ :</strong> {new Date(selectedBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.35rem 0.2rem', width: '7%' }}>अ.क्र.</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '38%', wordBreak: 'break-word' }}>विवरण</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '16%', textAlign: 'right', whiteSpace: 'nowrap' }}>प्रमाण</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '11%', textAlign: 'center', whiteSpace: 'nowrap' }}>युनिट</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '14%', textAlign: 'right', whiteSpace: 'nowrap' }}>दर</th>
                    <th style={{ padding: '0.35rem 0.2rem', width: '14%', textAlign: 'right', whiteSpace: 'nowrap' }}>रक्कम</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '0.4rem 0.2rem', verticalAlign: 'top' }}>{idx + 1}</td>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700, wordBreak: 'break-word' }}>{item.name}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatQuantity(item.quantity, item.unit)}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'center', textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{item.unit ? item.unit.toUpperCase() : 'नग'}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatAmount(item.sellingPrice)}</td>
                      <td style={{ padding: '0.4rem 0.2rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatAmount(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Items & Total Amount */}
              <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.45rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>एकूण वस्तू : {selectedBill.items.length}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  एकूण रक्कम : {formatAmount(selectedBill.totalAmount)}
                </span>
              </div>

              {/* Payment Details Section */}
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '0.45rem', marginBottom: '0.65rem', fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                  पेमेंट माहिती
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div>रोख जमा : {selectedBill.paymentType === 'CASH' && selectedBill.paymentStatus === 'PAID' ? formatAmount(selectedBill.amountPaid) : '0'}</div>
                    <div>फोनपे / युपीआय : {selectedBill.paymentType === 'UPI' && selectedBill.paymentStatus === 'PAID' ? formatAmount(selectedBill.amountPaid) : '0'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>परत रक्कम : 0</div>
                    <div>उधारी : {selectedBill.paymentStatus === 'UNPAID' ? formatAmount(selectedBill.totalAmount) : '0'}</div>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.76rem', color: '#444' }}>
                धन्यवाद, पुन्हा या!
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
                {t.printBtn || 'पावती प्रिंट करा'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                {isDownloadingPDF ? (
                  <>
                    <span className="btn-spinner" />
                    <span>डाऊनलोड होत आहे...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon size={16} color="var(--primary)" />
                    PDF डाऊनलोड
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowReceiptModal(false)}
                style={{ padding: '0.55rem 1.2rem', fontSize: '0.88rem' }}
              >
                {t.closeBtn || 'बंद करा'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom UI Dialog Modal */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />

    </div>
  );
}
