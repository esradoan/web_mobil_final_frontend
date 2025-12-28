import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign,
  Leaf,
  Save,
  X,
  ChefHat
} from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminMealMenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [cafeterias, setCafeterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    cafeteriaId: '',
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    items: [''],
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    hasVegetarianOption: false,
    price: 0,
    isPublished: true
  });

  useEffect(() => {
    fetchCafeterias();
    fetchMenus();
  }, [selectedDate]);

  const fetchCafeterias = async () => {
    try {
      const response = await api.get('/meals/cafeterias');
      const data = response.data.data || [];
      setCafeterias(data);
      if (data.length > 0 && !formData.cafeteriaId) {
        setFormData(prev => ({ ...prev, cafeteriaId: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching cafeterias:', error);
      toast.error('Yemekhaneler yüklenirken hata oluştu');
    }
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      const response = await api.get('/meals/menus', { params });
      const data = response.data.data || [];
      setMenus(data);
    } catch (error) {
      console.error('Error fetching menus:', error);
      toast.error('Menüler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, '']
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.cafeteriaId) {
      toast.error('Lütfen bir yemekhane seçin');
      return;
    }
    if (!formData.date) {
      toast.error('Lütfen bir tarih seçin');
      return;
    }
    if (formData.items.filter(i => i.trim()).length === 0) {
      toast.error('Lütfen en az bir menü öğesi ekleyin');
      return;
    }

    try {
      const payload = {
        cafeteriaId: parseInt(formData.cafeteriaId),
        date: formData.date,
        mealType: formData.mealType,
        items: formData.items.filter(i => i.trim()),
        nutrition: formData.nutrition,
        hasVegetarianOption: formData.hasVegetarianOption,
        price: parseFloat(formData.price),
        isPublished: formData.isPublished
      };

      if (editingMenu) {
        // Update
        await api.put(`/meals/menus/${editingMenu.id}`, payload);
        toast.success('Menü başarıyla güncellendi');
      } else {
        // Create
        await api.post('/meals/menus', payload);
        toast.success('Menü başarıyla oluşturuldu');
      }

      setShowModal(false);
      setEditingMenu(null);
      resetForm();
      fetchMenus();
    } catch (error) {
      console.error('Error saving menu:', error);
      const errorMessage = error.response?.data?.message || 'Menü kaydedilirken hata oluştu';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      cafeteriaId: menu.cafeteriaId || menu.CafeteriaId || '',
      date: menu.date ? new Date(menu.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      mealType: menu.mealType || menu.MealType || 'lunch',
      items: menu.items || menu.Items || [''],
      nutrition: menu.nutrition || menu.Nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      hasVegetarianOption: menu.hasVegetarianOption || menu.HasVegetarianOption || false,
      price: menu.price || menu.Price || 0,
      isPublished: menu.isPublished !== undefined ? menu.isPublished : (menu.IsPublished !== undefined ? menu.IsPublished : true)
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu menüyü silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/meals/menus/${id}`);
      toast.success('Menü başarıyla silindi');
      fetchMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      const errorMessage = error.response?.data?.message || 'Menü silinirken hata oluştu';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      cafeteriaId: cafeterias.length > 0 ? cafeterias[0].id : '',
      date: new Date().toISOString().split('T')[0],
      mealType: 'lunch',
      items: [''],
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      hasVegetarianOption: false,
      price: 0,
      isPublished: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingMenu(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMenu(null);
    resetForm();
  };

  const getCafeteriaName = (cafeteriaId) => {
    const cafeteria = cafeterias.find(c => c.id === cafeteriaId);
    return cafeteria ? `${cafeteria.name} - ${cafeteria.location}` : 'Bilinmeyen';
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
                  <ChefHat className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
                  Yemek Menüsü Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Yemek menülerini oluşturun, düzenleyin ve yönetin
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="w-5 h-5" />
                Yeni Menü Oluştur
              </button>
            </div>
          </div>

          {/* Date Filter */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tarih Seçin
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Menus List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : menus.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <UtensilsCrossed className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Seçilen tarih için menü bulunamadı
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menus.map((menu) => (
                <motion.div
                  key={menu.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">
                        {getCafeteriaName(menu.cafeteriaId || menu.CafeteriaId)}
                      </h3>
                      {menu.hasVegetarianOption || menu.HasVegetarianOption ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          Vejetaryen
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm">
                      {(menu.mealType || menu.MealType || 'lunch').toLowerCase() === 'lunch' ? 'Öğle' : 'Akşam'} Yemeği
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Menü İçeriği:
                      </h4>
                      <ul className="space-y-1">
                        {(menu.items || menu.Items || []).slice(0, 3).map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {item}
                          </li>
                        ))}
                        {(menu.items || menu.Items || []).length > 3 && (
                          <li className="text-sm text-gray-500 dark:text-gray-500">
                            +{(menu.items || menu.Items || []).length - 3} daha...
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-lg font-bold">
                          {(menu.price || menu.Price || 0).toFixed(2)} ₺
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (menu.isPublished !== undefined ? menu.isPublished : (menu.IsPublished !== undefined ? menu.IsPublished : true))
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {(menu.isPublished !== undefined ? menu.isPublished : (menu.IsPublished !== undefined ? menu.IsPublished : true)) ? 'Yayında' : 'Taslak'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(menu)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(menu.id)}
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
            <MenuModal
              formData={formData}
              setFormData={setFormData}
              cafeterias={cafeterias}
              editingMenu={editingMenu}
              onClose={closeModal}
              onSubmit={handleSubmit}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onItemChange={handleItemChange}
            />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

const MenuModal = ({
  formData,
  setFormData,
  cafeterias,
  editingMenu,
  onClose,
  onSubmit,
  onAddItem,
  onRemoveItem,
  onItemChange
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
            {editingMenu ? 'Menü Düzenle' : 'Yeni Menü Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Cafeteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yemekhane *
            </label>
            <select
              value={formData.cafeteriaId}
              onChange={(e) => setFormData(prev => ({ ...prev, cafeteriaId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="">Yemekhane Seçin</option>
              {cafeterias.map((cafeteria) => (
                <option key={cafeteria.id} value={cafeteria.id}>
                  {cafeteria.name} - {cafeteria.location}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Meal Type */}
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
                Öğün Tipi *
              </label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData(prev => ({ ...prev, mealType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="lunch">Öğle Yemeği</option>
                <option value="dinner">Akşam Yemeği</option>
              </select>
            </div>
          </div>

          {/* Menu Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Menü Öğeleri *
            </label>
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => onItemChange(index, e.target.value)}
                  placeholder="Menü öğesi (örn: Mercimek Çorbası)"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={onAddItem}
              className="mt-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              + Öğe Ekle
            </button>
          </div>

          {/* Nutrition Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Beslenme Bilgileri
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Kalori (kcal)</label>
                <input
                  type="number"
                  value={formData.nutrition.calories}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, calories: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={formData.nutrition.protein}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, protein: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Karbonhidrat (g)</label>
                <input
                  type="number"
                  value={formData.nutrition.carbs}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, carbs: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Yağ (g)</label>
                <input
                  type="number"
                  value={formData.nutrition.fat}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, fat: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Price and Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
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
                required
              />
            </div>
            <div className="flex items-center gap-4 pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasVegetarianOption}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasVegetarianOption: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Leaf className="w-4 h-4" />
                  Vejetaryen Seçeneği
                </span>
              </label>
            </div>
          </div>

          {/* Published */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Yayınla (Öğrenciler görebilir)
              </span>
            </label>
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
              {editingMenu ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminMealMenuManagement;

