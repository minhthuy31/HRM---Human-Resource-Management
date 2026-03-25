using HRApi.Data;
using HRApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    }
}