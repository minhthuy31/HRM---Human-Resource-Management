using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRApi.Models
{
    public class BangLuong
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int Thang { get; set; }
        [Required]
        public int Nam { get; set; }

        // --- 1. CÁC KHOẢN THU NHẬP ---
        [Column(TypeName = "decimal(18,2)")]
        public decimal LuongCoBan { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LuongDongBaoHiem { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TongPhuCap { get; set; }

        // --- 2. SỐ LIỆU TỪ CHẤM CÔNG ---
        public double TongNgayCong { get; set; }
        public double TongGioOT { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TongCongChuanOT { get; set; }   // Giờ OT × hệ số (VD: 2h×1.5=3)

        // Công chuẩn tháng (T2-T6 trừ lễ, tính động)
        [Column(TypeName = "decimal(18,2)")]
        public decimal SoCongChuanTrongThang { get; set; }

        // --- 3. PHÂN RÃ PHỤ CẤP ---
        [Column(TypeName = "decimal(18,2)")]
        public decimal TienAn { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal TienGuiXe { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal TienChuyenCan { get; set; }

        // --- CÁC THUỘC TÍNH CHỈ HIỂN THỊ (Không lưu DB) ---
        [NotMapped]
        public int NghiCoPhep { get; set; }
        [NotMapped]
        public int NghiKhongPhep { get; set; }
        [NotMapped]
        public int LamNuaNgay { get; set; }
        [NotMapped]
        public int NghiKhongLuong { get; set; }

        // Ngày lễ làm việc + tiền lương ngày lễ (tính động, không lưu DB)
        [NotMapped]
        public double SoNgayLamLe { get; set; }
        [NotMapped]
        public decimal TienLamLe { get; set; }

        // --- 3. TÍNH TOÁN CHI TIẾT ---
        [Column(TypeName = "decimal(18,2)")]
        public decimal LuongChinh { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LuongOT { get; set; }

        // Tiền lương làm thêm ngày lễ (phần 300% làm thêm — KHÔNG gồm 100% nguyên lương ngày lễ đã nằm trong LuongChinh)
        [Column(TypeName = "decimal(18,2)")]
        public decimal LuongLamThemLe { get; set; }

        // --- 4. CÁC KHOẢN KHẤU TRỪ ---
        [Column(TypeName = "decimal(18,2)")]
        public decimal KhauTruBHXH { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal KhauTruBHYT { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal KhauTruBHTN { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ThueTNCN { get; set; }

        // Điều chỉnh khác: dương = cộng thêm lương (thưởng), âm = trừ lương
        [Column(TypeName = "decimal(18,2)")]
        public decimal KhoanTruKhac { get; set; }

        [MaxLength(500)]
        public string? LyDoKhac { get; set; }

        // --- 5. TỔNG KẾT ---
        [Column(TypeName = "decimal(18,2)")]
        public decimal TongThuNhap { get; set; } // Gross

        [Column(TypeName = "decimal(18,2)")]
        public decimal ThucLanh { get; set; }    // Net 

        // --- TRẠNG THÁI ---
        public DateTime NgayTinhLuong { get; set; } = DateTime.UtcNow;
        public bool DaChot { get; set; } = false;
        public string? GhiChu { get; set; }

        // --- KHÓA NGOẠI ---
        [Required]
        [ForeignKey("NhanVien")]
        public string MaNhanVien { get; set; }
        public virtual NhanVien? NhanVien { get; set; }
    }
}