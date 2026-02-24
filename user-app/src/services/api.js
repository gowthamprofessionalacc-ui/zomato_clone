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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const signup = (name, email, password) => api.post('/auth/signup', { name, email, password, role: 'user' });

// Hotels & Foods
export const getHotels = () => api.get('/hotels');
export const getHotel = (id) => api.get(`/hotels/${id}`);
export const getFoods = (params) => api.get('/foods', { params });
export const getFoodsByHotel = (hotelId) => api.get(`/foods/hotel/${hotelId}`);

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (food_id, quantity = 1) => api.post('/cart', { food_id, quantity });
export const updateCartItem = (itemId, quantity) => api.put(`/cart/item/${itemId}`, { quantity });
export const clearCart = () => api.delete('/cart');

// Orders
export const createOrder = (delivery_lat, delivery_lng, coupon_code) => 
  api.post('/orders', { delivery_lat, delivery_lng, coupon_code });
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const getActiveOrder = () => api.get('/orders/active');
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel`);

export default api;
