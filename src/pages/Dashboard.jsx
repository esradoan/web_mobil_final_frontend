import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  Bell,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Toplam Öğrenci',
      value: '1,234',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
    },
    {
      title: 'Aktif Dersler',
      value: '45',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      change: '+5%',
    },
    {
      title: 'Bu Hafta Etkinlikler',
      value: '8',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      change: '+3',
    },
    {
      title: 'Başarı Oranı',
      value: '87%',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      change: '+2%',
    },
  ];

  const recentActivities = [
    { id: 1, title: 'Yeni ders kaydı yapıldı', time: '2 saat önce', type: 'success' },
    { id: 2, title: 'Yoklama verildi', time: '5 saat önce', type: 'info' },
    { id: 3, title: 'Profil güncellendi', time: '1 gün önce', type: 'success' },
    { id: 4, title: 'Yeni duyuru yayınlandı', time: '2 gün önce', type: 'info' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 rounded-3xl p-8 text-white shadow-2xl"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-8 h-8" />
              <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                Yeni Güncellemeler
              </span>
            </motion.div>
            <h1 className="text-5xl font-bold mb-3 text-shadow-lg">
              Hoş Geldiniz, {user?.firstName || user?.FirstName || 'Kullanıcı'}! 👋
            </h1>
            <p className="text-primary-100 text-xl">
              Smart Campus yönetim paneline hoş geldiniz
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <AnimatedCard key={stat.title} delay={index * 0.1}>
                <GlassCard className="p-6 group cursor-pointer relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/10 group-hover:to-purple-500/10 transition-all duration-300"
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg relative overflow-hidden`}
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                        <Icon className="w-6 h-6 text-white relative z-10" />
                      </motion.div>
                      <motion.span
                        className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                      >
                        {stat.change}
                      </motion.span>
                    </div>
                    <motion.h3
                      className="text-3xl font-bold gradient-text mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                    >
                      {stat.value}
                    </motion.h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {stat.title}
                    </p>
                  </div>
                </GlassCard>
              </AnimatedCard>
            );
          })}
        </div>

        {/* Recent Activities */}
        <AnimatedCard delay={0.4}>
          <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Son Aktiviteler
            </h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'success' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${
                    activity.type === 'success' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          </GlassCard>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default Dashboard;

