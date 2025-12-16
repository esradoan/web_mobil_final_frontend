import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const MySections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySections();
  }, []);

  const fetchMySections = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.Id;
      const response = await api.get('/sections', {
        params: {
          instructorId: userId
        }
      });
      const sectionsData = response.data?.data || response.data || [];
      setSections(sectionsData);
      console.log('✅ Faculty sections loaded:', sectionsData.length);
    } catch (error) {
      console.error('❌ Sections yüklenemedi:', error);
      toast.error('Dersler yüklenemedi');
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
            Verdiğim Dersler
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Size atanan ders section'ları ve öğrenci bilgileri
          </p>
        </motion.div>

        {/* Sections List */}
        {sections.length === 0 ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                Size atanmış ders bulunmuyor
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Admin tarafından size ders atanması gerekiyor.
              </p>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, index) => (
              <AnimatedCard key={section.id} delay={index * 0.1}>
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400 text-lg">
                          {section.courseCode || section.course?.code}
                        </span>
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-semibold">
                          Section {section.sectionNumber}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {section.courseName || section.course?.name}
                      </h3>
                      {section.classroom && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          📍 {section.classroom.building} {section.classroom.roomNumber}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        📅 {section.semester} {section.year}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">Öğrenci</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {section.enrolledCount || 0} / {section.capacity || 50}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        kapasite
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">Ders</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {section.courseCode || section.course?.code}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => navigate(`/gradebook/${section.id}`)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Not Girişi
                    </motion.button>
                    <motion.button
                      onClick={() => navigate(`/attendance/report/${section.id}`)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Rapor
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

export default MySections;

