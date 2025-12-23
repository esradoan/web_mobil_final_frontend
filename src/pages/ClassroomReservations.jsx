import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Building, Users, CheckCircle, XCircle, 
  AlertCircle, Plus, Search, Filter, X, Loader
} from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ClassroomReservations = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reservationFilter, setReservationFilter] = useState('all'); // 'all', 'upcoming', 'past'

  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin' || user?.role === 0;
  const isFaculty = user?.role === 'Faculty' || user?.Role === 'Faculty' || user?.role === 1;

  useEffect(() => {
    fetchClassrooms();
    fetchMyReservations();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/classrooms');
      const data = response.data?.data || [];
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('Derslikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReservations = async () => {
    setLoadingReservations(true);
    try {
      const response = await api.get('/reservations/my-reservations');
      const data = response.data?.data || [];
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Rezervasyonlar yüklenirken hata oluştu');
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleReserve = (classroom) => {
    setSelectedClassroom(classroom);
    setShowReservationModal(true);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndTime('10:00');
    setPurpose('');
  };

  const handleSubmitReservation = async () => {
    if (!selectedClassroom) return;

    if (!purpose.trim()) {
      toast.error('Lütfen kullanım amacını girin');
      return;
    }

    if (startTime >= endTime) {
      toast.error('Bitiş saati başlangıç saatinden sonra olmalıdır');
      return;
    }

    setSubmitting(true);
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const response = await api.post('/reservations', {
        classroomId: selectedClassroom.id || selectedClassroom.Id,
        date: selectedDate,
        startTime: `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`,
        endTime: `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`,
        purpose: purpose.trim()
      });

      toast.success('Rezervasyon talebi oluşturuldu! Onay bekleniyor.');
      setShowReservationModal(false);
      fetchMyReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
      const errorMessage = error.response?.data?.message || 'Rezervasyon oluşturulurken hata oluştu';
      
      // Çakışma kontrolü mesajlarını daha açıklayıcı hale getir
      if (errorMessage.includes('conflict') || errorMessage.includes('çakışma') || 
          errorMessage.includes('reserved') || errorMessage.includes('rezerve')) {
        toast.error(`⛔ Çakışma: ${errorMessage}`, { duration: 5000 });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/reservations/${reservationId}`);
      toast.success('Rezervasyon iptal edildi');
      fetchMyReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Rezervasyon iptal edilirken hata oluştu');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Onaylandı
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Beklemede
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Reddedildi
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold">
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

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    if (typeof timeValue === 'string') {
      const parts = timeValue.split(':');
      return `${parts[0]}:${parts[1]}`;
    } else if (timeValue && typeof timeValue === 'object') {
      const hours = Math.floor(timeValue / 36000000000) || 0;
      const minutes = Math.floor((timeValue % 36000000000) / 600000000) || 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '';
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

  const filteredClassrooms = classrooms.filter(classroom => {
    const building = (classroom.building || classroom.Building || '').toLowerCase();
    const roomNumber = (classroom.roomNumber || classroom.RoomNumber || '').toLowerCase();
    const capacity = classroom.capacity || classroom.Capacity || 0;
    
    const matchesBuilding = !filterBuilding || building.includes(filterBuilding.toLowerCase());
    const matchesCapacity = !filterCapacity || capacity >= parseInt(filterCapacity);
    const matchesSearch = !searchTerm || 
      building.includes(searchTerm.toLowerCase()) ||
      roomNumber.includes(searchTerm.toLowerCase());

    return matchesBuilding && matchesCapacity && matchesSearch;
  });

  const uniqueBuildings = [...new Set(classrooms.map(c => c.building || c.Building).filter(Boolean))];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
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
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Building className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Derslik Rezervasyonları
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Müsait derslikleri görüntüleyin ve rezervasyon yapın
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Derslik ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <select
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Tüm Binalar</option>
                {uniqueBuildings.map(building => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
              <select
                value={filterCapacity}
                onChange={(e) => setFilterCapacity(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Tüm Kapasiteler</option>
                <option value="20">20+ kişi</option>
                <option value="50">50+ kişi</option>
                <option value="100">100+ kişi</option>
                <option value="200">200+ kişi</option>
              </select>
              <button
                onClick={() => {
                  setFilterBuilding('');
                  setFilterCapacity('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
              >
                <X className="w-4 h-4" />
                Temizle
              </button>
            </div>
          </div>

          {/* Classrooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredClassrooms.map((classroom) => {
              const building = classroom.building || classroom.Building || '';
              const roomNumber = classroom.roomNumber || classroom.RoomNumber || '';
              const capacity = classroom.capacity || classroom.Capacity || 0;
              const features = classroom.features || classroom.Features || '';

              return (
                <motion.div
                  key={classroom.id || classroom.Id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {building} {roomNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {features || 'Standart derslik'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{capacity} kişi</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReserve(classroom)}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                    Rezerve Et
                  </button>
                </motion.div>
              );
            })}
          </div>

          {filteredClassrooms.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Derslik bulunamadı
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Filtre kriterlerinize uygun derslik bulunmuyor
              </p>
            </div>
          )}

          {/* My Reservations */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rezervasyonlarım
              </h2>
              <select
                value={reservationFilter}
                onChange={(e) => setReservationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="upcoming">Yaklaşan</option>
                <option value="past">Geçmiş</option>
              </select>
            </div>
            {loadingReservations ? (
              <LoadingSpinner />
            ) : reservations.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Henüz rezervasyon yapmadınız
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yukarıdaki listeden bir derslik seçerek rezervasyon yapabilirsiniz
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations
                  .filter(reservation => {
                    if (reservationFilter === 'all') return true;
                    const date = new Date(reservation.date || reservation.Date);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    date.setHours(0, 0, 0, 0);
                    
                    if (reservationFilter === 'upcoming') {
                      return date >= now;
                    } else if (reservationFilter === 'past') {
                      return date < now;
                    }
                    return true;
                  })
                  .map((reservation) => {
                  const classroomName = reservation.classroomName || reservation.ClassroomName || '';
                  const building = reservation.building || reservation.Building || '';
                  const status = reservation.status || reservation.Status || '';
                  const purpose = reservation.purpose || reservation.Purpose || '';
                  const date = reservation.date || reservation.Date;
                  const startTime = reservation.startTime || reservation.StartTime;
                  const endTime = reservation.endTime || reservation.EndTime;

                  return (
                    <motion.div
                      key={reservation.id || reservation.Id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {building} {classroomName}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                              <MapPin className="w-4 h-4" />
                              <span>{purpose}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(status)}
                          {status?.toLowerCase() === 'pending' && (() => {
                            const reservationDate = new Date(date);
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            reservationDate.setHours(0, 0, 0, 0);
                            const isPast = reservationDate < now;
                            
                            return !isPast && (
                              <button
                                onClick={() => handleCancelReservation(reservation.id || reservation.Id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors dark:bg-red-500 dark:hover:bg-red-600"
                              >
                                İptal Et
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Reservation Modal */}
        <AnimatePresence>
          {showReservationModal && selectedClassroom && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Rezervasyon Oluştur
                  </h3>
                  <button
                    onClick={() => setShowReservationModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Derslik
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedClassroom.building || selectedClassroom.Building} {selectedClassroom.roomNumber || selectedClassroom.RoomNumber}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tarih
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Başlangıç Saati
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bitiş Saati
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kullanım Amacı
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Örn: Proje sunumu, Toplantı, Workshop..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => setShowReservationModal(false)}
                    className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSubmitReservation}
                    disabled={submitting}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Rezerve Et
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default ClassroomReservations;

