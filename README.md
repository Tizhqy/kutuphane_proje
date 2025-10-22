# 📚 KTU Kütüphane Yönetim Sistemi

Bu proje, **Karadeniz Teknik Üniversitesi (KTÜ)** için geliştirilmiş modern ve kapsamlı bir **dijital kütüphane yönetim sistemi**dir.
Hem **yönetici** hem de **kullanıcı** arayüzleri ile kitap, üye ve ödünç işlemlerinin etkin bir şekilde yönetilebilmesini sağlar.

---

## 🎯 Proje Amacı
- Kütüphane işlemlerinin dijitalleştirilmesi
- Kitap ve üye yönetiminin optimize edilmesi
- Kullanıcı dostu, modern web arayüzü sunması
- Responsive tasarım ile her cihazda kullanılabilirlik
- KTÜ öğrenci ve personeli için entegre kütüphane deneyimi

---

## ✨ Temel Özellikler

### 👨‍💼 Yönetici Paneli
- **📊 Dashboard**: Gerçek zamanlı istatistikler ve özet bilgiler
- **📚 Kitap Yönetimi**: Ekleme, düzenleme, silme ve listeleme
- **👥 Üye Yönetimi**: Öğrenci, personel ve akademisyen kaydı
- **📋 İşlem Takibi**: Ödünç alma, iade ve geciken kitaplar
- **🔍 Gelişmiş Arama**: Filtreleme ve sıralama seçenekleri

### 👨‍🎓 Kullanıcı Arayüzü
- **🏠 Kişisel Dashboard**: Ödünç alınan kitaplar ve durum takibi
- **📖 Kitap Kataloğu**: Gelişmiş filtreleme ile kitap arama
- **📑 Kitaplarım**: Mevcut ödünç alınan kitapların yönetimi
- **📅 Rezervasyonlar**: Kitap rezervasyon sistemi
- **👤 Profil Yönetimi**: Kişisel bilgi güncelleme

---

## 🏗️ Teknik Yapı

### **Frontend Teknolojileri**
- **HTML5**: Modern semantik yapı
- **CSS3**: Responsive tasarım ve animasyonlar
- **JavaScript**: İnteraktif kullanıcı deneyimi
- **Font Awesome**: Profesyonel ikon seti

### **Tasarım Sistemi**
- **Ana Renk**: #1a237e (KTÜ Mavi)
- **Tasarım**: Material Design ilkeleri
- **Responsive**: Mobile-first yaklaşımı
- **Erişilebilirlik**: WCAG standartlarına uygun

### **Veritabanı Yapısı**
- **MySQL**: İlişkisel veritabanı
- **7 Ana Tablo**: Kullanıcı, rol ve yetki yönetimi
- **Güvenlik**: Şifreli authentication sistemi
- **Performans**: İndekslenmiş sorgular

## 📊 **Veritabanı ER Diagramı**

![Veritabanı ER Diagramı](images/er-diagram.svg)

*Yukarıdaki diagram, sistemin tüm tablo ilişkilerini ve veri yapısını göstermektedir.*

---

## � Proje Dosya Yapısı

### **🎨 Ana Sayfa & Pazarlama**
- `anasyafa.html` → Kütüphane tanıtım ve landing page
- `anasayfa.css` → Ana sayfa özel stilleri

### **�‍💼 Yönetici Paneli**
- `index.html` → Admin dashboard (istatistikler)
- `kitaplar.html` → Kitap yönetimi sayfası
- `uyeler.html` → Üye yönetimi sayfası
- `islemler.html` → İşlem takip sayfası
- `style.css` → Admin paneli ana stylesheet

### **�‍🎓 Kullanıcı Arayüzü**
- `user-dashboard.html` → Kullanıcı ana paneli
- `user-kitaplar.html` → Kitap kataloğu
- `user-kitaplarim.html` → Kişisel kitap listesi
- `user-reservations.html` → Rezervasyon yönetimi
- `user-profile.html` → Profil sayfası
- `ustyle.css` → Kullanıcı arayüzü stylesheet

