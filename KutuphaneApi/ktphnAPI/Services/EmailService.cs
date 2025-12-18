using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ktphnAPI.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task SendCezaBildirimAsync(string uyeEmail, string uyeAdi, string kitapAdi, decimal cezaTutari, DateTime sonOdemeTarihi);
        Task SendAdminCezaBildirimAsync(string adminEmail, string uyeAdi, string kitapAdi, decimal cezaTutari);
        Task SendTestEmailAsync(string to);
        Task SendOduncAlBildirimAsync(string uyeEmail, string uyeAdi, string kitapAdi, DateTime iadeTarihi);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            try
            {
                var emailConfig = _config.GetSection("Email");
                var smtpServer = emailConfig["SmtpServer"];
                var smtpPort = int.Parse(emailConfig["SmtpPort"] ?? "587");
                var fromEmail = emailConfig["FromEmail"];
                var fromName = emailConfig["FromName"];
                var username = emailConfig["Username"];
                var password = emailConfig["Password"];
                var enableSSL = bool.Parse(emailConfig["EnableSSL"] ?? "true");
                _logger.LogInformation("SMTP attempt -> to: {to}, server: {server}:{port}, from: {from}, user: {user}, ssl: {ssl}", to, smtpServer, smtpPort, fromEmail, username, enableSSL);

                if (string.IsNullOrWhiteSpace(fromEmail))
                {
                    throw new InvalidOperationException("FromEmail configuration is missing or empty.");
                }

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(username, password);
                    client.EnableSsl = enableSSL;

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail, fromName),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = isHtml
                    };

                    mailMessage.To.Add(to);

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Mail gönderildi: {to} - {subject}", to, subject);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Mail gönderme hatası: {to}", to);
                // Mail hatası başarısız olsa da sistem çalışmaya devam etsin
            }
        }

        public async Task SendCezaBildirimAsync(string uyeEmail, string uyeAdi, string kitapAdi, decimal cezaTutari, DateTime sonOdemeTarihi)
        {
            var subject = "Ceza Bildirimi - Geç İade Edilen Kitap";
            var body = $@"
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body {{ font-family: Arial, sans-serif; direction: ltr; text-align: left; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #d32f2f; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }}
                        .content {{ padding: 20px; text-align: left; }}
                        .important {{ color: #d32f2f; font-weight: bold; font-size: 18px; }}
                        .details {{ background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 15px 0; text-align: left; }}
                        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>⚠️ Ceza Bildirimi</h2>
                        </div>
                        <div class='content'>
                            <p>Sayın {uyeAdi},</p>
                            <p>Kütüphaneden ödünç aldığınız bir kitabın iade süresi geçmiş olup, ceza işlemi başlatılmıştır.</p>
                            
                            <div class='details'>
                                <p><strong>Kitap Adı:</strong> {kitapAdi}</p>
                                <p><strong>Ceza Tutarı:</strong> <span class='important'>{cezaTutari:F2} TL</span></p>
                                <p><strong>Ödeme Süresi:</strong> {sonOdemeTarihi:dd.MM.yyyy} tarihine kadar</p>
                            </div>
                            
                            <p>Lütfen belirtilen tarih içinde cezanızı sisteme giriş yaparak ödeyiniz.</p>
                            <p>Herhangi bir sorunuz varsa kütüphane yöneticileriyle iletişim kurunuz.</p>
                            
                            <p>Saygılarımızla,<br/>Kütüphane Yönetimi</p>
                        </div>
                        <div class='footer'>
                            <p>Bu bir otomatik mail'dir. Lütfen cevap vermeyin.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(uyeEmail, subject, body, isHtml: true);
        }

        public async Task SendAdminCezaBildirimAsync(string adminEmail, string uyeAdi, string kitapAdi, decimal cezaTutari)
        {
            var subject = $"Yeni Ceza Kaydı - {uyeAdi}";
            var body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #1976d2; color: white; padding: 15px; border-radius: 5px 5px 0 0; text-align: center; }}
                        .content {{ padding: 20px; }}
                        .alert {{ background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0; }}
                        .details {{ background-color: #f5f5f5; padding: 15px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>📋 Yeni Ceza Kaydı</h2>
                        </div>
                        <div class='content'>
                            <p>Admin Panel'de yeni bir ceza kaydı oluşturulmuştur:</p>
                            
                            <div class='alert'>
                                <p><strong>Üye Adı:</strong> {uyeAdi}</p>
                                <p><strong>Kitap Adı:</strong> {kitapAdi}</p>
                                <p><strong>Ceza Tutarı:</strong> {cezaTutari:F2} TL</p>
                                <p><strong>Tarih:</strong> {DateTime.Now:dd.MM.yyyy HH:mm}</p>
                            </div>
                            
                            <p>Detaylar için admin paneline giriş yapınız.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(adminEmail, subject, body, isHtml: true);
        }

        public async Task SendTestEmailAsync(string to)
        {
            var subject = "🧪 Kütüphane Sistemi - Email Test";
            var body = @"
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; }
                        .header { background: #1a237e; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .success { background: #c8e6c9; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50; }
                        .info { background: #e3f2fd; padding: 15px; margin: 10px 0; border-left: 4px solid #2196f3; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>✅ Email Sistemin Çalışıyor!</h2>
                        </div>
                        <div class='content'>
                            <div class='success'>
                                <strong>Başarılı!</strong> Email konfigürasyonunuz doğru çalışıyor.
                            </div>
                            
                            <div class='info'>
                                <p><strong>Test Tarihi:</strong> " + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss") + @"</p>
                                <p><strong>Alıcı:</strong> " + to + @"</p>
                                <p><strong>Provider:</strong> Kütüphane Sistemi</p>
                            </div>
                            
                            <p>Bu email, Kütüphane Sistemi'nin email gönderme fonksiyonunun test edilmesi için gönderilmiştir.</p>
                            
                            <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                                Eğer bu email yanlışlıkla alındıysa lütfen yoksay.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(to, subject, body, isHtml: true);
        }

        public async Task SendOduncAlBildirimAsync(string uyeEmail, string uyeAdi, string kitapAdi, DateTime iadeTarihi)
        {
            var subject = "📚 Kitap Ödünç Alma Onayı";
            var body = $@"
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body {{ font-family: Arial, sans-serif; direction: ltr; text-align: left; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #4caf50; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }}
                        .content {{ padding: 20px; text-align: left; }}
                        .success {{ color: #4caf50; font-weight: bold; font-size: 18px; }}
                        .details {{ background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4caf50; margin: 15px 0; text-align: left; }}
                        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
                        .warning {{ background-color: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0; text-align: left; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>✅ Kitap Ödünç Alma Onayı</h2>
                        </div>
                        <div class='content'>
                            <p>Sayın {uyeAdi},</p>
                            <p>Kütüphaneden ödünç aldığınız kitap başarıyla kaydedilmiştir.</p>
                            
                            <div class='details'>
                                <p><strong>Kitap Adı:</strong> {kitapAdi}</p>
                                <p><strong>Ödünç Alma Tarihi:</strong> {DateTime.Now:dd.MM.yyyy}</p>
                                <p><strong>Son İade Tarihi:</strong> <span class='success'>{iadeTarihi:dd.MM.yyyy}</span></p>
                            </div>
                            
                            <div class='warning'>
                                <p><strong>⚠️ Önemli:</strong> Lütfen kitabı belirtilen tarihe kadar iade ediniz. Geç iade durumunda ceza işlemi uygulanacaktır.</p>
                            </div>
                            
                            <p>İyi okumalar dileriz!</p>
                            <p>Saygılarımızla,<br/>Kütüphane Yönetimi</p>
                        </div>
                        <div class='footer'>
                            <p>Bu bir otomatik mail'dir. Lütfen cevap vermeyin.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(uyeEmail, subject, body, isHtml: true);
        }
    }
}
