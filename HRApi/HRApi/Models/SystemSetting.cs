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
        public string? ThoiGianNghiTrua { get; set; }
        public int SoPhutDiMuonChoPhep { get; set; }
        public int NgayPhepTieuChuan { get; set; }

        // Lương thuế
        public decimal MucLuongCoSo { get; set; }
        public double PhanTramBHXHCompany { get; set; }
        public double PhanTramBHXHEmployee { get; set; }
        public decimal GiamTruGiaCanh { get; set; }
        public decimal GiamTruPhuThuoc { get; set; }

        // Email
        public string? SmtpServer { get; set; }
        public string? SmtpPort { get; set; }
        public string? EmailGuiDi { get; set; }
        public bool GuiMailTuDong { get; set; }
    }
}
