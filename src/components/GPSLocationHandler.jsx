import { useState } from 'react';

/**
 * Mobil cihaz tespiti
 * User Agent ve ekran boyutuna göre cihaz tipini belirler
 */
const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobile = mobileRegex.test(userAgent.toLowerCase());
  const isSmallScreen = window.innerWidth < 768;
  return isMobile || isSmallScreen;
};

/**
 * HTTPS kontrolü
 * GPS API'si güvenlik nedeniyle HTTPS gerektirir (localhost hariç)
 */
const isSecureContext = () => {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
};

export const useGPSLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = (onSuccess, onError) => {
    // 1. HTTPS kontrolü
    if (!isSecureContext()) {
      const errorMsg = 'GPS için HTTPS bağlantısı gereklidir. Lütfen HTTPS üzerinden bağlanın.';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    // 2. Geolocation API kontrolü
    if (!navigator.geolocation) {
      const errorMsg = 'Tarayıcınız GPS desteklemiyor';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    setLoading(true);
    setError(null);

    // 3. Cihaz tipini belirle
    const deviceType = isMobileDevice() ? 'mobile' : 'desktop';

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Masaüstünde daha uzun sürebilir
      maximumAge: 0, // Her zaman yeni konum al
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? null, // Varsa
          altitudeAccuracy: position.coords.altitudeAccuracy ?? null, // Varsa
          heading: position.coords.heading ?? null, // Varsa (yön)
          speed: position.coords.speed ?? null, // Varsa (hız m/s)
          deviceType: deviceType, // Cihaz tipi: 'mobile' veya 'desktop'
          timestamp: position.timestamp,
        };
        setLocation(locationData);
        setLoading(false);
        if (onSuccess) onSuccess(locationData);
      },
      (err) => {
        let errorMessage = 'Konum alınamadı';
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Konum bilgisi alınamadı. Lütfen tekrar deneyin.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
            break;
          default:
            errorMessage = 'Bilinmeyen bir hata oluştu.';
        }
        setError(errorMessage);
        setLoading(false);
        if (onError) onError(err);
      },
      options
    );
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation,
  };
};

export default useGPSLocation;

