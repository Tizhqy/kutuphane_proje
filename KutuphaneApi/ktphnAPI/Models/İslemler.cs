using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
        // global commit
    [Table("kitap_islemler")]
    public class İslemler
    {
        [Key]
        [Column("islem_id")]
        public long Id { get; set; }

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

        [Column("ip_address")]
        [MaxLength(64)]
        public string? IpAddress { get; set; }

        [Column("olusturma_tarihi")]
        public DateTime? OlusturmaTarihi { get; set; }

        // Navigation Properties
        public virtual Uye Uye { get; set; }
        public virtual Kitap Kitap { get; set; }

    }
}