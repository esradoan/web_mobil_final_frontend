import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  QrCode,
  CheckCircle,
  XCircle,
  Tag,
  Trash2,
  Maximize2,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const MyEvents = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events/my-events');
      const data = response.data.data || [];
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Etkinlik kayıtları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (registrationId) => {
    if (!registrationId) {
      toast.error('Kayıt ID bulunamadı');
      return;
    }

    if (!window.confirm('Bu etkinlik kaydını iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    setCancelling(registrationId);
    try {
      await api.delete(`/events/registrations/${registrationId}`);
      toast.success('Etkinlik kaydı başarıyla iptal edildi');
      fetchRegistrations();
    } catch (error) {
      console.error('Error cancelling registration:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Kayıt iptal edilirken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  const handleShowQr = (registration) => {
    setSelectedRegistration(registration);
    setShowQrModal(true);
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

  const getStatusBadge = (registration) => {
    const status = registration.status || registration.Status || '';
    const checkedIn = registration.checkedIn || registration.CheckedIn || false;
    const eventDate = new Date(registration.eventDate || registration.EventDate);
    const now = new Date();

    if (status.toLowerCase() === 'cancelled') {
      return (
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          İptal Edildi
        </span>
      );
    }

    if (checkedIn) {
      return (
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Giriş Yapıldı
        </span>
      );
    }

    if (eventDate < now) {
      return (
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Geçmiş
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Kayıtlı
      </span>
    );
  };

  const canCancel = (registration) => {
    const status = registration.status || registration.Status || '';
    if (status.toLowerCase() === 'cancelled') {
      return false;
    }

    const checkedIn = registration.checkedIn || registration.CheckedIn || false;
    if (checkedIn) {
      return false; // Check-in yapıldıysa iptal edilemez
    }

    const eventDate = new Date(registration.eventDate || registration.EventDate);
    const now = new Date();
    
    // Etkinlik tarihi geçmişse iptal edilemez
    if (eventDate < now) {
      return false;
    }

    return true;
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

  const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('QR kod değeri kopyalandı!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Kopyalama başarısız');
      }
    };

    return (
      <button
        onClick={handleCopy}
        className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-all flex-shrink-0"
        title="Kopyala"
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Separate upcoming and past events
  const now = new Date();
  const upcoming = registrations.filter(r => {
    const eventDate = new Date(r.eventDate || r.EventDate);
    return eventDate >= now && (r.status || r.Status)?.toLowerCase() !== 'cancelled';
  });
  const past = registrations.filter(r => {
    const eventDate = new Date(r.eventDate || r.EventDate);
    return eventDate < now || (r.status || r.Status)?.toLowerCase() === 'cancelled';
  });

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Etkinliklerim
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kayıt olduğunuz etkinlikleri görüntüleyin ve yönetin
            </p>
          </div>

          {/* Upcoming Events */}
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Yaklaşan Etkinlikler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcoming.map((registration) => (
                  <EventCard
                    key={registration.id || registration.Id}
                    registration={registration}
                    onShowQr={handleShowQr}
                    onCancel={handleCancel}
                    cancelling={cancelling}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    canCancel={canCancel}
                    getCategoryColor={getCategoryColor}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Geçmiş Etkinlikler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {past.map((registration) => (
                  <EventCard
                    key={registration.id || registration.Id}
                    registration={registration}
                    onShowQr={handleShowQr}
                    onCancel={handleCancel}
                    cancelling={cancelling}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    canCancel={canCancel}
                    getCategoryColor={getCategoryColor}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {registrations.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Henüz etkinliğe kayıt olmadınız
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Etkinliklere kayıt olmak için etkinlikler sayfasını ziyaret edin
              </p>
              <button
                onClick={() => navigate('/events')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <ArrowRight className="w-5 h-5" />
                Etkinliklere Git
              </button>
            </div>
          )}
        </motion.div>

        {/* QR Code Modal */}
        {showQrModal && selectedRegistration && (
          <QrCodeModal
            registration={selectedRegistration}
            onClose={() => setShowQrModal(false)}
            formatDate={formatDate}
            CopyButton={CopyButton}
          />
        )}
      </div>
    </Layout>
  );
};

const EventCard = ({ 
  registration, 
  onShowQr, 
  onCancel, 
  cancelling, 
  formatDate, 
  getStatusBadge, 
  canCancel,
  getCategoryColor,
  navigate
}) => {
  const qrCode = registration.qrCode || registration.QrCode || '';
  const eventTitle = registration.eventTitle || registration.EventTitle || '';
  const eventDate = registration.eventDate || registration.EventDate;
  const category = registration.category || registration.Category || '';
  const location = registration.location || registration.Location || '';
  const startTime = registration.startTime || registration.StartTime;
  const endTime = registration.endTime || registration.EndTime;
  const isPaid = registration.isPaid || registration.IsPaid || false;
  const price = registration.price || registration.Price || 0;

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    // Handle TimeSpan format (HH:mm:ss) or just time string
    if (typeof timeValue === 'string') {
      const parts = timeValue.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    // If it's an object with Hours and Minutes (from backend TimeSpan)
    if (timeValue && typeof timeValue === 'object') {
      const hours = timeValue.hours || timeValue.Hours || 0;
      const minutes = timeValue.minutes || timeValue.Minutes || 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {category && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(category)}`}>
                {category === 'conference' ? 'Konferans' :
                 category === 'workshop' ? 'Atölye' :
                 category === 'social' ? 'Sosyal' :
                 category === 'sports' ? 'Spor' : category}
              </span>
            )}
            {getStatusBadge(registration)}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
            {eventTitle}
          </h3>
          
          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(eventDate)}</span>
            </div>
            {startTime && endTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {formatTime(startTime)} - {formatTime(endTime)}
                </span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
            {isPaid && price > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Tag className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {price.toFixed(2)} ₺
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {qrCode && (registration.status || registration.Status)?.toLowerCase() !== 'cancelled' && (
          <button
            onClick={() => onShowQr(registration)}
            className="flex-1 min-w-[140px] py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <QrCode className="w-4 h-4" />
            QR Kod
          </button>
        )}
        {canCancel(registration) && (
          <button
            onClick={() => onCancel(registration.id || registration.Id)}
            disabled={cancelling === (registration.id || registration.Id)}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-500 dark:hover:bg-red-600"
          >
            {cancelling === (registration.id || registration.Id) ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                İptal
              </>
            )}
          </button>
        )}
        <button
          onClick={() => navigate(`/events/${registration.eventId || registration.EventId}`)}
          className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
        >
          <ArrowRight className="w-4 h-4" />
          Detay
        </button>
      </div>
    </motion.div>
  );
};

const QrCodeModal = ({ registration, onClose, formatDate, CopyButton }) => {
  const qrCode = registration.qrCode || registration.QrCode || '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Etkinlik QR Kodu
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            {registration.eventTitle || registration.EventTitle}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(registration.eventDate || registration.EventDate)}
          </p>
        </div>

        <div className="text-center space-y-4">
          {/* QR Code Visual */}
          {qrCode && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600">
                <QRCodeSVG 
                  value={qrCode} 
                  size={256} 
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>
          )}

          {/* QR Code Text Value */}
          {qrCode && (
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    QR Kod Değeri:
                  </p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                    {qrCode}
                  </p>
                </div>
                <CopyButton text={qrCode} />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bu QR kodu etkinlik girişinde gösterin
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MyEvents;

