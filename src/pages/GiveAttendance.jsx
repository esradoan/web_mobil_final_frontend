import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { MapPin, CheckCircle, AlertCircle, Navigation, QrCode } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import MapView from '../components/MapView';
import { useGPSLocation } from '../components/GPSLocationHandler';
import api from '../config/api';
import toast from 'react-hot-toast';

const GiveAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/sessions/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error('Session yüklenemedi:', error);
      toast.error('Yoklama oturumu bulunamadı');
      navigate('/my-attendance');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleLocationSuccess = (locationData) => {
    setLocation(locationData);
    if (session) {
      const dist = calculateDistance(
        locationData.latitude,
        locationData.longitude,
        session.latitude,
        session.longitude
      );
      setDistance(dist);
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      toast.error('Lütfen konumunuzu alın');
      return;
    }

    if (!sessionId) {
      toast.error('Yoklama oturumu bulunamadı');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📤 Sending check-in request:', {
        sessionId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        deviceType: location.deviceType
      });

      const response = await api.post(`/attendance/sessions/${sessionId}/checkin`, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        deviceType: location.deviceType || 'unknown', // Cihaz tipi: 'mobile' veya 'desktop'
        speed: location.speed ?? null, // Hız bilgisi varsa
        altitude: location.altitude ?? null, // Yükseklik bilgisi varsa
        isMockLocation: null, // Frontend'de tespit edilemez, backend'de kontrol edilir
      });

      console.log('✅ Check-in response:', response.data);

      if (response.data?.isFlagged) {
        toast.success(`Yoklama kaydedildi ancak şüpheli konum tespit edildi: ${response.data.flagReason || ''}`, {
          duration: 4000
        });
      } else {
        toast.success('Yoklama başarıyla kaydedildi!');
      }
      
      setTimeout(() => {
        navigate('/my-attendance');
      }, 2000);
    } catch (error) {
      console.error('❌ Check-in error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Yoklama verilemedi';
      const errorType = error.response?.data?.error;
      
      if (errorType === 'DistanceExceeded') {
        toast.error(`Mesafe çok uzak: ${error.response?.data?.distance?.toFixed(1) || 'N/A'}m. Lütfen sınıfa yakın olun.`, {
          duration: 5000
        });
      } else {
        toast.error(errorMessage, {
          duration: 4000
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const { location: currentLocation, loading: locationLoading, error: locationError, getCurrentLocation } = useGPSLocation();
  
  const handleGetLocation = () => {
    getCurrentLocation(handleLocationSuccess, (err) => {
      toast.error(err.message || 'Konum alınamadı');
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  const markers = [
    {
      lat: session.latitude,
      lng: session.longitude,
      popup: 'Sınıf Konumu',
    },
  ];

  if (location) {
    markers.push({
      lat: location.latitude,
      lng: location.longitude,
      popup: 'Sizin Konumunuz',
    });
  }

  const circle = {
    lat: session.latitude,
    lng: session.longitude,
    radius: session.geofenceRadius * 1000, // Convert to meters
    popup: 'Geofence Radius',
  };

  const isWithinRange = distance !== null && distance <= (session.geofenceRadius + 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Yoklama Ver
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {session.section?.course?.code} - {session.section?.course?.name}
            </p>
          </div>
          <motion.button
            onClick={() => navigate(`/attendance/qr/${sessionId}`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            QR Kod ile Yoklama
          </motion.button>
        </motion.div>

        {/* Session Info */}
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="w-5 h-5" />
                <span>Sınıf: {session.classroom?.building} {session.classroom?.roomNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span>Tarih: {new Date(session.date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span>Saat: {session.startTime} - {session.endTime}</span>
              </div>
            </div>
          </GlassCard>
        </AnimatedCard>

        {/* Map */}
        <AnimatedCard delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Konum Haritası
            </h2>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapView
                center={[session.latitude, session.longitude]}
                markers={markers}
                circle={circle}
              />
            </div>
          </GlassCard>
        </AnimatedCard>

        {/* Location Status */}
        <AnimatedCard delay={0.3}>
          <GlassCard className="p-6">
            {!location ? (
              <div className="text-center">
                <motion.button
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  whileHover={{ scale: locationLoading ? 1 : 1.05 }}
                  whileTap={{ scale: locationLoading ? 1 : 0.95 }}
                  className="btn-primary w-full"
                >
                  {locationLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Konum alınıyor...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Navigation className="w-5 h-5" />
                      Konumumu Al
                    </span>
                  )}
                </motion.button>
                {locationError && (
                  <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                    {locationError}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Device Type Info */}
                {location.deviceType && (
                  <div className={`p-3 rounded-lg text-sm ${
                    location.deviceType === 'mobile' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  }`}>
                    {location.deviceType === 'mobile' ? (
                      <p>📱 <strong>Mobil Cihaz:</strong> Yüksek doğruluklu GPS konumunuz alındı.</p>
                    ) : (
                      <p>💻 <strong>Masaüstü:</strong> IP/WiFi tabanlı konumunuz alındı (düşük doğruluk normaldir).</p>
                    )}
                  </div>
                )}

                {/* Distance and Accuracy Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Mesafe</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {distance?.toFixed(1) || '0'} m
                    </p>
                    <div className="mt-2">
                      {isWithinRange ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>Uygun Mesafe</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Çok Uzak</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Doğruluk</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {location.accuracy?.toFixed(1) || 'N/A'} m
                    </p>
                    <div className="mt-2">
                      {(() => {
                        const acc = location.accuracy || 0;
                        let color, icon, text;
                        if (acc < 20) {
                          color = 'text-green-600 dark:text-green-400';
                          icon = <CheckCircle className="w-4 h-4" />;
                          text = 'Mükemmel';
                        } else if (acc < 50) {
                          color = 'text-yellow-600 dark:text-yellow-400';
                          icon = <AlertCircle className="w-4 h-4" />;
                          text = 'İyi';
                        } else if (acc < 100) {
                          color = 'text-orange-600 dark:text-orange-400';
                          icon = <AlertCircle className="w-4 h-4" />;
                          text = 'Kabul Edilebilir';
                        } else {
                          color = 'text-red-600 dark:text-red-400';
                          icon = <AlertCircle className="w-4 h-4" />;
                          text = 'Düşük';
                        }
                        return (
                          <div className={`flex items-center gap-1 ${color} text-xs`}>
                            {icon}
                            <span>{text}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleCheckIn}
                  disabled={submitting || !isWithinRange}
                  whileHover={{ scale: submitting || !isWithinRange ? 1 : 1.02 }}
                  whileTap={{ scale: submitting || !isWithinRange ? 1 : 0.98 }}
                  className={`w-full btn-primary ${!isWithinRange ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Kaydediliyor...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Yoklamaya Katıl
                    </span>
                  )}
                </motion.button>
              </div>
            )}
          </GlassCard>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default GiveAttendance;

