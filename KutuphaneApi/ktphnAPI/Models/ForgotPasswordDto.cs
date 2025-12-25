using System.ComponentModel.DataAnnotations;

namespace ktphnAPI.Models
{
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Email adresi gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        public string Email { get; set; } = string.Empty;
    }
}
