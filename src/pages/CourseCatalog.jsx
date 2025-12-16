import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Search, Filter, BookOpen, GraduationCap, ChevronRight, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const CourseCatalog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [courseTypeFilter, setCourseTypeFilter] = useState('all'); // 'all', 'required', 'elective', 'generalElective'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchDepartments();
    fetchCourses();
  }, [pagination.page, searchTerm, selectedDepartment, courseTypeFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Departments yüklenemedi:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }

      // Note: Course type filtering can be done on frontend or backend
      // For now, we'll filter on frontend after fetching
      const response = await api.get('/courses', { params });
      let filteredCourses = response.data?.data || [];
      
      // Filter by course type on frontend
      if (courseTypeFilter !== 'all') {
        filteredCourses = filteredCourses.filter(course => {
          const courseType = course.type?.toLowerCase() || 'required';
          return courseType === courseTypeFilter.toLowerCase();
        });
      }
      
      setCourses(filteredCourses);
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || filteredCourses.length,
        totalPages: response.data?.pagination?.totalPages || Math.ceil(filteredCourses.length / prev.limit),
      }));
    } catch (error) {
      console.error('Courses yüklenemedi:', error);
      toast.error('Dersler yüklenemedi');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
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
              Ders Kataloğu
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Tüm dersleri görüntüleyin ve kayıt olun
            </p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ders kodu veya adı ile ara..."
                    className="input-field pl-10 w-full"
                  />
                </div>

                {/* Department Filter */}
                <div className="relative md:w-64">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    className="input-field pl-10 appearance-none pr-10 w-full"
                  >
                    <option value="">Tüm Bölümler</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Type Filter */}
                <div className="relative md:w-48">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={courseTypeFilter}
                    onChange={(e) => {
                      setCourseTypeFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="input-field pl-10 appearance-none pr-10 w-full"
                  >
                    <option value="all">Tüm Ders Tipleri</option>
                    <option value="required">Zorunlu Dersler</option>
                    <option value="elective">Seçmeli Dersler</option>
                    <option value="generalElective">Genel Seçmeli Dersler</option>
                  </select>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary px-6"
                >
                  Ara
                </motion.button>
              </div>
            </form>
          </GlassCard>
        </AnimatedCard>

        {/* Courses List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : courses.length === 0 ? (
          <AnimatedCard delay={0.2}>
            <GlassCard className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Ders bulunamadı
              </p>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <AnimatedCard key={course.id} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <GlassCard className="p-6 h-full flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    {/* Course Code & Name */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                          {course.code}
                        </span>
                        {/* Course Type Badge */}
                        {course.type && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                            course.type === 'Required'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                              : course.type === 'Elective'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          }`}>
                            {course.type === 'Required' && <CheckCircle className="w-3 h-3" />}
                            {course.type === 'Elective' && <BookOpen className="w-3 h-3" />}
                            {course.type === 'GeneralElective' && <Globe className="w-3 h-3" />}
                            {course.type === 'Required' ? 'Zorunlu' : course.type === 'Elective' ? 'Seçmeli' : 'Genel Seçmeli'}
                          </span>
                        )}
                        {/* Cross-Department Warning */}
                        {user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            <AlertCircle className="w-3 h-3" />
                            Farklı Bölüm
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {course.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-1 line-clamp-2">
                      {course.description || 'Açıklama bulunmuyor'}
                    </p>

                    {/* Info */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <GraduationCap className="w-4 h-4" />
                        <span>{course.credits} Kredi</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {course.ects} ECTS
                      </div>
                    </div>

                    {/* Department */}
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300">
                        {course.department?.name || 'Bölüm bilgisi yok'}
                      </span>
                    </div>

                    {/* View Details */}
                    <motion.div
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm"
                      whileHover={{ x: 5 }}
                    >
                      <span>Detayları Gör</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </GlassCard>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <AnimatedCard delay={0.3}>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Sayfa {pagination.page} / {pagination.totalPages} (Toplam {pagination.total} ders)
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </AnimatedCard>
        )}
      </div>
    </Layout>
  );
};

export default CourseCatalog;

