using HRApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HRApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BaoCaoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BaoCaoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("tong-hop")]
        public async Task<IActionResult> GetBaoCaoTongHop([FromQuery] int month, [FromQuery] int year)
        {
            try
            {
                var now = DateTime.Now;

                //Phân quyền
                var role = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
                var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var maPhongBan = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;

                if (role == "Nhân viên") return StatusCode(403, "Bạn không có quyền xem Báo cáo tổng hợp.");

                bool isTruongPhong = role == "Trưởng phòng";

                if (isTruongPhong && string.IsNullOrEmpty(maPhongBan) && !string.IsNullOrEmpty(userId))
                {
                    var me = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(x => x.MaNhanVien == userId);
                    maPhongBan = me?.MaPhongBan;
                }
                string tpMaPhongBan = maPhongBan ?? "";

                // 1.1. Thâm niên
                var nvQuery = _context.NhanViens.Where(x => x.TrangThai == true);
                if (isTruongPhong) nvQuery = nvQuery.Where(x => x.MaPhongBan == tpMaPhongBan);

                var ngayVaoLamList = await nvQuery.Where(x => x.NgayVaoLam != null).Select(x => x.NgayVaoLam).ToListAsync();

                int duoi1Nam = 0, tu1Den3 = 0, tu3Den5 = 0, tren5Nam = 0;
                foreach (var date in ngayVaoLamList)
                {
                    if (date.HasValue)
                    {
                        var years = (now - date.Value).TotalDays / 365.25;
                        if (years < 1) duoi1Nam++;
                        else if (years < 3) tu1Den3++;
                        else if (years < 5) tu3Den5++;
                        else tren5Nam++;
                    }
                }

                var thamNien = new List<object>
                {
                    new { TenThang = "< 1 năm", SoLuong = duoi1Nam },
                    new { TenThang = "1-3 năm", SoLuong = tu1Den3 },
                    new { TenThang = "3-5 năm", SoLuong = tu3Den5 },
                    new { TenThang = "> 5 năm", SoLuong = tren5Nam }
                };

                // 1.2. Giới tính
                var pbQuery = _context.PhongBans.Where(p => p.TrangThai == true);
                if (isTruongPhong) pbQuery = pbQuery.Where(p => p.MaPhongBan == tpMaPhongBan);

                var gioiTinh = await pbQuery.Select(p => new
                {
                    TenPhongBan = p.TenPhongBan,
                    Nam = p.NhanViens.Count(nv => nv.TrangThai == true && nv.GioiTinh == 1),
                    Nu = p.NhanViens.Count(nv => nv.TrangThai == true && nv.GioiTinh == 0),
                    Khac = p.NhanViens.Count(nv => nv.TrangThai == true && nv.GioiTinh != 0 && nv.GioiTinh != 1)
                }).Where(x => x.Nam > 0 || x.Nu > 0 || x.Khac > 0).ToListAsync();

                // 1.3. Lương qua các kỳ
                var lqckQuery = _context.BangLuongs.Include(b => b.NhanVien).Where(x => x.DaChot);
                if (isTruongPhong) lqckQuery = lqckQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == tpMaPhongBan);

                var luongQuaCacKy = await lqckQuery
                    .GroupBy(x => new { x.Thang, x.Nam })
                    .Select(g => new
                    {
                        KyLuong = $"T{g.Key.Thang:D2}/{g.Key.Nam}",
                        TongTien = g.Sum(x => x.ThucLanh),
                        Nam = g.Key.Nam,
                        Thang = g.Key.Thang
                    })
                    .OrderByDescending(x => x.Nam).ThenByDescending(x => x.Thang).Take(6).ToListAsync();
                luongQuaCacKy.Reverse();

                // 1.4. OT Theo phòng
                var otQuery = _context.DangKyOTs
                    .Include(x => x.NhanVien).ThenInclude(n => n.PhongBan)
                    .Where(x => x.NgayLamThem.Month == month && x.NgayLamThem.Year == year && x.TrangThai == "Đã duyệt");
                if (isTruongPhong) otQuery = otQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == tpMaPhongBan);

                var otTheoPhong = await otQuery
                    .GroupBy(x => x.NhanVien.PhongBan.TenPhongBan)
                    .Select(g => new { TenPhongBan = g.Key, TongSoGio = g.Sum(x => x.SoGio) })
                    .ToListAsync();


                //Bảng lương chi tiết theo phòng ban

                // 2.1. Biến động nhân sự
                var hdQuery = _context.HopDongs
                    .Include(h => h.NhanVien).ThenInclude(nv => nv.PhongBan)
                    .Where(h => (h.NgayBatDau.Month == month && h.NgayBatDau.Year == year) ||
                                (h.NgayKetThuc.HasValue && h.NgayKetThuc.Value.Month == month && h.NgayKetThuc.Value.Year == year));
                if (isTruongPhong) hdQuery = hdQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == tpMaPhongBan);

                var bienDong = await hdQuery.Select(h => new
                {
                    maNV = h.MaNhanVien,
                    hoTen = h.NhanVien.HoTen,
                    phongBan = h.NhanVien.PhongBan != null ? h.NhanVien.PhongBan.TenPhongBan : "N/A",
                    maPhongBan = h.NhanVien.MaPhongBan,
                    loai = (h.NgayBatDau.Month == month && h.NgayBatDau.Year == year) ? "Tuyển mới" : "Nghỉ việc",
                    ngayHieuLuc = (h.NgayBatDau.Month == month && h.NgayBatDau.Year == year)
                                    ? h.NgayBatDau.ToString("dd/MM/yyyy")
                                    : h.NgayKetThuc.Value.ToString("dd/MM/yyyy")
                }).Distinct().ToListAsync();

                // 2.2. CHẤM CÔNG CHI TIẾT TỪNG NGÀY
                var ccQuery = _context.ChamCongs
                    .Include(c => c.NhanVien).ThenInclude(nv => nv.PhongBan)
                    .Where(c => c.NgayChamCong.Month == month && c.NgayChamCong.Year == year);
                if (isTruongPhong) ccQuery = ccQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == tpMaPhongBan);

                var chamCongRaw = await ccQuery.ToListAsync();

                int daysInMonth = DateTime.DaysInMonth(year, month);
                var chamCong = new List<object>();

                var groupedChamCong = chamCongRaw.GroupBy(c => new { c.MaNhanVien, c.NhanVien.HoTen, TenPhongBan = c.NhanVien.PhongBan != null ? c.NhanVien.PhongBan.TenPhongBan : "N/A", MaPhongBan = c.NhanVien.MaPhongBan });

                foreach (var g in groupedChamCong)
                {
                    var chiTietNgay = new Dictionary<string, string>();
                    for (int i = 1; i <= daysInMonth; i++)
                    {
                        var record = g.FirstOrDefault(c => c.NgayChamCong.Day == i);
                        if (record == null)
                        {
                            chiTietNgay[i.ToString()] = "";
                        }
                        else
                        {
                            bool isMuon = record.DiMuon || (record.GhiChu != null && record.GhiChu.ToLower().Contains("muộn"));
                            bool isPhep = record.GhiChu != null && record.GhiChu.ToLower().Contains("phép");

                            if (record.NgayCong == 1.0) chiTietNgay[i.ToString()] = isMuon ? "1(M)" : "1";
                            else if (record.NgayCong == 0.5) chiTietNgay[i.ToString()] = "0.5";
                            else chiTietNgay[i.ToString()] = isPhep ? "P" : "KP";
                        }
                    }

                    chamCong.Add(new
                    {
                        maNV = g.Key.MaNhanVien,
                        hoTen = g.Key.HoTen,
                        phongBan = g.Key.TenPhongBan,
                        maPhongBan = g.Key.MaPhongBan,
                        chiTiet = chiTietNgay,
                        tongCong = g.Sum(x => x.NgayCong),
                        diMuon = g.Count(x => x.DiMuon || (x.GhiChu != null && x.GhiChu.ToLower().Contains("muộn"))),
                        khongPhep = g.Count(x => x.NgayCong == 0 && (x.GhiChu == null || !x.GhiChu.ToLower().Contains("phép"))),
                        nghiPhep = g.Count(x => x.NgayCong == 0 && (x.GhiChu != null && x.GhiChu.ToLower().Contains("phép"))),
                        nuaNgay = g.Count(x => x.NgayCong == 0.5)
                    });
                }

                // 2.3. BẢNG LƯƠNG TỔNG HỢP VÀ CHI TIẾT
                var blQuery = _context.BangLuongs
                    .Include(b => b.NhanVien).ThenInclude(nv => nv.PhongBan)
                    .Where(b => b.Thang == month && b.Nam == year);

                if (isTruongPhong) blQuery = blQuery.Where(x => x.NhanVien != null && x.NhanVien.MaPhongBan == tpMaPhongBan);

                var bangLuongChiTiet = await blQuery.Select(b => new
                {
                    maNV = b.MaNhanVien,
                    hoTen = b.NhanVien.HoTen,
                    phongBan = b.NhanVien.PhongBan != null ? b.NhanVien.PhongBan.TenPhongBan : "N/A",
                    maPhongBan = b.NhanVien.MaPhongBan,
                    tongThuNhap = b.TongThuNhap,
                    thueTNCN = b.ThueTNCN,
                    truBaoHiem = b.KhauTruBHXH + b.KhauTruBHYT + b.KhauTruBHTN,
                    thucLanh = b.ThucLanh,
                    daChot = b.DaChot ? "Đã chốt" : "Chưa chốt"
                }).ToListAsync();

                var tongHopPhongBan = bangLuongChiTiet
                    .GroupBy(x => new { x.maPhongBan, x.phongBan })
                    .Select(g => new
                    {
                        maPhongBan = g.Key.maPhongBan,
                        tenPhongBan = g.Key.phongBan,
                        soNhanVien = g.Count(),
                        tongThuNhap = g.Sum(x => x.tongThuNhap),
                        tongThucLanh = g.Sum(x => x.thucLanh)
                    }).ToList();

                var bangLuong = new
                {
                    chiTiet = bangLuongChiTiet,
                    tongHop = tongHopPhongBan
                };

                return Ok(new
                {
                    thongKe = new { thamNien, gioiTinh, luongQuaCacKy, otTheoPhong },
                    baoCao = new { bienDong, chamCong, bangLuong }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi lấy dữ liệu báo cáo: " + ex.Message);
            }
        }
    }
}