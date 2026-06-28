using HRApi.Data;
using HRApi.Helpers;
using HRApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        // ==============================================================
        // HELPER: TÍNH CÔNG CHUẨN THỰC TẾ (T2-T6 trừ ngày lễ)
        // ==============================================================
        private decimal TinhCongChuanThang(int year, int month, List<DateTime> holidays)
        {
            int count = 0;
            int daysInMonth = DateTime.DaysInMonth(year, month);
            for (int day = 1; day <= daysInMonth; day++)
            {
                var date = new DateTime(year, month, day);
                if (date.DayOfWeek != DayOfWeek.Saturday &&
                    date.DayOfWeek != DayOfWeek.Sunday &&
                    !holidays.Contains(date.Date))
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
                    .OrderBy(h => h.NgayBatDau).ToList();

                decimal totalLuongChinh = 0, totalLuongOT = 0, totalLuongDongBH = 0;
                decimal totalLuongLamThemLe = 0;
                double  totalWorkDays = 0, totalOTHours = 0;
                decimal totalCongChuanOT = 0;
                decimal finalLuongCoBan = emp.LuongCoBan;

                var empAtt = attendanceData.Where(c => c.MaNhanVien == emp.MaNhanVien).ToList();
                var empOT  = otEntries.Where(x => x.MaNhanVien == emp.MaNhanVien).ToList();

                if (activeContracts != null && activeContracts.Any())
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

                        // Tách ngày lễ / ngày thường — so sánh theo Day để tránh DateTime Kind mismatch
                        // CÔNG THƯỜNG chỉ tính T2-T6 không phải lễ. Chấm công T7/CN KHÔNG vào công thường
                        // (làm cuối tuần phải qua đơn OT hệ số 2.0).
                        var normalAtt  = periodAtt.Where(c => !holidayDaySet.Contains(c.NgayChamCong.Day)
                                                           && c.NgayChamCong.DayOfWeek != DayOfWeek.Saturday
                                                           && c.NgayChamCong.DayOfWeek != DayOfWeek.Sunday).ToList();
                        var holidayAtt = periodAtt.Where(c =>  holidayDaySet.Contains(c.NgayChamCong.Day)).ToList();

                        double normalNgayCong  = normalAtt.Sum(c => c.NgayCong);
                        double holidayWorkCong = holidayAtt.Sum(c => c.NgayCong);

                        int holidaysInPeriod = holidaysInMonth
                            .Count(h => h >= periodStart.Date && h <= periodEnd.Date && h.DayOfWeek != DayOfWeek.Sunday);
                        double leNghiONha = Math.Max(0, holidaysInPeriod - holidayWorkCong);

                        double congChinh = normalNgayCong + holidayWorkCong + leNghiONha;
                        totalWorkDays += congChinh;

                        // Lương chính (thử việc = 85% lương cơ bản)
                        decimal dailyRate    = contract.LuongCoBan * salaryMultiplier / standardWorkDays;
                        decimal luongThuong  = dailyRate * (decimal)normalNgayCong;
                        // 100% nguyên lương cho TẤT CẢ ngày lễ (cả nghỉ ở nhà lẫn đi làm) → thuộc lương chính
                        decimal luongNghiLe  = dailyRate * (decimal)(leNghiONha + holidayWorkCong);
                        totalLuongChinh += luongThuong + luongNghiLe;
                        // Tiền làm thêm ngày lễ: 300% (heSoOtLe) — tách riêng khỏi lương chính (Điều 98 BLLĐ)
                        decimal luongLamThemLe = dailyRate * (decimal)holidayWorkCong * heSoOtLe;
                        totalLuongLamThemLe += luongLamThemLe;

                        // OT — quy đổi sang công chuẩn OT
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
                            totalCongChuanOT += congChuanOT;
                            totalLuongOT     += hourlyRate * congChuanOT;
                            totalOTHours     += ot.SoGio;
                        }

                        // Căn cứ đóng BH (A1): NGUYÊN lương cơ bản cố định của HĐ chính thức,
                        // KHÔNG prorate theo ngày công. Lấy theo HĐ chính thức (ghi đè nếu có nhiều kỳ).
                        if (!isThuViec)
                            totalLuongDongBH = contract.LuongCoBan;

                        finalLuongCoBan = contract.LuongCoBan;
                    }
                }
                else
                {
                    // Không có hợp đồng: tính đơn giản
                    totalWorkDays    = empAtt.Sum(c => c.NgayCong);
                    bool isThuViec   = emp.LoaiNhanVien?.Contains("thử việc", StringComparison.OrdinalIgnoreCase) == true;
                    decimal salaryMultiplier = isThuViec ? 0.85m : 1.0m;
                    totalLuongChinh  = (emp.LuongCoBan * salaryMultiplier / standardWorkDays) * (decimal)totalWorkDays;
                    // Căn cứ đóng BH (A1): nguyên lương cơ bản cố định, không prorate
                    totalLuongDongBH = isThuViec ? 0 : emp.LuongCoBan;
                }

                // ── PHỤ CẤP (tính theo SỐ NGÀY ĐI LÀM, đi nửa buổi cũng tính trọn 1 ngày) ──
                // Ngày đi làm = ngày có check-in HOẶC ngày công > 0 thuộc loại Làm việc / Công tác.
                int soNgayDiLam = empAtt.Count(c =>
                    c.LoaiNgayCong != LoaiCong.NghiPhep
                    && c.LoaiNgayCong != LoaiCong.NghiKhongLuong
                    && c.LoaiNgayCong != LoaiCong.NghiKhongPhep
                    && (c.GioCheckIn != null
                        || (c.NgayCong > 0 && (c.LoaiNgayCong == LoaiCong.LamViec || c.LoaiNgayCong == LoaiCong.CongTac))));

                const double DUNG_SAI_CHUYEN_CAN = 2; // thiếu tối đa 2 ngày so với công chuẩn vẫn đủ chuyên cần

                decimal dailyXe       = standardWorkDays > 0 ? tienGuiXeThang / standardWorkDays : 0;
                decimal calcTienAn    = Math.Round(tienAnMoiNgay * soNgayDiLam, 0);
                decimal calcTienXe    = Math.Round(dailyXe       * soNgayDiLam, 0);
                decimal calcChuyenCan = soNgayDiLam >= (double)standardWorkDays - DUNG_SAI_CHUYEN_CAN
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
                    LuongLamThemLe      = Math.Round(totalLuongLamThemLe, 0),
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
                var holidayWorkByEmp = attendanceData2
                    .Where(c => holidayDaySetGet.Contains(c.NgayChamCong.Day))
                    .GroupBy(c => c.MaNhanVien)
                    .ToDictionary(g => g.Key, g => g.Sum(c => c.NgayCong));

                var fullList = new List<BangLuong>();
                foreach (var emp in employees)
                {
                    var saved = savedPayrolls.FirstOrDefault(p => p.MaNhanVien == emp.MaNhanVien);
                    double ngayLamLe = holidayWorkByEmp.TryGetValue(emp.MaNhanVien, out var hl) ? hl : 0;
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
                    x.TongThuNhap, x.ThucLanh, x.DaChot
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
        public async Task<IActionResult> SavePayroll([FromBody] List<BangLuong> payrollData)
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
