import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { User, Mail, Save, Upload, Camera, Sparkles, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import AnimatedCard from '../components/AnimatedCard';
import { getUserProfilePicture } from '../utils/imageUtils';
import { useSearchParams } from 'react-router-dom';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phoneNumber: z.string().optional(),
});

const Profile = () => {
  const { user, fetchUserProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const fileInputRef = useRef(null);

  // Debug: User objesini console'a yazdır
  console.log('Current user object:', user);
  console.log('Email verified status:', {
    isEmailVerified: user?.isEmailVerified,
    IsEmailVerified: user?.IsEmailVerified,
    emailConfirmed: user?.emailConfirmed,
    all: user
  });

  // Profil sayfası her yüklendiğinde kullanıcı bilgilerini yenile (email doğrulama durumunu güncellemek için)
  useEffect(() => {
    // Sayfa yüklendiğinde kullanıcı bilgilerini yenile
    const refreshProfile = async () => {
      if (user) {
        console.log('🔄 Profil sayfası yüklendi, kullanıcı bilgileri yenileniyor...');
        await fetchUserProfile();
        console.log('✅ Kullanıcı bilgileri yenilendi');
      }
    };
    refreshProfile();
  }, []); // Sadece component mount olduğunda çalışır

  // Email doğrulandıktan sonra profil sayfasına dönüldüğünde kullanıcı bilgilerini yenile
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      fetchUserProfile();
      // URL'den verified parametresini temizle
      window.history.replaceState({}, '', '/profile');
    }
  }, [searchParams, fetchUserProfile]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put('/users/me', data);
      await fetchUserProfile();
      toast.success('Profil başarıyla güncellendi!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!user?.email) {
      toast.error('Email adresi bulunamadı');
      return;
    }

    setSendingVerification(true);
    try {
      await api.post('/auth/resend-verification-email', { email: user.email });
      toast.success('Doğrulama emaili gönderildi! Email kutunuzu kontrol edin.');
    } catch (error) {
      if (error.response?.data?.message?.includes('already verified')) {
        toast.error('Email adresiniz zaten doğrulanmış');
        await fetchUserProfile(); // Refresh user data
      } else {
        toast.error(error.response?.data?.message || 'Email gönderilemedi');
      }
    } finally {
      setSendingVerification(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('Dosya seçilmedi');
      return;
    }

    console.log('Seçilen dosya:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      e.target.value = ''; // Reset input
      return;
    }

    // Max 5MB kontrolü
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Profil resmi yükleniyor...');
      const uploadResponse = await api.post('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', uploadResponse.data);

      // Kullanıcı profilini yeniden yükle
      await fetchUserProfile();
      
      toast.success('Profil resmi başarıyla yüklendi!');
      e.target.value = ''; // Reset input for next upload
    } catch (error) {
      console.error('Profil resmi yükleme hatası:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.Message || 'Profil resmi yüklenemedi');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-8 h-8 text-primary-600" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-1">
              Profil Ayarları
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Profil bilgilerinizi güncelleyin
            </p>
          </div>
        </motion.div>

        {/* Profile Picture Section */}
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {(() => {
                // Utility fonksiyonu ile profil resmi URL'ini al
                const profilePictureUrl = getUserProfilePicture(user);
                console.log('Profile Picture URL:', profilePictureUrl);
                
                return (
                  <motion.div
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl relative overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => {
                      console.log('Avatar üzerine tıklandı');
                      if (!uploading) {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                    
                    {/* Default Avatar (Initials) */}
                    <span className="relative z-10">
                      {user?.firstName?.[0] || user?.FirstName?.[0]}
                      {user?.lastName?.[0] || user?.LastName?.[0]}
                    </span>
                    
                    {/* Profile Picture Overlay */}
                    {profilePictureUrl && (
                      <img
                        src={profilePictureUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover absolute inset-0 z-20"
                        onError={(e) => {
                          console.error('❌ Resim yükleme hatası (404):', profilePictureUrl);
                          console.error('Backend /uploads klasörünü static olarak serve etmiyor!');
                          console.error('Çözüm: Backend Program.cs dosyasına app.UseStaticFiles() ekleyin');
                          e.target.style.display = 'none';
                          toast.error('Profil resmi yüklenemedi. Backend static file serving ayarlarını kontrol edin.');
                        }}
                        onLoad={() => {
                          console.log('✅ Resim başarıyla yüklendi:', profilePictureUrl);
                        }}
                      />
                    )}
                    
                    {/* Camera Icon Overlay */}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                );
              })()}
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
              <div className="text-center">
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      Profil resmi yükleniyor...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Profil resmini değiştirmek için avatara tıklayın
                  </p>
                )}
              </div>
          </div>
          </GlassCard>
        </AnimatedCard>

        {/* Email Verification Alert */}
        {user && !(user.isEmailVerified || user.IsEmailVerified || user.emailConfirmed) && (
          <AnimatedCard delay={0.15}>
            <GlassCard className="p-6 border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    Email Adresinizi Doğrulayın
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    Email adresiniz henüz doğrulanmamış. Lütfen email kutunuzu kontrol edin ve doğrulama linkine tıklayın.
                  </p>
                  <motion.button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={sendingVerification}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingVerification ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Doğrulama Emaili Gönder
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </AnimatedCard>
        )}

        {/* Email Verified Success */}
        {user && (user.isEmailVerified || user.IsEmailVerified || user.emailConfirmed) && (
          <AnimatedCard delay={0.15}>
            <GlassCard className="p-4 border-2 border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  ✓ Email adresiniz doğrulanmış
                </p>
              </div>
            </GlassCard>
          </AnimatedCard>
        )}

        {/* Profile Form */}
        <AnimatedCard delay={0.2}>
          <GlassCard className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    {...register('firstName')}
                    className="input-field pl-10"
                    placeholder="Adınız"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    {...register('lastName')}
                    className="input-field pl-10"
                    placeholder="Soyadınız"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="input-field pl-10"
                  placeholder="ornek@universite.edu.tr"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Telefon Numarası
              </label>
              <input
                type="tel"
                {...register('phoneNumber')}
                className="input-field"
                placeholder="+90 555 123 45 67"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Değişiklikleri Kaydet
                </>
              )}
            </motion.button>
          </form>
          </GlassCard>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default Profile;

