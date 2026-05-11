using HRApi.Data;
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
        // HELPER: TÍNH THUẾ TNCN LŨY TIẾN
        // ==============================================================
        private decimal TinhThueTNCNLuyTien(decimal thuNhapTinhThue)
        {
            if (thuNhapTinhThue <= 0) return 0;
            if (thuNhapTinhThue <= 5000000) return thuNhapTinhThue * 0.05m;
            if (thuNhapTinhThue <= 10000000) return thuNhapTinhThue * 0.1m - 250000;
            if (thuNhapTinhThue <= 18000000) return thuNhapTinhThue * 0.15m - 750000;
            if (thuNhapTinhThue <= 32000000) return thuNhapTinhThue * 0.2m - 1650000;
            if (thuNhapTinhThue <= 52000000) return thuNhapTinhThue * 0.25m - 3250000;
            if (thuNhapTinhThue <= 80000000) return thuNhapTinhThue * 0.3m - 5850000;
            return thuNhapTinhThue * 0.35m - 9850000;
        }

        // ==============================================================
        // HELPER: CÔNG CHUẨN (CHỈ TRỪ CHỦ NHẬT, KHÔNG TRỪ LỄ)
        // ==============================================================
        private int GetStandardWorkDays(int year, int month)
        {
            int days = DateTime.DaysInMonth(year, month);
            int count = 0;
            for (int i = 1; i <= days; i++)
            {
                var date = new DateTime(year, month, i);
                if (date.DayOfWeek != DayOfWeek.Sunday)
                    count++;
            }
            return count;
        }

        // ==============================================================
        // 1. TÍNH LƯƠNG (TỰ ĐỘNG X300% NẾU CÓ CHẤM CÔNG VÀO NGÀY LỄ)
        // ==============================================================
        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateSalary([FromBody] SalaryCalcDto dto)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Kế toán trưởng" && role != "Giám đốc") return StatusCode(403, "Bạn không có quyền thực hiện tính lương.");

            var isAttendanceLocked = await _context.KhoaCongs.AnyAsync(k => k.Nam == dto.Year && k.Thang == dto.Month && k.IsLocked);
            if (!isAttendanceLocked) return BadRequest("Bảng công chưa khóa. Vui lòng yêu cầu Nhân sự khóa công trước.");

            var isPayrollLocked = await _context.BangLuongs.AnyAsync(b => b.Nam == dto.Year && b.Thang == dto.Month && b.DaChot);
            if (isPayrollLocked) return BadRequest("Bảng lương đã chốt. Cần hủy chốt trước khi tính lại.");

            var oldDrafts = await _context.BangLuongs.Where(b => b.Nam == dto.Year && b.Thang == dto.Month && !b.DaChot).ToListAsync();
            _context.BangLuongs.RemoveRange(oldDrafts);
            await _context.SaveChangesAsync();

            // Kéo cấu hình từ Cài đặt hệ thống
            var sysSettings = await _context.SystemSettings.FirstOrDefaultAsync();
            decimal giamTruBanThanBase = sysSettings?.GiamTruGiaCanh ?? 11000000m;
            decimal giamTruPhuThuocBase = sysSettings?.GiamTruPhuThuoc ?? 4400000m;
            decimal phanTramBHXH = (decimal)(sysSettings?.PhanTramBHXHEmployee ?? 10.5) / 100m;

            decimal heSoOtThuong = (decimal)(sysSettings?.HeSoOTNgayThuong ?? 1.5);
            decimal heSoOtCuoiTuan = (decimal)(sysSettings?.HeSoOTCuoiTuan ?? 2.0);
            decimal heSoOtLe = (decimal)(sysSettings?.HeSoOTNgayLe ?? 3.0); // Mặc định x3.0

            var employees = await _context.NhanViens.Include(n => n.HopDongs).Where(e => e.TrangThai == true).ToListAsync();

            var monthStart = new DateTime(dto.Year, dto.Month, 1);
            var monthEnd = monthStart.AddMonths(1);

            var attendanceData = await _context.ChamCongs.Where(c => c.NgayChamCong >= monthStart && c.NgayChamCong < monthEnd).ToListAsync();
            var otEntries = await _context.DangKyOTs.Where(ot => ot.NgayLamThem >= monthStart && ot.NgayLamThem < monthEnd && ot.TrangThai == "Đã duyệt").ToListAsync();

            // Bảng Ngày Lễ
            var holidaysInMonth = await _context.NgayLes
                .Where(nl => nl.Date.Year == dto.Year && nl.Date.Month == dto.Month)
                .Select(nl => nl.Date.Date)
                .ToListAsync();

            decimal standardWorkDays = GetStandardWorkDays(dto.Year, dto.Month);
            var newPayrolls = new List<BangLuong>();

            foreach (var emp in employees)
            {
                var activeContractsInMonth = emp.HopDongs?
                    .Where(h => h.NgayBatDau < monthEnd && (h.NgayKetThuc == null || h.NgayKetThuc >= monthStart))
                    .OrderBy(h => h.NgayBatDau)
                    .ToList();

                decimal totalLuongChinh = 0, totalLuongOT = 0, totalLuongDongBH = 0;
                double totalWorkDays = 0, totalOTHours = 0;
                decimal finalLuongCoBanDisplay = emp.LuongCoBan;
                decimal finalLuongDongBHDisplay = emp.LuongCoBan;

                var empAttTotal = attendanceData.Where(c => c.MaNhanVien == emp.MaNhanVien).ToList();
                var empOTTotal = otEntries.Where(x => x.MaNhanVien == emp.MaNhanVien).ToList();

                if (activeContractsInMonth != null && activeContractsInMonth.Any())
                {
                    foreach (var contract in activeContractsInMonth)
                    {
                        DateTime periodStart = contract.NgayBatDau > monthStart ? contract.NgayBatDau : monthStart;
                        DateTime periodEnd = (contract.NgayKetThuc.HasValue && contract.NgayKetThuc.Value < monthEnd.AddDays(-1))
                                             ? contract.NgayKetThuc.Value
                                             : monthEnd.AddDays(-1);

                        var periodAtt = empAttTotal.Where(c => c.NgayChamCong.Date >= periodStart.Date && c.NgayChamCong.Date <= periodEnd.Date).ToList();
                        var periodOT = empOTTotal.Where(o => o.NgayLamThem.Date >= periodStart.Date && o.NgayLamThem.Date <= periodEnd.Date).ToList();

                        // --- 1. TÁCH RỔ CHẤM CÔNG ---
                        var normalAtt = periodAtt.Where(c => !holidaysInMonth.Contains(c.NgayChamCong.Date)).ToList();
                        var holidayAtt = periodAtt.Where(c => holidaysInMonth.Contains(c.NgayChamCong.Date)).ToList();

                        double normalNgayCong = normalAtt.Sum(c => c.NgayCong); // Tổng ngày đi làm thường
                        double holidayWorkCong = holidayAtt.Sum(c => c.NgayCong); // TỔNG NGÀY ĐI LÀM LỄ (Chìa khóa nằm đây)

                        // Tổng số ngày lễ trong tháng
                        int holidaysInPeriod = holidaysInMonth.Count(h => h >= periodStart.Date && h <= periodEnd.Date && h.DayOfWeek != DayOfWeek.Sunday);

                        // Lễ được nghỉ ở nhà hưởng lương
                        double leNghiONha = Math.Max(0, holidaysInPeriod - holidayWorkCong);

                        // Tổng công hiển thị UI
                        double congChinh = normalNgayCong + holidayWorkCong + leNghiONha;
                        totalWorkDays += congChinh;

                        // --- 2. TÍNH TIỀN LƯƠNG CHÍNH (TỰ ĐỘNG X300%) ---
                        decimal dailyRate = contract.LuongCoBan / standardWorkDays;

                        decimal luongNgayThuong = dailyRate * (decimal)normalNgayCong; // Đi làm ngày thường (x1)
                        decimal luongNghiLe = dailyRate * (decimal)leNghiONha; // Ở nhà nghỉ lễ (x1)

                        // ĐI LÀM NGÀY LỄ -> TỰ ĐỘNG NHÂN HỆ SỐ (Ví dụ x3.0) KHÔNG CẦN ĐƠN OT
                        decimal luongDiLamLe = dailyRate * (decimal)holidayWorkCong * heSoOtLe;

                        totalLuongChinh += (luongNgayThuong + luongNghiLe + luongDiLamLe);

                        // --- 3. TÍNH ĐƠN OT NGÀY THƯỜNG ---
                        decimal periodHourlyRate = dailyRate / 8m;
                        foreach (var ot in periodOT)
                        {
                            // BẢO VỆ KÉP: Bỏ qua các đơn xin OT nếu nó rơi vào ngày Lễ (Vì đã tự x3 ở trên rồi)
                            if (holidaysInMonth.Contains(ot.NgayLamThem.Date)) continue;

                            decimal multiplier = ot.NgayLamThem.DayOfWeek == DayOfWeek.Sunday ? heSoOtCuoiTuan : heSoOtThuong;
                            totalLuongOT += periodHourlyRate * multiplier * (decimal)ot.SoGio;
                            totalOTHours += ot.SoGio;
                        }

                        // --- 4. TÍNH BẢO HIỂM ---
                        bool isThuViec = contract.LoaiHopDong != null && contract.LoaiHopDong.ToLower().Contains("thử việc");
                        if (!isThuViec)
                        {
                            totalLuongDongBH += (contract.LuongDongBaoHiem / standardWorkDays) * (decimal)(normalNgayCong + holidaysInPeriod);
                        }

                        finalLuongCoBanDisplay = contract.LuongCoBan;
                        finalLuongDongBHDisplay = contract.LuongDongBaoHiem;
                    }
                }
                else
                {
                    totalWorkDays = empAttTotal.Sum(c => c.NgayCong);
                    totalLuongChinh = (emp.LuongCoBan / standardWorkDays) * (decimal)totalWorkDays;
                    bool isThuViec = emp.LoaiNhanVien != null && emp.LoaiNhanVien.ToLower().Contains("thử việc");
                    totalLuongDongBH = isThuViec ? 0 : (emp.LuongCoBan / standardWorkDays) * (decimal)totalWorkDays;
                }

                decimal phuCap = Math.Round((emp.LuongTroCap / standardWorkDays) * (decimal)totalWorkDays, 0);
                decimal tongBaoHiem = totalLuongDongBH * phanTramBHXH;
                decimal tongThuNhap = totalLuongChinh + totalLuongOT + phuCap;

                int soNguoiPhuThuoc = emp.SoNguoiPhuThuoc;
                decimal giamTruPhuThuoc = soNguoiPhuThuoc * giamTruPhuThuocBase;

                decimal thuNhapChiuThue = tongThuNhap - tongBaoHiem - giamTruBanThanBase - giamTruPhuThuoc;
                decimal thueTNCN = TinhThueTNCNLuyTien(thuNhapChiuThue);

                newPayrolls.Add(new BangLuong
                {
                    MaNhanVien = emp.MaNhanVien,
                    Thang = dto.Month,
                    Nam = dto.Year,
                    LuongCoBan = finalLuongCoBanDisplay,
                    LuongDongBaoHiem = finalLuongDongBHDisplay,
                    TongPhuCap = phuCap,
                    TongNgayCong = totalWorkDays,
                    SoCongChuanTrongThang = standardWorkDays,
                    TongGioOT = totalOTHours,
                    LuongOT = Math.Round(totalLuongOT, 0),
                    LuongChinh = Math.Round(totalLuongChinh, 0),
                    KhauTruBHXH = Math.Round(tongBaoHiem, 0),
                    KhauTruBHYT = 0,
                    KhauTruBHTN = 0,
                    ThueTNCN = Math.Round(thueTNCN, 0),
                    KhoanTruKhac = 0,
                    TongThuNhap = Math.Round(tongThuNhap, 0),
                    ThucLanh = Math.Round(tongThuNhap - tongBaoHiem - thueTNCN, 0),
                    DaChot = false,
                    NgayTinhLuong = DateTime.UtcNow
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
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
                var deptId = User.FindFirst("MaPhongBan")?.Value;
                var currentEmpId = User.FindFirst("MaNhanVien")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var employees = await _context.NhanViens.Where(nv => nv.TrangThai == true).ToListAsync();
                var savedPayrolls = await _context.BangLuongs.Include(b => b.NhanVien).Where(b => b.Nam == year && b.Thang == month).ToListAsync();

                var attendanceData = await _context.ChamCongs.Where(c => c.NgayChamCong.Year == year && c.NgayChamCong.Month == month).ToListAsync();

                var attendanceSummary = attendanceData.GroupBy(c => c.MaNhanVien).ToDictionary(g => g.Key, g => new
                {
                    TongCong = g.Sum(x => x.NgayCong),
                    NghiCoPhep = g.Count(x => x.NgayCong == 1.0 && x.LoaiNgayCong == "Nghỉ phép"),
                    NghiKhongLuong = g.Count(x => x.NgayCong == 0.0 && x.LoaiNgayCong == "Nghỉ không lương"),
                    NghiKhongPhep = g.Count(x => x.NgayCong == 0.0 && (string.IsNullOrEmpty(x.GhiChu) || !x.GhiChu.ToLower().Contains("không lương")) && x.LoaiNgayCong != "Làm việc"),
                    LamNuaNgay = g.Count(x => x.NgayCong == 0.5)
                });

                var otSummary = await _context.DangKyOTs
                    .Where(ot => ot.NgayLamThem.Year == year && ot.NgayLamThem.Month == month && ot.TrangThai == "Đã duyệt")
                    .GroupBy(ot => ot.MaNhanVien)
                    .ToDictionaryAsync(k => k.Key, v => v.Sum(x => x.SoGio));

                var fullList = new List<BangLuong>();

                foreach (var emp in employees)
                {
                    var savedRecord = savedPayrolls.FirstOrDefault(p => p.MaNhanVien == emp.MaNhanVien);
                    if (savedRecord != null)
                    {
                        savedRecord.NhanVien = emp;
                        savedRecord.NghiCoPhep = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].NghiCoPhep : 0;
                        savedRecord.NghiKhongLuong = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].NghiKhongLuong : 0;
                        savedRecord.NghiKhongPhep = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].NghiKhongPhep : 0;
                        savedRecord.LamNuaNgay = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].LamNuaNgay : 0;

                        if (savedRecord.SoCongChuanTrongThang == 0) savedRecord.SoCongChuanTrongThang = GetStandardWorkDays(year, month);
                        fullList.Add(savedRecord);
                    }
                    else
                    {
                        fullList.Add(new BangLuong
                        {
                            MaNhanVien = emp.MaNhanVien,
                            NhanVien = emp,
                            Thang = month,
                            Nam = year,
                            LuongCoBan = emp.LuongCoBan,
                            TongPhuCap = emp.LuongTroCap,
                            SoCongChuanTrongThang = GetStandardWorkDays(year, month),
                            TongNgayCong = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].TongCong : 0,
                            TongGioOT = otSummary.ContainsKey(emp.MaNhanVien) ? otSummary[emp.MaNhanVien] : 0,
                            NghiCoPhep = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].NghiCoPhep : 0,
                            NghiKhongLuong = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].NghiKhongLuong : 0,
                            NghiKhongPhep = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].NghiKhongPhep : 0,
                            LamNuaNgay = attendanceSummary.ContainsKey(emp.MaNhanVien) ? attendanceSummary[emp.MaNhanVien].LamNuaNgay : 0,
                            DaChot = false,
                            ThucLanh = 0
                        });
                    }
                }

                IEnumerable<BangLuong> finalData = fullList;
                if (role != "Kế toán trưởng" && role != "Giám đốc" && role != "Nhân sự trưởng")
                {
                    finalData = finalData.Where(x => x.DaChot == true);
                    if (role == "Trưởng phòng") finalData = finalData.Where(x => x.NhanVien.MaPhongBan == deptId);
                    else finalData = finalData.Where(x => !string.IsNullOrEmpty(currentEmpId) && x.MaNhanVien.Trim().Equals(currentEmpId.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                var isPublished = savedPayrolls.Any(p => p.DaChot);
                decimal departmentTotal = role == "Trưởng phòng" ? finalData.Sum(x => x.ThucLanh) : 0;

                return Ok(new { Data = finalData.OrderBy(x => x.MaNhanVien).ToList(), IsPublished = isPublished, DepartmentTotal = departmentTotal });
            }
            catch (Exception ex) { return StatusCode(500, "Lỗi lấy bảng lương: " + ex.Message); }
        }

        // ==============================================================
        // 3. LƯU CÁC KHOẢN TRỪ KHÁC
        // ==============================================================
        [HttpPost("save")]
        public async Task<IActionResult> SavePayroll([FromBody] List<BangLuong> payrollData)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Kế toán trưởng" && role != "Giám đốc") return StatusCode(403, "Bạn không có quyền sửa bảng lương.");
            if (payrollData == null || !payrollData.Any()) return BadRequest("Không có dữ liệu.");

            var firstId = payrollData.First().Id;
            var isLocked = await _context.BangLuongs.AnyAsync(b => b.Id == firstId && b.DaChot);
            if (isLocked && role != "Giám đốc") return BadRequest("Bảng lương đã chốt. Chỉ Giám đốc mới được sửa.");

            foreach (var item in payrollData)
            {
                var record = await _context.BangLuongs.FindAsync(item.Id);
                if (record != null)
                {
                    record.KhoanTruKhac = item.KhoanTruKhac;
                    decimal cacKhoanTru = record.KhauTruBHXH + record.KhauTruBHYT + record.KhauTruBHTN + record.ThueTNCN + record.KhoanTruKhac;
                    record.ThucLanh = record.TongThuNhap - cacKhoanTru;
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
            if (role != "Kế toán trưởng" && role != "Giám đốc") return StatusCode(403, "Bạn không có quyền chốt lương.");

            var records = await _context.BangLuongs.Where(b => b.Nam == dto.Year && b.Thang == dto.Month).ToListAsync();
            if (!records.Any()) return BadRequest("Không có dữ liệu.");

            foreach (var r in records) r.DaChot = status;
            await _context.SaveChangesAsync();

            return Ok(new { message = status ? "Đã chốt lương." : "Đã hủy chốt lương." });
        }
    }
}