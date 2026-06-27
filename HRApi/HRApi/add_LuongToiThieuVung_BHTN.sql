-- ============================================================
-- Migration: Thêm Lương tối thiểu vùng I (trần BHTN = 20×)
-- NĐ 293/2025/NĐ-CP (HL 01/01/2026): vùng I = 5.310.000 đ
-- Chạy trên server trước khi deploy Docker
-- Idempotent: có thể chạy nhiều lần không bị lỗi
-- ============================================================

BEGIN TRANSACTION;

-- 1. Thêm cột LuongToiThieuVung vào SystemSettings (mặc định 5.310.000)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='SystemSettings' AND COLUMN_NAME='LuongToiThieuVung')
BEGIN
    ALTER TABLE SystemSettings ADD LuongToiThieuVung decimal(18,2) NOT NULL DEFAULT 5310000;
    PRINT 'Added LuongToiThieuVung to SystemSettings';
END

-- 2. Cập nhật giá trị cho bản ghi cấu hình hiện có nếu đang để 0 (dữ liệu cũ)
--    Dùng dynamic SQL (EXEC) để tên cột chỉ phân giải lúc CHẠY (sau khi ALTER ở trên đã thêm cột),
--    tránh lỗi "Invalid column name" do SQL Server biên dịch cả batch trước khi thực thi.
EXEC('UPDATE SystemSettings SET LuongToiThieuVung = 5310000 WHERE LuongToiThieuVung = 0;');

COMMIT TRANSACTION;
PRINT 'Migration completed successfully.';
