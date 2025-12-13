import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------
// ALWAYS attach token to request
// -----------------------------
api.interceptors.request.use(
  (config) => {
    const token = window.__accessToken; // VERY IMPORTANT

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('TOKEN SENT:', token);
    } else {
      console.log('NO TOKEN FOUND!');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/token'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAnalytics: () => api.get('/analytics/stats'),
  getSalesAnalysis: (params) => api.get('/analytics/sales', { params }), // { period, date, year, month }
  getGstReport: () => api.get('/reports/gst'),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  loginOtp: (data) => api.post('/auth/login-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  // Notifications
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/read-all'),
};

export default api;
