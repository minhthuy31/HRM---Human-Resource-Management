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
    public class ThongBaoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ThongBaoController(AppDbContext context) { _context = context; }

        // 1. API Lấy toàn bộ danh sách cho Admin quản lý
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.ThongBaos
                .OrderByDescending(t => t.NgayTao)
                .ToListAsync();
            return Ok(list);
        }

        // 2. API Lấy 5 thông báo mới nhất cho Màn hình Trang chủ Nhân viên
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestNews()
        {
            var news = await _context.ThongBaos
                .Where(t => t.TrangThai == true)
                .OrderByDescending(t => t.NgayTao)
                .Take(5)
                .Select(t => new
                {
                    id = t.Id,
                    title = t.TieuDe,
                    date = t.NgayTao.ToString("dd/MM/yyyy"),
                    type = t.LoaiThongBao,
                    content = t.NoiDung
                })
                .ToListAsync();
            return Ok(news);
        }

        // 3. API Thêm thông báo mới
        [HttpPost]
        [Authorize(Roles = "Nhân sự trưởng,Giám đốc")]
        public async Task<IActionResult> Create([FromBody] ThongBao dto)
        {
            if (string.IsNullOrEmpty(dto.TieuDe) || string.IsNullOrEmpty(dto.NoiDung))
                return BadRequest("Tiêu đề và Nội dung không được để trống.");

            dto.NgayTao = DateTime.Now;
            _context.ThongBaos.Add(dto);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đăng thông báo thành công!" });
        }

        // 4. API Cập nhật thông báo
        [HttpPut("{id}")]
        [Authorize(Roles = "Nhân sự trưởng,Giám đốc")]
        public async Task<IActionResult> Update(int id, [FromBody] ThongBao dto)
        {
            var existing = await _context.ThongBaos.FindAsync(id);
            if (existing == null) return NotFound("Không tìm thấy thông báo.");

            existing.TieuDe = dto.TieuDe;
            existing.NoiDung = dto.NoiDung;
            existing.LoaiThongBao = dto.LoaiThongBao;
            existing.TrangThai = dto.TrangThai;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông báo thành công!" });
        }

        // 5. API Ẩn/Xóa thông báo
        [HttpDelete("{id}")]
        [Authorize(Roles = "Nhân sự trưởng,Giám đốc")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.ThongBaos.FindAsync(id);
            if (existing == null) return NotFound("Không tìm thấy thông báo.");

            existing.TrangThai = false; // Chuyển trạng thái thành Ẩn thay vì xóa hẳn khỏi DB
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã ẩn thông báo." });
        }

        // 6. API Lấy số lượng đơn từ chờ duyệt (Cho Notification Bell)
        [HttpGet("unread-requests-count")]
        public async Task<IActionResult> GetUnreadRequestsCount()
        {
            var role = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var maPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

            // Nhân viên thường không có quyền duyệt, trả về 0 luôn
            if (role == "Nhân viên")
            {
                return Ok(new { total = 0, nghiPhep = 0, ot = 0, congTac = 0 });
            }

            // Khởi tạo truy vấn
            var queryNghiPhep = _context.DonNghiPheps.Include(d => d.NhanVien).Where(d => d.TrangThai == "Chờ duyệt");
            var queryOT = _context.DangKyOTs.Include(d => d.NhanVien).Where(d => d.TrangThai == "Chờ duyệt");
            var queryCongTac = _context.DangKyCongTacs.Include(d => d.NhanVien).Where(d => d.TrangThai == "Chờ duyệt");

            // Phân quyền: Trưởng phòng chỉ xem đơn của phòng mình
            if (role == "Trưởng phòng")
            {
                // Phòng hờ nếu token cũ chưa có mã phòng ban
                if (string.IsNullOrEmpty(maPhongBan) && !string.IsNullOrEmpty(userId))
                {
                    var me = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(x => x.MaNhanVien == userId);
                    maPhongBan = me?.MaPhongBan;
                }

                if (!string.IsNullOrEmpty(maPhongBan))
                {
                    queryNghiPhep = queryNghiPhep.Where(d => d.NhanVien != null && d.NhanVien.MaPhongBan == maPhongBan);
                    queryOT = queryOT.Where(d => d.NhanVien != null && d.NhanVien.MaPhongBan == maPhongBan);
                    queryCongTac = queryCongTac.Where(d => d.NhanVien != null && d.NhanVien.MaPhongBan == maPhongBan);
                }
                else
                {
                    return Ok(new { total = 0, nghiPhep = 0, ot = 0, congTac = 0 });
                }
            }
            // Admin, HR, Kế toán, Giám đốc xem được tất cả đơn chờ duyệt

            int countNghiPhep = await queryNghiPhep.CountAsync();
            int countOT = await queryOT.CountAsync();
            int countCongTac = await queryCongTac.CountAsync();
            int total = countNghiPhep + countOT + countCongTac;

            return Ok(new
            {
                total = total,
                nghiPhep = countNghiPhep,
                ot = countOT,
                congTac = countCongTac
            });
        }
    }
}