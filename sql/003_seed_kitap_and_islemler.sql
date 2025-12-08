-- Seed 3 example rows into kitap_islemler and add triggers to update kitaplar.durum
-- IMPORTANT: verify that uye_id 1,2,3 exist in `uyeler` before running this file.
-- Also verify kitap_id values exist (you listed available kitap_id values earlier).

USE kutuphane;

-- Optional checks (run and confirm results before INSERT):
SELECT 'uyeler_check' AS note, uye_id, email FROM uyeler WHERE uye_id IN (1,2,3);
SELECT 'kitaplar_check' AS note, kitap_id, kitap_adi, durum FROM kitaplar WHERE kitap_id IN (58,34,50);

-- Insert 3 test operations (use kitap_id values you provided: 58,34,50)
INSERT INTO `kitap_islemler`
  (`uye_id`, `kitap_id`, `islem_turu`, `metadata`, `alim_tarihi`, `iade_tarihi`, `durum`, `user_agent`)
VALUES
  (1, 58, 'odunc', JSON_OBJECT('note','Örnek ödünç alım'), '2025-12-01 10:00:00', NULL, 'odunc', 'Mozilla/5.0 (Test)'),
  (2, 34, 'iade',  JSON_OBJECT('note','Zamanında iade'), '2025-11-10 09:00:00', '2025-11-20 11:00:00', 'iade',  'curl/7.68.0'),
  (3, 50, 'odunc', JSON_OBJECT('due_date','2025-12-15'), '2025-12-02 14:00:00', NULL, 'odunc', 'PostmanRuntime/7.28.0');

-- Trigger: after insert, update kitaplar.durum according to islem
DELIMITER //
CREATE TRIGGER trg_after_insert_kitap_islem
AFTER INSERT ON kitap_islemler
FOR EACH ROW
BEGIN
  -- If operation indicates borrow, mark kitap as odunc
  IF NEW.durum = 'odunc' OR NEW.islem_turu = 'odunc' THEN
    UPDATE kitaplar SET durum = 'odunc' WHERE kitap_id = NEW.kitap_id;
  -- If operation indicates return, mark kitap as musait
  ELSEIF NEW.durum = 'iade' OR NEW.islem_turu = 'iade' THEN
    UPDATE kitaplar SET durum = 'musait' WHERE kitap_id = NEW.kitap_id;
  END IF;
END;
//
DELIMITER ;

-- Trigger: after update, react to durum changes (e.g., when an islem is updated to 'iade')
DELIMITER //
CREATE TRIGGER trg_after_update_kitap_islem
AFTER UPDATE ON kitap_islemler
FOR EACH ROW
BEGIN
  IF OLD.durum <> NEW.durum THEN
    IF NEW.durum = 'iade' THEN
      UPDATE kitaplar SET durum = 'musait' WHERE kitap_id = NEW.kitap_id;
    ELSEIF NEW.durum = 'odunc' THEN
      UPDATE kitaplar SET durum = 'odunc' WHERE kitap_id = NEW.kitap_id;
    END IF;
  END IF;
END;
//
DELIMITER ;

-- Notes:
-- 1) If you prefer triggers not to auto-update kitaplar (for preserving history or to centralize logic in app layer), skip trigger creation.
-- 2) Test the INSERTs first; if you get FK errors, check that the kitap_id and uye_id values exist (use the SELECT checks above).
