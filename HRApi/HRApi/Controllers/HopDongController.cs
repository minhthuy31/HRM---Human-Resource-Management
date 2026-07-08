using HRApi.Data;
using HRApi.DTOs;
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
    public class HopDongController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public HopDongController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/HopDong
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetHopDongs(
            [FromQuery] string? search,
            [FromQuery] string? trangThai,
            [FromQuery] bool? sapHetHan // THÊM MỚI 1: Tham số lọc hợp đồng sắp hết hạn
        )
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
            var userDept = User.Claims.FirstOrDefault(c => c.Type == "MaPhongBan")?.Value;
            var now = DateTime.Now; // Biến thời gian hiện tại

            // Auto-expire: HĐ đang "HieuLuc" nhưng đã qua ngày kết thúc → tự chuyển "HetHan"
            var hetHan = await _context.HopDongs
                .Where(h => h.TrangThai == TrangThaiHopDong.HieuLuc
                         && h.NgayKetThuc != null && h.NgayKetThuc.Value.Date < now.Date)
                .ToListAsync();
            if (hetHan.Count > 0)
            {
                foreach (var h in hetHan) h.TrangThai = TrangThaiHopDong.HetHan;
                await _context.SaveChangesAsync();
            }

            // Cascade: phụ lục "sống theo" HĐ gốc — HĐ gốc đã HetHan/DaChamDut thì mọi phụ lục
            // còn HieuLuc cũng chuyển theo đúng trạng thái đó (không xử lý hết hạn từng phụ lục).
            var gocKetThuc = await _context.HopDongs
                .Where(h => h.SoHopDongGoc == null
                         && (h.TrangThai == TrangThaiHopDong.HetHan || h.TrangThai == TrangThaiHopDong.DaChamDut))
                .Select(h => new { h.SoHopDong, h.TrangThai })
                .ToListAsync();
            if (gocKetThuc.Count > 0)
            {
                var mapTrangThai = gocKetThuc.ToDictionary(x => x.SoHopDong, x => x.TrangThai);
                var codes = mapTrangThai.Keys.ToList();
                var phuLucTheoGoc = await _context.HopDongs
                    .Where(p => p.SoHopDongGoc != null && codes.Contains(p.SoHopDongGoc)
                             && p.TrangThai == TrangThaiHopDong.HieuLuc)
                    .ToListAsync();
                if (phuLucTheoGoc.Count > 0)
                {
                    foreach (var p in phuLucTheoGoc) p.TrangThai = mapTrangThai[p.SoHopDongGoc!];
                    await _context.SaveChangesAsync();
                }
            }

            var query = _context.HopDongs
                .Include(h => h.NhanVien).ThenInclude(nv => nv.PhongBan)
                .Include(h => h.NhanVien).ThenInclude(nv => nv.ChucVuNhanVien)
                .AsQueryable();

            // 1. Phân quyền xem
            if (userRole == "Trưởng phòng")
            {
                if (!string.IsNullOrEmpty(userDept))
                    query = query.Where(h => h.NhanVien.MaPhongBan == userDept);
                else
                    return Ok(new List<object>());
            }
            // Giám đốc, HR, Kế toán: Xem hết

            // 2. Tìm kiếm
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(h =>
                    h.MaNhanVien.ToLower().Contains(lowerSearch) ||
                    (h.NhanVien != null && h.NhanVien.HoTen.ToLower().Contains(lowerSearch)) ||
                    h.SoHopDong.ToLower().Contains(lowerSearch));
            }

            // 3. Lọc trạng thái
            if (!string.IsNullOrEmpty(trangThai) && trangThai != "All")
            {
                query = query.Where(h => h.TrangThai == trangThai);
            }
            else if (string.IsNullOrEmpty(trangThai) && !sapHetHan.HasValue) // Nếu đang lọc sắp hết hạn thì ko gò bó TrangThai = HieuLuc
            {
                query = query.Where(h => h.TrangThai == "HieuLuc");
            }

            // --- THÊM MỚI 2: LOGIC LỌC CHỈ LẤY CÁC HỢP ĐỒNG SẮP HẾT HẠN <= 30 NGÀY ---
            if (sapHetHan.HasValue && sapHetHan.Value)
            {
                query = query.Where(h => h.NgayKetThuc.HasValue
                                      && h.NgayKetThuc.Value.Date >= now.Date
                                      && h.NgayKetThuc.Value.Date <= now.AddDays(30).Date);
            }

            var result = await query.OrderByDescending(h => h.NgayBatDau)
                .Select(h => new
                {
                    h.SoHopDong,
                    h.MaNhanVien,
                    HoTenNhanVien = h.NhanVien != null ? h.NhanVien.HoTen : "N/A",
                    TenPhongBan = h.NhanVien != null && h.NhanVien.PhongBan != null ? h.NhanVien.PhongBan.TenPhongBan : "",
                    TenChucVu = h.NhanVien != null && h.NhanVien.ChucVuNhanVien != null ? h.NhanVien.ChucVuNhanVien.TenChucVu : "",
                    NgaySinh = h.NhanVien != null ? h.NhanVien.NgaySinh : null,
                    CCCD = h.NhanVien != null ? h.NhanVien.CCCD : "",
                    DiaChi = h.NhanVien != null ? h.NhanVien.DiaChiThuongTru : "",
                    SoDienThoai = h.NhanVien != null ? h.NhanVien.sdt_NhanVien : "",
                    ChuKy = h.NhanVien != null ? h.NhanVien.ChuKy : null,

                    h.LoaiHopDong,
                    h.NgayBatDau,
                    h.NgayKetThuc,
                    h.LuongCoBan,
                    h.TrangThai,
                    h.TepDinhKem,
                    h.GhiChu,

                    // Phụ lục & chức vụ / nơi làm việc theo HĐ
                    h.SoHopDongGoc,
                    h.MaChucVu,
                    h.NoiLamViec,

                    // --- THÊM MỚI 3: CỜ (FLAG) ĐỂ FRONTEND HIỂN THỊ CẢNH BÁO MÀU ĐỎ ---
                    IsExpiringSoon = h.NgayKetThuc.HasValue
                                     && h.NgayKetThuc.Value.Date >= now.Date
                                     && h.NgayKetThuc.Value.Date <= now.AddDays(30).Date
                })
                .ToListAsync();

            return Ok(result);
        }

        // POST: api/HopDong
        [HttpPost]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<ActionResult<HopDong>> CreateHopDong([FromForm] HopDongInputDto dto)
        {
            if (!LoaiHopDongConst.All.Contains(dto.LoaiHopDong))
                return BadRequest(new { message = "Loại hợp đồng không hợp lệ (chỉ 'Thử việc' hoặc 'Chính thức')." });
            if (!TrangThaiHopDong.All.Contains(dto.TrangThai))
                return BadRequest(new { message = "Trạng thái hợp đồng không hợp lệ." });

            var nhanVien = await _context.NhanViens.FindAsync(dto.MaNhanVien);
            if (nhanVien == null) return BadRequest(new { message = "Mã nhân viên không tồn tại." });

            // Mã hợp đồng TỰ SINH theo định dạng HĐ-{năm}/{số thứ tự 3 chữ số}
            string soHopDong = await SinhMaHopDongMoi();

            // Kiểm tra chồng lấn / khe hở ngày (chỉ với HĐ hiệu lực)
            string? canhBaoKheHo = null;
            if (dto.TrangThai == "HieuLuc")
            {
                var (ok, error, warning) = await KiemTraNgayHopDong(dto.MaNhanVien, dto.NgayBatDau, dto.NgayKetThuc, null);
                if (!ok) return BadRequest(new { message = error });
                canhBaoKheHo = warning;
            }

            string? filePath = null;
            if (dto.FileDinhKem != null && dto.FileDinhKem.Length > 0)
            {
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "contracts");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                string uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.FileDinhKem.FileName)}";
                using (var stream = new FileStream(Path.Combine(uploadsFolder, uniqueFileName), FileMode.Create))
                {
                    await dto.FileDinhKem.CopyToAsync(stream);
                }
                filePath = "/contracts/" + uniqueFileName;
            }

            var hopDong = new HopDong
            {
                SoHopDong = soHopDong,
                MaNhanVien = dto.MaNhanVien,
                LoaiHopDong = dto.LoaiHopDong,
                NgayBatDau = dto.NgayBatDau,
                NgayKetThuc = dto.NgayKetThuc,
                LuongCoBan = dto.LuongCoBan,
                LuongDongBaoHiem = dto.LuongDongBaoHiem,
                TepDinhKem = filePath,
                TrangThai = dto.TrangThai,
                GhiChu = dto.GhiChu,
                MaChucVu = dto.MaChucVu,
                NoiLamViec = dto.NoiLamViec,
                NgayKy = DateTime.Now
            };

            _context.HopDongs.Add(hopDong);
            await _context.SaveChangesAsync();

            // Đồng bộ NhanVien theo HĐ đang hiệu lực hôm nay (không ghi đè nhầm khi tạo HĐ quá khứ/tương lai)
            await DongBoHopDongHienHanh(dto.MaNhanVien);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo hợp đồng thành công", soHopDong, warning = canhBaoKheHo });
        }

        // ==============================================================
        // POST: api/HopDong/phu-luc — TẠO PHỤ LỤC CHO HĐ GỐC
        // Phụ lục = văn bản sửa đổi (lương / chức vụ / nơi làm việc / gia hạn) gắn vào HĐ GỐC.
        // KHÔNG làm HĐ gốc hết hiệu lực — HĐ gốc giữ nguyên trạng thái & ngày kết thúc.
        // Payroll tự tách kỳ theo ngày hiệu lực (logic activeContracts + boundary) nên
        // KHÔNG cần cắt ngày HĐ gốc; nhiều phụ lục đều trỏ về CÙNG 1 HĐ gốc (không có phụ lục-của-phụ lục).
        // ==============================================================
        [HttpPost("phu-luc")]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<ActionResult> CreatePhuLuc([FromForm] HopDongInputDto dto)
        {
            if (string.IsNullOrEmpty(dto.SoHopDongGoc))
                return BadRequest(new { message = "Thiếu mã hợp đồng gốc." });

            var goc = await _context.HopDongs.FindAsync(dto.SoHopDongGoc);
            if (goc == null) return BadRequest(new { message = $"Không tìm thấy hợp đồng gốc '{dto.SoHopDongGoc}'." });

            // KHÔNG cho tạo "phụ lục của phụ lục": mọi phụ lục phải gắn vào HĐ gốc thật.
            if (!string.IsNullOrEmpty(goc.SoHopDongGoc))
                return BadRequest(new { message = $"'{goc.SoHopDong}' là một phụ lục. Vui lòng tạo phụ lục trên HỢP ĐỒNG GỐC ({goc.SoHopDongGoc})." });

            // Chỉ tạo phụ lục khi HĐ gốc CÒN HIỆU LỰC. Hết hạn/chấm dứt → phải ký hợp đồng mới.
            if (goc.TrangThai != TrangThaiHopDong.HieuLuc)
                return BadRequest(new { message = "Hợp đồng gốc đã hết hạn hoặc đã chấm dứt — không thể tạo phụ lục. Vui lòng ký hợp đồng mới." });

            string maNhanVien = goc.MaNhanVien;
            DateTime hieuLuc  = dto.NgayBatDau.Date;

            // Ngày hiệu lực phụ lục phải nằm TRONG thời hạn HĐ gốc.
            if (hieuLuc <= goc.NgayBatDau.Date)
                return BadRequest(new { message = $"Ngày hiệu lực phụ lục phải sau ngày bắt đầu HĐ gốc ({goc.NgayBatDau:dd/MM/yyyy})." });
            if (goc.NgayKetThuc.HasValue && hieuLuc > goc.NgayKetThuc.Value.Date)
                return BadRequest(new { message = $"Ngày hiệu lực phụ lục vượt quá thời hạn HĐ gốc ({goc.NgayKetThuc:dd/MM/yyyy})." });

            // Sinh mã phụ lục theo HĐ gốc: {maGoc}/PL{n}
            int soPL = await _context.HopDongs.CountAsync(h => h.SoHopDongGoc == goc.SoHopDong);
            string maPhuLuc = $"{goc.SoHopDong}/PL{(soPL + 1):D2}";

            // File đính kèm (nếu có)
            string? filePath = null;
            if (dto.FileDinhKem != null && dto.FileDinhKem.Length > 0)
            {
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "contracts");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                string uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.FileDinhKem.FileName)}";
                using (var stream = new FileStream(Path.Combine(uploadsFolder, uniqueFileName), FileMode.Create))
                {
                    await dto.FileDinhKem.CopyToAsync(stream);
                }
                filePath = "/contracts/" + uniqueFileName;
            }

            var phuLuc = new HopDong
            {
                SoHopDong        = maPhuLuc,
                SoHopDongGoc     = goc.SoHopDong,             // luôn trỏ về HĐ gốc thật
                MaNhanVien       = maNhanVien,
                LoaiHopDong      = goc.LoaiHopDong,           // phụ lục giữ nguyên loại HĐ gốc
                NgayBatDau       = hieuLuc,
                // Mặc định áp dụng đến hết thời hạn HĐ gốc; chỉ khi GIA HẠN mới đặt ngày kết thúc mới.
                NgayKetThuc      = dto.NgayKetThuc ?? goc.NgayKetThuc,
                LuongCoBan       = dto.LuongCoBan,
                LuongDongBaoHiem = dto.LuongDongBaoHiem > 0 ? dto.LuongDongBaoHiem : dto.LuongCoBan,
                MaChucVu         = dto.MaChucVu,
                NoiLamViec       = dto.NoiLamViec,
                TepDinhKem       = filePath,
                TrangThai        = TrangThaiHopDong.HieuLuc,
                GhiChu           = dto.GhiChu,
                NgayKy           = DateTime.Now
            };

            _context.HopDongs.Add(phuLuc);
            await _context.SaveChangesAsync();

            // 6. Đồng bộ lương/chức vụ/nơi làm việc hiện hành xuống hồ sơ NV.
            await DongBoHopDongHienHanh(maNhanVien);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo phụ lục thành công", soHopDong = maPhuLuc, soHopDongGoc = goc.SoHopDong });
        }

        // PUT: api/HopDong
        [HttpPut]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> UpdateHopDong([FromQuery] string id, [FromForm] HopDongInputDto dto)
        {
            var hopDong = await _context.HopDongs.FindAsync(id);
            if (hopDong == null) return NotFound(new { message = $"Không tìm thấy hợp đồng số '{id}'" });

            if (!LoaiHopDongConst.All.Contains(dto.LoaiHopDong))
                return BadRequest(new { message = "Loại hợp đồng không hợp lệ (chỉ 'Thử việc' hoặc 'Chính thức')." });
            if (!TrangThaiHopDong.All.Contains(dto.TrangThai))
                return BadRequest(new { message = "Trạng thái hợp đồng không hợp lệ." });

            // Kiểm tra chồng lấn / khe hở ngày (loại trừ chính HĐ đang sửa)
            string? canhBaoKheHo = null;
            if (dto.TrangThai == "HieuLuc")
            {
                var (ok, error, warning) = await KiemTraNgayHopDong(hopDong.MaNhanVien, dto.NgayBatDau, dto.NgayKetThuc, id);
                if (!ok) return BadRequest(new { message = error });
                canhBaoKheHo = warning;
            }

            if (dto.FileDinhKem != null && dto.FileDinhKem.Length > 0)
            {
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "contracts");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                string uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.FileDinhKem.FileName)}";
                using (var stream = new FileStream(Path.Combine(uploadsFolder, uniqueFileName), FileMode.Create))
                {
                    await dto.FileDinhKem.CopyToAsync(stream);
                }
                hopDong.TepDinhKem = "/contracts/" + uniqueFileName;
            }

            hopDong.LoaiHopDong = dto.LoaiHopDong;
            hopDong.NgayBatDau = dto.NgayBatDau;
            hopDong.NgayKetThuc = dto.NgayKetThuc;
            hopDong.LuongCoBan = dto.LuongCoBan;
            hopDong.LuongDongBaoHiem = dto.LuongDongBaoHiem;
            hopDong.TrangThai = dto.TrangThai;
            hopDong.GhiChu = dto.GhiChu;
            hopDong.MaChucVu = dto.MaChucVu;
            hopDong.NoiLamViec = dto.NoiLamViec;

            await _context.SaveChangesAsync();

            // Đồng bộ NhanVien theo HĐ đang hiệu lực hôm nay
            await DongBoHopDongHienHanh(hopDong.MaNhanVien);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thành công", warning = canhBaoKheHo });
        }

        // DELETE: api/HopDong
        // Vô hiệu hóa (soft-delete) thay vì xóa cứng — chuyển hợp đồng về trạng thái
        // "Đã chấm dứt", giữ lịch sử để bảng lương đã chốt vẫn tham chiếu được.
        [HttpDelete]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> DeleteHopDong([FromQuery] string id)
        {
            var hd = await _context.HopDongs.FindAsync(id);
            if (hd == null) return NotFound(new { message = "Không tìm thấy hợp đồng." });
            if (hd.TrangThai == "DaChamDut")
                return BadRequest(new { message = "Hợp đồng đã ở trạng thái Đã chấm dứt." });

            hd.TrangThai = "DaChamDut";

            // Cascade: chấm dứt HĐ GỐC → toàn bộ phụ lục của nó cũng chấm dứt theo.
            if (string.IsNullOrEmpty(hd.SoHopDongGoc))
            {
                var phuLucs = await _context.HopDongs
                    .Where(p => p.SoHopDongGoc == hd.SoHopDong && p.TrangThai == TrangThaiHopDong.HieuLuc)
                    .ToListAsync();
                foreach (var p in phuLucs) p.TrangThai = TrangThaiHopDong.DaChamDut;
            }

            await _context.SaveChangesAsync();

            // Chấm dứt xong → đồng bộ lại NhanVien theo HĐ hiệu lực còn lại (nếu có)
            await DongBoHopDongHienHanh(hd.MaNhanVien);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã vô hiệu hóa (chấm dứt) hợp đồng và các phụ lục liên quan." });
        }

        // GET: api/NhanVien/GiamDoc
        [HttpGet("GiamDoc")]
        public async Task<IActionResult> GetGiamDoc()
        {
            var giamDoc = await _context.NhanViens
                .Include(nv => nv.ChucVuNhanVien)
                .Where(nv => nv.ChucVuNhanVien.TenChucVu.Contains("Giám đốc") && nv.TrangThai == true)
                .Select(nv => new
                {
                    nv.HoTen,
                    TenChucVu = nv.ChucVuNhanVien != null ? nv.ChucVuNhanVien.TenChucVu : "Giám đốc",
                    nv.ChuKy
                })
                .FirstOrDefaultAsync();

            if (giamDoc == null)
            {
                return Ok(null);
            }

            return Ok(giamDoc);
        }

        // GET: api/HopDong/next-code — xem trước mã hợp đồng sẽ được cấp
        [HttpGet("next-code")]
        [Authorize(Roles = "Giám đốc,Nhân sự trưởng")]
        public async Task<IActionResult> GetNextCode()
        {
            return Ok(new { soHopDong = await SinhMaHopDongMoi() });
        }

        // ==============================================================
        // HELPER: Sinh mã hợp đồng tự động — định dạng HĐ-{năm}/{số 3 chữ số}, đánh số lại theo từng năm
        // ==============================================================
        private async Task<string> SinhMaHopDongMoi()
        {
            int nam = DateTime.Now.Year;
            string prefix = $"HĐ-{nam}/";

            var maHienCo = await _context.HopDongs
                .Where(h => h.SoHopDong.StartsWith(prefix))
                .Select(h => h.SoHopDong)
                .ToListAsync();

            int max = 0;
            foreach (var ma in maHienCo)
            {
                if (int.TryParse(ma.Substring(prefix.Length), out int n) && n > max) max = n;
            }

            return $"{prefix}{(max + 1):D3}";
        }

        // ==============================================================
        // HELPER: Đồng bộ lương/HĐ xuống NhanVien theo HĐ ĐANG HIỆU LỰC HÔM NAY
        // (start mới nhất thắng nếu có chồng lấn). Không còn HĐ hiệu lực → GIỮ NGUYÊN.
        // ==============================================================
        private async Task DongBoHopDongHienHanh(string maNhanVien)
        {
            var today = DateTime.Now.Date;
            var hd = await _context.HopDongs
                .Where(h => h.MaNhanVien == maNhanVien
                         && h.TrangThai == "HieuLuc"
                         && h.NgayBatDau.Date <= today
                         && (h.NgayKetThuc == null || h.NgayKetThuc.Value.Date >= today))
                .OrderByDescending(h => h.NgayBatDau)
                .FirstOrDefaultAsync();

            var nv = await _context.NhanViens.FindAsync(maNhanVien);
            if (nv == null) return;

            if (hd != null)
            {
                nv.LuongCoBan   = hd.LuongCoBan;
                nv.SoHopDong    = hd.SoHopDong;
                nv.LoaiNhanVien = hd.LoaiHopDong;
                // Phụ lục có thể đổi chức vụ → đồng bộ xuống hồ sơ NV (chỉ khi HĐ có set chức vụ)
                if (!string.IsNullOrEmpty(hd.MaChucVu))
                    nv.MaChucVuNV = hd.MaChucVu;
            }
            // else: NV không còn HĐ hiệu lực hôm nay → giữ nguyên lương cũ (quyết định ①a)
        }

        // ==============================================================
        // HELPER: Kiểm tra chồng lấn (chặn) / khe hở ngày (cảnh báo) với các HĐ HieuLuc khác
        // ==============================================================
        private async Task<(bool ok, string? error, string? warning)> KiemTraNgayHopDong(
            string maNhanVien, DateTime ngayBatDau, DateTime? ngayKetThuc, string? soHopDongHienTai)
        {
            var others = await _context.HopDongs
                .Where(h => h.MaNhanVien == maNhanVien
                         && h.TrangThai == "HieuLuc"
                         && h.SoHopDong != soHopDongHienTai)
                .ToListAsync();

            DateTime end = ngayKetThuc ?? DateTime.MaxValue;

            // 1. Chồng lấn → chặn
            foreach (var h in others)
            {
                DateTime hEnd = h.NgayKetThuc ?? DateTime.MaxValue;
                bool overlap = ngayBatDau.Date <= hEnd.Date && h.NgayBatDau.Date <= end.Date;
                if (overlap)
                    return (false,
                        $"Khoảng ngày trùng với hợp đồng '{h.SoHopDong}' ({h.NgayBatDau:dd/MM/yyyy} - {(h.NgayKetThuc?.ToString("dd/MM/yyyy") ?? "không thời hạn")}).",
                        null);
            }

            // 2. Khe hở so với HĐ liền trước → cảnh báo (vẫn cho lưu)
            var prev = others
                .Where(h => h.NgayKetThuc.HasValue && h.NgayKetThuc.Value.Date < ngayBatDau.Date)
                .OrderByDescending(h => h.NgayKetThuc!.Value)
                .FirstOrDefault();

            string? warning = null;
            if (prev != null)
            {
                int gap = (ngayBatDau.Date - prev.NgayKetThuc!.Value.Date).Days - 1;
                if (gap > 0)
                    warning = $"Có {gap} ngày trống giữa HĐ '{prev.SoHopDong}' (kết thúc {prev.NgayKetThuc:dd/MM/yyyy}) và HĐ này (bắt đầu {ngayBatDau:dd/MM/yyyy}) — lương các ngày này sẽ không được tính.";
            }

            return (true, null, warning);
        }
    }
}