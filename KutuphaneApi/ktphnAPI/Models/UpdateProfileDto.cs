using System.ComponentModel.DataAnnotations;

namespace ktphnAPI.Models
{
        // v1.0 - Dark mode and global versioning comment added
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
