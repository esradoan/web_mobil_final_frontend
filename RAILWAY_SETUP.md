# Railway Deployment Setup - Frontend

## 🚀 Railway'de Frontend Deploy Etme

### 1. Environment Variables Ayarlama

Railway Dashboard → Frontend Projeniz → **Variables** sekmesine gidin.

**Gerekli Variable:**

```
Name:  VITE_API_BASE_URL
Value: https://your-backend.railway.app/api/v1
```

**Örnek:**
```
Name:  VITE_API_BASE_URL
Value: https://smartcampus-backend-production.up.railway.app/api/v1
```

### 2. Build Settings

Railway otomatik olarak algılar, ancak manuel ayar için:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm run preview
```

Veya static file serving için:
```bash
npx serve -s dist -l $PORT
```

### 3. Local Development

**`.env.local` dosyası oluşturun:**

Frontend klasöründe `.env.local` dosyası oluşturun:

```env
VITE_API_BASE_URL=http://localhost:5226/api/v1
```

**Not:** Bu dosya Git'e commit edilmez (`.gitignore`'da).

### 4. Test

**Local:**
```bash
npm run dev
# http://localhost:5173
```

**Production:**
Railway otomatik olarak deploy eder ve URL sağlar.

## 🔍 Troubleshooting

### Environment Variable Okunmuyor

- Railway'de variable'ın doğru adla (`VITE_API_BASE_URL`) ayarlandığını kontrol edin
- Build loglarını kontrol edin
- Frontend'i yeniden deploy edin

### Backend Bağlantı Hatası

- Backend URL'inin doğru olduğunu kontrol edin
- HTTPS kullandığınızdan emin olun (Railway production)
- CORS ayarlarını kontrol edin (backend'de)

