# Smart Campus - Frontend

Modern, animasyonlu ve profesyonel React frontend uygulaması.

## 🚀 Teknolojiler

- **React 19+** - Modern React hooks
- **Vite** - Hızlı build tool
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animasyon kütüphanesi
- **React Hook Form** - Form yönetimi
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🔧 Yapılandırma

`.env` dosyası oluşturun:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 📁 Proje Yapısı

```
src/
├── components/      # Reusable components
├── contexts/        # React contexts (Auth, etc.)
├── pages/           # Page components
├── config/          # Configuration files
└── App.jsx          # Main app component
```

## 🎨 Özellikler

- ✅ Modern ve responsive tasarım
- ✅ Smooth animasyonlar (Framer Motion)
- ✅ Dark mode desteği
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Toast notifications

## 🔗 Backend Entegrasyonu

Frontend, .NET backend API'sine bağlanır:
- Base URL: `http://localhost:5000/api/v1`
- Authentication: JWT Bearer tokens
- Auto token refresh

## 📝 Sayfalar

- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası
- `/forgot-password` - Şifre sıfırlama
- `/reset-password` - Yeni şifre belirleme
- `/dashboard` - Ana dashboard
- `/profile` - Profil yönetimi

## 🚀 Deployment

Railway veya başka bir platforma deploy için:

```bash
npm run build
```

Build dosyaları `dist/` klasöründe oluşturulur.
