using System.ComponentModel.DataAnnotations;

namespace ktphnAPI.Models
{
        // v1.0 - Dark mode and global versioning comment added
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Eski şifre zorunludur")]
        public string EskiSifre { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni şifre zorunludur")]
        [MinLength(6, ErrorMessage = "Yeni şifre en az 6 karakter olmalıdır")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", 
            ErrorMessage = "Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir")]
        public string YeniSifre { get; set; } = string.Empty;
    }
}
