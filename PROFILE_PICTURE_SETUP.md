# Profil Resmi Yükleme - Backend Kurulum Rehberi

## 🔴 Sorun

Frontend profil resimlerini başarıyla yüklüyor ancak backend `/uploads` klasörünü static olarak serve etmediği için resimler görüntülenemiyor.

**Hata:**
```
GET http://localhost:5226/uploads/ae0d1963-7914-4d6c-b75f-66349396c8d4_ESRAGÖRSEL.jpg
404 (Not Found)
```

## ✅ Çözüm: Backend Static Files Middleware

### Adım 1: Program.cs'e Static Files Ekleyin

**C# .NET 6+ (Program.cs):**

```csharp
var builder = WebApplication.CreateBuilder(args);

// ... diğer servisler ...

var app = builder.Build();

// CORS'u static files'dan önce ekleyin
app.UseCors("AllowAll"); // veya kendi CORS policy'niz

// ⭐ STATIC FILES MIDDLEWARE - ÖNEMLİ!
app.UseStaticFiles(); // wwwroot klasörü için

// Uploads klasörünü serve edin
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        // Cache control
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=600");
    }
});

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

### Adım 2: Uploads Klasörünü Oluşturun

Proje root dizininde `uploads` klasörü oluşturun:

```
YourBackendProject/
├── uploads/           <- BU KLASÖR OLMALI
├── Controllers/
├── Models/
├── Program.cs
└── ...
```

### Adım 3: Upload Controller'ı Kontrol Edin

```csharp
[HttpPost("me/profile-picture")]
[Authorize]
public async Task<IActionResult> UploadProfilePicture(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("No file uploaded");

    // Dosya uzantısı kontrolü
    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    
    if (!allowedExtensions.Contains(extension))
        return BadRequest("Invalid file type");

    // Benzersiz dosya adı
    var fileName = $"{Guid.NewGuid()}_{file.FileName}";
    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
    
    // Klasör yoksa oluştur
    if (!Directory.Exists(uploadsFolder))
        Directory.CreateDirectory(uploadsFolder);

    var filePath = Path.Combine(uploadsFolder, fileName);

    // Dosyayı kaydet
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    // Kullanıcının profil resmi path'ini güncelle
    var userId = GetCurrentUserId(); // JWT'den user ID al
    var user = await _userRepository.GetByIdAsync(userId);
    user.ProfilePictureUrl = $"/uploads/{fileName}"; // RELATIVE PATH
    await _userRepository.UpdateAsync(user);

    return Ok(new { 
        message = "Profile picture uploaded successfully",
        url = $"/uploads/{fileName}" 
    });
}
```

### Adım 4: CORS Ayarları (Önemli!)

`Program.cs` içinde CORS'u doğru ayarlayın:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5226")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

## 🧪 Test Etme

1. Backend'i yeniden başlatın
2. Profil sayfasından bir resim yükleyin
3. Tarayıcıda manuel olarak şu URL'e gidin:
   ```
   http://localhost:5226/uploads/[dosya-adı].jpg
   ```
4. Resim görünüyorsa ✅ başarılı!

## 📁 Alternatif: Azure/AWS Storage Kullanımı

Production ortamında dosyaları Azure Blob Storage veya AWS S3'te saklayın:

```csharp
// Azure Blob Storage örneği
var blobClient = new BlobClient(connectionString, containerName, fileName);
await blobClient.UploadAsync(file.OpenReadStream());
var imageUrl = blobClient.Uri.ToString();

user.ProfilePictureUrl = imageUrl; // TAM URL
```

## 🔒 Güvenlik Önerileri

1. **Dosya boyutu sınırı:** Max 5MB
2. **Dosya tipi kontrolü:** Sadece image/* dosyalarına izin verin
3. **Dosya adı sanitization:** XSS saldırılarına karşı dosya adlarını temizleyin
4. **Virus scan:** Production'da dosyaları scan edin
5. **Rate limiting:** Upload endpoint'ine rate limit ekleyin

## 🚀 Production Deployment

- Static files'ı CDN üzerinden serve edin
- nginx/IIS static file serving kullanın
- Cloud storage tercih edin (Azure Blob, AWS S3)

## ❓ Sorun mu var?

Console'da şu komutu çalıştırarak backend'in static files'ı serve edip etmediğini kontrol edin:

```bash
curl http://localhost:5226/uploads/test.jpg
```

- **200 OK** → ✅ Çalışıyor
- **404 Not Found** → ❌ Static files middleware eksik
- **403 Forbidden** → ❌ Dosya izinleri sorunu

