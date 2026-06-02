using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRApi.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        public string MaNhanVien { get; set; }

        // "user" hoặc "bot"
        public string Sender { get; set; }

        // Nội dung tin nhắn (chuỗi text)
        public string Text { get; set; }

        // Lưu trữ dạng chuỗi JSON cho các bảng hoặc dữ liệu cấu trúc
        [Column(TypeName = "nvarchar(max)")]
        public string? TableDataJson { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
