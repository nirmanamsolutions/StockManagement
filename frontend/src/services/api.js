import axios from 'axios';

let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Normalize URL: strip trailing slashes
rawBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
// Ensure it ends with /api
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Stock API Services
export const stockAPI = {
  getAll: (search = '', category = '') =>
    api.get(`/stock?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  getById: (id) => api.get(`/stock/${id}`),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  delete: (id) => api.delete(`/stock/${id}`),
  getPdfReport: () => api.get('/stock/pdf-report'),
};

// Billing API Services
export const billAPI = {
  create: (billData) => api.post('/bills', billData),
  getAll: (status = '', search = '', date = '') =>
    api.get(`/bills?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&date=${encodeURIComponent(date)}`),
  getById: (id) => api.get(`/bills/${id}`),
};

// Katha Ledger API Services
export const ledgerAPI = {
  getCustomers: (search = '') => api.get(`/ledger/customers?search=${encodeURIComponent(search)}`),
  addCustomer: (data) => api.post('/ledger/customers', data),
  getCustomerDetails: (customerId) => api.get(`/ledger/history/${customerId}`),
  recordPayment: (paymentData) => api.post('/ledger/pay', paymentData),
  getWhatsAppReminder: (customerId, storeName = 'आमचे दुकान') =>
    api.get(`/ledger/whatsapp/${customerId}?storeName=${encodeURIComponent(storeName)}`),
};

export default api;
