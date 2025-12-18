using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("ceza_islemleri")]
    public class CezaIslemi
    {
        [Key]
        [Column("ceza_id")]
        public int Id { get; set; }

        [Column("uye_id")]
        [Required]
        public int UyeId { get; set; }

        [Column("islem_id")]
        [Required]
        public long IslemId { get; set; }

        [Column("kitap_id")]
        [Required]
        public int KitapId { get; set; }

        [Column("ceza_turu")]
        [StringLength(50)]
        public string CezaTuru { get; set; } = string.Empty;// "geciken_kitap", "hasar", "kayip"

        [Column("ceza_tarihi")]
        public DateTime CezaTarihi { get; set; }

        [Column("son_odeme_tarihi")]
        public DateTime? SonOdemeTarihi { get; set; }

        [Column("odeme_tarihi")]
        public DateTime? OdemeTarihi { get; set; }

        [Column("ceza_tutari")]
        public decimal CezaTutari { get; set; }

        [Column("durum")]
        [StringLength(50)]
        public string Durum { get; set; } = "aktif"; // "aktif", "odemendi", "afedildi"

        [Column("aciklama")]
        public string Aciklama { get; set; }= string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("son_mail_tarihi")]
        public DateTime? SonMailTarihi { get; set; }

        // Navigation Properties
        public virtual Uye? Uye { get; set; } 
        public virtual İslemler? Islem { get; set; }
        public virtual Kitap? Kitap { get; set; }
    }

    [Table("ceza_config")]
    public class CezaConfig
    {
        [Key]
        [Column("config_id")]
        public int Id { get; set; }

        [Column("config_key")]
        [StringLength(100)]
        public string ConfigKey { get; set; }= string.Empty;

        [Column("config_value")]
        [StringLength(255)]
        public string ConfigValue { get; set; }= string.Empty;

        [Column("aciklama")]
        public string Aciklama { get; set; }= string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
