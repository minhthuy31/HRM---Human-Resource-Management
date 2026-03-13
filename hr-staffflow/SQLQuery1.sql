CREATE DATABASE HRApi;
GO
USE HRApi;
GO
drop table PhongBans
-- Bảng phòng ban
CREATE TABLE PhongBans (
    MaPhongBan VARCHAR(30) PRIMARY KEY,
    TenPhongBan NVARCHAR(50) NOT NULL,
    DiaChi NVARCHAR(50),
    sdt_PhongBan VARCHAR(11)
);

-- Bảng chức vụ
CREATE TABLE ChucVuNhanViens (
    MaChucVuNV VARCHAR(30) PRIMARY KEY,
    TenChucVu NVARCHAR(50) NOT NULL,
    HSPC FLOAT
);

-- Bảng chuyên ngành
CREATE TABLE ChuyenNganhs (
    MaChuyenNganh VARCHAR(30) PRIMARY KEY,
    TenChuyenNganh NVARCHAR(50)
);

-- Bảng trình độ học vấn
CREATE TABLE TrinhDoHocVans (
    MaTrinhDoHocVan VARCHAR(30) PRIMARY KEY,
    TenTrinhDo NVARCHAR(MAX) NOT NULL,
    HeSoBac FLOAT
);

-- Bảng Nhân viên
CREATE TABLE NhanViens (
    MaNhanVien VARCHAR(30) PRIMARY KEY,
    MatKhau NVARCHAR(100) NOT NULL,
    HoTen NVARCHAR(50) NOT NULL,
    NgaySinh DATE,
    GioiTinh INT,
    DanToc NVARCHAR(20),
    TinhTrangHonNhan NVARCHAR(30),
    QueQuan NVARCHAR(100),
    DiaChiThuongTru NVARCHAR(200),
    DiaChiTamTru NVARCHAR(200),
    HinhAnh NVARCHAR(MAX),

    -- Liên hệ
    sdt_NhanVien VARCHAR(15),
    Email NVARCHAR(100),

    -- Giấy tờ
    CCCD VARCHAR(50),
    NgayCapCCCD DATE,
    NoiCapCCCD NVARCHAR(100),

    -- Công việc
    MaChucVuNV VARCHAR(30),
    MaPhongBan VARCHAR(30),
    MaChuyenNganh VARCHAR(30),
    MaTrinhDoHocVan VARCHAR(30),
    LoaiNhanVien NVARCHAR(50),
    TrangThai BIT NOT NULL,

    -- Tài chính
    SoTaiKhoanNH NVARCHAR(50),
    TenNganHang NVARCHAR(100),

    FOREIGN KEY (MaPhongBan) REFERENCES PhongBans(MaPhongBan),
    FOREIGN KEY (MaChucVuNV) REFERENCES ChucVuNhanViens(MaChucVuNV),
    FOREIGN KEY (MaChuyenNganh) REFERENCES ChuyenNganhs(MaChuyenNganh),
    FOREIGN KEY (MaTrinhDoHocVan) REFERENCES TrinhDoHocVans(MaTrinhDoHocVan)
);

-- Bảng Hợp đồng
CREATE TABLE HopDongs (
    MaHopDong VARCHAR(30) PRIMARY KEY,
    MaNhanVien VARCHAR(30) NOT NULL,
    LoaiHopDong NVARCHAR(50),
    NgayBatDau DATETIME,
    NgayKetThuc DATETIME,
    GhiChu NVARCHAR(MAX),
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien)
);

select *from NhanViens

-- Bảng lương cơ bản
CREATE TABLE Luongs (
    MaNhanVien VARCHAR(30) PRIMARY KEY,
    LuongToiThieu INT NOT NULL,
    HeSoLuong FLOAT,
    BHXH FLOAT,
    BHYT FLOAT,
    BHTN FLOAT,
    PhuCap FLOAT,
    ThueThuNhap FLOAT,
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien)
);

