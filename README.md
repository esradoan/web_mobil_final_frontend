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

### Local Development

Proje root dizininde `.env.local` dosyası oluşturun:

```env
VITE_API_BASE_URL=http://localhost:5226/api/v1
```

**Not:** `.env.local` dosyası `.gitignore`'da olduğu için Git'e commit edilmez.

### Production (Railway)

Railway'de environment variable olarak ayarlayın:

1. Railway dashboard'a gidin
2. Projenizi seçin
3. **Variables** sekmesine gidin
4. Yeni variable ekleyin:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://your-backend.railway.app/api/v1`

Veya Railway CLI ile:
```bash
railway variables set VITE_API_BASE_URL=https://your-backend.railway.app/api/v1
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
- **Local:** `http://localhost:5226/api/v1` (Visual Studio default port)
- **Production:** Railway backend URL'i (environment variable'dan alınır)
- **Authentication:** JWT Bearer tokens
- **Auto token refresh:** Otomatik token yenileme
- **Timeout:** 30 saniye

## 📝 Sayfalar

- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası
- `/forgot-password` - Şifre sıfırlama
- `/reset-password` - Yeni şifre belirleme
- `/dashboard` - Ana dashboard
- `/profile` - Profil yönetimi

## 🧪 Testing

### Quick Test Run
```bash
npm test
```

### Test Coverage Report

To generate a comprehensive code coverage report:

```powershell
.\run-tests-frontend.ps1
```

This script will:
1. Install dependencies (if needed)
2. Run all tests with code coverage
3. Generate HTML coverage reports

**Report Locations**:
- `coverage/lcov-report/index.html` - LCOV HTML report
- `coverage/index.html` - Detailed coverage report

**Prerequisites**:
- Node.js and npm installed
- Dependencies installed (`npm install`)

**Coverage Exclusions**:
- `node_modules/`
- Test setup files (`src/test/`)
- Config files (`*.config.js`)
- Entry points (`main.jsx`, `App.jsx`)

**Available Test Commands**:
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests and generate coverage report

## 🚀 Deployment

Railway veya başka bir platforma deploy için:

```bash
npm run build
```

Build dosyaları `dist/` klasöründe oluşturulur.
