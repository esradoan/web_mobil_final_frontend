import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Building, User, CheckCircle, XCircle, 
  AlertCircle, Search, Filter, Eye, MessageSquare
} from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ClassroomReservationApprovals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin' || user?.role === 0;
  const isFaculty = user?.role === 'Faculty' || user?.Role === 'Faculty' || user?.role === 1;

  useEffect(() => {
    if (!isAdmin && !isFaculty) {
      toast.error('Bu sayfaya erişim için Admin veya Faculty yetkisi gereklidir');
      navigate('/dashboard');
      return;
    }
    fetchReservations();
  }, [filterStatus, isAdmin, isFaculty, navigate]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let response;
      if (filterStatus === 'pending') {
        response = await api.get('/reservations/pending');
      } else {
        response = await api.get(`/reservations?status=${filterStatus}`);
      }
      const data = response.data?.data || [];
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Rezervasyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (reservation) => {
    setSelectedReservation(reservation);
    setActionType('approve');
    setNotes('');
    setShowNotesModal(true);
  };

  const handleReject = (reservation) => {
    setSelectedReservation(reservation);
    setActionType('reject');
    setNotes('');
    setShowNotesModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedReservation) return;

    setProcessing(selectedReservation.id || selectedReservation.Id);
    try {
      const reservationId = selectedReservation.id || selectedReservation.Id;
      const endpoint = actionType === 'approve' 
        ? `/reservations/${reservationId}/approve`
        : `/reservations/${reservationId}/reject`;
      
      const response = await api.put(endpoint, {
        notes: notes.trim() || undefined
      });

      toast.success(
        actionType === 'approve' 
          ? 'Rezervasyon onaylandı!' 
          : 'Rezervasyon reddedildi!'
      );
      setShowNotesModal(false);
      setSelectedReservation(null);
      setNotes('');
      fetchReservations();
    } catch (error) {
      console.error(`Error ${actionType}ing reservation:`, error);
      const errorMessage = error.response?.data?.message || `Rezervasyon ${actionType === 'approve' ? 'onaylanırken' : 'reddedilirken'} hata oluştu`;
      toast.error(errorMessage);
    } finally {
      setProcessing(null);
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

  const filteredReservations = reservations.filter(reservation => {
    const userName = (reservation.userName || reservation.UserName || '').toLowerCase();
    const classroomName = (reservation.classroomName || reservation.ClassroomName || '').toLowerCase();
    const building = (reservation.building || reservation.Building || '').toLowerCase();
    const purpose = (reservation.purpose || reservation.Purpose || '').toLowerCase();
    
    return !searchTerm || 
      userName.includes(searchTerm.toLowerCase()) ||
      classroomName.includes(searchTerm.toLowerCase()) ||
      building.includes(searchTerm.toLowerCase()) ||
      purpose.includes(searchTerm.toLowerCase());
  });

  if (!isAdmin && !isFaculty) {
    return null;
  }

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
              Rezervasyon Onayları
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bekleyen rezervasyonları onaylayın veya reddedin
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Kullanıcı, derslik veya amaç ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="pending">Bekleyenler</option>
                <option value="approved">Onaylananlar</option>
                <option value="rejected">Reddedilenler</option>
                <option value="">Tümü</option>
              </select>
              <button
                onClick={fetchReservations}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
              >
                <AlertCircle className="w-4 h-4" />
                Yenile
              </button>
            </div>
          </div>

          {/* Reservations List */}
          {filteredReservations.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {filterStatus === 'pending' ? 'Bekleyen rezervasyon bulunmuyor' : 'Rezervasyon bulunamadı'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filterStatus === 'pending' 
                  ? 'Tüm rezervasyonlar onaylandı veya reddedildi'
                  : 'Filtre kriterlerinize uygun rezervasyon bulunmuyor'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => {
                const reservationId = reservation.id || reservation.Id;
                const classroomName = reservation.classroomName || reservation.ClassroomName || '';
                const building = reservation.building || reservation.Building || '';
                const userName = reservation.userName || reservation.UserName || '';
                const purpose = reservation.purpose || reservation.Purpose || '';
                const status = reservation.status || reservation.Status || '';
                const date = reservation.date || reservation.Date;
                const startTime = reservation.startTime || reservation.StartTime;
                const endTime = reservation.endTime || reservation.EndTime;
                const approvedByName = reservation.approvedByName || reservation.ApprovedByName;
                const reviewedAt = reservation.reviewedAt || reservation.ReviewedAt;
                const notes = reservation.notes || reservation.Notes;

                return (
                  <motion.div
                    key={reservationId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {building} {classroomName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <User className="w-4 h-4" />
                              <span>{userName}</span>
                            </div>
                          </div>
                          {getStatusBadge(status)}
                        </div>

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
                            <span className="font-medium">Amaç:</span>
                            <span>{purpose}</span>
                          </div>
                        </div>

                        {approvedByName && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">
                              {status?.toLowerCase() === 'approved' ? 'Onaylayan:' : 'Reddeden:'}
                            </span>{' '}
                            {approvedByName}
                            {reviewedAt && (
                              <span className="ml-2">
                                ({new Date(reviewedAt).toLocaleString('tr-TR')})
                              </span>
                            )}
                          </div>
                        )}

                        {notes && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Not:</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {status?.toLowerCase() === 'pending' && (
                        <div className="flex flex-col gap-2 md:w-48">
                          <button
                            onClick={() => handleApprove(reservation)}
                            disabled={processing === reservationId}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            {processing === reservationId ? (
                              <LoadingSpinner size="sm" color="white" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Onayla
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(reservation)}
                            disabled={processing === reservationId}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-500 dark:hover:bg-red-600"
                          >
                            {processing === reservationId ? (
                              <LoadingSpinner size="sm" color="white" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Reddet
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Notes Modal */}
        {showNotesModal && selectedReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {actionType === 'approve' ? 'Rezervasyonu Onayla' : 'Rezervasyonu Reddet'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Onay notu...' : 'Red nedeni...'}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    setSelectedReservation(null);
                    setNotes('');
                  }}
                  className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={processing === (selectedReservation.id || selectedReservation.Id)}
                  className={`flex-1 py-2 px-4 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  }`}
                >
                  {processing === (selectedReservation.id || selectedReservation.Id) ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      {actionType === 'approve' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Onayla
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reddet
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassroomReservationApprovals;

