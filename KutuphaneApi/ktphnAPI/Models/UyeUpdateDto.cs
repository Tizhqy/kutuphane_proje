using System.ComponentModel.DataAnnotations;

namespace ktphnAPI.Models
{
        // v1.0 - Dark mode and global versioning comment added
    public class UyeUpdateDto
    {
        [Required(ErrorMessage = "Ad Soyad gereklidir")]
        public string? AdSoyad { get; set; }

        [Required(ErrorMessage = "Email gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir email girin")]
        public string? Email { get; set; }

        public string? Telefon { get; set; }

        public string? OgrenciNo { get; set; }
    }
}
