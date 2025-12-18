using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("uyeler")]
    public class Uye
    {
        [Key]
        [Column("uye_id")]
        public int Id { get; set; }

        [Column("uye_ad_soyad")]
        public string AdSoyad { get; set; } = string.Empty;

        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("sifre")]
        public string Sifre { get; set; } = string.Empty;

        [Column("telefon")]
        public string? Telefon { get; set; }

        [Column("ogrenci_no")]
        public string? OgrenciNo { get; set; }

        [Column("durum")]
        public string? Durum { get; set; }

        [Column("kayit_tarihi")]
        public DateTime? KayitTarihi { get; set; }

        [NotMapped]
        public string RolIsimleri { get; set; } = "";
    }
}