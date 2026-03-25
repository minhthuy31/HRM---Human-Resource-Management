namespace HRApi.DTOs
{
    public class DashboardDto
    {
        public int TongNhanVien { get; set; }
        public int NhanVienMoiTrongThang { get; set; }
        public int HopDongSapHetHan { get; set; }
        public int DonOTChoDuyet { get; set; }

        public List<ThongKePhongBanDto> NhanSuTheoPhongBan { get; set; } = new List<ThongKePhongBanDto>();
        public List<NhanVienNganDto> SinhNhatTrongThang { get; set; } = new List<NhanVienNganDto>();
    }

    public class ThongKePhongBanDto
    {
        public string TenPhongBan { get; set; }
        public int SoLuong { get; set; }
    }

    public class NhanVienNganDto
    {
        public string MaNhanVien { get; set; }
        public string HoTen { get; set; }
        public string TenPhongBan { get; set; }
        public string NgaySinhFormated { get; set; }
    }
}