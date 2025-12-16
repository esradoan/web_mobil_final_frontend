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
  Filter,
  User,
  Building
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const StudentCourseApplication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingSectionId, setApplyingSectionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  useEffect(() => {
    fetchAvailableCourses();
    fetchMyApplications();
    fetchDepartments();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student-course-applications/available-courses');
      const coursesData = response.data || [];
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
      const response = await api.get('/student-course-applications', {
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

  const handleApply = async (courseId, sectionId) => {
    try {
      setApplyingSectionId(sectionId);
      
      // Önce bu section'a başvuru yapılıp yapılamayacağını kontrol et
      const canApplyResponse = await api.get('/student-course-applications/can-apply', {
        params: { sectionId }
      });
      
      if (!canApplyResponse.data?.canApply) {
        toast.error('Bu şubeye başvuru yapamazsınız. Kapasite dolmuş olabilir veya zaten başvuru yaptınız.');
        return;
      }

      await api.post('/student-course-applications', { courseId, sectionId });
      toast.success('Başvurunuz başarıyla gönderildi!');
      await fetchMyApplications();
      await fetchAvailableCourses();
    } catch (error) {
      console.error('❌ Application failed:', error);
      const errorMessage = error.response?.data?.message || 'Başvuru yapılırken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setApplyingSectionId(null);
    }
  };

  const getApplicationStatus = (sectionId) => {
    const application = applications.find(app => app.sectionId === sectionId);
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
              Derslere başvuru yapabilirsiniz. Hocası olan dersler önce gösterilmektedir.
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Ders</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{courses.length}</p>
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
          <div className="space-y-4">
            {filteredCourses.map((course, index) => {
              const hasInstructor = course.sections?.some(s => s.instructorId > 0);
              const sections = course.sections || [];
              
              return (
                <AnimatedCard
                  key={course.id}
                  className="p-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="space-y-4">
                    {/* Course Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {course.code || 'N/A'}
                          </h3>
                          {hasInstructor && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              Hoca Atanmış
                            </span>
                          )}
                        </div>
                        <p className="text-base text-slate-600 dark:text-slate-400 mb-2">
                          {course.name || 'Ders Adı'}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Kredi: {course.credits} | ECTS: {course.ects}</span>
                          </div>
                          {course.department && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <span>{course.department.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        {expandedCourseId === course.id ? 'Gizle' : 'Şubeleri Göster'}
                      </motion.button>
                    </div>

                    {/* Sections */}
                    {expandedCourseId === course.id && sections.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                        {sections.map((section) => {
                          const applicationStatus = getApplicationStatus(section.id);
                          const isPending = applicationStatus?.status === 'Pending' || applicationStatus?.status === 0;
                          const isApproved = applicationStatus?.status === 'Approved' || applicationStatus?.status === 1;
                          const isRejected = applicationStatus?.status === 'Rejected' || applicationStatus?.status === 2;
                          const isFull = section.enrolledCount >= section.capacity;
                          
                          return (
                            <div
                              key={section.id}
                              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                      Şube {section.sectionNumber}
                                    </span>
                                    {section.instructorName && (
                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Hoca: {section.instructorName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      <span>{section.semester} {section.year}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4" />
                                      <span>{section.enrolledCount} / {section.capacity} öğrenci</span>
                                    </div>
                                  </div>
                                </div>
                                {applicationStatus && (
                                  <div className="ml-4">
                                    {getStatusBadge(applicationStatus.status)}
                                  </div>
                                )}
                              </div>

                              {!applicationStatus && (
                                <motion.button
                                  onClick={() => handleApply(course.id, section.id)}
                                  disabled={applyingSectionId === section.id || isFull}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                    isFull || applyingSectionId === section.id
                                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  {applyingSectionId === section.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Başvuru yapılıyor...
                                    </span>
                                  ) : isFull ? (
                                    'Kapasite Dolu'
                                  ) : (
                                    'Başvuru Yap'
                                  )}
                                </motion.button>
                              )}

                              {isRejected && applicationStatus?.rejectionReason && (
                                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                                  {applicationStatus.rejectionReason}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {expandedCourseId === course.id && sections.length === 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                        Bu ders için henüz şube oluşturulmamış.
                      </div>
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

export default StudentCourseApplication;

