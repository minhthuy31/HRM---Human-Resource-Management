using HRApi.Data;
using HRApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HRApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            try
            {
                var now = DateTime.Now;
                var result = new DashboardDto();

                // 1. Lấy thông tin user từ Token
                var role = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
                var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var maPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

                // Nếu là Nhân viên thường lọt vào đây thì chặn luôn
                if (role == "Nhân viên") return StatusCode(403, "Bạn không có quyền truy cập Dashboard Admin.");

                // 2. Khởi tạo các Query gốc (Dành cho Giám đốc/HR - xem tất cả)
                var nhanVienQuery = _context.NhanViens.Where(x => x.TrangThai == true);
                var hopDongQuery = _context.HopDongs.Include(h => h.NhanVien).Where(x => x.TrangThai == "HieuLuc");
                var otQuery = _context.DangKyOTs.Include(o => o.NhanVien).Where(x => x.TrangThai == "Chờ duyệt");
                var phongBanQuery = _context.PhongBans.Where(pb => pb.TrangThai == true);

                // 3. NẾU LÀ TRƯỞNG PHÒNG -> ÉP QUERY CHỈ LỌC DỮ LIỆU CỦA PHÒNG ĐÓ
                if (role == "Trưởng phòng")
                {
                    // Phòng hờ trường hợp Token cũ chưa có mã phòng ban
                    if (string.IsNullOrEmpty(maPhongBan) && !string.IsNullOrEmpty(userId))
                    {
                        var me = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(x => x.MaNhanVien == userId);
                        maPhongBan = me?.MaPhongBan;
                    }

                    if (!string.IsNullOrEmpty(maPhongBan))
                    {
                        nhanVienQuery = nhanVienQuery.Where(x => x.MaPhongBan == maPhongBan);
                        hopDongQuery = hopDongQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == maPhongBan);
                        otQuery = otQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == maPhongBan);
                        phongBanQuery = phongBanQuery.Where(x => x.MaPhongBan == maPhongBan);
                    }
                }

                // ==========================================
                // 4. THỰC THI QUERY VÀ LẤY DỮ LIỆU (CARDS)
                // ==========================================
                result.TongNhanVien = await nhanVienQuery.CountAsync();

                result.NhanVienMoiTrongThang = await nhanVienQuery
                    .CountAsync(x => x.NgayVaoLam.HasValue
                                  && x.NgayVaoLam.Value.Month == now.Month
                                  && x.NgayVaoLam.Value.Year == now.Year);

                result.HopDongSapHetHan = await hopDongQuery
                    .CountAsync(x => x.NgayKetThuc.HasValue
                                  && x.NgayKetThuc.Value <= now.AddDays(30));

                result.DonOTChoDuyet = await otQuery.CountAsync();


                // ==========================================
                // 5. BIỂU ĐỒ CƠ CẤU NHÂN SỰ THEO PHÒNG BAN
                // ==========================================
                result.NhanSuTheoPhongBan = await phongBanQuery
                    .Select(pb => new ThongKePhongBanDto
                    {
                        TenPhongBan = pb.TenPhongBan,
                        SoLuong = pb.NhanViens.Count(nv => nv.TrangThai == true)
                    })
                    .Where(x => x.SoLuong > 0)
                    .ToListAsync();


                // ==========================================
                // 6. SỰ KIỆN: SINH NHẬT TRONG THÁNG NÀY
                // ==========================================
                var rawSinhNhat = await nhanVienQuery
                    .Include(nv => nv.PhongBan)
                    .Where(nv => nv.NgaySinh.HasValue && nv.NgaySinh.Value.Month == now.Month)
                    .OrderBy(nv => nv.NgaySinh.Value.Day)
                    .Select(nv => new
                    {
                        MaNhanVien = nv.MaNhanVien,
                        HoTen = nv.HoTen,
                        TenPhongBan = nv.PhongBan != null ? nv.PhongBan.TenPhongBan : "Chưa xếp phòng",
                        NgaySinhGoc = nv.NgaySinh.Value
                    })
                    .ToListAsync();

                result.SinhNhatTrongThang = rawSinhNhat.Select(nv => new NhanVienNganDto
                {
                    MaNhanVien = nv.MaNhanVien,
                    HoTen = nv.HoTen,
                    TenPhongBan = nv.TenPhongBan,
                    NgaySinhFormated = nv.NgaySinhGoc.ToString("dd/MM")
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine("LỖI DASHBOARD: " + ex.ToString());
                return StatusCode(500, "Lỗi khi xử lý dữ liệu: " + ex.Message);
            }
        }
    }
}