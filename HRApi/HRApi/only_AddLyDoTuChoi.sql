BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622050231_AddLyDoTuChoi'
)
BEGIN
    ALTER TABLE [DonNghiPheps] ADD [LyDoTuChoi] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622050231_AddLyDoTuChoi'
)
BEGIN
    ALTER TABLE [DangKyOTs] ADD [LyDoTuChoi] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622050231_AddLyDoTuChoi'
)
BEGIN
    ALTER TABLE [DangKyCongTacs] ADD [LyDoTuChoi] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622050231_AddLyDoTuChoi'
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
    WHERE [MigrationId] = N'20260622050231_AddLyDoTuChoi'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260622050231_AddLyDoTuChoi', N'8.0.8');
END;
GO

COMMIT;
GO

