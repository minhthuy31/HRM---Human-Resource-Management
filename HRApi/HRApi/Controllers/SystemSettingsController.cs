using HRApi.Data;
using HRApi.Models;
using Microsoft.AspNetCore.Authorization;
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

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                settings = new SystemSetting
                {
                    TenCongTy = "",
                    MucLuongCoSo = 1800000,
                    HeSoOTNgayThuong = 1.5,
                    HeSoOTCuoiTuan = 2.0,
                    HeSoOTNgayLe = 3.0
                };

                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(settings);
        }

        [HttpPost]
        [Authorize(Roles = "Nhân sự trưởng, Giám đốc")]
        public async Task<IActionResult> UpdateSettings([FromBody] SystemSetting updatedSettings)
        {
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                updatedSettings.Id = 0;
                _context.SystemSettings.Add(updatedSettings);
            }
            else
            {
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

                settings.HeSoOTNgayThuong = updatedSettings.HeSoOTNgayThuong;
                settings.HeSoOTCuoiTuan = updatedSettings.HeSoOTCuoiTuan;
                settings.HeSoOTNgayLe = updatedSettings.HeSoOTNgayLe;

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