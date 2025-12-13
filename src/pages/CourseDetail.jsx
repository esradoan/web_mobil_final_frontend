import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Calendar
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState({});

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
      setSections(response.data?.sections || []);
    } catch (error) {
      console.error('Course detayları yüklenemedi:', error);
      // Mock data for development
      setCourse({
        id: 1,
        code: 'CENG101',
        name: 'Introduction to Computer Engineering',
        description: 'Fundamental concepts of computer engineering including programming, data structures, and algorithms.',
        credits: 3,
        ects: 5,
        syllabusUrl: 'https://example.com/syllabus.pdf',
        department: { id: 1, name: 'Bilgisayar Mühendisliği', code: 'CENG' },
        prerequisites: [
          { id: 2, code: 'MATH101', name: 'Calculus I' },
        ],
      });
      setSections([
        {
          id: 1,
          sectionNumber: 'A',
          semester: 'Fall',
          year: 2025,
          instructor: { id: 5, firstName: 'Ahmet', lastName: 'Yılmaz' },
          capacity: 50,
          enrolledCount: 35,
          schedule: {
            monday: ['09:00-10:30'],
            wednesday: ['09:00-10:30'],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (sectionId) => {
    try {
      setEnrolling(prev => ({ ...prev, [sectionId]: true }));
      const response = await api.post('/enrollments', { sectionId });
      
      toast.success('Derse başarıyla kayıt oldunuz!');
      navigate('/my-courses');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Kayıt başarısız';
      toast.error(errorMessage);
    } finally {
      setEnrolling(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Bilgi yok';
    
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
        return `${dayName}: ${times.join(', ')}`;
      })
      .join(' | ');
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
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-2xl text-primary-600 dark:text-primary-400">
                    {course.code}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300">
                    {course.department?.name}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  {course.name}
                </h1>
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Mevcut Section'lar
          </h2>
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

                    {/* Enroll Button */}
                    <motion.button
                      onClick={() => handleEnroll(section.id)}
                      disabled={enrolling[section.id] || section.enrolledCount >= section.capacity}
                      whileHover={{ scale: section.enrolledCount < section.capacity ? 1.02 : 1 }}
                      whileTap={{ scale: section.enrolledCount < section.capacity ? 0.98 : 1 }}
                      className={`w-full btn-primary ${
                        section.enrolledCount >= section.capacity
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
                      ) : (
                        'Kayıt Ol'
                      )}
                    </motion.button>
                  </GlassCard>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;