-- Bảng chi tiết lương
CREATE TABLE ChiTietLuongs (
    MaChiTietBangLuong VARCHAR(30),
    MaNhanVien VARCHAR(30),
    LuongCoBan FLOAT NOT NULL,
    BHXH FLOAT,
    BHYT FLOAT,
    BHTN FLOAT,
    PhuCap FLOAT,
    ThueThuNhap FLOAT,
    TienThuong INT,
    TienPhat INT,
    NgayNhanLuong DATETIME NOT NULL,
    TongTienLuong VARCHAR(30),
    PRIMARY KEY (MaChiTietBangLuong, MaNhanVien),
    FOREIGN KEY (MaNhanVien) REFERENCES Luongs(MaNhanVien)
);

-- Bảng cập nhật lương
CREATE TABLE CapNhatLuongs (
    id INT IDENTITY PRIMARY KEY,
    MaNhanVien VARCHAR(30) NOT NULL,
    LuongHienTai INT NOT NULL,
    LuongSauCapNhat INT NOT NULL,
    BHXH FLOAT,
    BHYT FLOAT,
    BHTN FLOAT,
    PhuCap FLOAT,
    ThueThuNhap FLOAT,
    NgayCapNhat DATETIME,
    HeSoLuong FLOAT,
    FOREIGN KEY (MaNhanVien) REFERENCES Luongs(MaNhanVien)
);

-- Bảng khen thưởng
CREATE TABLE KhenThuongs (
    MaKhenThuong VARCHAR(30) PRIMARY KEY,
    MaNhanVien VARCHAR(30),
    ThangThuong DATETIME NOT NULL,
    LyDo NVARCHAR(MAX),
    TienThuong INT,
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien)
);

-- Bảng kỷ luật
CREATE TABLE KyLuats (
    MaKyLuat VARCHAR(30) PRIMARY KEY,
    MaNhanVien VARCHAR(30),
    ThangKiLuat DATETIME NOT NULL,
    LyDo NVARCHAR(MAX),
    TienKyLuat INT,
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien)
);

-- Bảng luân chuyển nhân viên
CREATE TABLE LuanChuyenNhanViens (
    id INT IDENTITY PRIMARY KEY,
    MaNhanVien VARCHAR(30),
    NgayChuyen DATETIME NOT NULL,
    LyDoChuyen NVARCHAR(MAX),
    PhongBanChuyen VARCHAR(30),
    PhongBanDen VARCHAR(30),
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien),
    FOREIGN KEY (PhongBanChuyen) REFERENCES PhongBans(MaPhongBan),
    FOREIGN KEY (PhongBanDen) REFERENCES PhongBans(MaPhongBan)
);
-- Bảng thôi việc
CREATE TABLE ThoiViecs (
    MaThoiViec VARCHAR(30) PRIMARY KEY,
    MaNhanVien VARCHAR(30),
    LyDo NVARCHAR(MAX),
    NgayThoiViec DATETIME NOT NULL,
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien)
);

DELETE FROM ChiTietLuongs;
DELETE FROM CapNhatLuongs;
DELETE FROM KhenThuongs;
DELETE FROM KyLuats;
DELETE FROM LuanChuyenNhanViens;
DELETE FROM ThoiViecs;
DELETE FROM Luongs;
DELETE FROM HopDongs;
DELETE FROM NhanViens;
DELETE FROM PhongBans;
DELETE FROM ChucVuNhanViens;
DELETE FROM ChuyenNganhs;
DELETE FROM TrinhDoHocVans;



-- Dữ liệu bảng PhongBans
INSERT INTO PhongBans (MaPhongBan, TenPhongBan, DiaChi, sdt_PhongBan) VALUES
('PB01', N'Phòng Nhân sự', N'Tầng 3 - Tòa A', '0241111111'),
('PB02', N'Phòng Kế toán', N'Tầng 2 - Tòa A', '0242222222'),
('PB03', N'Phòng IT', N'Tầng 4 - Tòa B', '0243333333'),
('PB04', N'Phòng Kinh doanh', N'Tầng 5 - Tòa B', '0244444444'),
('PB05', N'Phòng Marketing', N'Tầng 6 - Tòa B', '0245555555');

