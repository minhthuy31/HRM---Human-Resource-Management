using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRApi.Migrations
{
    /// <inheritdoc />
    public partial class CaiDatHeThong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenCongTy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenVietTat = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaSoThue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SdtHotline = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GioVaoLam = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GioTanLam = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThoiGianNghiTrua = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SoPhutDiMuonChoPhep = table.Column<int>(type: "int", nullable: false),
                    NgayPhepTieuChuan = table.Column<int>(type: "int", nullable: false),
                    MucLuongCoSo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PhanTramBHXHCompany = table.Column<double>(type: "float", nullable: false),
                    PhanTramBHXHEmployee = table.Column<double>(type: "float", nullable: false),
                    GiamTruGiaCanh = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GiamTruPhuThuoc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SmtpServer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmtpPort = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmailGuiDi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GuiMailTuDong = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
