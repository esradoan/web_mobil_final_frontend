import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { User, Mail, Save, Upload, Camera, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import AnimatedCard from '../components/AnimatedCard';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phoneNumber: z.string().optional(),
});

const Profile = () => {
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Check if user is Admin
  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin';

  // Admin için sadece email schema
  const adminSchema = z.object({
    email: z.string().email('Geçerli bir email adresi giriniz'),
  });

  // Debug: User objesini console'a yazdır
  console.log('Current user object:', user);
  console.log('Is Admin:', isAdmin);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isAdmin ? adminSchema : profileSchema),
    defaultValues: {
      firstName: user?.firstName || user?.FirstName || '',
      lastName: user?.lastName || user?.LastName || '',
      email: user?.email || user?.Email || '',
      phoneNumber: user?.phoneNumber || user?.PhoneNumber || '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Admin için sadece email gönder (backend zaten kontrol ediyor ama ekstra güvenlik)
      const payload = isAdmin 
        ? { email: data.email }
        : data;
      
      await api.put('/users/me', payload);
      await fetchUserProfile();
      toast.success('Profil başarıyla güncellendi!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setLoading(false);
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

        {/* Profile Picture Section - Admin için profil resmi yok */}
        {!isAdmin && (
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {(() => {
                // Backend'den gelen profil resmi URL'ini bul (camelCase veya PascalCase)
                const profilePictureUrl = user?.profilePictureUrl || 
                                         user?.ProfilePictureUrl || 
                                         user?.profilePicture ||
                                         user?.ProfilePicture;
                
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
                      {isAdmin 
                        ? 'A' // Admin için sadece 'A'
                        : `${user?.firstName?.[0] || user?.FirstName?.[0] || ''}${user?.lastName?.[0] || user?.LastName?.[0] || ''}`
                      }
                    </span>
                    
                    {/* Profile Picture Overlay */}
                    {profilePictureUrl && (
                      <img
                        src={profilePictureUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover absolute inset-0 z-20"
                        onError={(e) => {
                          console.error('Resim yükleme hatası:', profilePictureUrl);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Resim başarıyla yüklendi:', profilePictureUrl);
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
        )}

        {/* Profile Form */}
        <AnimatedCard delay={0.2}>
          <GlassCard className="p-8">
          {isAdmin ? (
            // Admin için sadece email formu
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Admin Hesabı:</strong> Admin hesapları için sadece email adresi güncellenebilir.
                </p>
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
                    placeholder="admin@smartcampus.edu"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
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
                    Email'i Güncelle
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            // Normal kullanıcılar için tam form
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
          )}

          </GlassCard>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default Profile;

