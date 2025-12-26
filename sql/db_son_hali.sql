-- ============================================================================
-- KÜTÜPHANE YÖNETİM SİSTEMİ - VERİTABANI SON HALİ
-- ============================================================================
-- Bu dosya veritabanının tamamını sıfırdan oluşturmak için kullanılabilir.
-- Oluşturulma Tarihi: 2025-12-23
-- MySQL 8.0+ gereklidir
-- ============================================================================

-- Veritabanı oluştur (gerekirse)
-- CREATE DATABASE IF NOT EXISTS kutuphanedb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE kutuphanedb;

-- ============================================================================
-- BÖLÜM 1: TABLOLAR
-- ============================================================================
-- Önce bağımsız tablolar, sonra foreign key bağımlı tablolar oluşturulur.
-- Sıra: roller -> yetkiler -> uyeler -> kitaplar -> kullanici_roller -> 
--       rol_yetkiler -> kitap_islemler -> rezervasyonlar -> ceza_config -> ceza_islemleri

-- ----------------------------------------------------------------------------
-- 1.1 ROLLER TABLOSU
-- Kullanıcı rollerini tanımlar (öğrenci, personel, akademisyen, admin, super_admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roller` (
  `rol_id` int NOT NULL AUTO_INCREMENT,
  `rol_adi` varchar(255) NOT NULL,
  `aciklama` text,
  `yetki_seviyesi` int DEFAULT '1',
  `olusturma_tarihi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `rol_adi` (`rol_adi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.2 YETKİLER TABLOSU
-- Sistem yetkilerini tanımlar (CRUD operasyonları)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `yetkiler` (
  `yetki_id` int NOT NULL AUTO_INCREMENT,
  `yetki_adi` varchar(100) NOT NULL,
  `modul` varchar(50) NOT NULL,
  `islem` varchar(50) NOT NULL,
  `aciklama` text,
  PRIMARY KEY (`yetki_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.3 ÜYELER TABLOSU
-- Kütüphane üyelerini (kullanıcılarını) tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `uyeler` (
  `uye_id` int NOT NULL AUTO_INCREMENT,
  `uye_ad_soyad` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `sifre` varchar(255) NOT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `ogrenci_no` varchar(100) DEFAULT NULL,
  `durum` enum('aktif','pasif','askida') DEFAULT 'aktif',
  `kayit_tarihi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `son_giris` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`uye_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `ogrenci_no` (`ogrenci_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.4 KİTAPLAR TABLOSU
-- Kütüphanedeki kitapların bilgilerini tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kitaplar` (
  `kitap_id` int NOT NULL AUTO_INCREMENT,
  `kitap_adi` varchar(255) NOT NULL,
  `yazar` varchar(255) NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `kategori` varchar(100) DEFAULT NULL,
  `sayfa_sayisi` int DEFAULT NULL,
  `yayin_yili` int DEFAULT NULL,
  `durum` enum('musait','odunc','bakim') DEFAULT 'musait',
  `ekleme_tarihi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`kitap_id`),
  UNIQUE KEY `isbn` (`isbn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.5 KULLANICI_ROLLER TABLOSU (Many-to-Many: uyeler <-> roller)
-- Hangi kullanıcının hangi rollere sahip olduğunu tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kullanici_roller` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uye_id` int NOT NULL,
  `rol_id` int NOT NULL,
  `atama_tarihi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_uye_rol` (`uye_id`,`rol_id`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `kullanici_roller_ibfk_1` FOREIGN KEY (`uye_id`) REFERENCES `uyeler` (`uye_id`) ON DELETE CASCADE,
  CONSTRAINT `kullanici_roller_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `roller` (`rol_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.6 ROL_YETKİLER TABLOSU (Many-to-Many: roller <-> yetkiler)
-- Hangi rolün hangi yetkilere sahip olduğunu tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rol_yetkiler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rol_id` int NOT NULL,
  `yetki_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`rol_id`,`yetki_id`),
  KEY `yetki_id` (`yetki_id`),
  CONSTRAINT `rol_yetkiler_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roller` (`rol_id`) ON DELETE CASCADE,
  CONSTRAINT `rol_yetkiler_ibfk_2` FOREIGN KEY (`yetki_id`) REFERENCES `yetkiler` (`yetki_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.7 KİTAP_İŞLEMLER TABLOSU
-- Ödünç alma, iade, rezervasyon gibi tüm kitap işlemlerini loglar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kitap_islemler` (
  `islem_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uye_id` int NOT NULL,
  `kitap_id` int NOT NULL,
  `islem_turu` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `alim_tarihi` datetime DEFAULT NULL,
  `iade_tarihi` datetime DEFAULT NULL,
  `durum` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `olusturma_tarihi` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`islem_id`),
  KEY `idx_uye_id` (`uye_id`),
  KEY `idx_kitap_id` (`kitap_id`),
  KEY `idx_islem_turu` (`islem_turu`),
  KEY `idx_tarih` (`olusturma_tarihi`),
  KEY `idx_kitap_islemler_durum` (`durum`),
  CONSTRAINT `fk_islemler_kitap` FOREIGN KEY (`kitap_id`) REFERENCES `kitaplar` (`kitap_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_islemler_uye` FOREIGN KEY (`uye_id`) REFERENCES `uyeler` (`uye_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 1.8 REZERVASYONLAR TABLOSU
-- Kitap rezervasyonlarını tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rezervasyonlar` (
  `rezervasyon_id` int NOT NULL AUTO_INCREMENT,
  `uye_id` int NOT NULL,
  `kitap_id` int NOT NULL,
  `baslangic_tarihi` datetime NOT NULL,
  `bitis_tarihi` datetime NOT NULL,
  `durum` varchar(50) NOT NULL DEFAULT 'aktif',
  `olusturma_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `iptal_tarihi` datetime DEFAULT NULL,
  PRIMARY KEY (`rezervasyon_id`),
  KEY `idx_rez_uye` (`uye_id`),
  KEY `idx_rez_kitap` (`kitap_id`),
  KEY `idx_rez_durum` (`durum`),
  CONSTRAINT `fk_rez_kitap` FOREIGN KEY (`kitap_id`) REFERENCES `kitaplar` (`kitap_id`),
  CONSTRAINT `fk_rez_uye` FOREIGN KEY (`uye_id`) REFERENCES `uyeler` (`uye_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 1.9 CEZA_CONFIG TABLOSU
-- Ceza sistemi ayarlarını dinamik olarak tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ceza_config` (
  `config_id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aciklama` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 1.10 CEZA_İŞLEMLERİ TABLOSU
-- Geç iade, hasar, kayıp vb. cezaları tutar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ceza_islemleri` (
  `ceza_id` int NOT NULL AUTO_INCREMENT,
  `uye_id` int NOT NULL,
  `islem_id` bigint unsigned NOT NULL,
  `kitap_id` int NOT NULL,
  `ceza_turu` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'geciken_kitap, hasar, kayip',
  `ceza_tarihi` datetime DEFAULT CURRENT_TIMESTAMP,
  `son_odeme_tarihi` datetime DEFAULT NULL,
  `odeme_tarihi` datetime DEFAULT NULL,
  `ceza_tutari` decimal(10,2) NOT NULL DEFAULT '0.00',
  `durum` enum('aktif','odemendi','afedildi') COLLATE utf8mb4_unicode_ci DEFAULT 'aktif',
  `aciklama` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `son_mail_tarihi` datetime DEFAULT NULL,
  PRIMARY KEY (`ceza_id`),
  KEY `islem_id` (`islem_id`),
  KEY `kitap_id` (`kitap_id`),
  KEY `idx_uye_durum` (`uye_id`,`durum`),
  KEY `idx_ceza_tarihi` (`ceza_tarihi`),
  CONSTRAINT `ceza_islemleri_ibfk_1` FOREIGN KEY (`uye_id`) REFERENCES `uyeler` (`uye_id`) ON DELETE CASCADE,
  CONSTRAINT `ceza_islemleri_ibfk_2` FOREIGN KEY (`islem_id`) REFERENCES `kitap_islemler` (`islem_id`) ON DELETE CASCADE,
  CONSTRAINT `ceza_islemleri_ibfk_3` FOREIGN KEY (`kitap_id`) REFERENCES `kitaplar` (`kitap_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BÖLÜM 2: TRIGGER'LAR
-- ============================================================================
-- İş mantığını veritabanı seviyesinde uygular.
-- 8 adet trigger tanımlıdır.

DELIMITER //

-- ----------------------------------------------------------------------------
-- 2.1 ÖDÜNÇ ALMA TRİGGER'I
-- Kitap ödünç alındığında durumu 'odunc' olarak günceller
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS kitap_odunc_after_insert//
CREATE TRIGGER kitap_odunc_after_insert
AFTER INSERT ON kitap_islemler
FOR EACH ROW
BEGIN
    IF NEW.islem_turu = 'odunc' THEN
        UPDATE kitaplar 
        SET durum = 'odunc' 
        WHERE kitap_id = NEW.kitap_id;
    END IF;
END//

-- ----------------------------------------------------------------------------
-- 2.2 İADE TRİGGER'I
-- Kitap iade edildiğinde durumu 'musait' olarak günceller
-- Aynı kitabın başka aktif ödüncü yoksa günceller
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS kitap_iade_after_update//
CREATE TRIGGER kitap_iade_after_update
AFTER UPDATE ON kitap_islemler
FOR EACH ROW
BEGIN
    -- İade tarihi yeni set edildiyse
    IF NEW.iade_tarihi IS NOT NULL AND OLD.iade_tarihi IS NULL THEN
        -- Aynı kitabın başka aktif ödüncü var mı kontrol et
        IF NOT EXISTS (
            SELECT 1 FROM kitap_islemler 
            WHERE kitap_id = NEW.kitap_id 
            AND islem_turu = 'odunc' 
            AND iade_tarihi IS NULL 
            AND islem_id != NEW.islem_id
        ) THEN
            -- Yoksa kitabı müsait yap
            UPDATE kitaplar 
            SET durum = 'musait' 
            WHERE kitap_id = NEW.kitap_id;
        END IF;
    END IF;
END//

-- ----------------------------------------------------------------------------
-- 2.3 OTOMATİK CEZA OLUŞTURMA TRİGGER'I
-- İade yapıldığında, gecikmeli ise otomatik ceza kaydı oluşturur
-- Ödünç süresi: 14 gün
-- Günlük ceza: 5 TL
-- Maksimum ceza: 500 TL
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_otomatik_ceza_olustur//
CREATE TRIGGER trg_otomatik_ceza_olustur
AFTER UPDATE ON kitap_islemler
FOR EACH ROW
BEGIN
    DECLARE gecik_gun INT;
    DECLARE ceza_tutari DECIMAL(10, 2);
    
    -- Yeni iade tarihi set edildiyse
    IF (OLD.iade_tarihi IS NULL AND NEW.iade_tarihi IS NOT NULL) THEN
        -- Gecikme gün sayısını hesapla (14 gün ödünç süresi)
        SET gecik_gun = DATEDIFF(NEW.iade_tarihi, DATE_ADD(OLD.alim_tarihi, INTERVAL 14 DAY));
        
        -- Gecikmeli ise ceza oluştur
        IF gecik_gun > 0 THEN
            -- Ceza tutarını hesapla (günlük 5 TL)
            SET ceza_tutari = gecik_gun * 5.00;
            
            -- Maksimum 500 TL
            IF ceza_tutari > 500.00 THEN
                SET ceza_tutari = 500.00;
            END IF;
            
            -- Ceza kaydı oluştur
            INSERT INTO `ceza_islemleri` 
            (`uye_id`, `islem_id`, `kitap_id`, `ceza_turu`, `ceza_tarihi`, `son_odeme_tarihi`, `ceza_tutari`, `durum`, `aciklama`)
            VALUES 
            (NEW.uye_id, NEW.islem_id, NEW.kitap_id, 'geciken_kitap', NOW(), 
             DATE_ADD(NOW(), INTERVAL 7 DAY),
             ceza_tutari, 'aktif', CONCAT(gecik_gun, ' gün gecikmeli iade - Otomatik ceza'));
        END IF;
    END IF;
END//

-- ----------------------------------------------------------------------------
-- 2.4 REZERVASYON ÇAKIŞMA KONTROLÜ TRİGGER'I
-- Aynı kitap için aynı tarih aralığında çakışan aktif rezervasyon varsa engeller
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_rezervasyonlar_no_overlap//
CREATE TRIGGER trg_rezervasyonlar_no_overlap
BEFORE INSERT ON rezervasyonlar
FOR EACH ROW
BEGIN
    IF NEW.durum = 'aktif' THEN
        IF EXISTS (
            SELECT 1 FROM rezervasyonlar r
            WHERE r.kitap_id = NEW.kitap_id
              AND r.durum = 'aktif'
              AND NOT (NEW.bitis_tarihi < r.baslangic_tarihi OR NEW.baslangic_tarihi > r.bitis_tarihi)
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bu kitap için çakışan aktif rezervasyon var';
        END IF;
    END IF;
END//

-- ----------------------------------------------------------------------------
-- 2.5 REZERVASYON TARİH DOĞRULAMA (INSERT)
-- Rezervasyon oluşturulurken tarih kontrolü yapar
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_rezervasyon_validate_dates_ins//
CREATE TRIGGER trg_rezervasyon_validate_dates_ins
BEFORE INSERT ON rezervasyonlar
FOR EACH ROW
BEGIN
    IF NEW.baslangic_tarihi IS NULL OR NEW.bitis_tarihi IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rezervasyon başlangıç ve bitiş tarihi zorunludur';
    END IF;
    IF NEW.baslangic_tarihi >= NEW.bitis_tarihi THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rezervasyon bitiş tarihi başlangıçtan sonra olmalıdır';
    END IF;
END//

-- ----------------------------------------------------------------------------
-- 2.6 REZERVASYON TARİH DOĞRULAMA (UPDATE)
-- Rezervasyon güncellenirken tarih kontrolü yapar
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_rezervasyon_validate_dates_upd//
CREATE TRIGGER trg_rezervasyon_validate_dates_upd
BEFORE UPDATE ON rezervasyonlar
FOR EACH ROW
BEGIN
    IF NEW.baslangic_tarihi IS NULL OR NEW.bitis_tarihi IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rezervasyon başlangıç ve bitiş tarihi zorunludur';
    END IF;
    IF NEW.baslangic_tarihi >= NEW.bitis_tarihi THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rezervasyon bitiş tarihi başlangıçtan sonra olmalıdır';
    END IF;
END//

-- ----------------------------------------------------------------------------
-- 2.7 REZERVASYON LOG TRİGGER'I (OLUŞTUR)
-- Rezervasyon oluşturulduğunda kitap_islemler tablosuna log kaydı ekler
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_rezervasyon_after_insert//
CREATE TRIGGER trg_rezervasyon_after_insert
AFTER INSERT ON rezervasyonlar
FOR EACH ROW
BEGIN
    INSERT INTO kitap_islemler (uye_id, kitap_id, islem_turu, durum, metadata, olusturma_tarihi)
    VALUES (
        NEW.uye_id,
        NEW.kitap_id,
        'rezervasyon-olustur',
        'rezervasyon',
        JSON_OBJECT(
            'baslangic_tarihi', DATE_FORMAT(NEW.baslangic_tarihi, '%Y-%m-%dT%H:%i:%sZ'),
            'bitis_tarihi', DATE_FORMAT(NEW.bitis_tarihi, '%Y-%m-%dT%H:%i:%sZ')
        ),
        NOW()
    );
END//

-- ----------------------------------------------------------------------------
-- 2.8 REZERVASYON LOG TRİGGER'I (İPTAL)
-- Rezervasyon iptal edildiğinde kitap_islemler tablosuna log kaydı ekler
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_rezervasyon_after_update//
CREATE TRIGGER trg_rezervasyon_after_update
AFTER UPDATE ON rezervasyonlar
FOR EACH ROW
BEGIN
    IF NEW.durum = 'iptal' AND (OLD.durum IS NULL OR OLD.durum <> 'iptal') THEN
        INSERT INTO kitap_islemler (uye_id, kitap_id, islem_turu, durum, metadata, olusturma_tarihi)
        VALUES (
            NEW.uye_id,
            NEW.kitap_id,
            'rezervasyon-iptal',
            'rezervasyon',
            JSON_OBJECT(
                'baslangic_tarihi', DATE_FORMAT(NEW.baslangic_tarihi, '%Y-%m-%dT%H:%i:%sZ'),
                'bitis_tarihi', DATE_FORMAT(NEW.bitis_tarihi, '%Y-%m-%dT%H:%i:%sZ'),
                'iptal_tarihi', DATE_FORMAT(NEW.iptal_tarihi, '%Y-%m-%dT%H:%i:%sZ')
            ),
            NOW()
        );
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- BÖLÜM 3: BAŞLANGIÇ VERİLERİ (SEED DATA)
-- ============================================================================
-- Sistem çalışması için gerekli temel veriler

-- ----------------------------------------------------------------------------
-- 3.1 ROLLER (Kullanıcı Rolleri)
-- ----------------------------------------------------------------------------
INSERT INTO `roller` (`rol_id`, `rol_adi`, `aciklama`, `yetki_seviyesi`) VALUES
(1, 'ogrenci', 'Öğrenci kullanıcısı', 1),
(2, 'personel', 'Üniversite personeli', 2),
(3, 'akademisyen', 'Akademik personel', 3),
(4, 'admin', 'Sistem yöneticisi', 4),
(5, 'super_admin', 'Ana sistem yöneticisi', 5)
ON DUPLICATE KEY UPDATE `aciklama` = VALUES(`aciklama`), `yetki_seviyesi` = VALUES(`yetki_seviyesi`);

-- ----------------------------------------------------------------------------
-- 3.2 YETKİLER (Sistem Yetkileri)
-- ----------------------------------------------------------------------------
INSERT INTO `yetkiler` (`yetki_id`, `yetki_adi`, `modul`, `islem`, `aciklama`) VALUES
(1, 'kitap_goruntule', 'kitaplar', 'read', 'Kitapları görüntüleyebilir'),
(2, 'kitap_ekle', 'kitaplar', 'create', 'Yeni kitap ekleyebilir'),
(3, 'kitap_duzenle', 'kitaplar', 'update', 'Kitap bilgilerini düzenleyebilir'),
(4, 'kitap_sil', 'kitaplar', 'delete', 'Kitap silebilir'),
(5, 'uye_goruntule', 'uyeler', 'read', 'Üyeleri görüntüleyebilir'),
(6, 'admin_panel', 'sistem', 'manage', 'Admin paneline erişebilir')
ON DUPLICATE KEY UPDATE `aciklama` = VALUES(`aciklama`);

-- ----------------------------------------------------------------------------
-- 3.3 CEZA AYARLARI (Ceza Sistemi Konfigürasyonu)
-- Not: CezaHesaplaPeakService bu değerleri dinamik olarak okur
-- Trigger'lar şu an sabit değerler kullanıyor (5 TL, 500 TL)
-- ----------------------------------------------------------------------------
INSERT INTO `ceza_config` (`config_key`, `config_value`, `aciklama`) VALUES
('GUNLUK_CEZA_TUTARI', '5.00', 'Günü geçen her gün için ceza tutarı (TL)'),
('MAKSIMUM_CEZA_TUTARI', '500.00', 'Tek ceza için maksimum tutarı'),
('ODEME_SURESI_GUN', '7', 'Ceza ödeme süresi (gün)'),
('CEZA_KONTROL_SAATI_SANIYE', '86400', 'Ceza kontrolü kaç saniyede bir çalışır (prod: 86400=1gün, test: 60)'),
('CEZA_MAIL_GECIKME_GUN', '0', 'Ceza maili kaç gün sonra gönderilsin (0=anında)')
ON DUPLICATE KEY UPDATE `config_value` = VALUES(`config_value`), `aciklama` = VALUES(`aciklama`);

-- ============================================================================
-- BÖLÜM 4: ÖRNEK ADMİN KULLANICISI (İSTEĞE BAĞLI)
-- ============================================================================
-- Sisteme ilk giriş için bir admin kullanıcı oluşturabilirsiniz.
-- Şifre BCrypt ile hashlenmiştir, aşağıdaki örnek "Admin123!" şifresine karşılık gelir.

-- INSERT INTO `uyeler` (`uye_ad_soyad`, `email`, `sifre`, `telefon`, `ogrenci_no`, `durum`) VALUES
-- ('Sistem Admin', 'admin@kutuphane.com', '$2a$11$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '5551234567', NULL, 'aktif');
--
-- Sonra admin rolü atamak için:
-- INSERT INTO `kullanici_roller` (`uye_id`, `rol_id`) 
-- SELECT uye_id, 4 FROM uyeler WHERE email = 'admin@kutuphane.com';

-- ============================================================================
-- NOTLAR VE AÇIKLAMALAR
-- ============================================================================
--
-- 1. TRIGGER MANTIK AKIŞI:
--    - Kitap ödünç alındığında: kitap_odunc_after_insert → kitap durumu 'odunc' olur
--    - Kitap iade edildiğinde: kitap_iade_after_update → kitap durumu 'musait' olur
--                            + trg_otomatik_ceza_olustur → gecikmeli ise ceza oluşur
--    - Rezervasyon yapıldığında: trg_rezervasyonlar_no_overlap → çakışma kontrolü
--                               + trg_rezervasyon_validate_dates_ins → tarih kontrolü
--                               + trg_rezervasyon_after_insert → log kaydı
--    - Rezervasyon iptal: trg_rezervasyon_after_update → log kaydı
--
-- 2. ÖDÜNÇ SÜRESİ: 14 gün (trigger'da hardcoded)
--
-- 3. CEZA HESAPLAMA:
--    - Günlük: 5 TL (trigger'da hardcoded, config'de de var)
--    - Maksimum: 500 TL (trigger'da hardcoded, config'de de var)
--    - CezaHesaplaPeakService ceza_config'i dinamik okur
--
-- 4. JWT TOKEN SÜRESİ: appsettings.json'da TokenExpirationMinutes = 120
--
-- 5. RATE LIMITING:
--    - Global: 100 istek/dakika
--    - Login: 5 istek/dakika
--    - Register: 3 istek/10 dakika
--
-- ============================================================================
-- KULLANIM
-- ============================================================================
-- Yeni veritabanı oluşturmak için:
-- 1. MySQL'e bağlan
-- 2. CREATE DATABASE kutuphanedb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 3. USE kutuphanedb;
-- 4. Bu dosyayı çalıştır: source /path/to/db_son_hali.sql
--
-- ============================================================================
