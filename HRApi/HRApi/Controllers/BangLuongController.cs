using HRApi.Data;
using HRApi.Helpers;
using HRApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace HRApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BangLuongController : ControllerBase
    {
        private readonly AppDbContext _context;
        public BangLuongController(AppDbContext context) { _context = context; }

        public class SalaryCalcDto { public int Year { get; set; } public int Month { get; set; } }
        public class PayrollAdjustDto { public int Id { get; set; } public decimal KhoanTruKhac { get; set; } public string? LyDoKhac { get; set; } }

        // ==============================================================
        // HELPER: TÍNH CÔNG CHUẨN THÁNG (tổng ngày T2-T6, GỒM cả ngày lễ)
        // Công chuẩn = mẫu số tính lương. Ngày lễ nằm trong công chuẩn và được
        // hưởng NGUYÊN lương (nghỉ lễ hưởng lương) — không trừ khỏi mẫu số.
        // (Tham số holidays giữ lại cho tương thích, không dùng để trừ.)
        // ==============================================================
        private decimal TinhCongChuanThang(int year, int month, List<DateTime> holidays)
        {
            int count = 0;
            int daysInMonth = DateTime.DaysInMonth(year, month);
            for (int day = 1; day <= daysInMonth; day++)
            {
                var date = new DateTime(year, month, day);
                if (date.DayOfWeek != DayOfWeek.Saturday &&
                    date.DayOfWeek != DayOfWeek.Sunday)
                    count++;
            }
            return count > 0 ? count : 22m; // fallback tránh chia 0
        }

        // ==============================================================
        // HELPER: TÍNH THUẾ TNCN 5 BẬC LŨY TIẾN (Luật 2025, HLực 2026)
        // ==============================================================
        private decimal TinhThueTNCNLuyTien(decimal thuNhapTinhThue)
        {
            if (thuNhapTinhThue <= 0)           return 0;
            if (thuNhapTinhThue <= 10_000_000)  return thuNhapTinhThue * 0.05m;
            if (thuNhapTinhThue <= 30_000_000)  return thuNhapTinhThue * 0.10m - 500_000m;
            if (thuNhapTinhThue <= 60_000_000)  return thuNhapTinhThue * 0.20m - 3_500_000m;
            if (thuNhapTinhThue <= 100_000_000) return thuNhapTinhThue * 0.30m - 9_500_000m;
            return thuNhapTinhThue * 0.35m - 14_500_000m;
        }

        // ==============================================================
        // 1. TÍNH LƯƠNG
        // ==============================================================
        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateSalary([FromBody] SalaryCalcDto dto)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Kế toán trưởng" && role != "Giám đốc")
                return StatusCode(403, "Bạn không có quyền thực hiện tính lương.");

            var isAttendanceLocked = await _context.KhoaCongs
                .AnyAsync(k => k.Nam == dto.Year && k.Thang == dto.Month && k.IsLocked);
            if (!isAttendanceLocked)
                return BadRequest("Bảng công chưa khóa. Vui lòng yêu cầu Nhân sự khóa công trước.");

            var isPayrollLocked = await _context.BangLuongs
                .AnyAsync(b => b.Nam == dto.Year && b.Thang == dto.Month && b.DaChot);
            if (isPayrollLocked)
                return BadRequest("Bảng lương đã chốt. Cần hủy chốt trước khi tính lại.");

            var oldDrafts = await _context.BangLuongs
                .Where(b => b.Nam == dto.Year && b.Thang == dto.Month && !b.DaChot)
                .ToListAsync();
            _context.BangLuongs.RemoveRange(oldDrafts);
            await _context.SaveChangesAsync();

            // Đọc cấu hình hệ thống
            var sys = await _context.SystemSettings.FirstOrDefaultAsync();

            decimal giamTruBanThan    = sys?.GiamTruGiaCanh > 0       ? sys.GiamTruGiaCanh    : 15_500_000m;
            decimal giamTruPhuThuoc   = sys?.GiamTruPhuThuoc > 0      ? sys.GiamTruPhuThuoc   : 6_200_000m;
            decimal phanTramBHNLD     = (decimal)(sys?.PhanTramBHXHEmployee > 0 ? sys.PhanTramBHXHEmployee : 10.5) / 100m;

            decimal heSoOtThuong  = (decimal)(sys?.HeSoOTNgayThuong ?? 1.5);
            decimal heSoOtCuoiTuan = (decimal)(sys?.HeSoOTCuoiTuan ?? 2.0);
            decimal heSoOtLe      = (decimal)(sys?.HeSoOTNgayLe    ?? 3.0);

            // Phụ cấp cấu hình
            decimal tienAnMoiNgay     = sys?.TienAnMoiNgay    > 0 ? sys.TienAnMoiNgay    : 50_000m;
            decimal tienGuiXeThang    = sys?.TienGuiXeThang   > 0 ? sys.TienGuiXeThang   : 150_000m;
            decimal tienChuyenCanMax  = sys?.TienChuyenCan    > 0 ? sys.TienChuyenCan    : 500_000m;

            var monthStart = new DateTime(dto.Year, dto.Month, 1);
            var monthEnd   = monthStart.AddMonths(1);

            // Chỉ tính lương cho NV đã vào làm trong/trước tháng này, bỏ qua Giám đốc/Tổng GĐ
            // NgayVaoLam == null → NV cũ chưa set ngày, vẫn tính bình thường
            var excludedRoles = new[] { "Giám đốc", "Tổng giám đốc", "Admin" };
            var employees  = await _context.NhanViens
                                 .Include(n => n.HopDongs)
                                 .Include(n => n.UserRole)
                                 .Where(e => e.TrangThai == true
                                          && (e.NgayVaoLam == null || e.NgayVaoLam.Value < monthEnd)
                                          && (e.UserRole == null || !excludedRoles.Contains(e.UserRole.NameRole)))
                                 .ToListAsync();

            var attendanceData = await _context.ChamCongs
                .Where(c => c.NgayChamCong >= monthStart && c.NgayChamCong < monthEnd).ToListAsync();
            var otEntries = await _context.DangKyOTs
                .Where(ot => ot.NgayLamThem >= monthStart && ot.NgayLamThem < monthEnd && ot.TrangThai == "Đã duyệt")
                .ToListAsync();

            var holidaysInMonth = await _context.NgayLes
                .Where(nl => nl.Date >= monthStart && nl.Date < monthEnd)
                .Select(nl => nl.Date.Date).ToListAsync();

            // Công chuẩn thực tế của tháng (T2-T6 trừ lễ)
            decimal standardWorkDays = TinhCongChuanThang(dto.Year, dto.Month, holidaysInMonth);

            // Dùng HashSet ngày-trong-tháng để so sánh an toàn (tránh timezone/Kind mismatch)
            var holidayDaySet = new HashSet<int>(holidaysInMonth.Select(h => h.Day));

            var newPayrolls = new List<BangLuong>();

            foreach (var emp in employees)
            {
                var activeContracts = emp.HopDongs?
                    .Where(h => h.NgayBatDau < monthEnd && (h.NgayKetThuc == null || h.NgayKetThuc >= monthStart))
                    .OrderBy(h => h.NgayBatDau).ToList() ?? new List<HopDong>();

                // LƯỚI AN TOÀN: NV không có HĐ phủ tháng → dùng 1 "HĐ ảo" cả tháng theo LuongCoBan của NV,
                // để chạy CÙNG logic (ngày lễ, OT, BH 14 ngày, loại T7/CN) như NV có hợp đồng.
                if (activeContracts.Count == 0)
                {
                    activeContracts.Add(new HopDong
                    {
                        SoHopDong   = "(Không HĐ)",
                        LoaiHopDong = emp.LoaiNhanVien ?? "Chính thức",
                        NgayBatDau  = monthStart,
                        NgayKetThuc = monthEnd.AddDays(-1),
                        LuongCoBan  = emp.LuongCoBan
                    });
                }

                decimal totalLuongChinh = 0, totalLuongOT = 0, totalLuongDongBH = 0;
                decimal totalLuongLamThemLe = 0;
                double  totalWorkDays = 0, totalOTHours = 0;
                decimal totalCongChuanOT = 0;
                decimal finalLuongCoBan = emp.LuongCoBan;
                var chiTietSegments = new List<ChiTietLuongHopDong>();
                int     soNgayLamChinhThuc = 0;    // SỐ NGÀY đi làm/hưởng lương thuộc HĐ chính thức (xét luật 14 ngày)
                decimal luongCoBanChinhThuc = 0;   // mức lương HĐ chính thức làm căn cứ đóng BH
                int     soNgayLeHuongLuong = 0;    // SỐ NGÀY lễ (T2-T6) trong kỳ HĐ → hưởng nguyên lương
                // OT tách 3 loại (giờ + tiền) để hiển thị thanh sổ
                double  otGioThuong = 0, otGioCuoiTuan = 0, otGioLe = 0;
                decimal otTienThuong = 0, otTienCuoiTuan = 0, otTienLe = 0;

                var empAtt = attendanceData.Where(c => c.MaNhanVien == emp.MaNhanVien).ToList();
                var empOT  = otEntries.Where(x => x.MaNhanVien == emp.MaNhanVien).ToList();

                {
                    for (int ci = 0; ci < activeContracts.Count; ci++)
                    {
                        var contract = activeContracts[ci];
                        DateTime periodStart = contract.NgayBatDau > monthStart ? contract.NgayBatDau : monthStart;
                        DateTime periodEnd   = (contract.NgayKetThuc.HasValue && contract.NgayKetThuc.Value < monthEnd.AddDays(-1))
                                              ? contract.NgayKetThuc.Value : monthEnd.AddDays(-1);

                        // Chống đếm trùng ngày khi hợp đồng chồng lấn:
                        // HĐ bắt đầu sau sẽ thay thế HĐ trước cho những ngày trùng nhau.
                        if (ci + 1 < activeContracts.Count)
                        {
                            DateTime boundary = activeContracts[ci + 1].NgayBatDau.AddDays(-1);
                            if (boundary < periodEnd) periodEnd = boundary;
                        }
                        if (periodEnd < periodStart) continue; // HĐ bị thay thế hoàn toàn trong tháng

                        var periodAtt = empAtt.Where(c => c.NgayChamCong.Date >= periodStart.Date && c.NgayChamCong.Date <= periodEnd.Date).ToList();
                        var periodOT  = empOT.Where(o => o.NgayLamThem.Date >= periodStart.Date && o.NgayLamThem.Date <= periodEnd.Date).ToList();

                        // Xác định loại hợp đồng
                        bool isThuViec = contract.LoaiHopDong?.Contains("thử việc", StringComparison.OrdinalIgnoreCase) == true;
                        decimal salaryMultiplier = isThuViec ? 0.85m : 1.0m;

                        // CÔNG THƯỜNG = ngày T2-T6 KHÔNG lễ có đi làm.
                        // NGÀY LỄ (T2-T6) nằm TRONG công chuẩn (mẫu số = 22, gồm cả lễ) và được
                        // hưởng NGUYÊN lương → cộng thẳng vào công (không cần đi làm), không phồng lương.
                        // Làm ngày lễ / T7 / CN chỉ được trả THÊM qua ĐƠN OT.
                        var normalAtt = periodAtt.Where(c => !holidayDaySet.Contains(c.NgayChamCong.Day)
                                                          && c.NgayChamCong.DayOfWeek != DayOfWeek.Saturday
                                                          && c.NgayChamCong.DayOfWeek != DayOfWeek.Sunday).ToList();

                        double normalNgayCong = normalAtt.Sum(c => c.NgayCong);

                        // Số ngày LỄ (T2-T6) trong kỳ HĐ này → hưởng nguyên lương (1 công/ngày).
                        int soNgayLePeriod = 0;
                        for (DateTime d = periodStart.Date; d <= periodEnd.Date; d = d.AddDays(1))
                            if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday
                                && holidayDaySet.Contains(d.Day))
                                soNgayLePeriod++;
                        soNgayLeHuongLuong += soNgayLePeriod;

                        double congChinh = normalNgayCong + soNgayLePeriod; // công tính lương = đi làm + lễ hưởng lương
                        totalWorkDays += congChinh;

                        // Lương chính (thử việc = 85%). Đơn giá = lương / công chuẩn (đã gồm lễ);
                        // ngày lễ được trả như ngày công hưởng lương (đã cộng vào congChinh).
                        decimal dailyRate   = contract.LuongCoBan * salaryMultiplier / standardWorkDays;
                        decimal luongThuong = dailyRate * (decimal)congChinh;
                        totalLuongChinh += luongThuong;

                        // Ghi lại chi tiết kỳ hợp đồng này (để hiển thị "2 lương" khi chuyển HĐ)
                        chiTietSegments.Add(new ChiTietLuongHopDong
                        {
                            SoHopDong   = contract.SoHopDong,
                            LoaiHopDong = contract.LoaiHopDong,
                            TuNgay      = periodStart,
                            DenNgay     = periodEnd,
                            SoNgayCong  = Math.Round(congChinh, 2),
                            LuongCoBan  = contract.LuongCoBan,
                            HeSo        = salaryMultiplier,
                            DonGiaNgay  = Math.Round(dailyRate, 0),
                            ThanhTien   = Math.Round(luongThuong, 0)
                        });
                        // GĐ2: phần +300% làm thêm ngày lễ KHÔNG còn auto từ chấm công.
                        // Mọi phần trả thêm (thường/cuối tuần/lễ) chỉ tính qua ĐƠN OT đã duyệt bên dưới.

                        // OT — quy đổi sang công chuẩn OT.
                        // Tách: OT ngày lễ → cột "Lương Lễ" (×3.0); OT thường/cuối tuần → cột "Tiền OT".
                        decimal hourlyRate = dailyRate / 8m;
                        foreach (var ot in periodOT)
                        {
                            bool isHoliday  = holidayDaySet.Contains(ot.NgayLamThem.Day);
                            bool isWeekend  = ot.NgayLamThem.DayOfWeek == DayOfWeek.Saturday ||
                                              ot.NgayLamThem.DayOfWeek == DayOfWeek.Sunday;

                            decimal multiplier = isHoliday  ? heSoOtLe
                                               : isWeekend  ? heSoOtCuoiTuan
                                               :              heSoOtThuong;

                            decimal congChuanOT = (decimal)ot.SoGio * multiplier;
                            decimal tienOT      = hourlyRate * congChuanOT;
                            totalCongChuanOT += congChuanOT;
                            totalOTHours     += ot.SoGio;
                            totalLuongOT     += tienOT; // TẤT CẢ OT (thường/cuối tuần/lễ) gộp vào "Tiền OT"

                            // Tách 3 loại để hiển thị chi tiết
                            if (isHoliday)      { otGioLe       += ot.SoGio; otTienLe       += tienOT; }
                            else if (isWeekend) { otGioCuoiTuan += ot.SoGio; otTienCuoiTuan += tienOT; }
                            else                { otGioThuong   += ot.SoGio; otTienThuong   += tienOT; }
                        }

                        // Đếm SỐ NGÀY đi làm/hưởng lương thuộc HĐ chính thức: mỗi ngày có công>0 = 1 ngày
                        // (nửa ngày 0.5 hay 1/3 ngày vẫn tính 1); ngày nghỉ phép hưởng lương công=1 cũng tính;
                        // nghỉ không lương/không phép công=0 KHÔNG tính — xét luật 14 ngày.
                        if (!isThuViec)
                        {
                            // Ngày làm việc + ngày lễ hưởng lương đều tính vào ngày công chính thức (xét luật 14 ngày)
                            soNgayLamChinhThuc += normalAtt.Count(c => c.NgayCong > 0) + soNgayLePeriod;
                            luongCoBanChinhThuc = contract.LuongCoBan;
                        }

                        finalLuongCoBan = contract.LuongCoBan;
                    }

                    // Luật BHXH (14 ngày): chỉ đóng BH nếu SỐ NGÀY làm việc/hưởng lương CHÍNH THỨC trong tháng ≥ 14.
                    // Đếm theo NGÀY (mỗi ngày đi làm = 1, kể cả nửa/lẻ ngày) — CHỈ ngày thuộc HĐ chính thức, không tính thử việc.
                    // < 14 ngày → KHÔNG đóng BH cả tháng đó. Mức đóng tính trên NGUYÊN lương HĐ chính thức (không prorate).
                    totalLuongDongBH = soNgayLamChinhThuc >= 14 ? luongCoBanChinhThuc : 0;
                }

                // ── PHỤ CẤP (tính theo SỐ NGÀY CÔNG THƯỜNG đi làm thực tế) ──
                // CHỈ tính ngày T2-T6 KHÔNG lễ có đi làm (chấm công Làm việc/Công tác).
                // KHÔNG tính T7/CN/ngày lễ (kể cả có đơn OT) — các ngày đó được trả qua OT, không hưởng phụ cấp ngày.
                int soNgayDiLam = empAtt.Count(c =>
                    !holidayDaySet.Contains(c.NgayChamCong.Day)
                    && c.NgayChamCong.DayOfWeek != DayOfWeek.Saturday
                    && c.NgayChamCong.DayOfWeek != DayOfWeek.Sunday
                    && c.LoaiNgayCong != LoaiCong.NghiPhep
                    && c.LoaiNgayCong != LoaiCong.NghiKhongLuong
                    && c.LoaiNgayCong != LoaiCong.NghiKhongPhep
                    && (c.GioCheckIn != null
                        || (c.NgayCong > 0 && (c.LoaiNgayCong == LoaiCong.LamViec || c.LoaiNgayCong == LoaiCong.CongTac))));

                const double DUNG_SAI_CHUYEN_CAN = 2; // thiếu tối đa 2 ngày so với công chuẩn vẫn đủ chuyên cần

                // Ngày lễ (hưởng lương) được coi như "đủ công" cho tiền XE & CHUYÊN CẦN → NV đi đủ ngày
                // thường vẫn đạt đủ công chuẩn. Tiền ĂN chỉ tính theo ngày THỰC đi làm (không tính lễ).
                int soNgayPhuCap      = soNgayDiLam + soNgayLeHuongLuong;
                decimal dailyXe       = standardWorkDays > 0 ? tienGuiXeThang / standardWorkDays : 0;
                decimal calcTienAn    = Math.Round(tienAnMoiNgay * soNgayDiLam, 0);
                // Tiền xe = (xe tháng / công chuẩn) × ngày công, NHƯNG không vượt mức xe tháng quy định
                decimal calcTienXe    = Math.Min(tienGuiXeThang, Math.Round(dailyXe * soNgayPhuCap, 0));
                decimal calcChuyenCan = soNgayPhuCap >= (double)standardWorkDays - DUNG_SAI_CHUYEN_CAN
                                        ? tienChuyenCanMax : 0m;

                decimal tongPhuCap = calcTienAn + calcTienXe + calcChuyenCan;

                // ── BẢO HIỂM ──
                // Trần BHXH+BHYT: 20 × lương cơ sở (đọc từ settings, mặc định 2.530.000)
                decimal luongCoSo   = sys?.MucLuongCoSo > 0 ? sys.MucLuongCoSo : 2_530_000m;
                decimal bhXHYTCap   = luongCoSo * 20m;
                decimal luongBHXHYT = Math.Min(totalLuongDongBH, bhXHYTCap);
                decimal khauBHXH    = Math.Round(luongBHXHYT * 0.08m, 0);
                decimal khauBHYT    = Math.Round(luongBHXHYT * 0.015m, 0);

                // Trần BHTN: 20 × lương tối thiểu vùng I (NĐ 293/2025: 5.310.000 × 20 = 106.200.000)
                decimal luongToiThieuVung = sys?.LuongToiThieuVung > 0 ? sys.LuongToiThieuVung : 5_310_000m;
                decimal tranBHTN  = luongToiThieuVung * 20m;
                decimal luongBHTN = Math.Min(totalLuongDongBH, tranBHTN);
                decimal khauBHTN  = Math.Round(luongBHTN * 0.01m, 0);

                decimal tongBH = khauBHXH + khauBHYT + khauBHTN;

                // ── THUẾ TNCN ──
                bool empIsThuViec = activeContracts != null && activeContracts.Count > 0
                    ? activeContracts.All(c => c.LoaiHopDong?.Contains("thử việc", StringComparison.OrdinalIgnoreCase) == true)
                    : emp.LoaiNhanVien?.Contains("thử việc", StringComparison.OrdinalIgnoreCase) == true;

                decimal tongThuNhap = totalLuongChinh + totalLuongOT + totalLuongLamThemLe + tongPhuCap;
                decimal thueTNCN;
                if (empIsThuViec)
                {
                    // Hợp đồng thử việc < 3 tháng: khấu trừ 10% nếu thu nhập >= 2 triệu (Điều 25 TT111)
                    thueTNCN = tongThuNhap >= 2_000_000m ? Math.Round(tongThuNhap * 0.10m, 0) : 0m;
                }
                else
                {
                    decimal giamTruPT = emp.SoNguoiPhuThuoc * giamTruPhuThuoc;
                    decimal thuNhapCT = tongThuNhap - tongBH - giamTruBanThan - giamTruPT;
                    thueTNCN = TinhThueTNCNLuyTien(thuNhapCT);
                }

                // Dựng chi tiết OT 3 loại (chỉ thêm loại có giờ > 0)
                var chiTietOTList = new List<ChiTietOT>();
                if (otGioThuong   > 0) chiTietOTList.Add(new ChiTietOT { LoaiNgay = "Ngày thường", SoGio = otGioThuong,   HeSo = heSoOtThuong,  ThanhTien = Math.Round(otTienThuong, 0) });
                if (otGioCuoiTuan > 0) chiTietOTList.Add(new ChiTietOT { LoaiNgay = "T7-CN",       SoGio = otGioCuoiTuan, HeSo = heSoOtCuoiTuan, ThanhTien = Math.Round(otTienCuoiTuan, 0) });
                if (otGioLe       > 0) chiTietOTList.Add(new ChiTietOT { LoaiNgay = "Ngày lễ",     SoGio = otGioLe,       HeSo = heSoOtLe,      ThanhTien = Math.Round(otTienLe, 0) });

                newPayrolls.Add(new BangLuong
                {
                    MaNhanVien          = emp.MaNhanVien,
                    Thang               = dto.Month,
                    Nam                 = dto.Year,
                    LuongCoBan          = finalLuongCoBan,
                    LuongDongBaoHiem    = finalLuongCoBan,
                    TongPhuCap          = Math.Round(tongPhuCap, 0),
                    TienAn              = calcTienAn,
                    TienGuiXe           = calcTienXe,
                    TienChuyenCan       = calcChuyenCan,
                    TongNgayCong        = Math.Round(totalWorkDays, 2),
                    SoCongChuanTrongThang = standardWorkDays,
                    TongGioOT           = totalOTHours,
                    TongCongChuanOT     = Math.Round(totalCongChuanOT, 2),
                    LuongChinh          = Math.Round(totalLuongChinh, 0),
                    LuongOT             = Math.Round(totalLuongOT, 0),
                    LuongLamThemLe      = 0, // đã gộp OT lễ vào LuongOT; giữ cột để tương thích, không dùng nữa
                    ChiTietHopDongJson  = chiTietSegments.Any() ? JsonSerializer.Serialize(chiTietSegments) : null,
                    ChiTietOTJson       = chiTietOTList.Any() ? JsonSerializer.Serialize(chiTietOTList) : null,
                    KhauTruBHXH         = Math.Round(khauBHXH, 0),
                    KhauTruBHYT         = Math.Round(khauBHYT, 0),
                    KhauTruBHTN         = Math.Round(khauBHTN, 0),
                    ThueTNCN            = Math.Round(thueTNCN, 0),
                    KhoanTruKhac        = 0,
                    TongThuNhap         = Math.Round(tongThuNhap, 0),
                    ThucLanh            = Math.Round(tongThuNhap - tongBH - thueTNCN, 0),
                    DaChot              = false,
                    NgayTinhLuong       = DateTime.UtcNow
                });
            }

            await _context.BangLuongs.AddRangeAsync(newPayrolls);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã tính lương cho {newPayrolls.Count} nhân viên." });
        }

        // ==============================================================
        // 2. LẤY DỮ LIỆU BẢNG LƯƠNG
        // ==============================================================
        [HttpGet]
        public async Task<IActionResult> GetPayroll([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                var role          = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
                var deptId        = User.FindFirst("MaPhongBan")?.Value;
                var currentEmpId  = User.FindFirst("MaNhanVien")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var monthStart2    = new DateTime(year, month, 1);
                var monthEnd2      = monthStart2.AddMonths(1);
                var excludedRoles2 = new[] { "Giám đốc", "Tổng giám đốc", "Admin" };

                // Fetch savedPayrolls trước để dùng làm fallback cho NV null NgayVaoLam
                var savedPayrolls = await _context.BangLuongs
                                        .Include(b => b.NhanVien).ThenInclude(nv => nv.PhongBan)
                                        .Include(b => b.NhanVien).ThenInclude(nv => nv.ChucVuNhanVien)
                                        .Where(b => b.Nam == year && b.Thang == month).ToListAsync();

                // NV có NgayVaoLam + chưa vượt tháng → hiển thị
                // NV null NgayVaoLam → chỉ hiển thị nếu đã có bảng lương lưu (NV cũ)
                var savedIds = savedPayrolls.Select(p => p.MaNhanVien).ToList();
                var employees = await _context.NhanViens
                                        .Include(nv => nv.PhongBan)
                                        .Include(nv => nv.ChucVuNhanVien)
                                        .Include(nv => nv.UserRole)
                                        .Where(nv => nv.TrangThai == true
                                                  && (nv.UserRole == null || !excludedRoles2.Contains(nv.UserRole.NameRole))
                                                  && (
                                                      (nv.NgayVaoLam != null && nv.NgayVaoLam.Value < monthEnd2)
                                                      || savedIds.Contains(nv.MaNhanVien)
                                                  ))
                                        .ToListAsync();

                var attendanceData = await _context.ChamCongs
                    .Where(c => c.NgayChamCong.Year == year && c.NgayChamCong.Month == month).ToListAsync();

                var attendanceSummary = attendanceData
                    .Where(c => !string.IsNullOrEmpty(c.MaNhanVien))
                    .GroupBy(c => c.MaNhanVien)
                    .ToDictionary(g => g.Key, g => new
                    {
                        TongCong       = g.Sum(x => x.NgayCong),
                        NghiCoPhep     = g.Count(x => x.LoaiNgayCong == LoaiCong.NghiPhep),
                        NghiKhongLuong = g.Count(x => x.LoaiNgayCong == LoaiCong.NghiKhongLuong),
                        NghiKhongPhep  = g.Count(x => x.LoaiNgayCong == LoaiCong.NghiKhongPhep),
                        LamNuaNgay     = g.Count(x => x.NgayCong == 0.5)
                    });

                var otSummary = await _context.DangKyOTs
                    .Where(ot => ot.NgayLamThem.Year == year && ot.NgayLamThem.Month == month
                              && ot.TrangThai == "Đã duyệt" && !string.IsNullOrEmpty(ot.MaNhanVien))
                    .GroupBy(ot => ot.MaNhanVien)
                    .ToDictionaryAsync(k => k.Key, v => v.Sum(x => x.SoGio));

                var holidaysInMonth = await _context.NgayLes
                    .Where(nl => nl.Date >= monthStart2 && nl.Date < monthEnd2)
                    .Select(nl => nl.Date.Date).ToListAsync();

                decimal congChuanThang = TinhCongChuanThang(year, month, holidaysInMonth);

                // Tính số ngày làm lễ + tiền lễ cho từng NV (để hiển thị)
                var attendanceData2 = await _context.ChamCongs
                    .Where(c => c.NgayChamCong.Year == year && c.NgayChamCong.Month == month
                             && !string.IsNullOrEmpty(c.MaNhanVien))
                    .ToListAsync();

                var holidayDaySetGet = new HashSet<int>(holidaysInMonth.Select(h => h.Day));

                // Số ngày làm lễ = số ngày lễ NV có chấm công (>0) HOẶC có đơn OT đã duyệt (đếm ngày, không trùng)
                var holidayWorkDays = new Dictionary<string, HashSet<int>>();
                foreach (var c in attendanceData2)
                {
                    if (string.IsNullOrEmpty(c.MaNhanVien) || c.NgayCong <= 0) continue;
                    if (!holidayDaySetGet.Contains(c.NgayChamCong.Day)) continue;
                    if (!holidayWorkDays.TryGetValue(c.MaNhanVien, out var set)) { set = new HashSet<int>(); holidayWorkDays[c.MaNhanVien] = set; }
                    set.Add(c.NgayChamCong.Day);
                }
                var holidayOTs = await _context.DangKyOTs
                    .Where(ot => ot.NgayLamThem.Year == year && ot.NgayLamThem.Month == month
                              && ot.TrangThai == "Đã duyệt" && !string.IsNullOrEmpty(ot.MaNhanVien))
                    .ToListAsync();
                foreach (var o in holidayOTs)
                {
                    if (!holidayDaySetGet.Contains(o.NgayLamThem.Day)) continue;
                    if (!holidayWorkDays.TryGetValue(o.MaNhanVien, out var set)) { set = new HashSet<int>(); holidayWorkDays[o.MaNhanVien] = set; }
                    set.Add(o.NgayLamThem.Day);
                }

                var fullList = new List<BangLuong>();
                foreach (var emp in employees)
                {
                    var saved = savedPayrolls.FirstOrDefault(p => p.MaNhanVien == emp.MaNhanVien);
                    double ngayLamLe = holidayWorkDays.TryGetValue(emp.MaNhanVien, out var hl) ? hl.Count : 0;
                    if (saved != null)
                    {
                        saved.NhanVien       = emp;
                        saved.NghiCoPhep     = attendanceSummary.TryGetValue(emp.MaNhanVien, out var a) ? a.NghiCoPhep     : 0;
                        saved.NghiKhongLuong = attendanceSummary.TryGetValue(emp.MaNhanVien, out var b) ? b.NghiKhongLuong : 0;
                        saved.NghiKhongPhep  = attendanceSummary.TryGetValue(emp.MaNhanVien, out var c) ? c.NghiKhongPhep  : 0;
                        saved.LamNuaNgay     = attendanceSummary.TryGetValue(emp.MaNhanVien, out var d) ? d.LamNuaNgay     : 0;
                        saved.SoNgayLamLe    = ngayLamLe;
                        // TienLamLe hiển thị = phần làm thêm ngày lễ 300% (đã lưu sẵn trong LuongLamThemLe)
                        saved.TienLamLe      = saved.LuongLamThemLe;
                        if (saved.SoCongChuanTrongThang == 0) saved.SoCongChuanTrongThang = congChuanThang;
                        fullList.Add(saved);
                    }
                    else
                    {
                        double tongCong = attendanceSummary.TryGetValue(emp.MaNhanVien, out var att) ? att.TongCong : 0;
                        fullList.Add(new BangLuong
                        {
                            MaNhanVien            = emp.MaNhanVien,
                            NhanVien              = emp,
                            Thang                 = month,
                            Nam                   = year,
                            LuongCoBan            = emp.LuongCoBan,
                            SoCongChuanTrongThang = congChuanThang,
                            TongNgayCong          = tongCong,
                            TongGioOT             = otSummary.TryGetValue(emp.MaNhanVien, out var ot) ? ot : 0,
                            NghiCoPhep            = attendanceSummary.TryGetValue(emp.MaNhanVien, out var a2) ? a2.NghiCoPhep     : 0,
                            NghiKhongLuong        = attendanceSummary.TryGetValue(emp.MaNhanVien, out var b2) ? b2.NghiKhongLuong : 0,
                            NghiKhongPhep         = attendanceSummary.TryGetValue(emp.MaNhanVien, out var c2) ? c2.NghiKhongPhep  : 0,
                            LamNuaNgay            = attendanceSummary.TryGetValue(emp.MaNhanVien, out var d2) ? d2.LamNuaNgay     : 0,
                            DaChot                = false,
                            ThucLanh              = 0
                        });
                    }
                }

                IEnumerable<BangLuong> finalData = fullList;
                if (role != "Kế toán trưởng" && role != "Giám đốc" && role != "Nhân sự trưởng")
                {
                    finalData = finalData.Where(x => x.DaChot == true);
                    if (role == "Trưởng phòng")
                        finalData = finalData.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == deptId);
                    else
                        finalData = finalData.Where(x => !string.IsNullOrEmpty(currentEmpId)
                                        && x.MaNhanVien.Trim().Equals(currentEmpId.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                var isPublished     = savedPayrolls.Any(p => p.DaChot);
                decimal deptTotal   = role == "Trưởng phòng" ? finalData.Sum(x => x.ThucLanh) : 0;

                var result = finalData.OrderBy(x => x.MaNhanVien).Select(x => new
                {
                    x.Id,
                    x.MaNhanVien,
                    NhanVien = new {
                        HoTen       = x.NhanVien != null ? x.NhanVien.HoTen : null,
                        TenPhongBan = x.NhanVien?.PhongBan != null ? x.NhanVien.PhongBan.TenPhongBan : null,
                        TenChucVu   = x.NhanVien?.ChucVuNhanVien != null ? x.NhanVien.ChucVuNhanVien.TenChucVu : null,
                    },
                    x.Thang, x.Nam,
                    x.LuongCoBan, x.LuongDongBaoHiem,
                    x.SoCongChuanTrongThang,
                    x.TongNgayCong, x.TongGioOT, x.TongCongChuanOT,
                    x.TongPhuCap, x.TienAn, x.TienGuiXe, x.TienChuyenCan,
                    x.NghiCoPhep, x.NghiKhongLuong, x.NghiKhongPhep, x.LamNuaNgay,
                    x.SoNgayLamLe, x.TienLamLe,
                    x.LuongChinh, x.LuongOT, x.LuongLamThemLe,
                    x.KhauTruBHXH, x.KhauTruBHYT, x.KhauTruBHTN,
                    x.ThueTNCN, x.KhoanTruKhac, x.LyDoKhac,
                    x.TongThuNhap, x.ThucLanh, x.DaChot,
                    ChiTietHopDong = string.IsNullOrEmpty(x.ChiTietHopDongJson)
                        ? new List<ChiTietLuongHopDong>()
                        : JsonSerializer.Deserialize<List<ChiTietLuongHopDong>>(x.ChiTietHopDongJson),
                    ChiTietOT = string.IsNullOrEmpty(x.ChiTietOTJson)
                        ? new List<ChiTietOT>()
                        : JsonSerializer.Deserialize<List<ChiTietOT>>(x.ChiTietOTJson)
                }).ToList();

                return Ok(new { Data = result, IsPublished = isPublished, DepartmentTotal = deptTotal });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi lấy bảng lương: " + ex.Message);
            }
        }

        // ==============================================================
        // 3. LƯU CÁC KHOẢN TRỪ KHÁC
        // ==============================================================
        [HttpPost("save")]
        public async Task<IActionResult> SavePayroll([FromBody] List<PayrollAdjustDto> payrollData)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Kế toán trưởng" && role != "Giám đốc")
                return StatusCode(403, "Bạn không có quyền sửa bảng lương.");
            if (payrollData == null || !payrollData.Any()) return BadRequest("Không có dữ liệu.");

            var firstId  = payrollData.First().Id;
            var isLocked = await _context.BangLuongs.AnyAsync(b => b.Id == firstId && b.DaChot);
            if (isLocked && role != "Giám đốc")
                return BadRequest("Bảng lương đã chốt. Chỉ Giám đốc mới được sửa.");

            foreach (var item in payrollData)
            {
                var record = await _context.BangLuongs.FindAsync(item.Id);
                if (record != null)
                {
                    record.KhoanTruKhac = item.KhoanTruKhac;
                    record.LyDoKhac     = item.LyDoKhac;
                    // KhoanTruKhac > 0 = cộng thêm (thưởng), < 0 = trừ lương
                    decimal cacKhoanTru = record.KhauTruBHXH + record.KhauTruBHYT + record.KhauTruBHTN + record.ThueTNCN;
                    record.ThucLanh = record.TongThuNhap - cacKhoanTru + record.KhoanTruKhac;
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Lưu thành công." });
        }

        // ==============================================================
        // 4. CHỐT SỔ LƯƠNG
        // ==============================================================
        [HttpPost("publish")]
        public async Task<IActionResult> PublishSalary([FromBody] SalaryCalcDto dto, [FromQuery] bool status)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Kế toán trưởng" && role != "Giám đốc")
                return StatusCode(403, "Bạn không có quyền chốt lương.");

            var records = await _context.BangLuongs
                .Where(b => b.Nam == dto.Year && b.Thang == dto.Month).ToListAsync();
            if (!records.Any()) return BadRequest("Không có dữ liệu.");

            foreach (var r in records) r.DaChot = status;
            await _context.SaveChangesAsync();
            return Ok(new { message = status ? "Đã chốt lương." : "Đã hủy chốt lương." });
        }
    }
}
