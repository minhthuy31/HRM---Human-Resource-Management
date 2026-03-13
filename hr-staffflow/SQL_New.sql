CREATE DATABASE HRMAPI;

select *from NhanViens
select *from UserRoles
select *from ChucVuNhanViens
select *from PhongBans

-- =======================================================================================
-- SCRIPT TẠO 5 TÀI KHOẢN TEST THEO YÊU CẦU
-- Cập nhật:
-- 1. Password: Đã set cứng là hash của '123456' ($2a$11$...).
-- 2. Mã chức vụ: Map theo bảng ChucVuNhanViens (CV1, CV2, CV3, CV4).
-- =======================================================================================

-- 1. GIÁM ĐỐC (Admin cao nhất)
-- Phòng: GD (Ban Giám Đốc), RoleId: 4, ChucVu: CV4
INSERT INTO NhanViens (
    MaNhanVien, MatKhau, HoTen, Email, RoleId, MaPhongBan, MaChucVuNV, 
    TrangThai, GioiTinh, NgaySinh, sdt_NhanVien, CCCD
)
VALUES (
    'GD001', 
    '$2a$11$Dv9.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6', -- Hash của '123456'
    N'Nguyễn Văn Giám Đốc', 
    'giamdoc@company.com', 
    4,      -- Role Giám đốc
    'GD',   -- Ban Giám Đốc
    'CV4',  -- Mã chức vụ Giám đốc (Theo hình ảnh)
    1, 1, '1980-01-01', '0901000001', '001080000001'
);
-- Hợp đồng Giám đốc
INSERT INTO HopDongs (
    MaHopDong, MaNhanVien, LoaiHopDong, NgayKy, NgayHieuLuc, 
    LuongCoBan, LuongDongBaoHiem, TrangThai
) VALUES ('HD-GD001', 'GD001', N'Không xác định thời hạn', '2020-01-01', '2020-01-01', 50000000, 30000000, 1);


-- 2. KẾ TOÁN TRƯỞNG
-- Phòng: PKT (Phòng Kế Toán), RoleId: 3, ChucVu: CV3
INSERT INTO NhanViens (
    MaNhanVien, MatKhau, HoTen, Email, RoleId, MaPhongBan, MaChucVuNV, 
    TrangThai, GioiTinh, NgaySinh, sdt_NhanVien, CCCD
)
VALUES (
    'KTT001', 
    '$2a$11$Dv9.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6', -- Hash của '123456'
    N'Trần Thị Kế Toán', 
    'ketoan@company.com', 
    3,      -- Role Kế toán trưởng
    'PKT',  -- Phòng Kế toán
    'CV3',  -- Mã chức vụ Kế toán trưởng
    1, 0, '1985-05-15', '0902000002', '001085000002'
);
-- Hợp đồng Kế toán trưởng
INSERT INTO HopDongs (
    MaHopDong, MaNhanVien, LoaiHopDong, NgayKy, NgayHieuLuc, 
    LuongCoBan, LuongDongBaoHiem, TrangThai
) VALUES ('HD-KTT001', 'KTT001', N'Hợp đồng 3 năm', '2021-06-01', '2021-06-01', 25000000, 15000000, 1);


-- 3. TRƯỞNG PHÒNG NHÂN SỰ
-- Phòng: NS (Phòng Nhân Sự), RoleId: 2, ChucVu: CV2
INSERT INTO NhanViens (
    MaNhanVien, MatKhau, HoTen, Email, RoleId, MaPhongBan, MaChucVuNV, 
    TrangThai, GioiTinh, NgaySinh, sdt_NhanVien, CCCD
)
VALUES (
    'TPNS001', 
    '$2a$11$Dv9.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6', -- Hash của '123456'
    N'Lê Văn Trưởng Phòng', 
    'hr_manager@company.com', 
    2,      -- Role Trưởng phòng
    'NS',   -- Phòng Nhân sự
    'CV2',  -- Mã chức vụ Trưởng phòng
    1, 1, '1990-10-20', '0903000003', '001090000003'
);
-- Hợp đồng Trưởng phòng NS
INSERT INTO HopDongs (
    MaHopDong, MaNhanVien, LoaiHopDong, NgayKy, NgayHieuLuc, 
    LuongCoBan, LuongDongBaoHiem, TrangThai
) VALUES ('HD-TPNS001', 'TPNS001', N'Hợp đồng 2 năm', '2022-01-01', '2022-01-01', 20000000, 10000000, 1);


-- 4. NHÂN VIÊN LẬP TRÌNH (DEV)
-- Phòng: LT (Phòng Lập Trình), RoleId: 1, ChucVu: CV1
INSERT INTO NhanViens (
    MaNhanVien, MatKhau, HoTen, Email, RoleId, MaPhongBan, MaChucVuNV, 
    TrangThai, GioiTinh, NgaySinh, sdt_NhanVien, CCCD
)
VALUES (
    'NVLT001', 
    '$2a$11$Dv9.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6', -- Hash của '123456'
    N'Phạm Văn Coder', 
    'dev@company.com', 
    1,      -- Role Nhân viên
    'LT',   -- Phòng Lập trình
    'CV1',  -- Mã chức vụ Nhân viên
    1, 1, '1995-12-12', '0904000004', '001095000004'
);
-- Hợp đồng Dev
INSERT INTO HopDongs (
    MaHopDong, MaNhanVien, LoaiHopDong, NgayKy, NgayHieuLuc, 
    LuongCoBan, LuongDongBaoHiem, TrangThai
) VALUES ('HD-NVLT001', 'NVLT001', N'Hợp đồng 1 năm', '2023-01-01', '2023-01-01', 15000000, 8000000, 1);


-- 5. NHÂN VIÊN KINH DOANH (SALE)
-- Phòng: KDMK (Kinh doanh - Marketing), RoleId: 1, ChucVu: CV1
INSERT INTO NhanViens (
    MaNhanVien, MatKhau, HoTen, Email, RoleId, MaPhongBan, MaChucVuNV, 
    TrangThai, GioiTinh, NgaySinh, sdt_NhanVien, CCCD
)
VALUES (
    'NVKD001', 
    '$2a$11$Dv9.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6', -- Hash của '123456'
    N'Hoàng Thị Sale', 
    'sale@company.com', 
    1,      -- Role Nhân viên
    'KDMK', -- Phòng Kinh doanh
    'CV1',  -- Mã chức vụ Nhân viên
    1, 0, '1998-08-08', '0905000005', '001098000005'
);
-- Hợp đồng Sale
INSERT INTO HopDongs (
    MaHopDong, MaNhanVien, LoaiHopDong, NgayKy, NgayHieuLuc, 
    LuongCoBan, LuongDongBaoHiem, TrangThai
) VALUES ('HD-NVKD001', 'NVKD001', N'Hợp đồng 1 năm', '2023-03-01', '2023-03-01', 12000000, 6000000, 1);