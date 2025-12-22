import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import TestConnection from './pages/TestConnection';
// Part 2 Pages
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import Grades from './pages/Grades';
import Gradebook from './pages/Gradebook';
import StartAttendance from './pages/StartAttendance';
import GiveAttendance from './pages/GiveAttendance';
import QrCheckIn from './pages/QrCheckIn';
import JoinAttendance from './pages/JoinAttendance';
import AttendanceStatus from './pages/AttendanceStatus';
import AttendanceReport from './pages/AttendanceReport';
import ExcuseRequests from './pages/ExcuseRequests';
import MySections from './pages/MySections';
import FacultyGradebookList from './pages/FacultyGradebookList';
import FacultyAttendanceReportsList from './pages/FacultyAttendanceReportsList';
import CourseApplication from './pages/CourseApplication';
import CourseApplicationsManagement from './pages/CourseApplicationsManagement';
import StudentCourseApplication from './pages/StudentCourseApplication';
// Part 3 Pages
import MealMenu from './pages/MealMenu';
import MealReservations from './pages/MealReservations';
import Wallet from './pages/Wallet';
import MealScan from './pages/MealScan';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyEvents from './pages/MyEvents';
import EventCheckIn from './pages/EventCheckIn';

// Components
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin' || user?.role === 0 || user?.Role === 0;
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Faculty Route Component
const FacultyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isFaculty = user?.role === 'Faculty' || user?.Role === 'Faculty' || user?.role === 1 || user?.Role === 1;
  
  if (!isFaculty) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Student Route Component
const StudentRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isStudent = user?.role === 'Student' || user?.Role === 'Student' || user?.role === 2 || user?.Role === 2;
  
  if (!isStudent) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Login />
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Register />
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ForgotPassword />
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ResetPassword />
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VerifyEmail />
            </motion.div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Dashboard />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Profile />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminDashboard />
              </motion.div>
            </AdminRoute>
          }
        />
        <Route
          path="/course-applications-management"
          element={
            <AdminRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CourseApplicationsManagement />
              </motion.div>
            </AdminRoute>
          }
        />
        {/* Part 2 - Academic Management Routes */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CourseCatalog />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CourseDetail />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-courses"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MyCourses />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/my-sections"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MySections />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/course-application"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CourseApplication />
              </motion.div>
            </FacultyRoute>
          }
        />
        <Route
          path="/student-course-application"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentCourseApplication />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Grades />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/gradebook"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FacultyGradebookList />
              </motion.div>
            </FacultyRoute>
          }
        />
        <Route
          path="/gradebook/:sectionId"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Gradebook />
              </motion.div>
            </FacultyRoute>
          }
        />
        {/* Part 2 - Attendance Routes */}
        <Route
          path="/attendance/start"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StartAttendance />
              </motion.div>
            </FacultyRoute>
          }
        />
        <Route
          path="/attendance/give/:sessionId"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GiveAttendance />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/attendance/qr/:sessionId"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <QrCheckIn />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/join-attendance"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <JoinAttendance />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/attendance-status"
          element={
            <StudentRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AttendanceStatus />
              </motion.div>
            </StudentRoute>
          }
        />
        <Route
          path="/attendance/reports"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FacultyAttendanceReportsList />
              </motion.div>
            </FacultyRoute>
          }
        />
        <Route
          path="/attendance/report/:sectionId"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AttendanceReport />
              </motion.div>
            </FacultyRoute>
          }
        />
        <Route
          path="/excuse-requests"
          element={
            <FacultyRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExcuseRequests />
              </motion.div>
            </FacultyRoute>
          }
        />
        {/* Part 3 - Meal Service Routes */}
        <Route
          path="/meals/menu"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MealMenu />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/meals/reservations"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MealReservations />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Wallet />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/meals/scan"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MealScan />
              </motion.div>
            </ProtectedRoute>
          }
        />
        {/* Part 3 - Event Management Routes */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Events />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EventDetail />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MyEvents />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/checkin"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EventCheckIn />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:eventId/checkin"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EventCheckIn />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-connection"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TestConnection />
            </motion.div>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
