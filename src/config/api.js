import axios from 'axios';

// API Base URL Configuration
// Environment variable'dan al, yoksa default localhost kullan
// Local: .env.local dosyasında VITE_API_BASE_URL=http://localhost:5226/api/v1
// Production: Railway'de environment variable olarak VITE_API_BASE_URL ayarla
const getApiBaseUrl = () => {
  // Environment variable varsa onu kullan (hem local hem production için)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('Using API URL from environment:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback: Local development için default
  const defaultUrl = 'http://localhost:5226/api/v1';
  console.warn('VITE_API_BASE_URL not set, using default:', defaultUrl);
  console.warn('For local development, create .env.local file with VITE_API_BASE_URL');
  return defaultUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout süresini artır (30 saniye)
  timeout: 30000,
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'undefined' && token.trim() !== '') {
      // Ensure Bearer prefix is correct
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Connection refused hatası
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('Backend bağlantı hatası! Backend\'in çalıştığından emin olun.');
      console.error('Beklenen URL:', API_BASE_URL);
      const isProduction = import.meta.env.PROD;
      const errorMessage = isProduction
        ? 'Backend bağlantı hatası. Lütfen backend servisinin çalıştığından emin olun.'
        : `Backend bağlantı hatası. Backend'in çalıştığından emin olun. (${API_BASE_URL})`;
      return Promise.reject({
        ...error,
        message: errorMessage,
      });
    }

    // Timeout hatası
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('Backend yanıt vermiyor (timeout)!');
      console.error('Beklenen URL:', API_BASE_URL);
      const isProduction = import.meta.env.PROD;
      const errorMessage = isProduction
        ? 'Backend yanıt vermiyor. Lütfen backend servisinin çalıştığından emin olun.'
        : `Backend yanıt vermiyor. Lütfen backend'in çalıştığından emin olun. (${API_BASE_URL})`;
      return Promise.reject({
        ...error,
        message: errorMessage,
      });
    }

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken && refreshToken !== 'undefined' && refreshToken.trim() !== '') {
          // Backend RefreshTokenDto bekliyor: RefreshToken (PascalCase)
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            RefreshToken: refreshToken,
          });

          // Backend TokenDto döndürüyor: AccessToken, RefreshToken, Expiration (PascalCase)
          const { AccessToken, RefreshToken: newRefreshToken, Expiration } = response.data;
          localStorage.setItem('accessToken', AccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          if (Expiration) {
            localStorage.setItem('tokenExpiration', Expiration);
          }

          originalRequest.headers.Authorization = `Bearer ${AccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiration');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
