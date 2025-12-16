import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Users, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Globe,
  Plus,
  Edit,
  X,
  Save,
  Trash2,
  Building
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const sectionSchema = z.object({
  sectionNumber: z.string().min(1, 'Section numarası gereklidir'),
  semester: z.string().min(1, 'Dönem seçimi gereklidir'),
  year: z.number().min(2020, 'Yıl 2020\'den küçük olamaz').max(2030, 'Yıl 2030\'dan büyük olamaz'),
  instructorId: z.number().min(1, 'Öğretim üyesi seçimi gereklidir'),
  capacity: z.number().min(1, 'Kapasite en az 1 olmalıdır').max(500, 'Kapasite en fazla 500 olabilir'),
  classroomId: z.number().optional(),
  scheduleJson: z.string().optional(),
});

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState({});
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const isAdmin = user?.role === 'Admin';

  const {
    register: registerSection,
    handleSubmit: handleSubmitSection,
    formState: { errors: errorsSection },
    reset: resetSectionForm,
    setValue: setSectionFormValue,
  } = useForm({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      sectionNumber: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      instructorId: '',
      capacity: 50,
      classroomId: '',
      scheduleJson: '',
    },
  });

  useEffect(() => {
    fetchCourseDetails();
    if (isAdmin) {
      fetchFaculty();
      fetchClassrooms();
    }
  }, [id, isAdmin]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
      setSections(response.data?.sections || []);
    } catch (error) {
      console.error('Course detayları yüklenemedi:', error);
      toast.error('Ders detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/users/faculty');
      setFaculty(response.data?.data || []);
    } catch (error) {
      console.error('Faculty listesi yüklenemedi:', error);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await api.get('/classrooms');
      setClassrooms(response.data?.data || []);
    } catch (error) {
      console.error('Classroom listesi yüklenemedi:', error);
    }
  };

  const handleEnroll = async (sectionId) => {
    try {
      setEnrolling(prev => ({ ...prev, [sectionId]: true }));
      const response = await api.post('/enrollments', { sectionId });
      
      toast.success('Derse başarıyla kayıt oldunuz!');
      // Refresh course details to show updated enrollment status
      await fetchCourseDetails();
      // Navigate to my-courses after a short delay
      setTimeout(() => {
        navigate('/my-courses');
      }, 1500);
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Kayıt başarısız';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        // Map backend error codes to user-friendly messages
        const errorMap = {
          'PrerequisiteCheckFailed': 'Önkoşul dersleri tamamlanmamış',
          'ScheduleConflict': 'Ders programı çakışması var',
          'CapacityExceeded': 'Ders kapasitesi dolu',
          'AlreadyEnrolled': 'Bu derse zaten kayıtlısınız',
          'EnrollmentFailed': 'Kayıt işlemi başarısız'
        };
        errorMessage = errorMap[errorData.error] || errorData.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setEnrolling(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Bilgi yok';
    
    if (typeof schedule === 'string') {
      try {
        schedule = JSON.parse(schedule);
      } catch {
        return schedule;
      }
    }
    
    const days = {
      monday: 'Pazartesi',
      tuesday: 'Salı',
      wednesday: 'Çarşamba',
      thursday: 'Perşembe',
      friday: 'Cuma',
      saturday: 'Cumartesi',
      sunday: 'Pazar',
    };

    return Object.entries(schedule)
      .map(([day, times]) => {
        const dayName = days[day] || day;
        const timeArray = Array.isArray(times) ? times : [times];
        return `${dayName}: ${timeArray.join(', ')}`;
      })
      .join(' | ');
  };

  const handleCreateSection = () => {
    setEditingSection(null);
    resetSectionForm({
      sectionNumber: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      instructorId: '',
      capacity: 50,
      classroomId: '',
      scheduleJson: '',
    });
    setShowSectionModal(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionFormValue('sectionNumber', section.sectionNumber);
    setSectionFormValue('semester', section.semester);
    setSectionFormValue('year', section.year);
    setSectionFormValue('instructorId', section.instructorId);
    setSectionFormValue('capacity', section.capacity);
    setSectionFormValue('classroomId', section.classroom?.id || '');
    setSectionFormValue('scheduleJson', section.scheduleJson || '');
    setShowSectionModal(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Bu section\'ı silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await api.delete(`/sections/${sectionId}`);
      toast.success('Section başarıyla silindi');
      fetchCourseDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Section silinemedi');
    }
  };

  const onSubmitSection = async (data) => {
    try {
      const sectionData = {
        ...data,
        courseId: parseInt(id),
        classroomId: data.classroomId ? parseInt(data.classroomId) : null,
      };

      if (editingSection) {
        await api.put(`/sections/${editingSection.id}`, sectionData);
        toast.success('Section başarıyla güncellendi');
      } else {
        await api.post('/sections', sectionData);
        toast.success('Section başarıyla oluşturuldu');
      }
      
      setShowSectionModal(false);
      fetchCourseDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
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

  if (!course) {
    return (
      <Layout>
        <AnimatedCard>
          <GlassCard className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Ders bulunamadı
            </p>
            <motion.button
              onClick={() => navigate('/courses')}
              className="btn-primary mt-4"
            >
              Ders Kataloğuna Dön
            </motion.button>
          </GlassCard>
        </AnimatedCard>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Ders Kataloğuna Dön</span>
        </motion.button>

        {/* Course Header */}
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono font-bold text-2xl text-primary-600 dark:text-primary-400">
                    {course.code}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300">
                    {course.department?.name}
                  </span>
                  {/* Course Type Badge */}
                  {course.type && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${
                      course.type === 'Required'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : course.type === 'Elective'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    }`}>
                      {course.type === 'Required' && <CheckCircle className="w-4 h-4" />}
                      {course.type === 'Elective' && <BookOpen className="w-4 h-4" />}
                      {course.type === 'GeneralElective' && <Globe className="w-4 h-4" />}
                      {course.type === 'Required' ? 'Zorunlu Ders' : course.type === 'Elective' ? 'Seçmeli Ders' : 'Genel Seçmeli Ders'}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  {course.name}
                </h1>
                
                {/* Cross-Department Warning */}
                {user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                          Farklı Bölümden Ders
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Bu ders ({course.code}) sadece <strong>{course.department?.name}</strong> bölümü öğrencileri için açıktır. 
                          Farklı bölümden ders almak için genel seçmeli dersleri tercih ediniz.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    <span>{course.credits} Kredi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{course.ects} ECTS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Açıklama
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {course.description || 'Açıklama bulunmuyor'}
              </p>
            </div>

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Önkoşullar
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((prereq) => (
                    <motion.div
                      key={prereq.id}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 cursor-pointer"
                      onClick={() => navigate(`/courses/${prereq.id}`)}
                    >
                      <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="font-mono text-sm font-semibold text-primary-700 dark:text-primary-300">
                        {prereq.code}
                      </span>
                      <span className="text-sm text-primary-600 dark:text-primary-400">
                        {prereq.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Syllabus */}
            {course.syllabusUrl && (
              <div>
                <a
                  href={course.syllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Ders Programını İndir (PDF)
                </a>
              </div>
            )}
          </GlassCard>
        </AnimatedCard>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Mevcut Section'lar
            </h2>
            {isAdmin && (
              <motion.button
                onClick={handleCreateSection}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Yeni Section Oluştur
              </motion.button>
            )}
          </div>
          {sections.length === 0 ? (
            <AnimatedCard delay={0.2}>
              <GlassCard className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Bu ders için aktif section bulunmuyor
                </p>
              </GlassCard>
            </AnimatedCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections.map((section, index) => (
                <AnimatedCard key={section.id} delay={0.2 + index * 0.1}>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                          Section {section.sectionNumber}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {section.semester} {section.year}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {section.enrolledCount} / {section.capacity}
                        </span>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {section.instructor?.firstName} {section.instructor?.lastName}
                      </span>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatSchedule(section.schedule)}
                      </span>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <motion.div
                          className="bg-primary-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(section.enrolledCount / section.capacity) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Cross-Department Warning for Enrollment */}
                    {user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective' && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Bu ders sadece <strong>{course.department?.name}</strong> bölümü öğrencileri için açıktır. Kayıt yapamazsınız.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isAdmin ? (
                        <>
                          <motion.button
                            onClick={() => handleEditSection(section)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 btn-secondary flex items-center justify-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Düzenle
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteSection(section.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          onClick={() => handleEnroll(section.id)}
                          disabled={
                            enrolling[section.id] || 
                            section.enrolledCount >= section.capacity ||
                            (user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective')
                          }
                          whileHover={{ 
                            scale: (section.enrolledCount < section.capacity && 
                                   !(user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective')) 
                              ? 1.02 : 1 
                          }}
                          whileTap={{ 
                            scale: (section.enrolledCount < section.capacity && 
                                   !(user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective')) 
                              ? 0.98 : 1 
                          }}
                          className={`w-full btn-primary ${
                            section.enrolledCount >= section.capacity ||
                            (user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective')
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          {enrolling[section.id] ? (
                            <span className="flex items-center justify-center gap-2">
                              <motion.div
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              />
                              Kayıt yapılıyor...
                            </span>
                          ) : section.enrolledCount >= section.capacity ? (
                            'Dolu'
                          ) : (user?.role === 'Student' && course.department?.id !== user?.departmentId && !course.allowCrossDepartment && course.type !== 'GeneralElective') ? (
                            'Kayıt Yapılamaz'
                          ) : (
                            'Kayıt Ol'
                          )}
                        </motion.button>
                      )}
                    </div>
                  </GlassCard>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>

        {/* Section Modal */}
        <AnimatePresence>
          {showSectionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSectionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {editingSection ? 'Section Düzenle' : 'Yeni Section Oluştur'}
                  </h3>
                  <motion.button
                    onClick={() => setShowSectionModal(false)}
                    whileHover={{ rotate: 90 }}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
                <form onSubmit={handleSubmitSection(onSubmitSection)} className="p-6 space-y-6">
                  {/* Section Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Section Numarası
                    </label>
                    <input
                      type="text"
                      {...registerSection('sectionNumber')}
                      className="input-field"
                      placeholder="A, B, C..."
                      disabled={!!editingSection}
                    />
                    {errorsSection.sectionNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errorsSection.sectionNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Semester */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Dönem
                      </label>
                      <select
                        {...registerSection('semester')}
                        className="input-field"
                        disabled={!!editingSection}
                      >
                        <option value="Fall">Güz (Fall)</option>
                        <option value="Spring">Bahar (Spring)</option>
                        <option value="Summer">Yaz (Summer)</option>
                      </select>
                      {errorsSection.semester && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errorsSection.semester.message}
                        </p>
                      )}
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Yıl
                      </label>
                      <input
                        type="number"
                        {...registerSection('year', { valueAsNumber: true })}
                        className="input-field"
                        placeholder="2025"
                        disabled={!!editingSection}
                      />
                      {errorsSection.year && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errorsSection.year.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Instructor */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Öğretim Üyesi
                    </label>
                    <select
                      {...registerSection('instructorId', { valueAsNumber: true })}
                      className="input-field"
                    >
                      <option value="">Öğretim Üyesi Seçiniz</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.title} {f.firstName} {f.lastName} - {f.departmentName}
                        </option>
                      ))}
                    </select>
                    {errorsSection.instructorId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errorsSection.instructorId.message}
                      </p>
                    )}
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Kapasite
                    </label>
                    <input
                      type="number"
                      {...registerSection('capacity', { valueAsNumber: true })}
                      className="input-field"
                      placeholder="50"
                    />
                    {errorsSection.capacity && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errorsSection.capacity.message}
                      </p>
                    )}
                  </div>

                  {/* Classroom */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Building className="inline-block w-4 h-4 mr-2" />
                      Sınıf (Opsiyonel)
                    </label>
                    <select
                      {...registerSection('classroomId', { valueAsNumber: true })}
                      className="input-field"
                    >
                      <option value="">Sınıf Seçiniz</option>
                      {classrooms.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} (Kapasite: {c.capacity})
                        </option>
                      ))}
                    </select>
                    {errorsSection.classroomId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errorsSection.classroomId.message}
                      </p>
                    )}
                  </div>

                  {/* Schedule JSON (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ders Programı (JSON - Opsiyonel)
                    </label>
                    <textarea
                      {...registerSection('scheduleJson')}
                      className="input-field"
                      rows="3"
                      placeholder='{"monday": ["09:00-10:30"], "wednesday": ["09:00-10:30"]}'
                    ></textarea>
                    {errorsSection.scheduleJson && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errorsSection.scheduleJson.message}
                      </p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setShowSectionModal(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary px-6 py-2"
                    >
                      İptal
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary px-6 py-2 flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editingSection ? 'Değişiklikleri Kaydet' : 'Section Oluştur'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default CourseDetail;

