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

export default function BillHistory({ setActiveTab, t }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'PAID', 'UNPAID'
  
  // Selected Bill Modal for viewing receipt
  const [selectedBill, setSelectedBill] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async (query = searchQuery) => {
    try {
      setLoading(true);
      const res = await billAPI.getAll(statusFilter, query);
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
      alert('Failed to download PDF receipt');
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
      
      {/* Top Header & Back Button */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('home')}
              className="btn-secondary"
              style={{
                padding: '0.4rem 0.85rem',
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
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HistoryIcon size={24} color="var(--primary)" />
              {t.billHistoryTitle || 'Customer Bill History & Invoices'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
              {t.billHistorySubtitle || 'Search past POS receipts, view payment records & print/download invoices'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="no-print grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* Card 1: Total Bills */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t.totalBillsCount || 'Total Bills'}
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
              {t.totalCollection || 'Total Sales Revenue'}
            </span>
            <div style={{ background: 'var(--primary-light)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <BanknoteIcon size={18} color="var(--primary)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary)', fontWeight: 800 }}>
            ₹{totalRevenue}
          </h3>
        </div>

        {/* Card 3: Paid Revenue */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Paid Collection (Instant)
            </span>
            <div style={{ background: 'var(--success-bg)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <CheckIcon size={18} color="var(--success)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success)', fontWeight: 800 }}>
            ₹{totalPaidRevenue}
          </h3>
        </div>

        {/* Card 4: Katha Unpaid Revenue */}
        <div className="card-surface" style={{ padding: '1rem 1.15rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t.totalKathaDue || 'Total Unpaid Katha'}
            </span>
            <div style={{ background: 'var(--danger-bg)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
              <BookOpenIcon size={18} color="var(--danger)" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--danger)', fontWeight: 800 }}>
            ₹{totalKathaDue}
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
              placeholder={t.searchBillPlaceholder || 'Search by Customer Name, Phone, or Bill ID...'}
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.88rem' }}
            />
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FilterIcon size={14} color="var(--primary)" /> Status:
            </span>

            {[
              { id: '', label: t.allStatus || 'All Bills' },
              { id: 'PAID', label: t.paidStatus || 'Paid Bills' },
              { id: 'UNPAID', label: t.unpaidStatus || 'Katha (Unpaid)' }
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
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Loading bill transaction history...
          </div>
        ) : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <ReceiptIcon size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>No bill records found matching criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Bill ID</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Date & Time</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Customer Details</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Items Purchased</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const isPaid = bill.paymentStatus === 'PAID';
                  const firstItem = bill.items?.[0]?.name || 'Item';
                  const extraCount = (bill.items?.length || 0) - 1;
                  const itemPreview = extraCount > 0 
                    ? `${firstItem} (+${extraCount} more)` 
                    : firstItem;

                  return (
                    <tr key={bill._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      {/* Bill ID */}
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        #{bill.billId}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(bill.createdAt).toLocaleString()}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                          {bill.customerName}
                        </div>
                        {bill.customerPhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            📞 {bill.customerPhone}
                          </div>
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
                          {isPaid ? `PAID (${bill.paymentType || 'CASH'})` : 'KATHA (UNPAID)'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: 'var(--text-heading)' }}>
                        ₹{bill.totalAmount}
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
                          <span>{t.viewReceiptBtn || 'View Receipt'}</span>
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
                Bill Receipt #{selectedBill.billId}
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
                border: '1px solid #1c1917',
                padding: '1.25rem',
                borderRadius: '0',
                textAlign: 'left',
                marginBottom: '1.25rem',
                fontSize: '0.84rem',
                color: '#000000',
                fontFamily: 'monospace, "Courier New", sans-serif',
                boxShadow: 'var(--shadow-subtle)'
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
                  <div><strong>NAME :</strong> {selectedBill.customerName}</div>
                  <div><strong>PH :</strong> {selectedBill.customerPhone || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Bill No. :</strong> {selectedBill.billId}</div>
                  <div><strong>Date :</strong> {new Date(selectedBill.createdAt).toLocaleDateString('en-GB')}</div>
                  <div><strong>Time :</strong> {new Date(selectedBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.25rem 0', width: '8%' }}>S/N</th>
                    <th style={{ padding: '0.25rem 0' }}>Particulars</th>
                    <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '0.25rem 0', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>AMT</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '0.3rem 0' }}>{idx + 1}</td>
                      <td style={{ padding: '0.3rem 0', fontWeight: 700 }}>{item.name}</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>{Number(item.quantity).toFixed(3)}</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'center', textTransform: 'uppercase' }}>{item.unit}</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>{Number(item.sellingPrice).toFixed(2)}</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right', fontWeight: 800 }}>{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Items & Total Amount */}
              <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.45rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tot Items : {selectedBill.items.length}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  एकूण रक्कम : {Number(selectedBill.totalAmount).toFixed(2)}
                </span>
              </div>

              {/* Payment Details Section */}
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '0.45rem', marginBottom: '0.65rem', fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                  PAYMENT DETAILS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div>CASH REC. : {selectedBill.paymentType === 'CASH' && selectedBill.paymentStatus === 'PAID' ? Number(selectedBill.amountPaid).toFixed(2) : '0.00'}</div>
                    <div>PHONE PAY : {selectedBill.paymentType === 'UPI' && selectedBill.paymentStatus === 'PAID' ? Number(selectedBill.amountPaid).toFixed(2) : '0.00'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>RETURN AMT : 0.00</div>
                    <div>CREDIT : {selectedBill.paymentStatus === 'UNPAID' ? Number(selectedBill.totalAmount).toFixed(2) : '0.00'}</div>
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
                onClick={handleDownloadPDF}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                <DownloadIcon size={16} color="var(--primary)" />
                Download PDF
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowReceiptModal(false)}
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
