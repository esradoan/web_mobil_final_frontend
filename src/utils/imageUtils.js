/**
 * Backend'den gelen relative image path'ini absolute URL'e çevirir
 * @param {string} path - Backend'den gelen resim path'i
 * @returns {string|null} - Tam URL veya null
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  
  // Eğer zaten tam URL ise, olduğu gibi döndür
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Eğer relative path ise, backend base URL'i ekle
  if (path.startsWith('/')) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5226/api/v1';
    const backendBaseUrl = apiBaseUrl.replace('/api/v1', '');
    return `${backendBaseUrl}${path}`;
  }
  
  return path;
};

/**
 * User objesinden profil resmi URL'ini alır (camelCase veya PascalCase destekler)
 * @param {object} user - Kullanıcı objesi
 * @returns {string|null} - Profil resmi tam URL'i veya null
 */
export const getUserProfilePicture = (user) => {
  if (!user) return null;
  
  const profilePicturePath = user.profilePictureUrl || 
                             user.ProfilePictureUrl || 
                             user.profilePicture ||
                             user.ProfilePicture;
  
  return getImageUrl(profilePicturePath);
};

