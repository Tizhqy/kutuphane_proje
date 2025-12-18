using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;

namespace ktphnAPI.Services
{
    public class CezaHesaplaPeakService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CezaHesaplaPeakService> _logger;
        private int _kontrolAraligi = 60000; // 60 saniye (1 dakika)

        public CezaHesaplaPeakService(IServiceProvider serviceProvider, ILogger<CezaHesaplaPeakService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Ceza Hesaplama Servisi başladı. Kontrol aralığı: {interval}ms", _kontrolAraligi);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await HesaplaVeGuncelleAsync();
                    await Task.Delay(_kontrolAraligi, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ceza hesaplama hatasında oluştu");
                    await Task.Delay(_kontrolAraligi, stoppingToken);
                }
            }
        }

        private async Task HesaplaVeGuncelleAsync()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                try
                {
                    // Konfigürasyondan değerleri al
                    var gunlukCezaStr = await context.CezaKonfigurasyonu
                        .Where(c => c.ConfigKey == "GUNLUK_CEZA_TUTARI")
                        .Select(c => c.ConfigValue)
                        .FirstOrDefaultAsync();

                    var maksimumCezaStr = await context.CezaKonfigurasyonu
                        .Where(c => c.ConfigKey == "MAKSIMUM_CEZA_TUTARI")
                        .Select(c => c.ConfigValue)
                        .FirstOrDefaultAsync();

                    // Ceza mailinin kaç gün gecikmeden sonra gönderileceğini belirleyen ayar
                    // Örn: CEZA_MAIL_GECIKME_GUN = 3  -> 3 günden fazla gecikmişse mail gönder
                    var mailGecikmeGunStr = await context.CezaKonfigurasyonu
                        .Where(c => c.ConfigKey == "CEZA_MAIL_GECIKME_GUN")
                        .Select(c => c.ConfigValue)
                        .FirstOrDefaultAsync();

                    decimal gunlukCeza = decimal.TryParse(gunlukCezaStr, out var gc) ? gc : 5.00m;
                    decimal maksimumCeza = decimal.TryParse(maksimumCezaStr, out var mc) ? mc : 500.00m;
                    int mailGecikmeGun = int.TryParse(mailGecikmeGunStr, out var mg) ? mg : 0;

                    // Ödenmemiş ve vadesi geçen cezaları "odemendi" yap
                    var gecmisCezalar = await context.CezaIslemleri
                        .Where(c => c.Durum == "aktif" && c.SonOdemeTarihi < DateTime.UtcNow && c.OdemeTarihi == null)
                        .ToListAsync();

                    foreach (var ceza in gecmisCezalar)
                    {
                        ceza.Durum = "odemendi";
                        ceza.UpdatedAt = DateTime.UtcNow;
                    }

                    if (gecmisCezalar.Any())
                    {
                        await context.SaveChangesAsync();
                        _logger.LogInformation("Vade geçmiş {count} ceza güncellendi", gecmisCezalar.Count);
                    }

                    // Iade edilmemiş ve 14 günü geçmiş kitaplar için otomatik ceza oluştur
                    var gecikmisSorgu = context.İslemler
                        .Include(i => i.Uye)
                        .Include(i => i.Kitap)
                        .Where(i => i.IadeTarihi == null &&
                                   i.AlimTarihi.HasValue &&
                                   i.AlimTarihi.Value.AddDays(14) < DateTime.UtcNow)
                        .ToList();

                    var yeniCezalarCount = 0;

                    foreach (var islem in gecikmisSorgu)
                    {
                        // Zaten ceza var mı kontrol et
                        var cekaVarMi = await context.CezaIslemleri
                            .Where(c => c.IslemId == islem.Id && 
                                       c.CezaTuru == "geciken_kitap" && 
                                       (c.Durum == "aktif" || c.Durum == "odemendi"))
                            .AnyAsync();

                        if (!cekaVarMi && islem.AlimTarihi.HasValue)
                        {
                            // Kaç gün geç olduğunu hesapla
                            var gecikGun = (int)Math.Ceiling((DateTime.UtcNow - islem.AlimTarihi.Value.AddDays(14)).TotalDays);
                            decimal cezaTutari = gecikGun * gunlukCeza;

                            // Maksimum cezayı kontrol et
                            if (cezaTutari > maksimumCeza)
                                cezaTutari = maksimumCeza;

                            // Ceza oluştur
                            var yeniCeza = new CezaIslemi
                            {
                                UyeId = islem.UyeId,
                                IslemId = islem.Id,
                                KitapId = islem.KitapId,
                                CezaTuru = "geciken_kitap",
                                CezaTarihi = DateTime.UtcNow,
                                SonOdemeTarihi = DateTime.UtcNow.AddDays(7),
                                CezaTutari = cezaTutari,
                                Durum = "aktif",
                                Aciklama = $"{gecikGun} gün gecikmeli iade - Otomatik ceza"
                            };

                            context.CezaIslemleri.Add(yeniCeza);
                            yeniCezalarCount++;

                            // Üyeye mail gönderme zamanı konfigürasyona göre kontrol edilir
                            // mailGecikmeGun = 0 ise her gecikme için anında mail gönder
                            if (gecikGun >= mailGecikmeGun && islem.Uye?.Email != null && islem.Kitap != null)
                            {
                                await emailService.SendCezaBildirimAsync(
                                    islem.Uye.Email,
                                    islem.Uye.AdSoyad,
                                    islem.Kitap.KitapAdi,
                                    cezaTutari,
                                    yeniCeza.SonOdemeTarihi ?? DateTime.UtcNow
                                );
                                yeniCeza.SonMailTarihi = DateTime.UtcNow; // İlk mail tarihini kaydet
                                _logger.LogInformation(
                                    "Ceza maili gönderildi - UyeId: {uyeId}, GecikmeGun: {gecikGun}, Esik: {esik}",
                                    islem.UyeId, gecikGun, mailGecikmeGun);
                            }

                            _logger.LogInformation("Ceza oluşturuldu - UyeId: {uyeId}, Ceza: {cezaTutari}", islem.UyeId, cezaTutari);
                        }
                    }

                    if (yeniCezalarCount > 0)
                    {
                        await context.SaveChangesAsync();
                        _logger.LogInformation("Otomatik ceza: {count} gecikmiş kitap için ceza oluşturuldu", yeniCezalarCount);
                    }

                    // Aktif cezalar için 3 günde bir hatırlatma maili gönder
                    var aktifCezalar = await context.CezaIslemleri
                        .Include(c => c.Uye)
                        .Include(c => c.Kitap)
                        .Include(c => c.Islem)
                        .Where(c => c.Durum == "aktif" && 
                                    c.CezaTuru == "geciken_kitap" &&
                                    c.Uye != null && 
                                    c.Kitap != null &&
                                    c.Islem != null &&
                                    c.Islem.AlimTarihi.HasValue)
                        .ToListAsync();

                    foreach (var ceza in aktifCezalar)
                    {
                        // Son mail gönderme tarihini kontrol et
                        // Eğer null ise veya 3 günden fazla geçmişse mail gönder
                        bool mailGonderilmeli = false;
                        if (ceza.SonMailTarihi == null)
                        {
                            // İlk mail gönderilmemişse, hemen gönder
                            mailGonderilmeli = true;
                        }
                        else
                        {
                            // Son mail'den 3 gün geçmişse
                            var gunFarki = (DateTime.UtcNow - ceza.SonMailTarihi.Value).TotalDays;
                            if (gunFarki >= 3)
                            {
                                mailGonderilmeli = true;
                            }
                        }

                        if (mailGonderilmeli && ceza.Uye?.Email != null)
                        {
                            // Güncel ceza tutarını hesapla (gecikme günü artmış olabilir)
                            var gecikGun = (int)Math.Ceiling((DateTime.UtcNow - ceza.Islem.AlimTarihi.Value.AddDays(14)).TotalDays);
                            decimal guncelCezaTutari = gecikGun * gunlukCeza;
                            
                            // Maksimum cezayı kontrol et
                            if (guncelCezaTutari > maksimumCeza)
                                guncelCezaTutari = maksimumCeza;

                            // Ceza tutarını güncelle
                            ceza.CezaTutari = guncelCezaTutari;
                            ceza.UpdatedAt = DateTime.UtcNow;

                            // Mail gönder
                            await emailService.SendCezaBildirimAsync(
                                ceza.Uye.Email,
                                ceza.Uye.AdSoyad,
                                ceza.Kitap.KitapAdi,
                                guncelCezaTutari,
                                ceza.SonOdemeTarihi ?? DateTime.UtcNow
                            );

                            // Son mail tarihini güncelle
                            ceza.SonMailTarihi = DateTime.UtcNow;

                            _logger.LogInformation(
                                "Hatırlatma maili gönderildi - CezaId: {cezaId}, UyeId: {uyeId}, GecikmeGun: {gecikGun}, GuncelCeza: {ceza}",
                                ceza.Id, ceza.UyeId, gecikGun, guncelCezaTutari);
                        }
                    }

                    // Aktif cezalar için yapılan güncellemeleri kaydet
                    if (aktifCezalar.Any(c => c.SonMailTarihi != null))
                    {
                        await context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ceza hesaplama servisi hatası");
                }
            }
        }
    }
}
