using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ktphnAPI.Models
{
    [Table("kullanici_roller")]
    public class UyeRol
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("uye_id")]
        public int UyeId { get; set; }

        [Column("rol_id")]
        public int RolId { get; set; }
    }
}