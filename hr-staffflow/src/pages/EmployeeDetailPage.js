import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { FaUserCircle, FaArrowLeft } from "react-icons/fa";
import "../styles/EmployeeDetailPage.css";

const getImageUrl = (path) => {
  if (!path) return null;
  return `http://localhost:5260${path}`;
};

const EmployeeDetailPage = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const { employeeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!employeeId) return;
      setLoading(true);
      try {
        const response = await api.get(`/NhanVien/${employeeId}`);
        setEmployee(response.data);
      } catch (error) {
        console.error("Không thể tải chi tiết nhân viên:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeDetails();
  }, [employeeId]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Hàm format tiền tệ (VNĐ)
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "---";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const tabs = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "identity", label: "Giấy tờ tùy thân" },
    { id: "contact", label: "Liên hệ" },
    { id: "job", label: "Quá trình làm việc & HĐ" },
    { id: "bank", label: "Thông tin tài khoản" },
    { id: "education", label: "Trình độ học vấn" },
    { id: "insurance", label: "Bảo hiểm" },
  ];

  // Helper render field xem chi tiết
  const renderField = (label, value) => (
    <div className="form-group">
      <label>{label}</label>
      <span className="view-field">{value || "---"}</span>
    </div>
  );

  // 1. Cá nhân
  const renderPersonal = () => (
    <div className="tab-content">
      <div className="form-section-title">Thông tin cơ bản</div>
      <div style={{ display: "flex", gap: "25px" }}>
        <div className="avatar-section">
          <div className="avatar-preview">
            {employee.hinhAnh ? (
              <img src={getImageUrl(employee.hinhAnh)} alt="Avatar" />
            ) : (
              <FaUserCircle size={80} color="#ccc" />
            )}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="form-grid">
            {renderField("Mã nhân viên", employee.maNhanVien)}
            {renderField("Họ và tên", employee.hoTen)}
            {renderField("Phòng ban", employee.tenPhongBan)}
            {renderField("Ngày sinh", formatDate(employee.ngaySinh))}
          </div>
        </div>
      </div>

      <div className="form-section-title">Chi tiết cá nhân</div>
      <div className="form-grid grid-3">
        {renderField(
          "Giới tính",
          employee.gioiTinh === 1
            ? "Nam"
            : employee.gioiTinh === 0
            ? "Nữ"
            : "Khác"
        )}
        {renderField("Hôn nhân", employee.tinhTrangHonNhan)}
        {renderField("Dân tộc", employee.danToc)}
        {renderField("Tôn giáo", employee.tonGiao)}
        {renderField("Quốc tịch", employee.quocTich)}
        {renderField("Nơi sinh", employee.noiSinh)}
        {renderField("Quê quán", employee.queQuan)}
      </div>
    </div>
  );

  // 2. Giấy tờ
  const renderIdentity = () => (
    <div className="tab-content">
      <div className="form-section-title">Thẻ CCCD / CMND</div>
      <div className="form-grid grid-2">
        {renderField("Số CCCD", employee.cccd)}
        {renderField("Nơi cấp", employee.noiCapCCCD)}
        {renderField("Ngày cấp", formatDate(employee.ngayCapCCCD))}
        {renderField("Ngày hết hạn", formatDate(employee.ngayHetHanCCCD))}
      </div>
      <div className="form-section-title">Hộ chiếu</div>
      <div className="form-grid grid-2">
        {renderField("Số hộ chiếu", employee.soHoChieu)}
        {renderField("Nơi cấp / Quốc gia", employee.noiCapHoChieu)}
        {renderField("Ngày cấp", formatDate(employee.ngayCapHoChieu))}
        {renderField("Ngày hết hạn", formatDate(employee.ngayHetHanHoChieu))}
      </div>
    </div>
  );

  // 3. Liên hệ
  const renderContact = () => (
    <div className="tab-content">
      <div className="form-section-title">Liên hệ chính</div>
      <div className="form-grid grid-2">
        {renderField("Email", employee.email)}
        {renderField("Số điện thoại", employee.sdt_NhanVien)}
      </div>
      <div className="form-section-title">Khẩn cấp</div>
      <div className="form-grid grid-2">
        {renderField("Người liên hệ", employee.nguoiLienHeKhanCap)}
        {renderField("Mối quan hệ", employee.quanHeKhanCap)}
        {renderField("SĐT Khẩn cấp", employee.sdtKhanCap)}
        {renderField("Địa chỉ báo tin", employee.diaChiKhanCap)}
      </div>
      <div className="form-section-title">Địa chỉ thường trú</div>
      <div className="form-grid grid-1">
        {renderField("Địa chỉ chi tiết", employee.diaChiThuongTru)}
      </div>
      <div className="form-grid grid-4">
        {renderField("Phường/Xã", employee.phuongXaThuongTru)}
        {renderField("Quận/Huyện", employee.quanHuyenThuongTru)}
        {renderField("Tỉnh/TP", employee.tinhThanhThuongTru)}
        {renderField("Quốc gia", employee.quocGiaThuongTru)}
      </div>
      <div className="form-section-title">Địa chỉ tạm trú</div>
      <div className="form-grid grid-1">
        {renderField("Địa chỉ tạm trú", employee.diaChiTamTru)}
      </div>
    </div>
  );

  // 4. Công việc (CẬP NHẬT: Sửa phuCap -> luongTroCap)
  const renderJob = () => (
    <div className="tab-content">
      <div className="form-section-title">Quản lý</div>
      <div className="form-grid grid-2">
        {renderField("Quản lý trực tiếp", employee.tenQuanLyTrucTiep)}
        {renderField("Ngày vào làm", formatDate(employee.ngayVaoLam))}
      </div>
      <div className="form-section-title">Công việc</div>
      <div className="form-grid grid-3">
        {renderField("Phòng ban", employee.tenPhongBan)}
        {renderField("Chức vụ", employee.tenChucVu)}
        {renderField("Loại nhân viên", employee.loaiNhanVien)}
      </div>
      <div className="form-section-title">Hợp đồng & Lương</div>
      <div className="form-grid grid-3">
        {renderField("Số HĐ", employee.soHopDong)}

        {/* --- HIỂN THỊ LƯƠNG & TRỢ CẤP --- */}
        {renderField("Lương CB", formatCurrency(employee.luongCoBan))}

        {/* ĐÃ SỬA: Dùng luongTroCap thay vì phuCap */}
        {renderField("Lương trợ cấp", formatCurrency(employee.luongTroCap))}
      </div>
    </div>
  );

  // 5. Ngân hàng
  const renderBank = () => (
    <div className="tab-content">
      <div className="form-section-title">Tài khoản ngân hàng</div>
      <div className="form-grid grid-2">
        {renderField("Tên ngân hàng", employee.tenNganHang)}
        {renderField("Số tài khoản", employee.soTaiKhoanNH)}
        {renderField("Tên chủ tài khoản", employee.tenTaiKhoanNH)}
      </div>
    </div>
  );

  // 6. Học vấn
  const renderEducation = () => (
    <div className="tab-content">
      <div className="form-section-title">Học vấn</div>
      <div className="form-grid grid-2">
        {renderField("Trình độ", employee.tenTrinhDoHocVan)}
        {renderField("Hệ đào tạo", employee.heDaoTao)}
        {renderField("Đơn vị đào tạo", employee.noiDaoTao)}
        {renderField("Chuyên ngành", employee.tenChuyenNganh)}
        {renderField("Chuyên ngành chi tiết", employee.chuyenNganhChiTiet)}
      </div>
    </div>
  );

  // 7. Bảo hiểm
  const renderInsurance = () => (
    <div className="tab-content">
      <div className="form-section-title">Bảo hiểm</div>
      <div className="form-grid grid-2">
        {renderField("Số BHYT", employee.soBHYT)}
        {renderField("Số BHXH", employee.soBHXH)}
        {renderField("Nơi ĐK KCB", employee.noiDKKCB)}
      </div>
    </div>
  );

  if (loading)
    return (
      <DashboardLayout>
        <p style={{ padding: "20px" }}>Đang tải...</p>
      </DashboardLayout>
    );

  if (!employee)
    return (
      <DashboardLayout>
        <h1 style={{ padding: "20px" }}>Không tìm thấy nhân viên</h1>
      </DashboardLayout>
    );

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
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="emp-detail-page">
        <div className="emp-detail-page__header">
          <button
            onClick={() => navigate("/nhan-vien")}
            className="emp-detail-page__back-btn"
          >
            <FaArrowLeft /> Quay lại danh sách
          </button>
        </div>

        <div className="emp-layout-container">
          <div className="emp-layout-header">
            <h1>
              {employee.hoTen} - {employee.maNhanVien}
            </h1>
            <span
              className={`emp-layout-status ${
                employee.trangThai ? "status-active" : "status-inactive"
              }`}
            >
              {employee.trangThai ? "Đang hoạt động" : "Đã nghỉ việc"}
            </span>
          </div>

          <div className="emp-layout-body">
            <div className="emp-sidebar">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`emp-sidebar-item ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </div>
            <div className="emp-main">{renderContent()}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDetailPage;