-- Dữ liệu bảng ChucVuNhanViens
INSERT INTO ChucVuNhanViens (MaChucVuNV, TenChucVu, HSPC) VALUES
('CV01', N'Nhân viên', 1.0),
('CV02', N'Trưởng phòng', 1.5),
('CV03', N'Phó phòng', 1.3),
('CV04', N'Chuyên viên', 1.2),
('CV05', N'Thực tập sinh', 0.8);

-- Dữ liệu bảng ChuyenNganhs
INSERT INTO ChuyenNganhs (MaChuyenNganh, TenChuyenNganh) VALUES
('CN01', N'Công nghệ thông tin'),
('CN02', N'Kế toán'),
('CN03', N'Quản trị kinh doanh'),
('CN04', N'Marketing'),
('CN05', N'Nhân sự');

-- Dữ liệu bảng TrinhDoHocVans
INSERT INTO TrinhDoHocVans (MaTrinhDoHocVan, TenTrinhDo, HeSoBac) VALUES
('TD01', N'Cử nhân', 1.0),
('TD02', N'Thạc sĩ', 1.2),
('TD03', N'Tiến sĩ', 1.5),
('TD04', N'Cao đẳng', 0.9),
('TD05', N'Trung cấp', 0.8);

-- Dữ liệu bảng NhanViens (Đã thêm 10 bản ghi chi tiết)
INSERT INTO NhanViens (MaNhanVien, MatKhau, HoTen, NgaySinh, GioiTinh, DanToc, TinhTrangHonNhan, QueQuan, DiaChiThuongTru, DiaChiTamTru, HinhAnh, sdt_NhanVien, Email, CCCD, NgayCapCCCD, NoiCapCCCD, MaChucVuNV, MaPhongBan, MaChuyenNganh, MaTrinhDoHocVan, LoaiNhanVien, TrangThai, SoTaiKhoanNH, TenNganHang) VALUES
('NV01', N'123456', N'Nguyễn Văn A', '1990-05-12', 1, N'Kinh', N'Đã kết hôn', N'Hà Nội', N'Số 1, đường ABC, Hà Nội', N'Số 1, đường ABC, Hà Nội', NULL, '0911111111', N'nguyenvana@example.com', '012345678901', '2015-01-01', N'Công an TP Hà Nội', 'CV02', 'PB01', 'CN05', 'TD02', N'Chính thức', 1, N'123456789', N'Vietcombank'),
('NV02', N'123456', N'Trần Thị B', '1992-08-20', 0, N'Kinh', N'Độc thân', N'Hải Phòng', N'Số 2, đường XYZ, Hải Phòng', N'Số 2, đường XYZ, Hải Phòng', NULL, '0922222222', N'tranb@example.com', '012345678902', '2016-02-02', N'Công an TP Hải Phòng', 'CV02', 'PB02', 'CN02', 'TD02', N'Chính thức', 1, N'987654321', N'Agribank'),
('NV03', N'123456', N'Lê Văn C', '1995-12-05', 1, N'Kinh', N'Độc thân', N'Đà Nẵng', N'Số 3, đường ABC, Đà Nẵng', N'Số 3, đường ABC, Đà Nẵng', NULL, '0933333333', N'lec@example.com', '012345678903', '2017-03-03', N'Công an TP Đà Nẵng', 'CV01', 'PB03', 'CN01', 'TD01', N'Chính thức', 1, N'1122334455', N'Techcombank'),
('NV04', N'123456', N'Phạm Thị D', '1998-07-18', 0, N'Kinh', N'Độc thân', N'Hà Nam', N'Số 4, đường XYZ, Hà Nam', N'Số 4, đường XYZ, Hà Nam', NULL, '0944444444', N'phamd@example.com', '012345678904', '2018-04-04', N'Công an tỉnh Hà Nam', 'CV04', 'PB04', 'CN03', 'TD04', N'Thử việc', 1, N'5566778899', N'BIDV'),
('NV05', N'123456', N'Hoàng Văn E', '2000-09-25', 1, N'Kinh', N'Độc thân', N'Hà Nội', N'Số 5, đường ABC, Hà Nội', N'Số 5, đường ABC, Hà Nội', NULL, '0955555555', N'hoange@example.com', '012345678905', '2019-05-05', N'Công an TP Hà Nội', 'CV05', 'PB05', 'CN04', 'TD05', N'Thực tập', 1, N'0011223344', N'VPBank'),
('NV06', N'123456', N'Đinh Tuấn F', '1988-10-10', 1, N'Kinh', N'Đã kết hôn', N'TP Hồ Chí Minh', N'Số 6, đường A, TP HCM', N'Số 6, đường A, TP HCM', NULL, '0966666666', N'dinhf@example.com', '012345678906', '2014-06-06', N'Công an TP HCM', 'CV03', 'PB01', 'CN03', 'TD02', N'Chính thức', 1, N'3344556677', N'Techcombank'),
('NV07', N'123456', N'Ngô Thị G', '1993-02-28', 0, N'Kinh', N'Đã kết hôn', N'Cần Thơ', N'Số 7, đường B, Cần Thơ', N'Số 7, đường B, Cần Thơ', NULL, '0977777777', N'ngog@example.com', '012345678907', '2015-07-07', N'Công an TP Cần Thơ', 'CV01', 'PB02', 'CN02', 'TD01', N'Chính thức', 1, N'8899001122', N'VietinBank'),
('NV08', N'123456', N'Trương Minh H', '1996-04-01', 1, N'Kinh', N'Độc thân', N'Hà Giang', N'Số 8, đường C, Hà Giang', N'Số 8, đường C, Hà Giang', NULL, '0988888888', N'truongh@example.com', '012345678908', '2018-08-08', N'Công an tỉnh Hà Giang', 'CV01', 'PB03', 'CN01', 'TD01', N'Chính thức', 1, N'4455667788', N'Agribank'),
('NV09', N'123456', N'Vũ Thị I', '1999-11-15', 0, N'Kinh', N'Độc thân', N'Nghệ An', N'Số 9, đường D, Nghệ An', N'Số 9, đường D, Nghệ An', NULL, '0999999999', N'vui@example.com', '012345678909', '2020-09-09', N'Công an tỉnh Nghệ An', 'CV04', 'PB04', 'CN03', 'TD04', N'Thử việc', 1, N'2233445566', N'BIDV'),
('NV10', N'123456', N'Phan Đình K', '1991-03-22', 1, N'Kinh', N'Đã kết hôn', N'Huế', N'Số 10, đường E, Huế', N'Số 10, đường E, Huế', NULL, '0900000000', N'phank@example.com', '012345678910', '2013-10-10', N'Công an TP Huế', 'CV03', 'PB05', 'CN04', 'TD03', N'Chính thức', 1, N'7788990011', N'Vietcombank');

