import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DownloadIcon,
  SearchIcon,
  TriangleAlertIcon,
  RefreshCwIcon,
  FilterIcon,
  TagIcon,
  ArrowLeftIcon,
  PackageIcon
} from '@animateicons/react/lucide';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { stockAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import CustomModal from './CustomModal';
import CustomSelect from './CustomSelect';
import { formatQuantity, formatAmount, isIntegerUnit, sanitizeDecimalInput, sanitizeIntegerInput } from '../utils/formatters';

export default function StockManagement({ modalState, setModalState, setActiveTab, t }) {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Column Sorting State
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Pagination State (20 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    unit: 'kg',
    category: 'Grains & Pulses',
    minStockAlert: 5,
  });

  useEffect(() => {
    fetchStock();
  }, [selectedCategoryFilter]);

  useEffect(() => {
    if (modalState?.open) {
      if (modalState.mode === 'add') {
        openAddModal();
      } else if (modalState.mode === 'edit' && modalState.item) {
        openEditModal(modalState.item);
      }
      setModalState({ open: false, mode: 'add', item: null });
    }
  }, [modalState]);

  const fetchStock = async (query = searchQuery) => {
    try {
      setLoading(true);
      const res = await stockAPI.getAll(query, selectedCategoryFilter);
      setStockList(res.data.data || []);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Failed to fetch stock inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchStock(val);
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      costPrice: '',
      sellingPrice: '',
      quantity: '',
      unit: 'kg',
      category: 'Grains & Pulses',
      minStockAlert: 5,
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditId(item._id);
    setFormData({
      name: item.name,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      quantity: item.quantity,
      unit: item.unit || 'kg',
      category: item.category || 'Grains & Pulses',
      minStockAlert: item.minStockAlert || 5,
    });
    setShowModal(true);
  };

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

  const showConfirm = (message, title = 'खात्री करा', onConfirmFn) => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: title,
      message: message,
      confirmText: 'हटवा',
      cancelText: 'रद्द करा',
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (onConfirmFn) onConfirmFn();
      },
      onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      costPrice: Math.round((Number(formData.costPrice) || 0) * 100) / 100,
      sellingPrice: Math.round((Number(formData.sellingPrice) || 0) * 100) / 100,
      quantity: Math.round((Number(formData.quantity) || 0) * 100) / 100,
      minStockAlert: Math.round((Number(formData.minStockAlert) || 5) * 100) / 100,
    };
    try {
      if (editId) {
        await stockAPI.update(editId, payload);
      } else {
        await stockAPI.create(payload);
      }
      setShowModal(false);
      fetchStock(searchQuery);
    } catch (err) {
      showAlert(err.response?.data?.message || 'साठा सेव्ह करताना त्रुटी आली', 'त्रुटी', 'danger');
    }
  };

  const handleDelete = (id, name) => {
    const confirmText = (t.confirmDeleteStock || "तुम्हाला नक्की '{name}' साठ्यातून हटवायचा आहे का?").replace('{name}', name);
    showConfirm(confirmText, 'सामान हटवा', async () => {
      try {
        await stockAPI.delete(id);
        fetchStock(searchQuery);
      } catch (err) {
        showAlert('सामान हटवताना त्रुटी आली.', 'त्रुटी', 'danger');
      }
    });
  };

  // Helper function to resolve category pill style
  const getCategoryClass = (cat = '') => {
    const lower = cat.toLowerCase();
    if (lower.includes('grain') || lower.includes('धान्य')) return 'grains';
    if (lower.includes('oil') || lower.includes('तेल')) return 'oils';
    if (lower.includes('spice') || lower.includes('मसाले')) return 'spices';
    if (lower.includes('snack') || lower.includes('चहा')) return 'snacks';
    if (lower.includes('clean') || lower.includes('साबण')) return 'cleaning';
    return 'general';
  };

  const getCategoryLabel = (c) => {
    if (!c) return t.catGeneral || 'General';
    const l = c.toLowerCase();
    if (l.includes('grain') || l.includes('धान्य')) return t.catGrains || 'Grains & Pulses';
    if (l.includes('oil') || l.includes('तेल')) return t.catOils || 'Oils & Ghee';
    if (l.includes('spice') || l.includes('मसाले')) return t.catSpices || 'Spices & Dryfruits';
    if (l.includes('snack') || l.includes('चहा')) return t.catSnacks || 'Beverages & Snacks';
    if (l.includes('clean') || l.includes('साबण')) return t.catCleaning || 'Soaps & Cleaning';
    return t.catGeneral || 'General Kirana';
  };

  // Sorting Toggle Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted Stock List Computation
  const sortedStockList = [...stockList].sort((a, b) => {
    let valA, valB;
    if (sortField === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
      return sortDirection === 'asc' ? valA.localeCompare(valB, 'mr') : valB.localeCompare(valA, 'mr');
    }
    if (sortField === 'category') {
      valA = getCategoryLabel(a.category).toLowerCase();
      valB = getCategoryLabel(b.category).toLowerCase();
      return sortDirection === 'asc' ? valA.localeCompare(valB, 'mr') : valB.localeCompare(valA, 'mr');
    }
    if (sortField === 'costPrice') {
      valA = Number(a.costPrice || 0);
      valB = Number(b.costPrice || 0);
    } else if (sortField === 'sellingPrice') {
      valA = Number(a.sellingPrice || 0);
      valB = Number(b.sellingPrice || 0);
    } else if (sortField === 'quantity') {
      valA = Number(a.quantity || 0);
      valB = Number(b.quantity || 0);
    } else {
      valA = 0; valB = 0;
    }
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  // Reset page when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter]);

  // Pagination Calculations (20 items per page)
  const totalPages = Math.ceil(sortedStockList.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedStockList = sortedStockList.slice(startIndex, startIndex + itemsPerPage);

  // Sort Indicator Icon Component
  const RenderSortIcon = ({ field }) => {
    const isActive = sortField === field;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.35rem', opacity: isActive ? 1 : 0.4 }}>
        {isActive ? (
          sortDirection === 'asc' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          )
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        )}
      </span>
    );
  };

  // HTML2Canvas PDF Export Generator (100% Crisp Marathi Character Rendering + Multi-page support)
  const generatePDFReport = async () => {
    try {
      const template = document.getElementById('pdf-report-template');
      if (!template) return;

      // Temporarily reveal template off-screen for html2canvas
      template.style.display = 'block';

      const canvas = await html2canvas(template, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      template.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      showAlert('PDF रिपोर्ट डाऊनलोड करताना अडचण आली', 'त्रुटी', 'danger');
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        marginBottom: '1.25rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, textAlign: 'center' }}>
          <PackageIcon size={26} color="var(--primary)" />
          {t.stockTitle || 'माल'}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={generatePDFReport}>
            <DownloadIcon size={18} color="var(--primary)" />
            {t.exportPdf}
          </button>

          <button className="btn-primary" onClick={openAddModal}>
            <PlusIcon size={18} color="#ffffff" />
            {t.btnAddStock}
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid-filter" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Search Bar */}
        <div className="card-surface" style={{ padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.85rem', background: '#ffffff' }}>
          <SearchIcon size={20} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            placeholder={t.searchStockPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
          />
          {loading && <RefreshCwIcon size={18} color="var(--primary)" />}
        </div>

        {/* Category Filter Dropdown */}
        <div className="card-surface" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff' }}>
          <FilterIcon size={18} color="var(--primary)" />
          <CustomSelect
            value={selectedCategoryFilter}
            onChange={(val) => setSelectedCategoryFilter(val)}
            options={[
              { value: '', label: t.catAll || 'सर्व प्रकार' },
              { value: 'Grains & Pulses', label: t.catGrains || 'धान्य व डाळी' },
              { value: 'Oils & Ghee', label: t.catOils || 'तेल आणि तूप' },
              { value: 'Spices & Dryfruits', label: t.catSpices || 'मसाले व ड्रायफ्रूट्स' },
              { value: 'Beverages & Snacks', label: t.catSnacks || 'चहा, पेये व बिस्किटे' },
              { value: 'Soaps & Cleaning', label: t.catCleaning || 'साबण व स्वच्छता' },
              { value: 'General Kirana', label: t.catGeneral || 'जनरल किराणा' }
            ]}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.85rem 1.2rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--danger-border)' }}>
          {errorMsg}
        </div>
      )}

      {/* Stock Items Table */}
      <div className="card-surface" style={{ overflowX: 'auto', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-surface-raised)' }}>
              <th
                onClick={() => handleSort('name')}
                style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 800, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                title="नावाने क्रमवारी लावा (Sort by Name)"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {t.productName} <RenderSortIcon field="name" />
                </div>
              </th>

              <th
                onClick={() => handleSort('category')}
                style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 800, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                title="मालाच्या प्रकाराने क्रमवारी लावा (Sort by Category)"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {t.category} <RenderSortIcon field="category" />
                </div>
              </th>

              <th
                onClick={() => handleSort('costPrice')}
                style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 800, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                title="खरेदी भावाने क्रमवारी लावा (Sort by Cost Price)"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {t.costPrice} <RenderSortIcon field="costPrice" />
                </div>
              </th>

              <th
                onClick={() => handleSort('sellingPrice')}
                style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 800, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                title="विक्री भावाने क्रमवारी लावा (Sort by Selling Price)"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {t.sellingPrice} <RenderSortIcon field="sellingPrice" />
                </div>
              </th>

              <th
                onClick={() => handleSort('quantity')}
                style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 800, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                title="शिल्लक मालाने क्रमवारी लावा (Sort by Remaining Stock)"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {t.quantity} <RenderSortIcon field="quantity" />
                </div>
              </th>

              <th style={{ padding: '1rem 1.2rem', textAlign: 'right', color: 'var(--text-heading)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem' }}>
                  <LoadingSpinner text="मालाचा साठा लोड होत आहे..." />
                </td>
              </tr>
            ) : sortedStockList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t.noStockFound}
                </td>
              </tr>
            ) : (
              paginatedStockList.map((item) => {
                const isLowStock = item.quantity <= (item.minStockAlert || 5);
                const catStyleClass = getCategoryClass(item.category);

                return (
                  <tr key={`${item._id}-${sortField}-${sortDirection}`} className="stock-row-anim" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.2rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <span>{item.name}</span>
                        {isLowStock && (
                          <span
                            title={t.lowStockAlert || 'कमी साठा वॉर्निंग! (Low Stock Alert)'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '6px',
                              background: 'var(--warning-bg)',
                              border: '1px solid var(--warning-border)',
                              color: 'var(--warning)',
                              verticalAlign: 'middle',
                              flexShrink: 0
                            }}
                          >
                            <TriangleAlertIcon size={15} color="var(--warning)" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>
                      <span className={`category-pill ${catStyleClass}`}>
                        <TagIcon size={12} /> {getCategoryLabel(item.category)}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      ₹{Number(item.costPrice || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: '1rem 1.2rem', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                      ₹{Number(item.sellingPrice || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap', minWidth: '135px' }}>
                      <span style={{
                        fontWeight: 800,
                        color: isLowStock ? '#d97706' : 'var(--text-heading)',
                        background: '#f8fafc',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.88rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '120px',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {formatQuantity(item.quantity, item.unit)} {item.unit}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.2rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-action-edit"
                          onClick={() => openEditModal(item)}
                          title={t.btnEditStock}
                        >
                          <PencilIcon size={16} />
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => handleDelete(item._id, item.name)}
                          title={t.deleteStockTitle}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls Bar (20 Items Per Page) */}
        {sortedStockList.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.2rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-surface-raised)',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.84rem'
          }}>
            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              दाखवत आहे: <strong>{startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedStockList.length)}</strong> (एकूण <strong>{sortedStockList.length}</strong> माल) • पान <strong>{validCurrentPage}</strong> / {totalPages}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  opacity: validCurrentPage <= 1 ? 0.5 : 1,
                  cursor: validCurrentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← मागे
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: pageNum === validCurrentPage ? 'var(--primary)' : 'var(--border-color)',
                    background: pageNum === validCurrentPage ? 'var(--primary)' : '#ffffff',
                    color: pageNum === validCurrentPage ? '#ffffff' : 'var(--text-heading)',
                    cursor: 'pointer',
                    minWidth: '32px'
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="btn-secondary"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  opacity: validCurrentPage >= totalPages ? 0.5 : 1,
                  cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                पुढे →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Stock Modal */}
      {showModal && (
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
          <div className="card-surface" style={{ width: '100%', maxWidth: '540px', padding: '2.2rem', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', color: 'var(--text-heading)' }}>
              {editId ? t.btnEditStock : t.btnAddStock}
            </h3>

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  {t.productName} *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="उदा. बास्मती तांदूळ १ कि.ग्रा."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Category & Unit Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.category} *
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={[
                      { value: "Grains & Pulses", label: t.catGrains },
                      { value: "Oils & Ghee", label: t.catOils },
                      { value: "Spices & Dryfruits", label: t.catSpices },
                      { value: "Beverages & Snacks", label: t.catSnacks },
                      { value: "Soaps & Cleaning", label: t.catCleaning },
                      { value: "General Kirana", label: t.catGeneral }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.unit} *
                  </label>
                  <CustomSelect
                    value={formData.unit}
                    onChange={(val) => setFormData({ ...formData, unit: val })}
                    options={[
                      { value: "kg", label: t.unitKg },
                      { value: "g", label: t.unitG },
                      { value: "unit", label: t.unitUnit || 'नग' },
                      { value: "liter", label: t.unitLiter },
                      { value: "ml", label: t.unitMl || 'मिली' },
                      { value: "meter", label: t.unitMeter },
                      { value: "quintal", label: t.unitQuintal || 'क्विंटल' }
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.costPrice} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    required
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: sanitizeDecimalInput(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.sellingPrice} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    required
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: sanitizeDecimalInput(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.quantity} *
                  </label>
                  <input
                    type="number"
                    step={isIntegerUnit(formData.unit) ? "1" : "0.01"}
                    className="input-field"
                    required
                    placeholder={isIntegerUnit(formData.unit) ? "0" : "0.00"}
                    value={formData.quantity}
                    onChange={(e) => setFormData({
                      ...formData,
                      quantity: isIntegerUnit(formData.unit) ? sanitizeIntegerInput(e.target.value) : sanitizeDecimalInput(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.minStockAlert}
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="input-field"
                    placeholder="5"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: sanitizeIntegerInput(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  {t.cancelBtn}
                </button>
                <button type="submit" className="btn-primary">
                  {t.saveStockBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden PDF Report Template for High-Res HTML2Canvas Export (Zero Marathi Corruption) */}
      <div
        id="pdf-report-template"
        style={{
          display: 'none',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '850px',
          padding: '2.5rem',
          background: '#ffffff',
          color: '#1c1917',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Report Shop Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #4338ca', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.9rem', color: '#1c1917', margin: 0, fontWeight: 800 }}>
            शिवरत्न किराणा & जनरल स्टोअर्स — खंडोबाचीवाडी
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#4338ca', fontWeight: 700, margin: '0.3rem 0' }}>
            {t.stockTitle} (साठा अहवाल)
          </p>
          <p style={{ fontSize: '0.85rem', color: '#78716c', margin: 0 }}>
            {t.receiptDate}: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Inventory Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f5f5f4', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e7e5e4' }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: '#78716c', fontWeight: 700 }}>{t.totalProductsLabel}:</span>
            <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#1c1917', fontWeight: 800 }}>{stockList.length}</h3>
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: '#78716c', fontWeight: 700 }}>{t.lowStockLabel}:</span>
            <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#dc2626', fontWeight: 800 }}>
              {stockList.filter(i => i.quantity <= (i.minStockAlert || 5)).length}
            </h3>
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: '#78716c', fontWeight: 700 }}>एकूण साठा मूल्य:</span>
            <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#4338ca', fontWeight: 800 }}>
              ₹{stockList.reduce((acc, i) => acc + (i.quantity * i.sellingPrice), 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Stock Inventory Data Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#4338ca', color: '#ffffff', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', width: '40px' }}>#</th>
              <th style={{ padding: '0.75rem 1rem' }}>{t.productName}</th>
              <th style={{ padding: '0.75rem 1rem' }}>{t.category}</th>
              <th style={{ padding: '0.75rem 1rem' }}>{t.sellingPrice}</th>
              <th style={{ padding: '0.75rem 1rem' }}>{t.quantity}</th>
            </tr>
          </thead>
          <tbody>
            {stockList.map((item, index) => {
              const isLowStock = item.quantity <= (item.minStockAlert || 5);
              return (
                <tr key={item._id} style={{ borderBottom: '1px solid #e7e5e4', background: index % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '0.65rem 1rem' }}>{index + 1}</td>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#1c1917' }}>{item.name}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>{item.category || 'General Kirana'}</td>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#4338ca' }}>₹{item.sellingPrice}</td>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: isLowStock ? '#dc2626' : '#1c1917' }}>
                    {item.quantity} {item.unit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
