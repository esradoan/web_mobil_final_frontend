import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Settings,
  Sun,
  Moon,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Users,
  School,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  QrCode,
  Calendar
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-based navigation items
  const userRole = user?.role || user?.Role || '';
  const isStudent = userRole === 'Student' || userRole === 'student' || userRole === 2;
  const isFaculty = userRole === 'Faculty' || userRole === 'faculty' || userRole === 1;
  const isAdmin = userRole === 'Admin' || userRole === 'admin' || userRole === 0;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  // Student-specific menu items
  if (isStudent) {
    navItems.push(
      { path: '/student-course-application', label: 'Ders Başvurusu', icon: BookOpen },
      { path: '/my-courses', label: 'Derslerim', icon: BookOpen },
      { path: '/join-attendance', label: 'Yoklamaya Katıl', icon: ClipboardCheck },
      { path: '/attendance-status', label: 'Devamsızlık Bilgisi', icon: TrendingUp },
      { path: '/grades', label: 'Notlarım', icon: GraduationCap },
      { path: '/courses', label: 'Ders Kataloğu', icon: School },
      { path: '/meals/menu', label: 'Yemek Menüleri', icon: UtensilsCrossed },
      { path: '/meals/reservations', label: 'Rezervasyonlarım', icon: UtensilsCrossed },
      { path: '/wallet', label: 'Cüzdan', icon: Wallet },
      { path: '/events', label: 'Etkinlikler', icon: Calendar },
      { path: '/my-events', label: 'Etkinliklerim', icon: Calendar }
    );
  }

  // Faculty-specific menu items
  if (isFaculty) {
    navItems.push(
      { path: '/my-sections', label: 'Verdiğim Dersler', icon: BookOpen },
      { path: '/course-application', label: 'Ders Başvurusu', icon: BookOpen },
      { path: '/attendance/start', label: 'Yoklama Başlat', icon: ClipboardCheck },
      { path: '/attendance/reports', label: 'Yoklama Raporları', icon: ClipboardCheck },
      { path: '/gradebook', label: 'Not Girişi', icon: GraduationCap },
      { path: '/excuse-requests', label: 'Mazeret Talepleri', icon: Users },
      { path: '/meals/scan', label: 'Yemek QR Okutma', icon: QrCode },
      { path: '/events/checkin', label: 'Etkinlik Check-in', icon: QrCode }
    );
  }

  // Admin-specific menu items
  if (isAdmin) {
    navItems.push(
      { path: '/admin', label: 'Admin Paneli', icon: Users },
      { path: '/meals/scan', label: 'Yemek QR Okutma', icon: QrCode },
      { path: '/events/checkin', label: 'Etkinlik Check-in', icon: QrCode }
    );
  } else {
    // Common menu items (not for admin)
    navItems.push(
      { path: '/profile', label: 'Profil', icon: User }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl z-40">
        <div className="flex flex-col h-full">
          {/* Logo & Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.h1
                className="text-2xl font-bold gradient-text"
                whileHover={{ scale: 1.05 }}
              >
                Smart Campus
              </motion.h1>
              {/* Theme Toggle Button - Header */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title={isDark ? 'Açık moda geç' : 'Karanlık moda geç'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              title={isDark ? 'Açık moda geç' : 'Karanlık moda geç'}
            >
              {isDark ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span>Açık Mod</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span>Karanlık Mod</span>
                </>
              )}
            </motion.button>
            
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.firstName || user?.FirstName || 'Admin'} {user?.lastName || user?.LastName || ''}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {user?.email || user?.Email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-xl z-50 lg:hidden"
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Smart Campus
                </h1>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Theme Toggle Button - Mobile Header */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title={isDark ? 'Açık moda geç' : 'Karanlık moda geç'}
              >
                {isDark ? (
                  <>
                    <Sun className="w-5 h-5" />
                    <span>Açık Mod</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span>Karanlık Mod</span>
                  </>
                )}
              </motion.button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              {/* Dark Mode Toggle - Mobile */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title={isDark ? 'Açık moda geç' : 'Karanlık moda geç'}
              >
                {isDark ? (
                  <>
                    <Sun className="w-5 h-5" />
                    <span>Açık Mod</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span>Karanlık Mod</span>
                  </>
                )}
              </motion.button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

