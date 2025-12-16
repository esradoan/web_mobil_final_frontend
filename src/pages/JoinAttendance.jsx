import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { QrCode, Clock, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const JoinAttendance = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSessions();
    // Her 10 saniyede bir aktif oturumları yenile
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching active sessions...');
      
      // Önce öğrencinin kayıtlı olduğu dersleri kontrol et
      try {
        const enrollmentsResponse = await api.get('/enrollments/my-courses');
        const enrollments = enrollmentsResponse.data?.data || enrollmentsResponse.data || [];
        console.log('📚 Student enrollments:', enrollments.length);
        if (Array.isArray(enrollments) && enrollments.length > 0) {
          console.log('📋 Enrolled sections:', enrollments.map(e => ({
            enrollmentId: e.id || e.Id,
            sectionId: e.sectionId || e.section?.id,
            courseId: e.courseId || e.section?.courseId || e.section?.course?.id,
            courseName: e.courseName || e.section?.course?.name,
            courseCode: e.courseCode || e.section?.course?.code,
            sectionNumber: e.sectionNumber || e.section?.sectionNumber,
            status: e.status || e.Status
          })));
          console.log('📋 Full enrollment objects:', enrollments);
        } else {
          console.warn('⚠️ Student has no enrollments!');
        }
      } catch (enrollError) {
        console.error('❌ Failed to fetch enrollments:', enrollError);
      }
      
      const response = await api.get('/attendance/sessions/active');
      console.log('📥 Response:', response.data);
      const sessions = response.data?.data || response.data || [];
      setActiveSessions(Array.isArray(sessions) ? sessions : []);
      console.log('✅ Active sessions loaded:', Array.isArray(sessions) ? sessions.length : 0);
      if (Array.isArray(sessions) && sessions.length > 0) {
        console.log('📋 Sessions details:', sessions);
      } else {
        console.log('⚠️ No active sessions found. Possible reasons:');
        console.log('  - Student is not enrolled in any sections');
        console.log('  - No active attendance sessions exist');
        console.log('  - Sessions are not for today or future dates');
        console.log('  - Check backend console for detailed logs');
      }
    } catch (error) {
      console.error('❌ Aktif oturumlar yüklenemedi:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      setActiveSessions([]);
    } finally {
      setLoading(false);
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
            Yoklamaya Katıl
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Hocanızın başlattığı aktif yoklama oturumlarına katılın
          </p>
        </motion.div>

        {/* Active Sessions */}
        {activeSessions.length === 0 ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                Aktif yoklama oturumu bulunmuyor
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Hocanız yoklama başlattığında burada görünecektir.
              </p>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSessions.map((session, index) => (
              <AnimatedCard key={session.id || index} delay={index * 0.1}>
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400 text-lg">
                          {session.courseCode || session.section?.course?.code || 'N/A'}
                        </span>
                        {session.section?.sectionNumber && (
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-semibold">
                            Section {session.section.sectionNumber}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Aktif
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {session.courseName || session.section?.course?.name || 'Ders Adı'}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(session.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 mt-4">
                    <motion.button
                      onClick={() => navigate(`/attendance/give/${session.id}`)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold"
                    >
                      <MapPin className="w-5 h-5" />
                      GPS ile Yoklamaya Katıl
                    </motion.button>
                    <motion.button
                      onClick={() => navigate(`/attendance/qr/${session.id}`)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full btn-secondary flex items-center justify-center gap-2 py-3 text-base font-semibold"
                    >
                      <QrCode className="w-5 h-5" />
                      QR Kod ile Yoklamaya Katıl
                    </motion.button>
                  </div>
                </GlassCard>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default JoinAttendance;

