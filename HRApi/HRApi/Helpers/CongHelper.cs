using HRApi.Data;
using HRApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HRApi.Helpers
{
    /// <summary>
    /// Cấu hình ca làm (đọc từ SystemSettings, có giá trị mặc định 08:00–17:30, nghỉ trưa 12:00–13:30).
    /// </summary>
    public class ShiftConfig
    {
        public TimeSpan Start      { get; set; } = new(8, 0, 0);
        public TimeSpan End        { get; set; } = new(17, 30, 0);
        public TimeSpan LunchStart { get; set; } = new(12, 0, 0);
        public TimeSpan LunchEnd   { get; set; } = new(13, 30, 0);

        public static ShiftConfig FromSettings(SystemSetting? s)
        {
            var cfg = new ShiftConfig();
            if (s != null)
            {
                if (TimeSpan.TryParse(s.GioVaoLam, out var a))          cfg.Start = a;
                if (TimeSpan.TryParse(s.GioTanLam, out var b))          cfg.End = b;
                if (TimeSpan.TryParse(s.GioNghiTruaBatDau, out var c))  cfg.LunchStart = c;
                if (TimeSpan.TryParse(s.GioNghiTruaKetThuc, out var d)) cfg.LunchEnd = d;
            }
            return cfg;
        }

        public static async Task<ShiftConfig> LoadAsync(AppDbContext ctx)
            => FromSettings(await ctx.SystemSettings.FirstOrDefaultAsync());
    }

    /// <summary>
    /// Hằng số phân loại ngày công — dùng chung cho Chấm công, Nghỉ phép,
    /// Công tác, OT và Bảng lương để mọi nơi hiểu giống nhau (tránh so chuỗi GhiChu).
    /// </summary>
    public static class LoaiCong
    {
        public const string LamViec        = "Làm việc";
        public const string NghiPhep       = "Nghỉ phép";        // nghỉ có phép (hưởng lương, trừ quota)
        public const string NghiKhongLuong = "Nghỉ không lương"; // có đơn nhưng không hưởng lương / hết quota
        public const string NghiKhongPhep  = "Nghỉ không phép";  // vắng không lý do
        public const string CongTac        = "Công tác";
    }

    public static class CongHelper
    {
        /// <summary>
        /// Tổng số ngày phép NĂM đã dùng của 1 nhân viên (tính cả nửa ngày = 0.5).
        /// Đếm theo LoaiNgayCong = "Nghỉ phép" để thống nhất ở mọi nơi.
        /// </summary>
        public static Task<double> DemPhepDaDungTrongNamAsync(
            AppDbContext ctx, string maNhanVien, int nam, int excludeId = 0)
            => ctx.ChamCongs
                  .Where(c => c.MaNhanVien == maNhanVien
                           && c.NgayChamCong.Year == nam
                           && c.LoaiNgayCong == LoaiCong.NghiPhep
                           && c.Id != excludeId)
                  .SumAsync(c => c.NgayCong);
    }
}
