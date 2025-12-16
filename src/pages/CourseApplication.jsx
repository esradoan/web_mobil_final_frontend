import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CourseApplication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingCourseId, setApplyingCourseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchMyApplications();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses', {
        params: {
          page: 1,
          limit: 1000
        }
      });
      const coursesData = response.data?.data || response.data || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('❌ Courses fetch failed:', error);
      toast.error('Dersler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const departmentsData = response.data?.data || response.data || [];
      setDepartments(departmentsData);
    } catch (error) {
      console.error('❌ Departments fetch failed:', error);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await api.get('/course-applications', {
        params: {
          page: 1,
          pageSize: 100
        }
      });
      const applicationsData = response.data?.data || [];
      setApplications(applicationsData);
    } catch (error) {
      console.error('❌ Applications fetch failed:', error);
    }
  };

  const handleApply = async (courseId) => {
    try {
      setApplyingCourseId(courseId);
      
      // Önce bu course'a başvuru yapılıp yapılamayacağını kontrol et
      const canApplyResponse = await api.get('/course-applications/can-apply', {
        params: { courseId }
      });
      
      if (!canApplyResponse.data?.canApply) {
        toast.error('Bu derse başvuru yapamazsınız. Maksimum 2 ders limitiniz dolmuş olabilir veya bu derse başka bir öğretmen atanmış olabilir.');
        return;
      }

      await api.post('/course-applications', { courseId });
      toast.success('Başvurunuz başarıyla gönderildi!');
      await fetchMyApplications();
      await fetchCourses();
    } catch (error) {
      console.error('❌ Application failed:', error);
      const errorMessage = error.response?.data?.message || 'Başvuru yapılırken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setApplyingCourseId(null);
    }
  };

  const getApplicationStatus = (courseId) => {
    const application = applications.find(app => app.courseId === courseId);
    if (!application) return null;
    
    return {
      status: application.status,
      processedAt: application.processedAt,
      rejectionReason: application.rejectionReason
    };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
      case 0:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Beklemede
          </span>
        );
      case 'Approved':
      case 1:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Onaylandı
          </span>
        );
      case 'Rejected':
      case 2:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Reddedildi
          </span>
        );
      default:
        return null;
    }
  };

  // Filtreleme
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || 
      course.departmentId?.toString() === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Mevcut başvuruları say
  const approvedCount = applications.filter(app => app.status === 'Approved' || app.status === 1).length;
  const pendingCount = applications.filter(app => app.status === 'Pending' || app.status === 0).length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Ders Başvurusu</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Derslere başvuru yapabilirsiniz. Maksimum 2 ders alabilirsiniz.
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Onaylanan Dersler</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bekleyen Başvurular</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Maksimum Ders</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </AnimatedCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ders kodu veya adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Bölümler</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* Courses List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Dersler yükleniyor...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Başvuru yapılabilecek ders bulunamadı.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course, index) => {
              const applicationStatus = getApplicationStatus(course.id);
              const isPending = applicationStatus?.status === 'Pending' || applicationStatus?.status === 0;
              const isApproved = applicationStatus?.status === 'Approved' || applicationStatus?.status === 1;
              const isRejected = applicationStatus?.status === 'Rejected' || applicationStatus?.status === 2;
              
              return (
                <AnimatedCard
                  key={course.id}
                  className="p-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {course.code || 'N/A'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {course.name || 'Ders Adı'}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" />
                        <span>Kredi: {course.credits} | ECTS: {course.ects}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <GraduationCap className="w-4 h-4" />
                        <span>{course.department?.name || 'Bölüm bilgisi yok'}</span>
                      </div>
                      {course.type && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Filter className="w-4 h-4" />
                          <span>
                            {course.type === 'Required' ? 'Zorunlu' : 
                             course.type === 'Elective' ? 'Seçmeli' : 
                             'Genel Seçmeli'}
                          </span>
                        </div>
                      )}
                    </div>

                    {applicationStatus && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        {getStatusBadge(applicationStatus.status)}
                        {isRejected && applicationStatus.rejectionReason && (
                          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                            {applicationStatus.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {!applicationStatus && (
                      <motion.button
                        onClick={() => handleApply(course.id)}
                        disabled={applyingCourseId === course.id || approvedCount >= 2}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          approvedCount >= 2
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {applyingCourseId === course.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Başvuru yapılıyor...
                          </span>
                        ) : (
                          'Başvuru Yap'
                        )}
                      </motion.button>
                    )}

                    {approvedCount >= 2 && !applicationStatus && (
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">
                        Maksimum 2 ders limitinize ulaştınız
                      </p>
                    )}
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseApplication;

