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
  TrendingUp,
  Award,
  CheckCircle2
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
      toast.error('Dersler yüklenemedi');
      setEnrollments([]);
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
            onClick={() => navigate('/student-course-application')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            Ders Başvurusu Yap
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
                onClick={() => navigate('/student-course-application')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
              >
                Ders Başvurusu Yap
              </motion.button>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enrollment, index) => {
              const isCompleted = enrollment.status === 'completed';
              const attendanceStatus = getAttendanceStatus(enrollment.attendancePercentage || 0);
              const StatusIcon = attendanceStatus.icon;

              // Backend returns courseCode, courseName, instructorName directly on section DTO
              const courseCode = enrollment.section?.courseCode || enrollment.section?.course?.code || '';
              const courseName = enrollment.section?.courseName || enrollment.section?.course?.name || '';
              const sectionNumber = enrollment.section?.sectionNumber || '';
              const instructorFirstName = enrollment.section?.instructor?.firstName || '';
              const instructorLastName = enrollment.section?.instructor?.lastName || '';
              const instructorName = enrollment.section?.instructorName || (instructorFirstName && instructorLastName ? `${instructorFirstName} ${instructorLastName}` : '');
              const courseId = enrollment.section?.courseId || enrollment.section?.course?.id;

              // Grade color helper
              const getGradeColor = (letterGrade) => {
                if (!letterGrade) return 'text-slate-500 dark:text-slate-400';
                if (['AA'].includes(letterGrade)) return 'text-green-600 dark:text-green-400';
                if (['BA', 'BB'].includes(letterGrade)) return 'text-blue-600 dark:text-blue-400';
                if (['CB', 'CC'].includes(letterGrade)) return 'text-yellow-600 dark:text-yellow-400';
                if (['DC', 'DD'].includes(letterGrade)) return 'text-orange-600 dark:text-orange-400';
                return 'text-red-600 dark:text-red-400';
              };

              return (
                <AnimatedCard key={enrollment.id} delay={index * 0.1}>
                  <GlassCard className={`p-6 ${isCompleted ? 'opacity-90 border-2 border-green-500/30 dark:border-green-400/30' : ''}`}>
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-primary-500 to-purple-600'}`}>
                            {isCompleted ? (
                              <Award className="w-5 h-5 text-white" />
                            ) : (
                              <BookOpen className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                                {courseCode || 'Ders Kodu'}
                              </span>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Section {sectionNumber || '?'}
                              </span>
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Tamamlandı
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <h3 className={`text-xl font-bold mb-1 ${isCompleted ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {courseName || 'Ders Adı'}
                        </h3>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {instructorName || 'Bilgi yok'}
                      </span>
                    </div>

                    {/* Schedule */}
                    {!isCompleted && (
                      <div className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {formatSchedule(enrollment.section?.schedule)}
                        </span>
                      </div>
                    )}

                    {/* Completed Course - Grade Information */}
                    {isCompleted && enrollment.letterGrade && (
                      <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Ders Notları
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getGradeColor(enrollment.letterGrade)}`}>
                              {enrollment.letterGrade}
                            </span>
                            {enrollment.gradePoint && (
                              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                ({enrollment.gradePoint.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {enrollment.midtermGrade != null && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Vize:</span>
                              <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">
                                {enrollment.midtermGrade.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {enrollment.finalGrade != null && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Final:</span>
                              <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">
                                {enrollment.finalGrade.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {enrollment.homeworkGrade != null && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Ödev:</span>
                              <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">
                                {enrollment.homeworkGrade.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Course - Attendance Status */}
                    {!isCompleted && (
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
                              className={`h-2 rounded-full ${enrollment.attendancePercentage >= 80
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
                    )}

                    {/* Enrollment Date */}
                    <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                      {isCompleted ? 'Tamamlanma Tarihi' : 'Kayıt Tarihi'}: {new Date(enrollment.enrollmentDate).toLocaleDateString('tr-TR')}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => courseId && navigate(`/courses/${courseId}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 btn-secondary text-sm"
                      >
                        Detaylar
                      </motion.button>
                      {!isCompleted ? (
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
                      ) : (
                        <motion.button
                          onClick={() => navigate('/grades')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn-secondary text-sm px-4"
                        >
                          <Award className="w-4 h-4 inline mr-1" />
                          Notlarım
                        </motion.button>
                      )}
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