-- Dữ liệu bảng HopDongs
INSERT INTO HopDongs (MaHopDong, MaNhanVien, LoaiHopDong, NgayBatDau, NgayKetThuc, GhiChu) VALUES
('HD01', 'NV01', N'Hợp đồng 1 năm', '2024-01-01', '2024-12-31', N'Hợp đồng thử việc 1 năm'),
('HD02', 'NV02', N'Hợp đồng 3 năm', '2023-06-01', '2026-06-01', N'Hợp đồng dài hạn'),
('HD03', 'NV03', N'Hợp đồng không thời hạn', '2022-03-15', NULL, N'Làm việc lâu dài'),
('HD04', 'NV04', N'Hợp đồng thời vụ', '2024-09-01', '2025-01-31', N'Dự án mùa cao điểm'),
('HD05', 'NV05', N'Hợp đồng bán thời gian', '2024-05-01', '2025-05-01', N'Làm việc bán thời gian'),
('HD06', 'NV06', N'Hợp đồng 1 năm', '2024-03-01', '2025-02-28', N'Hợp đồng thử việc 1 năm'),
('HD07', 'NV07', N'Hợp đồng 3 năm', '2023-08-01', '2026-08-01', N'Hợp đồng dài hạn'),
('HD08', 'NV08', N'Hợp đồng không thời hạn', '2022-09-01', NULL, N'Làm việc lâu dài'),
('HD09', 'NV09', N'Hợp đồng thời vụ', '2024-10-01', '2025-03-31', N'Dự án mùa cao điểm'),
('HD10', 'NV10', N'Hợp đồng 3 năm', '2023-04-15', '2026-04-15', N'Hợp đồng dài hạn');

