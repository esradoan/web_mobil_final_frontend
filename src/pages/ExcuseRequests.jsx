import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FileText, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';
import toast from 'react-hot-toast';

const ExcuseRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/excuse-requests');
      const requestsData = response.data?.data || response.data || [];
      setRequests(requestsData);
    } catch (error) {
      console.error('Mazeret talepleri yüklenemedi:', error);
      toast.error('Mazeret talepleri yüklenemedi');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, notes = '') => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: true }));
      await api.put(`/attendance/excuse-requests/${requestId}/approve`, { notes });
      toast.success('Mazeret onaylandı');
      fetchRequests();
    } catch (error) {
      console.error('Approve error:', error);
      const errorMessage = error.response?.data?.message || 'Mazeret onaylanamadı';
      toast.error(errorMessage);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId, notes = '') => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: true }));
      await api.put(`/attendance/excuse-requests/${requestId}/reject`, { notes });
      toast.success('Mazeret reddedildi');
      fetchRequests();
    } catch (error) {
      console.error('Reject error:', error);
      const errorMessage = error.response?.data?.message || 'Mazeret reddedilemedi';
      toast.error(errorMessage);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Mazeret Talepleri
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bekleyen ve işlenmiş mazeret talepleri
          </p>
        </motion.div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Bekleyen Talepler ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <AnimatedCard key={request.id} delay={index * 0.1}>
                  <GlassCard className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {request.student?.firstName} {request.student?.lastName}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Ders: {request.session?.section?.course?.code} - {new Date(request.session?.date).toLocaleDateString('tr-TR')}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 mb-2">
                          {request.reason}
                        </p>
                        {request.documentUrl && (
                          <a
                            href={request.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            Belgeyi Görüntüle
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing[request.id]}
                        whileHover={{ scale: processing[request.id] ? 1 : 1.02 }}
                        whileTap={{ scale: processing[request.id] ? 1 : 0.98 }}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Onayla
                      </motion.button>
                      <motion.button
                        onClick={() => handleReject(request.id)}
                        disabled={processing[request.id]}
                        whileHover={{ scale: processing[request.id] ? 1 : 1.02 }}
                        whileTap={{ scale: processing[request.id] ? 1 : 0.98 }}
                        className="flex-1 btn-danger flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reddet
                      </motion.button>
                    </div>
                  </GlassCard>
                </AnimatedCard>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              İşlenmiş Talepler
            </h2>
            <div className="space-y-4">
              {processedRequests.map((request, index) => (
                <AnimatedCard key={request.id} delay={index * 0.1}>
                  <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {request.student?.firstName} {request.student?.lastName}
                          </span>
                          {request.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Onaylandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                              <XCircle className="w-3 h-3" />
                              Reddedildi
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.reason}
                        </p>
                        {request.notes && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Not: {request.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </AnimatedCard>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-12 text-center">
              <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Henüz mazeret talebi bulunmuyor
              </p>
            </GlassCard>
          </AnimatedCard>
        )}
      </div>
    </Layout>
  );
};

export default ExcuseRequests;

