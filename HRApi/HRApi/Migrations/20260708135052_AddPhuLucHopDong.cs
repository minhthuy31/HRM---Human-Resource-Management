using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPhuLucHopDong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Chỉ thêm 3 cột phụ lục mới cho HopDongs.
            // (Các cột khác EF gợi ý đã tồn tại sẵn trong DB — snapshot cũ bị lệch — nên bỏ qua.)
            migrationBuilder.AddColumn<string>(
                name: "SoHopDongGoc",
                table: "HopDongs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaChucVu",
                table: "HopDongs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NoiLamViec",
                table: "HopDongs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "SoHopDongGoc", table: "HopDongs");
            migrationBuilder.DropColumn(name: "MaChucVu", table: "HopDongs");
            migrationBuilder.DropColumn(name: "NoiLamViec", table: "HopDongs");
        }
    }
}
