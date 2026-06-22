-- ============================================================
-- Migration: Thêm phụ cấp chi tiết + công chuẩn OT
-- Chạy trên server trước khi deploy Docker
-- Idempotent: có thể chạy nhiều lần không bị lỗi
-- ============================================================

BEGIN TRANSACTION;

-- 1. BangLuongs: thêm TongCongChuanOT
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='BangLuongs' AND COLUMN_NAME='TongCongChuanOT')
BEGIN
    ALTER TABLE BangLuongs ADD TongCongChuanOT decimal(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added TongCongChuanOT to BangLuongs';
END

-- 2. BangLuongs: thêm TienAn
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='BangLuongs' AND COLUMN_NAME='TienAn')
BEGIN
    ALTER TABLE BangLuongs ADD TienAn decimal(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added TienAn to BangLuongs';
END

-- 3. BangLuongs: thêm TienGuiXe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='BangLuongs' AND COLUMN_NAME='TienGuiXe')
BEGIN
    ALTER TABLE BangLuongs ADD TienGuiXe decimal(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added TienGuiXe to BangLuongs';
END

-- 4. BangLuongs: thêm TienChuyenCan
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='BangLuongs' AND COLUMN_NAME='TienChuyenCan')
BEGIN
    ALTER TABLE BangLuongs ADD TienChuyenCan decimal(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added TienChuyenCan to BangLuongs';
END

-- 5. SystemSettings: thêm TienAnMoiNgay
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='TienAnMoiNgay')
BEGIN
    ALTER TABLE SystemSettings ADD TienAnMoiNgay decimal(18,2) NOT NULL DEFAULT 50000;
    PRINT 'Added TienAnMoiNgay to SystemSettings';
END

-- 6. SystemSettings: thêm TienGuiXeThang
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='TienGuiXeThang')
BEGIN
    ALTER TABLE SystemSettings ADD TienGuiXeThang decimal(18,2) NOT NULL DEFAULT 150000;
    PRINT 'Added TienGuiXeThang to SystemSettings';
END

-- 7. SystemSettings: thêm TienChuyenCan
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='TienChuyenCan')
BEGIN
    ALTER TABLE SystemSettings ADD TienChuyenCan decimal(18,2) NOT NULL DEFAULT 500000;
    PRINT 'Added TienChuyenCan to SystemSettings';
END

COMMIT TRANSACTION;
PRINT 'Migration completed successfully.';
