using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("roller")]

    public class Rol
    {
        [Key]
        [Column("rol_id")]
        public int Id { get; set; }

        [Column("rol_adi")]
        public string RolAdi { get; set; } = string.Empty;

        [Column("aciklama")]
        public string Aciklama { get; set; } = string.Empty;

        [Column("yetki_seviyesi")]
        public int YetkiSeviyesi { get; set; }

        [Column("olusturma_tarihi")]
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
    }
}