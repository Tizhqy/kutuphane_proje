using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("kitap_islemler")]
    public class İslemler
    {
        [Key]
        [Column("islem_id")]
        public int Id { get; set; }

        [Column("uye_id")]
        public int UyeId { get; set; }

        [Column("kitap_id")]
        public int KitapId { get; set; }

        [Column("islem_turu")]
        public string İslemTuru { get; set; } = string.Empty;


        [Column("metadata", TypeName = "json")]
        public string? Metadata { get; set; }

        [Column("alim_tarihi")]
        public DateTime? AlimTarihi { get; set; }

        [Column("iade_tarihi")]
        public DateTime? IadeTarihi { get; set; }

        [Column("durum")]
        [MaxLength(50)]
        public string? Durum { get; set; } = "odunc";

        [Column("user_agent")]
        [MaxLength(512)]
        public string? UserAgent { get; set; }

        [Column("olusturma_tarihi")]
        public DateTime? OlusturmaTarihi { get; set; }

    }
}