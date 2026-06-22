IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812143945_Init'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [Username] nvarchar(max) NOT NULL,
        [Password] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812143945_Init'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250812143945_Init', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250813020752_AddPasswordResetFields'
)
BEGIN
    ALTER TABLE [Users] ADD [PasswordResetToken] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250813020752_AddPasswordResetFields'
)
BEGIN
    ALTER TABLE [Users] ADD [ResetTokenExpires] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250813020752_AddPasswordResetFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250813020752_AddPasswordResetFields', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    ALTER TABLE [Users] ADD [Email] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE TABLE [ChucVuNhanViens] (
        [MaChucVuNV] nvarchar(450) NOT NULL,
        [TenChucVu] nvarchar(max) NOT NULL,
        [HSPC] float NULL,
        CONSTRAINT [PK_ChucVuNhanViens] PRIMARY KEY ([MaChucVuNV])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE TABLE [ChuyenNganhs] (
        [MaChuyenNganh] nvarchar(450) NOT NULL,
        [TenChuyenNganh] nvarchar(max) NULL,
        CONSTRAINT [PK_ChuyenNganhs] PRIMARY KEY ([MaChuyenNganh])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE TABLE [HopDongs] (
        [MaHopDong] nvarchar(450) NOT NULL,
        [LoaiHopDong] nvarchar(max) NULL,
        [NgayBatDau] datetime2 NULL,
        [NgayKetThuc] datetime2 NULL,
        [GhiChu] nvarchar(max) NULL,
        CONSTRAINT [PK_HopDongs] PRIMARY KEY ([MaHopDong])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE TABLE [PhongBans] (
        [MaPhongBan] nvarchar(450) NOT NULL,
        [TenPhongBan] nvarchar(max) NOT NULL,
        [DiaChi] nvarchar(max) NULL,
        [sdt_PhongBan] nvarchar(max) NULL,
        CONSTRAINT [PK_PhongBans] PRIMARY KEY ([MaPhongBan])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE TABLE [TrinhDoHocVans] (
        [MaTrinhDoHocVan] nvarchar(450) NOT NULL,
        [TenTrinhDo] nvarchar(max) NOT NULL,
        [HeSoBac] float NULL,
        CONSTRAINT [PK_TrinhDoHocVans] PRIMARY KEY ([MaTrinhDoHocVan])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE TABLE [NhanViens] (
        [MaNhanVien] nvarchar(450) NOT NULL,
        [MatKhau] nvarchar(max) NOT NULL,
        [HoTen] nvarchar(max) NULL,
        [NgaySinh] datetime2 NULL,
        [QueQuan] nvarchar(max) NULL,
        [HinhAnh] nvarchar(max) NULL,
        [GioiTinh] int NULL,
        [DanToc] nvarchar(max) NULL,
        [sdt_NhanVien] nvarchar(max) NULL,
        [MaChucVuNV] nvarchar(450) NULL,
        [TrangThai] bit NOT NULL,
        [MaPhongBan] nvarchar(450) NULL,
        [MaHopDong] nvarchar(450) NULL,
        [MaChuyenNganh] nvarchar(450) NULL,
        [MaTrinhDoHocVan] nvarchar(450) NULL,
        [CCCD] nvarchar(max) NULL,
        CONSTRAINT [PK_NhanViens] PRIMARY KEY ([MaNhanVien]),
        CONSTRAINT [FK_NhanViens_ChucVuNhanViens_MaChucVuNV] FOREIGN KEY ([MaChucVuNV]) REFERENCES [ChucVuNhanViens] ([MaChucVuNV]),
        CONSTRAINT [FK_NhanViens_ChuyenNganhs_MaChuyenNganh] FOREIGN KEY ([MaChuyenNganh]) REFERENCES [ChuyenNganhs] ([MaChuyenNganh]),
        CONSTRAINT [FK_NhanViens_HopDongs_MaHopDong] FOREIGN KEY ([MaHopDong]) REFERENCES [HopDongs] ([MaHopDong]),
        CONSTRAINT [FK_NhanViens_PhongBans_MaPhongBan] FOREIGN KEY ([MaPhongBan]) REFERENCES [PhongBans] ([MaPhongBan]),
        CONSTRAINT [FK_NhanViens_TrinhDoHocVans_MaTrinhDoHocVan] FOREIGN KEY ([MaTrinhDoHocVan]) REFERENCES [TrinhDoHocVans] ([MaTrinhDoHocVan])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NhanViens_MaChucVuNV] ON [NhanViens] ([MaChucVuNV]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NhanViens_MaChuyenNganh] ON [NhanViens] ([MaChuyenNganh]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NhanViens_MaHopDong] ON [NhanViens] ([MaHopDong]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NhanViens_MaPhongBan] ON [NhanViens] ([MaPhongBan]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NhanViens_MaTrinhDoHocVan] ON [NhanViens] ([MaTrinhDoHocVan]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818025721_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250818025721_InitialCreate', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] DROP CONSTRAINT [FK_NhanViens_HopDongs_MaHopDong];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    DROP INDEX [IX_NhanViens_MaHopDong] ON [NhanViens];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[NhanViens]') AND [c].[name] = N'MaHopDong');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [NhanViens] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [NhanViens] DROP COLUMN [MaHopDong];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [DiaChiTamTru] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [DiaChiThuongTru] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [Email] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [LoaiNhanVien] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NgayCapCCCD] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NoiCapCCCD] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SoTaiKhoanNH] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [TenNganHang] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [TinhTrangHonNhan] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [MaNhanVien] nvarchar(450) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    CREATE INDEX [IX_HopDongs_MaNhanVien] ON [HopDongs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    ALTER TABLE [HopDongs] ADD CONSTRAINT [FK_HopDongs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031237_TenMigrationMoi'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250818031237_TenMigrationMoi', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250818031537_MigrationMoi'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250818031537_MigrationMoi', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250827040319_AddChamCongTable'
)
BEGIN
    CREATE TABLE [ChamCongs] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(max) NOT NULL,
        [NgayChamCong] datetime2 NOT NULL,
        [TrangThai] nvarchar(max) NOT NULL,
        [GioVao] time NULL,
        [GioRa] time NULL,
        [GhiChu] nvarchar(max) NULL,
        CONSTRAINT [PK_ChamCongs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250827040319_AddChamCongTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250827040319_AddChamCongTable', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905085225_AddResetCodeToNhanVien'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [ResetCode] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905085225_AddResetCodeToNhanVien'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [ResetCodeExpiry] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905085225_AddResetCodeToNhanVien'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250905085225_AddResetCodeToNhanVien', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911033230_AddUserRoleTableAndRelationship'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [RoleId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911033230_AddUserRoleTableAndRelationship'
)
BEGIN
    CREATE TABLE [UserRoles] (
        [RoleId] int NOT NULL IDENTITY,
        [NameRole] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([RoleId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911033230_AddUserRoleTableAndRelationship'
)
BEGIN
    CREATE INDEX [IX_NhanViens_RoleId] ON [NhanViens] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911033230_AddUserRoleTableAndRelationship'
)
BEGIN
    ALTER TABLE [NhanViens] ADD CONSTRAINT [FK_NhanViens_UserRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [UserRoles] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911033230_AddUserRoleTableAndRelationship'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250911033230_AddUserRoleTableAndRelationship', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250917093133_AddTrangThaiToPhongBan'
)
BEGIN
    ALTER TABLE [PhongBans] ADD [TrangThai] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250917093133_AddTrangThaiToPhongBan'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250917093133_AddTrangThaiToPhongBan', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918092436_UpdateChamCongModel'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ChamCongs]') AND [c].[name] = N'GioRa');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [ChamCongs] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [ChamCongs] DROP COLUMN [GioRa];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918092436_UpdateChamCongModel'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ChamCongs]') AND [c].[name] = N'GioVao');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [ChamCongs] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [ChamCongs] DROP COLUMN [GioVao];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918092436_UpdateChamCongModel'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ChamCongs]') AND [c].[name] = N'TrangThai');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [ChamCongs] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [ChamCongs] DROP COLUMN [TrangThai];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918092436_UpdateChamCongModel'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [NgayCong] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918092436_UpdateChamCongModel'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250918092436_UpdateChamCongModel', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006152954_ThemBangDonNghiPhep'
)
BEGIN
    CREATE TABLE [DonNghiPheps] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(max) NOT NULL,
        [NgayNghi] datetime2 NOT NULL,
        [LyDo] nvarchar(max) NULL,
        [TrangThai] nvarchar(max) NULL,
        [NgayGui] datetime2 NOT NULL,
        [NhanVienMaNhanVien] nvarchar(450) NULL,
        CONSTRAINT [PK_DonNghiPheps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DonNghiPheps_NhanViens_NhanVienMaNhanVien] FOREIGN KEY ([NhanVienMaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006152954_ThemBangDonNghiPhep'
)
BEGIN
    CREATE INDEX [IX_DonNghiPheps_NhanVienMaNhanVien] ON [DonNghiPheps] ([NhanVienMaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006152954_ThemBangDonNghiPhep'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251006152954_ThemBangDonNghiPhep', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    ALTER TABLE [DonNghiPheps] DROP CONSTRAINT [FK_DonNghiPheps_NhanViens_NhanVienMaNhanVien];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    DROP INDEX [IX_DonNghiPheps_NhanVienMaNhanVien] ON [DonNghiPheps];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DonNghiPheps]') AND [c].[name] = N'NhanVienMaNhanVien');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [DonNghiPheps] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [DonNghiPheps] DROP COLUMN [NhanVienMaNhanVien];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    EXEC sp_rename N'[DonNghiPheps].[NgayGui]', N'NgayGuiDon', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DonNghiPheps]') AND [c].[name] = N'TrangThai');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [DonNghiPheps] DROP CONSTRAINT [' + @var5 + '];');
    EXEC(N'UPDATE [DonNghiPheps] SET [TrangThai] = N'''' WHERE [TrangThai] IS NULL');
    ALTER TABLE [DonNghiPheps] ALTER COLUMN [TrangThai] nvarchar(max) NOT NULL;
    ALTER TABLE [DonNghiPheps] ADD DEFAULT N'' FOR [TrangThai];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DonNghiPheps]') AND [c].[name] = N'MaNhanVien');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [DonNghiPheps] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [DonNghiPheps] ALTER COLUMN [MaNhanVien] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    CREATE INDEX [IX_DonNghiPheps_MaNhanVien] ON [DonNghiPheps] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    ALTER TABLE [DonNghiPheps] ADD CONSTRAINT [FK_DonNghiPheps_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251006161938_SuabangNghiPhep'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251006161938_SuabangNghiPhep', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014114633_BangLuong'
)
BEGIN
    CREATE TABLE [BangLuongs] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(max) NOT NULL,
        [Thang] int NOT NULL,
        [Nam] int NOT NULL,
        [LuongCoBan] decimal(18,2) NOT NULL,
        [TongNgayCong] float NOT NULL,
        [LuongThucNhan] decimal(18,2) NOT NULL,
        [NgayTinhLuong] datetime2 NOT NULL,
        CONSTRAINT [PK_BangLuongs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014114633_BangLuong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251014114633_BangLuong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113071144_AddActiveQRToken'
)
BEGIN
    CREATE TABLE [ActiveQRTokens] (
        [Id] int NOT NULL IDENTITY,
        [Token] nvarchar(max) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL,
        CONSTRAINT [PK_ActiveQRTokens] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113071144_AddActiveQRToken'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251113071144_AddActiveQRToken', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113072335_addchamcong'
)
BEGIN
    DECLARE @var7 sysname;
    SELECT @var7 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ChamCongs]') AND [c].[name] = N'MaNhanVien');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [ChamCongs] DROP CONSTRAINT [' + @var7 + '];');
    ALTER TABLE [ChamCongs] ALTER COLUMN [MaNhanVien] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113072335_addchamcong'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [GioCheckOut] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113072335_addchamcong'
)
BEGIN
    CREATE INDEX [IX_ChamCongs_MaNhanVien] ON [ChamCongs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113072335_addchamcong'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD CONSTRAINT [FK_ChamCongs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251113072335_addchamcong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251113072335_addchamcong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125085102_UpdateDonNghiPhepModel'
)
BEGIN
    EXEC sp_rename N'[DonNghiPheps].[NgayNghi]', N'NgayKetThuc', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125085102_UpdateDonNghiPhepModel'
)
BEGIN
    DECLARE @var8 sysname;
    SELECT @var8 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DonNghiPheps]') AND [c].[name] = N'LyDo');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [DonNghiPheps] DROP CONSTRAINT [' + @var8 + '];');
    EXEC(N'UPDATE [DonNghiPheps] SET [LyDo] = N'''' WHERE [LyDo] IS NULL');
    ALTER TABLE [DonNghiPheps] ALTER COLUMN [LyDo] nvarchar(max) NOT NULL;
    ALTER TABLE [DonNghiPheps] ADD DEFAULT N'' FOR [LyDo];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125085102_UpdateDonNghiPhepModel'
)
BEGIN
    ALTER TABLE [DonNghiPheps] ADD [NgayBatDau] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125085102_UpdateDonNghiPhepModel'
)
BEGIN
    ALTER TABLE [DonNghiPheps] ADD [SoNgayNghi] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125085102_UpdateDonNghiPhepModel'
)
BEGIN
    ALTER TABLE [DonNghiPheps] ADD [TepDinhKem] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125085102_UpdateDonNghiPhepModel'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251125085102_UpdateDonNghiPhepModel', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    DECLARE @var9 sysname;
    SELECT @var9 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'MaNhanVien');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var9 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [MaNhanVien] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    DECLARE @var10 sysname;
    SELECT @var10 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'LuongThucNhan');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var10 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [LuongThucNhan] float NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    DECLARE @var11 sysname;
    SELECT @var11 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'LuongCoBan');
    IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var11 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [LuongCoBan] float NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [DaChot] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [GhiChu] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    CREATE INDEX [IX_BangLuongs_MaNhanVien] ON [BangLuongs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD CONSTRAINT [FK_BangLuongs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202045728_AddBangLuongTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251202045728_AddBangLuongTable', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    ALTER TABLE [BangLuongs] DROP CONSTRAINT [FK_BangLuongs_NhanViens_MaNhanVien];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    DROP INDEX [IX_BangLuongs_MaNhanVien] ON [BangLuongs];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    DECLARE @var12 sysname;
    SELECT @var12 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'DaChot');
    IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var12 + '];');
    ALTER TABLE [BangLuongs] DROP COLUMN [DaChot];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    DECLARE @var13 sysname;
    SELECT @var13 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'GhiChu');
    IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var13 + '];');
    ALTER TABLE [BangLuongs] DROP COLUMN [GhiChu];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    DECLARE @var14 sysname;
    SELECT @var14 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'MaNhanVien');
    IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var14 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [MaNhanVien] nvarchar(max) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    DECLARE @var15 sysname;
    SELECT @var15 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'LuongThucNhan');
    IF @var15 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var15 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [LuongThucNhan] decimal(18,2) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    DECLARE @var16 sysname;
    SELECT @var16 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'LuongCoBan');
    IF @var16 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var16 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [LuongCoBan] decimal(18,2) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202070649_AddBangLuong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251202070649_AddBangLuong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072338_upbangluong'
)
BEGIN
    DECLARE @var17 sysname;
    SELECT @var17 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'MaNhanVien');
    IF @var17 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var17 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [MaNhanVien] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072338_upbangluong'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [DaChot] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072338_upbangluong'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [GhiChu] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072338_upbangluong'
)
BEGIN
    CREATE INDEX [IX_BangLuongs_MaNhanVien] ON [BangLuongs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072338_upbangluong'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD CONSTRAINT [FK_BangLuongs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072338_upbangluong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251202072338_upbangluong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072959_uphopdong'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [LuongCoBan] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072959_uphopdong'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [TrangThai] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202072959_uphopdong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251202072959_uphopdong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202081428_upbangl'
)
BEGIN
    ALTER TABLE [BangLuongs] DROP CONSTRAINT [FK_BangLuongs_NhanViens_MaNhanVien];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202081428_upbangl'
)
BEGIN
    DROP INDEX [IX_BangLuongs_MaNhanVien] ON [BangLuongs];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202081428_upbangl'
)
BEGIN
    DECLARE @var18 sysname;
    SELECT @var18 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'DaChot');
    IF @var18 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var18 + '];');
    ALTER TABLE [BangLuongs] DROP COLUMN [DaChot];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202081428_upbangl'
)
BEGIN
    DECLARE @var19 sysname;
    SELECT @var19 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'GhiChu');
    IF @var19 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var19 + '];');
    ALTER TABLE [BangLuongs] DROP COLUMN [GhiChu];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202081428_upbangl'
)
BEGIN
    DECLARE @var20 sysname;
    SELECT @var20 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'MaNhanVien');
    IF @var20 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var20 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [MaNhanVien] nvarchar(max) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202081428_upbangl'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251202081428_upbangl', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202101128_AddRoleIdToChucVuNhanVien'
)
BEGIN
    ALTER TABLE [ChucVuNhanViens] ADD [RoleId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251202101128_AddRoleIdToChucVuNhanVien'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251202101128_AddRoleIdToChucVuNhanVien', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    DECLARE @var21 sysname;
    SELECT @var21 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'NgayBatDau');
    IF @var21 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var21 + '];');
    ALTER TABLE [HopDongs] DROP COLUMN [NgayBatDau];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    EXEC sp_rename N'[HopDongs].[NgayKetThuc]', N'NgayHetHan', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    EXEC sp_rename N'[BangLuongs].[LuongThucNhan]', N'TongThuNhap', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [TrinhDoHocVans] ADD [MoTa] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    DECLARE @var22 sysname;
    SELECT @var22 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[NhanViens]') AND [c].[name] = N'HoTen');
    IF @var22 IS NOT NULL EXEC(N'ALTER TABLE [NhanViens] DROP CONSTRAINT [' + @var22 + '];');
    EXEC(N'UPDATE [NhanViens] SET [HoTen] = N'''' WHERE [HoTen] IS NULL');
    ALTER TABLE [NhanViens] ALTER COLUMN [HoTen] nvarchar(max) NOT NULL;
    ALTER TABLE [NhanViens] ADD DEFAULT N'' FOR [HoTen];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [ChuyenNganhChiTiet] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [DiaChiKhanCap] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [HeDaoTao] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [MaQuanLyTrucTiep] nvarchar(450) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NgayCapHoChieu] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NgayHetHanCCCD] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NgayHetHanHoChieu] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NgayNghiViec] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NgayVaoLam] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NguoiLienHeKhanCap] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NoiCapHoChieu] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NoiDKKCB] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NoiDaoTao] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [NoiSinh] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [PhuongXaThuongTru] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [QuanHeKhanCap] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [QuanHuyenThuongTru] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [QuocGiaThuongTru] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [QuocTich] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SdtKhanCap] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SoBHXH] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SoBHYT] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SoHoChieu] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [TenTaiKhoanNH] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [TinhThanhThuongTru] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [TonGiao] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [LuongDongBaoHiem] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [NgayHieuLuc] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [NgayKy] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [PhuCapAnTrua] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [PhuCapKhac] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [PhuCapTrachNhiem] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [ThoiHanHopDong] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChucVuNhanViens] ADD [MoTaCongViec] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [DiMuon] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [GioCheckIn] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [LoaiNgayCong] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [SoGioLamViec] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [SoGioOT] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChamCongs] ADD [VeSom] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    DECLARE @var23 sysname;
    SELECT @var23 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BangLuongs]') AND [c].[name] = N'MaNhanVien');
    IF @var23 IS NOT NULL EXEC(N'ALTER TABLE [BangLuongs] DROP CONSTRAINT [' + @var23 + '];');
    ALTER TABLE [BangLuongs] ALTER COLUMN [MaNhanVien] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [DaChot] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [GhiChu] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [KhauTruBHTN] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [KhauTruBHXH] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [KhauTruBHYT] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [KhoanTruKhac] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [LuongChinh] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [LuongDongBaoHiem] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [LuongOT] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [ThucLanh] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [ThueTNCN] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [TongGioOT] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [TongPhuCap] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    CREATE INDEX [IX_NhanViens_MaQuanLyTrucTiep] ON [NhanViens] ([MaQuanLyTrucTiep]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    CREATE INDEX [IX_ChucVuNhanViens_RoleId] ON [ChucVuNhanViens] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    CREATE INDEX [IX_BangLuongs_MaNhanVien] ON [BangLuongs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD CONSTRAINT [FK_BangLuongs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [ChucVuNhanViens] ADD CONSTRAINT [FK_ChucVuNhanViens_UserRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [UserRoles] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    ALTER TABLE [NhanViens] ADD CONSTRAINT [FK_NhanViens_NhanViens_MaQuanLyTrucTiep] FOREIGN KEY ([MaQuanLyTrucTiep]) REFERENCES [NhanViens] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211030459_UpdateFullDatabaseSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251211030459_UpdateFullDatabaseSchema', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211031538_UpdateFullDatabase'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251211031538_UpdateFullDatabase', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212084243_DkyOTCT'
)
BEGIN
    CREATE TABLE [DangKyCongTacs] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(450) NOT NULL,
        [NgayBatDau] datetime2 NOT NULL,
        [NgayKetThuc] datetime2 NOT NULL,
        [NoiCongTac] nvarchar(max) NOT NULL,
        [MucDich] nvarchar(max) NOT NULL,
        [PhuongTien] nvarchar(max) NULL,
        [TrangThai] nvarchar(max) NOT NULL,
        [NgayGuiDon] datetime2 NOT NULL,
        CONSTRAINT [PK_DangKyCongTacs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DangKyCongTacs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212084243_DkyOTCT'
)
BEGIN
    CREATE TABLE [DangKyOTs] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(450) NOT NULL,
        [NgayLamThem] datetime2 NOT NULL,
        [GioBatDau] time NOT NULL,
        [GioKetThuc] time NOT NULL,
        [SoGio] float NOT NULL,
        [LyDo] nvarchar(max) NULL,
        [TrangThai] nvarchar(max) NOT NULL,
        [NgayGuiDon] datetime2 NOT NULL,
        CONSTRAINT [PK_DangKyOTs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DangKyOTs_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212084243_DkyOTCT'
)
BEGIN
    CREATE INDEX [IX_DangKyCongTacs_MaNhanVien] ON [DangKyCongTacs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212084243_DkyOTCT'
)
BEGIN
    CREATE INDEX [IX_DangKyOTs_MaNhanVien] ON [DangKyOTs] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212084243_DkyOTCT'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251212084243_DkyOTCT', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224071717_AddKinhPhiCongTac'
)
BEGIN
    ALTER TABLE [DangKyCongTacs] ADD [KinhPhiDuKien] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224071717_AddKinhPhiCongTac'
)
BEGIN
    ALTER TABLE [DangKyCongTacs] ADD [LyDoTamUng] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224071717_AddKinhPhiCongTac'
)
BEGIN
    ALTER TABLE [DangKyCongTacs] ADD [SoTienTamUng] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224071717_AddKinhPhiCongTac'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251224071717_AddKinhPhiCongTac', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224075831_AddLuongCB'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [LuongCoBan] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224075831_AddLuongCB'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SoHopDong] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224075831_AddLuongCB'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251224075831_AddLuongCB', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224082031_AddLuongVaHopDong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251224082031_AddLuongVaHopDong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224091839_AddLuongTrocap'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [LuongTroCap] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251224091839_AddLuongTrocap'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251224091839_AddLuongTrocap', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251225033123_phucapBL'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251225033123_phucapBL', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    DECLARE @var24 sysname;
    SELECT @var24 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'PhuCapAnTrua');
    IF @var24 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var24 + '];');
    ALTER TABLE [HopDongs] DROP COLUMN [PhuCapAnTrua];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    DECLARE @var25 sysname;
    SELECT @var25 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'PhuCapKhac');
    IF @var25 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var25 + '];');
    ALTER TABLE [HopDongs] DROP COLUMN [PhuCapKhac];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    DECLARE @var26 sysname;
    SELECT @var26 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'PhuCapTrachNhiem');
    IF @var26 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var26 + '];');
    ALTER TABLE [HopDongs] DROP COLUMN [PhuCapTrachNhiem];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    DECLARE @var27 sysname;
    SELECT @var27 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'ThoiHanHopDong');
    IF @var27 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var27 + '];');
    ALTER TABLE [HopDongs] DROP COLUMN [ThoiHanHopDong];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    EXEC sp_rename N'[HopDongs].[NgayHieuLuc]', N'NgayBatDau', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    EXEC sp_rename N'[HopDongs].[NgayHetHan]', N'NgayKetThuc', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    EXEC sp_rename N'[HopDongs].[MaHopDong]', N'SoHopDong', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    DECLARE @var28 sysname;
    SELECT @var28 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'TrangThai');
    IF @var28 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var28 + '];');
    ALTER TABLE [HopDongs] ALTER COLUMN [TrangThai] nvarchar(max) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    DECLARE @var29 sysname;
    SELECT @var29 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[HopDongs]') AND [c].[name] = N'LoaiHopDong');
    IF @var29 IS NOT NULL EXEC(N'ALTER TABLE [HopDongs] DROP CONSTRAINT [' + @var29 + '];');
    EXEC(N'UPDATE [HopDongs] SET [LoaiHopDong] = N'''' WHERE [LoaiHopDong] IS NULL');
    ALTER TABLE [HopDongs] ALTER COLUMN [LoaiHopDong] nvarchar(max) NOT NULL;
    ALTER TABLE [HopDongs] ADD DEFAULT N'' FOR [LoaiHopDong];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    ALTER TABLE [HopDongs] ADD [TepDinhKem] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251226074339_hopdong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251226074339_hopdong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260121041512_Khoacong'
)
BEGIN
    CREATE TABLE [KhoaCongs] (
        [Id] int NOT NULL IDENTITY,
        [Thang] int NOT NULL,
        [Nam] int NOT NULL,
        [IsLocked] bit NOT NULL,
        CONSTRAINT [PK_KhoaCongs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260121041512_Khoacong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260121041512_Khoacong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260123091341_updateNV'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [ChuKy] nvarchar(MAX) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260123091341_updateNV'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260123091341_updateNV', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260203150840_Facedata'
)
BEGIN
    CREATE TABLE [FaceDatas] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(450) NOT NULL,
        [FaceDescriptor] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_FaceDatas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FaceDatas_NhanViens_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NhanViens] ([MaNhanVien]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260203150840_Facedata'
)
BEGIN
    CREATE INDEX [IX_FaceDatas_MaNhanVien] ON [FaceDatas] ([MaNhanVien]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260203150840_Facedata'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260203150840_Facedata', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260305085518_AddColumnChuKy'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260305085518_AddColumnChuKy', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260305091116_CapNhatToanBoDatabase'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260305091116_CapNhatToanBoDatabase', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311023226_AddKhoaCongTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311023226_AddKhoaCongTable', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311024314_AddBangKhoaCong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311024314_AddBangKhoaCong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311024558_AddKhoacong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311024558_AddKhoacong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311025139_AddFaceDataTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311025139_AddFaceDataTable', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311043946_AddRefreshToken'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [RefreshToken] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311043946_AddRefreshToken'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [RefreshTokenExpiryTime] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311043946_AddRefreshToken'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311043946_AddRefreshToken', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260319075300_AddBangThongBao'
)
BEGIN
    CREATE TABLE [ThongBaos] (
        [Id] int NOT NULL IDENTITY,
        [TieuDe] nvarchar(max) NOT NULL,
        [NoiDung] nvarchar(max) NOT NULL,
        [NgayTao] datetime2 NOT NULL,
        [LoaiThongBao] nvarchar(max) NOT NULL,
        [TrangThai] bit NOT NULL,
        CONSTRAINT [PK_ThongBaos] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260319075300_AddBangThongBao'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260319075300_AddBangThongBao', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260324082725_CaiDatHeThong'
)
BEGIN
    CREATE TABLE [SystemSettings] (
        [Id] int NOT NULL IDENTITY,
        [TenCongTy] nvarchar(max) NULL,
        [TenVietTat] nvarchar(max) NULL,
        [MaSoThue] nvarchar(max) NULL,
        [DiaChi] nvarchar(max) NULL,
        [SdtHotline] nvarchar(max) NULL,
        [GioVaoLam] nvarchar(max) NULL,
        [GioTanLam] nvarchar(max) NULL,
        [ThoiGianNghiTrua] nvarchar(max) NULL,
        [SoPhutDiMuonChoPhep] int NOT NULL,
        [NgayPhepTieuChuan] int NOT NULL,
        [MucLuongCoSo] decimal(18,2) NOT NULL,
        [PhanTramBHXHCompany] float NOT NULL,
        [PhanTramBHXHEmployee] float NOT NULL,
        [GiamTruGiaCanh] decimal(18,2) NOT NULL,
        [GiamTruPhuThuoc] decimal(18,2) NOT NULL,
        [SmtpServer] nvarchar(max) NULL,
        [SmtpPort] nvarchar(max) NULL,
        [EmailGuiDi] nvarchar(max) NULL,
        [GuiMailTuDong] bit NOT NULL,
        CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260324082725_CaiDatHeThong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260324082725_CaiDatHeThong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260423082434_UpdateBangLuong'
)
BEGIN
    ALTER TABLE [BangLuongs] ADD [SoCongChuanTrongThang] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260423082434_UpdateBangLuong'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260423082434_UpdateBangLuong', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505055915_Add_NgayLe'
)
BEGIN
    ALTER TABLE [NhanViens] ADD [SoNguoiPhuThuoc] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505055915_Add_NgayLe'
)
BEGIN
    CREATE TABLE [NgayLes] (
        [Id] int NOT NULL IDENTITY,
        [Date] datetime2 NOT NULL,
        [TenNgayLe] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_NgayLes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505055915_Add_NgayLe'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260505055915_Add_NgayLe', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505060359_AddNgayle'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260505060359_AddNgayle', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505085018_Add_SystemOT'
)
BEGIN
    ALTER TABLE [SystemSettings] ADD [HeSoOTCuoiTuan] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505085018_Add_SystemOT'
)
BEGIN
    ALTER TABLE [SystemSettings] ADD [HeSoOTNgayLe] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505085018_Add_SystemOT'
)
BEGIN
    ALTER TABLE [SystemSettings] ADD [HeSoOTNgayThuong] float NOT NULL DEFAULT 0.0E0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260505085018_Add_SystemOT'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260505085018_Add_SystemOT', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260621224503_AddLyDoTuChoi'
)
BEGIN
    ALTER TABLE [DonNghiPheps] ADD [LyDoTuChoi] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260621224503_AddLyDoTuChoi'
)
BEGIN
    ALTER TABLE [DangKyOTs] ADD [LyDoTuChoi] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260621224503_AddLyDoTuChoi'
)
BEGIN
    ALTER TABLE [DangKyCongTacs] ADD [LyDoTuChoi] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260621224503_AddLyDoTuChoi'
)
BEGIN
    CREATE TABLE [ChatMessages] (
        [Id] int NOT NULL IDENTITY,
        [MaNhanVien] nvarchar(max) NOT NULL,
        [Sender] nvarchar(max) NOT NULL,
        [Text] nvarchar(max) NOT NULL,
        [TableDataJson] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260621224503_AddLyDoTuChoi'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260621224503_AddLyDoTuChoi', N'8.0.8');
END;
GO

COMMIT;
GO

