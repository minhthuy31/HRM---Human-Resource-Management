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
    public class NgayLeController : ControllerBase
    {
        private readonly AppDbContext _context;
        public NgayLeController(AppDbContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetHolidays([FromQuery] int year)
        {
            var holidays = await _context.NgayLes
                .Where(h => h.Date.Year == year)
                .OrderBy(h => h.Date)
                .ToListAsync();
            return Ok(holidays);
        }

        [HttpPost]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> AddHoliday([FromBody] NgayLe dto)
        {
            if (await _context.NgayLes.AnyAsync(h => h.Date.Date == dto.Date.Date))
                return BadRequest("Ngày này đã được thiết lập là ngày lễ.");

            dto.Date = dto.Date.Date;
            _context.NgayLes.Add(dto);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm ngày lễ thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> DeleteHoliday(int id)
        {
            var holiday = await _context.NgayLes.FindAsync(id);
            if (holiday == null) return NotFound();

            _context.NgayLes.Remove(holiday);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa ngày lễ." });
        }
    }
}