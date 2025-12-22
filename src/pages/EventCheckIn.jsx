import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  AlertCircle,
  X,
  Users,
  Tag,
  DollarSign
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EventCheckIn = () => {
  const { eventId: urlEventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(urlEventId ? parseInt(urlEventId) : null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const html5QrCodeRef = useRef(null);

  // Check if user has permission (Admin or Faculty)
  useEffect(() => {
    if (user) {
      const userRole = user?.role || user?.Role;
      const isAdmin = userRole === 'Admin' || userRole === 'admin' || userRole === 0;
      const isFaculty = userRole === 'Faculty' || userRole === 'faculty' || userRole === 1;
      
      if (!isAdmin && !isFaculty) {
        toast.error('Bu sayfaya erişim için Admin veya Faculty yetkisi gereklidir');
        navigate('/dashboard');
        return;
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup: Stop scanner on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await api.get('/events');
      const data = response.data.data || [];
      // Filter only upcoming or today's events
      const now = new Date();
      const filteredEvents = data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now.setHours(0, 0, 0, 0) && event.status !== 'cancelled';
      });
      setEvents(filteredEvents);
      
      // If URL has eventId, set it
      if (urlEventId && !selectedEventId) {
        const eventExists = filteredEvents.find(e => e.id === parseInt(urlEventId));
        if (eventExists) {
          setSelectedEventId(parseInt(urlEventId));
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Etkinlikler yüklenirken hata oluştu');
    } finally {
      setLoadingEvents(false);
    }
  };

  const resetScanner = () => {
    setQrCode('');
    setRegistration(null);
    setError('');
    setLoading(false);
    setProcessing(false);
    setManualInput(false);
    stopScanning();
  };

  const startScanning = async () => {
    if (!selectedEventId) {
      toast.error('Lütfen önce bir etkinlik seçin');
      return;
    }

    try {
      setScanning(true);
      setError('');
      setRegistration(null);
      setQrCode('');
      setManualInput(false);
      
      // Wait for DOM to update and render the reader element
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if element exists
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        setScanning(false);
        toast.error('QR kod okuma alanı bulunamadı. Lütfen sayfayı yenileyin.');
        return;
      }
      
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
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
      toast.success('Kamera başlatıldı, QR kod taraması bekleniyor...');
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Kamera erişimi başarısız. Lütfen kamera iznini kontrol edin.');
      setScanning(false);
      toast.error(err.message || 'Kamera başlatılamadı');
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
      console.error('Error stopping camera:', err);
    }
  };

  const handleQrCodeDetected = async (decodedText) => {
    await stopScanning();
    
    if (!decodedText || decodedText.trim() === '') {
      setError('Geçersiz QR kod');
      toast.error('Geçersiz QR kod');
      return;
    }

    const cleanedQrCode = decodedText.trim();
    setQrCode(cleanedQrCode);
    await checkIn(cleanedQrCode);
  };

  const checkIn = async (qrCodeText) => {
    if (!selectedEventId) {
      toast.error('Lütfen önce bir etkinlik seçin');
      return;
    }

    setLoading(true);
    setError('');
    setRegistration(null);

    console.log('Checking in QR code:', qrCodeText, 'for event:', selectedEventId);

    try {
      const response = await api.post(`/events/${selectedEventId}/checkin`, {
        qrCode: qrCodeText
      });

      if (response.data.registration) {
        setRegistration(response.data.registration);
        toast.success('Check-in başarılı!');
      } else {
        setError('Check-in başarısız');
        toast.error('Check-in başarısız');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 403) {
        const errorMessage = 'Bu işlem için Admin veya Faculty yetkisi gereklidir. Lütfen çıkış yapıp tekrar giriş yapın.';
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Check-in yapılırken hata oluştu';
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
        console.error('Backend error details:', error.response?.data);
        console.error('Full error response:', JSON.stringify(error.response?.data, null, 2));
      } else {
        const errorMessage = error.response?.data?.message || 'Check-in yapılırken beklenmeyen bir hata oluştu';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleManualInput = () => {
    setManualInput(!manualInput);
    setQrCode('');
    setRegistration(null);
    setError('');
    stopScanning();
  };

  const handleManualCheckIn = () => {
    if (!qrCode.trim()) {
      setError('Lütfen bir QR kod değeri girin');
      toast.error('Lütfen bir QR kod değeri girin');
      return;
    }
    checkIn(qrCode.trim());
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'conference':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'workshop':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'social':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'sports':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (user && !((user?.role || user?.Role) === 'Admin' || (user?.role || user?.Role) === 'Faculty')) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
              <QrCode className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Etkinlik Check-in
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Etkinlik katılımcılarının QR kodlarını okutun
            </p>
          </div>

          {/* Event Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etkinlik Seçin
            </label>
            {loadingEvents ? (
              <LoadingSpinner size="sm" />
            ) : (
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Etkinlik seçin...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {formatDate(event.date)}
                  </option>
                ))}
              </select>
            )}
            {selectedEventId && events.find(e => e.id === selectedEventId) && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  {events.find(e => e.id === selectedEventId)?.title}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(events.find(e => e.id === selectedEventId)?.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(events.find(e => e.id === selectedEventId)?.startTime)} - {formatTime(events.find(e => e.id === selectedEventId)?.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{events.find(e => e.id === selectedEventId)?.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {events.find(e => e.id === selectedEventId)?.registeredCount}/{events.find(e => e.id === selectedEventId)?.capacity}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={toggleManualInput}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  manualInput
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                Manuel Giriş
              </button>
              <button
                onClick={startScanning}
                disabled={scanning || !selectedEventId}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  scanning
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : !selectedEventId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                {scanning ? <LoadingSpinner size="sm" color="white" /> : <Camera className="w-5 h-5" />}
                {scanning ? 'Taranıyor...' : 'Kamera ile Tara'}
              </button>
              {scanning && (
                <button
                  onClick={stopScanning}
                  className="px-6 py-3 rounded-lg font-semibold transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Durdur
                </button>
              )}
            </div>

            {manualInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QR Kod</label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="QR kod değerini girin"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={loading || !qrCode.trim() || !selectedEventId}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {loading ? <LoadingSpinner size="sm" color="white" /> : <CheckCircle className="w-5 h-5" />}
                  Check-in Yap
                </button>
              </motion.div>
            )}

            {!manualInput && (
              <div className="mt-4 flex flex-col items-center">
                {scanning ? (
                  <>
                    <div id="reader" className="w-full max-w-sm border-2 border-blue-500 rounded-lg overflow-hidden bg-black" style={{ minHeight: '250px' }}></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">QR kodu kameraya gösterin...</p>
                  </>
                ) : (
                  <div className="w-full max-w-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-slate-700" style={{ minHeight: '250px' }}>
                    <p className="text-gray-500 dark:text-gray-400 text-center px-4">
                      Kamera ile taramak için "Kamera ile Tara" butonuna tıklayın
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {registration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700"
              >
                <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Check-in Başarılı!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Katılımcı:</p>
                    <p className="font-semibold">{registration.userName || registration.UserName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Etkinlik:</p>
                    <p className="font-semibold">{registration.eventTitle || registration.EventTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-in Zamanı:</p>
                    <p className="font-semibold">
                      {registration.checkedInAt || registration.CheckedInAt
                        ? new Date(registration.checkedInAt || registration.CheckedInAt).toLocaleString('tr-TR')
                        : 'Şimdi'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Durum:</p>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" />
                      Giriş Yapıldı
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={resetScanner}
                    className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Yeni Check-in
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EventCheckIn;

