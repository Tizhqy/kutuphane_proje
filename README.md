


# 📚 KTU Kütüphane Yönetim Sistemi (Full-Stack)

Bu proje, **Karadeniz Teknik Üniversitesi (KTÜ)** için geliştirilmiş, **.NET Core Web API** ve **MySQL** altyapısı ile güçlendirilmiş modern bir dijital kütüphane yönetim sistemidir.

Proje, statik bir arayüz tasarımından dinamik veri yönetimine geçiş yapmış, Frontend (HTML/JS) ve Backend (C#) mimarisini başarıyla birleştirmiştir.

---

## 🎯 Proje Amacı

* Kütüphane işlemlerinin dijitalleştirilmesi.
* Kitap ve üye yönetiminin optimize edilmesi.
* Kullanıcı dostu, modern web arayüzü sunulması.
* Responsive tasarım ile her cihazda kullanılabilirlik.
* KTÜ öğrenci ve personeli için entegre kütüphane deneyimi.

---

## ✨ Temel Özellikler

### 👨‍💼 Yönetici Paneli

* **📊 Dashboard**: Gerçek zamanlı istatistikler ve özet bilgiler.
* **📚 Kitap Yönetimi**: Veritabanı bağlantılı ekleme, silme ve listeleme.
* **👥 Üye Yönetimi**: Öğrenci, personel ve akademisyen kaydı.
* **🔍 Gelişmiş Arama**: Anlık kitap arama ve filtreleme.

### 👨‍🎓 Kullanıcı Arayüzü

* **🏠 Kişisel Dashboard**: Ödünç alınan kitaplar ve durum takibi.
* **📖 Kitap Kataloğu**: Görsel kitap kartları ve durum (Mevcut/Ödünç) takibi.
* **📑 Kitaplarım**: Mevcut ödünç alınan kitapların yönetimi.
* **📅 Rezervasyonlar**: Kitap rezervasyon sistemi.

---

## 🏗️ Teknik Yapı (Tech Stack)

### **Backend Teknolojileri**

* **ASP.NET Core Web API (.NET 8.0)**: Modern, hızlı ve ölçeklenebilir API.
* **Entity Framework Core**: ORM yapısı ile veritabanı işlemleri.
* **MySQL**: İlişkisel veritabanı.
* **REST API**: Frontend ile backend arasında JSON veri iletişimi.
* **Swagger UI**: API test ve dokümantasyon arayüzü.

### **Frontend Teknolojileri**

* **HTML5 & CSS3**: Modern semantik yapı ve Responsive tasarım.
* **JavaScript (ES6+)**: Fetch API ile Backend iletişimi.
* **Font Awesome**: Profesyonel ikon seti.

### **Tasarım Sistemi**

* **Ana Renk**: #1a237e (KTÜ Mavi)
* **Tasarım**: Material Design ilkeleri.
* **Responsive**: Mobile-first yaklaşımı.

---

## 📊 **Veritabanı ER Diagramı**

![Veritabanı ER Diagramı](./images/db.svg)

*Yukarıdaki diagram, sistemin tüm tablo ilişkilerini ve veri yapısını göstermektedir.*

---
## 🏗️ Proje Dosya Yapısı

```text
/kutuphane_projesi
│
├── /Frontend (Arayüz Dosyaları - Root)
│   ├── index.html              # Admin Dashboard
│   ├── kitaplar.html           # Kitap Yönetimi (Tablo Görünümü)
│   ├── user-kitaplar.html      # Kullanıcı Kitap Kataloğu (Kart Görünümü)
│   ├── kitaplar-backend.js     # Admin paneli API bağlantısı
│   ├── ukitaplar-backend.js    # Kullanıcı paneli API bağlantısı
│   ├── style.css               # Admin CSS
│   ├── ustyle.css              # Kullanıcı CSS
│   └── /images                 # Logo ve medya dosyaları
│
└── /KutuphaneApi (Backend - ASP.NET Core)
    └── /ktphnAPI
        ├── /Controllers
        │   └── KitaplarController.cs     # API Uçları (Garson)
        ├── /Data
        │   └── AppDbContext.cs           # EF Core veritabanı bağlantısı
        ├── /Models
        │   ├── Kitap.cs                  # Veri model sınıfı
        │   └── KitapDurum.cs             # Enum tanımları
        ├── Program.cs                    # API başlangıç ayarları (CORS, Routing)
        └── appsettings.json              # MySQL bağlantı ayarları
```

---

## 🛠️ Geliştirilecek Özellikler

### (Yakında)

* JWT kimlik doğrulama
* E-posta bildirim sistemi
* Gelişmiş arama
* Loglama & hata yönetimi

### (Uzun Vadeli)

* Mobil uygulama (Flutter)
* QR kod ile hızlı ödünç alma
* Yapay zeka kitap öneri sistemi

---

## 📄 Kod Standartları

* **HTML:** Semantic + WCAG uyumlu
* **CSS:** BEM + mobile first
* **JS:** ES6+ standartları
* **Commit:** Conventional Commits

---

## 📊 Proje İstatistikleri

![GitHub stars](https://img.shields.io/github/stars/Tizhqy/kutuphane_proje?style=social)
![GitHub forks](https://img.shields.io/github/forks/Tizhqy/kutuphane_proje?style=social)
![GitHub issues](https://img.shields.io/github/issues/Tizhqy/kutuphane_proje)

**Son Güncelleme**: Kasım 2025  
**Sürüm**: v0.2
**Durum**: Aktif Geliştirme 🚀

// buraları birleştircem

# 📚 KTU Kütüphane Yönetim Sistemi

Modern bir **Kütüphane Yönetim Sistemi** - .NET 8 Backend API ve MySQL veritabanı ile geliştirilmiştir.

> 📖 Detaylı teknik dokümantasyon için [PROJE_RAPORU.md](PROJE_RAPORU.md) dosyasına bakınız.

---

## 🎯 Proje Hakkında

Bu proje, bir üniversite kütüphanesi için geliştirilmiş tam özellikli bir yönetim sistemidir:

- **Öğrenciler:** Kitap arama, ödünç alma, rezervasyon, ceza takibi
- **Yöneticiler:** Kitap/üye yönetimi, işlem takibi, raporlama

---

## ✨ Özellikler

### 👤 Kullanıcı Paneli
| Özellik | Açıklama |
|---------|----------|
| 📖 Kitap Kataloğu | Arama, filtreleme, infinite scroll |
| 📚 Ödünç Alma | Tek tıkla kitap ödünç al |
| 📅 Rezervasyon | İleri tarih için rezerve et |
| 👤 Profil | Bilgi güncelleme, şifre değiştirme |
| 💰 Ceza Takibi | Gecikme cezalarını görüntüle |

### 🔧 Admin Paneli
| Özellik | Açıklama |
|---------|----------|
| 📊 Dashboard | İstatistikler ve özet |
| 📚 Kitap CRUD | Ekleme, düzenleme, silme |
| 👥 Üye Yönetimi | Durum ve rol yönetimi |
| 📋 İşlem Geçmişi | Tüm ödünç/iade kayıtları |
| ⚠️ Ceza Yönetimi | Ceza listesi, affetme |

### 🔒 Güvenlik
- ✅ **JWT Authentication** - Token tabanlı kimlik doğrulama (120 dk)
- ✅ **BCrypt** - Şifre hashleme
- ✅ **Role-Based Auth** - Admin/Kullanıcı yetki ayrımı
- ✅ **Rate Limiting** - Brute force koruması (5 login/dk)

---

## 🛠️ Teknolojiler

| Katman | Teknolojiler |
|--------|--------------|
| **Backend** | .NET 8, ASP.NET Core, Entity Framework Core |
| **Veritabanı** | MySQL 8.x, Triggers, Foreign Keys |
| **Güvenlik** | JWT Bearer, BCrypt.Net, Rate Limiting |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |

---

## 📁 Proje Yapısı

```
kutuphane_projesi/
├── KutuphaneApi/              # Backend (.NET 8)
│   └── ktphnAPI/
│       ├── Controllers/       # API endpoints (7 controller)
│       ├── Models/            # Entity modelleri
│       ├── Services/          # İş mantığı (Email, Ceza)
│       └── Data/              # DbContext
│
├── admin/                     # Admin Panel (HTML/JS)
├── user/                      # Kullanıcı Paneli (HTML/JS)
├── scripts/                   # Ortak JS (login/register)
├── styles/                    # CSS dosyaları
└── sql/                       # Trigger ve migration'lar
```

---

## 🚀 Kurulum

### Gereksinimler
- .NET SDK 8.0+
- MySQL 8.0+
- Modern web tarayıcı

### 1. Veritabanı
```bash
mysql -u root -p
CREATE DATABASE kutuphane CHARACTER SET utf8mb4;
```

### 2. Backend
```bash
cd KutuphaneApi/ktphnAPI

# appsettings.Development.json'u düzenle:
# - ConnectionStrings.DefaultConnection → MySQL bağlantısı
# - Jwt.Key → En az 32 karakterlik gizli anahtar

dotnet restore
dotnet run
```

### 3. Frontend
```bash
# Herhangi bir web sunucusu ile serve et
python -m http.server 8080
# veya VS Code Live Server eklentisi
```

**Erişim:** http://localhost:8080/login.html

---

## 📡 API Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/auth/login` | Giriş yap, JWT token al |
| `POST /api/auth/register` | Yeni hesap oluştur |
| `GET /api/kitaplar/public` | Kitap listesi (paginated) |
| `GET /api/kitaplar/public/search` | Kitap arama ve filtreleme |
| `POST /api/islemler/odunc-al` | Kitap ödünç al |
| `POST /api/islemler/iade-et` | Kitap iade et |
| `GET /api/rezervasyonlar` | Rezervasyonlar |
| `GET /api/cezalar/benim-cezalarim` | Kullanıcının cezaları |

> Tüm endpoint listesi için [PROJE_RAPORU.md](PROJE_RAPORU.md#-api-endpoints) dosyasına bakın.

---

## 🗄️ Veritabanı

### Tablolar
| Tablo | Açıklama |
|-------|----------|
| `uyeler` | Kullanıcı hesapları |
| `kitaplar` | Kitap koleksiyonu |
| `kitap_islemler` | Ödünç/iade işlemleri |
| `rezervasyonlar` | Kitap rezervasyonları |
| `ceza_islemleri` | Gecikme cezaları |
| `roller` | Yetki rolleri (ogrenci, admin...) |
| `kullanici_roller` | Üye-rol ilişkisi |

### Trigger'lar (Otomatik İş Kuralları)
- 📗 Kitap ödünç alındığında → durum "odunc" olur
- 📘 Kitap iade edildiğinde → durum "musait" olur
- ⚠️ 14 günü geçen iade → otomatik ceza oluşur (günlük 5₺)

---

## 📊 Proje İstatistikleri

| Metrik | Değer |
|--------|-------|
| Backend Controller | 7 |
| API Endpoint | ~35 |
| Veritabanı Tablosu | 10 |
| Trigger | 8 |
| Frontend Sayfa | ~12 |

---

## 📄 Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| [PROJE_RAPORU.md](PROJE_RAPORU.md) | Detaylı teknik dokümantasyon, kod örnekleri |
| [HATALAR_VE_EKSIKLER.md](HATALAR_VE_EKSIKLER.md) | Bilinen sorunlar ve öneriler |

---


**Son Güncelleme:** Aralık 2025  
**Versiyon:** 1.0