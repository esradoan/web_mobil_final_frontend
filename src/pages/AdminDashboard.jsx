import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  AlertCircle,
  FileText,
  ToggleLeft,
  ToggleRight,
  Plus,
  Globe,
  Save,
  X,
  Clock,
  UtensilsCrossed,
  ChefHat,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import api from '../config/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'students', 'courses', 'sections', or 'student-enrollments'
  const [userSubTab, setUserSubTab] = useState('students'); // 'students' or 'faculty' for users tab
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);
  const [studentApplicationsLoading, setStudentApplicationsLoading] = useState(false);
  const [studentApplicationsPage, setStudentApplicationsPage] = useState(1);
  const [studentApplicationsTotal, setStudentApplicationsTotal] = useState(0);
  const [processingApplicationId, setProcessingApplicationId] = useState(null);
  const [studentApplicationSearchTerm, setStudentApplicationSearchTerm] = useState('');
  const [filterStudentApplicationStatus, setFilterStudentApplicationStatus] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'
  const [filterDepartment, setFilterDepartment] = useState('all'); // 'all' or departmentId
  const [filterCourseDepartment, setFilterCourseDepartment] = useState('all'); // For courses
  const [selectedDepartment, setSelectedDepartment] = useState(null); // For user management - selected department
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState(''); // For department search in users tab
  const [studentDepartmentSearchTerm, setStudentDepartmentSearchTerm] = useState(''); // For department search in students tab
  const [courseDepartmentSearchTerm, setCourseDepartmentSearchTerm] = useState(''); // For department search in courses tab
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [coursesPage, setCoursesPage] = useState(1);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [coursesTotal, setCoursesTotal] = useState(0);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalAdmins: 0,
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchDepartments(); // Load departments for user editing
    } else if (activeTab === 'students') {
      fetchStudents();
      fetchDepartments();
    } else if (activeTab === 'courses') {
      fetchCourses();
      fetchDepartments();
    } else if (activeTab === 'sections') {
      fetchSections();
      fetchDepartments();
    } else if (activeTab === 'student-enrollments') {
      fetchStudentApplications();
    }
  }, [activeTab, userSubTab, selectedDepartment, studentsPage, filterActive, studentSearchTerm, coursesPage, filterCourseDepartment, courseSearchTerm, studentApplicationsPage, filterStudentApplicationStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          page: currentPage,
          pageSize: 1000 // Get all users to calculate stats
        }
      });
      
      // Backend'den gelen format: IEnumerable<UserDto> veya pagination wrapper
      let usersData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      // Helper function to get role
      const getUserRole = (u) => {
        const role = u.role || u.Role;
        if (typeof role === 'string') return role;
        if (typeof role === 'number') {
          const roleMap = { 0: 'Admin', 1: 'Faculty', 2: 'Student' };
          return roleMap[role] || null;
        }
        return null;
      };
      
      // Filter out current admin user
      const currentUserEmail = user?.email;
      usersData = usersData.filter(u => u.email !== currentUserEmail);
      
      // Filter by role (students or faculty)
      if (userSubTab === 'students') {
        usersData = usersData.filter(u => getUserRole(u) === 'Student');
      } else if (userSubTab === 'faculty') {
        usersData = usersData.filter(u => getUserRole(u) === 'Faculty');
      }
      
      // Filter by selected department
      if (selectedDepartment) {
        usersData = usersData.filter(u => u.departmentId === selectedDepartment);
      }
      
      // Calculate stats from all users (before filtering)
      const allUsers = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const allUsersFiltered = allUsers.filter(u => u.email !== currentUserEmail);
      
      const totalStudents = allUsersFiltered.filter(u => getUserRole(u) === 'Student').length;
      const totalFaculty = allUsersFiltered.filter(u => getUserRole(u) === 'Faculty').length;
      
      setUsers(usersData);
      setStats({
        totalUsers: allUsersFiltered.length,
        totalStudents,
        totalFaculty,
        totalAdmins: 0, // Don't show admin count
      });
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const isActiveParam = filterActive === 'all' ? null : filterActive === 'active';
      const params = new URLSearchParams({
        page: studentsPage.toString(),
        pageSize: '1000', // Get all for department filtering
        ...(isActiveParam !== null && { isActive: isActiveParam.toString() }),
        ...(studentSearchTerm && { search: studentSearchTerm }),
      });
      
      const response = await api.get(`/admin/students?${params}`);
      let studentsData = response.data.data || response.data || [];
      
      // Filter by department
      if (filterDepartment !== 'all') {
        studentsData = studentsData.filter(s => {
          const deptId = s.departmentId || s.department?.id;
          return deptId === parseInt(filterDepartment);
        });
      }
      
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setStudentsTotal(studentsData.length);
    } catch (error) {
      console.error('Öğrenciler yüklenemedi:', error);
      toast.error('Öğrenciler yüklenemedi');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/admin/students/${studentId}/status`, { isActive: newStatus });
      toast.success(`Öğrenci ${newStatus ? 'aktif' : 'pasif'} olarak güncellendi`);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Durum güncellenemedi');
    }
  };

  const handleViewTranscript = async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}/transcript/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Transkript indirildi');
    } catch (error) {
      toast.error('Transkript indirilemedi');
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const params = {
        page: coursesPage,
        limit: 1000, // Get all courses for filtering
      };
      if (courseSearchTerm) params.search = courseSearchTerm;
      
      const response = await api.get('/courses', { params });
      let coursesData = response.data?.data || response.data || [];
      
      // Filter by department
      if (filterCourseDepartment !== 'all') {
        coursesData = coursesData.filter(c => {
          const deptId = c.departmentId || c.department?.id;
          return deptId === parseInt(filterCourseDepartment);
        });
      }
      
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setCoursesTotal(coursesData.length);
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
      toast.error('Dersler yüklenemedi');
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sections');
      const sectionsData = response.data?.data || response.data || [];
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (error) {
      console.error('Şubeler yüklenemedi:', error);
      toast.error('Şubeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentApplications = async () => {
    try {
      setStudentApplicationsLoading(true);
      const params = {
        page: studentApplicationsPage,
        pageSize: 20,
      };
      if (filterStudentApplicationStatus) params.status = filterStudentApplicationStatus;
      
      const response = await api.get('/student-course-applications', { params });
      const applicationsData = response.data?.data || [];
      setStudentApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setStudentApplicationsTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Öğrenci başvuruları yüklenemedi:', error);
      toast.error('Öğrenci başvuruları yüklenemedi');
    } finally {
      setStudentApplicationsLoading(false);
    }
  };

  const handleApproveStudentApplication = async (applicationId) => {
    try {
      setProcessingApplicationId(applicationId);
      await api.put(`/student-course-applications/${applicationId}/approve`);
      toast.success('Başvuru onaylandı!');
      await fetchStudentApplications();
    } catch (error) {
      console.error('❌ Approve failed:', error);
      const errorMessage = error.response?.data?.message || 'Onaylama sırasında hata oluştu';
      toast.error(errorMessage);
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const handleRejectStudentApplication = async (applicationId, reason) => {
    try {
      setProcessingApplicationId(applicationId);
      await api.put(`/student-course-applications/${applicationId}/reject`, {
        reason: reason || 'Başvuru reddedildi.'
      });
      toast.success('Başvuru reddedildi!');
      await fetchStudentApplications();
    } catch (error) {
      console.error('❌ Reject failed:', error);
      const errorMessage = error.response?.data?.message || 'Reddetme sırasında hata oluştu';
      toast.error(errorMessage);
    } finally {
      setProcessingApplicationId(null);
    }
  };

  // Helper function to fix Turkish character encoding issues
  const fixTurkishChars = (text) => {
    if (!text) return text;
    // Fix common encoding issues where Turkish characters are replaced with ?
    // Pattern: character? -> correct Turkish character
    return text
      .replace(/Mühendisli\?i/g, 'Mühendisliği')  // Mühendisli?i -> Mühendisliği
      .replace(/mühendisli\?i/g, 'mühendisliği')  // mühendisli?i -> mühendisliği
      .replace(/i\?i/g, 'iği')  // i?i -> iği (common pattern)
      .replace(/I\?I/g, 'IĞI')  // I?I -> IĞI
      .replace(/i\?/g, 'ı')  // i? -> ı
      .replace(/I\?/g, 'İ')  // I? -> İ
      .replace(/u\?/g, 'ü') // u? -> ü
      .replace(/U\?/g, 'Ü') // U? -> Ü
      .replace(/o\?/g, 'ö') // o? -> ö
      .replace(/O\?/g, 'Ö') // O? -> Ö
      .replace(/s\?/g, 'ş') // s? -> ş
      .replace(/S\?/g, 'Ş') // S? -> Ş
      .replace(/g\?/g, 'ğ') // g? -> ğ
      .replace(/G\?/g, 'Ğ') // G? -> Ğ
      .replace(/c\?/g, 'ç') // c? -> ç
      .replace(/C\?/g, 'Ç') // C? -> Ç
      .replace(/\?/g, ''); // Remove any remaining ? characters
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const departmentsData = response.data?.data || response.data || [];
      // Fix Turkish characters in department names
      const fixedDepartments = Array.isArray(departmentsData) 
        ? departmentsData.map(dept => ({
            ...dept,
            name: fixTurkishChars(dept.name)
          }))
        : [];
      setDepartments(fixedDepartments);
      console.log('✅ Departments loaded:', fixedDepartments.length);
    } catch (error) {
      console.error('❌ Bölümler yüklenemedi:', error);
      toast.error('Bölümler yüklenemedi');
      setDepartments([]);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Bu dersi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Ders başarıyla silindi');
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ders silinemedi');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowCourseModal(true);
  };


  // User form schema
  const userSchema = z.object({
    email: z.string().email('Geçerli bir email adresi giriniz'),
    firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    phoneNumber: z.string().optional().or(z.literal('')),
    role: z.enum(['Admin', 'Faculty', 'Student']).optional(),
    departmentId: z.number().optional().nullable(),
  });

  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    formState: { errors: userErrors },
    reset: resetUser,
    setValue: setUserValue,
    control: controlUser,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: undefined,
      departmentId: null,
    },
  });

  // Watch role to conditionally show department field
  const watchedRole = useWatch({
    control: controlUser,
    name: 'role',
  });

  useEffect(() => {
    if (editingUser) {
      setUserValue('email', editingUser.email || '');
      setUserValue('firstName', editingUser.firstName || '');
      setUserValue('lastName', editingUser.lastName || '');
      setUserValue('phoneNumber', editingUser.phoneNumber || '');
      
      // Set role from user
      const currentRole = getUserRole(editingUser);
      if (currentRole) {
        setUserValue('role', currentRole);
      }
      
      // Set departmentId if available
      if (editingUser.departmentId) {
        setUserValue('departmentId', editingUser.departmentId);
      }
    } else {
      resetUser();
    }
  }, [editingUser, setUserValue, resetUser]);

  const handleEditUser = async (user) => {
    console.log('✏️ handleEditUser called with user:', user);
    if (!user) {
      console.error('❌ handleEditUser: user is null/undefined');
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }
    console.log('✅ Setting editingUser and opening modal');
    
    // Ensure departments are loaded before opening modal
    if (departments.length === 0) {
      await fetchDepartments();
    }
    
    // Ensure all user data is preserved including createdAt
    const userWithAllData = {
      ...user,
      createdAt: user.createdAt || user.CreatedAt || null
    };
    setEditingUser(userWithAllData);
    setShowUserModal(true);
    console.log('✅ Modal state updated - showUserModal: true, editingUser:', userWithAllData);
  };

  const handleUpdateUser = async (data) => {
    if (!editingUser) {
      toast.error('Düzenlenecek kullanıcı bulunamadı');
      return;
    }
    
    try {
      // Validate role change - if changing to Student/Faculty, departmentId is required
      if (data.role && (data.role === 'Student' || data.role === 'Faculty') && !data.departmentId) {
        toast.error(`${data.role === 'Student' ? 'Öğrenci' : 'Öğretim Üyesi'} rolü için bölüm seçilmelidir`);
        return;
      }
      
      const currentRole = getUserRole(editingUser);
      const roleChanged = data.role && data.role !== currentRole;
      
      console.log('💾 Updating user:', editingUser.email, 'with data:', {
        ...data,
        roleChanged,
        currentRole,
        newRole: data.role
      });
      
      const updatePayload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
      };
      
      // Only send role if it's different from current role
      if (roleChanged && data.role) {
        // Map string role to enum value for backend
        const roleMap = {
          'Admin': 0,
          'Faculty': 1,
          'Student': 2
        };
        updatePayload.role = roleMap[data.role] ?? 0;
        
        // If changing to Student or Faculty, include departmentId
        if ((data.role === 'Student' || data.role === 'Faculty') && data.departmentId) {
          updatePayload.departmentId = data.departmentId;
        }
      }
      
      await api.put(`/admin/users/update/${encodeURIComponent(editingUser.email)}`, updatePayload);
      toast.success('Kullanıcı başarıyla güncellendi');
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('❌ Kullanıcı güncellenemedi:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Kullanıcı güncellenemedi';
      toast.error(errorMessage);
    }
  };

  // Course form schema
  const courseSchema = z.object({
    code: z.string().min(2, 'Ders kodu en az 2 karakter olmalıdır'),
    name: z.string().min(3, 'Ders adı en az 3 karakter olmalıdır'),
    description: z.string().optional(),
    credits: z.number().min(1, 'Kredi en az 1 olmalıdır').max(10, 'Kredi en fazla 10 olabilir'),
    ects: z.number().min(1, 'ECTS en az 1 olmalıdır').max(20, 'ECTS en fazla 20 olabilir'),
    departmentId: z.number().min(1, 'Bölüm seçilmelidir'),
    type: z.enum(['Required', 'Elective', 'GeneralElective'], {
      required_error: 'Ders tipi seçilmelidir',
    }),
    allowCrossDepartment: z.boolean().default(false),
    syllabusUrl: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  });

  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    formState: { errors: courseErrors },
    reset: resetCourse,
    setValue: setCourseValue,
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      credits: 3,
      ects: 5,
      departmentId: 0,
      type: 'Required',
      allowCrossDepartment: false,
      syllabusUrl: '',
    },
  });

  useEffect(() => {
    if (editingCourse) {
      setCourseValue('code', editingCourse.code || '');
      setCourseValue('name', editingCourse.name || '');
      setCourseValue('description', editingCourse.description || '');
      setCourseValue('credits', editingCourse.credits || 3);
      setCourseValue('ects', editingCourse.ects || 5);
      setCourseValue('departmentId', editingCourse.department?.id || 0);
      setCourseValue('type', editingCourse.type || 'Required');
      setCourseValue('allowCrossDepartment', editingCourse.allowCrossDepartment || false);
      setCourseValue('syllabusUrl', editingCourse.syllabusUrl || '');
    } else {
      resetCourse();
    }
  }, [editingCourse, setCourseValue, resetCourse]);

  const onSubmitCourse = async (data) => {
    try {
      if (editingCourse) {
        // Update course
        await api.put(`/courses/${editingCourse.id}`, {
          name: data.name,
          description: data.description,
          credits: data.credits,
          ects: data.ects,
          type: data.type,
          allowCrossDepartment: data.allowCrossDepartment,
          syllabusUrl: data.syllabusUrl || null,
        });
        toast.success('Ders başarıyla güncellendi');
      } else {
        // Create course
        await api.post('/courses', {
          code: data.code,
          name: data.name,
          description: data.description,
          credits: data.credits,
          ects: data.ects,
          departmentId: data.departmentId,
          type: data.type,
          allowCrossDepartment: data.allowCrossDepartment,
          syllabusUrl: data.syllabusUrl || null,
        });
        toast.success('Ders başarıyla oluşturuldu');
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  // Helper function to get user role (handles both camelCase and PascalCase)
  // Backend'den gelen Role property'si enum olarak serialize edilmiş olabilir (string veya number)
  const getUserRole = (user) => {
    if (!user) {
      console.warn('⚠️ getUserRole: user is null/undefined');
      return null;
    }
    
    // Try multiple property names (camelCase, PascalCase)
    const role = user.role || user.Role;
    
    if (role === undefined || role === null) {
      console.warn('⚠️ User has no role property:', { 
        email: user.email, 
        hasRole: 'role' in user, 
        hasRoleCapital: 'Role' in user,
        userKeys: Object.keys(user)
      });
      return null;
    }
    
    // Handle string enum values (from JsonStringEnumConverter)
    if (typeof role === 'string') {
      // Normalize string: "Student", "student", "STUDENT" -> "Student"
      const normalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      console.log(`🔍 Role from string for ${user.email}: "${role}" -> "${normalized}"`);
      return normalized;
    }
    
    // Handle number enum values (fallback if enum converter not working)
    if (typeof role === 'number') {
      // Map enum numbers to strings (0=Admin, 1=Faculty, 2=Student)
      const roleMap = { 0: 'Admin', 1: 'Faculty', 2: 'Student' };
      const mapped = roleMap[role] || null;
      console.log(`🔍 Role from number for ${user.email}: ${role} -> "${mapped}"`);
      return mapped;
    }
    
    console.warn('⚠️ Unknown role type for', user.email, ':', typeof role, role);
    return null;
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadge = (user) => {
    if (!user) {
      console.error('❌ getRoleBadge: user is null/undefined');
      return <span className="text-red-500">Error</span>;
    }
    
    // Always use getUserRole to ensure consistent parsing
    const role = getUserRole(user);
    
    console.log(`🏷️ getRoleBadge for ${user.email}:`, {
      rawRole: user.role,
      rawRoleCapital: user.Role,
      computedRole: role,
      allUserKeys: Object.keys(user)
    });
    
    const roleConfig = {
      Admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Shield },
      Faculty: { label: 'Öğretim Üyesi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: BookOpen },
      Student: { label: 'Öğrenci', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: GraduationCap },
    };
    
    // Normalize role string (handle case variations)
    let normalizedRole = role;
    if (role && typeof role === 'string') {
      normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    } else if (role && typeof role === 'number') {
      const roleMap = { 0: 'Admin', 1: 'Faculty', 2: 'Student' };
      normalizedRole = roleMap[role] || 'Student';
    } else {
      // Fallback: if role is null/undefined, default to Student
      console.warn(`⚠️ Role is null/undefined for ${user.email}, defaulting to Student`);
      normalizedRole = 'Student';
    }
    
    const config = roleConfig[normalizedRole] || roleConfig.Student;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleDeleteUser = async (userEmail) => {
    if (!window.confirm(`Kullanıcı ${userEmail} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/delete/${encodeURIComponent(userEmail)}`);
      toast.success('Kullanıcı başarıyla silindi');
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Kullanıcı silinemedi:', error);
      toast.error(error.response?.data?.message || 'Kullanıcı silinemedi');
    }
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatedCard delay={0.5}>
            <motion.div
              className="p-6 cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl"
              onClick={() => navigate('/admin/meals/menus')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-4">
                <UtensilsCrossed className="w-8 h-8" />
                <ChefHat className="w-6 h-6 opacity-80" />
              </div>
              <h3 className="text-xl font-bold mb-2">Yemek Menüsü Yönetimi</h3>
              <p className="text-sm opacity-90">Menüleri oluştur ve yönet</p>
            </motion.div>
          </AnimatedCard>
          <AnimatedCard delay={0.6}>
            <motion.div
              className="p-6 cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl"
              onClick={() => navigate('/admin/events')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8" />
                <Globe className="w-6 h-6 opacity-80" />
              </div>
              <h3 className="text-xl font-bold mb-2">Etkinlik Yönetimi</h3>
              <p className="text-sm opacity-90">Etkinlikleri oluştur ve yönet</p>
            </motion.div>
          </AnimatedCard>
          <AnimatedCard delay={0.7}>
            <motion.div
              className="p-6 cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl"
              onClick={() => navigate('/course-applications-management')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8" />
                <FileText className="w-6 h-6 opacity-80" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ders Başvuru Yönetimi</h3>
              <p className="text-sm opacity-90">Ders başvurularını onayla</p>
            </motion.div>
          </AnimatedCard>
        </div>

        {/* Tabs */}
        <AnimatedCard delay={0.4}>
          <GlassCard className="p-0">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'users'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Kullanıcılar
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'students'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Öğrenci Yönetimi
                </div>
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'courses'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Ders Yönetimi
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sections')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'sections'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Ders Atama
                </div>
              </button>
              <button
                onClick={() => setActiveTab('student-enrollments')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'student-enrollments'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Öğrenci Ders Başvurusu
                </div>
              </button>
            </div>
          </GlassCard>
        </AnimatedCard>

        {/* Users Table */}
        {activeTab === 'users' && (
        <AnimatedCard delay={0.5}>
          <GlassCard className="p-6">
            {/* Sub-tabs for Students and Faculty */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <motion.button
                onClick={() => {
                  setUserSubTab('students');
                  setSelectedDepartment(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  userSubTab === 'students'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Öğrenciler</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    userSubTab === 'students'
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  }`}>
                    {stats.totalStudents}
                  </span>
                </div>
              </motion.button>
              <motion.button
                onClick={() => {
                  setUserSubTab('faculty');
                  setSelectedDepartment(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  userSubTab === 'faculty'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Öğretim Üyeleri</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    userSubTab === 'faculty'
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  }`}>
                    {stats.totalFaculty}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Department Filter - Scrollable with Search */}
            {departments.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Bölüm Filtrele
                    </p>
                  </div>
                </div>
                {/* Department Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Bölüm ara..."
                    value={departmentSearchTerm}
                    onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full text-sm rounded-lg border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                  />
                </div>
                {/* Scrollable Department List */}
                <div className="overflow-x-auto pb-2 department-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(203 213 225) transparent' }}>
                  <div className="flex gap-2.5 min-w-max">
                    <motion.button
                      onClick={() => setSelectedDepartment(null)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0 ${
                        selectedDepartment === null
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        Tüm Bölümler
                      </span>
                    </motion.button>
                    {departments
                      .filter(dept => 
                        !departmentSearchTerm || 
                        dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
                      )
                      .map((dept) => (
                        <motion.button
                          key={dept.id}
                          onClick={() => setSelectedDepartment(dept.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0 ${
                            selectedDepartment === dept.id
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {dept.name}
                        </motion.button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`${userSubTab === 'students' ? 'Öğrenci' : 'Öğretim Üyesi'} ara (ad, soyad, email)...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12 w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
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
                        Bölüm
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
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {user.email}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {user.departmentId && departments.length > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {departments.find(d => d.id === user.departmentId)?.name || 'N/A'}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {user.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Doğrulanmış
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Beklemede
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('✏️ Edit button clicked for user:', user);
                                handleEditUser(user);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 cursor-pointer z-10 relative"
                              title="Düzenle"
                              type="button"
                              style={{ pointerEvents: 'auto' }}
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.email);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer z-10 relative"
                              title="Sil"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4 pointer-events-none" />
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
        )}

        {/* Students Table */}
        {activeTab === 'students' && (
        <AnimatedCard delay={0.5}>
          <GlassCard className="p-6">
            {/* Department Filter - Scrollable with Search */}
            {departments.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Bölüm Filtrele
                    </p>
                  </div>
                </div>
                {/* Department Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Bölüm ara..."
                    value={studentDepartmentSearchTerm}
                    onChange={(e) => setStudentDepartmentSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full text-sm rounded-lg border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                  />
                </div>
                {/* Scrollable Department List */}
                <div className="overflow-x-auto pb-2 department-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(203 213 225) transparent' }}>
                  <div className="flex gap-2.5 min-w-max">
                    <motion.button
                      onClick={() => setFilterDepartment('all')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0 ${
                        filterDepartment === 'all'
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        Tüm Bölümler
                      </span>
                    </motion.button>
                    {departments
                      .filter(dept => 
                        !studentDepartmentSearchTerm || 
                        dept.name.toLowerCase().includes(studentDepartmentSearchTerm.toLowerCase())
                      )
                      .map((dept) => (
                        <motion.button
                          key={dept.id}
                          onClick={() => setFilterDepartment(dept.id.toString())}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0 ${
                            filterDepartment === dept.id.toString()
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {dept.name}
                        </motion.button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Öğrenci ara (numara, ad, soyad, email)..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="input-field pl-12 w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="relative md:w-48">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <select
                  value={filterActive}
                  onChange={(e) => {
                    setFilterActive(e.target.value);
                    setStudentsPage(1);
                  }}
                  className="input-field pl-12 appearance-none pr-10 rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Öğrenci bulunamadı
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Öğrenci No
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Ad Soyad
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Bölüm
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          GPA
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Durum
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                              {student.studentNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                            {student.email}
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                            {student.departmentName}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {student.cgpa.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {student.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                                <XCircle className="w-3 h-3" />
                                Pasif
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                onClick={() => handleToggleStudentStatus(student.id, student.isActive)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                title={student.isActive ? 'Pasif yap' : 'Aktif yap'}
                              >
                                {student.isActive ? (
                                  <ToggleRight className="w-5 h-5" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5" />
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => handleViewTranscript(student.id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Transkript Görüntüle"
                              >
                                <FileText className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {studentsTotal > 20 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Toplam {studentsTotal} öğrenci
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStudentsPage(p => Math.max(1, p - 1))}
                        disabled={studentsPage === 1}
                        className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Önceki
                      </button>
                      <span className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        Sayfa {studentsPage}
                      </span>
                      <button
                        onClick={() => setStudentsPage(p => p + 1)}
                        disabled={studentsPage * 20 >= studentsTotal}
                        className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Sonraki
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </AnimatedCard>
        )}

        {/* Courses Table */}
        {activeTab === 'courses' && (
        <AnimatedCard delay={0.5}>
          <GlassCard className="p-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Ders Yönetimi
              </h2>
              <motion.button
                onClick={handleCreateCourse}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Yeni Ders
              </motion.button>
            </div>

            {/* Department Filter - Scrollable with Search */}
            {departments.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Bölüm Filtrele
                    </p>
                  </div>
                </div>
                {/* Department Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Bölüm ara..."
                    value={courseDepartmentSearchTerm}
                    onChange={(e) => setCourseDepartmentSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full text-sm rounded-lg border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                  />
                </div>
                {/* Scrollable Department List */}
                <div className="overflow-x-auto pb-2 department-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(203 213 225) transparent' }}>
                  <div className="flex gap-2.5 min-w-max">
                    <motion.button
                      onClick={() => setFilterCourseDepartment('all')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0 ${
                        filterCourseDepartment === 'all'
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        Tüm Bölümler
                      </span>
                    </motion.button>
                    {departments
                      .filter(dept => 
                        !courseDepartmentSearchTerm || 
                        dept.name.toLowerCase().includes(courseDepartmentSearchTerm.toLowerCase())
                      )
                      .map((dept) => (
                        <motion.button
                          key={dept.id}
                          onClick={() => setFilterCourseDepartment(dept.id.toString())}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0 ${
                            filterCourseDepartment === dept.id.toString()
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {dept.name}
                        </motion.button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ders ara (kod, ad)..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  className="input-field pl-12 w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Courses Table */}
            {coursesLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Ders bulunamadı
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Ders Kodu
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Ders Adı
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Bölüm
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Tip
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Kredi/ECTS
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <motion.tr
                        key={course.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                            {course.code}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {course.name}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                          {course.department?.name || 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          {course.type && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                              course.type === 'Required'
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                : course.type === 'Elective'
                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            }`}>
                              {course.type === 'Required' && <CheckCircle className="w-3 h-3" />}
                              {course.type === 'Elective' && <BookOpen className="w-3 h-3" />}
                              {course.type === 'GeneralElective' && <Globe className="w-3 h-3" />}
                              {course.type === 'Required' ? 'Zorunlu' : course.type === 'Elective' ? 'Seçmeli' : 'Genel Seçmeli'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                          {course.credits} / {course.ects}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              onClick={() => handleEditCourse(course)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteCourse(course.id)}
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

            {/* Pagination */}
            {coursesTotal > 20 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Sayfa {coursesPage} / {Math.ceil(coursesTotal / 20)} (Toplam {coursesTotal} ders)
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCoursesPage(prev => Math.max(1, prev - 1))}
                    disabled={coursesPage === 1}
                    className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCoursesPage(prev => prev + 1)}
                    disabled={coursesPage >= Math.ceil(coursesTotal / 20)}
                    className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </motion.button>
                </div>
              </div>
            )}
          </GlassCard>
        </AnimatedCard>
        )}

        {/* Course Modal */}
        <AnimatePresence>
          {showCourseModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowCourseModal(false);
                setEditingCourse(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <GlassCard className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {editingCourse ? 'Ders Düzenle' : 'Yeni Ders Oluştur'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowCourseModal(false);
                        setEditingCourse(null);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitCourse(onSubmitCourse)} className="space-y-6">
                    {/* Course Code (only for new courses) */}
                    {!editingCourse && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Ders Kodu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...registerCourse('code')}
                          className="input-field w-full"
                          placeholder="CENG101"
                        />
                        {courseErrors.code && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {courseErrors.code.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Course Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ders Adı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...registerCourse('name')}
                        className="input-field w-full"
                        placeholder="Introduction to Computer Engineering"
                      />
                      {courseErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {courseErrors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Açıklama
                      </label>
                      <textarea
                        {...registerCourse('description')}
                        rows={4}
                        className="input-field w-full"
                        placeholder="Ders açıklaması..."
                      />
                    </div>

                    {/* Credits and ECTS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Kredi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...registerCourse('credits', { valueAsNumber: true })}
                          className="input-field w-full"
                          min="1"
                          max="10"
                        />
                        {courseErrors.credits && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {courseErrors.credits.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          ECTS <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          {...registerCourse('ects', { valueAsNumber: true })}
                          className="input-field w-full"
                          min="1"
                          max="20"
                        />
                        {courseErrors.ects && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {courseErrors.ects.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Department (only for new courses) */}
                    {!editingCourse && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Bölüm <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...registerCourse('departmentId', { valueAsNumber: true })}
                          className="input-field w-full"
                        >
                          <option value={0}>Bölüm seçiniz</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        {courseErrors.departmentId && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {courseErrors.departmentId.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Course Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ders Tipi <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...registerCourse('type')}
                        className="input-field w-full"
                      >
                        <option value="Required">Zorunlu</option>
                        <option value="Elective">Seçmeli</option>
                        <option value="GeneralElective">Genel Seçmeli</option>
                      </select>
                      {courseErrors.type && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {courseErrors.type.message}
                        </p>
                      )}
                    </div>

                    {/* Allow Cross Department */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        {...registerCourse('allowCrossDepartment')}
                        id="allowCrossDepartment"
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="allowCrossDepartment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Farklı bölümlerden öğrenci alabilir
                      </label>
                    </div>

                    {/* Syllabus URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ders Programı URL (PDF)
                      </label>
                      <input
                        type="url"
                        {...registerCourse('syllabusUrl')}
                        className="input-field w-full"
                        placeholder="https://example.com/syllabus.pdf"
                      />
                      {courseErrors.syllabusUrl && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {courseErrors.syllabusUrl.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <motion.button
                        type="button"
                        onClick={() => {
                          setShowCourseModal(false);
                          setEditingCourse(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary"
                      >
                        İptal
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        {editingCourse ? 'Güncelle' : 'Oluştur'}
                      </motion.button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Edit Modal */}
        <AnimatePresence>
          {showUserModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowUserModal(false);
                setEditingUser(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <GlassCard className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Kullanıcı Düzenle
                    </h2>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setEditingUser(null);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitUser(handleUpdateUser)} className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        {...registerUser('email')}
                        className="input-field w-full"
                        placeholder="user@example.com"
                      />
                      {userErrors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {userErrors.email.message}
                        </p>
                      )}
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...registerUser('firstName')}
                        className="input-field w-full"
                        placeholder="Ad"
                      />
                      {userErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {userErrors.firstName.message}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Soyad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...registerUser('lastName')}
                        className="input-field w-full"
                        placeholder="Soyad"
                      />
                      {userErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {userErrors.lastName.message}
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
                        {...registerUser('phoneNumber')}
                        className="input-field w-full"
                        placeholder="+90 555 123 4567"
                      />
                      {userErrors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {userErrors.phoneNumber.message}
                        </p>
                      )}
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Rol <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...registerUser('role')}
                        className="input-field w-full"
                        defaultValue={editingUser ? getUserRole(editingUser) : ''}
                      >
                        <option value="">Rol Seçiniz</option>
                        <option value="Admin">Admin</option>
                        <option value="Faculty">Öğretim Üyesi</option>
                        <option value="Student">Öğrenci</option>
                      </select>
                      {userErrors.role && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {userErrors.role.message}
                        </p>
                      )}
                    </div>

                    {/* Department Selection - Always show */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bölüm {watchedRole === 'Student' || watchedRole === 'Faculty' ? <span className="text-red-500">*</span> : ''}
                      </label>
                      <select
                        {...registerUser('departmentId', {
                          valueAsNumber: true,
                          required: (watchedRole === 'Student' || watchedRole === 'Faculty') ? 'Bölüm seçilmelidir' : false
                        })}
                        className="input-field w-full"
                        defaultValue={editingUser?.departmentId || ''}
                      >
                        <option value="">Bölüm Seçiniz</option>
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Bölümler yükleniyor...</option>
                        )}
                      </select>
                      {userErrors.departmentId && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {userErrors.departmentId.message}
                        </p>
                      )}
                      {/* Show current department if exists */}
                      {editingUser && editingUser.departmentId && departments.length > 0 && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Mevcut bölüm: {departments.find(d => d.id === editingUser.departmentId)?.name || 'Bilinmiyor'}
                        </p>
                      )}
                    </div>

                    {/* Registration Date (Read-only) - Always show if available */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Kayıt Tarihi
                      </label>
                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {editingUser && (editingUser.createdAt || editingUser.CreatedAt) ? (
                            new Date(editingUser.createdAt || editingUser.CreatedAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Bilinmiyor</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <motion.button
                        type="button"
                        onClick={() => {
                          setShowUserModal(false);
                          setEditingUser(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary"
                      >
                        İptal
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Güncelle
                      </motion.button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Sections Management */}
        {activeTab === 'sections' && (
          <AnimatedCard delay={0.5}>
            <GlassCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Ders Atama
                  </h2>
                  <motion.button
                    onClick={() => navigate('/course-applications-management')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Başvuru Yönetimi
                  </motion.button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Bilgi:</strong> Derslere öğretmen ataması yapmak için "Başvuru Yönetimi" sayfasını kullanabilir veya öğretmenlerin başvurularını onaylayabilirsiniz. 
                    Öğretmenler maksimum 2 ders alabilir. Onaylandığında ders için otomatik olarak şube oluşturulacaktır.
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Şubeler yükleniyor...</p>
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Henüz şube bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ders Kodu</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ders Adı</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Şube</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Dönem/Yıl</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Öğretmen</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Kapasite</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Kayıtlı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map((section, index) => (
                          <motion.tr
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                              {section.courseCode || section.course?.code || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                              {section.courseName || section.course?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                              {section.sectionNumber}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                              {section.semester} {section.year}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                              {section.instructorName || (section.instructor?.firstName && section.instructor?.lastName ? `${section.instructor.firstName} ${section.instructor.lastName}` : 'Atanmamış')}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                              {section.capacity}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                              {section.enrolledCount || 0}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </GlassCard>
          </AnimatedCard>
        )}

        {/* Student Course Applications Management */}
        {activeTab === 'student-enrollments' && (
          <AnimatedCard delay={0.5}>
            <GlassCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Öğrenci Ders Başvuruları
                  </h2>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Öğrenci, ders veya email ara..."
                      value={studentApplicationSearchTerm}
                      onChange={(e) => setStudentApplicationSearchTerm(e.target.value)}
                      className="input-field pl-12 w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <select
                    value={filterStudentApplicationStatus}
                    onChange={(e) => {
                      setFilterStudentApplicationStatus(e.target.value);
                      setStudentApplicationsPage(1);
                    }}
                    className="input-field px-4 py-2 rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="Pending">Beklemede</option>
                    <option value="Approved">Onaylandı</option>
                    <option value="Rejected">Reddedildi</option>
                  </select>
                </div>

                {/* Applications List */}
                {studentApplicationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                ) : studentApplications.filter(app => {
                  const matchesSearch = 
                    app.course?.code?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                    app.course?.name?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                    app.studentName?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                    app.studentEmail?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                    app.studentNumber?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase());
                  return matchesSearch;
                }).length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Başvuru bulunamadı
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                            <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Öğrenci
                            </th>
                            <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Ders
                            </th>
                            <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Şube
                            </th>
                            <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Durum
                            </th>
                            <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Başvuru Tarihi
                            </th>
                            <th className="text-right py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentApplications
                            .filter(app => {
                              const matchesSearch = 
                                app.course?.code?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                                app.course?.name?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                                app.studentName?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                                app.studentEmail?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase()) ||
                                app.studentNumber?.toLowerCase().includes(studentApplicationSearchTerm.toLowerCase());
                              return matchesSearch;
                            })
                            .map((app, index) => {
                              const isPending = app.status === 'Pending' || app.status === 0;
                              
                              return (
                                <motion.tr
                                  key={app.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  <td className="py-4 px-6">
                                    <div>
                                      <p className="font-medium text-slate-900 dark:text-white">
                                        {app.studentName}
                                      </p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {app.studentNumber} | {app.studentEmail}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div>
                                      <p className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                                        {app.course?.code || 'N/A'}
                                      </p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {app.course?.name || 'N/A'}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-sm">
                                    Şube {app.section?.sectionNumber || 'N/A'}
                                  </td>
                                  <td className="py-4 px-6">
                                    {app.status === 'Pending' || app.status === 0 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                                        <Clock className="w-3 h-3" />
                                        Beklemede
                                      </span>
                                    ) : app.status === 'Approved' || app.status === 1 ? (
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
                                  </td>
                                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-sm">
                                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString('tr-TR') : 'N/A'}
                                  </td>
                                  <td className="py-4 px-6">
                                    {isPending && (
                                      <div className="flex items-center justify-end gap-2">
                                        <motion.button
                                          onClick={() => handleApproveStudentApplication(app.id)}
                                          disabled={processingApplicationId === app.id}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                          {processingApplicationId === app.id ? (
                                            <>
                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                              İşleniyor...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="w-3 h-3" />
                                              Onayla
                                            </>
                                          )}
                                        </motion.button>
                                        <motion.button
                                          onClick={() => {
                                            const reason = prompt('Red nedeni (opsiyonel):');
                                            if (reason !== null) {
                                              handleRejectStudentApplication(app.id, reason);
                                            }
                                          }}
                                          disabled={processingApplicationId === app.id}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                          <XCircle className="w-3 h-3" />
                                          Reddet
                                        </motion.button>
                                      </div>
                                    )}
                                  </td>
                                </motion.tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {studentApplicationsTotal > 20 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Sayfa {studentApplicationsPage} / {Math.ceil(studentApplicationsTotal / 20)} (Toplam {studentApplicationsTotal} başvuru)
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStudentApplicationsPage(prev => Math.max(1, prev - 1))}
                            disabled={studentApplicationsPage === 1}
                            className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Önceki
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStudentApplicationsPage(prev => prev + 1)}
                            disabled={studentApplicationsPage >= Math.ceil(studentApplicationsTotal / 20)}
                            className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sonraki
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </GlassCard>
          </AnimatedCard>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;