-- Dữ liệu bảng Luongs
INSERT INTO Luongs (MaNhanVien, LuongToiThieu, HeSoLuong, BHXH, BHYT, BHTN, PhuCap, ThueThuNhap) VALUES
('NV01', 5000000, 2.0, 8.0, 1.5, 1.0, 500000, 0.05),
('NV02', 7000000, 2.5, 8.0, 1.5, 1.0, 700000, 0.05),
('NV03', 9000000, 3.0, 8.0, 1.5, 1.0, 1000000, 0.10),
('NV04', 4500000, 1.8, 8.0, 1.5, 1.0, 400000, 0.05),
('NV05', 4000000, 1.5, 8.0, 1.5, 1.0, 300000, 0.03),
('NV06', 8000000, 2.8, 8.0, 1.5, 1.0, 800000, 0.08),
('NV07', 5500000, 2.1, 8.0, 1.5, 1.0, 550000, 0.05),
('NV08', 6500000, 2.4, 8.0, 1.5, 1.0, 650000, 0.05),
('NV09', 4200000, 1.6, 8.0, 1.5, 1.0, 350000, 0.03),
('NV10', 7500000, 2.6, 8.0, 1.5, 1.0, 750000, 0.08);

-- Dữ liệu bảng ChiTietLuongs
INSERT INTO ChiTietLuongs (MaChiTietBangLuong, MaNhanVien, LuongCoBan, BHXH, BHYT, BHTN, PhuCap, ThueThuNhap, TienThuong, TienPhat, NgayNhanLuong, TongTienLuong) VALUES
('BL01', 'NV01', 10000000, 8.0, 1.5, 1.0, 500000, 0.05, 200000, 0, '2025-01-31', '10700000'),
('BL02', 'NV02', 15000000, 8.0, 1.5, 1.0, 700000, 0.05, 300000, 50000, '2025-01-31', '15200000'),
('BL03', 'NV03', 20000000, 8.0, 1.5, 1.0, 1000000, 0.10, 500000, 100000, '2025-01-31', '20500000'),
('BL04', 'NV04', 9000000, 8.0, 1.5, 1.0, 400000, 0.05, 150000, 0, '2025-01-31', '9150000'),
('BL05', 'NV05', 8000000, 8.0, 1.5, 1.0, 300000, 0.03, 100000, 0, '2025-01-31', '8100000'),
('BL06', 'NV06', 16000000, 8.0, 1.5, 1.0, 800000, 0.08, 400000, 0, '2025-01-31', '17000000'),
('BL07', 'NV07', 11000000, 8.0, 1.5, 1.0, 550000, 0.05, 250000, 0, '2025-01-31', '11800000'),
('BL08', 'NV08', 13000000, 8.0, 1.5, 1.0, 650000, 0.05, 300000, 0, '2025-01-31', '14000000'),
('BL09', 'NV09', 8500000, 8.0, 1.5, 1.0, 350000, 0.03, 120000, 0, '2025-01-31', '9000000'),
('BL10', 'NV10', 14000000, 8.0, 1.5, 1.0, 750000, 0.08, 350000, 0, '2025-01-31', '15000000');

-- Dữ liệu bảng CapNhatLuongs (Đã sửa lỗi)
INSERT INTO CapNhatLuongs (MaNhanVien, LuongHienTai, LuongSauCapNhat, BHXH, BHYT, BHTN, PhuCap, ThueThuNhap, NgayCapNhat, HeSoLuong) VALUES
('NV01', 10000000, 12000000, 8.0, 1.5, 1.0, 500000, 0.05, '2025-02-01', 2.2),
('NV02', 15000000, 17000000, 8.0, 1.5, 1.0, 700000, 0.05, '2025-02-01', 2.7),
('NV03', 20000000, 22000000, 8.0, 1.5, 1.0, 1000000, 0.10, '2025-02-01', 3.2),
('NV04', 9000000, 10000000, 8.0, 1.5, 1.0, 400000, 0.05, '2025-02-01', 2.0),
('NV05', 8000000, 9000000, 8.0, 1.5, 1.0, 300000, 0.03, '2025-02-01', 1.7);

