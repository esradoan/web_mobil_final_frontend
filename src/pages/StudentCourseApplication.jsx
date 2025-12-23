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
      console.log('✅ Courses fetched (raw):', coursesData);
      console.log('✅ Courses count:', coursesData.length);
      
      // Log detailed section information for each course
      coursesData.forEach((course, index) => {
        const courseId = course.id || course.Id;
        const courseCode = course.code || course.Code;
        const sections = course.sections || course.Sections || [];
        console.log(`📚 Course ${index + 1} - ${courseCode}:`, {
          id: courseId,
          code: courseCode,
          name: course.name || course.Name,
          sectionsRaw: course.sections,
          SectionsRaw: course.Sections,
          sectionsCount: sections.length,
          sections: sections,
          allKeys: Object.keys(course)
        });
        
        // Log each section
        sections.forEach((section, secIndex) => {
          console.log(`  📋 Section ${secIndex + 1}:`, {
            id: section.id || section.Id,
            sectionNumber: section.sectionNumber || section.SectionNumber,
            instructorId: section.instructorId || section.InstructorId,
            instructorName: section.instructorName || section.InstructorName,
            capacity: section.capacity || section.Capacity,
            enrolledCount: section.enrolledCount || section.EnrolledCount,
            allKeys: Object.keys(section)
          });
        });
      });
      
      setCourses(coursesData);
    } catch (error) {
      console.error('❌ Courses fetch failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
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
      console.log('📝 Apply button clicked:', { courseId, sectionId });
      setApplyingSectionId(sectionId);
      
      // Önce bu section'a başvuru yapılıp yapılamayacağını kontrol et
      console.log('🔍 Checking if can apply to section:', sectionId);
      const canApplyResponse = await api.get('/student-course-applications/can-apply', {
        params: { sectionId }
      });
      console.log('✅ Can apply response:', canApplyResponse.data);
      
      if (!canApplyResponse.data?.canApply) {
        toast.error('Bu şubeye başvuru yapamazsınız. Kapasite dolmuş olabilir veya zaten başvuru yaptınız.');
        return;
      }

      console.log('📤 Sending application:', { courseId, sectionId });
      await api.post('/student-course-applications', { courseId, sectionId });
      toast.success('Başvurunuz başarıyla gönderildi!');
      await fetchMyApplications();
      await fetchAvailableCourses();
    } catch (error) {
      console.error('❌ Application failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 'Başvuru yapılırken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setApplyingSectionId(null);
    }
  };

  const getApplicationStatus = (sectionId) => {
    // Handle both camelCase and PascalCase
    const application = applications.find(app => 
      (app.sectionId === sectionId) || (app.SectionId === sectionId)
    );
    if (!application) {
      console.log('🔍 No application found for sectionId:', sectionId);
      return null;
    }
    
    console.log('✅ Application found for sectionId:', sectionId, application);
    return {
      status: application.status || application.Status,
      processedAt: application.processedAt || application.ProcessedAt,
      rejectionReason: application.rejectionReason || application.RejectionReason
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
              // Handle both camelCase and PascalCase from backend
              // Backend returns Sections (PascalCase), but check both
              const sections = course.sections || course.Sections || [];
              const hasInstructor = sections.length > 0 && sections.some(s => {
                const instructorId = s.instructorId || s.InstructorId || 0;
                return instructorId > 0;
              });
              
              // Debug: Log course structure
              console.log(`📚 Course ${course.code || course.Code}:`, {
                id: course.id || course.Id,
                code: course.code || course.Code,
                name: course.name || course.Name,
                sectionsRaw: course.sections,
                SectionsRaw: course.Sections,
                sectionsParsed: sections,
                sectionsCount: sections.length,
                sectionsType: typeof sections,
                isArray: Array.isArray(sections),
                hasInstructor,
                allCourseKeys: Object.keys(course)
              });
              
              // If sections is not an array, try to convert it
              let validSections = sections;
              if (!Array.isArray(sections) && sections !== null && sections !== undefined) {
                console.warn('⚠️ Sections is not an array, attempting to convert:', sections);
                validSections = [];
              }
              
              // Use validSections for rendering
              const sectionsToRender = validSections;
              
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
                        onClick={() => {
                          const courseId = course.id || course.Id;
                          const isExpanded = expandedCourseId === courseId;
                          console.log('🔘 Şubeleri Göster clicked for course:', {
                            courseId,
                            courseCode: course.code || course.Code,
                            isExpanded,
                            sections: sectionsToRender,
                            sectionsCount: sectionsToRender.length
                          });
                          setExpandedCourseId(isExpanded ? null : courseId);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        {expandedCourseId === (course.id || course.Id) ? 'Gizle' : 'Şubeleri Göster'}
                      </motion.button>
                    </div>

                    {/* Sections */}
                    {expandedCourseId === (course.id || course.Id) && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {(() => {
                          console.log('🔍 Rendering sections for course:', {
                            courseId: course.id || course.Id,
                            courseCode: course.code || course.Code,
                            expandedCourseId,
                            sections: sectionsToRender,
                            sectionsLength: sectionsToRender.length,
                            sectionsType: typeof sectionsToRender,
                            isArray: Array.isArray(sectionsToRender),
                            courseSections: course.sections,
                            courseSectionsPascal: course.Sections
                          });
                          return null;
                        })()}
                        {sectionsToRender.length === 0 ? (
                          <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                            <p>Bu ders için henüz şube oluşturulmamış.</p>
                            <p className="text-xs mt-2 opacity-75">
                              (Section sayısı: {sectionsToRender.length}, Tip: {typeof sectionsToRender}, Array: {Array.isArray(sectionsToRender) ? 'Evet' : 'Hayır'})
                            </p>
                            <p className="text-xs mt-1 opacity-50">
                              Backend'den section'lar gelmiyor olabilir. Lütfen admin ile iletişime geçin.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sectionsToRender.map((section, sectionIndex) => {
                              // Handle both camelCase and PascalCase from backend
                              const sectionId = section.id || section.Id;
                              const applicationStatus = getApplicationStatus(sectionId);
                              const isPending = applicationStatus?.status === 'Pending' || applicationStatus?.status === 0;
                              const isApproved = applicationStatus?.status === 'Approved' || applicationStatus?.status === 1;
                              const isRejected = applicationStatus?.status === 'Rejected' || applicationStatus?.status === 2;
                              const enrolledCount = section.enrolledCount || section.EnrolledCount || 0;
                              const capacity = section.capacity || section.Capacity || 0;
                              const isFull = enrolledCount >= capacity;
                              
                              console.log('📋 Section render:', {
                                index: sectionIndex,
                                sectionId,
                                sectionNumber: section.sectionNumber || section.SectionNumber,
                                enrolledCount,
                                capacity,
                                isFull,
                                applicationStatus,
                                hasApplication: !!applicationStatus
                              });
                              
                              return (
                                <div
                                  key={sectionId || sectionIndex}
                                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                      Şube {section.sectionNumber || section.SectionNumber}
                                    </span>
                                    {(section.instructorName || section.InstructorName) && (
                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Hoca: {section.instructorName || section.InstructorName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      <span>{(section.semester || section.Semester)} {(section.year || section.Year)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4" />
                                      <span>{enrolledCount} / {capacity} öğrenci</span>
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
                                  onClick={() => {
                                    console.log('📝 Başvuru Yap button clicked:', {
                                      courseId: course.id || course.Id,
                                      sectionId,
                                      isFull,
                                      applyingSectionId,
                                      hasApplication: !!applicationStatus
                                    });
                                    handleApply(course.id || course.Id, sectionId);
                                  }}
                                  disabled={applyingSectionId === sectionId || isFull}
                                  whileHover={!isFull && applyingSectionId !== sectionId ? { scale: 1.02 } : {}}
                                  whileTap={!isFull && applyingSectionId !== sectionId ? { scale: 0.98 } : {}}
                                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                    isFull || applyingSectionId === sectionId
                                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                  }`}
                                >
                                  {applyingSectionId === sectionId ? (
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

