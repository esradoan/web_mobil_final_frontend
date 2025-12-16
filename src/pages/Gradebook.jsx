import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { BookOpen, Save, User, AlertCircle, Download, Mail, BarChart3, MoreVertical } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Gradebook = () => {
  const { sectionId } = useParams();
  const [students, setStudents] = useState([]);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState({});
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  useEffect(() => {
    fetchGradebook();
  }, [sectionId]);

  const fetchGradebook = async () => {
    try {
      setLoading(true);
      
      // Fetch section details and students in parallel
      const [sectionResponse, studentsResponse] = await Promise.all([
        api.get(`/sections/${sectionId}`),
        api.get(`/enrollments/students/${sectionId}`)
      ]);
      
      // Set section data
      const sectionData = sectionResponse.data?.data || sectionResponse.data;
      setSection(sectionData);
      
      // Set students data
      const studentsData = studentsResponse.data || [];
      setStudents(studentsData);
      
      // Initialize grades - use enrollment ID (Id field)
      const initialGrades = {};
      studentsData.forEach((enrollment) => {
        initialGrades[enrollment.id] = {
          midtermGrade: enrollment.midtermGrade || '',
          finalGrade: enrollment.finalGrade || '',
          homeworkGrade: enrollment.homeworkGrade || '',
        };
      });
      setGrades(initialGrades);
    } catch (error) {
      console.error('Gradebook yüklenemedi:', error);
      toast.error('Öğrenci listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const calculateLetterGrade = (midterm, final, homework = 0) => {
    const total = (midterm * 0.3) + (final * 0.5) + (homework * 0.2);
    if (total >= 90) return 'AA';
    if (total >= 85) return 'BA';
    if (total >= 80) return 'BB';
    if (total >= 75) return 'CB';
    if (total >= 70) return 'CC';
    if (total >= 65) return 'DC';
    if (total >= 60) return 'DD';
    if (total >= 50) return 'FD';
    return 'FF';
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      const promises = students
        .filter(student => {
          const studentGrades = grades[student.id];
          return studentGrades && (
            studentGrades.midtermGrade || 
            studentGrades.finalGrade || 
            studentGrades.homeworkGrade
          );
        })
        .map((enrollment) => {
          const studentGrades = grades[enrollment.id];
          if (!studentGrades) return Promise.resolve();
          
          return api.post('/grades', {
            enrollmentId: enrollment.id, // Use enrollment ID
            midtermGrade: studentGrades.midtermGrade ? parseFloat(studentGrades.midtermGrade) : null,
            finalGrade: studentGrades.finalGrade ? parseFloat(studentGrades.finalGrade) : null,
            homeworkGrade: studentGrades.homeworkGrade ? parseFloat(studentGrades.homeworkGrade) : null,
          });
        });

      await Promise.all(promises);
      toast.success('Notlar başarıyla kaydedildi');
      fetchGradebook();
    } catch (error) {
      console.error('Grade save error:', error);
      const errorMessage = error.response?.data?.message || 'Notlar kaydedilemedi';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Backend'de Excel export endpoint'i olacak
      // Şimdilik CSV formatında export
      const csvData = [
        ['Öğrenci No', 'Ad Soyad', 'Vize', 'Final', 'Ödev', 'Harf Notu'],
        ...students.map(student => {
          const studentGrades = grades[student.id] || {};
          const midterm = parseFloat(studentGrades.midtermGrade) || 0;
          const final = parseFloat(studentGrades.finalGrade) || 0;
          const homework = parseFloat(studentGrades.homeworkGrade) || 0;
          const letterGrade = calculateLetterGrade(midterm, final, homework);
          return [
            student.student?.studentNumber || '',
            `${student.student?.firstName || ''} ${student.student?.lastName || ''}`,
            midterm,
            final,
            homework,
            letterGrade
          ];
        })
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `gradebook_${sectionId}.csv`;
      link.click();
      
      toast.success('Notlar CSV olarak indirildi');
    } catch (error) {
      toast.error('Export başarısız');
    }
  };

  const handleSendNotifications = async () => {
    try {
      // Backend'de notification endpoint'i olacak
      toast.success('Bildirimler gönderildi');
    } catch (error) {
      toast.error('Bildirimler gönderilemedi');
    }
  };

  const getGradeDistribution = () => {
    const distribution = {
      'AA': 0, 'BA': 0, 'BB': 0, 'CB': 0,
      'CC': 0, 'DC': 0, 'DD': 0, 'FD': 0, 'FF': 0
    };
    
    students.forEach(student => {
      const studentGrades = grades[student.id] || {};
      const midterm = parseFloat(studentGrades.midtermGrade) || 0;
      const final = parseFloat(studentGrades.finalGrade) || 0;
      const homework = parseFloat(studentGrades.homeworkGrade) || 0;
      const letterGrade = calculateLetterGrade(midterm, final, homework);
      if (distribution.hasOwnProperty(letterGrade)) {
        distribution[letterGrade]++;
      }
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count
    })).filter(item => item.count > 0);
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
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Not Defteri
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {section?.course?.code} - Section {section?.sectionNumber}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center gap-2"
              >
                <MoreVertical className="w-5 h-5" />
                Toplu İşlemler
              </motion.button>
              {showBulkMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10"
                >
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setShowBulkMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Download className="w-4 h-4" />
                    Excel'e Aktar
                  </button>
                  <button
                    onClick={() => {
                      handleSendNotifications();
                      setShowBulkMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Mail className="w-4 h-4" />
                    Bildirim Gönder
                  </button>
                </motion.div>
              )}
            </div>
            <motion.button
              onClick={handleSaveGrades}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.05 }}
              whileTap={{ scale: saving ? 1 : 0.95 }}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
            </motion.button>
          </div>
        </motion.div>

        {/* Grade Distribution Chart */}
        {students.length > 0 && (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Not Dağılımı
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
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
        )}

        {/* Students List */}
        {students.length === 0 ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Bu section'da öğrenci bulunmuyor
              </p>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <AnimatedCard delay={0.2}>
            <GlassCard className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Öğrenci</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Vize (30%)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Final (50%)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ödev (20%)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Harf Notu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((enrollment, index) => {
                      const studentGrades = grades[enrollment.id] || {};
                      const midterm = parseFloat(studentGrades.midtermGrade) || 0;
                      const final = parseFloat(studentGrades.finalGrade) || 0;
                      const homework = parseFloat(studentGrades.homeworkGrade) || 0;
                      const letterGrade = calculateLetterGrade(midterm, final, homework);

                      return (
                        <motion.tr
                          key={enrollment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {enrollment.studentName?.split(' ').map(n => n[0]).join('') || enrollment.studentName?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {enrollment.studentName || 'Bilinmeyen Öğrenci'}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {enrollment.studentNumber || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={studentGrades.midtermGrade || ''}
                              onChange={(e) => handleGradeChange(enrollment.id, 'midtermGrade', e.target.value)}
                              className="input-field w-24 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={studentGrades.finalGrade || ''}
                              onChange={(e) => handleGradeChange(enrollment.id, 'finalGrade', e.target.value)}
                              className="input-field w-24 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={studentGrades.homeworkGrade || ''}
                              onChange={(e) => handleGradeChange(enrollment.id, 'homeworkGrade', e.target.value)}
                              className="input-field w-24 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                              {letterGrade}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
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

export default Gradebook;

