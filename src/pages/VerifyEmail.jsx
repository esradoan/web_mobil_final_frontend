import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/api';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import GlassCard from '../components/GlassCard';
import GradientOrb from '../components/GradientOrb';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const userId = searchParams.get('userId') || '';
  
  // Token'ı URL'den al ve decode et
  // useSearchParams bazen token'ı decode etmeyebilir, bu yüzden manuel decode yapıyoruz
  let token = searchParams.get('token') || '';
  
  // Eğer token boşsa, URL'den direkt al
  if (!token) {
    try {
      const urlParams = new URL(window.location.href).searchParams;
      token = urlParams.get('token') || '';
    } catch (e) {
      console.error('Error getting token from URL:', e);
    }
  }
  
  // Token'ı decode et (URL encoded karakterler varsa)
  // Token'da % karakteri varsa, decode etmemiz gerekiyor
  if (token && token.includes('%')) {
    try {
      // decodeURIComponent ile decode et
      token = decodeURIComponent(token);
      console.log('✅ Token decoded from URL encoding');
    } catch (e) {
      console.error('❌ Token decode failed:', e);
      // Decode başarısız olursa, token'ı olduğu gibi kullan
    }
  } else if (token) {
    console.log('ℹ️ Token does not contain % - already decoded or not encoded');
  }

  useEffect(() => {
    // Auto-verify if both userId and token are present
    if (userId && token && !success && !error) {
      handleVerify();
    }
  }, [userId, token]);

  const handleVerify = async () => {
    if (!userId || !token) {
      setSuccess(false);
      setError('Email doğrulama linki geçersiz. Lütfen email\'inizdeki linki kullanın.');
      return;
    }

    // State'leri temizle
    setError('');
    setSuccess(false);
    setLoading(true);

    // Debug: Token'ı console'a yazdır
    console.log('🔍 Verify Email Debug:');
    console.log('   UserId:', userId);
    console.log('   Token (first 50 chars):', token.substring(0, Math.min(50, token.length)) + '...');
    console.log('   Token (last 50 chars):', '...' + token.substring(Math.max(0, token.length - 50)));
    console.log('   Token length:', token.length);
    console.log('   Full URL:', window.location.href);
    console.log('   Full Token:', token); // Tam token'ı göster (güvenlik için sadece development'ta)
    
    // Token'ın tamamının gelip gelmediğini kontrol et
    if (token.length < 100) {
      console.error('⚠️ WARNING: Token çok kısa! Email client link\'i kesmiş olabilir.');
      setError('Token çok kısa görünüyor. Lütfen email\'deki link\'i direkt kopyalayıp browser\'a yapıştırın.');
      setLoading(false);
      return;
    }

    try {
      // Token'ı backend'e gönder
      // Token artık decode edilmiş halde olmalı
      console.log('📤 Sending to backend:');
      console.log('   UserId:', userId);
      console.log('   Token length:', token.length);
      console.log('   Token (first 30):', token.substring(0, 30));
      console.log('   Token (last 30):', '...' + token.substring(Math.max(0, token.length - 30)));
      console.log('   Token contains %:', token.includes('%'));
      console.log('   Token contains +:', token.includes('+'));
      console.log('   Token contains /:', token.includes('/'));
      console.log('   Token contains =:', token.includes('='));
      
      const response = await api.post('/auth/verify-email', {
        UserId: userId,
        Token: token, // Decode edilmiş token'ı gönder (backend tekrar decode etmeyecek)
      });
      
      // Başarılı - error'ı temizle ve success'i set et
      setError('');
      setSuccess(true);
      setLoading(false);
      toast.success('Email başarıyla doğrulandı!');
      
      // Backend'den güncel user bilgilerini al
      const updatedUser = response.data?.user;
      if (updatedUser) {
        console.log('✅ Email doğrulandı, güncel user bilgileri:', updatedUser);
      }
      
      // Eğer kullanıcı zaten giriş yapmışsa, profil bilgilerini yenile ve profil sayfasına yönlendir
      if (user) {
        // Kullanıcı bilgilerini zorunlu olarak yenile (email doğrulama durumunu güncellemek için)
        try {
          // Biraz bekle ki backend'deki değişiklik kaydedilsin
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchUserProfile();
          console.log('✅ Profil bilgileri yenilendi');
        } catch (profileError) {
          // Profil yenileme hatası success'i etkilemesin
          console.error('❌ Profil bilgileri yenilenirken hata:', profileError);
        }
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 2000);
      } else {
        // Giriş yapmamışsa login sayfasına yönlendir
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      // Hata - success'i false yap ve error'ı set et
      setSuccess(false);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.Message ||
                          'Email doğrulama başarısız';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      <GradientOrb className="w-96 h-96 bg-primary-400 top-0 left-0" delay={0} />
      <GradientOrb className="w-96 h-96 bg-purple-400 bottom-0 right-0" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-2xl mb-4 shadow-2xl"
            >
              <Mail className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text mb-2 text-shadow-lg">
              Email Doğrulama
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Email adresinizi doğrulayın
            </p>
          </motion.div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                  Email başarıyla doğrulandı!
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80">
                  Hesabınız aktif edildi. Giriş sayfasına yönlendiriliyorsunuz...
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                  Doğrulama başarısız
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  {error}
                </p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && !success && !error && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Email doğrulanıyor...
              </p>
            </div>
          )}

          {/* Manual Verify Button (if auto-verify didn't work) */}
          {!userId || !token ? (
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Email doğrulama linki bulunamadı. Lütfen email'inizdeki linki kullanın.
              </p>
            </div>
          ) : !success && !loading && error && (
            <motion.button
              onClick={handleVerify}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Tekrar Dene
            </motion.button>
          )}

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Giriş sayfasına dön
            </Link>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

