import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Tag,
  AlertCircle,
  Wallet,
  QrCode,
  Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchBalance();
    checkRegistration();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Etkinlik yüklenirken hata oluştu');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await api.get('/wallet/balance');
      setBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const response = await api.get('/events/my-events');
      const registrations = response.data.data || [];
      const currentRegistration = registrations.find(r => r.eventId === parseInt(id));
      if (currentRegistration && currentRegistration.status !== 'cancelled') {
        setIsRegistered(true);
        setRegistration(currentRegistration);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!event) return;

    // Check if already registered
    if (isRegistered) {
      toast.error('Bu etkinliğe zaten kayıtlısınız');
      return;
    }

    // Check registration deadline
    const deadline = new Date(event.registrationDeadline);
    if (deadline < new Date()) {
      toast.error('Kayıt süresi dolmuş');
      return;
    }

    // Check capacity
    if (event.remainingSpots <= 0) {
      toast.error('Etkinlik dolu');
      return;
    }

    // Check wallet balance for paid events
    if (event.isPaid && event.price > 0) {
      if (balance < event.price) {
        toast.error(`Yetersiz bakiye. Gerekli: ${event.price.toFixed(2)} ₺. Cüzdanınıza para yükleyin.`, {
          duration: 5000
        });
        navigate('/wallet');
        return;
      }
    }

    setRegistering(true);
    try {
      const response = await api.post(`/events/${id}/register`);
      toast.success('Etkinliğe başarıyla kayıt oldunuz!');
      setIsRegistered(true);
      setRegistration(response.data);
      // Refresh event to update registered count
      fetchEvent();
    } catch (error) {
      console.error('Error registering:', error);
      const errorMessage = error.response?.data?.message || 'Kayıt olurken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
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

  const getStatusBadge = () => {
    if (!event) return null;

    const now = new Date();
    const eventDate = new Date(event.date);
    const deadline = new Date(event.registrationDeadline);

    if (event.status === 'cancelled') {
      return (
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-semibold">
          İptal Edildi
        </span>
      );
    }

    if (eventDate < now) {
      return (
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-semibold">
          Geçmiş
        </span>
      );
    }

    if (deadline < now) {
      return (
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-semibold">
          Kayıt Kapalı
        </span>
      );
    }

    if (event.remainingSpots <= 0) {
      return (
        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-semibold">
          Dolu
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
        Kayıt Açık
      </span>
    );
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

  const canRegister = () => {
    if (!event || isRegistered) return false;
    const deadline = new Date(event.registrationDeadline);
    const now = new Date();
    return deadline >= now && event.remainingSpots > 0 && event.status !== 'cancelled';
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

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Etkinlik bulunamadı
            </h2>
            <button
              onClick={() => navigate('/events')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Etkinliklere Dön
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/events')}
            className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Etkinliklere Dön</span>
          </button>

          {/* Event Image */}
          {event.imageUrl ? (
            <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          ) : (
            <div className="mb-6 w-full h-64 md:h-96 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-24 h-24 text-white opacity-50" />
            </div>
          )}

          {/* Event Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(event.category)}`}>
                    {event.category === 'conference' ? 'Konferans' :
                     event.category === 'workshop' ? 'Atölye' :
                     event.category === 'social' ? 'Sosyal' :
                     event.category === 'sports' ? 'Spor' : event.category}
                  </span>
                  {getStatusBadge()}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {event.title}
                </h1>
                {event.organizerName && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                    <User className="w-4 h-4" />
                    <span>Organizatör: {event.organizerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tarih</p>
                  <p className="font-semibold">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saat</p>
                  <p className="font-semibold">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Konum</p>
                  <p className="font-semibold">{event.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Katılımcı</p>
                  <p className="font-semibold">
                    {event.registeredCount}/{event.capacity}
                    {event.remainingSpots > 0 && (
                      <span className="text-green-600 dark:text-green-400 ml-1">
                        ({event.remainingSpots} boş)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {event.isPaid && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ücret</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {event.price.toFixed(2)} ₺
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kayıt Son Tarih</p>
                  <p className="font-semibold">
                    {formatDate(event.registrationDeadline)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Açıklama
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Registration Status */}
            {isRegistered && registration && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Bu etkinliğe kayıtlısınız
                  </h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Kayıt Tarihi: {new Date(registration.registrationDate).toLocaleDateString('tr-TR')}
                </p>
                {registration.qrCode && (
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Kodumu Görüntüle
                  </button>
                )}
              </div>
            )}

            {/* Wallet Balance (for paid events) */}
            {event.isPaid && event.price > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Cüzdan Bakiyeniz:
                    </span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {loadingBalance ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      `${balance?.toFixed(2) || '0.00'} ₺`
                    )}
                  </span>
                </div>
                {balance < event.price && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    ⚠️ Yetersiz bakiye. Etkinlik ücreti: {event.price.toFixed(2)} ₺
                  </p>
                )}
              </div>
            )}

            {/* Register Button */}
            {canRegister() && (
              <button
                onClick={handleRegister}
                disabled={registering || (event.isPaid && balance < event.price)}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {registering ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Kayıt yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Etkinliğe Kayıt Ol</span>
                    {event.isPaid && event.price > 0 && (
                      <span className="ml-auto">({event.price.toFixed(2)} ₺)</span>
                    )}
                  </>
                )}
              </button>
            )}

            {!canRegister() && !isRegistered && (
              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">
                    {new Date(event.registrationDeadline) < new Date()
                      ? 'Kayıt süresi dolmuş'
                      : event.remainingSpots <= 0
                      ? 'Etkinlik dolu'
                      : 'Bu etkinliğe kayıt olamazsınız'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* QR Code Modal */}
        {showQrModal && registration && (
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
                  onClick={() => setShowQrModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="text-center space-y-4">
                {/* QR Code Visual */}
                {registration.qrCode && (
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600">
                      <QRCodeSVG 
                        value={registration.qrCode} 
                        size={256} 
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                  </div>
                )}

                {/* QR Code Text Value */}
                {registration.qrCode && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          QR Kod Değeri:
                        </p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                          {registration.qrCode}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(registration.qrCode);
                            toast.success('QR kod kopyalandı!');
                          } catch (error) {
                            toast.error('Kopyalama başarısız');
                          }
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bu QR kodu etkinlik girişinde gösterin
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventDetail;

