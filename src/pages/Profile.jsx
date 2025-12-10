import { useState } from 'react';
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchUserProfile();
      toast.success('Profil resmi başarıyla yüklendi!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profil resmi yüklenemedi');
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
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl relative overflow-hidden"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
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
                <span className="relative z-10">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </motion.div>
              {user?.profilePictureUrl && (
                <motion.img
                  src={user.profilePictureUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover absolute inset-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                />
              )}
              <motion.label
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 p-3 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full cursor-pointer shadow-xl hover:shadow-2xl transition-all"
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </motion.label>
            </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {uploading ? 'Yükleniyor...' : 'Profil resmini değiştirmek için tıklayın'}
              </p>
          </div>
          </GlassCard>
        </AnimatedCard>

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

