import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { BookOpen, Download, TrendingUp, Award, BarChart3, LineChart } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts';

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
      const gradesData = response.data?.data || response.data || [];
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setGpa(response.data?.gpa || response.data?.Gpa || 0);
      setCgpa(response.data?.cgpa || response.data?.Cgpa || 0);
    } catch (error) {
      console.error('Notlar yüklenemedi:', error);
      toast.error('Notlar yüklenemedi');
      setGrades([]);
      setGpa(0);
      setCgpa(0);
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
    if (['AA'].includes(letterGrade)) return 'text-green-600 dark:text-green-400';
    if (['BA', 'BB'].includes(letterGrade)) return 'text-blue-600 dark:text-blue-400';
    if (['CB', 'CC'].includes(letterGrade)) return 'text-yellow-600 dark:text-yellow-400';
    if (['DC', 'DD'].includes(letterGrade)) return 'text-orange-600 dark:text-orange-400';
    if (['FD'].includes(letterGrade)) return 'text-red-500 dark:text-red-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Grade Distribution Data
  const getGradeDistribution = () => {
    const distribution = {
      'AA': 0, 'BA': 0, 'BB': 0, 'CB': 0,
      'CC': 0, 'DC': 0, 'DD': 0, 'FD': 0, 'FF': 0
    };
    
    grades.forEach(grade => {
      if (grade.letterGrade && distribution.hasOwnProperty(grade.letterGrade)) {
        distribution[grade.letterGrade]++;
      }
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count
    })).filter(item => item.count > 0);
  };

  // GPA Trend Data (mock - backend'den gelecek)
  const getGpaTrend = () => {
    // Backend'den semester bazlı GPA verisi gelirse kullanılacak
    // Şimdilik mock data
    return [
      { semester: 'Fall 2023', gpa: 3.2, cgpa: 3.2 },
      { semester: 'Spring 2024', gpa: 3.4, cgpa: 3.3 },
      { semester: 'Fall 2024', gpa: 3.5, cgpa: 3.4 },
      { semester: 'Spring 2025', gpa: gpa, cgpa: cgpa },
    ];
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

        {/* Charts */}
        {!loading && grades.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Chart */}
            <AnimatedCard delay={0.3}>
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Not Dağılımı
                  </h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getGradeDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.3} />
                    <XAxis 
                      dataKey="grade" 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </AnimatedCard>

            {/* GPA Trend Chart */}
            <AnimatedCard delay={0.4}>
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LineChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    GPA Trendi
                  </h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={getGpaTrend()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.3} />
                    <XAxis 
                      dataKey="semester" 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      domain={[0, 4]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="gpa" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      name="Dönem GPA"
                      dot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cgpa" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Genel GPA"
                      dot={{ r: 5 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </GlassCard>
            </AnimatedCard>
          </div>
        )}

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
          <AnimatedCard delay={0.5}>
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
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                              {grade.courseCode || '-'}
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {grade.courseName || '-'}
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

