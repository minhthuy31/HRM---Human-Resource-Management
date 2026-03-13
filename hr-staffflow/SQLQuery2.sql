CREATE DATABASE HRApiDB;
GO
USE HRApiDB;
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

-- Bảng hợp đồng (1 nhân viên có thể nhiều hợp đồng)
CREATE TABLE HopDongs (
    MaHopDong VARCHAR(30) PRIMARY KEY,
    MaNhanVien VARCHAR(30) NOT NULL,
    LoaiHopDong NVARCHAR(50),
    NgayBatDau DATETIME,
    NgayKetThuc DATETIME,
    GhiChu NVARCHAR(MAX),
    FOREIGN KEY (MaNhanVien) REFERENCES NhanViens(MaNhanVien)
);

CREATE TABLE NhanViens (
    MaNhanVien VARCHAR(30) PRIMARY KEY,
    MatKhau NVARCHAR(100) NOT NULL,
    HoTen NVARCHAR(50) NOT NULL,
    NgaySinh DATE,
    GioiTinh INT, -- 0: Nữ, 1: Nam
    DanToc NVARCHAR(20),
    TinhTrangHonNhan NVARCHAR(30),
    QueQuan NVARCHAR(100),
    DiaChiThuongTru NVARCHAR(200),
    DiaChiTamTru NVARCHAR(200),
    HinhAnh NVARCHAR(MAX),

    -- Liên hệ
    sdt_NhanVien VARCHAR(15),
    Email NVARCHAR(100),

    -- Giấy tờ tùy thân
    CCCD VARCHAR(50),
    NgayCapCCCD DATE,
    NoiCapCCCD NVARCHAR(100),

    -- Công việc
    MaChucVuNV VARCHAR(30),
    MaPhongBan VARCHAR(30),
    MaHopDong VARCHAR(30),
    MaChuyenNganh VARCHAR(30),
    MaTrinhDoHocVan VARCHAR(30),
    LoaiNhanVien NVARCHAR(50), -- Chính thức / Thử việc / Part-time
    TrangThai BIT NOT NULL,    -- 1: Đang làm, 0: Nghỉ

    -- Tài chính
    SoTaiKhoanNH NVARCHAR(50),
    TenNganHang NVARCHAR(100),

    FOREIGN KEY (MaPhongBan) REFERENCES PhongBans(MaPhongBan),
    FOREIGN KEY (MaChucVuNV) REFERENCES ChucVuNhanViens(MaChucVuNV),
    FOREIGN KEY (MaChuyenNganh) REFERENCES ChuyenNganhs(MaChuyenNganh),
    FOREIGN KEY (MaHopDong) REFERENCES HopDongs(MaHopDong),
    FOREIGN KEY (MaTrinhDoHocVan) REFERENCES TrinhDoHocVans(MaTrinhDoHocVan)
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

-- Dữ liệu bảng PhongBans
INSERT INTO PhongBans VALUES
('PB01', N'Phòng Nhân sự', N'Tầng 3 - Tòa A', '0241111111'),
('PB02', N'Phòng Kế toán', N'Tầng 2 - Tòa A', '0242222222'),
('PB03', N'Phòng IT', N'Tầng 4 - Tòa B', '0243333333'),
('PB04', N'Phòng Kinh doanh', N'Tầng 5 - Tòa B', '0244444444'),
('PB05', N'Phòng Marketing', N'Tầng 6 - Tòa B', '0245555555');

-- Dữ liệu bảng ChucVuNhanViens
INSERT INTO ChucVuNhanViens VALUES
('CV01', N'Nhân viên', 1.0),
('CV02', N'Trưởng phòng', 1.5),
('CV03', N'Phó phòng', 1.3),
('CV04', N'Chuyên viên', 1.2),
('CV05', N'Thực tập sinh', 0.8);

-- Dữ liệu bảng ChuyenNganhs
INSERT INTO ChuyenNganhs VALUES
('CN01', N'Công nghệ thông tin'),
('CN02', N'Kế toán'),
('CN03', N'Quản trị kinh doanh'),
('CN04', N'Marketing'),
('CN05', N'Nhân sự');

-- Dữ liệu bảng TrinhDoHocVans
INSERT INTO TrinhDoHocVans VALUES
('TD01', N'Cử nhân', 1.0),
('TD02', N'Thạc sĩ', 1.2),
('TD03', N'Tiến sĩ', 1.5),
('TD04', N'Cao đẳng', 0.9),
('TD05', N'Trung cấp', 0.8);

-- Dữ liệu bảng HopDongs
INSERT INTO HopDongs VALUES
('HD01', N'Hợp đồng 1 năm', '2024-01-01', '2024-12-31', N'Hợp đồng thử việc 1 năm'),
('HD02', N'Hợp đồng 3 năm', '2023-06-01', '2026-06-01', N'Hợp đồng dài hạn'),
('HD03', N'Hợp đồng không thời hạn', '2022-03-15', NULL, N'Làm việc lâu dài'),
('HD04', N'Hợp đồng thời vụ', '2024-09-01', '2025-01-31', N'Dự án mùa cao điểm'),
('HD05', N'Hợp đồng bán thời gian', '2024-05-01', '2025-05-01', N'Làm việc bán thời gian');

select *from HopDongs

-- Dữ liệu bảng NhanViens
INSERT INTO NhanViens VALUES
('NV01', '123456', N'Nguyễn Văn A', '1990-05-12', N'Hà Nội', NULL, 1, N'Kinh', '0911111111', 'CV01', 1, 'PB01', 'HD01', 'CN05', 'TD01', '012345678901'),
('NV02', '123456', N'Trần Thị B', '1992-08-20', N'Hải Phòng', NULL, 0, N'Kinh', '0922222222', 'CV02', 1, 'PB02', 'HD02', 'CN02', 'TD02', '012345678902'),
('NV03', '123456', N'Lê Văn C', '1995-12-05', N'Đà Nẵng', NULL, 1, N'Kinh', '0933333333', 'CV03', 1, 'PB03', 'HD03', 'CN01', 'TD03', '012345678903'),
('NV04', '123456', N'Phạm Thị D', '1998-07-18', N'Hà Nam', NULL, 0, N'Kinh', '0944444444', 'CV04', 1, 'PB04', 'HD04', 'CN03', 'TD04', '012345678904'),
('NV05', '123456', N'Hoàng Văn E', '2000-09-25', N'Hà Nội', NULL, 1, N'Kinh', '0955555555', 'CV05', 1, 'PB05', 'HD05', 'CN04', 'TD05', '012345678905');

-- Dữ liệu bảng Luongs
INSERT INTO Luongs VALUES
('NV01', 5000000, 2.0, 8.0, 1.5, 1.0, 500000, 0.05),
('NV02', 7000000, 2.5, 8.0, 1.5, 1.0, 700000, 0.05),
('NV03', 9000000, 3.0, 8.0, 1.5, 1.0, 1000000, 0.10),
('NV04', 4500000, 1.8, 8.0, 1.5, 1.0, 400000, 0.05),
('NV05', 4000000, 1.5, 8.0, 1.5, 1.0, 300000, 0.03);

-- Dữ liệu bảng ChiTietLuongs
INSERT INTO ChiTietLuongs VALUES
('BL01', 'NV01', 10000000, 8.0, 1.5, 1.0, 500000, 0.05, 200000, 0, '2025-01-31', '10700000'),
('BL02', 'NV02', 15000000, 8.0, 1.5, 1.0, 700000, 0.05, 300000, 50000, '2025-01-31', '15200000'),
('BL03', 'NV03', 20000000, 8.0, 1.5, 1.0, 1000000, 0.10, 500000, 100000, '2025-01-31', '20500000'),
('BL04', 'NV04', 9000000, 8.0, 1.5, 1.0, 400000, 0.05, 150000, 0, '2025-01-31', '9150000'),
('BL05', 'NV05', 8000000, 8.0, 1.5, 1.0, 300000, 0.03, 100000, 0, '2025-01-31', '8100000');

-- Dữ liệu bảng CapNhatLuongs
INSERT INTO CapNhatLuongs VALUES
( 'NV01', 10000000, 12000000, 8.0, 1.5, 1.0, 500000, 0.05, '2025-02-01', 2.2),
( 'NV02', 15000000, 17000000, 8.0, 1.5, 1.0, 700000, 0.05, '2025-02-01', 2.7),
( 'NV03', 20000000, 22000000, 8.0, 1.5, 1.0, 1000000, 0.10, '2025-02-01', 3.2),
( 'NV04', 9000000, 10000000, 8.0, 1.5, 1.0, 400000, 0.05, '2025-02-01', 2.0),
( 'NV05', 8000000, 9000000, 8.0, 1.5, 1.0, 300000, 0.03, '2025-02-01', 1.7);

-- Dữ liệu bảng KhenThuongs
INSERT INTO KhenThuongs VALUES
('NV01', '2025-01-01', N'Hoàn thành xuất sắc dự án A', 2000000),
('NV02', '2025-01-15', N'Đạt doanh số cao', 1500000),
('NV03', '2025-02-01', N'Ý tưởng cải tiến quy trình', 1000000),
('NV04', '2025-02-05', N'Đóng góp tích cực trong dự án B', 800000),
('NV05', '2025-02-10', N'Được khách hàng khen ngợi', 500000);

-- Dữ liệu bảng KyLuats
INSERT INTO KyLuats VALUES
('NV01', N'Đi làm muộn nhiều lần', '2025-01-20', 200000),
('NV02', N'Nghỉ không phép', '2025-01-22', 300000),
('NV03', N'Vi phạm nội quy bảo mật', '2025-02-02', 500000),
('NV04', N'Làm hỏng thiết bị công ty', '2025-02-07', 1000000),
('NV05', N'Tự ý rời vị trí làm việc', '2025-02-12', 150000);

-- Dữ liệu bảng LuanChuyenNhanViens
INSERT INTO LuanChuyenNhanViens VALUES
('NV01', DEFAULT, '2025-02-15', N'Dự án mới tại phòng IT', 'PB01', 'PB03'),
('NV02', DEFAULT, '2025-02-16', N'Tăng cường nhân sự phòng Kinh doanh', 'PB02', 'PB04'),
('NV03', DEFAULT, '2025-02-17', N'Chuyển sang phòng Nhân sự', 'PB03', 'PB01'),
('NV04', DEFAULT, '2025-02-18', N'Điều động sang Marketing', 'PB04', 'PB05'),
('NV05', DEFAULT, '2025-02-19', N'Hỗ trợ phòng Kế toán', 'PB05', 'PB02');

-- Dữ liệu bảng ThoiViecs
INSERT INTO ThoiViecs VALUES
('NV01', N'Chuyển công tác ra nước ngoài', '2025-06-01'),
('NV02', N'Lý do cá nhân', '2025-06-15'),
('NV03', N'Hết hợp đồng', '2025-07-01'),
('NV04', N'Sức khỏe không đảm bảo', '2025-07-10'),
('NV05', N'Khác', '2025-07-20');
