using System.ComponentModel.DataAnnotations;

namespace ktphnAPI.Models
{
    public class UpdateProfileDto
    {
        [Required]
        [StringLength(100)]
        public string AdSoyad { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Telefon { get; set; } = string.Empty;

        [StringLength(50)]
        public string? OgrenciNo { get; set; } = string.Empty;
    }
}
