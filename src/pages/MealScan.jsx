import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  Clock, 
  MapPin,
  UtensilsCrossed,
  RefreshCw,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MealScan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Check if user has permission (Admin or Faculty)
  useEffect(() => {
    if (user) {
      const userRole = user?.role || user?.Role;
      const isAdmin = userRole === 'Admin' || userRole === 'admin' || userRole === 0;
      const isFaculty = userRole === 'Faculty' || userRole === 'faculty' || userRole === 1;
      
      console.log('🔍 MealScan - User role check:', {
        userRole,
        isAdmin,
        isFaculty,
        userObject: user
      });
      
      if (!isAdmin && !isFaculty) {
        toast.error('Bu sayfaya erişim için Admin veya Faculty yetkisi gereklidir');
        navigate('/dashboard');
        return;
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      // Cleanup: Stop scanner on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError('');
      setReservation(null);
      
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // QR code detected
          handleQrCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Ignore errors (they're just "no QR code found" messages)
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Kamera erişimi başarısız. Lütfen kamera iznini kontrol edin.');
      setScanning(false);
      toast.error('Kamera başlatılamadı');
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setScanning(false);
      setError('');
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleQrCodeDetected = async (decodedText) => {
    // Stop scanning
    await stopScanning();
    
    // Validate QR code
    if (!decodedText || decodedText.trim() === '') {
      setError('Geçersiz QR kod');
      toast.error('Geçersiz QR kod');
      return;
    }

    // Trim whitespace
    const cleanedQrCode = decodedText.trim();
    setQrCode(cleanedQrCode);
    await validateQrCode(cleanedQrCode);
  };

  const validateQrCode = async (qrCodeText) => {
    setLoading(true);
    setError('');
    setReservation(null);

    // Trim and validate QR code
    const cleanedQrCode = qrCodeText?.trim() || '';
    if (!cleanedQrCode) {
      setError('QR kod boş olamaz');
      toast.error('QR kod boş olamaz');
      setLoading(false);
      return;
    }

    console.log('Validating QR code:', cleanedQrCode);
    
    // Debug: Check token
    const token = localStorage.getItem('accessToken');
    console.log('🔍 Token exists:', !!token);
    console.log('🔍 Token length:', token?.length || 0);
    if (token) {
      try {
        // Decode JWT token to check roles (without verification)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);
        console.log('🔍 Decoded token roles:', decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'No role found');
        console.log('🔍 Decoded token claims:', Object.keys(decoded));
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    try {
      // Sadece doğrulama yap, status'u değiştirme
      const response = await api.post('/meals/reservations/validate', {
        qrCode: cleanedQrCode
      });

      if (response.data.reservation) {
        setReservation(response.data.reservation);
        toast.success('Rezervasyon bulundu!');
      } else {
        setError('Rezervasyon bulunamadı');
        toast.error('Rezervasyon bulunamadı');
      }
    } catch (error) {
      console.error('Error validating QR code:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 403) {
        const errorMessage = 'Bu işlem için Admin veya Faculty yetkisi gereklidir. Lütfen çıkış yapıp tekrar giriş yapın.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'QR kod doğrulanırken hata oluştu';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Backend error message:', errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'QR kod doğrulanırken hata oluştu';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUse = async () => {
    if (!reservation || !qrCode) return;

    setProcessing(true);
    try {
      const cleanedQrCode = qrCode.trim();
      console.log('Confirming use for QR code:', cleanedQrCode);
      
      const response = await api.post('/meals/reservations/use', {
        qrCode: cleanedQrCode
      });

      if (response.status === 200) {
        toast.success('Yemek kullanımı onaylandı!');
        // Refresh reservation data
        if (response.data.reservation) {
          setReservation(response.data.reservation);
        } else {
          // If reservation is updated, clear and allow new scan
          setReservation(null);
          setQrCode('');
          setError('');
        }
      }
    } catch (error) {
      console.error('Error confirming use:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 'Yemek kullanımı onaylanırken hata oluştu';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    const cleanedQrCode = qrCode.trim();
    if (!cleanedQrCode) {
      toast.error('Lütfen QR kod girin');
      return;
    }
    setQrCode(cleanedQrCode);
    validateQrCode(cleanedQrCode);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <QrCode className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              QR Kod Okutma
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Yemek rezervasyonu QR kodunu okutun veya manuel olarak girin
            </p>
          </div>

          {/* Scanner Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                QR Kod Okutucu
              </h2>
              <div className="flex gap-2">
                {!manualInput && (
                  <button
                    onClick={() => {
                      setManualInput(true);
                      stopScanning();
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm"
                  >
                    Manuel Giriş
                  </button>
                )}
                {manualInput && (
                  <button
                    onClick={() => {
                      setManualInput(false);
                      setQrCode('');
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm"
                  >
                    Kamera
                  </button>
                )}
              </div>
            </div>

            {!manualInput ? (
              <div>
                {/* QR Scanner */}
                <div id="reader" className="w-full mb-4 rounded-lg overflow-hidden bg-black"></div>

                {!scanning && (
                  <button
                    onClick={startScanning}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Camera className="w-5 h-5" />
                    Taramayı Başlat
                  </button>
                )}

                {scanning && (
                  <button
                    onClick={stopScanning}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 dark:bg-red-500 dark:hover:bg-red-600"
                  >
                    <XCircle className="w-5 h-5" />
                    Taramayı Durdur
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    QR Kod
                  </label>
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="QR kod değerini girin"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleManualSubmit}
                  disabled={loading || !qrCode.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Doğrula
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">Hata</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reservation Info */}
          {reservation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Rezervasyon Bilgileri
                </h2>
                {(reservation.status?.toLowerCase() === 'used' || reservation.Status?.toLowerCase() === 'used') && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Kullanıldı
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kullanıcı</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {reservation.userName || reservation.UserName || 'Bilinmiyor'}
                    </p>
                    {reservation.userEmail && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reservation.userEmail || reservation.UserEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tarih</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(reservation.date || reservation.Date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Öğün</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {(reservation.mealType || reservation.MealType || 'lunch').toLowerCase() === 'lunch' 
                          ? 'Öğle Yemeği' 
                          : 'Akşam Yemeği'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cafeteria */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Yemekhane</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {reservation.cafeteriaName || reservation.CafeteriaName || 'Bilinmiyor'}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                {(reservation.menuItems || reservation.MenuItems) && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Menü</p>
                    </div>
                    <ul className="space-y-1">
                      {(reservation.menuItems || reservation.MenuItems || []).map((item, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                {(reservation.status?.toLowerCase() !== 'used' && reservation.Status?.toLowerCase() !== 'used') && (
                  <button
                    onClick={handleConfirmUse}
                    disabled={processing}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Onaylanıyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Kullanımı Onayla
                      </>
                    )}
                  </button>
                )}

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setReservation(null);
                    setQrCode('');
                    setError('');
                    stopScanning();
                  }}
                  className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Yeni Tarama
                </button>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          {!reservation && !scanning && !manualInput && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Kullanım Talimatları
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1">1.</span>
                  <span>"Taramayı Başlat" butonuna tıklayın ve kamera iznini verin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">2.</span>
                  <span>QR kodu kameraya gösterin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">3.</span>
                  <span>Rezervasyon bilgileri otomatik olarak yüklenecektir</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">4.</span>
                  <span>"Kullanımı Onayla" butonuna tıklayarak yemeği onaylayın</span>
                </li>
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default MealScan;

