using HRApi.Data;
using HRApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SystemSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SystemSettingsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/SystemSettings
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            // Lấy dòng cấu hình đầu tiên thay vì tìm theo Id cụ thể
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            // Nếu chưa có bất kỳ cấu hình nào trong DB, tạo mặc định 
            // KHÔNG GÁN Id = 1 Ở ĐÂY NỮA, ĐỂ DATABASE TỰ TĂNG
            if (settings == null)
            {
                settings = new SystemSetting
                {
                    // Gán các giá trị mặc định nếu muốn, hoặc để trống
                    TenCongTy = "",
                    MucLuongCoSo = 1800000
                };

                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(settings);
        }

        // POST: api/SystemSettings
        [HttpPost]
        public async Task<IActionResult> UpdateSettings([FromBody] SystemSetting updatedSettings)
        {
            // Tìm bản ghi đầu tiên trong cơ sở dữ liệu
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                // Nếu DB hoàn toàn rỗng, thêm mới (EF sẽ tự bỏ qua trường Id của updatedSettings)
                // Đảm bảo Id = 0 (giá trị mặc định của int) để EF hiểu là bản ghi mới
                updatedSettings.Id = 0;

                _context.SystemSettings.Add(updatedSettings);
            }
            else
            {
                // Nếu đã có cấu hình, ghi đè tất cả các trường (ngoại trừ Id)
                settings.TenCongTy = updatedSettings.TenCongTy;
                settings.TenVietTat = updatedSettings.TenVietTat;
                settings.MaSoThue = updatedSettings.MaSoThue;
                settings.DiaChi = updatedSettings.DiaChi;
                settings.SdtHotline = updatedSettings.SdtHotline;

                settings.GioVaoLam = updatedSettings.GioVaoLam;
                settings.GioTanLam = updatedSettings.GioTanLam;
                settings.ThoiGianNghiTrua = updatedSettings.ThoiGianNghiTrua;
                settings.SoPhutDiMuonChoPhep = updatedSettings.SoPhutDiMuonChoPhep;
                settings.NgayPhepTieuChuan = updatedSettings.NgayPhepTieuChuan;

                settings.MucLuongCoSo = updatedSettings.MucLuongCoSo;
                settings.PhanTramBHXHCompany = updatedSettings.PhanTramBHXHCompany;
                settings.PhanTramBHXHEmployee = updatedSettings.PhanTramBHXHEmployee;
                settings.GiamTruGiaCanh = updatedSettings.GiamTruGiaCanh;
                settings.GiamTruPhuThuoc = updatedSettings.GiamTruPhuThuoc;

                settings.SmtpServer = updatedSettings.SmtpServer;
                settings.SmtpPort = updatedSettings.SmtpPort;
                settings.EmailGuiDi = updatedSettings.EmailGuiDi;
                settings.GuiMailTuDong = updatedSettings.GuiMailTuDong;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Lưu cấu hình thành công!" });
        }
    }
}