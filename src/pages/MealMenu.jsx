import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, UtensilsCrossed, Clock, MapPin, Leaf, DollarSign, ChefHat, X } from 'lucide-react';
import api from '../config/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MealMenu = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cafeterias, setCafeterias] = useState([]);
  const [selectedCafeteria, setSelectedCafeteria] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  // Fetch cafeterias
  useEffect(() => {
    fetchCafeterias();
  }, []);

  // Fetch menus when date or cafeteria changes
  useEffect(() => {
    if (selectedCafeteria !== null) {
      fetchMenus();
    }
  }, [selectedDate, selectedCafeteria]);

  const fetchCafeterias = async () => {
    try {
      const response = await api.get('/meals/cafeterias');
      const data = response.data.data || [];
      setCafeterias(data);
      if (data.length > 0) {
        setSelectedCafeteria(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching cafeterias:', error);
      toast.error('Yemekhaneler yüklenirken hata oluştu');
    }
  };

  const fetchMenus = async () => {
    if (selectedCafeteria === null) return;
    
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const params = { date: dateStr };
      if (selectedCafeteria) {
        params.cafeteriaId = selectedCafeteria;
      }
      
      console.log('Fetching menus with params:', params);
      const response = await api.get('/meals/menus', { params });
      const menusData = response.data.data || [];
      console.log('Menus received:', menusData);
      setMenus(menusData);
      
      if (menusData.length === 0) {
        // toast.info doesn't exist in react-hot-toast, use toast() instead
        toast('Seçilen tarih için menü bulunamadı', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      const errorMessage = error.response?.data?.message || 'Menüler yüklenirken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (menu) => {
    setSelectedMenu(menu);
    setShowReservationModal(true);
  };

  const confirmReservation = async () => {
    if (!selectedMenu) return;

    setReserving(selectedMenu.id);
    try {
      await api.post('/meals/reservations', {
        menuId: selectedMenu.id
      });
      
      toast.success('Rezervasyon başarıyla oluşturuldu!');
      setShowReservationModal(false);
      setSelectedMenu(null);
      fetchMenus(); // Refresh menus
    } catch (error) {
      console.error('Error creating reservation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Rezervasyon oluşturulurken hata oluştu';
      toast.error(errorMessage);
      
      // Eğer bakiye yetersizse, wallet sayfasına yönlendirme önerisi göster
      if (errorMessage.toLowerCase().includes('insufficient balance') || errorMessage.toLowerCase().includes('bakiye')) {
        setTimeout(() => {
          if (window.confirm('Bakiye yetersiz. Cüzdan sayfasına gitmek ister misiniz?')) {
            window.location.href = '/wallet';
          }
        }, 1000);
      }
    } finally {
      setReserving(null);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Group menus by meal type
  const lunchMenus = menus.filter(m => {
    const mealType = m.mealType || m.MealType || '';
    return mealType.toLowerCase() === 'lunch';
  });
  const dinnerMenus = menus.filter(m => {
    const mealType = m.mealType || m.MealType || '';
    return mealType.toLowerCase() === 'dinner';
  });

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
              <UtensilsCrossed className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Yemek Menüleri
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Günlük menüleri görüntüleyin ve rezervasyon yapın
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tarih Seçin
                </label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(selectedDate)}
                </p>
              </div>

              {/* Cafeteria Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Yemekhane Seçin
                </label>
                <select
                  value={selectedCafeteria || ''}
                  onChange={(e) => setSelectedCafeteria(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Tüm Yemekhaneler</option>
                  {cafeterias.map((cafeteria) => (
                    <option key={cafeteria.id} value={cafeteria.id}>
                      {cafeteria.name} - {cafeteria.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Menus */}
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
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Lütfen farklı bir tarih veya yemekhane seçin
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Lunch Menus */}
              {lunchMenus.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-3xl">🍽️</span>
                    Öğle Yemeği
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lunchMenus.map((menu) => (
                      <MenuCard
                        key={menu.id}
                        menu={menu}
                        onReserve={handleReserve}
                        isReserving={reserving === menu.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Dinner Menus */}
              {dinnerMenus.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-3xl">🌙</span>
                    Akşam Yemeği
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dinnerMenus.map((menu) => (
                      <MenuCard
                        key={menu.id}
                        menu={menu}
                        onReserve={handleReserve}
                        isReserving={reserving === menu.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Reservation Modal */}
          {showReservationModal && selectedMenu && (
            <ReservationModal
              menu={selectedMenu}
              onClose={() => {
                setShowReservationModal(false);
                setSelectedMenu(null);
              }}
              onConfirm={confirmReservation}
              isReserving={reserving === selectedMenu.id}
            />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

const MenuCard = ({ menu, onReserve, isReserving }) => {
  const mealType = menu.mealType || menu.MealType || 'lunch';
  const hasVegetarian = menu.hasVegetarianOption || menu.HasVegetarianOption || false;
  const nutrition = menu.nutrition || menu.Nutrition;
  const items = menu.items || menu.Items || [];
  const price = menu.price || menu.Price || 0;
  const isPublished = menu.isPublished !== undefined ? menu.isPublished : (menu.IsPublished !== undefined ? menu.IsPublished : true);
  const cafeteriaName = menu.cafeteriaName || menu.CafeteriaName || 'Yemekhane';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">{cafeteriaName}</h3>
          {hasVegetarian && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Vejetaryen
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span>{mealType.toLowerCase() === 'lunch' ? 'Öğle' : 'Akşam'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Menu Items */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Menü İçeriği:
          </h4>
          <ul className="space-y-1">
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-400 dark:text-gray-500 italic">Menü bilgisi yok</li>
            )}
          </ul>
        </div>

        {/* Nutrition Info */}
        {nutrition && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 mb-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Beslenme Bilgileri:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Kalori:</span>
                <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                  {nutrition.calories || nutrition.Calories || 0} kcal
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                  {nutrition.protein || nutrition.Protein || 0}g
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Karbonhidrat:</span>
                <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                  {nutrition.carbs || nutrition.Carbs || 0}g
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Yağ:</span>
                <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                  {nutrition.fat || nutrition.Fat || 0}g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <DollarSign className="w-5 h-5" />
            <span className="text-lg font-bold">
              {price > 0 ? `${parseFloat(price).toFixed(2)} ₺` : 'Ücretsiz'}
            </span>
          </div>
        </div>

        {/* Reserve Button */}
        <button
          onClick={() => onReserve(menu)}
          disabled={isReserving || !isPublished}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
            !isPublished
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : isReserving
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {isReserving ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Rezerve Ediliyor...
            </span>
          ) : !isPublished ? (
            'Yayında Değil'
          ) : (
            'Rezerve Et'
          )}
        </button>
      </div>
    </motion.div>
  );
};

const ReservationModal = ({ menu, onClose, onConfirm, isReserving }) => {
  const mealType = menu.mealType || menu.MealType || 'lunch';
  const items = menu.items || menu.Items || [];
  const nutrition = menu.nutrition || menu.Nutrition;
  const price = menu.price || menu.Price || 0;
  const cafeteriaName = menu.cafeteriaName || menu.CafeteriaName || 'Yemekhane';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rezervasyon Onayı
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Yemekhane:</p>
            <p className="font-semibold text-gray-900 dark:text-white">{cafeteriaName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Öğün:</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {mealType.toLowerCase() === 'lunch' ? 'Öğle Yemeği' : 'Akşam Yemeği'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fiyat:</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {price > 0 ? `${parseFloat(price).toFixed(2)} ₺` : 'Ücretsiz (Burslu)'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Menü:</p>
            <ul className="list-disc list-inside space-y-1">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-400 dark:text-gray-500 italic">Menü bilgisi yok</li>
              )}
            </ul>
          </div>

          {nutrition && (
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Beslenme Bilgileri:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Kalori:</span>
                  <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                    {nutrition.calories || nutrition.Calories || 0} kcal
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                  <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                    {nutrition.protein || nutrition.Protein || 0}g
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Karbonhidrat:</span>
                  <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                    {nutrition.carbs || nutrition.Carbs || 0}g
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Yağ:</span>
                  <span className="font-semibold ml-1 text-gray-900 dark:text-white">
                    {nutrition.fat || nutrition.Fat || 0}g
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isReserving}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={isReserving}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isReserving ? 'Rezerve Ediliyor...' : 'Onayla'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MealMenu;
