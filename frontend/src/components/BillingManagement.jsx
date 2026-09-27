import React, { useEffect, useState } from 'react';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  UserIcon,
  PhoneIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  PrinterIcon,
  CheckIcon,
  ArrowLeftIcon,
  SearchIcon,
  FilterIcon,
  BookOpenIcon,
  BanknoteIcon,
  ArrowRightIcon,
  SparklesIcon,
  PackageIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  LockIcon,
  DownloadIcon,
  PencilIcon
} from '@animateicons/react/lucide';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { billAPI, stockAPI, ledgerAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatQuantity, formatAmount, isIntegerUnit, sanitizeDecimalInput, sanitizeIntegerInput, sanitizePhoneInput, isValidPhone } from '../utils/formatters';

// Unit normalization helper: converts 'pcs', 'pkt', 'packet', 'box', 'piece' into 'unit'
const normalizeUnit = (u) => {
  if (!u) return 'unit';
  const norm = String(u).trim().toLowerCase();
  if (norm === 'pcs' || norm === 'pkt' || norm === 'packet' || norm === 'box' || norm === 'piece' || norm === 'pieces') {
    return 'unit';
  }
  return norm;
};

// Logical unit choices available for converting right-side cart items
const getConvertibleUnits = (baseUnitStr) => {
  const base = normalizeUnit(baseUnitStr);
  if (base === 'kg' || base === 'g') {
    return [
      { id: 'kg', label: 'kg' },
      { id: 'g', label: 'g' },
    ];
  }
  if (base === 'liter' || base === 'ml') {
    return [
      { id: 'liter', label: 'liter' },
      { id: 'ml', label: 'ml' },
    ];
  }
  if (base === 'quintal') {
    return [
      { id: 'quintal', label: 'quintal' },
      { id: 'kg', label: 'kg' },
    ];
  }
  return [{ id: base, label: base }];
};

// Helper to clean bracketed English words from titles (e.g. "सुहाना गरम मसाला (Suhana Garam Masala)" -> "सुहाना गरम मसाला")
const cleanDisplayName = (str) => {
  if (!str) return '';
  return String(str).replace(/\s*\([A-Za-z0-9\s₹\/-]+\)/g, '').trim();
};

