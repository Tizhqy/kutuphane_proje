using System.ComponentModel.DataAnnotations;

namespace ktphnAPI.Models
{
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
