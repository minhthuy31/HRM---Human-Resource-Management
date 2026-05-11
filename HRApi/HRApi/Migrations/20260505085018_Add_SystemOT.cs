using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRApi.Migrations
{
    /// <inheritdoc />
    public partial class Add_SystemOT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "HeSoOTCuoiTuan",
                table: "SystemSettings",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "HeSoOTNgayLe",
                table: "SystemSettings",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "HeSoOTNgayThuong",
                table: "SystemSettings",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeSoOTCuoiTuan",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "HeSoOTNgayLe",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "HeSoOTNgayThuong",
                table: "SystemSettings");
        }
    }
}
