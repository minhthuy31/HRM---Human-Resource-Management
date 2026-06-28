using HRApi.Data;
using HRApi.DTOs;
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
    public class DangKyOTController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DangKyOTController(AppDbContext context) { _context = context; }

        public class CreateOTDto
        {
            public DateTime NgayLamThem { get; set; }
            public string GioBatDau { get; set; } 
            public string GioKetThuc { get; set; }
            public string LyDo { get; set; }
        }

        // POST: api/DangKyOT
        [HttpPost]
        public async Task<IActionResult> CreateOT([FromBody] CreateOTDto dto)
        {
            try 
            {
                var maNV = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                if (maNV == null) return Unauthorized();

                // Không cho tạo đơn nếu bảng công tháng đó đã bị khóa
                var ngayDangKy = dto.NgayLamThem.Date;
                var isLockedMonth = await _context.KhoaCongs.AnyAsync(k =>
                    k.Nam == ngayDangKy.Year && k.Thang == ngayDangKy.Month && k.IsLocked);
                if (isLockedMonth) return BadRequest(new { message = $"Bảng công tháng {ngayDangKy.Month}/{ngayDangKy.Year} đã bị khóa, không thể đăng ký OT." });

                // Parse string ("17:30") sang TimeSpan an toàn
                if (!TimeSpan.TryParse(dto.GioBatDau, out TimeSpan tBatDau) || 
                    !TimeSpan.TryParse(dto.GioKetThuc, out TimeSpan tKetThuc))
                {
                    return BadRequest(new { message = "Định dạng giờ không hợp lệ." });
                }

                if (tKetThuc <= tBatDau)
                    return BadRequest(new { message = "Giờ kết thúc phải lớn hơn giờ bắt đầu." });

                var soGio = (tKetThuc - tBatDau).TotalHours;

                // Trừ thời gian nghỉ trưa (12:00–13:30) nếu khoảng OT bắc qua — không tính trưa là giờ làm thêm
                var lunchStart = new TimeSpan(12, 0, 0);
                var lunchEnd   = new TimeSpan(13, 30, 0);
                if (tBatDau < lunchEnd && tKetThuc > lunchStart)
                {
                    var overlapStart = tBatDau > lunchStart ? tBatDau : lunchStart;
                    var overlapEnd   = tKetThuc < lunchEnd ? tKetThuc : lunchEnd;
                    soGio -= (overlapEnd - overlapStart).TotalHours;
                }
                soGio = Math.Round(soGio, 2);

                // ── KIỂM TRA GIỚI HẠN OT (Điều 107 BLLĐ 2019) ──
                var sys = await _context.SystemSettings.FirstOrDefaultAsync();
                double gioToiDaNgayThuong = sys?.GioOTToiDaNgay > 0 ? sys.GioOTToiDaNgay : 4;
                double gioToiDaThang      = sys?.GioOTToiDaThang > 0 ? sys.GioOTToiDaThang : 40;
                double gioToiDaNam        = sys?.GioOTToiDaNam > 0 ? sys.GioOTToiDaNam : 200;

                // Xác định ngày lễ / cuối tuần để áp trần giờ/ngày phù hợp
                var ngayLamThemDate = dto.NgayLamThem.Date;
                bool isNgayLe = await _context.NgayLes.AnyAsync(nl => nl.Date.Date == ngayLamThemDate);
                bool isCuoiTuan = ngayLamThemDate.DayOfWeek == DayOfWeek.Saturday ||
                                  ngayLamThemDate.DayOfWeek == DayOfWeek.Sunday;

                // OT2: ngày thường KHÔNG được đăng ký OT đè lên ca hành chính (08:00–17:30) —
                // giờ trong ca đã được tính công thường, tránh trả lương 2 lần.
                // Ngày lễ/cuối tuần là ngày nghỉ (không có ca) nên cho phép mọi khung giờ.
                if (!isNgayLe && !isCuoiTuan)
                {
                    var caStart = new TimeSpan(8, 0, 0);
                    var caEnd   = new TimeSpan(17, 30, 0);
                    if (tBatDau < caEnd && tKetThuc > caStart)
                        return BadRequest(new { message = "OT ngày thường phải nằm ngoài giờ hành chính (08:00–17:30)." });
                }

                // Trần giờ/ngày: ngày thường ≤ giới hạn cấu hình; lễ/cuối tuần ≤ 12h (BLLĐ cho phép tới 12h)
                double tranGioNgay = (isNgayLe || isCuoiTuan) ? 12 : gioToiDaNgayThuong;

                // Tổng giờ OT đã có trong cùng ngày (các đơn chưa bị từ chối)
                double gioDaCoTrongNgay = await _context.DangKyOTs
                    .Where(o => o.MaNhanVien == maNV
                             && o.NgayLamThem.Date == ngayLamThemDate
                             && o.TrangThai != "Từ chối")
                    .SumAsync(o => o.SoGio);

                if (gioDaCoTrongNgay + soGio > tranGioNgay)
                    return BadRequest(new { message = $"Vượt giới hạn OT trong ngày ({tranGioNgay}h). Đã đăng ký {gioDaCoTrongNgay}h, đơn này {soGio}h." });

                // Tổng giờ OT trong tháng (đã duyệt + chờ duyệt)
                double gioDaCoTrongThang = await _context.DangKyOTs
                    .Where(o => o.MaNhanVien == maNV
                             && o.NgayLamThem.Year == ngayLamThemDate.Year
                             && o.NgayLamThem.Month == ngayLamThemDate.Month
                             && o.TrangThai != "Từ chối")
                    .SumAsync(o => o.SoGio);

                if (gioDaCoTrongThang + soGio > gioToiDaThang)
                    return BadRequest(new { message = $"Vượt giới hạn OT trong tháng ({gioToiDaThang}h). Đã đăng ký {gioDaCoTrongThang}h, đơn này {soGio}h." });

                // Tổng giờ OT trong năm — chỉ CẢNH BÁO, vẫn cho gửi (ngoại lệ 300h tùy ngành)
                double gioDaCoTrongNam = await _context.DangKyOTs
                    .Where(o => o.MaNhanVien == maNV
                             && o.NgayLamThem.Year == ngayLamThemDate.Year
                             && o.TrangThai != "Từ chối")
                    .SumAsync(o => o.SoGio);

                bool vuotGioiHanNam = gioDaCoTrongNam + soGio > gioToiDaNam;

                var otRequest = new DangKyOT
                {
                    MaNhanVien = maNV,
                    NgayLamThem = dto.NgayLamThem,
                    GioBatDau = tBatDau, // Lưu TimeSpan vào Database
                    GioKetThuc = tKetThuc, // Lưu TimeSpan vào Database
                    SoGio = soGio,
                    LyDo = dto.LyDo,
                    TrangThai = "Chờ duyệt",
                    NgayGuiDon = DateTime.Now
                };

                _context.DangKyOTs.Add(otRequest);
                await _context.SaveChangesAsync();

                if (vuotGioiHanNam)
                    return Ok(new
                    {
                        message = "Đăng ký OT thành công",
                        warning = $"Cảnh báo: Tổng OT năm ({gioDaCoTrongNam + soGio}h) đã vượt giới hạn {gioToiDaNam}h. Cần xác nhận thuộc ngành nghề được phép làm thêm tới 300h/năm."
                    });

                return Ok(new { message = "Đăng ký OT thành công" });
            }
            catch(Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server: " + ex.Message });
            }
        }

        // GET: api/DangKyOT (Có Filter & Search & Phân quyền)
        [HttpGet]
        [Authorize(Roles = "Trưởng phòng,Kế toán trưởng,Giám đốc,Nhân sự trưởng")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllRequests(
            [FromQuery] string? trangThai,
            [FromQuery] string? maPhongBan,
            [FromQuery] string? searchTerm)
        {
            var currentUserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
            var currentUserMaPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

            var query = _context.DangKyOTs
                .Include(d => d.NhanVien)
                .ThenInclude(nv => nv.PhongBan) // Include phòng ban để filter/hiển thị
                .AsQueryable();

            // --- 1. PHÂN QUYỀN DATA ---
            if (currentUserRole == "Trưởng phòng")
            {
                if (!string.IsNullOrEmpty(currentUserMaPhongBan))
                {
                    query = query.Where(d => d.NhanVien.MaPhongBan == currentUserMaPhongBan);
                }
                else
                {
                    return Ok(new List<object>());
                }
            }
            // Các role khác (Admin, HR, Kế toán) xem hết

            // --- 2. BỘ LỌC ---
            if (!string.IsNullOrEmpty(trangThai))
            {
                query = query.Where(d => d.TrangThai == trangThai);
            }

            if (!string.IsNullOrEmpty(maPhongBan))
            {
                query = query.Where(d => d.NhanVien.MaPhongBan == maPhongBan);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearch = searchTerm.ToLower();
                query = query.Where(d => d.NhanVien.HoTen.ToLower().Contains(lowerSearch) ||
                                         d.MaNhanVien.ToLower().Contains(lowerSearch));
            }

            var result = await query.OrderByDescending(d => d.NgayGuiDon)
                .Select(d => new
                {
                    d.Id,
                    d.MaNhanVien,
                    HoTenNhanVien = d.NhanVien != null ? d.NhanVien.HoTen : "N/A",
                    TenPhongBan = d.NhanVien != null && d.NhanVien.PhongBan != null ? d.NhanVien.PhongBan.TenPhongBan : "N/A",
                    d.NgayLamThem,
                    d.GioBatDau,
                    d.GioKetThuc,
                    d.SoGio,
                    d.LyDo,
                    d.TrangThai,
                    d.LyDoTuChoi,
                    d.NgayGuiDon
                }).ToListAsync();

            return Ok(result);
        }

        // --- DUYỆT OT (Trưởng phòng, Giám đốc & Nhân sự trưởng) ---
        [HttpPost("approve/{id}")]
        [Authorize(Roles = "Trưởng phòng,Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> Approve(int id)
        {
            var req = await _context.DangKyOTs.Include(d => d.NhanVien).FirstOrDefaultAsync(d => d.Id == id);
            if (req == null || req.TrangThai != "Chờ duyệt") return NotFound("Đơn không hợp lệ.");

            // Kiểm tra bảng công đã bị khóa chưa (sau khi khóa không được sửa chấm công)
            var isLocked = await _context.KhoaCongs.AnyAsync(k =>
                k.Nam == req.NgayLamThem.Year &&
                k.Thang == req.NgayLamThem.Month &&
                k.IsLocked);
            if (isLocked) return BadRequest(new { message = "Bảng công tháng đó đã bị khóa, không thể duyệt đơn." });

            var currentUserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
            var currentUserMaPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

            // Check quyền Trưởng phòng: Không được duyệt khác phòng
            if (currentUserRole == "Trưởng phòng")
            {
                if (req.NhanVien?.MaPhongBan != currentUserMaPhongBan)
                    return Forbid("Không được duyệt đơn phòng khác.");
            }

            req.TrangThai = "Đã duyệt";

            // Cập nhật ghi chú OT vào bảng chấm công
            var existingChamCong = await _context.ChamCongs
                .FirstOrDefaultAsync(c => c.MaNhanVien == req.MaNhanVien && c.NgayChamCong.Date == req.NgayLamThem.Date);

            string noteContent = $"OT (Đã duyệt): {req.SoGio}h";

            if (existingChamCong != null)
            {
                // Nếu đã có chấm công, nối thêm ghi chú (để không mất dữ liệu chấm công chính)
                existingChamCong.GhiChu = string.IsNullOrEmpty(existingChamCong.GhiChu)
                    ? noteContent
                    : existingChamCong.GhiChu + "; " + noteContent;
            }
            else
            {
                // Nếu chưa có chấm công, tạo mới
                _context.ChamCongs.Add(new ChamCong
                {
                    MaNhanVien = req.MaNhanVien,
                    NgayChamCong = req.NgayLamThem.Date,
                    NgayCong = 0, // OT tính riêng, không cộng vào ngày công chuẩn
                    LoaiNgayCong = LoaiCong.LamViec, // dòng giữ ghi chú OT, không phải ngày nghỉ
                    GhiChu = noteContent
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã duyệt OT." });
        }

        // --- TỪ CHỐI OT (Trưởng phòng, Giám đốc & Nhân sự trưởng) ---
        [HttpPost("reject/{id}")]
        [Authorize(Roles = "Trưởng phòng,Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.LyDoTuChoi))
                return BadRequest(new { message = "Lý do từ chối không được để trống." });

            var req = await _context.DangKyOTs.Include(d => d.NhanVien).FirstOrDefaultAsync(d => d.Id == id);
            if (req == null || req.TrangThai != "Chờ duyệt") return NotFound();

            var currentUserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
            var currentUserMaPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

            if (currentUserRole == "Trưởng phòng" && req.NhanVien?.MaPhongBan != currentUserMaPhongBan)
                return Forbid();

            req.TrangThai = "Từ chối";
            req.LyDoTuChoi = dto.LyDoTuChoi.Trim();
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã từ chối OT." });
        }
    }
}