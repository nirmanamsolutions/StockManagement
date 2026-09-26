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

export default function StockManagement({ modalState, setModalState, setActiveTab, t }) {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await stockAPI.update(editId, formData);
      } else {
        await stockAPI.create(formData);
      }
      setShowModal(false);
      fetchStock(searchQuery);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving stock product');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmText = (t.confirmDeleteStock || "Are you sure you want to delete '{name}' from stock?").replace('{name}', name);
    if (window.confirm(confirmText)) {
      try {
        await stockAPI.delete(id);
        fetchStock(searchQuery);
      } catch (err) {
        alert('Failed to delete stock item');
      }
    }
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
      alert('Failed to generate PDF report');
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
            <PackageIcon size={24} color="var(--primary)" />
            {t.stockTitle || 'मालाचा साठा व्यवस्थापन (Stock Management)'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
            {t.stockSubtitle || 'दुकानातील साहित्याचा साठा, खरेदी/विक्री भाव व्यवस्थापन'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
          <select
            className="input-field"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{ border: 'none', background: 'transparent', boxShadow: 'none', fontWeight: 600 }}
          >
            <option value="">{t.catAll}</option>
            <option value="Grains & Pulses">{t.catGrains}</option>
            <option value="Oils & Ghee">{t.catOils}</option>
            <option value="Spices & Dryfruits">{t.catSpices}</option>
            <option value="Beverages & Snacks">{t.catSnacks}</option>
            <option value="Soaps & Cleaning">{t.catCleaning}</option>
            <option value="General Kirana">{t.catGeneral}</option>
          </select>
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
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-raised)' }}>
              <th style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 700 }}>{t.productName}</th>
              <th style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 700 }}>{t.category}</th>
              <th style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 700 }}>{t.costPrice}</th>
              <th style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 700 }}>{t.sellingPrice}</th>
              <th style={{ padding: '1rem 1.2rem', color: 'var(--text-heading)', fontWeight: 700 }}>{t.quantity}</th>
              <th style={{ padding: '1rem 1.2rem', textAlign: 'right', color: 'var(--text-heading)', fontWeight: 700 }}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem' }}>
                  <LoadingSpinner text="मालाचा साठा लोड होत आहे..." />
                </td>
              </tr>
            ) : stockList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t.noStockFound}
                </td>
              </tr>
            ) : (
              stockList.map((item) => {
                const isLowStock = item.quantity <= (item.minStockAlert || 5);
                const catStyleClass = getCategoryClass(item.category);
                
                // Localized Category Display Helper
                const getCategoryLabel = (c) => {
                  if (!c) return t.catGeneral;
                  const l = c.toLowerCase();
                  if (l.includes('grain') || l.includes('धान्य')) return t.catGrains;
                  if (l.includes('oil') || l.includes('तेल')) return t.catOils;
                  if (l.includes('spice') || l.includes('मसाले')) return t.catSpices;
                  if (l.includes('snack') || l.includes('चहा')) return t.catSnacks;
                  if (l.includes('clean') || l.includes('साबण')) return t.catCleaning;
                  return t.catGeneral;
                };

                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.2rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {item.name}
                      {isLowStock && (
                        <span className="badge-unpaid" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>
                          <TriangleAlertIcon size={14} color="var(--warning)" /> {t.lowStockAlert}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span className={`category-pill ${catStyleClass}`}>
                        <TagIcon size={12} /> {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)' }}>₹{item.costPrice}</td>
                    <td style={{ padding: '1rem 1.2rem', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>₹{item.sellingPrice}</td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span style={{ 
                        fontWeight: 800, 
                        color: isLowStock ? 'var(--warning)' : 'var(--text-heading)',
                        background: isLowStock ? 'var(--warning-bg)' : 'var(--bg-surface-raised)',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '8px',
                        border: isLowStock ? '1px solid var(--warning-border)' : '1px solid var(--border-color)',
                        fontSize: '0.9rem'
                      }}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
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
      </div>

      {/* Add / Edit Stock Modal */}
      {showModal && (
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
                  placeholder="e.g. Kolam Rice / बास्मती तांदूळ 1kg"
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
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Grains & Pulses">{t.catGrains}</option>
                    <option value="Oils & Ghee">{t.catOils}</option>
                    <option value="Spices & Dryfruits">{t.catSpices}</option>
                    <option value="Beverages & Snacks">{t.catSnacks}</option>
                    <option value="Soaps & Cleaning">{t.catCleaning}</option>
                    <option value="General Kirana">{t.catGeneral}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.unit} *
                  </label>
                  <select
                    className="input-field"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="kg">{t.unitKg}</option>
                    <option value="g">{t.unitG}</option>
                    <option value="unit">{t.unitUnit || 'unit'}</option>
                    <option value="liter">{t.unitLiter}</option>
                    <option value="ml">{t.unitMl || 'ml'}</option>
                    <option value="meter">{t.unitMeter}</option>
                    <option value="quintal">{t.unitQuintal || 'quintal'}</option>
                    <option value="brass">{t.unitBrass || 'brass'}</option>
                    <option value="feet">{t.unitFeet || 'feet'}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.costPrice} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    required
                    placeholder="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.sellingPrice} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    required
                    placeholder="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
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
                    step="any"
                    className="input-field"
                    required
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                    {t.minStockAlert}
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="5"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
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
            शरद गौरीशंकर आंडगे — किराणा स्टोअर्स मोहोळ
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#4338ca', fontWeight: 700, margin: '0.3rem 0' }}>
            {t.stockTitle} (Stock Inventory Report)
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
            <span style={{ fontSize: '0.82rem', color: '#78716c', fontWeight: 700 }}>Total Inventory Value:</span>
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

    </div>
  );
}
