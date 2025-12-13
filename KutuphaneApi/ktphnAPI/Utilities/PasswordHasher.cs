using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;

namespace ktphnAPI.Utilities
{
    public class PasswordHasher
    {
        public static async Task HashExistingPasswords(AppDbContext context)
        {
            var uyeler = await context.Uyeler.ToListAsync();
            
            foreach (var uye in uyeler)
            {
                // Eğer şifre zaten hash'lenmiş ise atla (BCrypt hash'ler $2 ile başlar)
                if (uye.Sifre.StartsWith("$2"))
                {
                    continue;
                }
                
                // Düz metin şifreyi hash'le
                uye.Sifre = BCrypt.Net.BCrypt.HashPassword(uye.Sifre);
                Console.WriteLine($"Hashed password for user: {uye.Email}");
            }
            
            await context.SaveChangesAsync();
            Console.WriteLine("Tüm şifreler başarıyla hash'lendi!");
        }
    }
}
