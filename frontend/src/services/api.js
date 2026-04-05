import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// If BASE_URL is set to localhost in a production frontend, warn the user.
if (import.meta.env.PROD && BASE_URL.includes('localhost')) {
  console.warn('⚠️ Warning: Frontend is in production but connecting to localhost API!');
}

console.log(`🌐 API Service Initialized. Target: ${BASE_URL}`);

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Possible network or DNS error
      console.error('❌ Network/DNS Error:', error.message);
      if (error.code === 'ERR_NETWORK') {
        alert('🌐 Connection Failed: Could not reach the backend. Please verify your API URL in .env and ensure the backend is DEPLOYED.');
      }
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        alert('Session Expired. Please sign in again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
