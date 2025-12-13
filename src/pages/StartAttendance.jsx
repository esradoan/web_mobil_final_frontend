import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Calendar, Clock, MapPin, QrCode, Users } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/api';
import toast from 'react-hot-toast';

const StartAttendance = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [geofenceRadius, setGeofenceRadius] = useState(15);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingSections, setFetchingSections] = useState(true);

  useEffect(() => {
    fetchMySections();
  }, []);

  const fetchMySections = async () => {
    try {
      setFetchingSections(true);
      // Mock data - backend'de /sections/my-sections endpoint'i olacak
      setSections([
        {
          id: 1,
          course: { code: 'CENG101', name: 'Introduction to Computer Engineering' },
          sectionNumber: 'A',
          classroom: { building: 'Engineering', roomNumber: 'A101', latitude: 41.0082, longitude: 28.9784 },
        },
      ]);
    } catch (error) {
      console.error('Sections yüklenemedi:', error);
    } finally {
      setFetchingSections(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedSection) {
      toast.error('Lütfen bir section seçin');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/attendance/sessions', {
        sectionId: parseInt(selectedSection),
        date,
        startTime,
        endTime,
        geofenceRadius: parseFloat(geofenceRadius),
      });

      setSession(response.data);
      toast.success('Yoklama oturumu başlatıldı!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Oturum başlatılamadı');
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
                        {section.course?.code} - Section {section.sectionNumber}
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
                  disabled={loading || !selectedSection}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-primary w-full"
                >
                  {loading ? 'Başlatılıyor...' : 'Yoklama Oturumunu Başlat'}
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
                    {selectedSectionData?.course?.code} - Section {selectedSectionData?.sectionNumber}
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

                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    QR Kod: <span className="font-mono font-semibold">{session.qrCode}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bu QR kodu öğrencilerle paylaşın (5 saniyede bir yenilenir)
                  </p>
                </div>
              </GlassCard>
            </AnimatedCard>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StartAttendance;

