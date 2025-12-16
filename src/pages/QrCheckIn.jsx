import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { QrCode, CheckCircle, AlertCircle, Camera, X } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import { useGPSLocation } from '../components/GPSLocationHandler';
import api from '../config/api';
import toast from 'react-hot-toast';

const QrCheckIn = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [location, setLocation] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const { 
    location: currentLocation, 
    loading: locationLoading, 
    error: locationError, 
    getCurrentLocation,
    deviceType,
    isHttps
  } = useGPSLocation();

  useEffect(() => {
    fetchSession();
    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
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

  const startCamera = async () => {
    if (!isHttps) {
      toast.error('Kamera erişimi için HTTPS gerekli');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Back camera
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Kamera erişimi reddedildi:', error);
      toast.error('Kamera erişimi gerekli');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleQrCodeInput = (e) => {
    setQrCode(e.target.value);
  };

  const handleLocationSuccess = (locationData) => {
    setLocation(locationData);
  };

  const handleCheckIn = async () => {
    if (!qrCode) {
      toast.error('Lütfen QR kodunu girin veya tarayın');
      return;
    }

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
      console.log('📤 Sending QR check-in request:', {
        sessionId,
        qrCode: qrCode.substring(0, 8) + '...', // Log only first 8 chars for security
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        deviceType: location.deviceType
      });

      const response = await api.post(`/attendance/sessions/${sessionId}/checkin-qr`, {
        qrCode: qrCode,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        deviceType: location.deviceType || 'unknown',
        timestamp: location.timestamp,
        isMockLocation: location.isMockLocation,
      });

      console.log('✅ QR check-in response:', response.data);

      if (response.data?.success !== false) {
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
      } else {
        toast.error(response.data?.message || 'Yoklama verilemedi');
      }
    } catch (error) {
      console.error('❌ QR check-in error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Yoklama verilemedi';
      const errorType = error.response?.data?.error;
      
      if (errorType === 'QrCheckInFailed') {
        toast.error(errorMessage, {
          duration: 4000
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
    return (
      <Layout>
        <AnimatedCard>
          <GlassCard className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Yoklama oturumu bulunamadı
            </p>
          </GlassCard>
        </AnimatedCard>
      </Layout>
    );
  }

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
              QR Kod ile Yoklama
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {session.courseCode} - {session.courseName}
            </p>
          </div>
        </motion.div>

        {/* Session Info */}
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <QrCode className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {session.courseCode} - Section {session.sectionNumber}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(session.date).toLocaleDateString('tr-TR')} - {session.startTime} - {session.endTime}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </AnimatedCard>

        {/* QR Code Input */}
        <AnimatedCard delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              QR Kod Tarama
            </h2>
            
            {!scanning ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    QR Kod
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrCode}
                      onChange={handleQrCodeInput}
                      placeholder="QR kodunu girin veya tarayın"
                      className="input-field flex-1"
                    />
                    <motion.button
                      onClick={startCamera}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary flex items-center gap-2"
                      disabled={!isHttps}
                    >
                      <Camera className="w-5 h-5" />
                      Kamera Aç
                    </motion.button>
                  </div>
                  {!isHttps && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Kamera erişimi için HTTPS gerekli
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                  <motion.button
                    onClick={stopCamera}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  QR kodu kameraya gösterin
                </p>
                <input
                  type="text"
                  value={qrCode}
                  onChange={handleQrCodeInput}
                  placeholder="QR kodunu manuel olarak girin"
                  className="input-field"
                />
              </div>
            )}
          </GlassCard>
        </AnimatedCard>

        {/* Location Status */}
        <AnimatedCard delay={0.3}>
          <GlassCard className="p-6">
            {!location ? (
              <div className="text-center">
                {!isHttps && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="inline-block w-4 h-4 mr-2" />
                    Konum bilgisi sadece güvenli bağlantılar (HTTPS) üzerinden alınabilir.
                  </div>
                )}
                <motion.button
                  onClick={() => getCurrentLocation(handleLocationSuccess, (err) => {
                    toast.error(err.message || 'Konum alınamadı');
                  })}
                  disabled={locationLoading || !isHttps}
                  whileHover={{ scale: (locationLoading || !isHttps) ? 1 : 1.05 }}
                  whileTap={{ scale: (locationLoading || !isHttps) ? 1 : 0.95 }}
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
                      <AlertCircle className="w-5 h-5" />
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
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Konum alındı</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Doğruluk: {location.accuracy?.toFixed(1) || 'N/A'}m
                </p>
              </div>
            )}
          </GlassCard>
        </AnimatedCard>

        {/* Check In Button */}
        <AnimatedCard delay={0.4}>
          <GlassCard className="p-6">
            <motion.button
              onClick={handleCheckIn}
              disabled={submitting || !qrCode || !location}
              whileHover={{ scale: (submitting || !qrCode || !location) ? 1 : 1.02 }}
              whileTap={{ scale: (submitting || !qrCode || !location) ? 1 : 0.98 }}
              className={`w-full btn-primary ${(!qrCode || !location) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          </GlassCard>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default QrCheckIn;

