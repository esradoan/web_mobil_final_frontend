import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiration');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      console.log('User profile fetched:', response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Don't call logout here to avoid infinite loop
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiration');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAccessToken = useCallback(async (refreshToken) => {
    // Validate refresh token before making request
    if (!refreshToken || refreshToken === 'undefined' || refreshToken.trim() === '') {
      console.warn('Refresh token is missing or invalid. Logging out...');
      logout();
      return;
    }

    try {
      const response = await api.post('/auth/refresh', {
        RefreshToken: refreshToken,
      });
      
      const { AccessToken, RefreshToken: newRefreshToken, Expiration } = response.data;
      localStorage.setItem('accessToken', AccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      if (Expiration) {
        localStorage.setItem('tokenExpiration', Expiration);
      }
      
      await fetchUserProfile();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  }, [fetchUserProfile, logout]);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('accessToken');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    
    if (token) {
      // Token expiration kontrolü
      if (tokenExpiration) {
        const expirationDate = new Date(tokenExpiration);
        if (expirationDate < new Date()) {
          // Token süresi dolmuş, refresh token ile yenile
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken && refreshToken !== 'undefined' && refreshToken.trim() !== '') {
            refreshAccessToken(refreshToken);
          } else {
            // Refresh token yok veya geçersiz, logout
            console.warn('Refresh token is missing or invalid. Logging out...');
            logout();
            setLoading(false);
            return;
          }
        } else {
          // Token hala geçerli
          fetchUserProfile();
        }
      } else {
        // Expiration bilgisi yok, direkt fetch
        fetchUserProfile();
      }
    } else {
      setLoading(false);
    }
  }, [refreshAccessToken, fetchUserProfile, logout]);

  const login = async (email, password, rememberMe = false) => {
    try {
      // Backend'e uygun format (C# property naming: PascalCase)
      const response = await api.post('/auth/login', { 
        Email: email, 
        Password: password,
        RememberMe: rememberMe 
      });
      
      // Backend TokenDto döndürüyor: AccessToken, RefreshToken, Expiration (PascalCase)
      // Hem PascalCase hem camelCase destekle
      const data = response.data;
      const AccessToken = data.AccessToken || data.accessToken;
      const RefreshToken = data.RefreshToken || data.refreshToken;
      const Expiration = data.Expiration || data.expiration;
      
      // Debug için response'u logla
      console.log('Login response:', response.data);
      
      // Token'ları kontrol et
      if (!AccessToken) {
        console.error('AccessToken missing in response:', response.data);
        throw new Error('Access token not received from server');
      }
      if (!RefreshToken) {
        console.error('RefreshToken missing in response:', response.data);
        throw new Error('Refresh token not received from server');
      }
      
      // Token'ları localStorage'a kaydet (sırayla, senkron)
      localStorage.setItem('accessToken', AccessToken);
      localStorage.setItem('refreshToken', RefreshToken);
      if (Expiration) {
        // Expiration DateTime string olarak geliyor, direkt kaydet
        localStorage.setItem('tokenExpiration', Expiration);
      }
      
      // Token'ların kaydedildiğini doğrula
      const savedAccessToken = localStorage.getItem('accessToken');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!savedAccessToken || !savedRefreshToken) {
        throw new Error('Failed to save tokens to localStorage');
      }
      
      // Kısa bir delay ekle (token'ların localStorage'a yazılması için)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // User bilgisini almak için /users/me endpoint'ini çağır
      // Token'lar kaydedildikten sonra çağır
      await fetchUserProfile();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Hata durumunda token'ları temizle
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiration');
      
      const errorMessage = error.response?.data?.Detailed || 
                          error.response?.data?.Message ||
                          error.response?.data?.message ||
                          error.message || 
                          'Login failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      // Backend'den gelen hata mesajını al
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        // Backend exception middleware formatı
        errorMessage = error.response.data.Detailed || 
                      error.response.data.Message ||
                      error.response.data.message ||
                      error.response.data.title ||
                      'Registration failed';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Network hatası kontrolü
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Backend bağlantı hatası. Backend\'in çalıştığından emin olun (http://localhost:5000)';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserProfile,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

