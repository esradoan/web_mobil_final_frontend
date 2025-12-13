import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { 
  BookOpen, 
  User, 
  Calendar, 
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const MyCourses = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState({});

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enrollments/my-courses');
      setEnrollments(response.data?.data || []);
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
      // Mock data for development
      setEnrollments([
        {
          id: 1,
          section: {
            id: 1,
            course: {
              code: 'CENG101',
              name: 'Introduction to Computer Engineering',
            },
            sectionNumber: 'A',
            instructor: {
              firstName: 'Ahmet',
              lastName: 'Yılmaz',
            },
            schedule: {
              monday: ['09:00-10:30'],
              wednesday: ['09:00-10:30'],
            },
          },
          status: 'enrolled',
          enrollmentDate: '2025-12-01T10:00:00Z',
          attendancePercentage: 85.5,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Bu dersi bırakmak istediğinize emin misiniz?')) {
      return;
    }

    try {
      setDropping(prev => ({ ...prev, [enrollmentId]: true }));
      await api.delete(`/enrollments/${enrollmentId}`);
      
      toast.success('Ders başarıyla bırakıldı');
      fetchMyCourses(); // Refresh list
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ders bırakma başarısız';
      toast.error(errorMessage);
    } finally {
      setDropping(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 80) {
      return { status: 'OK', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
    } else if (percentage >= 60) {
      return { status: 'Uyarı', icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' };
    } else {
      return { status: 'Kritik', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
    }
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Bilgi yok';
    
    const days = {
      monday: 'Pzt',
      tuesday: 'Sal',
      wednesday: 'Çar',
      thursday: 'Per',
      friday: 'Cum',
      saturday: 'Cmt',
      sunday: 'Paz',
    };

    return Object.entries(schedule)
      .map(([day, times]) => {
        const dayName = days[day] || day;
        return `${dayName}: ${times.join(', ')}`;
      })
      .join(' | ');
  };

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
              Derslerim
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Kayıtlı olduğunuz dersler ve yoklama durumları
            </p>
          </div>
          <motion.button
            onClick={() => navigate('/courses')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            Yeni Ders Ekle
          </motion.button>
        </motion.div>

        {/* Courses List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : enrollments.length === 0 ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">
                Henüz kayıtlı olduğunuz ders bulunmuyor
              </p>
              <motion.button
                onClick={() => navigate('/courses')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
              >
                Ders Kataloğuna Git
              </motion.button>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enrollment, index) => {
              const attendanceStatus = getAttendanceStatus(enrollment.attendancePercentage || 0);
              const StatusIcon = attendanceStatus.icon;

              return (
                <AnimatedCard key={enrollment.id} delay={index * 0.1}>
                  <GlassCard className="p-6">
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                              {enrollment.section?.course?.code}
                            </span>
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                              Section {enrollment.section?.sectionNumber}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                          {enrollment.section?.course?.name}
                        </h3>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {enrollment.section?.instructor?.firstName} {enrollment.section?.instructor?.lastName}
                      </span>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatSchedule(enrollment.section?.schedule)}
                      </span>
                    </div>

                    {/* Attendance Status */}
                    <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Yoklama Durumu
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${attendanceStatus.bg} ${attendanceStatus.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {attendanceStatus.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${
                              enrollment.attendancePercentage >= 80
                                ? 'bg-green-500'
                                : enrollment.attendancePercentage >= 60
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${enrollment.attendancePercentage || 0}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {enrollment.attendancePercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>

                    {/* Enrollment Date */}
                    <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                      Kayıt Tarihi: {new Date(enrollment.enrollmentDate).toLocaleDateString('tr-TR')}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => navigate(`/courses/${enrollment.section?.course?.id}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 btn-secondary text-sm"
                      >
                        Detaylar
                      </motion.button>
                      <motion.button
                        onClick={() => handleDrop(enrollment.id)}
                        disabled={dropping[enrollment.id]}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-danger text-sm px-4"
                      >
                        {dropping[enrollment.id] ? (
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Bırak
                          </>
                        )}
                      </motion.button>
                    </div>
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

export default MyCourses;

