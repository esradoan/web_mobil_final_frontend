import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { MapPin, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
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

    try {
      setSubmitting(true);
      const response = await api.post(`/attendance/sessions/${sessionId}/checkin`, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      if (response.data.isFlagged) {
        toast.success('Yoklama kaydedildi ancak şüpheli konum tespit edildi');
      } else {
        toast.success('Yoklama başarıyla kaydedildi!');
      }
      
      setTimeout(() => {
        navigate('/my-attendance');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Yoklama verilemedi');
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
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Yoklama Ver
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {session.section?.course?.code} - {session.section?.course?.name}
          </p>
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
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Mesafe</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {distance?.toFixed(1) || '0'} m
                    </p>
                  </div>
                  <div>
                    {isWithinRange ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold">Uygun Mesafe</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-6 h-6" />
                        <span className="font-semibold">Çok Uzak</span>
                      </div>
                    )}
                  </div>
                </div>

                <motion.button
                  onClick={handleCheckIn}
                  disabled={submitting || !isWithinRange}
                  whileHover={{ scale: submitting || !isWithinRange ? 1 : 1.02 }}
                  whileTap={{ scale: submitting || !isWithinRange ? 1 : 0.98 }}
                  className={`w-full btn-primary ${!isWithinRange ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Kaydediliyor...' : 'Yoklama Ver'}
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

