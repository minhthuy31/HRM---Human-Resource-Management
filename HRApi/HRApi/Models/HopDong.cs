using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRApi.Models
{
    public class HopDong
    {
        [Key]
        public string SoHopDong { get; set; }

        [Required]
        public string MaNhanVien { get; set; }
        [ForeignKey("MaNhanVien")]
        public virtual NhanVien? NhanVien { get; set; }

        [Required]
        public string LoaiHopDong { get; set; }

        [Required]
        public DateTime NgayBatDau { get; set; }

        public DateTime? NgayKetThuc { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal LuongCoBan { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal LuongDongBaoHiem { get; set; }

        public string? TepDinhKem { get; set; }

        public string TrangThai { get; set; } = "HieuLuc";

        public DateTime NgayKy { get; set; } = DateTime.Now;
        public string? GhiChu { get; set; }
    }

    // Danh mục cố định cho loại & trạng thái hợp đồng (tránh nhập sai chuỗi tự do)
    public static class LoaiHopDongConst
    {
        public const string ThuViec   = "Thử việc";
        public const string ChinhThuc = "Chính thức";
        public static readonly string[] All = { ThuViec, ChinhThuc };
    }

    public static class TrangThaiHopDong
    {
        public const string HieuLuc   = "HieuLuc";
        public const string HetHan    = "HetHan";
        public const string DaChamDut = "DaChamDut";
        public static readonly string[] All = { HieuLuc, HetHan, DaChamDut };
    }
}