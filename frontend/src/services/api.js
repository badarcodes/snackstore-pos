import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach bearer token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('snack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to catch 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are already on login
      if (window.location.pathname !== '/login' && !error.config.url.includes('/auth/me')) {
        localStorage.removeItem('snack_token');
        localStorage.removeItem('snack_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  toggleStatus: (id) => api.patch(`/products/${id}/toggle-status`),
  getCategories: () => api.get('/products/categories'),
  createCategory: (data) => api.post('/products/categories', data),
};

export const stockAPI = {
  getOverview: () => api.get('/stock/overview'),
  adjust: (data) => api.post('/stock/adjust', data),
  purchase: (data) => api.post('/stock/purchase', data),
  getMovements: (params) => api.get('/stock/movements', { params }),
  getSuppliers: () => api.get('/stock/suppliers'),
};

export const posAPI = {
  getProducts: () => api.get('/pos/products'),
  checkout: (data) => api.post('/pos/checkout', data),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  cancel: (id, reason) => api.post(`/transactions/${id}/cancel`, { reason }),
};

export const cashSessionAPI = {
  getActive: () => api.get('/cash-sessions/active'),
  open: (data) => api.post('/cash-sessions/open', data),
  close: (id, data) => api.post(`/cash-sessions/${id}/close`, data),
  addMovement: (id, data) => api.post(`/cash-sessions/${id}/movement`, data),
  getHistory: (params) => api.get('/cash-sessions/history', { params }),
};

export const financeAPI = {
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  createExpense: (data) => api.post('/finance/expenses', data),
  getIncomes: (params) => api.get('/finance/incomes', { params }),
  createIncome: (data) => api.post('/finance/incomes', data),
  getSummary: (params) => api.get('/finance/summary', { params }),
};

export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getStockValuation: () => api.get('/reports/stock-valuation'),
  getAuditLogs: (params) => api.get('/reports/audit-logs', { params }),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
};

export const settingAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.post('/settings', data),
};

export default api;
