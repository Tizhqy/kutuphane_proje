using System;

namespace ktphnAPI.Models
{
    public class UyeListDto
    {
        public int Id { get; set; }
        public string AdSoyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telefon { get; set; } = string.Empty;
        public string? OgrenciNo { get; set; } = string.Empty;
        public string? Durum { get; set; } = string.Empty;
        public DateTime? KayitTarihi { get; set; }
        public string RolIsimleri { get; set; } = "";
    }

    public class UyeProfileDto
    {
        public int Id { get; set; }
        public string AdSoyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telefon { get; set; } = string.Empty;
        public string? OgrenciNo { get; set; } = string.Empty;
        public string? Durum { get; set; } = string.Empty;
        public DateTime? KayitTarihi { get; set; }
        public string RolIsimleri { get; set; } = "";
    }
}
