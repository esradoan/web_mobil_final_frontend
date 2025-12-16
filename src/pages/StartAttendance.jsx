import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Calendar, Clock, MapPin, QrCode, Users, XCircle } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const StartAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [geofenceRadius, setGeofenceRadius] = useState(15);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [fetchingSections, setFetchingSections] = useState(true);

  useEffect(() => {
    fetchMySections();
  }, []);

  const fetchMySections = async () => {
    try {
      setFetchingSections(true);
      const userId = user?.id || user?.Id;
      const response = await api.get('/sections', {
        params: {
          instructorId: userId // Faculty'nin atandığı section'ları getir
        }
      });
      const sectionsData = response.data?.data || response.data || [];
      setSections(sectionsData);
      console.log('✅ Sections loaded:', sectionsData.length);
      if (sectionsData.length === 0) {
        toast.error('Size atanmış ders bulunmuyor. Lütfen admin ile iletişime geçin.');
      }
    } catch (error) {
      console.error('❌ Sections yüklenemedi:', error);
      toast.error('Dersler yüklenemedi');
    } finally {
      setFetchingSections(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session?.id) return;

    try {
      setClosingSession(true);
      await api.put(`/attendance/sessions/${session.id}/close`);
      toast.success('Yoklama oturumu kapatıldı!');
      setSession(null);
    } catch (error) {
      console.error('❌ Close session error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Oturum kapatılamadı';
      toast.error(errorMessage);
    } finally {
      setClosingSession(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedSection) {
      toast.error('Lütfen bir section seçin');
      return;
    }

    try {
      setLoading(true);
      
      // TimeSpan formatına çevir (HH:mm -> TimeSpan)
      const parseTimeToTimeSpan = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      };

      const requestData = {
        sectionId: parseInt(selectedSection),
        date: date, // YYYY-MM-DD formatında
        startTime: parseTimeToTimeSpan(startTime),
        endTime: parseTimeToTimeSpan(endTime),
        geofenceRadius: parseFloat(geofenceRadius) || 15.0,
      };

      console.log('📤 Sending session creation request:', requestData);
      
      const response = await api.post('/attendance/sessions', requestData);

      setSession(response.data);
      toast.success('Yoklama oturumu başlatıldı!');
    } catch (error) {
      console.error('❌ Session creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Oturum başlatılamadı';
      toast.error(errorMessage);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSectionData = sections.find((s) => s.id === parseInt(selectedSection));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Yoklama Başlat
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Yeni bir yoklama oturumu oluşturun
          </p>
        </motion.div>

        {!session ? (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleStartSession(); }} className="space-y-6">
                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ders Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Section seçiniz...</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.courseName || section.course?.name || 'Ders'} - Section {section.sectionNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSectionData && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Sınıf: {selectedSectionData.classroom?.building} {selectedSectionData.classroom?.roomNumber}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      GPS: {selectedSectionData.classroom?.latitude}, {selectedSectionData.classroom?.longitude}
                    </p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Başlangıç
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Bitiş
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>

                {/* Geofence Radius */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Geofence Radius (metre)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Öğrenciler bu mesafe içinde olmalı (varsayılan: 15m)
                  </p>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || !selectedSection || fetchingSections}
                  whileHover={{ scale: (loading || !selectedSection || fetchingSections) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || !selectedSection || fetchingSections) ? 1 : 0.98 }}
                  className={`btn-primary w-full ${(loading || !selectedSection || fetchingSections) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    if (!selectedSection) {
                      e.preventDefault();
                      toast.error('Lütfen bir section seçin');
                      return;
                    }
                    if (loading || fetchingSections) {
                      e.preventDefault();
                      return;
                    }
                  }}
                >
                  {fetchingSections ? 'Yükleniyor...' : loading ? 'Başlatılıyor...' : 'Yoklama Oturumunu Başlat'}
                </motion.button>
              </form>
            </GlassCard>
          </AnimatedCard>
        ) : (
          <div className="space-y-6">
            {/* Session Active */}
            <AnimatedCard delay={0.1}>
              <GlassCard className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 mb-4">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">Yoklama Oturumu Aktif</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {selectedSectionData?.courseName || selectedSectionData?.course?.name || 'Ders'} - Section {selectedSectionData?.sectionNumber}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {date} | {startTime} - {endTime}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={session.qrCode} size={200} />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    QR Kod: <span className="font-mono font-semibold">{session.qrCode}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bu QR kodu öğrencilerle paylaşın (5 saniyede bir yenilenir)
                  </p>
                </div>

                {/* Close Session Button */}
                <motion.button
                  onClick={handleCloseSession}
                  disabled={closingSession}
                  whileHover={{ scale: closingSession ? 1 : 1.02 }}
                  whileTap={{ scale: closingSession ? 1 : 0.98 }}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  {closingSession ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Kapatılıyor...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Yoklama Oturumunu Bitir
                    </>
                  )}
                </motion.button>
              </GlassCard>
            </AnimatedCard>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StartAttendance;

