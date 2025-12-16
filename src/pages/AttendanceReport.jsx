import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const AttendanceReport = () => {
  const { sectionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [sectionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/report/${sectionId}`);
      setReport(response.data?.data || response.data);
    } catch (error) {
      console.error('Rapor yüklenemedi:', error);
      toast.error('Yoklama raporu yüklenemedi');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Backend'de Excel export endpoint'i olacak
      toast.success('Excel dosyası indiriliyor...');
    } catch (error) {
      toast.error('Excel dosyası indirilemedi');
    }
  };

  const getStatus = (percentage) => {
    if (percentage >= 80) return { status: 'OK', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' };
    if (percentage >= 60) return { status: 'Uyarı', icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400' };
    return { status: 'Kritik', icon: XCircle, color: 'text-red-600 dark:text-red-400' };
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
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Yoklama Raporu
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {report?.section?.course?.code} - Section {report?.section?.sectionNumber}
            </p>
          </div>
          <motion.button
            onClick={handleExportExcel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Excel'e Aktar
          </motion.button>
        </motion.div>

        {/* Students List */}
        {report?.students && report.students.length > 0 ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Öğrenci</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Toplam</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Katıldı</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Yüzde</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.students.map((student, index) => {
                      const status = getStatus(student.attendancePercentage || 0);
                      const StatusIcon = status.icon;

                      return (
                        <motion.tr
                          key={student.studentId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {student.studentName}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                            {student.totalSessions}
                          </td>
                          <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                            {student.attendedSessions}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {(student.attendancePercentage || 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 ${status.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {status.status}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Rapor verisi bulunamadı
              </p>
            </GlassCard>
          </AnimatedCard>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceReport;

