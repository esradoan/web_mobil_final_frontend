import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Search, 
  Filter,
  ChevronRight,
  Tag
} from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);

  const categories = [
    { value: 'all', label: 'Tümü', icon: '📅' },
    { value: 'conference', label: 'Konferans', icon: '🎤' },
    { value: 'workshop', label: 'Atölye', icon: '🔧' },
    { value: 'social', label: 'Sosyal', icon: '🎉' },
    { value: 'sports', label: 'Spor', icon: '⚽' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedCategory, selectedDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedDate) {
        params.date = selectedDate.toISOString().split('T')[0];
      }

      const response = await api.get('/events', { params });
      const data = response.data.data || [];
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Etkinlikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Date filter
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredEvents(filtered);
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'conference':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'workshop':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'social':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'sports':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBadge = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const deadline = new Date(event.registrationDeadline);

    if (event.status === 'cancelled') {
      return (
        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
          İptal Edildi
        </span>
      );
    }

    if (eventDate < now) {
      return (
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold">
          Geçmiş
        </span>
      );
    }

    if (deadline < now) {
      return (
        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-xs font-semibold">
          Kayıt Kapalı
        </span>
      );
    }

    if (event.remainingSpots <= 0) {
      return (
        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold">
          Dolu
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold">
        Açık
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Handle TimeSpan format (HH:mm:ss) or just time string
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

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
              <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Etkinlikler
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kampüsteki tüm etkinlikleri keşfedin ve kayıt olun
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Etkinlik ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      fetchEvents();
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      selectedCategory === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarih
              </label>
              <input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setSelectedDate(date);
                  if (date) {
                    fetchEvents();
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
              {selectedDate && (
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    fetchEvents();
                  }}
                  className="ml-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Etkinlik bulunamadı
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || selectedCategory !== 'all' || selectedDate
                  ? 'Arama kriterlerinize uygun etkinlik bulunamadı.'
                  : 'Henüz etkinlik eklenmemiş.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  {/* Event Image */}
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}

                  {/* Event Content */}
                  <div className="p-6">
                    {/* Category & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
                        {categories.find(c => c.value === event.category)?.label || event.category}
                      </span>
                      {getStatusBadge(event)}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.registeredCount}/{event.capacity} katılımcı
                          {event.remainingSpots > 0 && (
                            <span className="text-green-600 dark:text-green-400 ml-1">
                              ({event.remainingSpots} boş)
                            </span>
                          )}
                        </span>
                      </div>
                      {event.isPaid && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {event.price.toFixed(2)} ₺
                          </span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Detayları Gör
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Events;

