import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Wallet = () => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processingTopUp, setProcessingTopUp] = useState(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wallet/balance');
      setBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Bakiye yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page: currentPage, pageSize }
      });
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('İşlem geçmişi yüklenirken hata oluştu');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    
    if (isNaN(amount) || amount < 50) {
      toast.error('Minimum yükleme tutarı 50 ₺');
      return;
    }
    
    if (amount > 5000) {
      toast.error('Maksimum yükleme tutarı 5000 ₺');
      return;
    }

    setProcessingTopUp(true);
    try {
      // 1. Create top-up session
      const response = await api.post('/wallet/topup', { amount });
      
      if (response.data.success && response.data.paymentReference) {
        // 2. Demo için direkt ödemeyi tamamla
        const paymentRef = response.data.paymentReference;
        try {
          const completeResponse = await api.get('/wallet/topup/complete', {
            params: { ref: paymentRef }
          });
          
          if (completeResponse.status === 200) {
            toast.success(`${amount.toFixed(2)} ₺ başarıyla yüklendi!`);
            setShowTopUpModal(false);
            setTopUpAmount('');
            // Refresh balance and transactions
            await fetchBalance();
            await fetchTransactions();
          }
        } catch (completeError) {
          console.error('Error completing payment:', completeError);
          toast.error('Ödeme tamamlanırken hata oluştu');
        }
      } else {
        toast.error(response.data.message || 'Para yükleme başlatılamadı');
      }
    } catch (error) {
      console.error('Error creating top-up:', error);
      const errorMessage = error.response?.data?.message || 'Para yükleme başlatılırken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setProcessingTopUp(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTransactionIcon = (type) => {
    return type?.toLowerCase() === 'credit' ? ArrowDown : ArrowUp;
  };

  const getTransactionColor = (type) => {
    return type?.toLowerCase() === 'credit' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Tamamlandı
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Beklemede
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Başarısız
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

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
              <WalletIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Cüzdan
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bakiyenizi görüntüleyin, para yükleyin ve işlem geçmişinizi takip edin
            </p>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-2">Mevcut Bakiye</p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-2xl">Yükleniyor...</span>
                  </div>
                ) : (
                  <p className="text-5xl font-bold">
                    {balance !== null ? `${parseFloat(balance).toFixed(2)} ₺` : '0.00 ₺'}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  fetchBalance();
                  fetchTransactions();
                }}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                title="Yenile"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Top Up Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
              Para Yükle
            </button>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                İşlem Geçmişi
              </h2>
            </div>

            {loadingTransactions ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <WalletIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Henüz işlem geçmişiniz bulunmuyor
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Bakiye
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {transactions.map((transaction) => {
                        const Icon = getTransactionIcon(transaction.type);
                        const colorClass = getTransactionColor(transaction.type);
                        const isCredit = (transaction.type || transaction.Type || '').toLowerCase() === 'credit';
                        
                        return (
                          <tr key={transaction.id || transaction.Id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(transaction.createdAt || transaction.CreatedAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {transaction.description || transaction.Description || '-'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${colorClass} flex items-center gap-1`}>
                              <Icon className="w-4 h-4" />
                              {isCredit ? '+' : '-'}
                              {parseFloat(transaction.amount || transaction.Amount || 0).toFixed(2)} ₺
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {parseFloat(transaction.balanceAfter || transaction.BalanceAfter || 0).toFixed(2)} ₺
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(transaction.status || transaction.Status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Önceki
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Sayfa {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={transactions.length < pageSize}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Top Up Modal */}
          {showTopUpModal && (
            <TopUpModal
              amount={topUpAmount}
              onAmountChange={setTopUpAmount}
              onConfirm={handleTopUp}
              onClose={() => {
                setShowTopUpModal(false);
                setTopUpAmount('');
              }}
              processing={processingTopUp}
            />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

const TopUpModal = ({ amount, onAmountChange, onConfirm, onClose, processing }) => {
  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Para Yükle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tutar (₺)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="50 - 5000 ₺"
              min="50"
              max="5000"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum: 50 ₺, Maksimum: 5000 ₺
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hızlı Seçim:
            </p>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => onAmountChange(quickAmount.toString())}
                  className="px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm transition-all"
                >
                  {quickAmount} ₺
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 Demo modunda ödeme otomatik olarak tamamlanacaktır.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={processing || !amount || parseFloat(amount) < 50 || parseFloat(amount) > 5000}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                İşleniyor...
              </span>
            ) : (
              'Yükle'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Wallet;

