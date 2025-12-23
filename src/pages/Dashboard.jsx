import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Bell,
  CheckCircle,
  Sparkles,
  GraduationCap,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    attendancePercentage: 0,
    gpa: 0,
    activeSessions: 0,
    totalStudents: 0, // Faculty için
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeSessionsList, setActiveSessionsList] = useState([]); // Faculty için aktif oturumlar listesi

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Role kontrolünü burada yap (user objesi güncel)
      // Backend'den enum string olarak geliyor: "Student", "Faculty", "Admin"
      const userRole = user?.role ?? user?.Role ?? user?.userRole ?? null;
      const userRoleStr = typeof userRole === 'string' ? userRole.toLowerCase() :
        typeof userRole === 'number' ?
          (userRole === 2 ? 'student' : userRole === 1 ? 'faculty' : 'admin') : '';

      const isStudent = userRoleStr === 'student';
      const isFaculty = userRoleStr === 'faculty';
      const isAdmin = userRoleStr === 'admin';

      console.log('👤 User Role Check:', {
        'user.role': user?.role,
        'user.Role': user?.Role,
        'userRole (resolved)': userRole,
        'userRoleStr': userRoleStr,
        'isStudent': isStudent,
        'isFaculty': isFaculty,
        'isAdmin': isAdmin,
        'Full user object': JSON.stringify(user, null, 2)
      });

      if (isStudent) {
        // Öğrenci için veriler
        try {
          const [coursesRes, attendanceRes, gradesRes] = await Promise.allSettled([
            api.get('/enrollments/my-courses'),
            api.get('/attendance/my-attendance'),
            api.get('/grades/my-grades'),
          ]);

          // API response formatını kontrol et - Backend { data: [...] } formatında dönüyor
          let courses = [];
          if (coursesRes.status === 'fulfilled') {
            const responseData = coursesRes.value.data;
            courses = responseData?.data || responseData || [];
            console.log('✅ Courses API success:', {
              responseData,
              courses,
              coursesLength: courses.length,
              isArray: Array.isArray(courses)
            });
          } else {
            console.error('❌ Courses API failed:', {
              status: coursesRes.status,
              reason: coursesRes.reason?.response?.status,
              message: coursesRes.reason?.message
            });
          }

          let attendance = [];
          if (attendanceRes.status === 'fulfilled') {
            const responseData = attendanceRes.value.data;
            attendance = responseData?.data || responseData || [];
          } else {
            console.error('❌ Attendance API failed:', attendanceRes.reason?.response?.status);
          }

          let grades = {};
          if (gradesRes.status === 'fulfilled') {
            grades = gradesRes.value.data || gradesRes.value || {};
          } else {
            console.error('❌ Grades API failed:', gradesRes.reason?.response?.status);
          }

          console.log('📊 Dashboard Data Final:', {
            courses,
            attendance,
            grades,
            coursesLength: courses.length
          });

          // Ortalama yoklama yüzdesi
          const avgAttendance = attendance.length > 0
            ? attendance.reduce((sum, item) => sum + (item.attendancePercentage || 0), 0) / attendance.length
            : 0;

          setStats({
            enrolledCourses: courses.length,
            attendancePercentage: Math.round(avgAttendance),
            gpa: grades.gpa || grades.cgpa || 0,
            activeSessions: 0, // TODO: Aktif yoklama oturumları sayısı
          });

          // Son aktiviteler (enrollments'tan)
          const activities = [];
          courses.slice(0, 4).forEach((enrollment) => {
            // Backend can return course info in different places depending on DTO structure
            const courseCode = enrollment.section?.courseCode || enrollment.section?.course?.code || enrollment.course?.code || enrollment.courseCode || 'Bilinmeyen';
            const courseName = enrollment.section?.courseName || enrollment.section?.course?.name || enrollment.course?.name || enrollment.courseName || '';
            const displayText = courseName ? `${courseCode} - ${courseName}` : courseCode;
            activities.push({
              id: enrollment.id,
              title: `${displayText} dersine kayıt oldunuz`,
              time: formatTimeAgo(enrollment.enrollmentDate || enrollment.enrolledAt),
              type: 'success',
            });
          });
          setRecentActivities(activities);
        } catch (apiError) {
          console.error('API hatası:', apiError);
          // Hata olsa bile boş verilerle devam et
          setStats({
            enrolledCourses: 0,
            attendancePercentage: 0,
            gpa: 0,
            activeSessions: 0,
          });
          setRecentActivities([]);
        }
      } else if (isFaculty) {
        // Faculty için veriler
        try {
          const userId = user?.id || user?.Id;
          const facultyDepartmentId = user?.departmentId || user?.DepartmentId || user?.department?.id || user?.Department?.id;

          console.log('🔍 Faculty Dashboard Debug:', {
            userId,
            facultyDepartmentId,
            userObject: user,
            userKeys: user ? Object.keys(user) : 'no user'
          });

          const [sessionsRes, sectionsRes, studentsRes] = await Promise.allSettled([
            api.get('/attendance/sessions/my-sessions'), // Correct endpoint path
            api.get('/sections', {
              params: {
                instructorId: userId // Faculty'nin atandığı section'ları getir
              }
            }),
            // Öğretmenin bölümündeki tüm öğrencileri getir
            // Backend'de /admin/students endpoint'i artık Faculty için de açık ve departmentId parametresi alıyor
            facultyDepartmentId
              ? api.get('/admin/students', {
                params: {
                  departmentId: facultyDepartmentId,
                  page: 1,
                  pageSize: 10000 // Tüm öğrencileri al
                }
              })
              : Promise.resolve({ data: { data: [] } })
          ]);

          let sessions = [];
          if (sessionsRes.status === 'fulfilled') {
            const responseData = sessionsRes.value.data;
            sessions = responseData?.data || responseData || [];
          } else {
            console.error('❌ Sessions API failed:', sessionsRes.reason?.response?.status);
          }

          let sections = [];
          if (sectionsRes.status === 'fulfilled') {
            const responseData = sectionsRes.value.data;
            sections = responseData?.data || responseData || [];
            console.log('✅ Faculty sections loaded:', sections.length);
          } else {
            console.error('❌ Sections API failed:', sectionsRes.reason?.response?.status);
          }

          // Öğretmenin bölümündeki toplam öğrenci sayısı
          let totalStudents = 0;
          if (studentsRes.status === 'fulfilled' && facultyDepartmentId) {
            const responseData = studentsRes.value.data;
            let students = responseData?.data || responseData || [];

            // Eğer /users endpoint'inden geldiyse, departmentId'ye göre filtrele
            if (Array.isArray(students) && students.length > 0) {
              const firstStudent = students[0];
              // Eğer response'da departmentId field'ı varsa filtrele
              if (firstStudent.departmentId !== undefined || firstStudent.department?.id !== undefined) {
                students = students.filter(s => {
                  const deptId = s.departmentId || s.department?.id || s.DepartmentId || s.Department?.id;
                  return deptId === facultyDepartmentId || deptId === parseInt(facultyDepartmentId);
                });
              }
            }

            totalStudents = Array.isArray(students) ? students.length : 0;
            console.log('✅ Department students loaded:', {
              totalStudents,
              departmentId: facultyDepartmentId,
              rawResponse: responseData,
              studentsArray: students,
              studentsLength: Array.isArray(students) ? students.length : 'not array'
            });
          } else {
            if (studentsRes.status === 'rejected') {
              const errorStatus = studentsRes.reason?.response?.status;
              console.error('❌ Students API failed:', {
                status: errorStatus,
                data: studentsRes.reason?.response?.data,
                message: studentsRes.reason?.message
              });

              // 403 hatası: Faculty için endpoint erişimi yok
              if (errorStatus === 403) {
                console.warn('⚠️ Faculty does not have access to student endpoints. Backend needs a new endpoint for Faculty to get department student count.');
                // Backend'de Faculty için yeni bir endpoint eklenene kadar 0 göster
                totalStudents = 0;
              } else {
                // Diğer hatalar için section'lardan hesapla (fallback)
                totalStudents = sections.reduce((sum, section) => {
                  return sum + (section.enrolledCount || section.enrollments?.length || 0);
                }, 0);
                console.log('⚠️ Using fallback: total students from sections:', totalStudents);
              }
            } else {
              // Eğer departmentId yoksa
              totalStudents = sections.reduce((sum, section) => {
                return sum + (section.enrolledCount || section.enrollments?.length || 0);
              }, 0);
              console.log('⚠️ No departmentId found, using fallback: total students from sections:', totalStudents);
            }
          }

          // Aktif oturumlar (status: 'active' - backend'den küçük harf geliyor)
          // Duplicate'leri önlemek için id'ye göre unique yap
          const activeSessionsMap = new Map();
          sessions.filter(s =>
            s.status === 'active' || s.status === 'Active' || s.isActive
          ).forEach(session => {
            if (session.id && !activeSessionsMap.has(session.id)) {
              activeSessionsMap.set(session.id, session);
            }
          });
          const activeSessions = Array.from(activeSessionsMap.values());
          const activeSessionsCount = activeSessions.length;

          // Aktif oturumları state'e kaydet
          setActiveSessionsList(activeSessions);

          // Unique courses (aynı course'un farklı section'ları olabilir)
          const uniqueCourses = new Set(sections.map(s => s.courseId || s.course?.id).filter(Boolean));

          setStats({
            enrolledCourses: uniqueCourses.size || sections.length, // Verdiği ders sayısı (unique courses)
            attendancePercentage: 0, // Faculty için kullanılmıyor
            gpa: 0, // Faculty için kullanılmıyor
            activeSessions: activeSessionsCount,
            totalStudents: totalStudents, // Öğretmenin bölümündeki toplam öğrenci sayısı
          });

          // Son aktiviteler (yoklama oturumları ve section'lar)
          const activities = [];
          sessions.slice(0, 3).forEach((session) => {
            activities.push({
              id: `session-${session.id}`, // Unique prefix ekle
              title: `${session.section?.course?.code || 'Ders'} için yoklama oturumu ${session.status === 'Active' || session.status === 'active' ? 'açıldı' : 'kapatıldı'}`,
              time: formatTimeAgo(session.startTime || session.createdAt),
              type: session.status === 'Active' || session.status === 'active' ? 'success' : 'info',
            });
          });
          sections.slice(0, 2).forEach((section) => {
            activities.push({
              id: `section-${section.id}`, // Unique prefix ekle
              title: `${section.course?.code || 'Ders'} - ${section.sectionNumber || 'Şube'} şubesini veriyorsunuz`,
              time: formatTimeAgo(section.createdAt),
              type: 'info',
            });
          });
          setRecentActivities(activities);
        } catch (apiError) {
          console.error('Faculty API hatası:', apiError);
          setStats({
            enrolledCourses: 0,
            attendancePercentage: 0,
            gpa: 0,
            activeSessions: 0,
            totalStudents: 0,
          });
          setRecentActivities([]);
        }
      } else if (isAdmin) {
        // Admin için zaten AdminDashboard var, buraya yönlendir
        navigate('/admin');
        return;
      }
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
      toast.error('Dashboard verileri yüklenemedi: ' + (error.response?.data?.message || error.message));
      // Hata olsa bile boş verilerle devam et
      setStats({
        enrolledCourses: 0,
        attendancePercentage: 0,
        gpa: 0,
        activeSessions: 0,
        totalStudents: 0,
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  // Role kontrolü (render için)
  // Backend'den enum string olarak geliyor: "Student", "Faculty", "Admin"
  const userRole = user?.role ?? user?.Role ?? user?.userRole ?? null;
  const userRoleStr = typeof userRole === 'string' ? userRole.toLowerCase() :
    typeof userRole === 'number' ?
      (userRole === 2 ? 'student' : userRole === 1 ? 'faculty' : 'admin') : '';

  const isStudent = userRoleStr === 'student';
  const isFaculty = userRoleStr === 'faculty';
  const isAdmin = userRoleStr === 'admin';

  console.log('🔍 Dashboard Role Check (Render):', {
    'user.role': user?.role,
    'user.Role': user?.Role,
    'userRole (resolved)': userRole,
    'userRoleStr': userRoleStr,
    'isStudent': isStudent,
    'isFaculty': isFaculty,
    'isAdmin': isAdmin,
    'Full user keys': user ? Object.keys(user) : 'no user'
  });

  // Öğrenci için stats
  const studentStats = [
    {
      title: 'Kayıtlı Dersler',
      value: stats.enrolledCourses.toString(),
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      change: '',
      onClick: () => navigate('/my-courses'),
    },
    {
      title: 'Yoklama Yüzdesi',
      value: `${stats.attendancePercentage}%`,
      icon: CheckCircle,
      color: stats.attendancePercentage >= 80
        ? 'from-green-500 to-green-600'
        : stats.attendancePercentage >= 60
          ? 'from-orange-500 to-orange-600'
          : 'from-red-500 to-red-600',
      change: '',
      onClick: () => navigate('/my-attendance'),
    },
    {
      title: 'GPA',
      value: stats.gpa > 0 ? stats.gpa.toFixed(2) : 'N/A',
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      change: '',
      onClick: () => navigate('/grades'),
    },
    {
      title: 'Aktif Yoklama',
      value: stats.activeSessions.toString(),
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      change: '',
      onClick: () => navigate('/my-attendance'),
    },
  ];

  // Faculty için stats
  const facultyStats = [
    {
      title: 'Verdiğim Dersler',
      value: stats.enrolledCourses.toString(),
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      change: '',
      onClick: () => navigate('/courses'),
    },
    {
      title: 'Aktif Yoklama Oturumları',
      value: stats.activeSessions.toString(),
      icon: Clock,
      color: stats.activeSessions > 0
        ? 'from-green-500 to-green-600'
        : 'from-gray-500 to-gray-600',
      change: '',
      onClick: () => navigate('/attendance'),
    },
    {
      title: 'Toplam Öğrenci',
      value: (stats.totalStudents || 0).toString(),
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      change: '',
      onClick: null, // Toplam öğrenci sayısı bilgilendirme amaçlı, tıklanabilir değil
    },
    {
      title: 'Yoklama Yönetimi',
      value: 'Yönet',
      icon: CheckCircle,
      color: 'from-indigo-500 to-indigo-600',
      change: '',
      onClick: () => navigate('/attendance'),
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 rounded-3xl p-8 text-white shadow-2xl"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-8 h-8" />
              <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                Yeni Güncellemeler
              </span>
            </motion.div>
            <h1 className="text-5xl font-bold mb-3 text-shadow-lg">
              Hoş Geldiniz, {user?.firstName || user?.FirstName || 'Kullanıcı'}! 👋
            </h1>
            <p className="text-primary-100 text-xl">
              Smart Campus yönetim paneline hoş geldiniz
            </p>
          </div>
        </motion.div>

        {/* Email Verification Warning */}
        {user && !user.emailConfirmed && !user.isEmailVerified && (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Email adresiniz doğrulanmamış. Lütfen email'inizi kontrol edin ve doğrulama linkine tıklayın.
                  </p>
                </div>
                <motion.button
                  onClick={() => navigate('/profile')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-yellow-700 dark:text-yellow-400 hover:underline"
                >
                  Profil'e Git
                </motion.button>
              </div>
            </GlassCard>
          </AnimatedCard>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <AnimatedCard key={i} delay={i * 0.1}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </GlassCard>
              </AnimatedCard>
            ))}
          </div>
        ) : isStudent ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studentStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <AnimatedCard key={stat.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    onClick={stat.onClick}
                    className="relative z-10"
                  >
                    <GlassCard className="p-6 group cursor-pointer relative overflow-hidden" style={{ pointerEvents: 'auto' }}>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/10 group-hover:to-purple-500/10 transition-all duration-300"
                      />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg relative overflow-hidden`}
                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                              }}
                            />
                            <Icon className="w-6 h-6 text-white relative z-10" />
                          </motion.div>
                          {stat.change && (
                            <motion.span
                              className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg"
                              whileHover={{ scale: 1.1 }}
                            >
                              {stat.change}
                            </motion.span>
                          )}
                        </div>
                        <motion.h3
                          className="text-3xl font-bold gradient-text mb-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                        >
                          {stat.value}
                        </motion.h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {stat.title}
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                </AnimatedCard>
              );
            })}
          </div>
        ) : isFaculty ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facultyStats.map((stat, index) => {
              const Icon = stat.icon;
              const isClickable = stat.onClick !== null && stat.onClick !== undefined;
              return (
                <AnimatedCard key={stat.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={isClickable ? { y: -5 } : {}}
                    onClick={isClickable ? stat.onClick : undefined}
                    className={`relative z-10 ${isClickable ? 'cursor-pointer' : ''}`}
                  >
                    <GlassCard className={`p-6 group relative overflow-hidden ${isClickable ? 'cursor-pointer' : ''}`} style={{ pointerEvents: isClickable ? 'auto' : 'none' }}>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/10 group-hover:to-purple-500/10 transition-all duration-300"
                      />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg relative overflow-hidden`}
                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                              }}
                            />
                            <Icon className="w-6 h-6 text-white relative z-10" />
                          </motion.div>
                          {stat.change && (
                            <motion.span
                              className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg"
                              whileHover={{ scale: 1.1 }}
                            >
                              {stat.change}
                            </motion.span>
                          )}
                        </div>
                        <motion.h3
                          className="text-3xl font-bold gradient-text mb-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                        >
                          {stat.value}
                        </motion.h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {stat.title}
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                </AnimatedCard>
              );
            })}
          </div>
        ) : (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {!user ? 'Yükleniyor...' : isAdmin ? 'Admin paneline yönlendiriliyorsunuz...' : 'Bu sayfa öğrenciler ve öğretim üyeleri için tasarlanmıştır.'}
              </p>
            </GlassCard>
          </AnimatedCard>
        )}

        {/* Active Attendance Sessions - Faculty Only */}
        {isFaculty && activeSessionsList.length > 0 && (
          <AnimatedCard delay={0.3}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Aktif Yoklama Oturumları ({activeSessionsList.length})
                  </h2>
                </div>
              </div>
              <div className="space-y-4">
                {activeSessionsList.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                            {session.courseCode || session.section?.course?.code || 'N/A'}
                          </span>
                          {session.sectionNumber && (
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-semibold">
                              Section {session.sectionNumber}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {session.courseName || session.section?.course?.name || 'Ders Adı'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(session.date).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {typeof session.startTime === 'string'
                                ? session.startTime
                                : session.startTime?.substring(0, 5) || 'N/A'} - {typeof session.endTime === 'string'
                                  ? session.endTime
                                  : session.endTime?.substring(0, 5) || 'N/A'}
                            </span>
                          </div>
                          {session.attendedCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{session.attendedCount || 0} / {session.totalStudents || 0} öğrenci</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        onClick={async () => {
                          try {
                            await api.put(`/attendance/sessions/${session.id}/close`);
                            toast.success('Yoklama oturumu kapatıldı!');
                            // Refresh dashboard data
                            fetchDashboardData();
                          } catch (error) {
                            console.error('❌ Close session error:', error);
                            const errorMessage = error.response?.data?.message || error.message || 'Oturum kapatılamadı';
                            toast.error(errorMessage);
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Bitir
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </AnimatedCard>
        )}

        {/* Recent Activities */}
        <AnimatedCard delay={0.4}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Son Aktiviteler
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  {isStudent
                    ? 'Henüz aktivite bulunmuyor. Ders kataloğundan ders seçerek başlayabilirsiniz.'
                    : isFaculty
                      ? 'Henüz aktivite bulunmuyor. Dersleriniz ve yoklama oturumlarınız burada görünecek.'
                      : 'Henüz aktivite bulunmuyor.'}
                </p>
                {isStudent && (
                  <motion.button
                    onClick={() => navigate('/courses')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 btn-primary relative z-10"
                    style={{ pointerEvents: 'auto' }}
                  >
                    Ders Kataloğuna Git
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${activity.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                      <CheckCircle className={`w-5 h-5 ${activity.type === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-blue-600 dark:text-blue-400'
                        }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </AnimatedCard>

        {/* Quick Actions for Students */}
        {isStudent && !loading && (
          <AnimatedCard delay={0.5}>
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Hızlı Erişim
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  onClick={() => navigate('/courses')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white text-left relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <BookOpen className="w-6 h-6 mb-2" />
                  <p className="font-semibold">Ders Kataloğu</p>
                  <p className="text-sm opacity-90">Yeni ders seç</p>
                </motion.button>
                <motion.button
                  onClick={() => navigate('/my-courses')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white text-left relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <GraduationCap className="w-6 h-6 mb-2" />
                  <p className="font-semibold">Derslerim</p>
                  <p className="text-sm opacity-90">Kayıtlı derslerim</p>
                </motion.button>
                <motion.button
                  onClick={() => navigate('/grades')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white text-left relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <TrendingUp className="w-6 h-6 mb-2" />
                  <p className="font-semibold">Notlarım</p>
                  <p className="text-sm opacity-90">GPA ve notlar</p>
                </motion.button>
              </div>
            </GlassCard>
          </AnimatedCard>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;

