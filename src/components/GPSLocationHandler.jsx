import { useState } from 'react';

export const useGPSLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = (onSuccess, onError) => {
    if (!navigator.geolocation) {
      const errorMsg = 'Tarayıcınız GPS desteklemiyor';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(locationData);
        setLoading(false);
        if (onSuccess) onSuccess(locationData);
      },
      (err) => {
        let errorMessage = 'Konum alınamadı';
        switch (err.code) {
          case 1:
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
            break;
          case 2:
            errorMessage = 'Konum bilgisi alınamadı. Lütfen tekrar deneyin.';
            break;
          case 3:
            errorMessage = 'İstek zaman aşımına uğradı.';
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

