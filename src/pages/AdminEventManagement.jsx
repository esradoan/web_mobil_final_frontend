import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  DollarSign,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminEventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'social',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    capacity: 50,
    registrationDeadline: new Date().toISOString().split('T')[0],
    isPaid: false,
    price: 0,
    imageUrl: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events');
      const data = response.data.data || [];
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Etkinlikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Lütfen etkinlik başlığı girin');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Lütfen etkinlik açıklaması girin');
      return;
    }
    if (!formData.location.trim()) {
      toast.error('Lütfen etkinlik konumu girin');
      return;
    }
    if (formData.capacity < 1) {
      toast.error('Kapasite en az 1 olmalıdır');
      return;
    }
    if (formData.isPaid && formData.price <= 0) {
      toast.error('Ücretli etkinlik için fiyat girmelisiniz');
      return;
    }

    try {
      // Convert time strings to TimeSpan format (HH:mm:ss)
      const formatTimeForBackend = (timeString) => {
        if (!timeString) return '00:00:00';
        // If already in HH:mm:ss format, return as is
        if (timeString.split(':').length === 3) return timeString;
        // If in HH:mm format, add :00 for seconds
        return `${timeString}:00`;
      };

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
        startTime: formatTimeForBackend(formData.startTime),
        endTime: formatTimeForBackend(formData.endTime),
        location: formData.location.trim(),
        capacity: parseInt(formData.capacity),
        registrationDeadline: formData.registrationDeadline,
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseFloat(formData.price) : 0,
        imageUrl: formData.imageUrl.trim() || null
      };

      if (editingEvent) {
        // Update
        await api.put(`/events/${editingEvent.id}`, payload);
        toast.success('Etkinlik başarıyla güncellendi');
      } else {
        // Create
        await api.post('/events', payload);
        toast.success('Etkinlik başarıyla oluşturuldu');
      }

      setShowModal(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      console.error('Error response:', error.response?.data);
      console.error('Payload sent:', payload);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Etkinlik kaydedilirken hata oluştu';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    
    // Format date
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Format time (handle TimeSpan format HH:mm:ss or just HH:mm)
    const formatTime = (timeString) => {
      if (!timeString) return '09:00';
      const parts = timeString.split(':');
      return `${parts[0]}:${parts[1]}`;
    };

    setFormData({
      title: event.title || event.Title || '',
      description: event.description || event.Description || '',
      category: event.category || event.Category || 'social',
      date: eventDate,
      startTime: formatTime(event.startTime || event.StartTime),
      endTime: formatTime(event.endTime || event.EndTime),
      location: event.location || event.Location || '',
      capacity: event.capacity || event.Capacity || 50,
      registrationDeadline: deadline,
      isPaid: event.isPaid !== undefined ? event.isPaid : (event.IsPaid !== undefined ? event.IsPaid : false),
      price: event.price || event.Price || 0,
      imageUrl: event.imageUrl || event.ImageUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);
      toast.success('Etkinlik başarıyla silindi');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      const errorMessage = error.response?.data?.message || 'Etkinlik silinirken hata oluştu';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'social',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      location: '',
      capacity: 50,
      registrationDeadline: new Date().toISOString().split('T')[0],
      isPaid: false,
      price: 0,
      imageUrl: ''
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingEvent(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    resetForm();
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

  const getCategoryLabel = (category) => {
    switch (category?.toLowerCase()) {
      case 'conference':
        return 'Konferans';
      case 'workshop':
        return 'Atölye';
      case 'social':
        return 'Sosyal';
      case 'sports':
        return 'Spor';
      default:
        return category || 'Diğer';
    }
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <Calendar className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
                  Etkinlik Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Etkinlikleri oluşturun, düzenleyin ve yönetin
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="w-5 h-5" />
                Yeni Etkinlik Oluştur
              </button>
            </div>
          </div>

          {/* Events List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Henüz etkinlik eklenmemiş
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700"
                >
                  {/* Event Image */}
                  {event.imageUrl || event.ImageUrl ? (
                    <img
                      src={event.imageUrl || event.ImageUrl}
                      alt={event.title || event.Title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}

                  {/* Event Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category || event.Category)}`}>
                        {getCategoryLabel(event.category || event.Category)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (event.status || event.Status) === 'published' || !event.status
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {(event.status || event.Status) === 'published' || !event.status ? 'Yayında' : 'Taslak'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {event.title || event.Title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description || event.Description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.date || event.Date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {(event.startTime || event.StartTime || '').split(':').slice(0, 2).join(':')} - {(event.endTime || event.EndTime || '').split(':').slice(0, 2).join(':')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location || event.Location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.registeredCount || event.RegisteredCount || 0}/{event.capacity || event.Capacity || 0} katılımcı
                        </span>
                      </div>
                      {(event.isPaid || event.IsPaid) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {(event.price || event.Price || 0).toFixed(2)} ₺
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Create/Edit Modal */}
          {showModal && (
            <EventModal
              formData={formData}
              setFormData={setFormData}
              editingEvent={editingEvent}
              onClose={closeModal}
              onSubmit={handleSubmit}
            />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

const EventModal = ({
  formData,
  setFormData,
  editingEvent,
  onClose,
  onSubmit
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200 dark:border-slate-700 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etkinlik Başlığı *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Örn: Kariyer Günleri 2025"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Açıklama *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Etkinlik detaylarını açıklayın..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>

          {/* Category and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="social">Sosyal</option>
                <option value="conference">Konferans</option>
                <option value="workshop">Atölye</option>
                <option value="sports">Spor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Konum *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Örn: Kongre Merkezi"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarih *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kayıt Son Tarihi *
              </label>
              <input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başlangıç Saati *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bitiş Saati *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kapasite *
            </label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>

          {/* Payment */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ücretli Etkinlik
              </span>
            </label>
            {formData.isPaid && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  required={formData.isPaid}
                />
              </div>
            )}
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Görsel URL (Opsiyonel)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Save className="w-4 h-4" />
              {editingEvent ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminEventManagement;

