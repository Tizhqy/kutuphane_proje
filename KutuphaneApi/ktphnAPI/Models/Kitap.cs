using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("kitaplar")]
    public class Kitap
    {
        [Key]
        [Column("kitap_id")]
        public int Id { get; set; }

        [Column("kitap_adi")]
        public string KitapAdi { get; set; } = string.Empty;

        [Column("yazar")]
        public string Yazar { get; set; } = string.Empty;

        [Column("isbn")]
        public string Isbn { get; set; } = string.Empty;

        [Column("kategori")]
        public string Kategori { get; set; } = string.Empty;

        [Column("sayfa_sayisi")]
        public int SayfaSayisi { get; set; }

        [Column("yayin_yili")]
        public int YayinYili { get; set; }

        [Column("durum")]
        public string Durum { get; set; } = string.Empty;

        [Column("ekleme_tarihi")]
        public DateTime EklemeTarihi { get; set; }
    }
}