import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { BookOpen, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/my-attendance');
      setAttendance(response.data?.data || []);
    } catch (error) {
      console.error('Yoklama yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (percentage) => {
    if (percentage >= 80) {
      return { status: 'OK', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
    } else if (percentage >= 60) {
      return { status: 'Uyarı', icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' };
    } else {
      return { status: 'Kritik', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
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
            Yoklamalarım
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Ders bazında yoklama istatistikleriniz
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
                            {item.course?.code}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {item.course?.name}
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
                          Yoklama Yüzdesi
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
                        onClick={() => {/* Navigate to excuse request */}}
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
      </div>
    </Layout>
  );
};

export default MyAttendance;

