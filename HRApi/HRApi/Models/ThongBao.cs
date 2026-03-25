using System.ComponentModel.DataAnnotations;

namespace HRApi.Models
{
    public class ThongBao
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Tiêu đề không được để trống")]
        public string TieuDe { get; set; }

        [Required(ErrorMessage = "Nội dung không được để trống")]
        public string NoiDung { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.Now;

        public string LoaiThongBao { get; set; } = "Thông báo chung";

        public bool TrangThai { get; set; } = true; // true = Đang hiển thị, false = Đã ẩn
    }
}