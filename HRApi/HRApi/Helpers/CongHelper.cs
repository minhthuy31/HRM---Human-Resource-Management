using HRApi.Data;
using Microsoft.EntityFrameworkCore;

namespace HRApi.Helpers
{
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
