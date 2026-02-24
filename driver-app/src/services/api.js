import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('driver_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const signup = (name, email, password) => api.post('/auth/signup', { name, email, password, role: 'driver' });

// Driver
export const goOnline = (lat, lng) => api.post('/driver/go-online', { lat, lng });
export const goOffline = () => api.post('/driver/go-offline');
export const updateLocation = (lat, lng) => api.post('/driver/location', { lat, lng });
export const getCurrentOrder = () => api.get('/driver/current-order');
export const getDriverStats = () => api.get('/driver/stats');

// Order actions
export const acceptOrder = (orderId) => api.post(`/driver/order/${orderId}/accept`);
export const pickupOrder = (orderId) => api.post(`/driver/order/${orderId}/pickup`);
export const startDelivery = (orderId) => api.post(`/driver/order/${orderId}/start-delivery`);
export const completeOrder = (orderId, otp) => api.post(`/driver/order/${orderId}/complete`, { otp });

// Wallet
export const getWalletBalance = () => api.get('/wallet/balance');
export const getTransactions = () => api.get('/wallet/transactions');

export default api;
