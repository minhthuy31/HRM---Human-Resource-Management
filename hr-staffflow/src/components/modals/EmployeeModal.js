import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaUserCircle, FaCamera, FaPenNib } from "react-icons/fa"; // Thêm icon FaPenNib
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/EmployeeModal.css";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("data:image")) return path; // Support Base64 (Chữ ký)
  if (path.startsWith("blob:")) return path;
  return `http://localhost:5260${path}`;
};

const EmployeeModal = ({
  employee,
  onSave,
  onCancel,
  phongBans,
  chucVus,
  chuyenNganhs,
  trinhDoHocVans,
  hopDongs,
  managers,
  isViewOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Khởi tạo dữ liệu ban đầu
    const initialData = employee
      ? {
          ...employee,
          luongCoBan:
            employee.luongCoBan !== undefined && employee.luongCoBan !== null
              ? employee.luongCoBan
              : "",
          luongTroCap:
            employee.luongTroCap !== undefined && employee.luongTroCap !== null
              ? employee.luongTroCap
              : "",
          soHopDong: employee.soHopDong || "",
          chuKy: employee.chuKy || null, // Lấy chữ ký từ prop employee
        }
      : {
          trangThai: true,
          gioiTinh: 1,
          luongCoBan: "",
          luongTroCap: "",
          soHopDong: "",
          chuKy: null,
        };

    setFormData(initialData);
    setPreviewUrl(initialData.hinhAnh || null);
    setSelectedFile(null);
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- XỬ LÝ NHẬP TIỀN TỆ (Chỉ nhận số) ---
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const rawValue = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: rawValue }));
  };

  // --- HÀM FORMAT TIỀN TỆ ---
  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handleDateChange = (date, name) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };

    if (dataToSubmit.luongCoBan !== "" && dataToSubmit.luongCoBan !== null) {
      dataToSubmit.luongCoBan = parseFloat(dataToSubmit.luongCoBan);
    } else {
      dataToSubmit.luongCoBan = 0;
    }

    if (dataToSubmit.luongTroCap !== "" && dataToSubmit.luongTroCap !== null) {
      dataToSubmit.luongTroCap = parseFloat(dataToSubmit.luongTroCap);
    } else {
      dataToSubmit.luongTroCap = 0;
    }

    onSave(dataToSubmit, selectedFile);
  };

  // --- MENU CONFIGURATION (THÊM TAB CHỮ KÝ) ---
  const tabs = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "identity", label: "Giấy tờ tùy thân" },
    { id: "contact", label: "Liên hệ" },
    { id: "job", label: "Công việc & Lương" },
    { id: "bank", label: "Thông tin tài khoản" },
    { id: "education", label: "Trình độ học vấn" },
    { id: "insurance", label: "Bảo hiểm" },
    { id: "signature", label: "Chữ ký số" }, // <--- MỚI
  ];

  // ... (Giữ nguyên các hàm renderPersonal, renderIdentity, renderContact, renderJob, renderBank, renderEducation, renderInsurance) ...
  // Để tiết kiệm không gian, tôi chỉ liệt kê phần renderPersonal (đã có trong code gốc) và các phần khác bạn giữ nguyên.
  // ...

  const renderPersonal = () => (
    <div className="tab-content">
      <div className="form-section-title">Thông tin cơ bản</div>
      <div className="avatar-section">
        <div
          className="avatar-preview"
          onClick={() => !isViewOnly && fileInputRef.current.click()}
        >
          {previewUrl ? (
            <img src={getImageUrl(previewUrl)} alt="Avatar" />
          ) : (
            <FaUserCircle size={80} color="#ccc" />
          )}
        </div>
        {!isViewOnly && (
          <span
            className="avatar-upload-label"
            onClick={() => fileInputRef.current.click()}
          >
            <FaCamera /> Chọn ảnh
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Mã nhân viên</label>
          <input
            type="text"
            name="maNhanVien"
            value={formData.maNhanVien || ""}
            disabled
            placeholder="Mã tự sinh"
          />
        </div>
        <div className="form-group">
          <label>
            Họ và tên <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="hoTen"
            value={formData.hoTen || ""}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            placeholder="Nhập họ tên..."
          />
        </div>
        {!isViewOnly && (
          <div className="form-group">
            <label>
              Mật khẩu {employee ? "(Để trống nếu không đổi)" : "*"}
            </label>
            <input
              type="password"
              name="matKhau"
              onChange={handleChange}
              disabled={isViewOnly}
              placeholder={employee ? "" : "Nhập mật khẩu..."}
            />
          </div>
        )}
        <div className="form-group">
          <label>Phòng ban (Cơ bản)</label>
          <select
            name="maPhongBan"
            value={formData.maPhongBan || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn --</option>
            {phongBans.map((pb) => (
              <option key={pb.maPhongBan} value={pb.maPhongBan}>
                {pb.tenPhongBan}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section-title">Chi tiết cá nhân</div>
      <div className="form-grid grid-3">
        <div className="form-group">
          <label>Ngày sinh</label>
          <DatePicker
            selected={formData.ngaySinh ? new Date(formData.ngaySinh) : null}
            onChange={(date) => handleDateChange(date, "ngaySinh")}
            dateFormat="dd/MM/yyyy"
            disabled={isViewOnly}
            className="date-input"
            placeholderText="dd/mm/yyyy"
          />
        </div>
        <div className="form-group">
          <label>Giới tính</label>
          <select
            name="gioiTinh"
            value={formData.gioiTinh}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value={1}>Nam</option>
            <option value={0}>Nữ</option>
            <option value={2}>Khác</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tình trạng hôn nhân</label>
          <select
            name="tinhTrangHonNhan"
            value={formData.tinhTrangHonNhan || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn --</option>
            <option value="Độc thân">Độc thân</option>
            <option value="Đã kết hôn">Đã kết hôn</option>
            <option value="Ly hôn">Ly hôn</option>
          </select>
        </div>
        <div className="form-group">
          <label>Dân tộc</label>
          <input
            name="danToc"
            value={formData.danToc || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Tôn giáo</label>
          <input
            name="tonGiao"
            value={formData.tonGiao || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Quốc tịch</label>
          <input
            name="quocTich"
            value={formData.quocTich || "Việt Nam"}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label>Nơi sinh</label>
          <input
            name="noiSinh"
            value={formData.noiSinh || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Quê quán</label>
          <input
            name="queQuan"
            value={formData.queQuan || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
    </div>
  );

  const renderIdentity = () => (
    <div className="tab-content">
      <div className="form-section-title">Thẻ CCCD / CMND</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Số CCCD</label>
          <input
            name="cccd"
            value={formData.cccd || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Nơi cấp</label>
          <input
            name="noiCapCCCD"
            value={formData.noiCapCCCD || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Ngày cấp</label>
          <DatePicker
            selected={
              formData.ngayCapCCCD ? new Date(formData.ngayCapCCCD) : null
            }
            onChange={(date) => handleDateChange(date, "ngayCapCCCD")}
            dateFormat="dd/MM/yyyy"
            disabled={isViewOnly}
            placeholderText="dd/mm/yyyy"
          />
        </div>
        <div className="form-group">
          <label>Ngày hết hạn</label>
          <DatePicker
            selected={
              formData.ngayHetHanCCCD ? new Date(formData.ngayHetHanCCCD) : null
            }
            onChange={(date) => handleDateChange(date, "ngayHetHanCCCD")}
            dateFormat="dd/MM/yyyy"
            disabled={isViewOnly}
            placeholderText="dd/mm/yyyy"
          />
        </div>
      </div>

      <div className="form-section-title">Hộ chiếu (Passport)</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Số hộ chiếu</label>
          <input
            name="soHoChieu"
            value={formData.soHoChieu || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Quốc gia cấp / Nơi cấp</label>
          <input
            name="noiCapHoChieu"
            value={formData.noiCapHoChieu || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Ngày cấp</label>
          <DatePicker
            selected={
              formData.ngayCapHoChieu ? new Date(formData.ngayCapHoChieu) : null
            }
            onChange={(date) => handleDateChange(date, "ngayCapHoChieu")}
            dateFormat="dd/MM/yyyy"
            disabled={isViewOnly}
            placeholderText="dd/mm/yyyy"
          />
        </div>
        <div className="form-group">
          <label>Ngày hết hạn</label>
          <DatePicker
            selected={
              formData.ngayHetHanHoChieu
                ? new Date(formData.ngayHetHanHoChieu)
                : null
            }
            onChange={(date) => handleDateChange(date, "ngayHetHanHoChieu")}
            dateFormat="dd/MM/yyyy"
            disabled={isViewOnly}
            placeholderText="dd/mm/yyyy"
          />
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="tab-content">
      <div className="form-section-title">Thông tin liên hệ chính</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="text"
            name="sdt_NhanVien"
            value={formData.sdt_NhanVien || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>

      <div className="form-section-title">Liên hệ khẩn cấp</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Người liên hệ</label>
          <input
            name="nguoiLienHeKhanCap"
            value={formData.nguoiLienHeKhanCap || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Mối quan hệ</label>
          <input
            name="quanHeKhanCap"
            value={formData.quanHeKhanCap || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Số điện thoại khẩn cấp</label>
          <input
            name="sdtKhanCap"
            value={formData.sdtKhanCap || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Địa chỉ khẩn cấp</label>
          <input
            name="diaChiKhanCap"
            value={formData.diaChiKhanCap || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>

      <div className="form-section-title">Địa chỉ thường trú</div>
      <div className="form-grid grid-1">
        <div className="form-group">
          <label>Địa chỉ chi tiết (Số nhà, đường)</label>
          <input
            name="diaChiThuongTru"
            value={formData.diaChiThuongTru || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Phường / Xã</label>
          <input
            name="phuongXaThuongTru"
            value={formData.phuongXaThuongTru || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Quận / Huyện</label>
          <input
            name="quanHuyenThuongTru"
            value={formData.quanHuyenThuongTru || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Tỉnh / Thành phố</label>
          <input
            name="tinhThanhThuongTru"
            value={formData.tinhThanhThuongTru || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Quốc gia</label>
          <input
            name="quocGiaThuongTru"
            value={formData.quocGiaThuongTru || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>

      <div className="form-section-title">Địa chỉ tạm trú</div>
      <div className="form-grid grid-1">
        <div className="form-group">
          <label>Địa chỉ chi tiết tạm trú</label>
          <input
            name="diaChiTamTru"
            value={formData.diaChiTamTru || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
    </div>
  );

  const renderJob = () => (
    <div className="tab-content">
      <div className="form-section-title">Thông tin quản lý</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Quản lý trực tiếp</label>
          <select
            name="maQuanLyTrucTiep"
            value={formData.maQuanLyTrucTiep || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn quản lý --</option>
            {managers &&
              managers.map((m) => (
                <option key={m.maNhanVien} value={m.maNhanVien}>
                  {m.hoTen} - {m.tenChucVu}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label>Ngày bắt đầu làm việc</label>
          <DatePicker
            selected={
              formData.ngayVaoLam ? new Date(formData.ngayVaoLam) : null
            }
            onChange={(date) => handleDateChange(date, "ngayVaoLam")}
            dateFormat="dd/MM/yyyy"
            disabled={isViewOnly}
            placeholderText="dd/mm/yyyy"
          />
        </div>
      </div>

      <div className="form-section-title">Chi tiết công việc</div>
      <div className="form-grid grid-3">
        <div className="form-group">
          <label>Phòng ban</label>
          <select
            name="maPhongBan"
            value={formData.maPhongBan || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn --</option>
            {phongBans.map((pb) => (
              <option key={pb.maPhongBan} value={pb.maPhongBan}>
                {pb.tenPhongBan}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Chức vụ</label>
          <select
            name="maChucVuNV"
            value={formData.maChucVuNV || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn --</option>
            {chucVus.map((cv) => (
              <option key={cv.maChucVuNV} value={cv.maChucVuNV}>
                {cv.tenChucVu}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Loại nhân viên</label>
          <input
            name="loaiNhanVien"
            value={formData.loaiNhanVien || ""}
            onChange={handleChange}
            disabled={isViewOnly}
            placeholder="VD: Full-time"
          />
        </div>
      </div>

      <div className="form-section-title" style={{ marginTop: "20px" }}>
        Lương & Hợp đồng
      </div>
      <div className="form-grid grid-3">
        <div className="form-group">
          <label>Lương cơ bản (VNĐ)</label>
          <input
            type="text"
            name="luongCoBan"
            value={formatCurrency(formData.luongCoBan)}
            onChange={handleCurrencyChange}
            disabled={isViewOnly}
            placeholder="Nhập mức lương..."
          />
        </div>
        <div className="form-group">
          <label>Lương trợ cấp (VNĐ)</label>
          <input
            type="text"
            name="luongTroCap"
            value={formatCurrency(formData.luongTroCap)}
            onChange={handleCurrencyChange}
            disabled={isViewOnly}
            placeholder="Nhập trợ cấp..."
          />
        </div>
        <div className="form-group">
          <label>Số hợp đồng</label>
          <input
            type="text"
            name="soHopDong"
            value={formData.soHopDong}
            onChange={handleChange}
            disabled={isViewOnly}
            placeholder="VD: HD-001/2025"
          />
        </div>
      </div>
    </div>
  );

  const renderBank = () => (
    <div className="tab-content">
      <div className="form-section-title">Tài khoản ngân hàng</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Tên ngân hàng</label>
          <input
            name="tenNganHang"
            value={formData.tenNganHang || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Số tài khoản</label>
          <input
            name="soTaiKhoanNH"
            value={formData.soTaiKhoanNH || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Tên chủ tài khoản</label>
          <input
            name="tenTaiKhoanNH"
            value={formData.tenTaiKhoanNH || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="tab-content">
      <div className="form-section-title">Học vấn</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Trình độ</label>
          <select
            name="maTrinhDoHocVan"
            value={formData.maTrinhDoHocVan || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn --</option>
            {trinhDoHocVans.map((td) => (
              <option key={td.maTrinhDoHocVan} value={td.maTrinhDoHocVan}>
                {td.tenTrinhDo}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Hệ đào tạo</label>
          <input
            name="heDaoTao"
            value={formData.heDaoTao || ""}
            onChange={handleChange}
            disabled={isViewOnly}
            placeholder="VD: Chính quy"
          />
        </div>
        <div className="form-group">
          <label>Đơn vị đào tạo (Trường)</label>
          <input
            name="noiDaoTao"
            value={formData.noiDaoTao || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Chuyên ngành</label>
          <select
            name="maChuyenNganh"
            value={formData.maChuyenNganh || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <option value="">-- Chọn --</option>
            {chuyenNganhs.map((cn) => (
              <option key={cn.maChuyenNganh} value={cn.maChuyenNganh}>
                {cn.tenChuyenNganh}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Chuyên ngành chi tiết</label>
          <input
            name="chuyenNganhChiTiet"
            value={formData.chuyenNganhChiTiet || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div className="tab-content">
      <div className="form-section-title">Thông tin bảo hiểm</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Số BHYT</label>
          <input
            name="soBHYT"
            value={formData.soBHYT || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group">
          <label>Số BHXH</label>
          <input
            name="soBHXH"
            value={formData.soBHXH || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label>Nơi đăng ký KCB ban đầu</label>
          <input
            name="noiDKKCB"
            value={formData.noiDKKCB || ""}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </div>
      </div>
    </div>
  );

  // --- 8. PHẦN MỚI: TAB CHỮ KÝ ---
  const renderSignature = () => (
    <div className="tab-content">
      <div className="form-section-title">Chữ ký điện tử</div>
      <div
        className="signature-display-box"
        style={{
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {formData.chuKy ? (
          <img
            src={getImageUrl(formData.chuKy)}
            alt="Chữ ký nhân viên"
            style={{
              maxWidth: "100%",
              maxHeight: "150px",
              objectFit: "contain",
            }}
          />
        ) : (
          <>
            <FaPenNib
              size={40}
              color="#cbd5e1"
              style={{ marginBottom: "10px" }}
            />
            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
              Nhân viên chưa có chữ ký số.
            </span>
            {!isViewOnly && (
              <div
                style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}
              >
                (Vui lòng cập nhật tại màn hình danh sách nhân viên: Chuột phải{" "}
                {"->"} Cập nhật chữ ký)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Switch render content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonal();
      case "identity":
        return renderIdentity();
      case "contact":
        return renderContact();
      case "job":
        return renderJob();
      case "bank":
        return renderBank();
      case "education":
        return renderEducation();
      case "insurance":
        return renderInsurance();
      case "signature": // <--- CASE MỚI
        return renderSignature();
      default:
        return null;
    }
  };

  return (
    <div className="employee-modal-overlay">
      <div className="employee-modal__content">
        <div className="employee-modal__header">
          <h2>
            {employee
              ? `Nhân viên: ${employee.maNhanVien || "..."} - ${
                  employee.hoTen || "..."
                }`
              : "Thêm nhân viên mới"}
          </h2>
          <button onClick={onCancel} className="employee-modal__close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="employee-modal__body">
          {/* SIDEBAR MENU */}
          <div className="employee-modal__sidebar">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`sidebar-item ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* MAIN FORM AREA */}
          <div className="employee-modal__main">
            <form id="employeeForm" onSubmit={handleSubmit}>
              {renderContent()}
            </form>
          </div>
        </div>

        <div className="employee-modal__footer">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Đóng
          </button>
          {!isViewOnly && (
            <button type="submit" form="employeeForm" className="btn-save">
              {employee ? "Lưu thay đổi" : "Lưu mới"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
