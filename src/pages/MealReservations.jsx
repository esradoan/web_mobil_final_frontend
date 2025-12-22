import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  Calendar,
  Clock,
  MapPin,
  X,
  QrCode,
  CheckCircle,
  XCircle,
  DollarSign,
  Trash2,
  Maximize2,
  Copy,
  Check
} from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const MealReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/meals/reservations/my-reservations');
      const data = response.data.data || [];
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Rezervasyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!reservationId) {
      toast.error('Rezervasyon ID bulunamadı');
      return;
    }

    if (!window.confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    setCancelling(reservationId);
    try {
      console.log('Cancelling reservation:', reservationId);
      await api.delete(`/meals/reservations/${reservationId}`);
      toast.success('Rezervasyon başarıyla iptal edildi');
      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Rezervasyon iptal edilirken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  const handleShowQr = (reservation) => {
    setSelectedReservation(reservation);
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'reserved':
        return (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Rezerve Edildi
          </span>
        );
      case 'used':
        return (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Kullanıldı
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            İptal Edildi
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const canCancel = (reservation) => {
    const status = reservation.status || reservation.Status || '';
    if (status.toLowerCase() !== 'reserved') {
      console.log('Cannot cancel: status is not reserved', status);
      return false;
    }
    
    try {
      const dateStr = reservation.date || reservation.Date;
      if (!dateStr) {
        console.log('Cannot cancel: no date');
        return false;
      }
      
      // Parse date string (could be ISO string or date object)
      const reservationDate = new Date(dateStr);
      if (isNaN(reservationDate.getTime())) {
        console.log('Cannot cancel: invalid date', dateStr);
        return false;
      }
      
      // Get date part only (ignore time)
      const dateOnly = new Date(reservationDate.getFullYear(), reservationDate.getMonth(), reservationDate.getDate());
      
      // Create meal time (lunch at 12:00, dinner at 18:00)
      const mealTime = new Date(dateOnly);
      const mealType = (reservation.mealType || reservation.MealType || 'lunch').toLowerCase();
      
      if (mealType === 'lunch') {
        mealTime.setHours(12, 0, 0, 0);
      } else {
        mealTime.setHours(18, 0, 0, 0);
      }
      
      const now = new Date();
      const hoursUntilMeal = (mealTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      console.log('canCancel check:', {
        reservationDate: dateStr,
        mealTime: mealTime.toISOString(),
        now: now.toISOString(),
        hoursUntilMeal: hoursUntilMeal,
        canCancel: hoursUntilMeal >= 2
      });
      
      return hoursUntilMeal >= 2;
    } catch (error) {
      console.error('Error calculating canCancel:', error, reservation);
      return false;
    }
  };

  // Separate upcoming and past reservations
  const now = new Date();
  const upcomingReservations = reservations.filter(r => {
    const status = (r.status || r.Status || '').toLowerCase();
    if (status !== 'reserved') return false;
    
    try {
      const reservationDate = new Date(r.date || r.Date);
      if (isNaN(reservationDate.getTime())) return false;
      return reservationDate >= now;
    } catch {
      return false;
    }
  });
  
  const pastReservations = reservations.filter(r => {
    const status = (r.status || r.Status || '').toLowerCase();
    if (status === 'reserved') {
      try {
        const reservationDate = new Date(r.date || r.Date);
        if (isNaN(reservationDate.getTime())) return true;
        return reservationDate < now;
      } catch {
        return true;
      }
    }
    return true; // used, cancelled, etc.
  });

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <UtensilsCrossed className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Rezervasyonlarım
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Yemek rezervasyonlarınızı görüntüleyin ve yönetin
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <UtensilsCrossed className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Henüz rezervasyonunuz bulunmuyor
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Menü sayfasından rezervasyon yapabilirsiniz
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Reservations */}
              {upcomingReservations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Yaklaşan Rezervasyonlar
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onCancel={handleCancel}
                        onShowQr={handleShowQr}
                        cancelling={cancelling === reservation.id}
                        canCancel={canCancel(reservation)}
                        formatDate={formatDate}
                        formatTime={formatTime}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Reservations */}
              {pastReservations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Geçmiş Rezervasyonlar
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onCancel={handleCancel}
                        onShowQr={handleShowQr}
                        cancelling={cancelling === reservation.id}
                        canCancel={false}
                        formatDate={formatDate}
                        formatTime={formatTime}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QR Code Modal */}
          {showQrModal && selectedReservation && (
            <QrCodeModal
              reservation={selectedReservation}
              onClose={() => {
                setShowQrModal(false);
                setSelectedReservation(null);
              }}
              formatDate={formatDate}
            />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

const ReservationCard = ({ 
  reservation, 
  onCancel, 
  onShowQr, 
  cancelling, 
  canCancel,
  formatDate,
  formatTime,
  getStatusBadge
}) => {
  const mealType = reservation.mealType || reservation.MealType || 'lunch';
  const status = reservation.status || reservation.Status || 'reserved';
  const qrCode = reservation.qrCode || reservation.QrCode || '';
  const menuItems = reservation.menuItems || reservation.MenuItems || [];
  const amount = reservation.amount || reservation.Amount || 0;
  const isScholarship = reservation.isScholarship || reservation.IsScholarship || false;
  const usedAt = reservation.usedAt || reservation.UsedAt;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">{reservation.cafeteriaName || reservation.CafeteriaName || 'Yemekhane'}</h3>
          {getStatusBadge(status)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(reservation.date || reservation.Date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <Clock className="w-4 h-4" />
          <span>{mealType.toLowerCase() === 'lunch' ? 'Öğle Yemeği' : 'Akşam Yemeği'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Menu Items */}
        {menuItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Menü:
            </h4>
            <ul className="space-y-1">
              {menuItems.slice(0, 3).map((item, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
              {menuItems.length > 3 && (
                <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                  +{menuItems.length - 3} daha...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <DollarSign className="w-5 h-5" />
            <span className="text-lg font-bold">
              {isScholarship ? 'Ücretsiz (Burslu)' : `${parseFloat(amount).toFixed(2)} ₺`}
            </span>
          </div>
        </div>

        {/* Used At */}
        {usedAt && (
          <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-300">
              Kullanıldı: {formatTime(usedAt)} - {formatDate(usedAt)}
            </p>
          </div>
        )}

        {/* QR Code Value */}
        {qrCode && status.toLowerCase() === 'reserved' && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
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

        {/* Actions */}
        <div className="flex gap-2">
          {status.toLowerCase() === 'reserved' && qrCode && (
            <button
              onClick={() => onShowQr(reservation)}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <QrCode className="w-4 h-4" />
              QR Kod
            </button>
          )}
          {status.toLowerCase() === 'reserved' && (
            <button
              onClick={() => {
                const reservationId = reservation.id || reservation.Id;
                console.log('Cancel button clicked, reservationId:', reservationId, 'canCancel:', canCancel);
                if (reservationId) {
                  onCancel(reservationId);
                } else {
                  toast.error('Rezervasyon ID bulunamadı');
                }
              }}
              disabled={cancelling || !canCancel}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                canCancel
                  ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!canCancel ? 'Rezervasyon iptali için en az 2 saat önceden iptal etmelisiniz' : ''}
            >
              {cancelling ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {canCancel ? 'İptal Et' : 'İptal Edilemez'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
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

const QrCodeModal = ({ reservation, onClose, formatDate }) => {
  const qrCode = reservation.qrCode || reservation.QrCode || '';
  const mealType = reservation.mealType || reservation.MealType || 'lunch';
  const cafeteriaName = reservation.cafeteriaName || reservation.CafeteriaName || 'Yemekhane';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            QR Kod
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block">
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={256} level="H" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                  QR Kod bulunamadı
                </div>
              )}
            </div>
          </div>

          {/* QR Code Value */}
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

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Yemekhane:</p>
            <p className="font-semibold text-gray-900 dark:text-white">{cafeteriaName}</p>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Tarih:</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatDate(reservation.date || reservation.Date)}
            </p>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Öğün:</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {mealType.toLowerCase() === 'lunch' ? 'Öğle Yemeği' : 'Akşam Yemeği'}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              Bu QR kodu yemekhanede gösterin veya QR kod değerini manuel olarak girebilirsiniz
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Kapat
        </button>
      </motion.div>
    </div>
  );
};

export default MealReservations;

