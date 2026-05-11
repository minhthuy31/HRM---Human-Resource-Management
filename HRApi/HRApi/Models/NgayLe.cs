using System.ComponentModel.DataAnnotations;

namespace HRApi.Models
{
    public class NgayLe
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string TenNgayLe { get; set; }
    }
}