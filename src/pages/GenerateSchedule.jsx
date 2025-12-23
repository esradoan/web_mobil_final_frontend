import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, User, BookOpen, Building, 
  Loader, CheckCircle, XCircle, AlertCircle, Play, Save, Eye
} from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GenerateSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [semester, setSemester] = useState('fall');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin' || user?.role === 0;

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Bu sayfaya erişim için Admin yetkisi gereklidir');
      navigate('/dashboard');
      return;
    }
    fetchSections();
  }, [semester, year, isAdmin, navigate]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/courses/sections?semester=${semester}&year=${year}`);
      const data = response.data?.data || [];
      setSections(data);
      setSelectedSections([]);
      setGeneratedSchedule(null);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Dersler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSection = (sectionId) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleGenerate = async () => {
    if (selectedSections.length === 0) {
      toast.error('Lütfen en az bir ders seçin');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/scheduling/generate', {
        semester,
        year,
        sectionIds: selectedSections
      });

      if (response.data.success) {
        setGeneratedSchedule(response.data);
        toast.success(`Program oluşturuldu! ${response.data.scheduledCount} ders planlandı.`);
      } else {
        toast.error(response.data.message || 'Program oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      const errorMessage = error.response?.data?.message || 'Program oluşturulurken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedSchedule) return;

    // Schedule is already saved in database when generated
    toast.success('Program kaydedildi!');
    navigate('/schedule');
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    if (typeof timeValue === 'string') {
      const parts = timeValue.split(':');
      return `${parts[0]}:${parts[1]}`;
    } else if (timeValue && typeof timeValue === 'object') {
      const hours = Math.floor(timeValue / 36000000000) || 0;
      const minutes = Math.floor((timeValue % 36000000000) / 600000000) || 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '';
  };

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Ders Programı Oluştur
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Otomatik ders programı oluşturun ve yayınlayın
            </p>
          </div>

          {/* Semester/Year Selector */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dönem:</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="fall">Güz</option>
                  <option value="spring">Bahar</option>
                  <option value="summer">Yaz</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yıl:</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white w-24"
                  min="2020"
                  max="2030"
                />
              </div>
              <button
                onClick={fetchSections}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
              >
                Yenile
              </button>
            </div>
          </div>

          {/* Sections Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dersler ({selectedSections.length} seçildi)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSections(sections.map(s => s.id || s.Id))}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition-colors dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={() => setSelectedSections([])}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                >
                  Temizle
                </button>
              </div>
            </div>

            {sections.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Bu dönem için ders bulunmuyor
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {sections.map((section) => {
                  const sectionId = section.id || section.Id;
                  const courseCode = section.courseCode || section.CourseCode || '';
                  const courseName = section.courseName || section.CourseName || '';
                  const instructorName = section.instructorName || section.InstructorName || '';
                  const sectionNumber = section.sectionNumber || section.SectionNumber || '';
                  const capacity = section.capacity || section.Capacity || 0;
                  const enrolledCount = section.enrolledCount || section.EnrolledCount || 0;
                  const isSelected = selectedSections.includes(sectionId);

                  return (
                    <motion.div
                      key={sectionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleToggleSection(sectionId)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {courseCode} - {sectionNumber}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {courseName}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{instructorName}</span>
                        </div>
                        <div>
                          <span>{enrolledCount}/{capacity} öğrenci</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <button
              onClick={handleGenerate}
              disabled={generating || selectedSections.length === 0}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Program Oluşturuluyor...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Program Oluştur
                </>
              )}
            </button>
          </div>

          {/* Generated Schedule Results */}
          {generatedSchedule && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Oluşturulan Program
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {generatedSchedule.scheduledCount} ders planlandı
                    </span>
                    {generatedSchedule.failedCount > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        {generatedSchedule.failedCount} ders planlanamadı
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition-colors dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Gizle' : 'Önizle'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    <Save className="w-4 h-4" />
                    Kaydet ve Yayınla
                  </button>
                </div>
              </div>

              {generatedSchedule.conflicts && generatedSchedule.conflicts.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Çakışmalar
                    </h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                    {generatedSchedule.conflicts.map((conflict, index) => (
                      <li key={index}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              {showPreview && generatedSchedule.schedules && generatedSchedule.schedules.length > 0 && (
                <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                  {generatedSchedule.schedules.map((schedule) => {
                    const courseCode = schedule.courseCode || schedule.CourseCode || '';
                    const courseName = schedule.courseName || schedule.CourseName || '';
                    const instructorName = schedule.instructorName || schedule.InstructorName || '';
                    const dayName = schedule.dayName || schedule.DayName || dayNames[schedule.dayOfWeek || schedule.DayOfWeek || 0];
                    const classroomName = schedule.classroomName || schedule.ClassroomName || '';
                    const building = schedule.building || schedule.Building || '';
                    const startTime = schedule.startTime || schedule.StartTime || '';
                    const endTime = schedule.endTime || schedule.EndTime || '';

                    return (
                      <div
                        key={schedule.id || schedule.Id}
                        className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                              {courseCode} - {courseName}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{dayName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span>{building} {classroomName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{instructorName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default GenerateSchedule;

