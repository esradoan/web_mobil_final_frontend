import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { BookOpen, Download, TrendingUp, Award } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState(0);
  const [cgpa, setCgpa] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grades/my-grades');
      setGrades(response.data?.data || []);
      setGpa(response.data?.gpa || 0);
      setCgpa(response.data?.cgpa || 0);
    } catch (error) {
      console.error('Notlar yüklenemedi:', error);
      // Mock data
      setGrades([
        {
          course: { code: 'CENG101', name: 'Introduction to Computer Engineering' },
          midtermGrade: 75.5,
          finalGrade: 82.0,
          letterGrade: 'B+',
          gradePoint: 3.3,
        },
      ]);
      setGpa(3.45);
      setCgpa(3.52);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTranscript = async () => {
    try {
      const response = await api.get('/grades/transcript/pdf', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transcript.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Transkript indirildi');
    } catch (error) {
      toast.error('Transkript indirilemedi');
    }
  };

  const getGradeColor = (letterGrade) => {
    if (['A', 'A+'].includes(letterGrade)) return 'text-green-600 dark:text-green-400';
    if (['B+', 'B'].includes(letterGrade)) return 'text-blue-600 dark:text-blue-400';
    if (['C+', 'C'].includes(letterGrade)) return 'text-yellow-600 dark:text-yellow-400';
    if (['D'].includes(letterGrade)) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
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
              Notlarım
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Ders notlarınız ve akademik performansınız
            </p>
          </div>
          <motion.button
            onClick={handleDownloadTranscript}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Transkript İndir
          </motion.button>
        </motion.div>

        {/* GPA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">Dönem Not Ortalaması</h3>
              <h2 className="text-4xl font-bold gradient-text">{gpa.toFixed(2)}</h2>
            </GlassCard>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">Genel Not Ortalaması</h3>
              <h2 className="text-4xl font-bold gradient-text">{cgpa.toFixed(2)}</h2>
            </GlassCard>
          </AnimatedCard>
        </div>

        {/* Grades List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : grades.length === 0 ? (
          <AnimatedCard delay={0.3}>
            <GlassCard className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Henüz not bulunmuyor
              </p>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <AnimatedCard delay={0.3}>
            <GlassCard className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ders</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Vize</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Final</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Harf Notu</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Not Ortalaması</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                              {grade.course?.code}
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {grade.course?.name}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                          {grade.midtermGrade?.toFixed(1) || '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                          {grade.finalGrade?.toFixed(1) || '-'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-bold text-lg ${getGradeColor(grade.letterGrade)}`}>
                            {grade.letterGrade || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {grade.gradePoint?.toFixed(2) || '-'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </AnimatedCard>
        )}
      </div>
    </Layout>
  );
};

export default Grades;