-- Dữ liệu bảng KhenThuongs (Đã sửa lỗi)
INSERT INTO KhenThuongs (MaKhenThuong, MaNhanVien, ThangThuong, LyDo, TienThuong) VALUES
('KT01', 'NV01', '2025-01-01', N'Hoàn thành xuất sắc dự án A', 2000000),
('KT02', 'NV02', '2025-01-15', N'Đạt doanh số cao', 1500000),
('KT03', 'NV03', '2025-02-01', N'Ý tưởng cải tiến quy trình', 1000000),
('KT04', 'NV04', '2025-02-05', N'Đóng góp tích cực trong dự án B', 800000),
('KT05', 'NV05', '2025-02-10', N'Được khách hàng khen ngợi', 500000);

-- Dữ liệu bảng KyLuats (Đã sửa lỗi)
INSERT INTO KyLuats (MaKyLuat, MaNhanVien, ThangKiLuat, LyDo, TienKyLuat) VALUES
('KL01', 'NV01', '2025-01-20', N'Đi làm muộn nhiều lần', 200000),
('KL02', 'NV02', '2025-01-22', N'Nghỉ không phép', 300000),
('KL03', 'NV03', '2025-02-02', N'Vi phạm nội quy bảo mật', 500000),
('KL04', 'NV04', '2025-02-07', N'Làm hỏng thiết bị công ty', 1000000),
('KL05', 'NV05', '2025-02-12', N'Tự ý rời vị trí làm việc', 150000);

-- Dữ liệu bảng LuanChuyenNhanViens (Đã sửa lỗi)
INSERT INTO LuanChuyenNhanViens (MaNhanVien, NgayChuyen, LyDoChuyen, PhongBanChuyen, PhongBanDen) VALUES
('NV01', '2025-02-15', N'Dự án mới tại phòng IT', 'PB01', 'PB03'),
('NV02', '2025-02-16', N'Tăng cường nhân sự phòng Kinh doanh', 'PB02', 'PB04'),
('NV03', '2025-02-17', N'Chuyển sang phòng Nhân sự', 'PB03', 'PB01'),
('NV04', '2025-02-18', N'Điều động sang Marketing', 'PB04', 'PB05'),
('NV05', '2025-02-19', N'Hỗ trợ phòng Kế toán', 'PB05', 'PB02');

-- Dữ liệu bảng ThoiViecs (Đã sửa lỗi)
INSERT INTO ThoiViecs (MaThoiViec, MaNhanVien, LyDo, NgayThoiViec) VALUES
('TV01', 'NV01', N'Chuyển công tác ra nước ngoài', '2025-06-01'),
('TV02', 'NV02', N'Lý do cá nhân', '2025-06-15'),
('TV03', 'NV03', N'Hết hợp đồng', '2025-07-01'),
('TV04', 'NV04', N'Sức khỏe không đảm bảo', '2025-07-10'),
('TV05', 'NV05', N'Khác', '2025-07-20');

--Dữ liệu bảng userrole
INSERT INTO UserRoles (NameRole) VALUES (N'Nhân viên');
INSERT INTO UserRoles (NameRole) VALUES (N'Phó phòng');
INSERT INTO UserRoles (NameRole) VALUES (N'Trưởng phòng');
INSERT INTO UserRoles (NameRole) VALUES (N'Nhân viên nhân sự');
INSERT INTO UserRoles (NameRole) VALUES (N'Giám đốc');

SELECT RoleId, NameRole FROM UserRoles WHERE RoleId = 3;

select *from NhanViens
select *from UserRoles
select *from ChucVuNhanViens
select *from PhongBans

UPDATE PhongBans
SET TrangThai = 1
WHERE TrangThai IS NULL OR TrangThai = 0;
DELETE FROM BangLuongs;






