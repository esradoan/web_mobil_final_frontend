import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Download, BookOpen, Building, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const MySchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [semester, setSemester] = useState('fall');
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { isDark } = useTheme();

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const weekDays = [1, 2, 3, 4, 5]; // Pazartesi-Cuma

  useEffect(() => {
    fetchSchedule();
  }, [semester, year]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      console.log('📅 Fetching schedule:', { semester, year });
      const response = await api.get(`/scheduling/my-schedule?semester=${semester}&year=${year}`);
      const data = response.data?.data || [];
      console.log('✅ Schedule fetched:', data);
      console.log('✅ Schedule count:', data.length);
      setSchedules(data);
    } catch (error) {
      console.error('❌ Error fetching schedule:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        // Token refresh will be handled by API interceptor
        // If refresh fails, user will be redirected to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast.error('Ders programı yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportICal = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/scheduling/my-schedule/ical?semester=${semester}&year=${year}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `schedule_${semester}_${year}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('iCal dosyası indirildi!');
    } catch (error) {
      console.error('Error exporting iCal:', error);
      toast.error('iCal dosyası indirilirken hata oluştu');
    } finally {
      setExporting(false);
    }
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    // Handle both string (HH:MM:SS) and TimeSpan object
    let timeStr = '';
    if (typeof timeValue === 'string') {
      timeStr = timeValue;
    } else if (timeValue && typeof timeValue === 'object') {
      // TimeSpan object from backend
      const hours = Math.floor(timeValue / 36000000000) || 0;
      const minutes = Math.floor((timeValue % 36000000000) / 600000000) || 0;
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    } else {
      return '';
    }
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const getSchedulesForDay = (dayOfWeek) => {
    return schedules.filter(s => s.dayOfWeek === dayOfWeek || s.DayOfWeek === dayOfWeek);
  };

  const parseTimeToMinutes = (timeValue) => {
    if (!timeValue) return 0;
    if (typeof timeValue === 'string') {
      const parts = timeValue.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    } else if (timeValue && typeof timeValue === 'object') {
      // TimeSpan object from backend (ticks)
      const hours = Math.floor(timeValue / 36000000000) || 0;
      const minutes = Math.floor((timeValue % 36000000000) / 600000000) || 0;
      return hours * 60 + minutes;
    }
    return 0;
  };

  const getTimeSlotPosition = (startTime) => {
    // Calculate position based on time (09:00 = 0, 17:00 = 100%)
    const startMinutes = parseTimeToMinutes(startTime);
    const baseMinutes = 9 * 60; // 09:00
    const diff = startMinutes - baseMinutes;
    return (diff / 480) * 100; // 480 minutes = 8 hours (09:00-17:00)
  };

  const getTimeSlotHeight = (startTime, endTime) => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const diff = endMinutes - startMinutes;
    return (diff / 480) * 100; // percentage
  };

  const getCourseColor = (courseCode) => {
    // Generate consistent color based on course code
    const colors = [
      'bg-blue-500 dark:bg-blue-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-green-500 dark:bg-green-600',
      'bg-yellow-500 dark:bg-yellow-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-indigo-500 dark:bg-indigo-600',
      'bg-red-500 dark:bg-red-600',
      'bg-teal-500 dark:bg-teal-600',
    ];
    const index = (courseCode?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  Ders Programım
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Haftalık ders programınızı görüntüleyin ve iCal formatında dışa aktarın
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleExportICal}
                  disabled={exporting || schedules.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {exporting ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  iCal İndir
                </button>
              </div>
            </div>

            {/* Semester/Year Selector */}
            <div className="mt-6 flex gap-4 items-center">
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
            </div>
          </div>

          {/* Schedule Calendar */}
          {schedules.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Henüz ders programı oluşturulmamış
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bu dönem için kayıtlı dersleriniz bulunmuyor veya program henüz oluşturulmamış
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <p>• Ders başvurusu yapmak için "Ders Başvurusu" sayfasına gidin</p>
                <p>• Başvurularınız onaylandıktan sonra program burada görünecektir</p>
                <p>• Admin tarafından program oluşturulması gerekmektedir</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              {/* Time slots header */}
              <div className="grid grid-cols-6 gap-2 p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Saat</div>
                {weekDays.map(day => (
                  <div key={day} className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                    {dayNames[day]}
                  </div>
                ))}
              </div>

              {/* Time slots (09:00 - 17:00) */}
              <div className="relative p-4">
                {/* Time markers */}
                <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                  {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
                    <div key={hour} className="h-12 flex items-center">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="ml-24 grid grid-cols-5 gap-2 relative" style={{ minHeight: '600px' }}>
                  {weekDays.map(day => {
                    const daySchedules = getSchedulesForDay(day);
                    return (
                      <div
                        key={day}
                        className="relative border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                      >
                        {daySchedules.map((schedule, index) => {
                          const courseCode = schedule.courseCode || schedule.CourseCode || '';
                          const courseName = schedule.courseName || schedule.CourseName || '';
                          const instructorName = schedule.instructorName || schedule.InstructorName || '';
                          const classroomName = schedule.classroomName || schedule.ClassroomName || '';
                          const building = schedule.building || schedule.Building || '';
                          const startTime = schedule.startTime || schedule.StartTime || '';
                          const endTime = schedule.endTime || schedule.EndTime || '';
                          
                          const top = getTimeSlotPosition(startTime);
                          const height = getTimeSlotHeight(startTime, endTime);
                          const color = getCourseColor(courseCode);

                          return (
                            <motion.div
                              key={schedule.id || schedule.Id || index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`absolute left-0 right-0 ${color} text-white rounded-lg p-2 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105`}
                              style={{
                                top: `${top}%`,
                                height: `${Math.max(height, 8)}%`,
                                minHeight: '60px',
                                zIndex: 10
                              }}
                              onClick={() => handleScheduleClick(schedule)}
                              title={`Tıklayarak detayları görüntüle`}
                            >
                              <div className="text-xs font-bold mb-1 truncate">
                                {courseCode}
                              </div>
                              <div className="text-xs truncate mb-1">
                                {courseName}
                              </div>
                              <div className="text-xs opacity-90 truncate flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {instructorName.split(' ')[0]}
                              </div>
                              <div className="text-xs opacity-90 truncate flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {building} {classroomName}
                              </div>
                              <div className="text-xs opacity-75 mt-1">
                                {formatTime(startTime)} - {formatTime(endTime)}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Schedule List View (Mobile/Alternative) */}
          {schedules.length > 0 && (
            <div className="mt-8 md:hidden">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ders Listesi</h2>
              <div className="space-y-4">
                {schedules.map((schedule) => {
                  const courseCode = schedule.courseCode || schedule.CourseCode || '';
                  const courseName = schedule.courseName || schedule.CourseName || '';
                  const instructorName = schedule.instructorName || schedule.InstructorName || '';
                  const classroomName = schedule.classroomName || schedule.ClassroomName || '';
                  const building = schedule.building || schedule.Building || '';
                  const dayName = schedule.dayName || schedule.DayName || dayNames[schedule.dayOfWeek || schedule.DayOfWeek || 0];
                  const startTime = schedule.startTime || schedule.StartTime || '';
                  const endTime = schedule.endTime || schedule.EndTime || '';
                  const color = getCourseColor(courseCode);

                  return (
                    <motion.div
                      key={schedule.id || schedule.Id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${color} text-white rounded-xl p-4 shadow-lg cursor-pointer hover:scale-105 transition-transform`}
                      onClick={() => handleScheduleClick(schedule)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{courseCode}</h3>
                          <p className="text-sm opacity-90">{courseName}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm opacity-90">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{dayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{building} {classroomName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{instructorName}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Course Detail Modal */}
          <AnimatePresence>
            {showDetailModal && selectedSchedule && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      Ders Detayları
                    </h3>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {selectedSchedule.courseCode || selectedSchedule.CourseCode}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedSchedule.courseName || selectedSchedule.CourseName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Gün</p>
                          <p className="font-semibold">{selectedSchedule.dayName || selectedSchedule.DayName || dayNames[selectedSchedule.dayOfWeek || selectedSchedule.DayOfWeek || 0]}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Saat</p>
                          <p className="font-semibold">
                            {formatTime(selectedSchedule.startTime || selectedSchedule.StartTime)} - {formatTime(selectedSchedule.endTime || selectedSchedule.EndTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sınıf</p>
                          <p className="font-semibold">
                            {selectedSchedule.building || selectedSchedule.Building} {selectedSchedule.classroomName || selectedSchedule.ClassroomName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Öğretim Üyesi</p>
                          <p className="font-semibold">{selectedSchedule.instructorName || selectedSchedule.InstructorName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Kapat
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
};

export default MySchedule;

