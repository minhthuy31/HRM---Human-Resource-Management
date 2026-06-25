-- ============================================================
-- Migration: Giới hạn OT (Điều 107 BLLĐ) + tách lương làm thêm ngày lễ
-- Chạy trên server trước khi deploy Docker
-- Idempotent: có thể chạy nhiều lần không bị lỗi
-- ============================================================

BEGIN TRANSACTION;

-- 1. SystemSettings: giới hạn OT tối đa/ngày
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='GioOTToiDaNgay')
BEGIN
    ALTER TABLE SystemSettings ADD GioOTToiDaNgay float NOT NULL DEFAULT 4;
    PRINT 'Added GioOTToiDaNgay to SystemSettings';
END

-- 2. SystemSettings: giới hạn OT tối đa/tháng
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='GioOTToiDaThang')
BEGIN
    ALTER TABLE SystemSettings ADD GioOTToiDaThang float NOT NULL DEFAULT 40;
    PRINT 'Added GioOTToiDaThang to SystemSettings';
END

-- 3. SystemSettings: giới hạn OT tối đa/năm
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='GioOTToiDaNam')
BEGIN
    ALTER TABLE SystemSettings ADD GioOTToiDaNam float NOT NULL DEFAULT 200;
    PRINT 'Added GioOTToiDaNam to SystemSettings';
END

-- 4. BangLuongs: tiền lương làm thêm ngày lễ (phần 300%)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='BangLuongs' AND COLUMN_NAME='LuongLamThemLe')
BEGIN
    ALTER TABLE BangLuongs ADD LuongLamThemLe decimal(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added LuongLamThemLe to BangLuongs';
END

COMMIT TRANSACTION;
PRINT 'Migration completed successfully.';