### **� Kimlik Doğrulama**
- `login.html` → Giriş sayfası (admin/kullanıcı)

### **🎨 Medya & Kaynaklar**
- `images/` → Logo ve görseller  
- `README.md` → Proje dokümantasyonu

---

## 🚀 Kurulum ve Çalıştırma

### **Gereksinimler**
- Modern web tarayıcı (Chrome, Firefox, Safari, Edge)
- **VS Code** + **Live Server** eklentisi (önerilen)
- Git (versiyon kontrolü için)

### **Adım 1: Projeyi İndirin**
```bash
git clone https://github.com/Tizhqy/kutuphane_proje.git
cd kutuphane_projesi
```

### **Adım 2: Geliştirme Sunucusunu Başlatın**
1. **VS Code ile açın**: `code .`
2. **Live Server eklentisini yükleyin**
3. **Ana dosyalardan birine sağ tıklayın** → "Open with Live Server"

### **Alternatif Çalıştırma Yöntemleri**
```bash
# Python ile basit sunucu
python -m http.server 8000

# Node.js ile
npx serve .

# PHP ile
php -S localhost:8000
```

---

## 🌐 Sayfa Gezintisi

### **📱 Kullanıcı Deneyimi**
| Sayfa | URL | Açıklama |
|-------|-----|----------|
| 🏠 Ana Sayfa | `anasyafa.html` | Kütüphane tanıtım ve özellikler |
| 🔐 Giriş | `login.html` | Admin/Kullanıcı girişi |
| 👨‍🎓 Kullanıcı Dashboard | `user-dashboard.html` | Kişisel kitap yönetimi |
| 📚 Kitap Kataloğu | `user-kitaplar.html` | Kitap arama ve rezervasyon |

### **⚙️ Yönetici Paneli**
| Sayfa | URL | Açıklama |
|-------|-----|----------|
| 📊 Admin Dashboard | `index.html` | İstatistikler ve genel bakış |
| 📖 Kitap Yönetimi | `kitaplar.html` | CRUD işlemleri |
| 👥 Üye Yönetimi | `uyeler.html` | Kullanıcı kaydı ve düzenleme |
| 📋 İşlem Takibi | `islemler.html` | Ödünç alma/iade işlemleri |

---

## 🛠️ Geliştirilecek Özellikler

### **🔮 Yakın Gelecek (v2.0)**
- **Backend Entegrasyonu**: Flask/Django + PostgreSQL/MySQL
- **Kimlik Doğrulama**: JWT tabanlı güvenli giriş
- **API Geliştirme**: RESTful API servisleri
- **Bildirim Sistemi**: Email/SMS hatırlatmaları
- **Gelişmiş Arama**: ElasticSearch entegrasyonu

### **📈 Uzun Vadeli (v3.0)**
- **Mobil Uygulama**: React Native/Flutter
- **QR Kod Sistemi**: Kitap tarama ve ödünç alma
- **Yapay Zeka**: Kitap öneri sistemi
- **Multi-dil Desteği**: İngilizce/Türkçe
- **Analitik Dashboard**: Kullanım istatistikleri

---

### **Kod Standartları**
- **HTML**: Semantic yapı, accessibility
- **CSS**: BEM metodolojisi, mobile-first
- **JavaScript**: ES6+ standartları
- **Commit**: Conventional Commits formatı

---

## 📊 Proje İstatistikleri

![GitHub stars](https://img.shields.io/github/stars/Tizhqy/kutuphane_proje?style=social)
![GitHub forks](https://img.shields.io/github/forks/Tizhqy/kutuphane_proje?style=social)
![GitHub issues](https://img.shields.io/github/issues/Tizhqy/kutuphane_proje)

**Son Güncelleme**: Ekim 2025  
**Sürüm**: v0.15
**Durum**: Aktif Geliştirme 🚀
