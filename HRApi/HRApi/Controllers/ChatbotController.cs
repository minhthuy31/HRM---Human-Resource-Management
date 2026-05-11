using HRApi.Data;
using HRApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace HRApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatbotController(AppDbContext context)
        {
            _context = context;
        }

        public class ChatRequestDto
        {
            public string Message { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> HandleChat([FromBody] ChatRequestDto request)
        {
            var maNhanVien = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(maNhanVien))
                return Unauthorized(new { reply = "Phiên đăng nhập không hợp lệ. Vui lòng tải lại trang." });

            string text = request.Message.ToLower().Trim();

            // ==========================================
            // 1. LUỒNG ĐĂNG KÝ NGHỈ PHÉP
            // ==========================================
            if (text.Contains("nghỉ phép") || text.Contains("xin nghỉ") || text.Contains("cho em nghỉ"))
            {
                var info = ExtractLeaveInfo(text, request.Message); // Truyền thêm chuỗi gốc để giữ viết hoa lý do

                if (info.Date == null)
                    return Ok(new { reply = "Bạn muốn xin nghỉ vào ngày nào vậy? (Ví dụ: 'ngày mai', 'ngày 18/4')" });

                if (string.IsNullOrEmpty(info.Reason))
                    return Ok(new { reply = $"Bạn xin nghỉ ngày {info.Date.Value:dd/MM/yyyy}. Cho mình xin lý do cụ thể nhé (Ví dụ: 'vì bị ốm')!" });

                var donNghi = new DonNghiPhep
                {
                    MaNhanVien = maNhanVien,
                    NgayBatDau = info.Date.Value,
                    NgayKetThuc = info.Date.Value, // Tạm định dạng nghỉ 1 ngày qua chat
                    SoNgayNghi = 1,
                    LyDo = info.Reason,
                    TrangThai = "Chờ duyệt",
                    NgayGuiDon = DateTime.Now
                };

                _context.DonNghiPheps.Add(donNghi);
                await _context.SaveChangesAsync();

                return Ok(new { reply = $"✅ Mình đã tạo đơn **Xin nghỉ phép** ngày {info.Date.Value:dd/MM/yyyy} với lý do: '{info.Reason}'. Đơn đang chờ duyệt nhé!" });
            }

            // ==========================================
            // 2. LUỒNG ĐĂNG KÝ OT (TĂNG CA)
            // ==========================================
            if (text.Contains("tăng ca") || text.Contains("ot") || text.Contains("làm thêm"))
            {
                var info = ExtractOTInfo(text, request.Message);

                if (info.Date == null)
                    return Ok(new { reply = "Bạn muốn đăng ký OT vào ngày nào?" });

                if (info.Start == null || info.End == null)
                    return Ok(new { reply = "Bạn vui lòng nhập rõ giờ OT nhé (Ví dụ: 'từ 18h đến 20h30')." });

                if (info.End <= info.Start)
                    return Ok(new { reply = "Giờ kết thúc OT phải lớn hơn giờ bắt đầu bạn nhé!" });

                var donOT = new DangKyOT
                {
                    MaNhanVien = maNhanVien,
                    NgayLamThem = info.Date.Value,
                    GioBatDau = info.Start.Value,
                    GioKetThuc = info.End.Value,
                    SoGio = (info.End.Value - info.Start.Value).TotalHours,
                    LyDo = string.IsNullOrEmpty(info.Reason) ? "Làm thêm giờ (Tạo qua Chatbot)" : info.Reason,
                    TrangThai = "Chờ duyệt",
                    NgayGuiDon = DateTime.Now
                };

                _context.DangKyOTs.Add(donOT);
                await _context.SaveChangesAsync();

                return Ok(new { reply = $"✅ Đã ghi nhận lịch **Tăng ca (OT)** ngày {info.Date.Value:dd/MM/yyyy} từ {info.Start.Value:hh\\:mm} đến {info.End.Value:hh\\:mm}. Tổng cộng {donOT.SoGio} tiếng. Cố gắng lên nhé!" });
            }

            // ==========================================
            // 3. LUỒNG ĐĂNG KÝ CÔNG TÁC
            // ==========================================
            if (text.Contains("công tác") || text.Contains("đi xa"))
            {
                var info = ExtractTripInfo(text, request.Message);

                if (info.Date == null)
                    return Ok(new { reply = "Bạn đi công tác vào ngày nào?" });

                if (string.IsNullOrEmpty(info.Location))
                    return Ok(new { reply = "Bạn đi công tác ở đâu? (Gợi ý: nhập 'tại Hà Nội' hoặc 'đi Đà Nẵng')" });

                var donCongTac = new DangKyCongTac
                {
                    MaNhanVien = maNhanVien,
                    NgayBatDau = info.Date.Value,
                    NgayKetThuc = info.Date.Value, // Chatbot tạm cấu hình đi về trong ngày
                    NoiCongTac = info.Location,
                    MucDich = string.IsNullOrEmpty(info.Purpose) ? "Giải quyết công việc" : info.Purpose,
                    KinhPhiDuKien = 0, // Giá trị mặc định
                    SoTienTamUng = 0,  // Giá trị mặc định
                    TrangThai = "Chờ duyệt",
                    NgayGuiDon = DateTime.Now
                };

                _context.DangKyCongTacs.Add(donCongTac);
                await _context.SaveChangesAsync();

                return Ok(new { reply = $"✅ Đã tạo đơn **Công tác** tại '{info.Location}' vào ngày {info.Date.Value:dd/MM/yyyy}. Chúc bạn chuyến đi thuận lợi!" });
            }

            // ==========================================
            // 4. FALLBACK (Không hiểu ý định)
            // ==========================================
            return Ok(new { reply = "Xin lỗi, hiện tại mình hỗ trợ 3 tính năng nhanh qua chat:\n- **Xin nghỉ phép** (vd: 'Cho mình nghỉ phép ngày mai vì nhà có việc')\n- **Đăng ký OT** (vd: 'Mai mình OT từ 18h đến 21h do dự án gấp')\n- **Đăng ký công tác** (vd: 'Ngày mốt mình đi công tác tại Hải Phòng để gặp khách hàng')\nBạn hãy thử lại nhé!" });
        }


        // =========================================================================
        // CÁC HÀM BÓC TÁCH TỪ KHÓA (SLOT-FILLING) BÊN DƯỚI
        // =========================================================================

        /// <summary>
        /// Hàm dùng chung: Bóc tách ngày tháng (ngày mai, hôm nay, 18/4...)
        /// </summary>
        private DateTime? ExtractDate(string textLower)
        {
            var today = DateTime.Today;

            // 1. Tương đối
            if (textLower.Contains("ngày mai") || textLower.Contains("mai")) return today.AddDays(1);
            if (textLower.Contains("ngày mốt") || textLower.Contains("mốt")) return today.AddDays(2);
            if (textLower.Contains("hôm nay") || textLower.Contains("nay")) return today;

            // 2. Tuyệt đối: Bắt các dạng "ngày 17", "17/04", "17/4"
            var match = Regex.Match(textLower, @"\b(\d{1,2})(?:/(\d{1,2}))?\b");
            if (match.Success)
            {
                int day = int.Parse(match.Groups[1].Value);
                // Nếu có tháng thì lấy, không có thì lấy tháng hiện tại
                int month = match.Groups[2].Success ? int.Parse(match.Groups[2].Value) : today.Month;

                try
                {
                    return new DateTime(today.Year, month, day);
                }
                catch { return null; } // Tránh lỗi ngày 30/2
            }
            return null;
        }

        /// <summary>
        /// Bóc tách luồng Xin Nghỉ
        /// </summary>
        private (DateTime? Date, string Reason) ExtractLeaveInfo(string textLower, string originalText)
        {
            var date = ExtractDate(textLower);
            string reason = "";

            // Tìm từ khóa báo hiệu lý do
            string[] keywords = { "vì ", "do ", "lý do là ", "bị " };
            foreach (var kw in keywords)
            {
                int index = textLower.IndexOf(kw);
                if (index != -1)
                {
                    // Lấy đoạn chữ phía sau từ khóa từ CHUỖI GỐC để giữ viết hoa
                    reason = originalText.Substring(index + kw.Length).Trim();
                    break;
                }
            }
            return (date, reason);
        }

        /// <summary>
        /// Bóc tách luồng Đăng ký OT
        /// </summary>
        private (DateTime? Date, TimeSpan? Start, TimeSpan? End, string Reason) ExtractOTInfo(string textLower, string originalText)
        {
            var date = ExtractDate(textLower);
            TimeSpan? start = null;
            TimeSpan? end = null;
            string reason = "";

            // Bắt giờ OT bằng Regex: Ví dụ "từ 18h đến 20h30" hoặc "18:00 - 20:00"
            // \d{1,2} : Bắt 1 hoặc 2 chữ số (giờ)
            // (?:h|:)?(\d{2})? : Bắt tùy chọn chữ 'h' hoặc ':' và 2 chữ số phút
            var timeMatch = Regex.Match(textLower, @"(\d{1,2})(?:h|:)?(\d{2})?.*?(\d{1,2})(?:h|:)?(\d{2})?");
            if (timeMatch.Success)
            {
                int startHour = int.Parse(timeMatch.Groups[1].Value);
                int startMin = timeMatch.Groups[2].Success ? int.Parse(timeMatch.Groups[2].Value) : 0;

                int endHour = int.Parse(timeMatch.Groups[3].Value);
                int endMin = timeMatch.Groups[4].Success ? int.Parse(timeMatch.Groups[4].Value) : 0;

                start = new TimeSpan(startHour, startMin, 0);
                end = new TimeSpan(endHour, endMin, 0);
            }

            // Lấy lý do OT
            int reasonIndex = textLower.IndexOf("do ");
            if (reasonIndex == -1) reasonIndex = textLower.IndexOf("vì ");
            if (reasonIndex != -1) reason = originalText.Substring(reasonIndex + 3).Trim();

            return (date, start, end, reason);
        }

        /// <summary>
        /// Bóc tách luồng Công tác
        /// </summary>
        private (DateTime? Date, string Location, string Purpose) ExtractTripInfo(string textLower, string originalText)
        {
            var date = ExtractDate(textLower);
            string location = "";
            string purpose = "";

            // Bắt địa điểm: Tìm đoạn chữ nằm giữa ("tại", "ở", "đi") và ("để", "vì", "do")
            var locMatch = Regex.Match(textLower, @"(?:tại|ở|đi)\s+(.*?)\s+(?:để|vì|do)");
            if (locMatch.Success)
            {
                // Lấy vị trí index từ chuỗi gốc để cắt (giữ nguyên Hoa/Thường)
                int startLoc = locMatch.Groups[1].Index;
                int lenLoc = locMatch.Groups[1].Length;
                location = originalText.Substring(startLoc, lenLoc).Trim();
            }
            else
            {
                // Nếu không có chữ "để/vì", chỉ cần lấy sau chữ "tại/ở" đến hết câu
                var locMatchSimple = Regex.Match(textLower, @"(?:tại|ở|đi)\s+(.*)");
                if (locMatchSimple.Success)
                {
                    int startLoc = locMatchSimple.Groups[1].Index;
                    location = originalText.Substring(startLoc).Trim();
                }
            }

            // Bắt mục đích (sau chữ "để ", "vì ")
            int purposeIndex = textLower.IndexOf("để ");
            if (purposeIndex == -1) purposeIndex = textLower.IndexOf("vì ");
            if (purposeIndex != -1) purpose = originalText.Substring(purposeIndex + 3).Trim();

            return (date, location, purpose);
        }
    }
}