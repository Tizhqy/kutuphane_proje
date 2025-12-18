namespace ktphnAPI.Models
{

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Sifre { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string Ad { get; set; } = string.Empty;
        public string Soyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Sifre { get; set; } = string.Empty;
    }
}