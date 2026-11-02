import React, { useEffect, useState, useRef } from 'react';
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
  PencilIcon,
  XIcon
} from '@animateicons/react/lucide';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { billAPI, stockAPI, ledgerAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import CustomModal from './CustomModal';
import CustomSelect from './CustomSelect';
import BluetoothPrinterModal from './BluetoothPrinterModal';
import bluetoothPrinter from '../services/bluetoothPrinter';
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

const getMarathiUnitLabel = (unitStr) => {
  const norm = normalizeUnit(unitStr);
  const map = {
    kg: 'किलोग्राम',
    g: 'ग्राम',
    liter: 'लिटर',
    ml: 'मिलीलिटर',
    quintal: 'क्विंटल',
    unit: 'नग',
    meter: 'मीटर',
  };
  return map[norm] || norm;
};

// Logical unit choices available for converting items
const getConvertibleUnits = (baseUnitStr) => {
  const base = normalizeUnit(baseUnitStr);
  if (base === 'kg' || base === 'g') {
    return [
      { id: 'kg', label: 'किलोग्राम' },
      { id: 'g', label: 'ग्राम' },
    ];
  }
  if (base === 'liter' || base === 'ml') {
    return [
      { id: 'liter', label: 'लिटर' },
      { id: 'ml', label: 'मिलीलिटर' },
    ];
  }
  if (base === 'quintal') {
    return [
      { id: 'quintal', label: 'क्विंटल' },
      { id: 'kg', label: 'किलोग्राम' },
    ];
  }
  const labelMap = { unit: 'नग', meter: 'मीटर', kg: 'किलोग्राम', g: 'ग्राम', liter: 'लिटर', ml: 'मिलीलिटर', quintal: 'क्विंटल' };
  return [{ id: base, label: labelMap[base] || base }];
};

// Helper to clean bracketed English words from titles
const cleanDisplayName = (str) => {
  if (!str) return '';
  return String(str).replace(/\s*\([A-Za-z0-9\s₹\/-]+\)/g, '').trim();
};

export default function BillingManagement({ setActiveTab, t }) {
  // Stock Catalog & Filter State
  const [stockList, setStockList] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for smooth scroll-to-top and auto-refocus
  const searchInputRef = useRef(null);
  const pageTopRef = useRef(null);
  const catalogTopRef = useRef(null);
  const cartHeaderRef = useRef(null);
  const mobileCartTabRef = useRef(null);

  // Search bar & subtle catalog transition states
  const [cartBump, setCartBump] = useState(false);
  const [isFadeOut, setIsFadeOut] = useState(false);
  const [lastAddedProductId, setLastAddedProductId] = useState(null);
  const [cardDrafts, setCardDrafts] = useState({}); // { [productId]: { quantity: '1', unit: 'kg' } }

  const getCardDraft = (product) => {
    if (cardDrafts[product._id]) {
      return cardDrafts[product._id];
    }
    return {
      quantity: '1',
      unit: normalizeUnit(product.unit),
    };
  };

  const handleDraftChange = (product, field, value) => {
    const baseUnit = normalizeUnit(product.unit);
    setCardDrafts((prev) => {
      const cur = prev[product._id] || { quantity: '1', unit: baseUnit };
      let newQty = cur.quantity;
      let newUnit = cur.unit;

      if (field === 'quantity') {
        const isInt = isIntegerUnit(cur.unit);
        newQty = isInt ? sanitizeIntegerInput(value) : sanitizeDecimalInput(value);
      } else if (field === 'unit') {
        newUnit = value;
      }

      return {
        ...prev,
        [product._id]: {
          quantity: newQty,
          unit: newUnit,
        },
      };
    });
  };

  // Apple-style subtle cart feedback (whisper-quiet, no loud bounce)
  const triggerCartFeedback = () => {
    setCartBump(true);
    setTimeout(() => {
      setCartBump(false);
    }, 180);
  };

  // Scroll strictly to the VERY TOP of the page (completely visible top header, back button, title)
  const scrollToCompletePageTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Simple, subtle & smooth Apple-style Fade Out & Fade In transition
  const performSmoothFadeTransition = (callback) => {
    // Phase 1: Smooth subtle fade out (noticeable, calm, non-problematic)
    setIsFadeOut(true);

    // Smooth scroll completely to the top of the page so the entire header is visible
    scrollToCompletePageTop();

    // Phase 2: At peak of subtle fade (180ms), update data
    setTimeout(() => {
      if (typeof callback === 'function') {
        callback();
      }

      // Re-anchor strictly to the top of the page
      scrollToCompletePageTop();

      // Refocus search bar WITHOUT allowing the browser to auto-scroll down to it
      searchInputRef.current?.focus({ preventScroll: true });

      // Phase 3: Smooth fade in back to full clarity
      setTimeout(() => {
        setIsFadeOut(false);
      }, 40);
    }, 180);
  };

  // Revert back to top of the page on top of list ONLY when stock is added via search bar
  const scrollToTopAndNormalize = (isViaSearchBar = false) => {
    if (isViaSearchBar) {
      // ONLY when added via search bar in billing: smoothly scroll to top of page on the top of list
      performSmoothFadeTransition(() => {
        setSearchQuery('');
      });
    }
    // When NOT via search bar (browsing regular list): do NOT scroll to top, maintain exact user scroll position
  };

  const handleManualClearSearch = () => {
    performSmoothFadeTransition(() => {
      setSearchQuery('');
    });
  };

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

  // "माल जोडा" (Add Stock) Modal State in Billing
  const [showMaalJodhaModal, setShowMaalJodhaModal] = useState(false);
  const [isSubmittingMaalJodha, setIsSubmittingMaalJodha] = useState(false);
  const [maalJodhaFormData, setMaalJodhaFormData] = useState({
    name: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    unit: 'kg',
    minStockAlert: 5,
  });

  // Custom UI Dialog Modal State (Replaces built-in browser alerts)
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

  // Receipt & Submission State
  const [createdBill, setCreatedBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingInlineCustomer, setIsSubmittingInlineCustomer] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showBtPrinterModal, setShowBtPrinterModal] = useState(false);
  const [paperWidth, setPaperWidth] = useState(localStorage.getItem('nirman_bt_printer_paper') || '80mm');

  const handlePaperChange = (width) => {
    setPaperWidth(width);
    bluetoothPrinter.setPaperWidth(width);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (paymentStatus === 'UNPAID') {
      fetchLedgerCustomers();
    }
  }, [paymentStatus]);

  const fetchStock = async (query = searchQuery) => {
    try {
      setLoadingStock(true);
      const res = await stockAPI.getAll(query);
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
      showAlert('कृपया योग्य साठा प्रविष्ट करा', 'सावधानी', 'warning');
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
      showAlert(err.response?.data?.message || 'साठा अपडेट करताना एरर आली.', 'त्रुटी', 'danger');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Logical Unit conversion subtotal math (Rounds up fractional decimal amounts: e.g. 32.1 to 32.9 -> 33)
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

    const rounded2Dec = Math.round(rawSubtotal * 100) / 100;
    return Math.ceil(rounded2Dec);
  };

  const getCartItem = (productId) => {
    return cartItems.find((c) => c.productId === productId);
  };

  // DIRECT CATALOG CARD EDITING HANDLER (Selling Rate, Quantity, Unit editable right on the stock list card)
  const handleCatalogCardFieldChange = (product, field, value) => {
    const baseUnit = normalizeUnit(product.unit);
    const displayName = cleanDisplayName(product.name);
    const existingIndex = cartItems.findIndex((c) => c.productId === product._id);

    let curItem = existingIndex > -1 ? cartItems[existingIndex] : {
      productId: product._id,
      name: displayName,
      unit: baseUnit,
      baseUnit: baseUnit,
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      quantity: 0,
      subtotal: 0,
    };

    let newPrice = curItem.sellingPrice;
    let newQty = curItem.quantity;
    let newUnit = curItem.unit;

    if (field === 'quantity') {
      const isInt = isIntegerUnit(curItem.unit);
      const clean = isInt ? sanitizeIntegerInput(value) : sanitizeDecimalInput(value);
      newQty = parseFloat(clean) || 0;
    }
    if (field === 'unit') {
      newUnit = value;
    }

    if (newQty <= 0) {
      setCartItems(cartItems.filter((c) => c.productId !== product._id));
      return;
    }

    const newSubtotal = calculateItemSubtotal(newQty, newPrice, newUnit, baseUnit);

    const updatedItem = {
      ...curItem,
      sellingPrice: newPrice,
      quantity: newQty,
      unit: newUnit,
      subtotal: newSubtotal,
    };

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex] = updatedItem;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, updatedItem]);
    }
  };

  const handleCartItemSellingPriceChange = (productId, rawValue) => {
    const cleanVal = sanitizeDecimalInput(rawValue);
    const newPrice = cleanVal === '' ? '' : parseFloat(cleanVal);

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const priceNum = typeof newPrice === 'number' && !isNaN(newPrice) ? newPrice : 0;
          const newSubtotal = calculateItemSubtotal(item.quantity, priceNum, item.unit, item.baseUnit);
          return {
            ...item,
            sellingPrice: newPrice,
            subtotal: newSubtotal,
          };
        }
        return item;
      })
    );
  };

  const handleAddProductToCart = (product, event) => {
    const draft = getCardDraft(product);
    const isInt = isIntegerUnit(draft.unit);
    const cleanQty = isInt ? sanitizeIntegerInput(draft.quantity) : sanitizeDecimalInput(draft.quantity);
    const qtyNum = parseFloat(cleanQty) || 1;
    if (qtyNum <= 0) {
      showAlert('कृपया योग्य प्रमाण (quantity) टाका!', 'सावधानी', 'warning');
      return;
    }

    const baseUnit = normalizeUnit(product.unit);
    const selUnit = normalizeUnit(draft.unit) || baseUnit;
    const subtotal = calculateItemSubtotal(qtyNum, product.sellingPrice, selUnit, baseUnit);
    const displayName = cleanDisplayName(product.name);

    // Apple-style quiet cart feedback
    triggerCartFeedback();

    const existingIndex = cartItems.findIndex((c) => c.productId === product._id);
    if (existingIndex > -1) {
      const existing = cartItems[existingIndex];
      const newQty = existing.quantity + qtyNum;
      const newSubtotal = calculateItemSubtotal(newQty, existing.sellingPrice, selUnit, baseUnit);
      const updated = [...cartItems];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        unit: selUnit,
        subtotal: newSubtotal,
      };
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product._id,
          name: displayName,
          unit: selUnit,
          baseUnit: baseUnit,
          costPrice: product.costPrice || 0,
          sellingPrice: product.sellingPrice || 0,
          quantity: qtyNum,
          subtotal: subtotal,
        },
      ]);
    }

    // Clean draft for this product
    setCardDrafts((prev) => {
      const updated = { ...prev };
      delete updated[product._id];
      return updated;
    });

    // Subtle Apple-style highlight for newly added item
    setLastAddedProductId(product._id);
    setTimeout(() => {
      setLastAddedProductId((curr) => (curr === product._id ? null : curr));
    }, 1200);

    // Revert back to top of the page smoothly and normalize search/catalog
    const hasSearch = searchQuery.trim() !== '';
    scrollToTopAndNormalize(hasSearch);
  };

  const handleIncrement = (product, event) => {
    const item = getCartItem(product._id);
    if (!item) {
      handleAddProductToCart(product, event);
      return;
    }
    const curQty = item.quantity;
    handleCatalogCardFieldChange(product, 'quantity', curQty + 1);

    triggerCartFeedback();

    setLastAddedProductId(product._id);
    setTimeout(() => {
      setLastAddedProductId((curr) => (curr === product._id ? null : curr));
    }, 1200);

    const hasSearch = searchQuery.trim() !== '';
    scrollToTopAndNormalize(hasSearch);
  };

  const handleDecrement = (product) => {
    const item = getCartItem(product._id);
    const curQty = item ? item.quantity : 0;
    handleCatalogCardFieldChange(product, 'quantity', curQty - 1);
  };

  const handleRemoveItem = (productId) => {
    setCartItems(cartItems.filter((c) => c.productId !== productId));
  };

  const calculateTotal = () => {
    return Math.ceil(cartItems.reduce((sum, item) => sum + item.subtotal, 0));
  };

  const grandTotal = calculateTotal();

  // Add new customer inline for Katha
  const handleAddNewCustomerInline = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showAlert(t.namePhoneRequired || 'ग्राहकाचे नाव आणि फोन नंबर आवश्यक आहे!', 'सावधानी', 'warning');
      return;
    }

    if (!isValidPhone(newCustPhone)) {
      showAlert('कृपया १० अंकांचा योग्य मोबाईल नंबर टाका! (Please enter a valid 10-digit phone number)', 'सावधानी', 'warning');
      return;
    }

    try {
      setIsSubmittingInlineCustomer(true);
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
      showAlert(err.response?.data?.message || 'नवीन उधारी ग्राहक खाते जोडताना अडचण आली', 'त्रुटी', 'danger');
    } finally {
      setIsSubmittingInlineCustomer(false);
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
      showAlert('बिलामध्ये कोणताही माल जोडलेला नाही! कृपया प्रथम माल निवडा.', 'सावधानी', 'warning');
      return;
    }

    let nameToUse = customerName.trim();
    let phoneToUse = customerPhone.trim();

    if (paymentStatus === 'PAID') {
      // For Paid bills: Name defaults to 'रोख ग्राहक' if empty, Phone is optional
      if (!nameToUse) {
        nameToUse = 'रोख ग्राहक';
      }
      if (phoneToUse && !isValidPhone(phoneToUse)) {
        showAlert('कृपया १० अंकांचा योग्य मोबाईल नंबर टाका किंवा रकाना रिकामा ठेवा.', 'सावधानी', 'warning');
        return;
      }
    } else {
      // For Katha (Unpaid) bills: Customer name and valid 10-digit phone are strictly required
      if (!nameToUse) {
        showAlert('उधारी बिलासाठी ग्राहकाचे नाव प्रविष्ट करणे आवश्यक आहे!', 'सावधानी', 'warning');
        return;
      }
      if (!phoneToUse || !isValidPhone(phoneToUse)) {
        showAlert('उधारी बिलासाठी ग्राहकाचा १० अंकांचा योग्य मोबाईल नंबर आवश्यक आहे!', 'सावधानी', 'warning');
        return;
      }
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
      fetchStock();
    } catch (err) {
      showAlert(err.response?.data?.message || 'बिल सेव्ह करताना त्रुटी आली', 'त्रुटी', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF Receipt matching exact paper roll size
  const handleDownloadPDFReceipt = async () => {
    try {
      setIsDownloadingPDF(true);
      const receiptElem = document.getElementById('pos-bill-receipt-paper');
      if (!receiptElem) return;

      const canvas = await html2canvas(receiptElem, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const widthMm = paperWidth === '100mm' ? 100 : paperWidth === '58mm' ? 58 : 80;
      // Active thermal head printable zone: 80mm roll = 72mm active, 100mm roll = 96mm active, 58mm roll = 48mm active
      const printableWidthMm = paperWidth === '100mm' ? 96 : paperWidth === '58mm' ? 48 : 72;
      const horizontalMarginMm = (widthMm - printableWidthMm) / 2;
      const heightMm = Math.round((canvas.height * printableWidthMm) / canvas.width);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [widthMm, Math.max(heightMm + 4, 30)],
      });

      pdf.addImage(imgData, 'PNG', horizontalMarginMm, 2, printableWidthMm, heightMm, undefined, 'FAST');
      pdf.save(`Invoice_${createdBill?.billId || 'Receipt'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF receipt:', err);
      showAlert('PDF पावती डाऊनलोड करताना अडचण आली. कृपया पुन्हा प्रयत्न करा.', 'त्रुटी', 'danger');
    } finally {
      setIsDownloadingPDF(false);
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
    setSearchQuery('');
    setCardDrafts({});
    setLastAddedProductId(null);
  };

  // "माल जोडा" (Add Stock Directly from Billing) Handlers
  const handleOpenMaalJodha = () => {
    setMaalJodhaFormData({
      name: searchQuery.trim() || '',
      costPrice: '',
      sellingPrice: '',
      quantity: '',
      unit: 'kg',
      minStockAlert: 5,
    });
    setShowMaalJodhaModal(true);
  };

  const handleMaalJodhaSubmit = async (e) => {
    e.preventDefault();
    if (!maalJodhaFormData.name || !maalJodhaFormData.name.trim()) {
      showAlert('कृपया सामानाचे नाव टाका!', 'सावधानी', 'warning');
      return;
    }
    const costPriceNum = parseFloat(maalJodhaFormData.costPrice);
    if (isNaN(costPriceNum) || costPriceNum < 0) {
      showAlert('कृपया योग्य खरेदी भाव टाका!', 'सावधानी', 'warning');
      return;
    }
    const sellingPriceNum = parseFloat(maalJodhaFormData.sellingPrice);
    if (isNaN(sellingPriceNum) || sellingPriceNum < 0) {
      showAlert('कृपया योग्य विक्री भाव टाका!', 'सावधानी', 'warning');
      return;
    }

    const payload = {
      name: maalJodhaFormData.name.trim(),
      costPrice: Math.round(costPriceNum * 100) / 100,
      sellingPrice: Math.round(sellingPriceNum * 100) / 100,
      quantity: Math.round((Number(maalJodhaFormData.quantity) || 0) * 100) / 100,
      unit: maalJodhaFormData.unit || 'kg',
      minStockAlert: Math.round((Number(maalJodhaFormData.minStockAlert) || 5) * 100) / 100,
    };

    try {
      setIsSubmittingMaalJodha(true);
      await stockAPI.create(payload);
      setShowMaalJodhaModal(false);
      // Immediately reload stock catalog in billing
      await fetchStock();
      showAlert('नवीन माल साठ्यामध्ये यशस्वीरित्या जोडला गेला!', 'यशस्वी', 'success');
      // Set search query to the newly added product name so it's instantly visible at the top of the billing list
      setSearchQuery(payload.name);
      scrollToTopAndNormalize(false);
    } catch (err) {
      console.error('Error adding stock from billing:', err);
      showAlert(err.response?.data?.message || 'साठा सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.', 'त्रुटी', 'danger');
    } finally {
      setIsSubmittingMaalJodha(false);
    }
  };

  const filteredProducts = (Array.isArray(stockList) ? stockList : [])
    .filter((item) => {
      if (!item) return false;
      const name = String(item.name || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase();
      return name.includes(query);
    })
    .sort((a, b) => (a?.name || '').localeCompare(b?.name || '', 'mr', { numeric: true, sensitivity: 'base' }));



  return (
    <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '0 1.25rem', paddingBottom: '6.5rem', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {/* Top of Page Anchor Target (Allows complete top-of-page visibility) */}
      <div ref={pageTopRef} id="pos-page-top" style={{ position: 'relative', top: 0, height: 0, width: 0 }} />

      {/* Apple-Style Minimalist Unified Header Bar (NOT sticky, clean standard flow) */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.95rem 0 1.15rem 0',
        marginBottom: '0.85rem',
        borderBottom: '1px solid var(--border-color)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Left: Back Navigation + Clean Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              title={t.btnBack || 'मुख्यपृष्ठावर जा'}
            >
              <ArrowLeftIcon size={18} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingCartIcon size={18} color="var(--primary)" />
            </div>
            <h2 style={{
              fontSize: '1.3rem',
              margin: 0,
              color: 'var(--text-heading)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>
              {t.billingTitle || 'बिलिंग काउंटर'}
            </h2>
          </div>
        </div>

        {/* Right: Reset Action + "माल जोडा" Button (Cleanly placed on right side, NOT sticky) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {cartItems.length > 0 && !createdBill && (
            <button
              type="button"
              onClick={handleResetWorkflow}
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-body)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCwIcon size={14} />
              <span>{t.newOrder || 'नवीन बिल'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenMaalJodha}
            style={{
              padding: '0.52rem 1.15rem',
              borderRadius: '9999px',
              backgroundColor: '#18181b',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              fontSize: '0.86rem',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27272a';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#18181b';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="साठ्यामध्ये नवीन माल जोडा (Add Stock)"
          >
            <PlusIcon size={15} strokeWidth={2.5} color="#ffffff" />
            <span>{t.btnAddStock || 'माल जोडा'}</span>
          </button>
        </div>
      </div>

      {/* RENDER PRINTABLE INVOICE RECEIPT IF BILL CREATED */}
      {createdBill ? (
        <div style={{ maxWidth: paperWidth === '100mm' ? '700px' : paperWidth === '58mm' ? '460px' : '650px', margin: '0 auto' }}>
          <div className="card-surface" style={{ padding: '2rem', background: '#ffffff', textAlign: 'center', position: 'relative' }}>
            <div className="no-print" style={{ display: 'inline-flex', background: 'var(--success-bg)', padding: '0.85rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckIcon size={36} color="var(--success)" />
            </div>

            <h3 className="no-print" style={{ fontSize: '1.4rem', color: 'var(--text-heading)', fontWeight: 800, marginBottom: '0.25rem' }}>
              बिल यशस्वीरित्या सेव्ह झाले!
            </h3>
            <p className="no-print" style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
              बिल नंबर: <strong style={{ color: 'var(--primary)' }}>#{createdBill.billId}</strong>
            </p>

            {/* Paper Roll Size Switcher Bar (No Print) */}
            <div className="no-print" style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📦 प्रिंटर रोल साईझ निवडा (Select Paper Width):</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                  सध्याची साईझ: {paperWidth === '100mm' ? '100mm (4-इंच)' : paperWidth === '58mm' ? '58mm (2-इंच)' : '80mm (3-इंच)'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => handlePaperChange('80mm')}
                  style={{
                    padding: '0.45rem 0.3rem',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: paperWidth === '80mm' ? '#16a34a' : '#cbd5e1',
                    background: paperWidth === '80mm' ? '#f0fdf4' : '#ffffff',
                    color: paperWidth === '80mm' ? '#15803d' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  80mm (3-इंच) ⭐
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperChange('100mm')}
                  style={{
                    padding: '0.45rem 0.3rem',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: paperWidth === '100mm' ? '#16a34a' : '#cbd5e1',
                    background: paperWidth === '100mm' ? '#f0fdf4' : '#ffffff',
                    color: paperWidth === '100mm' ? '#15803d' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  100mm (4-इंच)
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperChange('58mm')}
                  style={{
                    padding: '0.45rem 0.3rem',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: paperWidth === '58mm' ? '#16a34a' : '#cbd5e1',
                    background: paperWidth === '58mm' ? '#f0fdf4' : '#ffffff',
                    color: paperWidth === '58mm' ? '#15803d' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  58mm (2-इंच)
                </button>
              </div>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div
              id="pos-bill-receipt-paper"
              className={`printable-area paper-${paperWidth}`}
              style={{
                background: '#ffffff',
                border: '1.5px solid #000000',
                padding: paperWidth === '100mm' ? '1.75rem 2.25rem' : paperWidth === '58mm' ? '0.85rem 0.65rem' : '1.25rem 0.85rem',
                borderRadius: '0',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: paperWidth === '100mm' ? '0.92rem' : paperWidth === '58mm' ? '0.76rem' : '0.84rem',
                color: '#000000',
                fontFamily: 'monospace, "Courier New", sans-serif',
                boxShadow: 'var(--shadow-card)',
                maxWidth: paperWidth === '100mm' ? '640px' : paperWidth === '58mm' ? '380px' : '520px',
                margin: '0 auto 1.5rem auto',
                boxSizing: 'border-box'
              }}
            >
              {/* Store Title */}
              <div className="receipt-store-header" style={{ textAlign: 'center', marginBottom: '0.65rem' }}>
                <h2 className="receipt-store-title" style={{ fontSize: paperWidth === '100mm' ? '1.6rem' : paperWidth === '58mm' ? '1.05rem' : '1.2rem' }}>
                  {t.receiptHeaderTitle || 'शिवरत्न किराणा & जनरल स्टोअर्स'}
                </h2>
                <div className="receipt-store-address" style={{ fontSize: paperWidth === '100mm' ? '0.8rem' : paperWidth === '58mm' ? '0.68rem' : '0.74rem' }}>
                  {t.receiptHeaderAddress || 'खंडोबाचीवाडी, MOB NO:- 9763950797'}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.45rem 0', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: paperWidth === '58mm' ? '0.72rem' : '0.8rem' }}>
                <div>
                  <div><strong>NAME :</strong> {createdBill.customerName}</div>
                  <div><strong>PH :</strong> {createdBill.customerPhone || ''}</div>
                </div>
                <div style={{ textAlign: 'right', paddingRight: '4px' }}>
                  <div><strong>Bill No. :</strong> {createdBill.billId}</div>
                  <div><strong>Date :</strong> {new Date(createdBill.createdAt).toLocaleDateString('en-GB')}</div>
                  <div><strong>Time :</strong> {new Date(createdBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: paperWidth === '100mm' ? '0.88rem' : paperWidth === '58mm' ? '0.72rem' : '0.8rem', marginBottom: '0.65rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.3rem 0.08rem', width: '11%' }}>S/N</th>
                    <th style={{ padding: '0.3rem 0.08rem', width: '34%', wordBreak: 'break-word' }}>Particulars</th>
                    <th style={{ padding: '0.3rem 0.08rem', width: '12%', textAlign: 'right', whiteSpace: 'nowrap' }}>Qty</th>
                    <th style={{ padding: '0.3rem 0.08rem', width: '12%', textAlign: 'center', whiteSpace: 'nowrap' }}>Unit</th>
                    <th style={{ padding: '0.3rem 0.08rem', width: '14%', textAlign: 'right', whiteSpace: 'nowrap' }}>Rate</th>
                    <th style={{ padding: '0.3rem 0.3rem 0.3rem 0.08rem', width: '17%', textAlign: 'right', whiteSpace: 'nowrap' }}>AMT</th>
                  </tr>
                </thead>
                <tbody>
                  {createdBill.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '0.3rem 0.08rem', verticalAlign: 'top' }}>{idx + 1}</td>
                      <td style={{ padding: '0.3rem 0.08rem', fontWeight: 700, wordBreak: 'break-word' }}>{item.name}</td>
                      <td style={{ padding: '0.3rem 0.08rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatQuantity(item.quantity, item.unit)}</td>
                      <td style={{ padding: '0.3rem 0.08rem', textAlign: 'center', textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{item.unit ? item.unit.toUpperCase() : 'UNIT'}</td>
                      <td style={{ padding: '0.3rem 0.08rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatAmount(item.sellingPrice)}</td>
                      <td style={{ padding: '0.3rem 0.3rem 0.3rem 0.08rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatAmount(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.45rem 0.3rem 0.45rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tot Items : {createdBill.items.length}</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800 }}>
                  एकूण रक्कम : {formatAmount(createdBill.totalAmount)}
                </span>
              </div>

              <div style={{ borderBottom: '1px solid #000', paddingBottom: '0.45rem', marginBottom: '0.65rem', fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                  PAYMENT DETAILS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div>CASH REC. : {createdBill.paymentType === 'CASH' && createdBill.paymentStatus === 'PAID' ? formatAmount(createdBill.amountPaid) : '0'}</div>
                    <div>PHONE PAY : {createdBill.paymentType === 'UPI' && createdBill.paymentStatus === 'PAID' ? formatAmount(createdBill.amountPaid) : '0'}</div>
                  </div>
                  <div style={{ textAlign: 'right', paddingRight: '4px' }}>
                    <div>RETURN AMT : 0</div>
                    <div>CREDIT : {createdBill.paymentStatus === 'UNPAID' ? formatAmount(createdBill.totalAmount) : '0'}</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.76rem', color: '#444' }}>
                धन्यवाद, पुन्हा या! • Thank You!
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* PRIMARY DEFAULT PRINT BUTTON: DIRECT PLUGGED-IN USB PRINTER PRINTING */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  window.print();
                }}
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.92rem', background: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                title="डायरेक्ट जोडलेल्या प्रिंटरवर (USB Plugged-In) बिल छापा"
              >
                <PrinterIcon size={18} />
                <span>बिल प्रिंट करा</span>
              </button>

              {/* SECONDARY BLUETOOTH PRINT BUTTON */}
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  if (bluetoothPrinter.isConnected()) {
                    try {
                      await bluetoothPrinter.printBill(createdBill, 'pos-bill-receipt-paper');
                    } catch (err) {
                      setShowBtPrinterModal(true);
                    }
                  } else {
                    setShowBtPrinterModal(true);
                  }
                }}
                style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
                title="वायरलेस ब्लूटूथ प्रिंटर जोडा किंवा छापा"
              >
                <span>📶 Bluetooth ने प्रिंट</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadPDFReceipt}
                disabled={isDownloadingPDF}
                style={{ padding: '0.65rem 1.1rem', fontSize: '0.88rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                {isDownloadingPDF ? (
                  <>
                    <span className="btn-spinner" />
                    <span>डाऊनलोड होत आहे...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon size={18} color="var(--primary)" />
                    Download PDF
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab && setActiveTab('home')}
                style={{ padding: '0.65rem 1.1rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
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
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
              >
                <PlusIcon size={18} />
                {t.newOrder || 'Start New Order'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SPACIOUS 2-COLUMN LAYOUT: EDITABLE CATALOG CARDS (LEFT) + LIVE CART SUMMARY PANEL (RIGHT) */
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
              ref={mobileCartTabRef}
              type="button"
              onClick={() => setMobilePosTab('cart')}
              className={`${mobilePosTab === 'cart' ? 'btn-primary' : 'btn-secondary'} ${cartBump ? 'cart-bump-animation' : ''}`}
              style={{ flex: 1, justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
            >
              <ShoppingCartIcon size={16} /> 2. बिलातील यादी {cartItems.length > 0 && `(${cartItems.length})`}
            </button>
          </div>

          {/* Scroll Anchor Target (Placed outside grid so it does not interfere with 2-column layout) */}
          <div ref={catalogTopRef} id="pos-catalog-top" style={{ position: 'relative', top: '-15px' }} />

          <div className="no-print billing-pos-grid">
            {/* LEFT SIDE: PRODUCT CATALOG SEARCH & EDITABLE CATALOG CARDS GRID */}
            <div className={`pos-catalog-column ${mobilePosTab === 'cart' ? 'hide-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Search Bar Toolbar */}
              <div className="card-surface" style={{ padding: '0.9rem 1.15rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

                  {/* Product Search Input Wrapper */}
                  <div className={`pos-search-wrapper pos-fade-transition ${isFadeOut ? 'fading-out' : ''}`}>
                    <div style={{
                      position: 'absolute',
                      left: '0.95rem',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 2
                    }}>
                      <SearchIcon size={18} color="var(--text-muted)" />
                    </div>

                    <input
                      ref={searchInputRef}
                      type="text"
                      className="pos-search-input"
                      placeholder={t.searchProduct || 'मालाचे नाव शोधा (उदा. साखर, तेल, तांदूळ)...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleManualClearSearch();
                        }
                      }}
                    />

                    {/* Clear 'X' button & Search Result Count Pill */}
                    {searchQuery && !isFadeOut && (
                      <div style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem', zIndex: 2 }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px'
                        }}>
                          {filteredProducts.length} सापडले
                        </span>
                        <button
                          type="button"
                          onClick={handleManualClearSearch}
                          className="pos-search-clear-btn"
                          title="शोध साफ करा (Esc)"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Search Context Hint Bar */}
                  {searchQuery.trim() !== '' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      padding: '0 0.25rem'
                    }}>
                      <span>
                        '<strong>{searchQuery}</strong>' साठी निकाल
                      </span>
                      <button
                        type="button"
                        onClick={handleManualClearSearch}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.76rem',
                          textDecoration: 'underline'
                        }}
                      >
                        सर्व माल दाखवा (Reset)
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Product Cards Grid */}
              {loadingStock ? (
                <LoadingSpinner text="मालाचे कॅटलॉग लोड होत आहे..." />
              ) : filteredProducts.length === 0 ? (
                <div className={`card-surface pos-fade-transition ${isFadeOut ? 'fading-out' : ''}`} style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
                  <PackageIcon size={44} color="var(--text-muted)" style={{ marginBottom: '0.65rem' }} />
                  <h4 style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '1.05rem', margin: '0 0 0.35rem 0' }}>
                    {searchQuery ? `'${searchQuery}' या नावाचा माल सापडला नाही` : (t.noStockFound || 'कोणताही माल सापडला नाही.')}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    {searchQuery ? 'कदाचित हा माल अजून दुकानाच्या साठ्यात जोडलेला नाही.' : 'दुकानाच्या साठ्यामध्ये माल उपलब्ध नाही.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleManualClearSearch}
                        className="btn-secondary"
                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      >
                        <XIcon size={15} /> शोध साफ करा
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenMaalJodha}
                      className="apple-action-pill"
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.52rem 1.15rem',
                        background: '#18181b',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '9999px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      <PlusIcon size={16} /> नवीन माल जोडा
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`pos-products-grid pos-fade-transition ${isFadeOut ? 'fading-out' : ''}`}
                    style={{
                      padding: '4px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {filteredProducts.map((product) => {
                      const cartItem = getCartItem(product._id);
                      const isLowStock = product.quantity <= (product.minStockAlert || 5);
                      const isOutOfStock = product.quantity <= 0;
                      const displayName = cleanDisplayName(product.name);
                      const isRecentlyAdded = lastAddedProductId === product._id;

                      const inCart = !!cartItem && cartItem.quantity > 0;
                      const curQty = inCart ? cartItem.quantity : 0;
                      const curSellingPrice = inCart ? cartItem.sellingPrice : product.sellingPrice;
                      const curUnit = inCart ? cartItem.unit : product.unit;
                      const curSubtotal = inCart ? cartItem.subtotal : 0;

                      // Non-cart draft state
                      const draft = getCardDraft(product);
                      const draftQtyNum = parseFloat(draft.quantity) || 1;
                      const draftSubtotal = calculateItemSubtotal(draftQtyNum, product.sellingPrice, draft.unit, normalizeUnit(product.unit));

                      return (
                        <div
                          key={product._id}
                          id={`product-card-${product._id}`}
                          className={`card-surface ${isRecentlyAdded ? 'card-spotlight-added' : ''}`}
                          style={{
                            padding: '0.95rem',
                            background: '#ffffff',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.65rem',
                            position: 'relative',
                            border: isRecentlyAdded
                              ? '1.5px solid var(--primary)'
                              : inCart
                              ? '1.5px solid var(--primary)'
                              : '1px solid var(--border-color)',
                            boxShadow: isRecentlyAdded
                              ? '0 0 0 2.5px rgba(67, 56, 202, 0.12), 0 2px 8px rgba(67, 56, 202, 0.08)'
                              : inCart
                              ? '0 2px 8px rgba(67, 56, 202, 0.08)'
                              : 'var(--shadow-card)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box'
                          }}
                        >
                          {/* Product Header */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <h4 style={{
                              fontSize: '0.98rem',
                              fontWeight: 800,
                              color: 'var(--text-heading)',
                              margin: 0,
                              lineHeight: 1.25,
                              wordBreak: 'break-word',
                              flex: 1
                            }}>
                              {displayName}
                            </h4>

                            {isRecentlyAdded ? (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                background: '#eef2ff',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '9999px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                flexShrink: 0
                              }}>
                                <CheckIcon size={12} strokeWidth={2.5} /> बिलात जोडले
                              </span>
                            ) : inCart ? (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                background: '#eef2ff',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '9999px',
                                flexShrink: 0
                              }}>
                                बिलात आहे ({curQty} {normalizeUnit(curUnit)})
                              </span>
                            ) : null}
                          </div>

                          {/* CONTROLS ON THE CATALOG CARD (Cost Price, Selling Rate Tag, Quantity & Unit Dropdown) */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.65rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}>

                            {/* Cost Price & Selling Rate Tag */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              background: '#eef2ff',
                              borderRadius: '6px',
                              padding: '0.4rem 0.65rem',
                              border: '1px solid #c7d2fe',
                              width: '100%',
                              boxSizing: 'border-box',
                              flexWrap: 'wrap'
                            }}>
                              <div>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block' }}>खरेदी दर:</span>
                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                                  ₹{formatAmount(product.costPrice || 0)}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3730a3', display: 'block' }}>विक्री दर :</span>
                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)' }}>
                                  ₹{formatAmount(product.sellingPrice)} <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {getMarathiUnitLabel(product.unit)}</span>
                                </span>
                              </div>
                            </div>

                            {/* Quantity & Unit Controls */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>
                                  {inCart ? 'बिलातील प्रमाण:' : 'प्रमाण टाका:'}
                                </label>
                                <input
                                  type="number"
                                  inputMode={isIntegerUnit(inCart ? curUnit : draft.unit) ? "numeric" : "decimal"}
                                  step={isIntegerUnit(inCart ? curUnit : draft.unit) ? "1" : "0.01"}
                                  min="0"
                                  placeholder={inCart ? "0" : "1"}
                                  value={inCart ? (curQty > 0 ? curQty : '') : draft.quantity}
                                  onChange={(e) => {
                                    if (inCart) {
                                      handleCatalogCardFieldChange(product, 'quantity', e.target.value);
                                    } else {
                                      handleDraftChange(product, 'quantity', e.target.value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (inCart) {
                                        scrollToTopAndNormalize(searchQuery.trim() !== '');
                                      } else {
                                        handleAddProductToCart(product, e);
                                      }
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0.25rem 0.35rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    background: '#ffffff',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>युनिट:</label>
                                <CustomSelect
                                  compact={true}
                                  value={normalizeUnit(inCart ? curUnit : draft.unit)}
                                  onChange={(val) => {
                                    if (inCart) {
                                      handleCatalogCardFieldChange(product, 'unit', val);
                                    } else {
                                      handleDraftChange(product, 'unit', val);
                                    }
                                  }}
                                  options={getConvertibleUnits(product.unit).map((u) => ({ value: u.id, label: u.label }))}
                                />
                              </div>
                            </div>

                          </div>

                          {/* Card Footer: Live Subtotal & Add/Remove Action */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.2rem', width: '100%', boxSizing: 'border-box' }}>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                                {inCart ? 'एकूण रक्कम:' : 'अंदाजे रक्कम:'}
                              </span>
                              <span style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary)' }}>
                                ₹{formatAmount(inCart ? curSubtotal : draftSubtotal)}
                              </span>
                            </div>

                            {!inCart ? (
                              <button
                                type="button"
                                onClick={(e) => handleAddProductToCart(product, e)}
                                className="btn-primary"
                                style={{
                                  padding: '0.45rem 1rem',
                                  fontSize: '0.86rem',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)'
                                }}
                              >
                                <PlusIcon size={16} /> जोडा
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDecrement(product)}
                                  className="btn-secondary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: '36px', width: '36px', justifyContent: 'center' }}
                                  title="कमी करा"
                                >
                                  <MinusIcon size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleIncrement(product, e)}
                                  className="btn-primary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: '36px', width: '36px', justifyContent: 'center' }}
                                  title="आणखी जोडा"
                                >
                                  <PlusIcon size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(product._id)}
                                  style={{
                                    background: 'var(--danger-bg)',
                                    border: '1px solid var(--danger-border)',
                                    color: 'var(--danger)',
                                    padding: '0.3rem 0.55rem',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '36px',
                                    width: '36px'
                                  }}
                                  title="काढून टाका"
                                >
                                  <TrashIcon size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Continuous Catalog Products Summary (No Pagination) */}
                  {filteredProducts.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 1rem',
                        background: '#ffffff',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        marginTop: '0.85rem',
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}
                    >
                      <span>
                        एकूण दाखवत आहे: <strong style={{ color: 'var(--primary)' }}>{filteredProducts.length}</strong> वस्तू
                      </span>
                      {searchQuery && (
                        <span style={{ fontSize: '0.78rem' }}>
                          (शोध निकाल: <strong>{filteredProducts.length}</strong> वस्तू)
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}

            </div>

            {/* RIGHT SIDE: CLEAN, SPACIOUS LIVE CART LIST SUMMARY & CHECKOUT PANEL */}
            <div className={`pos-cart-column ${mobilePosTab === 'catalog' ? 'hide-mobile' : ''}`} style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div className="card-surface" style={{ padding: '1.35rem', background: '#ffffff', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>

                {/* Cart Header */}
                <div
                  ref={cartHeaderRef}
                  className={cartBump ? 'cart-bump-animation' : ''}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', transition: 'transform 0.2s ease' }}
                >
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-heading)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingCartIcon size={22} color="var(--primary)" />
                    बिलातील वस्तूंची यादी
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className={cartBump ? 'cart-bump-animation' : ''}
                      style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800, transition: 'all 0.2s ease' }}
                    >
                      {cartItems.length} वस्तू
                    </span>
                  </div>
                </div>

                {/* Selected Items List Container - Spacious & Uncluttered */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '4px' }}>
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
                            gap: '0.45rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>
                              {item.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: '#334155',
                                  background: '#eef2ff',
                                  border: '1px solid #c7d2fe',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}
                                title="खरेदी भाव (बदलता येत नाही)"
                              >
                                खरेदी भाव: ₹{formatAmount(item.costPrice || 0)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.productId)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                                title="काढून टाका"
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {/* Quantity & Unit info */}
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              प्रमाण: <strong style={{ color: 'var(--primary)' }}>{formatQuantity(item.quantity, item.unit)} {normalizeUnit(item.unit)}</strong>
                            </div>

                            {/* Editable Selling Price Field ONLY in Selected List */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>दर (₹):</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.sellingPrice}
                                onChange={(e) => handleCartItemSellingPriceChange(item.productId, e.target.value)}
                                style={{
                                  width: '75px',
                                  padding: '0.2rem 0.35rem',
                                  fontSize: '0.84rem',
                                  fontWeight: 800,
                                  color: 'var(--primary)',
                                  border: '1.5px solid var(--primary)',
                                  borderRadius: '4px',
                                  textAlign: 'right',
                                  background: '#ffffff'
                                }}
                                title="बिलातील विक्री दर बदला"
                              />
                            </div>

                            {/* Line Item Subtotal */}
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>एकूण:</span>
                              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                                ₹{formatAmount(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Grand Summary Banner */}


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
                      पेमेंट पद्धत
                    </label>
                    <CustomSelect
                      value={paymentType}
                      onChange={(val) => setPaymentType(val)}
                      options={[
                        { value: 'CASH', label: t.payCash || 'रोख रक्कम' },
                        { value: 'UPI', label: t.payUpi || 'गूगल पे / फोनपे / युपीआय' },
                        { value: 'CARD', label: t.payCard || 'डेबिट / क्रेडिट कार्ड' },
                        { value: 'OTHER', label: t.payOther || 'इतर मार्ग' }
                      ]}
                      style={{ marginBottom: '0.65rem' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          ग्राहकाचे नाव (ऐच्छिक)
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="उदा. रोख ग्राहक"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          style={{ fontSize: '0.82rem', height: '38px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          मोबाईल नंबर (ऐच्छिक)
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          className="input-field"
                          placeholder="१० अंकांचा नंबर (ऐच्छिक)"
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
                          <button type="button" className="btn-secondary" onClick={() => setShowAddCustomerForm(false)} disabled={isSubmittingInlineCustomer} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>रद्द</button>
                          <button type="submit" className="btn-primary" disabled={isSubmittingInlineCustomer} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                            {isSubmittingInlineCustomer ? (
                              <>
                                <span className="btn-spinner" />
                                <span>सेव्ह होत आहे...</span>
                              </>
                            ) : (
                              'सेव्ह करा'
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    <CustomSelect
                      value={selectedCustomerId || ''}
                      onChange={(val) => {
                        const cust = ledgerCustomers.find((c) => c._id === val);
                        if (cust) handleSelectCustomer(cust);
                      }}
                      placeholder="-- उधारी ग्राहक निवडा --"
                      options={[
                        { value: '', label: '-- उधारी ग्राहक निवडा --' },
                        ...ledgerCustomers.map((cust) => ({
                          value: cust._id,
                          label: `${cust.name} (${cust.phone}) - उधारी: ₹${cust.totalDue}`
                        }))
                      ]}
                      style={{ marginBottom: '0.55rem' }}
                    />

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

                {/* Total Grand Summary Banner & Submit Button (Desktop Only - Hidden on Mobile to prevent duplicate checkout buttons) */}
                <div className="hide-mobile">
                  <div style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: '#ffffff',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                    boxShadow: '0 4px 14px var(--primary-glow)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', color: '#ffffff', opacity: 1, fontWeight: 700 }}>
                        एकूण बिल रक्कम
                      </span>
                      <h3 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, color: '#ffffff' }}>
                        ₹{formatAmount(grandTotal)}
                      </h3>
                    </div>
                    <SparklesIcon size={28} color="#ffffff" />
                  </div>
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
                    {isSubmitting ? (
                      <>
                        <span className="btn-spinner btn-spinner-lg" />
                        <span>बिल सेव्ह होत आहे...</span>
                      </>
                    ) : (
                      <>
                        <PrinterIcon size={20} color="#ffffff" />
                        <span>{t.printBill || 'बिल बनवा आणि प्रिंट करा'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>



            {/* Sticky Mobile Checkout Bar (When on Cart View) */}
            {mobilePosTab === 'cart' && cartItems.length > 0 && (
              <div className="mobile-cart-sticky-submit no-print">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>एकूण बिल रक्कम</span>
                    <span style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 800 }}>₹{formatAmount(grandTotal)}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800 }}>
                    {cartItems.length} वस्तू
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmitBill}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner" />
                      <span>बिल सेव्ह होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <PrinterIcon size={18} color="#ffffff" />
                      <span>{t.printBill || 'बिल बनवा आणि प्रिंट करा'}</span>
                    </>
                  )}
                </button>
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
                  {isUpdatingStock ? (
                    <>
                      <span className="btn-spinner" />
                      <span>सेव्ह होत आहे...</span>
                    </>
                  ) : (
                    'साठा सेव्ह करा (Save)'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "माल जोडा" (Add Stock Directly from Billing) Modal */}
      {showMaalJodhaModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          overflowY: 'auto',
          padding: '1.5rem 1rem'
        }}>
          <div className="card-surface" style={{
            width: '100%',
            maxWidth: '540px',
            padding: '2.2rem',
            background: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--border-color)'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.35rem',
                color: 'var(--text-heading)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {t.btnAddStock || 'माल जोडा'}
              </h3>
              <button
                type="button"
                onClick={() => !isSubmittingMaalJodha && setShowMaalJodhaModal(false)}
                disabled={isSubmittingMaalJodha}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  lineHeight: 1,
                  padding: '0.2rem'
                }}
                title={t.cancelBtn || 'रद्द करा'}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMaalJodhaSubmit}>
              {/* Product Name */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.productName || 'सामानाचे नाव'} *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  autoFocus
                  placeholder="उदा. बास्मती तांदूळ १ कि.ग्रा."
                  value={maalJodhaFormData.name}
                  onChange={(e) => setMaalJodhaFormData({ ...maalJodhaFormData, name: e.target.value })}
                  style={{ height: '42px', fontSize: '0.95rem' }}
                />
              </div>

              {/* Unit Selection */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.unit || 'युनिट'} *
                </label>
                <CustomSelect
                  value={maalJodhaFormData.unit}
                  onChange={(val) => setMaalJodhaFormData({ ...maalJodhaFormData, unit: val })}
                  options={[
                    { value: "kg", label: t.unitKg || 'किलोग्राम' },
                    { value: "g", label: t.unitG || 'ग्राम' },
                    { value: "unit", label: t.unitUnit || 'नग' },
                    { value: "liter", label: t.unitLiter || 'लिटर' },
                    { value: "ml", label: t.unitMl || 'मिली' },
                    { value: "meter", label: t.unitMeter || 'मीटर' },
                    { value: "quintal", label: t.unitQuintal || 'क्विंटल' }
                  ]}
                />
              </div>

              {/* Cost Price & Selling Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.costPrice || 'खरेदी भाव (₹)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    required
                    placeholder="0.00"
                    value={maalJodhaFormData.costPrice}
                    onChange={(e) => setMaalJodhaFormData({ ...maalJodhaFormData, costPrice: sanitizeDecimalInput(e.target.value) })}
                    style={{ height: '42px', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.sellingPrice || 'विक्री भाव (₹)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    required
                    placeholder="0.00"
                    value={maalJodhaFormData.sellingPrice}
                    onChange={(e) => setMaalJodhaFormData({ ...maalJodhaFormData, sellingPrice: sanitizeDecimalInput(e.target.value) })}
                    style={{ height: '42px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Quantity & Min Stock Alert */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.quantity || 'शिल्लक माल'} (प्रमाण)
                  </label>
                  <input
                    type="number"
                    step={isIntegerUnit(maalJodhaFormData.unit) ? "1" : "0.01"}
                    className="input-field"
                    placeholder={isIntegerUnit(maalJodhaFormData.unit) ? "0" : "0.00"}
                    value={maalJodhaFormData.quantity}
                    onChange={(e) => setMaalJodhaFormData({
                      ...maalJodhaFormData,
                      quantity: isIntegerUnit(maalJodhaFormData.unit) ? sanitizeIntegerInput(e.target.value) : sanitizeDecimalInput(e.target.value)
                    })}
                    style={{ height: '42px', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.minStockAlert || 'कमी साठा वॉर्निंग'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="input-field"
                    placeholder="5"
                    value={maalJodhaFormData.minStockAlert}
                    onChange={(e) => setMaalJodhaFormData({ ...maalJodhaFormData, minStockAlert: sanitizeIntegerInput(e.target.value) })}
                    style={{ height: '42px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowMaalJodhaModal(false)}
                  disabled={isSubmittingMaalJodha}
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
                >
                  {t.cancelBtn || 'रद्द करा'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaalJodha}
                  style={{
                    padding: '0.55rem 1.35rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    background: '#18181b',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSubmittingMaalJodha ? (
                    <>
                      <span className="btn-spinner" />
                      <span>साठवत आहे...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon size={16} color="#ffffff" strokeWidth={2.5} />
                      <span>{t.saveStockBtn || 'साठा सेव्ह करा'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom UI Dialog Modal (Replaces built-in browser alerts) */}
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

      {/* Bluetooth Thermal Printer Modal */}
      <BluetoothPrinterModal
        isOpen={showBtPrinterModal}
        onClose={() => setShowBtPrinterModal(false)}
        onPaperChange={handlePaperChange}
        billData={createdBill}
        t={t}
      />

    </div>
  );
}
