import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { BookOpen, Save, User, AlertCircle } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const Gradebook = () => {
  const { sectionId } = useParams();
  const [students, setStudents] = useState([]);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    fetchGradebook();
  }, [sectionId]);

  const fetchGradebook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/enrollments/students/${sectionId}`);
      setStudents(response.data || []);
      
      // Initialize grades
      const initialGrades = {};
      response.data?.forEach((student) => {
        initialGrades[student.id] = {
          midtermGrade: student.midtermGrade || '',
          finalGrade: student.finalGrade || '',
          homeworkGrade: student.homeworkGrade || '',
        };
      });
      setGrades(initialGrades);
    } catch (error) {
      console.error('Gradebook yüklenemedi:', error);
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
    if (total >= 90) return 'A';
    if (total >= 85) return 'A-';
    if (total >= 80) return 'B+';
    if (total >= 75) return 'B';
    if (total >= 70) return 'B-';
    if (total >= 65) return 'C+';
    if (total >= 60) return 'C';
    if (total >= 55) return 'C-';
    if (total >= 50) return 'D';
    return 'F';
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      const promises = students.map((student) => {
        const studentGrades = grades[student.id];
        if (!studentGrades) return Promise.resolve();
        
        return api.post('/grades', {
          enrollmentId: student.id,
          midtermGrade: parseFloat(studentGrades.midtermGrade) || 0,
          finalGrade: parseFloat(studentGrades.finalGrade) || 0,
          homeworkGrade: parseFloat(studentGrades.homeworkGrade) || 0,
        });
      });

      await Promise.all(promises);
      toast.success('Notlar başarıyla kaydedildi');
      fetchGradebook();
    } catch (error) {
      toast.error('Notlar kaydedilemedi');
    } finally {
      setSaving(false);
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
        </motion.div>

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
          <AnimatedCard delay={0.1}>
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
                    {students.map((student, index) => {
                      const studentGrades = grades[student.id] || {};
                      const midterm = parseFloat(studentGrades.midtermGrade) || 0;
                      const final = parseFloat(studentGrades.finalGrade) || 0;
                      const homework = parseFloat(studentGrades.homeworkGrade) || 0;
                      const letterGrade = calculateLetterGrade(midterm, final, homework);

                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {student.student?.firstName?.[0]}{student.student?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {student.student?.firstName} {student.student?.lastName}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {student.student?.studentNumber}
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
                              onChange={(e) => handleGradeChange(student.id, 'midtermGrade', e.target.value)}
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
                              onChange={(e) => handleGradeChange(student.id, 'finalGrade', e.target.value)}
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
                              onChange={(e) => handleGradeChange(student.id, 'homeworkGrade', e.target.value)}
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

