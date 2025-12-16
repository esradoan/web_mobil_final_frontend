import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { BookOpen, AlertCircle, CheckCircle, XCircle, FileText, TrendingUp, X, Upload } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const AttendanceStatus = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [excuseDocument, setExcuseDocument] = useState(null);
  const [submittingExcuse, setSubmittingExcuse] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/my-attendance');
      const attendanceData = response.data?.data || response.data || [];
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error('Yoklama yüklenemedi:', error);
      toast.error('Yoklama bilgileri yüklenemedi');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (percentage) => {
    if (percentage >= 80) {
      return { status: 'İyi', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
    } else if (percentage >= 60) {
      return { status: 'Uyarı', icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' };
    } else {
      return { status: 'Kritik', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
    }
  };

  const handleOpenExcuseModal = (attendanceItem) => {
    setSelectedAttendance(attendanceItem);
    setExcuseReason('');
    setExcuseDocument(null);
    setShowExcuseModal(true);
  };

  const handleSubmitExcuse = async (sessionId) => {
    if (!excuseReason.trim()) {
      toast.error('Lütfen mazeret sebebini girin');
      return;
    }

    if (!sessionId) {
      toast.error('Lütfen bir yoklama oturumu seçin');
      return;
    }

    try {
      setSubmittingExcuse(true);
      const formData = new FormData();
      formData.append('sessionId', sessionId.toString());
      formData.append('reason', excuseReason);
      if (excuseDocument) {
        formData.append('document', excuseDocument);
      }

      await api.post('/attendance/excuse-requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Mazeret talebi gönderildi');
      setShowExcuseModal(false);
      setSelectedAttendance(null);
      setExcuseReason('');
      setExcuseDocument(null);
      fetchAttendance();
    } catch (error) {
      console.error('Excuse request error:', error);
      const errorMessage = error.response?.data?.message || 'Mazeret talebi gönderilemedi';
      toast.error(errorMessage);
    } finally {
      setSubmittingExcuse(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Devamsızlık Bilgisi
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Ders bazında devamsızlık istatistikleriniz
          </p>
        </motion.div>

        {/* Attendance List */}
        {attendance.length === 0 ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Henüz yoklama kaydı bulunmuyor
              </p>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="space-y-6">
            {attendance.map((item, index) => {
              const status = getStatus(item.attendancePercentage || 0);
              const StatusIcon = status.icon;

              return (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <GlassCard className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                            {item.courseCode || item.course?.code || 'N/A'}
                          </span>
                          {item.sectionNumber && (
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-semibold">
                              Section {item.sectionNumber}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {item.courseName || item.course?.name || 'Ders Adı'}
                        </h3>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {item.totalSessions || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Toplam</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {item.attendedSessions || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Katıldım</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {item.excusedAbsences || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Mazeretli</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Devamsızlık Yüzdesi
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {(item.attendancePercentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <motion.div
                          className={`h-3 rounded-full ${
                            item.attendancePercentage >= 80
                              ? 'bg-green-500'
                              : item.attendancePercentage >= 60
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.attendancePercentage || 0}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {item.attendancePercentage < 80 && (
                      <motion.button
                        onClick={() => handleOpenExcuseModal(item)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full btn-secondary flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Mazeret Bildir
                      </motion.button>
                    )}
                  </GlassCard>
                </AnimatedCard>
              );
            })}
          </div>
        )}

        {/* Excuse Request Modal - Same as before */}
        {showExcuseModal && selectedAttendance && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Mazeret Bildir
                </h3>
                <button
                  onClick={() => {
                    setShowExcuseModal(false);
                    setSelectedAttendance(null);
                    setExcuseReason('');
                    setExcuseDocument(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ders
                  </label>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {selectedAttendance.courseCode || selectedAttendance.course?.code} - {selectedAttendance.courseName || selectedAttendance.course?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Yoklama Oturumu ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="sessionId"
                    placeholder="Yoklama oturumu ID'sini girin"
                    className="input-field w-full"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hangi yoklama oturumu için mazeret bildiriyorsunuz?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mazeret Sebebi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={excuseReason}
                    onChange={(e) => setExcuseReason(e.target.value)}
                    placeholder="Mazeret sebebinizi açıklayın..."
                    className="input-field w-full min-h-[100px] resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <motion.button
                    onClick={() => {
                      setShowExcuseModal(false);
                      setSelectedAttendance(null);
                      setExcuseReason('');
                      setExcuseDocument(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 btn-secondary"
                    disabled={submittingExcuse}
                  >
                    İptal
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      const sessionIdInput = document.getElementById('sessionId');
                      const sessionId = sessionIdInput?.value ? parseInt(sessionIdInput.value) : null;
                      handleSubmitExcuse(sessionId);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 btn-primary"
                    disabled={submittingExcuse || !excuseReason.trim()}
                  >
                    {submittingExcuse ? 'Gönderiliyor...' : 'Gönder'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceStatus;

