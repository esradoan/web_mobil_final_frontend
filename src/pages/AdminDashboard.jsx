import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  UserPlus,
  Shield,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalAdmins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Backend'de users endpoint'i olmalı - şimdilik mock data kullanıyoruz
      // const response = await api.get('/users');
      // setUsers(response.data);
      
      // Mock data - gerçek API'ye bağlandığında kaldırılacak
      setTimeout(() => {
        setUsers([
          {
            id: 1,
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet@universite.edu.tr',
            role: 'Student',
            isEmailVerified: true,
            createdAt: '2024-01-15',
          },
          {
            id: 2,
            firstName: 'Ayşe',
            lastName: 'Demir',
            email: 'ayse@universite.edu.tr',
            role: 'Faculty',
            isEmailVerified: true,
            createdAt: '2024-01-10',
          },
        ]);
        setStats({
          totalUsers: 2,
          totalStudents: 1,
          totalFaculty: 1,
          totalAdmins: 0,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleConfig = {
      Admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Shield },
      Faculty: { label: 'Öğretim Üyesi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: BookOpen },
      Student: { label: 'Öğrenci', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: GraduationCap },
    };
    const config = roleConfig[role] || roleConfig.Student;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Admin Paneli
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Kullanıcı yönetimi ve sistem istatistikleri
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Yeni Kullanıcı
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedCard delay={0.1}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold gradient-text mb-2">
                {stats.totalUsers}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Toplam Kullanıcı
              </p>
            </GlassCard>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold gradient-text mb-2">
                {stats.totalStudents}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Öğrenci
              </p>
            </GlassCard>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold gradient-text mb-2">
                {stats.totalFaculty}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Öğretim Üyesi
              </p>
            </GlassCard>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold gradient-text mb-2">
                {stats.totalAdmins}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Admin
              </p>
            </GlassCard>
          </AnimatedCard>
        </div>

        {/* Users Table */}
        <AnimatedCard delay={0.5}>
          <GlassCard className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="input-field pl-10 appearance-none pr-10"
                >
                  <option value="all">Tüm Roller</option>
                  <option value="Admin">Admin</option>
                  <option value="Faculty">Öğretim Üyesi</option>
                  <option value="Student">Öğrenci</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Kullanıcı bulunamadı
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Kullanıcı
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Rol
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Durum
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Kayıt Tarihi
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                          {user.email}
                        </td>
                        <td className="py-4 px-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-4 px-4">
                          {user.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Doğrulanmış
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
                              <XCircle className="w-4 h-4" />
                              Beklemede
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