export default function BillingManagement({ setActiveTab, t }) {
  // Stock Catalog & Filter State
  const [stockList, setStockList] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Cart Items State: [{ productId, name, unit, sellingPrice, costPrice, quantity, subtotal, baseUnit }]
  const [cartItems, setCartItems] = useState([]);
  const [mobilePosTab, setMobilePosTab] = useState('catalog'); // 'catalog' or 'cart'

  // Payment Mode State
  const [paymentStatus, setPaymentStatus] = useState('PAID'); // 'PAID' or 'UNPAID' (Katha)
  const [paymentType, setPaymentType] = useState('CASH'); // 'CASH', 'UPI', 'CARD', 'OTHER'

  // Customer / Katha Selection State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [ledgerCustomers, setLedgerCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Quick Edit Stock Modal State in Billing
  const [quickStockItem, setQuickStockItem] = useState(null);
  const [quickStockQty, setQuickStockQty] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Receipt & Submission State
  const [createdBill, setCreatedBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [selectedCategory]);

  useEffect(() => {
    if (paymentStatus === 'UNPAID') {
      fetchLedgerCustomers();
    }
  }, [paymentStatus]);

  const fetchStock = async (query = searchQuery) => {
    try {
      setLoadingStock(true);
      const res = await stockAPI.getAll(query, selectedCategory);
      setStockList(res.data.data || []);
    } catch (err) {
      console.error('Failed to load stock list:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchLedgerCustomers = async (query = customerSearchQuery) => {
    try {
      setLoadingCustomers(true);
      const res = await ledgerAPI.getCustomers(query);
      setLedgerCustomers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch Katha customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleOpenQuickStockEdit = (product) => {
    setQuickStockItem(product);
    setQuickStockQty(product.quantity);
  };

  const handleSaveQuickStock = async (e) => {
    e.preventDefault();
    if (!quickStockItem) return;
    const qtyNum = parseFloat(quickStockQty);
    if (isNaN(qtyNum) || qtyNum < 0) {
      alert('कृपया वैध साठा (Valid Stock Qty) प्रविष्ट करा');
      return;
    }

    try {
      setIsUpdatingStock(true);
      await stockAPI.update(quickStockItem._id, {
        ...quickStockItem,
        quantity: Math.round(qtyNum * 100) / 100,
      });
      setQuickStockItem(null);
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.message || 'साठा अपडेट करताना एरर आली.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Logical Unit conversion subtotal math (Enforces max 2 decimal places)
  const calculateItemSubtotal = (qtyVal, priceVal, selectedUnitVal, baseUnitVal) => {
    const qty = parseFloat(qtyVal) || 0;
    const price = parseFloat(priceVal) || 0;
    if (qty <= 0 || price <= 0) return 0;

    const base = normalizeUnit(baseUnitVal);
    const sel = normalizeUnit(selectedUnitVal);

    let rawSubtotal = qty * price;
    if (base === 'kg' && sel === 'g') {
      rawSubtotal = (qty * price) / 1000;
    } else if (base === 'g' && sel === 'kg') {
      rawSubtotal = qty * price * 1000;
    } else if (base === 'liter' && sel === 'ml') {
      rawSubtotal = (qty * price) / 1000;
    } else if (base === 'ml' && sel === 'liter') {
      rawSubtotal = qty * price * 1000;
    } else if (base === 'quintal' && sel === 'kg') {
      rawSubtotal = (qty * price) / 100;
    }

    return Math.round(rawSubtotal * 100) / 100;
  };

  // Handlers for Blinkit Catalog Card Counter
  const getCartItem = (productId) => {
    return cartItems.find((c) => c.productId === productId);
  };

  const getCartQuantity = (productId) => {
    const item = getCartItem(productId);
    return item ? item.quantity : 0;
  };

  const updateCartProduct = (product, newQty) => {
    const qty = parseFloat(newQty) || 0;
    const baseUnit = normalizeUnit(product.unit);

    if (qty <= 0) {
      setCartItems(cartItems.filter((c) => c.productId !== product._id));
      return;
    }

    const displayName = cleanDisplayName(product.name);
    const existingIndex = cartItems.findIndex((c) => c.productId === product._id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      const curItem = updated[existingIndex];
      const subtotal = calculateItemSubtotal(qty, curItem.sellingPrice, curItem.unit, baseUnit);
      updated[existingIndex] = {
        ...curItem,
        name: displayName,
        quantity: qty,
        subtotal: subtotal,
      };
      setCartItems(updated);
    } else {
      const subtotal = calculateItemSubtotal(qty, product.sellingPrice, baseUnit, baseUnit);
      setCartItems([
        ...cartItems,
        {
          productId: product._id,
          name: displayName,
          unit: baseUnit,
          baseUnit: baseUnit,
          costPrice: product.costPrice || 0,
          sellingPrice: product.sellingPrice || 0,
          quantity: qty,
          subtotal: subtotal,
        },
      ]);
    }
  };

  const handleIncrement = (product) => {
    const current = getCartQuantity(product._id);
    updateCartProduct(product, current + 1);
  };

  const handleDecrement = (product) => {
    const current = getCartQuantity(product._id);
    updateCartProduct(product, current - 1);
  };

  const handleWeightPreset = (product, weightVal) => {
    updateCartProduct(product, weightVal);
  };

  // In-cart inline editing for Selling Price, Quantity, and Unit Dropdown
  const handleUpdateCartItemField = (productId, field, value) => {
    const updated = cartItems.map((item) => {
      if (item.productId !== productId) return item;

      let newSellingPrice = item.sellingPrice;
      let newQuantity = item.quantity;
      let newUnit = item.unit;

      if (field === 'sellingPrice') newSellingPrice = parseFloat(sanitizeDecimalInput(value)) || 0;
      if (field === 'quantity') {
        const isInt = isIntegerUnit(item.unit);
        const clean = isInt ? sanitizeIntegerInput(value) : sanitizeDecimalInput(value);
        newQuantity = parseFloat(clean) || 0;
      }
      if (field === 'unit') newUnit = value;

      const subtotal = calculateItemSubtotal(newQuantity, newSellingPrice, newUnit, item.baseUnit);

      return {
        ...item,
        sellingPrice: newSellingPrice,
        quantity: newQuantity,
        unit: newUnit,
        subtotal: subtotal,
      };
    });

    setCartItems(updated);
  };

  const handleRemoveItem = (productId) => {
    setCartItems(cartItems.filter((c) => c.productId !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const grandTotal = calculateTotal();

  // Add new customer inline for Katha
  const handleAddNewCustomerInline = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert(t.namePhoneRequired || 'Name and Phone are required!');
      return;
    }

    if (!isValidPhone(newCustPhone)) {
      alert('कृपया १० अंकांचा योग्य मोबाईल नंबर टाका! (Please enter a valid 10-digit phone number)');
      return;
    }

    try {
      const res = await ledgerAPI.addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
      });
      const addedCust = res.data.data;
      setLedgerCustomers([addedCust, ...ledgerCustomers]);
      setSelectedCustomerId(addedCust._id);
      setCustomerName(addedCust.name);
      setCustomerPhone(addedCust.phone);
      setShowAddCustomerForm(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add new customer account');
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer._id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
  };

  // Submit Final Bill Generation
  const handleFinalSubmitBill = async () => {
    if (cartItems.length === 0) {
      alert(t.cartEmpty || 'बिलांमध्ये कोणताही माल जोडलेला नाही!');
      return;
    }

    // Default customer name & phone for PAID bills if not entered by shopkeeper
    const nameToUse = customerName.trim() || (paymentStatus === 'PAID' ? 'नियमित ग्राहक' : '');
    const phoneToUse = customerPhone.trim() || (paymentStatus === 'PAID' ? '9999999999' : '');

    if (paymentStatus === 'UNPAID' && (!nameToUse || !isValidPhone(phoneToUse))) {
      alert('उधारी बिलासाठी ग्राहकाचे नाव आणि १० अंकांचा मोबाईल नंबर आवश्यक आहे! (Customer Name & 10-digit Phone required for Katha bill)');
      return;
    }

    if (phoneToUse && phoneToUse !== '9999999999' && !isValidPhone(phoneToUse)) {
      alert('कृपया १० अंकांचा योग्य मोबाईल नंबर टाका! (Please enter a valid 10-digit mobile number)');
      return;
    }

    const totalBillAmount = grandTotal;
    const paidAmount = paymentStatus === 'PAID' ? totalBillAmount : 0;

    const payload = {
      customerName: nameToUse,
      customerPhone: phoneToUse,
      items: cartItems.map((item) => ({
        productId: item.productId,
        name: cleanDisplayName(item.name),
        unit: item.unit,
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      totalAmount: totalBillAmount,
      amountPaid: paidAmount,
      paymentStatus: paymentStatus,
      paymentType: paymentType,
    };

    try {
      setIsSubmitting(true);
      const res = await billAPI.create(payload);
      setCreatedBill(res.data.data);
      fetchStock(); // Refresh available inventory
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF Receipt
  const handleDownloadPDFReceipt = async () => {
    try {
      const receiptElem = document.getElementById('pos-bill-receipt-paper');
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
      pdf.save(`Invoice_${createdBill?.billId || 'Receipt'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF receipt:', err);
      alert('Failed to download PDF receipt. Please try again.');
    }
  };

  const handleResetWorkflow = () => {
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId(null);
    setPaymentStatus('PAID');
    setPaymentType('CASH');
    setCreatedBill(null);
  };

  const filteredProducts = stockList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 0.75rem', paddingBottom: '5.5rem' }}>

      {/* Floating Fixed Circular Back Button (Desktop only, hidden on mobile to prevent blocking content) */}
      {setActiveTab && (
        <button
          type="button"
          className="no-print hide-mobile"
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
          <ShoppingCartIcon size={26} color="var(--primary)" />
          {t.billingTitle || 'बिल '}
        </h2>

        {cartItems.length > 0 && !createdBill && (
          <button
            onClick={handleResetWorkflow}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', borderRadius: '20px' }}
          >
            <RefreshCwIcon size={14} />
            {t.newOrder || 'नवीन बिल (Reset)'}
          </button>
        )}
      </div>

      {/* RENDER PRINTABLE INVOICE RECEIPT IF BILL CREATED */}
      {createdBill ? (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="card-surface" style={{ padding: '2rem', background: '#ffffff', textAlign: 'center', position: 'relative' }}>
            <div className="no-print" style={{ display: 'inline-flex', background: 'var(--success-bg)', padding: '0.85rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckIcon size={36} color="var(--success)" />
            </div>

            <h3 className="no-print" style={{ fontSize: '1.4rem', color: 'var(--text-heading)', fontWeight: 800, marginBottom: '0.25rem' }}>
              बिल यशस्वीरित्या सेव्ह झाले!
            </h3>
            <p className="no-print" style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.5rem' }}>
              बिल नंबर: <strong style={{ color: 'var(--primary)' }}>#{createdBill.billId}</strong>
            </p>

            {/* Printable Thermal Receipt Container */}
            <div
              id="pos-bill-receipt-paper"
              className="printable-area"
              style={{
                background: '#ffffff',
                border: '1.5px solid #000000',
                padding: '1.75rem 2.25rem',
                borderRadius: '0',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: '0.84rem',
                color: '#000000',
                fontFamily: 'monospace, "Courier New", sans-serif',
                boxShadow: 'var(--shadow-card)',
                maxWidth: '540px',
                margin: '0 auto 1.5rem auto',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '0.65rem' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.15rem 0', fontFamily: 'Devanagari, "Plus Jakarta Sans", sans-serif' }}>
                  {t.shopOwnerTitle || 'शरद गौरीशंकर आंडगे'}
                </h2>
                <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {t.shopSubTitle || 'किराणा स्टोअर्स मोहोळ'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#333' }}>
                  प्लॉट नं. २१/२२, मार्केट यार्ड, मोहोळ, MOB NO:- 9921979797
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.45rem 0', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div>
                  <div><strong>NAME :</strong> {createdBill.customerName}</div>
                  <div><strong>PH :</strong> {createdBill.customerPhone || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Bill No. :</strong> {createdBill.billId}</div>
                  <div><strong>Date :</strong> {new Date(createdBill.createdAt).toLocaleDateString('en-GB')}</div>
                  <div><strong>Time :</strong> {new Date(createdBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </div>

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
                  {createdBill.items.map((item, idx) => (
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

              <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.45rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tot Items : {createdBill.items.length}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  एकूण रक्कम : {Number(createdBill.totalAmount).toFixed(2)}
                </span>
              </div>

              <div style={{ borderBottom: '1px solid #000', paddingBottom: '0.45rem', marginBottom: '0.65rem', fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                  PAYMENT DETAILS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div>CASH REC. : {createdBill.paymentType === 'CASH' && createdBill.paymentStatus === 'PAID' ? Number(createdBill.amountPaid).toFixed(2) : '0.00'}</div>
                    <div>PHONE PAY : {createdBill.paymentType === 'UPI' && createdBill.paymentStatus === 'PAID' ? Number(createdBill.amountPaid).toFixed(2) : '0.00'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>RETURN AMT : 0.00</div>
                    <div>CREDIT : {createdBill.paymentStatus === 'UNPAID' ? Number(createdBill.totalAmount).toFixed(2) : '0.00'}</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.76rem', color: '#444' }}>
                धन्यवाद, पुन्हा या! • Thank You!
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
              >
                <PrinterIcon size={18} />
                {t.printBtn || 'Print Receipt'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadPDFReceipt}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                <DownloadIcon size={18} color="var(--primary)" />
                Download PDF
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab && setActiveTab('home')}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{t.homeBtn || 'मुख्यपृष्ठ (Home)'}</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleResetWorkflow}
                style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem' }}
              >
                <PlusIcon size={18} />
                {t.newOrder || 'Start New Order'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SPACIOUS 2-COLUMN LAYOUT: BLINKIT-STYLE PRODUCT CATALOG GRID (LEFT) + RIGHT SIDE LIVE CART LIST & CHECKOUT PANEL (RIGHT) */
        <div style={{ width: '100%' }}>
          {/* Mobile Switcher Bar for Catalog vs Cart */}
          <div className="mobile-pos-tabs no-print" style={{ display: 'none', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setMobilePosTab('catalog')}
              className={mobilePosTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
            >
              <PackageIcon size={16} /> 1. माल निवडा
            </button>
            <button
              type="button"
              onClick={() => setMobilePosTab('cart')}
              className={mobilePosTab === 'cart' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
            >
              <ShoppingCartIcon size={16} /> 2. बिलातील यादी {cartItems.length > 0 && `(${cartItems.length})`}
            </button>
          </div>

          <div className="no-print billing-pos-grid">
            {/* LEFT SIDE: PRODUCT CATALOG SEARCH & BLINKIT-STYLE PRODUCT CARDS GRID */}
            <div className={`pos-catalog-column ${mobilePosTab === 'cart' ? 'hide-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Search Bar & Category Filters Toolbar */}
            <div className="card-surface" style={{ padding: '1rem 1.25rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                {/* Product Search Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none' }}>
                    <SearchIcon size={20} color="var(--primary)" />
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={t.searchProduct || 'मालाचे नाव शोधा (उदा. साखर, तेल, तांदूळ)...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.6rem', height: '44px', fontSize: '0.95rem' }}
                  />
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FilterIcon size={14} color="var(--primary)" /> प्रकार:
                  </span>

                  {[
                    { id: '', label: t.catAll || 'सर्व प्रकार' },
                    { id: 'Grains & Pulses', label: t.catGrains || 'धान्य व डाळी' },
                    { id: 'Oils & Ghee', label: t.catOils || 'तेल आणि तूप' },
                    { id: 'Spices & Dryfruits', label: t.catSpices || 'मसाले व ड्रायफ्रूट्स' },
                    { id: 'Beverages & Snacks', label: t.catSnacks || 'चहा, पेये व बिस्किटे' },
                    { id: 'Soaps & Cleaning', label: t.catCleaning || 'साबण व स्वच्छता' },
                    { id: 'General Kirana', label: t.catGeneral || 'जनरल किराणा' }
                  ].map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          border: '1px solid',
                          borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                          background: isActive ? 'var(--primary)' : '#f8fafc',
                          color: isActive ? '#ffffff' : 'var(--text-body)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Product Cards Grid */}
            {loadingStock ? (
              <LoadingSpinner text="मालाचे कॅटलॉग लोड होत आहे..." />
            ) : filteredProducts.length === 0 ? (
              <div className="card-surface" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff' }}>
                <PackageIcon size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t.noStockFound || 'कोणताही माल सापडला नाही.'}</p>
              </div>
            ) : (
              <div
                className="pos-products-grid"
                style={{
                  maxHeight: 'calc(100vh - 240px)',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}
              >
                {filteredProducts.map((product) => {
                  const cartQty = getCartQuantity(product._id);
                  const isLowStock = product.quantity <= (product.minStockAlert || 5);
                  const isOutOfStock = product.quantity <= 0;
                  const displayName = cleanDisplayName(product.name);

                  return (
                    <div
                      key={product._id}
                      className="card-surface"
                      style={{
                        padding: '0.85rem 0.75rem',
                        background: '#ffffff',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        border: cartQty > 0 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        boxShadow: cartQty > 0 ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-card)',
                        transition: 'all 0.15s ease',
                        minWidth: 0
                      }}
                    >
                      {/* Top Category Tag & Stock Status */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            background: 'var(--bg-surface-raised)',
                            color: 'var(--text-muted)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '12px',
                            fontWeight: 700
                          }}>
                            {product.category || 'Kirana'}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: isOutOfStock ? 'var(--danger)' : (isLowStock ? '#d97706' : 'var(--success)')
                            }}>
                              {isOutOfStock ? 'साठा ०' : `साठा: ${formatQuantity(product.quantity, product.unit)} ${normalizeUnit(product.unit)}`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuickStockEdit(product);
                              }}
                              style={{
                                border: 'none',
                                background: '#e0e7ff',
                                color: '#4338ca',
                                padding: '0.12rem 0.35rem',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.15rem',
                                transition: 'all 0.15s ease'
                              }}
                              title="दुकानातील साठा (Stock) बदला"
                            >
                              <PencilIcon size={10} />
                              बदला
                            </button>
                          </div>
                        </div>

                        {/* Product Name */}
                        <h4 style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: 'var(--text-heading)',
                          marginBottom: '0.35rem',
                          lineHeight: 1.25,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {displayName}
                        </h4>

                        {/* Selling & Purchase Price */}
                        <div style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
                          <div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                              ₹{Number(product.sellingPrice || 0).toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.15rem' }}>
                              /{normalizeUnit(product.unit)}
                            </span>
                          </div>

                          {/* Purchase Price Label */}
                          <div style={{ fontSize: '0.68rem', color: '#92400e', background: '#fef3c7', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                            खरेदी: ₹{Number(product.costPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div>
                        {/* Weight Preset Pills for kg/g/liter items */}
                        {(normalizeUnit(product.unit) === 'kg' || normalizeUnit(product.unit) === 'g' || normalizeUnit(product.unit) === 'liter') && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.2rem', marginBottom: '0.45rem' }}>
                            {[0.25, 0.5, 1, 2].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleWeightPreset(product, preset)}
                                style={{
                                  width: '100%',
                                  padding: '0.2rem 0',
                                  fontSize: '0.66rem',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  background: cartQty === preset ? 'var(--primary-light)' : '#f8fafc',
                                  color: cartQty === preset ? 'var(--primary)' : 'var(--text-body)',
                                  cursor: 'pointer',
                                  textAlign: 'center'
                                }}
                              >
                                {preset}{product.unit === 'g' ? 'g' : product.unit === 'liter' ? 'L' : 'kg'}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* ADD Button or Blinkit Counter Pill */}
                        {cartQty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleIncrement(product)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1.5px solid var(--primary)',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <PlusIcon size={16} color="var(--primary)" /> ADD
                          </button>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px 4px',
                            boxShadow: '0 3px 10px var(--primary-glow)',
                            height: '38px'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleDecrement(product)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center'
                              }}
                              title="Decrease Quantity"
                            >
                              <MinusIcon size={16} color="#ffffff" />
                            </button>

                            <div style={{
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: '#ffffff',
                              padding: '0 0.4rem',
                              userSelect: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}>
                              <span>{formatQuantity(cartQty, product.unit)}</span>
                              <span style={{ fontSize: '0.76rem', opacity: 0.85, fontWeight: 600 }}>{product.unit}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleIncrement(product)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center'
                              }}
                              title="Increase Quantity"
                            >
                              <PlusIcon size={16} color="#ffffff" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* RIGHT SIDE: SPACIOUS STICKY LIVE CART LIST & CHECKOUT PANEL */}
          <div className={`pos-cart-column ${mobilePosTab === 'catalog' ? 'hide-mobile' : ''}`} style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div className="card-surface" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>

              {/* Cart Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-heading)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCartIcon size={22} color="var(--primary)" />
                  बिलातील वस्तूंची यादी (Selected List)
                </h3>
                <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800 }}>
                  {cartItems.length} वस्तू
                </span>
              </div>

              {/* Selected Items List Container */}
              <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '4px' }}>
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <ShoppingCartIcon size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{t.cartEmpty || 'बिलामध्ये कोणताही माल जोडलेला नाही.'}</p>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>डाव्या बाजूच्या कॅटलॉगवरून वस्तू निवडा</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cartItems.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        {/* Row 1: Item Name, Purchase Price & Trash Button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>
                              खरेदी भाव: ₹{item.costPrice || 0}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                            title="काढून टाका"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>

                        {/* Row 2: Editable Controls (Selling Price, Quantity, Unit, Subtotal) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1.2fr', gap: '0.45rem', alignItems: 'center' }}>

                          {/* Selling Price */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>
                              विक्री दर (₹)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => handleUpdateCartItemField(item.productId, 'sellingPrice', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.3rem 0.4rem',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: 'var(--primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: '#ffffff'
                              }}
                            />
                          </div>

                          {/* Quantity */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>
                              प्रमाण
                            </label>
                            <input
                              type="number"
                              step={isIntegerUnit(item.unit) ? "1" : "0.01"}
                              min={isIntegerUnit(item.unit) ? "1" : "0.01"}
                              value={item.quantity}
                              onChange={(e) => handleUpdateCartItemField(item.productId, 'quantity', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.3rem 0.4rem',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                textAlign: 'center',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: '#ffffff'
                              }}
                            />
                          </div>

                          {/* Unit Dropdown - LOGICAL CONVERSIONS ONLY (kg <-> g, liter <-> ml, unit) */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>
                              युनिट
                            </label>
                            <select
                              value={normalizeUnit(item.unit)}
                              onChange={(e) => handleUpdateCartItemField(item.productId, 'unit', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.3rem 0.2rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: '#ffffff'
                              }}
                            >
                              {getConvertibleUnits(item.baseUnit).map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Subtotal */}
                          <div style={{ textAlign: 'right' }}>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>
                              एकूण रक्कम
                            </label>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                              ₹{item.subtotal.toFixed(2)}
                            </span>
                          </div>

                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Grand Summary Banner */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: '#ffffff',
                padding: '0.95rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 14px var(--primary-glow)'
              }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#ffffff', opacity: 1, fontWeight: 700 }}>
                    एकूण बिल रक्कम (Total Amount)
                  </span>
                  <h3 style={{ fontSize: '1.65rem', margin: 0, fontWeight: 800, color: '#ffffff' }}>
                    ₹{grandTotal.toFixed(2)}
                  </h3>
                </div>
                <SparklesIcon size={26} color="#ffffff" />
              </div>

              {/* Payment Mode Selection (Paid vs Katha) */}
              <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '0.45rem', color: 'var(--text-heading)', fontWeight: 800 }}>
                {t.selectPaymentOption || 'पेमेंट प्रकार निवडा (Payment Mode)'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div
                  onClick={() => setPaymentStatus('PAID')}
                  style={{
                    border: paymentStatus === 'PAID' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: paymentStatus === 'PAID' ? '#f4f5ff' : '#ffffff',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <BanknoteIcon size={20} color="var(--primary)" style={{ marginBottom: '0.2rem' }} />
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-heading)', display: 'block' }}>
                    {t.paid || 'रोख / ऑनलाईन'}
                  </strong>
                </div>

                <div
                  onClick={() => setPaymentStatus('UNPAID')}
                  style={{
                    border: paymentStatus === 'UNPAID' ? '2px solid var(--danger)' : '1px solid var(--border-color)',
                    background: paymentStatus === 'UNPAID' ? '#fff5f5' : '#ffffff',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <BookOpenIcon size={20} color="var(--danger)" style={{ marginBottom: '0.2rem' }} />
                  <strong style={{ fontSize: '0.85rem', color: 'var(--danger)', display: 'block' }}>
                    {t.unpaid || 'उधारी खाता (Katha)'}
                  </strong>
                </div>
              </div>

              {/* PAYMENT DETAILS / KATHA CUSTOMER SELECTOR */}
              {paymentStatus === 'PAID' ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    पेमेंट पद्धत (Payment Method)
                  </label>
                  <select
                    className="input-field"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    style={{ fontSize: '0.85rem', height: '38px', marginBottom: '0.65rem' }}
                  >
                    <option value="CASH">{t.payCash || 'रोख (Cash)'}</option>
                    <option value="UPI">{t.payUpi || 'GPay / PhonePe (UPI)'}</option>
                    <option value="CARD">{t.payCard || 'कार्ड (Card)'}</option>
                    <option value="OTHER">{t.payOther || 'इतर (Other)'}</option>
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        ग्राहकाचे नाव (Name) *
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="उदा. राहुल पाटील *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ fontSize: '0.82rem', height: '38px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        मोबाईल नंबर (Phone) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        className="input-field"
                        placeholder="१० अंकांचा मोबाईल नंबर *"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(sanitizePhoneInput(e.target.value))}
                        style={{ fontSize: '0.82rem', height: '38px' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    उधारीसाठी ग्राहक निवडा (Select Customer) *
                  </label>

                  <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.55rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="नाव / नंबर शोधा..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        fetchLedgerCustomers(e.target.value);
                      }}
                      style={{ fontSize: '0.82rem', height: '36px', flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowAddCustomerForm(!showAddCustomerForm)}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    >
                      <PlusIcon size={14} /> नवीन
                    </button>
                  </div>

                  {showAddCustomerForm && (
                    <form onSubmit={handleAddNewCustomerInline} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.65rem', border: '1px dashed var(--primary)' }}>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="ग्राहकाचे नाव *"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '34px', marginBottom: '0.4rem' }}
                      />
                      <input
                        type="text"
                        required
                        maxLength={10}
                        className="input-field"
                        placeholder="१० अंकांचा फोन नंबर *"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(sanitizePhoneInput(e.target.value))}
                        style={{ fontSize: '0.8rem', height: '34px', marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowAddCustomerForm(false)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>रद्द</button>
                        <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>सेव्ह करा</button>
                      </div>
                    </form>
                  )}

                  <select
                    className="input-field"
                    value={selectedCustomerId || ''}
                    onChange={(e) => {
                      const cust = ledgerCustomers.find((c) => c._id === e.target.value);
                      if (cust) handleSelectCustomer(cust);
                    }}
                    style={{ fontSize: '0.85rem', height: '38px', fontWeight: 700, marginBottom: '0.55rem' }}
                  >
                    <option value="">-- उधारी ग्राहक निवडा --</option>
                    {ledgerCustomers.map((cust) => (
                      <option key={cust._id} value={cust._id}>
                        {cust.name} ({cust.phone}) - उधारी: ₹{cust.totalDue}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        ग्राहकाचे नाव *
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="ग्राहकाचे नाव *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ fontSize: '0.82rem', height: '36px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        मोबाईल नंबर *
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        className="input-field"
                        placeholder="१० अंकांचा मोबाईल नंबर *"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(sanitizePhoneInput(e.target.value))}
                        style={{ fontSize: '0.82rem', height: '36px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GENERATE BILL BUTTON */}
              <button
                type="button"
                disabled={isSubmitting || cartItems.length === 0}
                onClick={handleFinalSubmitBill}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  opacity: (isSubmitting || cartItems.length === 0) ? 0.6 : 1,
                  cursor: (isSubmitting || cartItems.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                <PrinterIcon size={20} color="#ffffff" />
                <span>{isSubmitting ? 'बिल सेव्ह होत आहे...' : (t.printBill || 'बिल बनवा आणि प्रिंट करा')}</span>
              </button>

            </div>

          </div>

          {/* Sticky Mobile Floating Cart Bar */}
          {mobilePosTab === 'catalog' && cartItems.length > 0 && (
            <div
              className="mobile-pos-tabs no-print"
              onClick={() => setMobilePosTab('cart')}
              style={{
                display: 'none',
                position: 'fixed',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                zIndex: 9999,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: '#ffffff',
                padding: '0.85rem 1.2rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(67, 56, 202, 0.4)',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <ShoppingCartIcon size={20} color="#ffffff" />
                <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  {cartItems.length} वस्तू जोडल्या • ₹{grandTotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.85rem' }}>
                <span>बिल पहा</span>
                <ArrowRightIcon size={16} color="#ffffff" />
              </div>
            </div>
          )}

          </div>
        </div>
      )}

      {/* Quick Edit Stock Modal in Billing */}
      {quickStockItem && (
        <div className="no-print" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="card-surface" style={{
            background: '#ffffff',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              साठा बदला (Update Stock)
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>{quickStockItem.name}</strong> चा नवीन उपलब्ध साठा प्रविष्ट करा:
            </p>

            <form onSubmit={handleSaveQuickStock}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  नवीन उपलब्ध साठा ({normalizeUnit(quickStockItem.unit)}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={quickStockQty}
                  onChange={(e) => setQuickStockQty(e.target.value)}
                  autoFocus
                  required
                  style={{ fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setQuickStockItem(null)}
                  disabled={isUpdatingStock}
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdatingStock}
                >
                  {isUpdatingStock ? 'सेव्ह होत आहे...' : 'साठा सेव्ह करा (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
