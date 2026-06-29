using System.ComponentModel.DataAnnotations;

namespace HRApi.Models
{
    public class SystemSetting
    {
        [Key]
        public int Id { get; set; }

        // Công ty
        public string? TenCongTy { get; set; }
        public string? TenVietTat { get; set; }
        public string? MaSoThue { get; set; }
        public string? DiaChi { get; set; }
        public string? SdtHotline { get; set; }

        // Chấm công
        public string? GioVaoLam { get; set; }
        public string? GioTanLam { get; set; }
        public string? ThoiGianNghiTrua { get; set; }   // (cũ, giữ lại để tương thích)
        public string? GioNghiTruaBatDau { get; set; }  // "12:00"
        public string? GioNghiTruaKetThuc { get; set; } // "13:30"
        public int SoPhutDiMuonChoPhep { get; set; }
        public int NgayPhepTieuChuan { get; set; }

        // Lương thuế
        public decimal MucLuongCoSo { get; set; }          // Trần BHXH/BHYT = 20 × MucLuongCoSo
        public decimal LuongToiThieuVung { get; set; } = 5_310_000m; // Vùng I (NĐ 293/2025) - Trần BHTN = 20 × giá trị này
        public double PhanTramBHXHCompany { get; set; }
        public double PhanTramBHXHEmployee { get; set; }
        public decimal GiamTruGiaCanh { get; set; }
        public decimal GiamTruPhuThuoc { get; set; }
        public double HeSoOTNgayThuong { get; set; } = 1.5;
        public double HeSoOTCuoiTuan { get; set; } = 2.0;
        public double HeSoOTNgayLe { get; set; } = 3.0;

        // Giới hạn làm thêm giờ (Điều 107 BLLĐ 2019)
        public double GioOTToiDaNgay { get; set; } = 4;    // OT tối đa/ngày thường (≤ 50% của 8h)
        public double GioOTToiDaThang { get; set; } = 40;  // OT tối đa/tháng
        public double GioOTToiDaNam { get; set; } = 200;   // OT tối đa/năm (300 cho ngành đặc thù)

        // Phụ cấp (cấu hình toàn công ty)
        public decimal TienAnMoiNgay { get; set; } = 50_000m;
        public decimal TienGuiXeThang { get; set; } = 150_000m;
        public decimal TienChuyenCan { get; set; } = 500_000m;

        // Email
        public string? SmtpServer { get; set; }
        public string? SmtpPort { get; set; }
        public string? EmailGuiDi { get; set; }
        public bool GuiMailTuDong { get; set; }
    }
}
