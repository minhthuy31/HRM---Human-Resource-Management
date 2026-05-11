using HRApi.Data;
using HRApi.DTOs;
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
    public class ChamCongController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ChamCongController(AppDbContext context) { _context = context; }

        public class CheckInQRDto { public string QrToken { get; set; } }
        public class LockDto { public int Year { get; set; } public int Month { get; set; } }
        public class LockActionDto { public int Year { get; set; } public int Month { get; set; } public bool IsLocked { get; set; } }

        // ==============================================================
        // CẤU HÌNH CA LÀM VIÊC CHUẨN (SHIFT SETTINGS)
        // ==============================================================
        private readonly TimeSpan SHIFT_START = new TimeSpan(8, 0, 0);       // Bắt đầu ca: 08:00
        private readonly TimeSpan SHIFT_END = new TimeSpan(17, 0, 0);        // Kết thúc ca: 17:00
        private readonly TimeSpan LATE_GRACE = new TimeSpan(8, 15, 0);       // Cho phép muộn đến: 08:15
        private readonly TimeSpan EARLY_GRACE = new TimeSpan(16, 55, 0);     // Cho phép về sớm từ: 16:55
        private readonly TimeSpan LUNCH_START = new TimeSpan(12, 0, 0);      // Bắt đầu nghỉ trưa: 12:00
        private readonly TimeSpan LUNCH_END = new TimeSpan(13, 0, 0);        // Kết thúc nghỉ trưa: 13:00
        private const double CONG_FULL = 7.5;  // Mức giờ để đạt 1 công
        private const double CONG_NUA = 3.5;   // Mức giờ để đạt 0.5 công

        // HELPER: Đồng bộ múi giờ UTC+7
        private DateTime GetVnTime() => DateTime.UtcNow.AddHours(7);

        private bool IsAdminOrHR()
        {
            var role = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            return role == "Giám đốc" || role == "Nhân sự trưởng" || role == "Tổng giám đốc";
        }

        // ==============================================================
        // HELPER: KIỂM TRA MẠNG CÔNG TY CHUẨN (STRICT IP WHITELISTING)
        // ==============================================================
        private bool IsCompanyNetwork(out string detectedIp)
        {
            string[] companyIPs = { "58.187.57.2", "172.19.0.1", "127.0.0.1", "::1" };

            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();

            if (Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                clientIp = Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
            }

            // 1. Tạo biến cục bộ bình thường để hứng IP
            string ipToCheck = clientIp ?? "Unknown";

            // 2. Gán giá trị đó cho biến out để trả về thông báo lỗi
            detectedIp = ipToCheck;

            Console.WriteLine($"[DEBUG] Đang kiểm tra IP: {ipToCheck}");

            // 3. Sử dụng biến cục bộ 'ipToCheck' trong Lambda (KHÔNG dùng 'detectedIp')
            return companyIPs.Any(allowedIp => ipToCheck.Contains(allowedIp));
        }

        // ==============================================================
        // 1. CHECK-IN / CHECK-OUT BẰNG MÃ QR
        // ==============================================================
        [HttpPost("check-in-qr")]
        public async Task<IActionResult> CheckInWithQr([FromBody] CheckInQRDto dto)
        {
            if (!IsCompanyNetwork(out string detectedIp))
            {
                return BadRequest(new { message = $"Bạn đang dùng mạng ngoài (IP: {detectedIp}). Chỉ được chấm công khi kết nối Wifi công ty!" });
            }

            var maNhanVien = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (maNhanVien == null) return Unauthorized();

            var qrToken = await _context.ActiveQRTokens.FirstOrDefaultAsync(t => t.Token == dto.QrToken);
            if (qrToken == null || qrToken.IsUsed || qrToken.ExpiresAt < DateTime.UtcNow)
                return BadRequest(new { message = "Mã QR không hợp lệ hoặc đã hết hạn." });

            qrToken.IsUsed = true;

            DateTime vnTime = GetVnTime();
            DateTime today = vnTime.Date;

            var existing = await _context.ChamCongs.FirstOrDefaultAsync(c => c.MaNhanVien == maNhanVien && c.NgayChamCong.Date == today);

            if (existing != null)
            {
                if (existing.GioCheckIn == null)
                {
                    existing.GioCheckIn = vnTime;
                    existing.DiMuon = vnTime.TimeOfDay > LATE_GRACE;
                    existing.GhiChu = existing.DiMuon ? "Check-in qua QR (Đi muộn)" : "Check-in qua QR";

                    _context.ChamCongs.Update(existing);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Check-in thành công!", time = existing.GioCheckIn });
                }
                else
                {
                    if (existing.GioCheckOut != null) return BadRequest(new { message = "Bạn đã check-out rồi." });

                    existing.GioCheckOut = vnTime;

                    // NẾU DATABASE BẠN CHƯA THÊM CỘT VeSom THÌ CỨ ĐỂ COMMENT DÒNG NÀY LẠI
                    // existing.VeSom = vnTime.TimeOfDay < EARLY_GRACE;

                    existing.NgayCong = CalculateWorkDay(existing.GioCheckIn.Value, existing.GioCheckOut.Value);

                    string note = $"Check-in: {existing.GioCheckIn:HH:mm} | Check-out: {existing.GioCheckOut:HH:mm}";
                    if (existing.DiMuon) note += " (Đi muộn)";
                    // if (existing.VeSom) note += " (Về sớm)";
                    existing.GhiChu = note;

                    _context.ChamCongs.Update(existing);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = $"Check-out thành công. Công: {existing.NgayCong}" });
                }
            }
            else
            {
                bool isLate = vnTime.TimeOfDay > LATE_GRACE;
                var newChamCong = new ChamCong
                {
                    MaNhanVien = maNhanVien,
                    NgayChamCong = today,
                    GioCheckIn = vnTime,
                    NgayCong = 0.0,
                    DiMuon = isLate,
                    LoaiNgayCong = "Làm việc",
                    GhiChu = isLate ? "Check-in qua QR (Đi muộn)" : "Check-in qua QR"
                };
                _context.ChamCongs.Add(newChamCong);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Check-in thành công!", time = newChamCong.GioCheckIn });
            }
        }

        // ==============================================================
        // 2. FACE ID: CHECK-IN / CHECK-OUT
        // ==============================================================
        [HttpPost("check-in-face")]
        public async Task<IActionResult> CheckInWithFace([FromBody] CheckInFaceDto dto)
        {
            if (!IsCompanyNetwork(out string detectedIp))
            {
                return BadRequest(new { success = false, message = $"Bạn đang dùng mạng ngoài (IP: {detectedIp}). Chỉ được chấm công bằng Wifi công ty!" });
            }

            var currentUserId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized(new { success = false, message = "Phiên đăng nhập không hợp lệ." });

            var userFace = await _context.FaceDatas.FirstOrDefaultAsync(f => f.MaNhanVien == currentUserId);
            if (userFace == null) return BadRequest(new { success = false, message = "Bạn chưa cài đặt dữ liệu khuôn mặt." });

            var storedVector = JsonSerializer.Deserialize<float[]>(userFace.FaceDescriptor);
            var distance = CalculateEuclideanDistance(dto.FaceDescriptor, storedVector);

            if (distance > 0.45) return BadRequest(new { success = false, message = "Khuôn mặt không khớp với tài khoản." });

            DateTime vnTime = GetVnTime();
            DateTime today = vnTime.Date;

            var existing = await _context.ChamCongs.FirstOrDefaultAsync(c => c.MaNhanVien == currentUserId && c.NgayChamCong.Date == today);

            if (existing != null)
            {
                if (existing.GioCheckIn == null)
                {
                    existing.GioCheckIn = vnTime;
                    existing.DiMuon = vnTime.TimeOfDay > LATE_GRACE;
                    existing.GhiChu = existing.DiMuon ? "Face Check-in (Đi muộn)" : "Face Check-in";

                    _context.ChamCongs.Update(existing);
                    await _context.SaveChangesAsync();

                    var nvCheckIn = await _context.NhanViens.FindAsync(currentUserId);
                    return Ok(new { success = true, message = $"Check-in thành công cho {nvCheckIn?.HoTen}!", time = existing.GioCheckIn });
                }
                else
                {
                    if (existing.GioCheckOut != null) return BadRequest(new { success = false, message = "Bạn đã check-out hôm nay rồi." });

                    existing.GioCheckOut = vnTime;

                    // NẾU DATABASE BẠN CHƯA THÊM CỘT VeSom THÌ CỨ ĐỂ COMMENT DÒNG NÀY LẠI
                    // existing.VeSom = vnTime.TimeOfDay < EARLY_GRACE;

                    // TÍNH PHÚT LÀM VIỆC (15 phút = 1 công) 
                    double totalMinutes = (existing.GioCheckOut.Value - existing.GioCheckIn.Value).TotalMinutes;
                    if (totalMinutes >= 15.0) existing.NgayCong = 1.0;
                    else if (totalMinutes >= 7.0) existing.NgayCong = 0.5;
                    else existing.NgayCong = 0.0;

                    string note = $"Check-in: {existing.GioCheckIn:HH:mm} | Check-out: {existing.GioCheckOut:HH:mm}";
                    if (existing.DiMuon) note += " (Đi muộn)";
                    // if (existing.VeSom) note += " (Về sớm)";
                    existing.GhiChu = note;

                    _context.ChamCongs.Update(existing);
                    await _context.SaveChangesAsync();

                    var nvCheckOut = await _context.NhanViens.FindAsync(currentUserId);
                    return Ok(new { success = true, message = $"Check-out thành công cho {nvCheckOut?.HoTen}.", ngayCong = existing.NgayCong });
                }
            }
            else
            {
                bool isLate = vnTime.TimeOfDay > LATE_GRACE;
                var newChamCong = new ChamCong
                {
                    MaNhanVien = currentUserId,
                    NgayChamCong = today,
                    GioCheckIn = vnTime,
                    NgayCong = 0.0,
                    DiMuon = isLate,
                    LoaiNgayCong = "Làm việc",
                    GhiChu = isLate ? "Face Check-in (Đi muộn)" : "Face Check-in"
                };

                _context.ChamCongs.Add(newChamCong);
                await _context.SaveChangesAsync();

                var nv = await _context.NhanViens.FindAsync(currentUserId);
                return Ok(new { success = true, message = $"Check-in thành công cho {nv?.HoTen}!", time = newChamCong.GioCheckIn });
            }
        }

        // ==============================================================
        // 3. THUẬT TOÁN TÍNH CÔNG THEO GIỜ (CORE BUSINESS LOGIC)
        // ==============================================================
        private double CalculateWorkDay(DateTime checkIn, DateTime checkOut)
        {
            TimeSpan inTime = checkIn.TimeOfDay;
            TimeSpan outTime = checkOut.TimeOfDay;

            if (inTime < SHIFT_START) inTime = SHIFT_START;
            if (outTime > SHIFT_END) outTime = SHIFT_END;
            if (outTime <= inTime) return 0.0;

            double totalHours = (outTime - inTime).TotalHours;

            if (inTime < LUNCH_END && outTime > LUNCH_START)
            {
                TimeSpan overlapStart = (inTime > LUNCH_START) ? inTime : LUNCH_START;
                TimeSpan overlapEnd = (outTime < LUNCH_END) ? outTime : LUNCH_END;
                double lunchOverlapHours = (overlapEnd - overlapStart).TotalHours;
                if (lunchOverlapHours > 0) totalHours -= lunchOverlapHours;
            }

            if (totalHours >= CONG_FULL) return 1.0;
            if (totalHours >= CONG_NUA) return 0.5;
            return 0.0;
        }

        // ==============================================================
        // 4. LẤY DỮ LIỆU BẢNG CÔNG TỔNG HỢP THÁNG
        // ==============================================================
        [HttpGet]
        public async Task<IActionResult> GetChamCongThang([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                var currentUserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
                var currentUserId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var currentUserMaPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

                if (year < 1 || month < 1 || month > 12) return BadRequest("Thời gian sai.");

                var lockRecord = await _context.KhoaCongs.FirstOrDefaultAsync(k => k.Nam == year && k.Thang == month);
                bool isLocked = lockRecord != null && lockRecord.IsLocked;

                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1);

                var queryChamCong = _context.ChamCongs.Include(c => c.NhanVien).Where(c => c.NgayChamCong >= startDate && c.NgayChamCong < endDate).AsQueryable();
                var queryNghi = _context.DonNghiPheps.Include(c => c.NhanVien).Where(d => d.NgayBatDau < endDate && d.NgayKetThuc >= startDate).AsQueryable();
                var queryOT = _context.DangKyOTs.Include(c => c.NhanVien).Where(d => d.NgayLamThem >= startDate && d.NgayLamThem < endDate).AsQueryable();
                var queryCongTac = _context.DangKyCongTacs.Include(c => c.NhanVien).Where(d => d.NgayBatDau < endDate && d.NgayKetThuc >= startDate).AsQueryable();

                if (currentUserRole == "Trưởng phòng")
                {
                    if (string.IsNullOrEmpty(currentUserMaPhongBan) && !string.IsNullOrEmpty(currentUserId))
                    {
                        var nv = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(x => x.MaNhanVien == currentUserId);
                        currentUserMaPhongBan = nv?.MaPhongBan;
                    }

                    if (!string.IsNullOrEmpty(currentUserMaPhongBan))
                    {
                        var trimmedPB = currentUserMaPhongBan.Trim();
                        queryChamCong = queryChamCong.Where(c => c.NhanVien != null && c.NhanVien.MaPhongBan == trimmedPB);
                        queryNghi = queryNghi.Where(c => c.NhanVien != null && c.NhanVien.MaPhongBan == trimmedPB);
                        queryOT = queryOT.Where(c => c.NhanVien != null && c.NhanVien.MaPhongBan == trimmedPB);
                        queryCongTac = queryCongTac.Where(c => c.NhanVien != null && c.NhanVien.MaPhongBan == trimmedPB);
                    }
                    else
                    {
                        return Ok(new { DailyRecords = new List<object>(), Summaries = new Dictionary<string, object>(), Requests = new List<object>(), IsLocked = isLocked });
                    }
                }
                else if (!IsAdminOrHR() && currentUserRole != "Kế toán trưởng")
                {
                    return StatusCode(403, "Bạn không có quyền xem bảng công tổng hợp.");
                }

                var dataChamCong = await queryChamCong.ToListAsync();
                var listNghi = await queryNghi.ToListAsync();
                var listOT = await queryOT.ToListAsync();
                var listCongTac = await queryCongTac.ToListAsync();

                var validData = dataChamCong.Where(c => !string.IsNullOrEmpty(c.MaNhanVien)).ToList();

                var employeeIds = validData.Select(c => c.MaNhanVien).Distinct().ToList();
                var startYear = new DateTime(year, 1, 1);
                var endYear = startYear.AddYears(1);
                var paidLeaves = new Dictionary<string, int>();

                var employeesInfo = await _context.NhanViens
                    .Where(nv => employeeIds.Contains(nv.MaNhanVien))
                    .Select(nv => new { nv.MaNhanVien, nv.LoaiNhanVien })
                    .ToDictionaryAsync(nv => nv.MaNhanVien, nv => nv.LoaiNhanVien);

                if (employeeIds.Any())
                {
                    paidLeaves = await _context.ChamCongs
                        .Where(c => employeeIds.Contains(c.MaNhanVien) &&
                               c.NgayChamCong >= startYear && c.NgayChamCong < endYear &&
                               c.NgayCong == 1.0 && !string.IsNullOrEmpty(c.GhiChu) &&
                               c.GhiChu.ToLower().Contains("nghỉ phép"))
                        .GroupBy(c => c.MaNhanVien)
                        .ToDictionaryAsync(g => g.Key, g => g.Count());
                }

                var summaries = validData.GroupBy(c => c.MaNhanVien).ToDictionary(g => g.Key, g =>
                {
                    string loaiNV = employeesInfo.ContainsKey(g.Key) ? (employeesInfo[g.Key] ?? "") : "";
                    int maxLeaves = loaiNV.ToLower().Contains("thử việc") ? 0 : 12;
                    int usedLeaves = paidLeaves.ContainsKey(g.Key) ? paidLeaves[g.Key] : 0;

                    return new
                    {
                        MaNhanVien = g.Key,
                        TongCong = g.Sum(c => c.NgayCong),
                        DiLamDu = g.Count(c => c.NgayCong == 1.0 && string.IsNullOrEmpty(c.GhiChu)),
                        NghiCoPhep = g.Count(c => c.NgayCong == 1.0 && !string.IsNullOrEmpty(c.GhiChu) && c.GhiChu.ToLower().Contains("nghỉ phép")),
                        RemainingLeaveDays = maxLeaves - usedLeaves
                    };
                });

                var dailyRecords = validData.Select(c => new
                {
                    c.Id,
                    c.MaNhanVien,
                    NgayChamCong = c.NgayChamCong.ToString("yyyy-MM-dd"),
                    c.NgayCong,
                    c.GhiChu,
                    c.GioCheckIn,
                    c.GioCheckOut
                }).ToList();

                var flattenedRequests = FlattenAllRequests(listNghi, listOT, listCongTac, year, month);

                return Ok(new
                {
                    DailyRecords = dailyRecords,
                    Summaries = summaries,
                    Requests = flattenedRequests,
                    IsLocked = isLocked
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi xử lý server: {ex.Message}");
            }
        }

        // ==============================================================
        // 5. LẤY DỮ LIỆU CÁ NHÂN (Dành cho App Nhân viên)
        // ==============================================================
        [HttpGet("{maNhanVien}")]
        public async Task<IActionResult> GetChamCongNhanVien(string maNhanVien, [FromQuery] int year, [FromQuery] int month)
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserMaPhongBan = User.FindFirst("MaPhongBan")?.Value;

            if (currentUserRole == "Nhân viên" && currentUserId != maNhanVien) return Forbid();

            if (currentUserRole == "Trưởng phòng")
            {
                var targetEmp = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(nv => nv.MaNhanVien == maNhanVien);
                if (targetEmp == null || targetEmp.MaPhongBan != currentUserMaPhongBan)
                    return Forbid("Chỉ được xem nhân viên phòng mình.");
            }

            if (year < 1 || month < 1 || month > 12) return BadRequest("Lỗi thời gian.");
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var dataChamCong = await _context.ChamCongs.Where(c => c.MaNhanVien == maNhanVien && c.NgayChamCong >= startDate && c.NgayChamCong < endDate).ToListAsync();
            var listNghi = await _context.DonNghiPheps.Where(d => d.MaNhanVien == maNhanVien && d.NgayBatDau < endDate && d.NgayKetThuc >= startDate).ToListAsync();
            var listOT = await _context.DangKyOTs.Where(d => d.MaNhanVien == maNhanVien && d.NgayLamThem >= startDate && d.NgayLamThem < endDate).ToListAsync();
            var listCongTac = await _context.DangKyCongTacs.Where(d => d.MaNhanVien == maNhanVien && d.NgayBatDau < endDate && d.NgayKetThuc >= startDate).ToListAsync();

            var dailyRecords = dataChamCong.Select(c => new
            {
                c.Id,
                c.MaNhanVien,
                NgayChamCong = c.NgayChamCong.ToString("yyyy-MM-dd"),
                c.NgayCong,
                c.GhiChu,
                c.GioCheckIn,
                c.GioCheckOut
            }).ToList();

            var flattenedRequests = FlattenAllRequests(listNghi, listOT, listCongTac, year, month);

            return Ok(new { DailyRecords = dailyRecords, Requests = flattenedRequests });
        }

        // ==============================================================
        // 6. SỬA CÔNG / NHẬP TAY (TÍCH HỢP KIỂM TRA PHÉP NĂM)
        // ==============================================================
        [HttpPost("upsert")]
        public async Task<IActionResult> UpsertChamCong([FromBody] ChamCongUpsertDto dto)
        {
            var currentUserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var currentUserMaPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

            if (currentUserRole == "Kế toán trưởng" || currentUserRole == "Nhân viên")
                return StatusCode(403, "Bạn chỉ có quyền xem, không được sửa đổi chấm công.");

            if (!DateTime.TryParse(dto.NgayChamCong, out DateTime dateParsed)) return BadRequest("Ngày sai.");

            var isLocked = await _context.KhoaCongs.AnyAsync(k => k.Nam == dateParsed.Year && k.Thang == dateParsed.Month && k.IsLocked);
            if (isLocked) return BadRequest(new { message = $"Bảng công tháng {dateParsed.Month}/{dateParsed.Year} đã bị khóa." });

            var targetEmp = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(nv => nv.MaNhanVien == dto.MaNhanVien);
            if (targetEmp == null) return BadRequest("NV không tồn tại.");

            if (currentUserRole == "Trưởng phòng")
            {
                if (string.IsNullOrEmpty(currentUserMaPhongBan) || targetEmp.MaPhongBan != currentUserMaPhongBan)
                    return StatusCode(403, "Trưởng phòng chỉ được nhập công cho nhân viên thuộc phòng mình.");
            }

            var existingRecord = await _context.ChamCongs.FirstOrDefaultAsync(c => c.MaNhanVien == dto.MaNhanVien && c.NgayChamCong.Date == dateParsed.Date);
            if (dto.OnlyIfEmpty && existingRecord != null)
                return Ok(new { message = "Skipped (Data exists)", skipped = true });

            bool wasConverted = false;
            double finalCong = dto.NgayCong;
            string? finalGhiChu = dto.GhiChu;

            if (dto.NgayCong == 1.0 && !string.IsNullOrEmpty(dto.GhiChu) && dto.GhiChu.ToLower().Contains("nghỉ phép"))
            {
                int maxLeave = (targetEmp.LoaiNhanVien != null && targetEmp.LoaiNhanVien.ToLower().Contains("thử việc")) ? 0 : 12;

                if (maxLeave == 0)
                {
                    finalCong = 0.0;
                    finalGhiChu = "Thử việc không có phép (Chuyển thành Nghỉ không lương)";
                    wasConverted = true;
                }
                else
                {
                    var startY = new DateTime(dateParsed.Year, 1, 1);
                    var endY = startY.AddYears(1);
                    int excludeId = existingRecord != null ? existingRecord.Id : 0;

                    var taken = await _context.ChamCongs.CountAsync(c =>
                        c.MaNhanVien == dto.MaNhanVien && c.NgayChamCong >= startY && c.NgayChamCong < endY &&
                        c.NgayCong == 1.0 && !string.IsNullOrEmpty(c.GhiChu) && c.GhiChu.ToLower().Contains("nghỉ phép") &&
                        c.Id != excludeId);

                    if (taken >= maxLeave)
                    {
                        finalCong = 0.0;
                        finalGhiChu = "Hết quỹ phép năm -> Chuyển thành Nghỉ không lương";
                        wasConverted = true;
                    }
                }
            }

            if (existingRecord != null)
            {
                existingRecord.NgayCong = finalCong;
                existingRecord.GhiChu = finalGhiChu;
                _context.ChamCongs.Update(existingRecord);
            }
            else
            {
                _context.ChamCongs.Add(new ChamCong
                {
                    MaNhanVien = dto.MaNhanVien,
                    NgayChamCong = dateParsed,
                    NgayCong = finalCong,
                    GhiChu = finalGhiChu,
                    GioCheckOut = null
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Lưu thành công", wasConverted });
        }

        // ==============================================================
        // 7. KHÓA / HỦY KHÓA CÔNG (ADMIN / HR)
        // ==============================================================
        [HttpPost("lock-action")]
        public async Task<IActionResult> LockOrUnlockChamCong([FromBody] LockActionDto dto)
        {
            if (!IsAdminOrHR()) return StatusCode(403, "Chỉ HR hoặc Giám đốc mới được thực hiện thao tác này.");

            var record = await _context.KhoaCongs.FirstOrDefaultAsync(k => k.Nam == dto.Year && k.Thang == dto.Month);
            if (record == null)
            {
                _context.KhoaCongs.Add(new KhoaCong { Nam = dto.Year, Thang = dto.Month, IsLocked = dto.IsLocked });
            }
            else
            {
                record.IsLocked = dto.IsLocked;
                _context.KhoaCongs.Update(record);
            }

            await _context.SaveChangesAsync();
            string actionText = dto.IsLocked ? "khóa" : "hủy khóa";
            return Ok(new { message = $"Đã {actionText} bảng công tháng {dto.Month}/{dto.Year}." });
        }

        // ==============================================================
        // 8. FACE ID: ĐĂNG KÝ KHUÔN MẶT
        // ==============================================================
        [HttpPost("register-face")]
        public async Task<IActionResult> RegisterFace([FromBody] RegisterFaceDto dto)
        {
            if (dto.FaceDescriptor == null || dto.FaceDescriptor.Length != 128)
                return BadRequest(new { success = false, message = "Dữ liệu khuôn mặt không hợp lệ." });

            var nhanVien = await _context.NhanViens.FindAsync(dto.MaNhanVien);
            if (nhanVien == null) return NotFound(new { success = false, message = "Không tìm thấy nhân viên." });

            string jsonVector = JsonSerializer.Serialize(dto.FaceDescriptor);
            var existingFace = await _context.FaceDatas.FirstOrDefaultAsync(f => f.MaNhanVien == dto.MaNhanVien);

            if (existingFace != null)
            {
                existingFace.FaceDescriptor = jsonVector;
                _context.FaceDatas.Update(existingFace);
            }
            else
            {
                _context.FaceDatas.Add(new FaceData { MaNhanVien = dto.MaNhanVien, FaceDescriptor = jsonVector });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đăng ký khuôn mặt thành công!" });
        }

        // ==============================================================
        // HELPER FUNCTIONS (TRẢ VỀ ĐƠN TỪ)
        // ==============================================================
        private List<object> FlattenAllRequests(List<DonNghiPhep> nghis, List<DangKyOT> ots, List<DangKyCongTac> congtacs, int year, int month)
        {
            var result = new List<object>();

            foreach (var req in nghis)
            {
                for (var d = req.NgayBatDau.Date; d <= req.NgayKetThuc.Date; d = d.AddDays(1))
                {
                    if (d.Month == month && d.Year == year)
                    {
                        string loai = req.LyDo != null && req.LyDo.ToLower().Contains("không lương") ? "Nghỉ không lương" : "Nghỉ phép";
                        result.Add(new { MaNhanVien = req.MaNhanVien, Day = d.Day, LoaiDon = loai, TrangThai = req.TrangThai, ChiTiet = new { req.NgayBatDau, req.NgayKetThuc, req.SoNgayNghi, req.LyDo } });
                    }
                }
            }

            foreach (var req in ots)
            {
                if (req.NgayLamThem.Month == month && req.NgayLamThem.Year == year)
                {
                    result.Add(new { MaNhanVien = req.MaNhanVien, Day = req.NgayLamThem.Day, LoaiDon = "OT", TrangThai = req.TrangThai, ChiTiet = new { req.NgayLamThem, req.GioBatDau, req.GioKetThuc, req.SoGio, req.LyDo } });
                }
            }

            foreach (var req in congtacs)
            {
                for (var d = req.NgayBatDau.Date; d <= req.NgayKetThuc.Date; d = d.AddDays(1))
                {
                    if (d.Month == month && d.Year == year)
                    {
                        result.Add(new { MaNhanVien = req.MaNhanVien, Day = d.Day, LoaiDon = "Công tác", TrangThai = req.TrangThai, ChiTiet = new { req.NgayBatDau, req.NgayKetThuc, req.NoiCongTac, req.MucDich, req.PhuongTien, req.KinhPhiDuKien, req.SoTienTamUng } });
                    }
                }
            }
            return result;
        }

        private double CalculateEuclideanDistance(float[] a, float[] b)
        {
            if (a.Length != b.Length) return double.MaxValue;
            double sum = 0;
            for (int i = 0; i < a.Length; i++) sum += Math.Pow(a[i] - b[i], 2);
            return Math.Sqrt(sum);
        }
    }
}