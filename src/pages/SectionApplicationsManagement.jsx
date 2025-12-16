import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Mail
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const SectionApplicationsManagement = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchApplications();
  }, [page, filterStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        status: filterStatus || undefined
      };
      
      const response = await api.get('/section-applications', { params });
      const data = response.data?.data || [];
      setApplications(data);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('❌ Applications fetch failed:', error);
      toast.error('Başvurular yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      setProcessingId(applicationId);
      await api.put(`/section-applications/${applicationId}/approve`);
      toast.success('Başvuru onaylandı!');
      await fetchApplications();
    } catch (error) {
      console.error('❌ Approve failed:', error);
      const errorMessage = error.response?.data?.message || 'Onaylama sırasında hata oluştu';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId, reason) => {
    try {
      setProcessingId(applicationId);
      await api.put(`/section-applications/${applicationId}/reject`, {
        reason: reason || 'Başvuru reddedildi.'
      });
      toast.success('Başvuru reddedildi!');
      await fetchApplications();
    } catch (error) {
      console.error('❌ Reject failed:', error);
      const errorMessage = error.response?.data?.message || 'Reddetme sırasında hata oluştu';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
      case 0:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Beklemede
          </span>
        );
      case 'Approved':
      case 1:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Onaylandı
          </span>
        );
      case 'Rejected':
      case 2:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Reddedildi
          </span>
        );
      default:
        return null;
    }
  };

  // Filtreleme
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.section?.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.section?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.instructorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // İstatistikler
  const pendingCount = applications.filter(app => app.status === 'Pending' || app.status === 0).length;
  const approvedCount = applications.filter(app => app.status === 'Approved' || app.status === 1).length;
  const rejectedCount = applications.filter(app => app.status === 'Rejected' || app.status === 2).length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Başvuru Yönetimi</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Öğretmenlerin şubelere yaptığı başvuruları yönetin
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bekleyen Başvurular</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Onaylanan Başvurular</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Reddedilen Başvurular</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </AnimatedCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ders, öğretmen veya email ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              <option value="Pending">Beklemede</option>
              <option value="Approved">Onaylandı</option>
              <option value="Rejected">Reddedildi</option>
            </select>
          </div>
        </GlassCard>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Başvurular yükleniyor...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Başvuru bulunamadı.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app, index) => (
              <AnimatedCard
                key={app.id}
                className="p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {app.section?.courseCode || app.section?.course?.code || 'N/A'}
                      </h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {app.section?.courseName || app.section?.course?.name || 'Ders Adı'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Şube: {app.section?.sectionNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{app.section?.semester} {app.section?.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{app.instructorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{app.instructorEmail}</span>
                      </div>
                    </div>
                    {app.rejectionReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        Red Nedeni: {app.rejectionReason}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Başvuru Tarihi: {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                      {app.processedAt && ` | İşlem Tarihi: ${new Date(app.processedAt).toLocaleDateString('tr-TR')}`}
                    </p>
                  </div>
                  
                  {(app.status === 'Pending' || app.status === 0) && (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleApprove(app.id)}
                        disabled={processingId === app.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {processingId === app.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Onayla
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          const reason = prompt('Red nedeni (opsiyonel):');
                          if (reason !== null) {
                            handleReject(app.id, reason);
                          }
                        }}
                        disabled={processingId === app.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reddet
                      </motion.button>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
              Sayfa {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SectionApplicationsManagement;

