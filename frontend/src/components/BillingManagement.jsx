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
  DownloadIcon
} from '@animateicons/react/lucide';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { billAPI, stockAPI, ledgerAPI } from '../services/api';

export default function BillingManagement({ setActiveTab, t }) {
  // Navigation / Workflow Step State
  // Step 1: Select Products (Blinkit Grid & Search)
  // Step 2: Review Cart & Summary
  // Step 3: Payment & Customer Account (Paid vs Katha)
  // Step 4: Printed Receipt / Completion
  const [currentStep, setCurrentStep] = useState(1);

  // Stock Catalog & Filter State
  const [stockList, setStockList] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Cart Items State: [{ productId, name, unit, sellingPrice, quantity, subtotal, maxStock }]
  const [cartItems, setCartItems] = useState([]);

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

  // Receipt State
  const [createdBill, setCreatedBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [selectedCategory]);

  useEffect(() => {
    if (currentStep === 3 && paymentStatus === 'UNPAID') {
      fetchLedgerCustomers();
    }
  }, [currentStep, paymentStatus]);

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

  // Handlers for Blinkit Quantity Selector
  const getCartQuantity = (productId) => {
    const item = cartItems.find((c) => c.productId === productId);
    return item ? item.quantity : 0;
  };

  const updateCartQuantity = (product, newQty) => {
    const qty = parseFloat(newQty) || 0;
    
    if (qty <= 0) {
      setCartItems(cartItems.filter((c) => c.productId !== product._id));
      return;
    }

    if (qty > product.quantity) {
      alert(
        (t.cannotAddMoreExceeds || 'Cannot add more. Exceeds available stock ({qty} {unit})')
          .replace('{qty}', product.quantity)
          .replace('{unit}', product.unit)
      );
      return;
    }

    const existingIndex = cartItems.findIndex((c) => c.productId === product._id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity = qty;
      updated[existingIndex].subtotal = qty * product.sellingPrice;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product._id,
          name: product.name,
          unit: product.unit,
          sellingPrice: product.sellingPrice,
          quantity: qty,
          subtotal: qty * product.sellingPrice,
          maxStock: product.quantity,
        },
      ]);
    }
  };

  const handleIncrement = (product) => {
    const current = getCartQuantity(product._id);
    updateCartQuantity(product, current + 1);
  };

  const handleDecrement = (product) => {
    const current = getCartQuantity(product._id);
    updateCartQuantity(product, current - 1);
  };

  const handleWeightPreset = (product, weightVal) => {
    updateCartQuantity(product, weightVal);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const grandTotal = calculateTotal();

  // Add new customer on the fly in Katha step
  const handleAddNewCustomerInline = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert(t.namePhoneRequired || 'Name and Phone are required!');
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

  // Select existing customer from list
  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer._id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
  };

  // Submit Final Bill Generation
  const handleFinalSubmitBill = async () => {
    if (cartItems.length === 0) {
      alert(t.cartEmpty || 'No products added to cart!');
      return;
    }

    if (paymentStatus === 'UNPAID' && !customerName.trim()) {
      alert(t.requireNamePhoneForKatha || 'Please select or create a Katha customer account!');
      return;
    }

    const totalBillAmount = grandTotal;
    // Amount paid is strictly locked to total bill amount for Paid bills
    const paidAmount = paymentStatus === 'PAID' ? totalBillAmount : 0;

    const payload = {
      customerName: customerName.trim() || t.walkInCustomer || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      items: cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
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
      setCurrentStep(4);
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

  // Reset entire POS billing workflow for next customer
  const handleResetWorkflow = () => {
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId(null);
    setPaymentStatus('PAID');
    setPaymentType('CASH');
    setCreatedBill(null);
    setCurrentStep(1);
  };

  const filteredProducts = stockList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1rem', paddingBottom: '5rem' }}>
      
      {/* Top Header Bar & Back Button */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
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
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCartIcon size={22} color="var(--primary)" />
              {t.billingTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{t.billingSubtitle}</p>
          </div>
        </div>

        {/* Start New Order Button */}
        {cartItems.length > 0 && currentStep !== 4 && (
          <button
            onClick={handleResetWorkflow}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '20px' }}
          >
            <RefreshCwIcon size={14} />
            {t.newOrder || 'Reset Order'}
          </button>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="card-surface no-print" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          
          {/* Step 1 Pill */}
          <div 
            onClick={() => setCurrentStep(1)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              cursor: 'pointer',
              opacity: currentStep === 1 ? 1 : 0.7 
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 1 ? 'var(--primary)' : 'var(--border-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.82rem'
            }}>
              {currentStep > 1 ? <CheckIcon size={16} color="#ffffff" /> : '1'}
            </div>
            <span style={{ fontWeight: currentStep === 1 ? 800 : 600, fontSize: '0.85rem', color: currentStep === 1 ? 'var(--primary)' : 'var(--text-heading)' }}>
              {t.step1Title}
            </span>
          </div>

          <div style={{ height: '2px', flex: 1, background: currentStep >= 2 ? 'var(--primary)' : '#e2e8f0', margin: '0 0.75rem' }} />

          {/* Step 2 Pill */}
          <div 
            onClick={() => cartItems.length > 0 && setCurrentStep(2)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              cursor: cartItems.length > 0 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 2 ? 1 : (cartItems.length > 0 ? 0.7 : 0.4) 
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 2 ? 'var(--primary)' : 'var(--border-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.82rem'
            }}>
              {currentStep > 2 ? <CheckIcon size={16} color="#ffffff" /> : '2'}
            </div>
            <span style={{ fontWeight: currentStep === 2 ? 800 : 600, fontSize: '0.85rem', color: currentStep === 2 ? 'var(--primary)' : 'var(--text-heading)' }}>
              {t.step2Title}
            </span>
          </div>

          <div style={{ height: '2px', flex: 1, background: currentStep >= 3 ? 'var(--primary)' : '#e2e8f0', margin: '0 0.75rem' }} />

          {/* Step 3 Pill */}
          <div 
            onClick={() => cartItems.length > 0 && setCurrentStep(3)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              cursor: cartItems.length > 0 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 3 ? 1 : (cartItems.length > 0 ? 0.7 : 0.4)
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 3 ? 'var(--primary)' : 'var(--border-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.82rem'
            }}>
              {currentStep > 3 ? <CheckIcon size={16} color="#ffffff" /> : '3'}
            </div>
            <span style={{ fontWeight: currentStep === 3 ? 800 : 600, fontSize: '0.85rem', color: currentStep === 3 ? 'var(--primary)' : 'var(--text-heading)' }}>
              {t.step3Title}
            </span>
          </div>

          <div style={{ height: '2px', flex: 1, background: currentStep === 4 ? 'var(--primary)' : '#e2e8f0', margin: '0 0.75rem' }} />

          {/* Step 4 Pill */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            opacity: currentStep === 4 ? 1 : 0.4 
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep === 4 ? 'var(--success)' : 'var(--border-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.82rem'
            }}>
              4
            </div>
            <span style={{ fontWeight: currentStep === 4 ? 800 : 600, fontSize: '0.85rem', color: currentStep === 4 ? 'var(--success)' : 'var(--text-heading)' }}>
              {t.step4Title}
            </span>
          </div>

        </div>
      </div>

      {/* STEP 1: BLINKIT-STYLE PRODUCT CATALOG & SEARCH */}
      {currentStep === 1 && (
        <div className="no-print">
          {/* Search Bar & Category Filters Toolbar */}
          <div className="card-surface" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Product Search Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none' }}>
                  <SearchIcon size={20} color="var(--primary)" />
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t.searchProduct || 'Search product by name (e.g. Sugar, Oil, Rice)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.6rem', height: '44px', fontSize: '0.95rem' }}
                />
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto', paddingBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FilterIcon size={14} color="var(--primary)" /> Filter:
                </span>
                
                {[
                  { id: '', label: t.catAll },
                  { id: 'Grains & Pulses', label: t.catGrains },
                  { id: 'Oils & Ghee', label: t.catOils },
                  { id: 'Spices & Dryfruits', label: t.catSpices },
                  { id: 'Beverages & Snacks', label: t.catSnacks },
                  { id: 'Soaps & Cleaning', label: t.catCleaning },
                  { id: 'General Kirana', label: t.catGeneral }
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

          {/* Product Cards Grid (Blinkit Aesthetic) */}
          {loadingStock ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Loading products inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card-surface" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff' }}>
              <PackageIcon size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t.noStockFound || 'No stock items found.'}</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {filteredProducts.map((product) => {
                const cartQty = getCartQuantity(product._id);
                const isLowStock = product.quantity <= (product.minStockAlert || 5);
                const isOutOfStock = product.quantity <= 0;

                return (
                  <div
                    key={product._id}
                    className="card-surface"
                    style={{
                      padding: '1rem',
                      background: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      border: cartQty > 0 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      boxShadow: cartQty > 0 ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-card)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top Category Tag & Stock Status */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', marginBottom: '0.45rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          background: 'var(--bg-surface-raised)',
                          color: 'var(--text-muted)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '12px',
                          fontWeight: 700
                        }}>
                          {product.category || 'Kirana'}
                        </span>

                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: isOutOfStock ? 'var(--danger)' : (isLowStock ? '#d97706' : 'var(--success)')
                        }}>
                          {isOutOfStock ? 'Out of Stock' : `${product.quantity} ${product.unit}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 style={{
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        color: 'var(--text-heading)',
                        marginBottom: '0.35rem',
                        lineHeight: 1.25
                      }}>
                        {product.name}
                      </h4>

                      {/* Selling Price */}
                      <div style={{ marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{product.sellingPrice}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                          / {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Blinkit Quantity Controls */}
                    <div>
                      {/* Weight Preset Pills for kg/g items */}
                      {(product.unit === 'kg' || product.unit === 'g' || product.unit === 'liter') && (
                        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.45rem' }}>
                          {[0.25, 0.5, 1, 2].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleWeightPreset(product, preset)}
                              style={{
                                flex: 1,
                                padding: '0.15rem 0',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: cartQty === preset ? 'var(--primary-light)' : '#f8fafc',
                                color: cartQty === preset ? 'var(--primary)' : 'var(--text-body)',
                                cursor: 'pointer'
                              }}
                            >
                              {preset}{product.unit === 'g' ? 'g' : product.unit === 'liter' ? 'L' : 'kg'}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Single Clean ADD Button or Sleek Blinkit Counter Pill */}
                      {cartQty === 0 ? (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleIncrement(product)}
                          style={{
                            width: '100%',
                            padding: '0.45rem',
                            fontSize: '0.85rem',
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
                            opacity: isOutOfStock ? 0.5 : 1,
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
                          height: '36px'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleDecrement(product)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ffffff',
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Decrease Quantity"
                          >
                            <MinusIcon size={16} color="#ffffff" />
                          </button>

                          <div style={{
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: '#ffffff',
                            padding: '0 0.4rem',
                            userSelect: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            <span>{cartQty}</span>
                            <span style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 600 }}>{product.unit}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleIncrement(product)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ffffff',
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
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

          {/* Sticky Bottom Floating Cart Bar */}
          {cartItems.length > 0 && (
            <div style={{
              position: 'fixed',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2.5rem)',
              maxWidth: '1100px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px var(--primary-glow)',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#ffffff' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.45rem', borderRadius: '50%', display: 'flex' }}>
                  <ShoppingCartIcon size={22} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                    {t.itemsInCart.replace('{count}', cartItems.length)}
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                    Total: <strong style={{ fontSize: '1.05rem' }}>₹{grandTotal}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  background: '#ffffff',
                  color: 'var(--primary)',
                  border: 'none',
                  padding: '0.6rem 1.4rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <span>{t.proceedToPay || 'Proceed to Pay ➔'}</span>
                <ArrowRightIcon size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: REVIEW ORDER CART & TOTAL */}
      {currentStep === 2 && (
        <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="card-surface" style={{ padding: '1.5rem', background: '#ffffff', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(1)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                {t.backToSelectItems}
              </button>

              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-heading)' }}>
                {t.step2Title}
              </h3>
            </div>

            {/* Itemized Table */}
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>{t.itemCol}</th>
                    <th style={{ padding: '0.5rem' }}>{t.priceCol}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t.qtyCol}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>{t.subtotalCol}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t.actionCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.productId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.88rem' }}>
                        ₹{item.sellingPrice} / {item.unit}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{item.subtotal}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setCartItems(cartItems.filter((c) => c.productId !== item.productId))}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          title="Remove item"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Grand Summary Card */}
            <div style={{
              background: 'var(--bg-surface-raised)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Total Items: {cartItems.length}
                </span>
                <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-heading)', fontWeight: 800 }}>
                  {t.totalAmount}: ₹{grandTotal}
                </h3>
              </div>

              <SparklesIcon size={28} color="var(--primary)" />
            </div>

            {/* Select Payment Mode (Paid vs Katha) */}
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', color: 'var(--text-heading)', fontWeight: 800 }}>
              {t.selectPaymentOption}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              
              {/* Option A: Paid (Cash / Online) */}
              <div 
                onClick={() => setPaymentStatus('PAID')}
                style={{
                  border: paymentStatus === 'PAID' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: paymentStatus === 'PAID' ? '#f4f5ff' : '#ffffff',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  boxShadow: paymentStatus === 'PAID' ? '0 4px 12px var(--primary-glow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <BanknoteIcon size={22} color="var(--primary)" />
                  <strong style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>
                    {t.optionPaidTitle}
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t.optionPaidDesc}
                </p>
              </div>

              {/* Option B: Katha Ledger (Credit) */}
              <div 
                onClick={() => setPaymentStatus('UNPAID')}
                style={{
                  border: paymentStatus === 'UNPAID' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: paymentStatus === 'UNPAID' ? '#f4f5ff' : '#ffffff',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  boxShadow: paymentStatus === 'UNPAID' ? '0 4px 12px var(--primary-glow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <BookOpenIcon size={22} color="var(--primary)" />
                  <strong style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>
                    {t.optionKathaTitle}
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t.optionKathaDesc}
                </p>
              </div>

            </div>

            {/* Next Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCurrentStep(3)}
              style={{
                width: '100%',
                height: '46px',
                fontSize: '1rem',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span>Continue to {paymentStatus === 'PAID' ? 'Payment Method' : 'Katha Customer Link'} ➔</span>
            </button>

          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT METHOD (PAID) OR KATHA CUSTOMER LINK */}
      {currentStep === 3 && (
        <div className="no-print" style={{ maxWidth: '750px', margin: '0 auto' }}>
          
          <div className="card-surface" style={{ padding: '1.5rem', background: '#ffffff', marginBottom: '1.25rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(2)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                {t.backToOrderSummary}
              </button>

              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-heading)' }}>
                {t.step3Title}
              </h3>
            </div>

            {/* Total Bill Pill */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.4rem'
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>Total Invoice Amount</span>
                <h3 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>₹{grandTotal}</h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                  {paymentStatus === 'PAID' ? 'Instant Payment' : 'Katha Credit Account'}
                </span>
              </div>
            </div>

            {/* BRANCH A: IF PAID SELECTED */}
            {paymentStatus === 'PAID' && (
              <div>
                <h4 style={{ fontSize: '0.92rem', marginBottom: '0.65rem', color: 'var(--text-heading)', fontWeight: 800 }}>
                  {t.paymentType}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(130px, 1fr) )', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {[
                    { id: 'CASH', label: t.payCash },
                    { id: 'UPI', label: t.payUpi },
                    { id: 'CARD', label: t.payCard },
                    { id: 'OTHER', label: t.payOther }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentType(method.id)}
                      style={{
                        padding: '0.65rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: paymentType === method.id ? 'var(--primary)' : 'var(--border-color)',
                        background: paymentType === method.id ? 'var(--primary-light)' : '#ffffff',
                        color: paymentType === method.id ? 'var(--primary)' : 'var(--text-body)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {/* Locked Amount Paid Field (Strictly read-only) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    <span>{t.amountPaid}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 700 }}>
                      <LockIcon size={12} color="var(--primary)" /> Locked to Bill Total
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
                      <LockIcon size={16} color="var(--primary)" />
                    </div>
                    <input
                      type="number"
                      readOnly
                      disabled
                      className="input-field"
                      value={grandTotal}
                      style={{
                        paddingLeft: '2.5rem',
                        background: '#f1f5f9',
                        color: 'var(--text-heading)',
                        fontWeight: 800,
                        cursor: 'not-allowed',
                        borderColor: 'var(--border-color)'
                      }}
                    />
                  </div>
                </div>

                {/* Customer Name Optional Field */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.customerName} (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Walk-in Customer / नियमित ग्राहक"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* BRANCH B: IF KATHA LEDGER SELECTED */}
            {paymentStatus === 'UNPAID' && (
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.65rem', color: 'var(--text-heading)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpenIcon size={18} color="var(--primary)" />
                  {t.selectCustomerForKatha}
                </h4>

                {/* Customer Search Bar */}
                <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={t.selectExistingCustomer}
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        fetchLedgerCustomers(e.target.value);
                      }}
                      style={{ height: '40px', fontSize: '0.88rem' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddCustomerForm(!showAddCustomerForm)}
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
                  >
                    <PlusIcon size={16} /> {t.addNewCustomerQuick}
                  </button>
                </div>

                {/* Add New Customer Inline Form */}
                {showAddCustomerForm && (
                  <form onSubmit={handleAddNewCustomerInline} style={{ background: 'var(--bg-surface-raised)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px dashed var(--primary)' }}>
                    <h5 style={{ margin: '0 0 0.65rem 0', color: 'var(--primary)', fontSize: '0.88rem' }}>Create Customer Katha Account</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Customer Name *"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                      />
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Phone Number *"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setShowAddCustomerForm(false)} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }}>Save & Select</button>
                    </div>
                  </form>
                )}

                {/* Customer Selection Cards List */}
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {loadingCustomers ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading customer list...</div>
                  ) : ledgerCustomers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No customers found. Click "+ Create New Customer" above.</div>
                  ) : (
                    ledgerCustomers.map((cust) => {
                      const isSelected = selectedCustomerId === cust._id;
                      return (
                        <div
                          key={cust._id}
                          onClick={() => handleSelectCustomer(cust)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: isSelected ? 'var(--primary-light)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {isSelected ? (
                              <CheckIcon size={20} color="var(--primary)" />
                            ) : (
                              <UserIcon size={18} color="var(--text-muted)" />
                            )}
                            <div>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--text-heading)', display: 'block' }}>{cust.name}</strong>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>📞 {cust.phone}</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Current Due</span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: (cust.totalDue || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                              ₹{cust.totalDue || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Katha Notice Box */}
                {selectedCustomerId && (
                  <div style={{
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--primary-light)',
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ShieldCheckIcon size={18} color="var(--primary)" />
                    <span>
                      {t.kathaActiveNoticeDesc.replace('{amount}', grandTotal).replace('{customer}', customerName)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Final Submit Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmitBill}
              className="btn-primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '1rem',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <PrinterIcon size={18} color="#ffffff" />
              <span>{isSubmitting ? 'Generating Invoice...' : t.completeAndGenerateBill}</span>
            </button>

          </div>
        </div>
      )}

      {/* STEP 4: GENERATED INVOICE / PRINTABLE RECEIPT */}
      {currentStep === 4 && createdBill && (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          
          <div className="card-surface" style={{ padding: '2rem', background: '#ffffff', textAlign: 'center', position: 'relative' }}>
            
            <div className="no-print" style={{ display: 'inline-flex', background: 'var(--success-bg)', padding: '0.85rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckIcon size={36} color="var(--success)" />
            </div>

            <h3 className="no-print" style={{ fontSize: '1.4rem', color: 'var(--text-heading)', fontWeight: 800, marginBottom: '0.25rem' }}>
              Bill Generated Successfully!
            </h3>
            <p className="no-print" style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.5rem' }}>
              Invoice ID: <strong style={{ color: 'var(--primary)' }}>#{createdBill.billId}</strong>
            </p>

            {/* Printable Thermal/Paper Receipt Container */}
            <div 
              id="pos-bill-receipt-paper"
              className="printable-area"
              style={{
                background: '#ffffff',
                border: '1px solid #1c1917',
                padding: '1.25rem',
                borderRadius: '0',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: '0.84rem',
                color: '#000000',
                fontFamily: 'monospace, "Courier New", sans-serif',
                boxShadow: 'var(--shadow-card)',
                maxWidth: '480px',
                margin: '0 auto 1.5rem auto'
              }}
            >
              {/* Shop Header */}
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

              {/* Customer & Invoice Meta Header */}
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
                  {createdBill.items.map((item, idx) => (
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
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tot Items : {createdBill.items.length}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  एकूण रक्कम : {Number(createdBill.totalAmount).toFixed(2)}
                </span>
              </div>

              {/* Payment Details Section */}
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

              {/* Footer Notice */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.76rem', color: '#444' }}>
                धन्यवाद, पुन्हा या! • Thank You!
              </div>
            </div>

            {/* Action Buttons */}
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
      )}

    </div>
  );
}
