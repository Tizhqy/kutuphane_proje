using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("rezervasyonlar")]
    public class Rezervasyon
    {
        [Key]
        [Column("rezervasyon_id")]
        public int Id { get; set; }

        [Column("uye_id")]
        public int UyeId { get; set; }

        [Column("kitap_id")]
        public int KitapId { get; set; } 

        [Column("baslangic_tarihi")]
        public DateTime BaslangicTarihi { get; set; }

        [Column("bitis_tarihi")]
        public DateTime BirisTarihi { get; set; }

        [Column("durum")]
        [MaxLength(50)]
        public string Durum { get; set; } = "aktif";

        [Column("olusturma_tarihi")]
        public DateTime? OlusturmaTarihi { get; set; }

        [Column("iptal_tarihi")]
        public DateTime? IptalTarihi { get; set; }
    }
}
