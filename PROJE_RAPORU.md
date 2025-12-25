# 📚 Kütüphane Yönetim Sistemi - Proje Raporu

> **Hazırlayan:** Mehmet Eren BAYRAKTAR 
> **Tarih:** Aralık 2025  
> **Versiyon:** 1.0

Bu rapor, Kütüphane Yönetim Sistemi projesinin teknik dokümantasyonunu içermektedir. Hem proje savunması için referans hem de benzer bir proje geliştirmek isteyenler için yol gösterici olarak hazırlanmıştır.

---

## 📋 İçindekiler
1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Backend Yapısı (KutuphaneApi)](#backend-yapısı)
4. [Veritabanı Şeması](#veritabanı-şeması)
5. [Kimlik Doğrulama Sistemi (JWT)](#kimlik-doğrulama-sistemi)
6. [Şifre Güvenliği (BCrypt)](#şifre-güvenliği)
7. [Rate Limiting (Brute Force Koruması)](#rate-limiting)
8. [API Endpoints](#api-endpoints)
9. [Frontend Yapısı](#frontend-yapısı)
10. [Özellikler ve Fonksiyonlar](#özellikler-ve-fonksiyonlar)
11. [Kurulum Rehberi](#kurulum-rehberi)
12. [Sık Karşılaşılan Sorunlar](#sık-karşılaşılan-sorunlar)

---

## 🔍 Proje Genel Bakış

### Projenin Amacı

Bu proje, bir üniversite için geliştirilmiş **tam özellikli bir yönetim sistemi**dir. Sistemin temel amacı:

- **Öğrenciler için:** Kitap arama, ödünç alma, rezervasyon yapma, ceza takibi
- **Yöneticiler için:** Kitap/üye yönetimi, işlem takibi, raporlama

### Neden Bu Teknolojiler?

| Seçim | Neden? |
|-------|--------|
| **.NET 8** | Modern, güvenli, yüksek performanslı backend framework |
| **MySQL** | Açık kaynak, yaygın kullanım, güçlü ilişkisel veritabanı |
| **JWT** | Stateless authentication, ölçeklenebilir, güvenli |
| **BCrypt** | Endüstri standardı şifre hashleme, brute-force'a dayanıklı |
| **Vanilla JS** | Framework bağımlılığı yok, hızlı, öğrenmesi kolay |

### Proje Bileşenleri

Proje 3 ana bileşenden oluşur:

```
kutuphane_projesi/
├── KutuphaneApi/          # Backend API (.NET 8)
│   └── ktphnAPI/          # Ana proje klasörü
│       ├── Controllers/   # HTTP endpoint'leri
│       ├── Models/        # Veritabanı modelleri
│       ├── Services/      # İş mantığı
│       └── Data/          # Veritabanı bağlantısı
│
├── admin/                 # Admin Panel (HTML/JS)
│   └── *-backend.js       # Her sayfa için ayrı JS dosyası
│
├── user/                  # Kullanıcı Panel (HTML/JS)
│   └── *-backend.js       # Her sayfa için ayrı JS dosyası
│
├── scripts/               # Ortak JavaScript (login/register)
├── styles/                # CSS dosyaları
└── sql/                   # Veritabanı script'leri ve trigger'lar
```

### Sistem Akışı

```
[Kullanıcı] → [Frontend (HTML/JS)] → [Backend API (.NET 8)] → [MySQL Veritabanı]
                                           ↓
                                    [JWT Token Doğrulama]
                                           ↓
                                    [İş Mantığı İşleme]
                                           ↓
                                    [Response Dönüşü]
```

---

## 🛠 Teknoloji Stack

### Backend Teknolojileri

| Teknoloji | Versiyon | Ne İçin Kullanılıyor? |
|-----------|----------|----------------------|
| **.NET** | 8.0 | Ana framework - Microsoft'un modern, cross-platform çatısı |
| **ASP.NET Core** | 8.0 | RESTful API oluşturmak için web framework |
| **Entity Framework Core** | - | ORM - SQL yazmadan veritabanı işlemleri |
| **Pomelo.MySql** | 9.0.0 | MySQL veritabanı bağlantısı için provider |
| **JWT Bearer** | 8.0.21 | Token tabanlı kimlik doğrulama |
| **BCrypt.Net-Next** | 4.0.3 | Şifreleri güvenli şekilde hash'leme |
| **Swashbuckle** | 6.6.2 | Swagger UI ile API dokümantasyonu |

**Neden .NET 8?**
- Cross-platform (Linux, Windows, macOS)
- Yüksek performans
- Güçlü tip güvenliği (C#)
- Zengin ekosistem ve NuGet paketleri
- Uzun vadeli destek (LTS)

### Frontend Teknolojileri

| Teknoloji | Ne İçin Kullanılıyor? |
|-----------|----------------------|
| **HTML5** | Sayfa yapısı ve semantik işaretleme |
| **CSS3** | Stil ve görsel tasarım |
| **Vanilla JavaScript** | Dinamik işlemler - framework kullanmadan saf JS |

**Neden Vanilla JavaScript?**
- Framework öğrenme eğrisi yok
- Daha az bağımlılık
- Daha hızlı yükleme
- Temel kavramları anlamak için ideal

### Veritabanı

| Teknoloji | Ne İçin Kullanılıyor? |
|-----------|----------------------|
| **MySQL 8.x** | Ana veritabanı - ilişkisel veri depolama |
| **Triggers** | Otomatik iş kuralları (ceza hesaplama, durum güncelleme) |
| **Foreign Keys** | Veri bütünlüğü ve ilişki tanımlama |

---

## ⚙️ Backend Yapısı (KutuphaneApi)

### Mimari Yaklaşım

Proje, **katmanlı mimari** (Layered Architecture) kullanmaktadır:

```
┌─────────────────────────────────────────────┐
│              Controllers                     │  ← HTTP isteklerini karşılar
├─────────────────────────────────────────────┤
│              Services                        │  ← İş mantığını işler
├─────────────────────────────────────────────┤
│              Data (DbContext)                │  ← Veritabanı erişimi
├─────────────────────────────────────────────┤
│              Models                          │  ← Veri modelleri
└─────────────────────────────────────────────┘
```

**Bu yapının avantajları:**
- Her katman kendi sorumluluğuna sahip (Single Responsibility)
- Test edilebilirlik artar
- Bakım kolaylaşır
- Değişiklikler izole kalır

### Proje Klasör Yapısı

```
KutuphaneApi/ktphnAPI/
├── Controllers/           # API Controller'ları (HTTP endpoint'leri)
│   ├── AuthController.cs        # Giriş, kayıt, şifre işlemleri
│   ├── KitaplarController.cs    # Kitap CRUD işlemleri
│   ├── UyelerController.cs      # Üye yönetimi (Admin)
│   ├── İslemlerController.cs    # Ödünç alma/iade
│   ├── RezervasyonlarController.cs  # Rezervasyon işlemleri
│   ├── CezalarController.cs     # Ceza yönetimi
│   └── ProfilController.cs      # Kullanıcı profil işlemleri
│
├── Models/                # Entity ve DTO'lar
│   ├── Kitap.cs                 # Kitap entity
│   ├── Uye.cs                   # Üye entity
│   ├── İslemler.cs              # Ödünç/iade işlemleri
│   ├── Rezervasyon.cs           # Rezervasyon entity
│   ├── LoginDto.cs              # Giriş verisi
│   └── ...                      # Diğer model ve DTO'lar
│
├── Data/                  # Veritabanı Bağlantısı
│   └── AppDbContext.cs          # Entity Framework DbContext
│
├── Services/              # İş Mantığı Servisleri
│   ├── EmailService.cs          # E-posta gönderimi
│   └── CezaHesaplaPeakService.cs # Arka plan ceza hesaplama
│
└── Utilities/             # Yardımcı Araçlar
    └── PasswordHasher.cs        # Mevcut şifreleri hash'leme
```

### Controller Nedir? Ne İş Yapar?

Controller, HTTP isteklerini karşılayan ve uygun yanıtı dönen sınıftır. Her controller belirli bir kaynağı (kitaplar, üyeler vb.) yönetir.

**Örnek:** Bir kullanıcı `/api/kitaplar` adresine GET isteği gönderdiğinde, `KitaplarController` devreye girer ve veritabanından kitapları çekerek JSON olarak döner.

### Program.cs - Uygulamanın Kalbi

`Program.cs` dosyası, uygulamanın başlangıç noktasıdır. Burada tüm servisler yapılandırılır:

```csharp
// 1. Veritabanı bağlantısı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* JWT ayarları */ });

// 3. CORS (Cross-Origin Resource Sharing)
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAll", policy => 
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// 4. Rate Limiting (Brute Force koruması)
builder.Services.AddRateLimiter(options => { /* Limit ayarları */ });
```

### Rate Limiting - Brute Force Koruması

Sistemi kötü niyetli isteklerden korumak için istek limitleri uygulanmıştır:

| Limit Türü | İstek Sayısı | Süre | Amaç |
|------------|--------------|------|------|
| **Global** | 100 istek | 1 dakika | Genel koruma |
| **Login** | 5 istek | 1 dakika | Şifre deneme engeli |
| **Register** | 3 istek | 10 dakika | Spam hesap engeli |

```csharp
// Rate Limiting yapılandırması
builder.Services.AddRateLimiter(options =>
{
    // Global limit: Tüm endpoint'ler için
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Login için özel limit: Brute force saldırılarını engeller
    options.AddPolicy<string>("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});
```

**Nasıl çalışır?**
1. Her istek, istemcinin IP adresine göre takip edilir
2. Belirlenen süre içinde izin verilen sayıdan fazla istek gelirse, 429 (Too Many Requests) hatası döner
3. Süre dolunca limit sıfırlanır

### AppDbContext - Veritabanı Bağlantısı

Entity Framework Core, veritabanı işlemlerini nesne yönelimli şekilde yapmamızı sağlar. `AppDbContext` sınıfı, veritabanı tablolarını temsil eden `DbSet`'leri içerir:

```csharp
public class AppDbContext : DbContext
{
    // Her DbSet, veritabanındaki bir tabloya karşılık gelir
    public DbSet<Kitap> Kitaplar { get; set; }        // kitaplar tablosu
    public DbSet<Uye> Uyeler { get; set; }            // uyeler tablosu
    public DbSet<Rol> Roller { get; set; }            // roller tablosu
    public DbSet<UyeRol> UyeRolleri { get; set; }     // kullanici_roller tablosu
    public DbSet<İslemler> İslemler { get; set; }     // kitap_islemler tablosu
    public DbSet<Rezervasyon> Rezervasyonlar { get; set; }
    public DbSet<CezaIslemi> CezaIslemleri { get; set; }
}
```

**Kullanım örneği:**
```csharp
// Tüm kitapları çek
var kitaplar = await _context.Kitaplar.ToListAsync();

// ID'ye göre tek kitap bul
var kitap = await _context.Kitaplar.FindAsync(id);

// Yeni kitap ekle
_context.Kitaplar.Add(yeniKitap);
await _context.SaveChangesAsync();
```

---

## 🗄 Veritabanı Şeması

### Veritabanı Tasarım Yaklaşımı

Veritabanı, **ilişkisel model** kullanılarak tasarlanmıştır. Tablolar arasındaki ilişkiler Foreign Key'ler ile tanımlanmıştır. Bu sayede:

- **Veri bütünlüğü** sağlanır (olmayan bir üyeye kitap verilemez)
- **Tekrar eden veri** önlenir (normalizasyon)
- **Sorgular** daha verimli çalışır

### Entity-Relationship (ER) Diyagramı

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   uyeler    │──1:N──│  kitap_islemler │──N:1──│  kitaplar   │
└─────────────┘       └─────────────────┘       └─────────────┘
      │                       │
      │                       │
      │ 1:N            1:1    │
      ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│ kullanici_roller│   │  ceza_islemleri │
└─────────────────┘   └─────────────────┘
      │ N:1
      ▼
┌─────────────┐
│   roller    │
└─────────────┘
```

### Tablolar ve Yapıları

#### 1. `uyeler` Tablosu - Sistem Kullanıcıları

Bu tablo, sisteme kayıtlı tüm kullanıcıları (öğrenci, personel, admin) tutar.

```sql
DESCRIBE uyeler;
+---------------+---------------------------+------+-----+-------------------+
| Field         | Type                      | Null | Key | Default           |
+---------------+---------------------------+------+-----+-------------------+
| uye_id        | int                       | NO   | PRI | auto_increment    |
| uye_ad_soyad  | varchar(255)              | NO   |     |                   |
| email         | varchar(255)              | NO   | UNI |                   |
| sifre         | varchar(255)              | NO   |     |                   |
| telefon       | varchar(20)               | YES  |     |                   |
| ogrenci_no    | varchar(100)              | YES  | UNI |                   |
| durum         | enum('aktif','pasif',     | YES  |     | aktif             |
|               | 'askida')                 |      |     |                   |
| kayit_tarihi  | timestamp                 | YES  |     | CURRENT_TIMESTAMP |
| son_giris     | timestamp                 | YES  |     |                   |
+---------------+---------------------------+------+-----+-------------------+
```

**Önemli noktalar:**
- `email` benzersiz (UNI) - aynı email ile iki hesap açılamaz
- `sifre` BCrypt ile hash'lenmiş şekilde saklanır
- `durum` enum tipi - sadece belirlenen değerler kabul edilir

#### 2. `kitaplar` Tablosu - Kütüphane Koleksiyonu

Kütüphanedeki tüm kitapların bilgilerini tutar.

```sql
DESCRIBE kitaplar;
+---------------+---------------------------+------+-----+-------------------+
| Field         | Type                      | Null | Key | Default           |
+---------------+---------------------------+------+-----+-------------------+
| kitap_id      | int                       | NO   | PRI | auto_increment    |
| kitap_adi     | varchar(255)              | NO   |     |                   |
| yazar         | varchar(255)              | NO   |     |                   |
| isbn          | varchar(20)               | YES  | UNI |                   |
| kategori      | varchar(100)              | YES  |     |                   |
| sayfa_sayisi  | int                       | YES  |     |                   |
| yayin_yili    | int                       | YES  |     |                   |
| durum         | enum('musait','odunc',    | YES  |     | musait            |
|               | 'bakim')                  |      |     |                   |
| ekleme_tarihi | timestamp                 | YES  |     | CURRENT_TIMESTAMP |
+---------------+---------------------------+------+-----+-------------------+
```

**Durum değerleri:**
- `musait`: Ödünç alınabilir
- `odunc`: Şu an birinde ödünç
- `bakim`: Bakımda, ödünç alınamaz

#### 3. `kitap_islemler` Tablosu - Ödünç/İade İşlemleri

Tüm ödünç alma ve iade işlemlerinin kaydını tutar. Bu tablo, kütüphanenin en kritik tablosudur.

```sql
DESCRIBE kitap_islemler;
+------------------+------------------+------+-----+-------------------+
| Field            | Type             | Null | Key | Default           |
+------------------+------------------+------+-----+-------------------+
| islem_id         | bigint unsigned  | NO   | PRI | auto_increment    |
| uye_id           | int              | NO   | MUL | FK → uyeler       |
| kitap_id         | int              | NO   | MUL | FK → kitaplar     |
| islem_turu       | varchar(255)     | NO   | MUL | 'odunc' veya      |
|                  |                  |      |     | 'rezervasyon'     |
| alim_tarihi      | datetime         | YES  |     |                   |
| iade_tarihi      | datetime         | YES  |     | NULL ise henüz    |
|                  |                  |      |     | iade edilmemiş    |
| durum            | varchar(50)      | NO   | MUL |                   |
| metadata         | json             | YES  |     | Ek bilgiler       |
| ip_address       | varchar(45)      | YES  |     | Güvenlik için     |
| user_agent       | varchar(512)     | YES  |     | Tarayıcı bilgisi  |
| olusturma_tarihi | timestamp        | NO   | MUL | CURRENT_TIMESTAMP |
+------------------+------------------+------+-----+-------------------+
```

**İş mantığı:**
- `iade_tarihi = NULL` → Kitap henüz iade edilmemiş
- `iade_tarihi - alim_tarihi > 14 gün` → Gecikme var, ceza uygulanır

#### 4. `roller` Tablosu - Yetki Seviyeleri

Sistemdeki farklı kullanıcı rollerini ve yetkilerini tanımlar.

```sql
SELECT * FROM roller;
+--------+--------------+------------------------+----------------+
| rol_id | rol_adi      | aciklama               | yetki_seviyesi |
+--------+--------------+------------------------+----------------+
| 1      | ogrenci      | Öğrenci kullanıcısı    | 1              |
| 2      | personel     | Üniversite personeli   | 2              |
| 3      | akademisyen  | Akademik personel      | 3              |
| 4      | admin        | Sistem yöneticisi      | 4              |
| 5      | super_admin  | Ana sistem yöneticisi  | 5              |
+--------+--------------+------------------------+----------------+
```

**Yetki seviyesi ne işe yarar?**
- Sayı büyüdükçe yetki artar
- Admin (4) öğrencinin (1) göremediği sayfalara erişebilir
- Backend'de `[Authorize(Roles = "admin")]` ile kontrol edilir

#### 5. `ceza_config` - Sistem Ayarları

Ceza hesaplama parametrelerini dinamik olarak değiştirmek için kullanılır.

```sql
SELECT * FROM ceza_config;
+------------------------+--------+-------------------------------+
| config_key             | config_value | aciklama                 |
+------------------------+--------------+--------------------------+
| GUNLUK_CEZA_TUTARI     | 5.00         | Günlük gecikme cezası TL |
| MAKSIMUM_CEZA_TUTARI   | 500.00       | Tek ceza maksimum TL     |
| ODEME_SURESI_GUN       | 7            | Ödeme süresi (gün)       |
| CEZA_MAIL_GECIKME_GUN  | 0            | Mail gecikme süresi      |
+------------------------+--------------+--------------------------+
```

**Neden ayrı tablo?**
- Kod değiştirmeden ayar değiştirilebilir
- Admin panelinden yönetilebilir
- Trigger'lar bu değerleri okur

### Foreign Key İlişkileri

Foreign Key'ler, tablolar arasındaki ilişkileri tanımlar ve veri bütünlüğünü sağlar. Örneğin, olmayan bir `uye_id` ile işlem kaydı oluşturulamaz.

| Tablo | Kolon | Referans Tablo | Referans Kolon | Açıklama |
|-------|-------|----------------|----------------|----------|
| ceza_islemleri | uye_id | uyeler | uye_id | Ceza hangi üyeye ait |
| ceza_islemleri | islem_id | kitap_islemler | islem_id | Hangi ödünç işleminden |
| ceza_islemleri | kitap_id | kitaplar | kitap_id | Hangi kitap için |
| kitap_islemler | kitap_id | kitaplar | kitap_id | Ödünç alınan kitap |
| kitap_islemler | uye_id | uyeler | uye_id | Ödünç alan üye |
| kullanici_roller | uye_id | uyeler | uye_id | Üye-rol ilişkisi |
| kullanici_roller | rol_id | roller | rol_id | Atanan rol |
| rezervasyonlar | kitap_id | kitaplar | kitap_id | Rezerve edilen kitap |
| rezervasyonlar | uye_id | uyeler | uye_id | Rezervasyon yapan üye |

### Trigger'lar - Otomatik İş Kuralları

Trigger'lar, veritabanında belirli olaylar gerçekleştiğinde otomatik çalışan kod bloklarıdır. Bu projede trigger'lar kullanarak iş kurallarını veritabanı seviyesinde uyguladık.

**Neden Trigger Kullandık?**
- Backend'den bağımsız çalışır
- Veri tutarlılığı garantilenir
- Performans avantajı (tek transaction)
- Farklı uygulamalar aynı kuralları kullanır

#### 1. Ödünç Alma Trigger'ı

Bir kitap ödünç alındığında, kitabın durumunu otomatik olarak "odunc" yapar.

```sql
CREATE TRIGGER kitap_odunc_after_insert 
AFTER INSERT ON kitap_islemler
FOR EACH ROW
BEGIN
    -- Sadece ödünç işlemi ise çalış
    IF NEW.islem_turu = 'odunc' THEN
        UPDATE kitaplar 
        SET durum = 'odunc' 
        WHERE kitap_id = NEW.kitap_id;
    END IF;
END
```

**Nasıl çalışır?**
1. `kitap_islemler` tablosuna yeni kayıt eklenir (INSERT)
2. Trigger otomatik tetiklenir
3. `islem_turu = 'odunc'` ise kitabın durumu güncellenir

#### 2. İade Trigger'ı

Kitap iade edildiğinde, durumu "musait" yapar (başka aktif ödünç yoksa).

```sql
CREATE TRIGGER kitap_iade_after_update 
AFTER UPDATE ON kitap_islemler
FOR EACH ROW
BEGIN
    -- iade_tarihi yeni set edildiyse (iade işlemi)
    IF NEW.iade_tarihi IS NOT NULL AND OLD.iade_tarihi IS NULL THEN
        -- Başka aktif ödünç yoksa musait yap
        IF NOT EXISTS (
            SELECT 1 FROM kitap_islemler 
            WHERE kitap_id = NEW.kitap_id 
            AND islem_turu = 'odunc' 
            AND iade_tarihi IS NULL 
            AND islem_id != NEW.islem_id
        ) THEN
            UPDATE kitaplar 
            SET durum = 'musait' 
            WHERE kitap_id = NEW.kitap_id;
        END IF;
    END IF;
END
```

#### 3. Otomatik Ceza Trigger'ı

Geciken kitap iade edilince, otomatik olarak ceza kaydı oluşturur.

```sql
CREATE TRIGGER trg_otomatik_ceza_olustur 
AFTER UPDATE ON kitap_islemler
FOR EACH ROW
BEGIN
    DECLARE gecik_gun INT;
    DECLARE ceza_tutari DECIMAL(10, 2);
    
    -- İade işlemi mi kontrol et
    IF (OLD.iade_tarihi IS NULL AND NEW.iade_tarihi IS NOT NULL) THEN
        -- 14 günden sonraki gecikme hesapla
        SET gecik_gun = DATEDIFF(NEW.iade_tarihi, 
                                  DATE_ADD(OLD.alim_tarihi, INTERVAL 14 DAY));
        
        IF gecik_gun > 0 THEN
            -- Ceza hesapla (günlük 5 TL, max 500 TL)
            SET ceza_tutari = gecik_gun * 5.00;
            IF ceza_tutari > 500.00 THEN
                SET ceza_tutari = 500.00;
            END IF;
            
            -- Ceza kaydı oluştur
            INSERT INTO ceza_islemleri 
            (uye_id, islem_id, kitap_id, ceza_turu, ceza_tarihi, 
             son_odeme_tarihi, ceza_tutari, durum, aciklama)
            VALUES 
            (NEW.uye_id, NEW.islem_id, NEW.kitap_id, 'geciken_kitap', 
             NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ceza_tutari, 
             'aktif', CONCAT(gecik_gun, ' gün gecikmeli iade'));
        END IF;
    END IF;
END
```

#### 4. Rezervasyon Çakışma Kontrolü

Aynı kitap için çakışan tarih aralığında rezervasyon yapılmasını engeller.

```sql
CREATE TRIGGER trg_rezervasyonlar_no_overlap 
BEFORE INSERT ON rezervasyonlar
FOR EACH ROW
BEGIN
    IF NEW.durum = 'aktif' THEN
        IF EXISTS (
            SELECT 1 FROM rezervasyonlar r
            WHERE r.kitap_id = NEW.kitap_id
              AND r.durum = 'aktif'
              AND NOT (NEW.bitis_tarihi < r.baslangic_tarihi 
                       OR NEW.baslangic_tarihi > r.bitis_tarihi)
        ) THEN
            -- Hata fırlat
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Bu kitap için çakışan aktif rezervasyon var';
        END IF;
    END IF;
END
```

---

## 🔐 Kimlik Doğrulama Sistemi (JWT)

### JWT Nedir?

**JSON Web Token (JWT)**, kullanıcı kimliğini doğrulamak için kullanılan açık bir standarttır. Geleneksel session-based authentication'dan farklı olarak:

| Özellik | Session-Based | JWT-Based |
|---------|---------------|-----------|
| Durum | Sunucuda session saklanır | Stateless (sunucuda veri yok) |
| Ölçeklenebilirlik | Zor (session paylaşımı gerekir) | Kolay |
| Performans | Her istekte session lookup | Token doğrulama yeterli |
| Cross-Domain | Zor | Kolay (token header'da taşınır) |

### JWT Token Yapısı

Bir JWT token 3 parçadan oluşur: `HEADER.PAYLOAD.SIGNATURE`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  ← Header (algoritma bilgisi)
eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkB...  ← Payload (kullanıcı bilgileri)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV...  ← Signature (imza - doğrulama için)
```

### JWT Yapılandırması

`appsettings.json` dosyasında JWT ayarları tanımlanır:

```json
{
  "Jwt": {
    "Key": "YOUR_SECURE_JWT_KEY",      // En az 32 karakter gizli anahtar
    "Issuer": "kutuphane-api",         // Token'ı üreten
    "Audience": "kutuphane-client",    // Token'ı kullanacak
    "ExpiresMinutes": 120              // Token geçerlilik süresi (2 saat)
  }
}
```

### JWT Token Üretimi

Kullanıcı başarılı giriş yaptığında token üretilir:

```csharp
private string GenerateJwtToken(Uye uye, string rol)
{
    // Yapılandırma değerlerini al
    var jwtSection = _config.GetSection("Jwt");
    var key = jwtSection.GetValue<string>("Key");
    var issuer = jwtSection.GetValue<string>("Issuer");
    var audience = jwtSection.GetValue<string>("Audience");
    var expireMinutes = jwtSection.GetValue<int>("ExpiresMinutes");

    // Token'a eklenecek bilgiler (Claims)
    // Bu bilgiler token'dan decode edilebilir
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, uye.Id.ToString()),  // Kullanıcı ID
        new Claim(JwtRegisteredClaimNames.Email, uye.Email),        // Email
        new Claim(ClaimTypes.Name, uye.AdSoyad),                    // Ad Soyad
        new Claim(ClaimTypes.Role, rol)                              // Rol (yetki için)
    };

    // İmza için anahtar oluştur
    var creds = new SigningCredentials(
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), 
        SecurityAlgorithms.HmacSha256  // HMAC-SHA256 algoritması
    );

    // Token'ı oluştur
    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(expireMinutes),
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### JWT Doğrulama (Program.cs)

Her gelen istekte token doğrulanır:

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,           // Issuer doğrula
        ValidateAudience = true,         // Audience doğrula
        ValidateLifetime = true,         // Süre dolmuş mu kontrol et
        ValidateIssuerSigningKey = true, // İmza geçerli mi
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.FromMinutes(2)  // 2 dakika tolerans
    };
});
```

### Yetki Kontrolü (Authorization)

JWT token'daki rol bilgisi kullanılarak endpoint'lere erişim kontrol edilir:

```csharp
// Sadece admin rolündeki kullanıcılar erişebilir
[Authorize(Roles = "admin")]
public async Task<IActionResult> GetAllUsers() { ... }

// Herhangi bir giriş yapmış kullanıcı erişebilir
[Authorize]
public async Task<IActionResult> GetMyProfile() { ... }

// Herkes erişebilir (giriş gerekmez)
[AllowAnonymous]
public async Task<IActionResult> Login() { ... }
```

### Frontend'de Token Kullanımı

```javascript
// Giriş sonrası token'ı localStorage'a kaydet
localStorage.setItem('kutuphane_token', data.token);

// Her API çağrısında token'ı header'a ekle
const token = localStorage.getItem('kutuphane_token');
const response = await fetch('http://localhost:5165/api/kitaplar', {
    headers: {
        'Authorization': `Bearer ${token}`,  // Bearer scheme
        'Content-Type': 'application/json'
    }
});

// 401 hatası = token geçersiz veya süresi dolmuş
if (response.status === 401) {
    localStorage.removeItem('kutuphane_token');
    window.location.href = 'login.html';
}
```

---

## 🔒 Şifre Güvenliği (BCrypt)

### Neden Şifreler Hash'lenir?

Şifreler **asla düz metin olarak** saklanmamalıdır. Eğer veritabanı sızdırılırsa:

| Yöntem | Sonuç |
|--------|-------|
| Düz metin | Tüm şifreler anında ele geçirilir |
| MD5/SHA1 | Rainbow table ile kırılabilir |
| **BCrypt** | Her şifre için benzersiz salt, çok yavaş (brute-force zor) |

### BCrypt Nasıl Çalışır?

BCrypt, şifreyi hash'lerken rastgele bir **salt** ekler ve işlemi kasıtlı olarak yavaşlatır:

```
Şifre: "Secret123"
         ↓
BCrypt.HashPassword()
         ↓
Hash: "$2a$11$N9qo8uLOickgx2ZMRZoMy.MlB3U1/ZpJKXYJjBGWXxz.A8Qg4KVNG"
       ├── $2a$ → BCrypt versiyonu
       ├── $11$ → Cost factor (2^11 iterasyon)
       └── Geri kalan → Salt + Hash
```

### Kayıt İşleminde Hash'leme

```csharp
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterDto istek)
{
    // Şifre güçlülük kontrolü (backend'de de yapılmalı!)
    if (!Regex.IsMatch(istek.Sifre, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
    {
        return BadRequest(new { 
            mesaj = "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir." 
        });
    }

    var yeniUye = new Uye
    {
        AdSoyad = $"{istek.Ad} {istek.Soyad}",
        Email = istek.Email.ToLower().Trim(),
        // BCrypt ile hash'le - salt otomatik eklenir
        Sifre = BCrypt.Net.BCrypt.HashPassword(istek.Sifre)
    };

    _context.Uyeler.Add(yeniUye);
    await _context.SaveChangesAsync();
    
    return Ok(new { mesaj = "Kayıt başarılı!" });
}
```

### Giriş İşleminde Doğrulama

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto istek)
{
    // Email ile kullanıcıyı bul
    var uye = await _context.Uyeler
        .FirstOrDefaultAsync(u => u.Email == istek.Email.ToLower());

    // BCrypt.Verify hash'lenmiş şifreyi kontrol eder
    // Şifreyi tekrar hash'lemez, mevcut hash ile karşılaştırır
    if (uye == null || !BCrypt.Net.BCrypt.Verify(istek.Sifre, uye.Sifre))
    {
        // Güvenlik: Hangisinin yanlış olduğunu söyleme!
        return Unauthorized(new { mesaj = "E-mail veya şifre hatalı!" });
    }

    // Giriş başarılı, token üret
    var token = GenerateJwtToken(uye, kullaniciRolu);
    return Ok(new { token, uyeId = uye.Id, adSoyad = uye.AdSoyad, rol = kullaniciRolu });
}
```

### Mevcut Şifreleri Hash'leme (Migration)

Eğer projede daha önce düz metin şifreler varsa, bunları hash'lemek için:

```csharp
// Utilities/PasswordHasher.cs
public static async Task HashExistingPasswords(AppDbContext context)
{
    var uyeler = await context.Uyeler.ToListAsync();
    
    foreach (var uye in uyeler)
    {
        // BCrypt hash'leri "$2" ile başlar
        // Zaten hash'lenmiş mi kontrol et
        if (uye.Sifre.StartsWith("$2"))
            continue;  // Atla
        
        // Hash'le
        uye.Sifre = BCrypt.Net.BCrypt.HashPassword(uye.Sifre);
    }
    
    await context.SaveChangesAsync();
    Console.WriteLine($"{uyeler.Count} şifre hash'lendi.");
}
```

### Şifre Güçlülük Kuralları

Projede uygulanan şifre politikası:

| Kural | Açıklama |
|-------|----------|
| Minimum uzunluk | 6 karakter |
| Büyük harf | En az 1 adet (A-Z) |
| Küçük harf | En az 1 adet (a-z) |
| Rakam | En az 1 adet (0-9) |

```javascript
// Frontend validasyonu (scripts/app.js)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
if (!passwordRegex.test(password)) {
    showToast('Şifre kurallara uymuyor!', 'error');
    return;
}
```

---

## 📡 API Endpoints

### API Tasarım Prensipleri

Bu API, **RESTful** prensiplerine uygun tasarlanmıştır:

| Prensip | Açıklama | Örnek |
|---------|----------|-------|
| **Resource-based URL** | URL kaynak ismi içerir | `/api/kitaplar` |
| **HTTP Methods** | İşlem türü method ile belirlenir | GET=oku, POST=oluştur, PUT=güncelle, DELETE=sil |
| **Stateless** | Her istek bağımsız | Token ile kimlik doğrulama |
| **JSON Response** | Tutarlı response formatı | `{ success: true, data: [...] }` |

### Auth Controller (`/api/auth`)

Kullanıcı kimlik doğrulama işlemlerini yönetir.

| Method | Endpoint | Açıklama | Yetki | Rate Limit |
|--------|----------|----------|-------|------------|
| POST | `/register` | Yeni kullanıcı kaydı | Açık | 3/10dk |
| POST | `/login` | Giriş yapma, token al | Açık | 5/dk |
| POST | `/change-password` | Şifre değiştirme | Auth | - |
| POST | `/forgot-password` | Şifremi unuttum (mail gönderir) | Açık | - |
| POST | `/logout` | Çıkış (client-side token silme) | Auth | - |

**Örnek Login İsteği:**
```javascript
const response = await fetch('http://localhost:5165/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Email: 'user@test.com', Sifre: 'Secret123' })
});
// Response: { token: "eyJ...", uyeId: 1, adSoyad: "Test User", rol: "ogrenci" }
```

### Kitaplar Controller (`/api/kitaplar`)

Kitap yönetimi için CRUD operasyonları.

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/` | Tüm kitaplar (admin için) | Admin |
| GET | `/public` | Herkese açık liste (paginated) | Auth |
| GET | `/public/search` | Arama ve filtreleme | Auth |
| GET | `/public/distinct-kategoriler` | Kategori listesi | Auth |
| GET | `/public/yil-araligi` | Min/max yayın yılı | Auth |
| GET | `/{id}` | Tek kitap detayı | Admin |
| POST | `/` | Yeni kitap ekle | Admin |
| PUT | `/{id}` | Kitap güncelle | Admin |
| DELETE | `/{id}` | Kitap sil | Admin |

**Arama Örneği:**
```
GET /api/kitaplar/public/search?q=python&kategori=Yazılım&minYil=2020&page=1&pageSize=20
```

### İşlemler Controller (`/api/islemler`)

Ödünç alma ve iade işlemlerini yönetir.

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/` | Tüm işlemler (admin) | Admin |
| GET | `/benim-kitaplarim` | Kullanıcının aktif ödünçleri | Auth |
| GET | `/toplam-okudugum` | Toplam okunan kitap sayısı | Auth |
| GET | `/geciken` | Geciken kitaplar | Auth |
| POST | `/odunc-al` | Kitap ödünç al | Auth |
| POST | `/iade-et` | Kitap iade et | Auth |

**Ödünç Alma Örneği:**
```javascript
await fetch('http://localhost:5165/api/islemler/odunc-al', {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ KitapId: 42 })
});
// Trigger otomatik olarak kitap durumunu "odunc" yapar
```

### Rezervasyonlar Controller (`/api/rezervasyonlar`)

Kitap rezervasyonu işlemlerini yönetir.

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/kitap/{kitapId}` | Kitabın aktif rezervasyonları | Auth |
| GET | `/benim-rezervasyonlarim` | Kullanıcının rezervasyonları | Auth |
| POST | `/` | Yeni rezervasyon oluştur | Auth |
| DELETE | `/{id}` | Rezervasyon iptal | Auth |

### Cezalar Controller (`/api/cezalar`)

Gecikme cezalarını yönetir.

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/` | Tüm cezalar | Admin |
| GET | `/benim-cezalarim` | Kullanıcının cezaları | Auth |
| GET | `/{id}` | Ceza detayı | Auth |
| POST | `/{id}/ode` | Ceza öde | Auth |
| POST | `/{id}/affet` | Cezayı affet | Admin |

### Profil Controller (`/api/profil`)

Kullanıcı profil işlemleri.

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/{id}` | Profil bilgilerini getir | Auth |
| PUT | `/` | Profil güncelle | Auth |

---

## 📧 E-posta Servisi

### E-posta Sisteminin Amacı

Sistem, kullanıcılara çeşitli durumlarda otomatik e-posta gönderir:

| Durum | E-posta İçeriği |
|-------|-----------------|
| Kitap ödünç alındığında | Kitap bilgisi + iade tarihi |
| Gecikme cezası oluştuğunda | Ceza tutarı + son ödeme tarihi |
| Şifre sıfırlama | Geçici şifre |

### Email Service Interface

```csharp
public interface IEmailService
{
    // Genel amaçlı e-posta
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    
    // Özel şablonlar
    Task SendCezaBildirimAsync(string uyeEmail, string uyeAdi, 
                               string kitapAdi, decimal cezaTutari, 
                               DateTime sonOdemeTarihi);
    
    Task SendOduncAlBildirimAsync(string uyeEmail, string uyeAdi, 
                                   string kitapAdi, DateTime iadeTarihi);
    
    Task SendPasswordResetAsync(string uyeEmail, string uyeAdi, string yeniSifre);
}
```

### E-posta Konfigürasyonu

```json
{
  "Email": {
    "SmtpServer": "smtp.gmail.com",    // Gmail SMTP sunucusu
    "SmtpPort": 587,                   // TLS portu
    "FromEmail": "kutuphane@example.com",
    "FromName": "Kütüphane Sistemi",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",   // Gmail App Password
    "EnableSSL": true
  }
}
```

**Not:** Gmail için "App Password" oluşturmanız gerekir. Normal şifre çalışmaz.

---

## 🎯 Özellikler Özeti

Bu bölüm, sistemin sunduğu tüm özellikleri kategorize eder.

### Kullanıcı Özellikleri

| Özellik | Açıklama | Endpoint |
|---------|----------|----------|
| ✅ Kayıt olma | Yeni hesap oluşturma | POST /api/auth/register |
| ✅ Giriş yapma | Token ile oturum başlatma | POST /api/auth/login |
| ✅ Kitap arama | İsim, yazar, ISBN ile arama | GET /api/kitaplar/public/search |
| ✅ Kitap filtreleme | Kategori, yıl, durum filtresi | GET /api/kitaplar/public/search |
| ✅ Kitap ödünç alma | Müsait kitabı ödünç al | POST /api/islemler/odunc-al |
| ✅ Kitap iade etme | Ödünç kitabı iade et | POST /api/islemler/iade-et |
| ✅ Rezervasyon yapma | İleri tarih için rezerve et | POST /api/rezervasyonlar |
| ✅ Profil güncelleme | Ad, telefon, email değiştir | PUT /api/profil |
| ✅ Şifre değiştirme | Mevcut şifre ile değiştir | POST /api/auth/change-password |
| ✅ Ceza görüntüleme | Gecikme cezalarını gör | GET /api/cezalar/benim-cezalarim |

### Admin Özellikleri

| Özellik | Açıklama |
|---------|----------|
| ✅ Kitap CRUD | Ekleme, düzenleme, silme |
| ✅ Üye yönetimi | Üye listesi, durum değiştirme |
| ✅ İşlem takibi | Tüm ödünç/iade geçmişi |
| ✅ Ceza yönetimi | Ceza listesi, affetme |
| ✅ Geciken takibi | Süresi geçmiş kitaplar |
| ✅ İstatistikler | Dashboard özet bilgiler |

### Güvenlik Özellikleri

| Özellik | Nasıl Uygulandı? |
|---------|------------------|
| ✅ JWT Authentication | Her istekte token doğrulama |
| ✅ BCrypt Hashing | Şifreler hash'lenerek saklanır |
| ✅ Role-Based Auth | `[Authorize(Roles = "admin")]` |
| ✅ Rate Limiting | Login: 5/dk, Register: 3/10dk |
| ✅ Input Validation | Model validasyonu + regex |
| ✅ CORS Politikası | Cross-origin isteklere izin |

---

## 🔜 Frontend Yapısı

### Neden Vanilla JavaScript?

Framework (React, Vue, Angular) kullanmak yerine saf JavaScript tercih ettik:

| Avantaj | Açıklama |
|---------|----------|
| **Basitlik** | Öğrenme eğrisi yok |
| **Hız** | Daha az kod, hızlı yükleme |
| **Bağımlılık** | npm, node_modules gerektirmez |
| **Anlama** | Temel kavramlar net görülür |

### Dosya Organizasyonu

Frontend 3 ana bölümden oluşur:

```
kutuphane_projesi/
│
├── login.html                 # Giriş/Kayıt sayfası
├── anasyafa.html              # Ana sayfa (giriş sonrası yönlendirme)
│
├── scripts/
│   └── app.js                 # Login/Register mantığı + Toast sistemi
│
├── styles/
│   ├── style.css              # Giriş sayfası stilleri
│   ├── anasayfa.css           # Ana sayfa stilleri
│   └── ustyle.css             # Kullanıcı paneli stilleri
│
├── admin/                     # 🔐 Admin Panel (sadece adminler)
│   ├── index.html             # Dashboard
│   ├── kitaplar.html          # Kitap yönetimi
│   ├── uyeler.html            # Üye yönetimi
│   ├── islemler.html          # İşlem geçmişi
│   ├── gec.html               # Ceza yönetimi
│   ├── admin-common.js        # Ortak: auth kontrolü, sidebar, toast
│   ├── panel-backend.js       # Dashboard istatistikleri
│   ├── kitaplar-backend.js    # Kitap CRUD işlemleri
│   ├── uyeler-backend.js      # Üye CRUD işlemleri
│   ├── islemler-backend.js    # İşlem listesi
│   └── gec-backend.js         # Ceza listesi
│
└── user/                      # 👤 Kullanıcı Paneli
    ├── user-dashboard.html    # Kullanıcı dashboard
    ├── user-kitaplar.html     # Kitap kataloğu (arama, ödünç al)
    ├── user-kitaplarim.html   # Aktif ödünçler (iade et)
    ├── user-profile.html      # Profil düzenleme
    ├── user-reservations.html # Rezervasyonlarım
    ├── user-common.js         # Ortak: auth kontrolü, sidebar
    ├── dashboard-backend.js   # Dashboard verileri
    ├── ukitaplar-backend.js   # Kitap arama/filtreleme
    └── profil-backend.js      # Profil güncelleme
```

### Dosya İsimlendirme Konvansiyonu

| Pattern | Açıklama | Örnek |
|---------|----------|-------|
| `*-backend.js` | Sayfa için API çağrıları ve mantık | kitaplar-backend.js |
| `*-common.js` | Tüm sayfalarda kullanılan ortak kod | admin-common.js |
| `user-*.html` | Kullanıcı paneli sayfaları | user-dashboard.html |

### Login/Register Sistemi

Login sayfası (login.html) tek bir form içerir, JavaScript ile giriş/kayıt arasında geçiş yapılır:

```javascript
// Login işlemi
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:5165/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Sifre: password })
    });

    const data = await response.json();

    // Token ve kullanıcı bilgilerini localStorage'a kaydet
    localStorage.setItem('kutuphane_id', data.uyeId);
    localStorage.setItem('kutuphane_token', data.token);
    localStorage.setItem('kutuphane_rol', data.rol);
    localStorage.setItem('kutuphane_adSoyad', data.adSoyad);

    // Role göre yönlendirme
    const isAdmin = ['admin', 'super', 'super_admin'].some(k => 
        data.rol.toLowerCase().includes(k));

    if (isAdmin) {
        window.location.href = 'admin/index.html';
    } else {
        window.location.href = 'user/user-dashboard.html';
    }
});
```

### Token Yönetimi

```javascript
// Her API çağrısında token header'a ekleniyor
const token = localStorage.getItem('kutuphane_token');
const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

const res = await fetch('http://localhost:5165/api/kitaplar', { headers });

// 401 hatası alınırsa login'e yönlendir
if (res.status === 401) {
    localStorage.removeItem('kutuphane_token');
    window.location.href = 'login.html';
}
```

### Toast Notification Sistemi

```javascript
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#4CAF50' : 
                          type === 'error' ? '#f44336' : 
                          type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}
```

### Admin Panel Özellikleri

| Sayfa | Özellikler |
|-------|------------|
| **Dashboard** | İstatistikler, son işlemler, hızlı eylemler |
| **Kitaplar** | CRUD, arama, filtreleme, pagination |
| **Üyeler** | CRUD, durum yönetimi, rol görüntüleme |
| **İşlemler** | Ödünç/iade geçmişi, gecikme takibi |
| **Cezalar** | Ceza listesi, ödeme durumu, affetme |

### Kullanıcı Panel Özellikleri

| Sayfa | Özellikler |
|-------|------------|
| **Dashboard** | Aktif ödünçler, geciken kitaplar, istatistikler |
| **Kitap Kataloğu** | Arama, filtreleme, infinite scroll, ödünç alma |
| **Kitaplarım** | Aktif ödünçler, iade etme |
| **Rezervasyonlarım** | Aktif rezervasyonlar, iptal |
| **Profil** | Bilgi güncelleme, şifre değiştirme |

### Arama ve Filtreleme

```javascript
// Kitap arama ve filtreleme
function applyAllFilters() {
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('pageSize', pageSize);
    
    if (currentSearchQuery) params.append('q', currentSearchQuery);
    if (currentKategoriFilter) params.append('kategori', currentKategoriFilter);
    if (currentDurumFilter) params.append('durum', currentDurumFilter);
    if (currentYearMin) params.append('minYil', currentYearMin);
    if (currentYearMax) params.append('maxYil', currentYearMax);

    const apiurl = `http://localhost:5165/api/kitaplar/public/search?${params.toString()}`;
    // fetch...
}
```

### Infinite Scroll

Sayfa sonuna yaklaşıldığında otomatik olarak yeni veriler yüklenir:

```javascript
function setupInfiniteScroll() {
    window.addEventListener('scroll', function() {
        // Sayfa sonuna 1000px kala yeni veri yükle
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            if (!isLoading && hasMore) {
                loadMoreBooks();
            }
        }
    });
}
```

---

## 🚀 Kurulum Rehberi

Bu bölüm, projeyi sıfırdan kurmak isteyenler için adım adım talimatlar içerir.

### Gereksinimler

| Yazılım | Minimum Versiyon | İndirme Linki |
|---------|------------------|---------------|
| .NET SDK | 8.0 | https://dotnet.microsoft.com/download |
| MySQL | 8.0 | https://dev.mysql.com/downloads/ |
| Git | 2.x | https://git-scm.com/ |
| Tarayıcı | Modern (Chrome, Firefox, Edge) | - |

### 1. Veritabanı Kurulumu

```bash
# MySQL'e bağlan
mysql -u root -p

# Veritabanı oluştur
CREATE DATABASE kutuphane CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Tabloları oluştur (sql/ klasöründeki scriptler)
USE kutuphane;
SOURCE sql/triggers.sql;
```

### 2. Backend Kurulumu

```bash
# Proje klasörüne git
cd KutuphaneApi/ktphnAPI

# Bağımlılıkları yükle
dotnet restore

# appsettings.Development.json dosyasını düzenle
# - ConnectionStrings.DefaultConnection → MySQL bağlantı bilgileri
# - Jwt.Key → En az 32 karakterlik gizli anahtar
# - Email ayarları (isteğe bağlı)

# Çalıştır
dotnet run
```

**Başarılı çalıştığında:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5165
info: Microsoft.Hosting.Lifetime[0]
      Application started.
```

### 3. Frontend Çalıştırma

Frontend statik HTML/JS dosyalarından oluşur. Bir web sunucusu ile serve edilebilir:

```bash
# Python ile basit sunucu
python -m http.server 8080

# veya Node.js ile
npx serve .

# veya VS Code Live Server eklentisi
```

Ardından tarayıcıda `http://localhost:8080/login.html` adresine gidin.

### 4. İlk Kullanıcı Oluşturma

Veritabanına doğrudan admin kullanıcı ekleyin:

```sql
-- Kullanıcı ekle (şifre: Admin123)
INSERT INTO uyeler (uye_ad_soyad, email, sifre, durum) VALUES 
('Admin User', 'admin@kutuphane.com', 
 '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aktif');

-- Admin rolü ata
INSERT INTO kullanici_roller (uye_id, rol_id) VALUES 
((SELECT uye_id FROM uyeler WHERE email = 'admin@kutuphane.com'), 
 (SELECT rol_id FROM roller WHERE rol_adi = 'admin'));
```

---

## ❓ Sık Karşılaşılan Sorunlar

### 1. "Connection refused" Hatası

**Sorun:** Frontend, backend'e bağlanamıyor.

**Çözüm:**
- Backend çalışıyor mu kontrol et: `dotnet run`
- Port doğru mu: `http://localhost:5165`
- CORS ayarları doğru mu: Program.cs'te `AllowAnyOrigin()` var mı //proje geliştirme aşamasında ve localde diye AllowAnyOrigin kullandık, normalde böyle kullanılmaz.

### 2. "401 Unauthorized" Hatası

**Sorun:** API isteği reddediliyor.

**Çözüm:**
- Token localStorage'da var mı: `localStorage.getItem('kutuphane_token')`
- Token süresi dolmuş olabilir (2 saat)
- Header'da `Bearer` prefix var mı: `Authorization: Bearer <token>`

### 3. "Incorrect datetime value" Hatası

**Sorun:** Kitap eklerken tarih hatası.

**Çözüm:** Model'de default değer tanımlı olmalı:
```csharp
public DateTime EklemeTarihi { get; set; } = DateTime.Now;
```

### 4. Şifre Kabul Edilmiyor

**Sorun:** Kayıt olurken şifre reddediliyor.

**Çözüm:** Şifre kurallarına uy:
- En az 6 karakter
- En az 1 büyük harf (A-Z)
- En az 1 küçük harf (a-z)
- En az 1 rakam (0-9)

### 5. Admin Paneline Erişilemiyor

**Sorun:** Giriş yapıldı ama admin paneli açılmıyor.

**Çözüm:**
- Kullanıcının rolü "admin" veya "super_admin" olmalı
- `kullanici_roller` tablosunda rol ataması yapılmış mı kontrol et

### 6. E-posta Gönderilmiyor

**Sorun:** Şifre sıfırlama veya bildirim mailleri gitmiyor.

**Çözüm:**
- Gmail kullanıyorsan "App Password" oluştur
- appsettings.json'da Email ayarları doğru mu
- Firewall SMTP portunu (587) engelliyor olabilir

---

## 📊 Proje Özeti

### Öğrenilen Teknolojiler

| Kategori | Teknolojiler |
|----------|--------------|
| **Backend** | C#, ASP.NET Core, Entity Framework Core, JWT, BCrypt |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Fetch API |
| **Veritabanı** | MySQL, SQL, Triggers, Foreign Keys |
| **Güvenlik** | Authentication, Authorization, Rate Limiting, Password Hashing |
| **Mimari** | RESTful API, MVC, Layered Architecture |

### Proje İstatistikleri

| Metrik | Değer |
|--------|-------|
| Backend Controller Sayısı | 7 |
| API Endpoint Sayısı | ~35 |
| Veritabanı Tablosu | 10 |
| Trigger Sayısı | 8 |
| Frontend Sayfa Sayısı | ~12 |

### Gelecek Geliştirmeler (Öneriler)

- [ ] Kitap kapak resmi yükleme
- [ ] QR kod ile kitap tarama
- [ ] Mobil uygulama (React Native / Flutter)
- [ ] Bildirim sistemi (Push notifications)
- [ ] Raporlama ve istatistik dashboard'u
- [ ] Çoklu dil desteği

---

## 📝 Sonuç

Bu proje, modern bir web uygulamasının temel bileşenlerini içermektedir:

1. **Güvenli kimlik doğrulama** (JWT + BCrypt)
2. **RESTful API tasarımı**
3. **İlişkisel veritabanı yönetimi**
4. **Frontend-Backend ayrımı**
5. **Otomatik iş kuralları** (Triggers)

Proje, hem öğrenme amaçlı hem de gerçek bir kütüphane için temel oluşturabilecek seviyededir.

---

*Bu rapor, proje kaynak kodları incelenerek otomatik olarak oluşturulmuştur.*
*Son güncelleme: Aralık 2025*
