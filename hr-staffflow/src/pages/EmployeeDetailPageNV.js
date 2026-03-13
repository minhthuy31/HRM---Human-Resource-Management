import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FaUserCircle, FaEye, FaFileContract } from "react-icons/fa"; // Thêm icon
import { api } from "../api"; // Import api để lấy thông tin Giám đốc
import "react-datepicker/dist/react-datepicker.css";
import "../styles/EmployeeDetailPage.css";

// IMPORT TEMPLATE HỢP ĐỒNG (Đảm bảo đường dẫn đúng với project của bạn)
import ContractTemplate from "../components/templates/ContractTemplate";

const getImageUrl = (path) => {
  if (!path) return null;
  return `http://localhost:5260${path}`;
};

const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("data:image")) return path;
  return `http://localhost:5260${path}`;
};

const EmployeeDetailPageNV = () => {
  const { employee } = useOutletContext();
  const [activeTab, setActiveTab] = useState("personal");

  // --- STATE MỚI CHO HỢP ĐỒNG ONLINE ---
  const [director, setDirector] = useState(null); // Lưu thông tin giám đốc
  const [viewingContract, setViewingContract] = useState(null); // Lưu hợp đồng đang xem
  // --------------------------------------

  // Fetch thông tin Giám đốc 1 lần khi trang load
  useEffect(() => {
    const fetchDirector = async () => {
      try {
        // Gọi API lấy giám đốc (đường dẫn mà bạn đã fix thành công ở các bước trước)
        const res = await api.get("/HopDong/GiamDoc");
        setDirector(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin giám đốc:", err);
      }
    };
    fetchDirector();
  }, []);

  if (!employee) {
    return <div style={{ padding: "20px" }}>Đang tải thông tin...</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "---";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // --- HÀM XỬ LÝ KHI BẤM "XEM ONLINE" ---
  const handleViewOnline = (hd) => {
    // Gộp dữ liệu nhân viên + dữ liệu hợp đồng thành 1 object chuẩn cho Template
    const contractDataForTemplate = {
      // Thông tin hợp đồng
      SoHopDong: hd.soHopDong,
      LoaiHopDong: hd.loaiHopDong,
      NgayBatDau: hd.ngayBatDau,
      NgayKetThuc: hd.ngayKetThuc,
      LuongCoBan: hd.luongCoBan,

      // Thông tin nhân viên (Lấy từ context employee)
      HoTenNhanVien: employee.hoTen,
      NgaySinh: employee.ngaySinh,
      CCCD: employee.cccd,
      DiaChi: employee.diaChiThuongTru,
      SoDienThoai: employee.sdt_NhanVien,
      TenPhongBan: employee.tenPhongBan,
      TenChucVu: employee.tenChucVu, // Chức vụ của nhân viên

      // Chữ ký nhân viên
      ChuKy: employee.chuKy,
    };

    setViewingContract(contractDataForTemplate);
  };

  const tabs = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "identity", label: "Giấy tờ tùy thân" },
    { id: "contact", label: "Liên hệ" },
    { id: "job", label: "Quá trình làm việc" },
    { id: "contracts", label: "Hợp đồng & Chữ ký" },
    { id: "bank", label: "Thông tin tài khoản" },
    { id: "education", label: "Trình độ học vấn" },
    { id: "insurance", label: "Bảo hiểm" },
  ];

  const renderField = (label, value) => (
    <div className="form-group">
      <label>{label}</label>
      <span className="view-field">{value || "---"}</span>
    </div>
  );

  // --- CÁC RENDER CONTENT (Giữ nguyên các phần khác, chỉ sửa renderContracts) ---
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
          <div className="form-grid grid-2">
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
              : "Khác",
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

  const renderIdentity = () => (
    <div className="tab-content">
      <div className="form-section-title">Thẻ CCCD / CMND</div>
      <div className="form-grid grid-2">
        {renderField("Số CCCD", employee.cccd)}
        {renderField("Nơi cấp", employee.noiCapCCCD)}
        {renderField("Ngày cấp", formatDate(employee.ngayCapCCCD))}
        {renderField("Ngày hết hạn", formatDate(employee.ngayHetHanCCCD))}
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="tab-content">
      <div className="form-section-title">Liên hệ chính</div>
      <div className="form-grid grid-2">
        {renderField("Email", employee.email)}
        {renderField("Số điện thoại", employee.sdt_NhanVien)}
      </div>
      <div className="form-section-title">Địa chỉ</div>
      <div className="form-grid grid-1">
        {renderField("Địa chỉ chi tiết", employee.diaChiThuongTru)}
      </div>
    </div>
  );

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
      <div className="form-section-title">Tóm tắt Lương</div>
      <div className="form-grid grid-3">
        {renderField("Số HĐ hiện tại", employee.soHopDong)}
        {renderField("Lương CB", formatCurrency(employee.luongCoBan))}
        {renderField("Lương trợ cấp", formatCurrency(employee.luongTroCap))}
      </div>
    </div>
  );

  // --- CẬP NHẬT TAB HỢP ĐỒNG: THÊM NÚT XEM ONLINE ---
  const renderContracts = () => (
    <div className="tab-content">
      {/* PHẦN 1: CHỮ KÝ SỐ */}
      <div className="form-section-title">Chữ ký số</div>
      <div
        className="signature-box"
        style={{
          border: "2px dashed #ccc",
          padding: "20px",
          textAlign: "center",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {employee.chuKy ? (
          <div>
            <img
              src={employee.chuKy}
              alt="Chữ ký nhân viên"
              style={{ maxHeight: "150px", maxWidth: "100%" }}
            />
            <p style={{ marginTop: "10px", color: "#666", fontSize: "0.9em" }}>
              Chữ ký hiện tại của bạn
            </p>
          </div>
        ) : (
          <p style={{ color: "#999" }}>Chưa có chữ ký số nào được lưu.</p>
        )}
      </div>

      {/* PHẦN 2: LỊCH SỬ HỢP ĐỒNG */}
      <div className="form-section-title">Lịch sử Hợp đồng</div>

      {employee.hopDongs && employee.hopDongs.length > 0 ? (
        <div className="contracts-list">
          {employee.hopDongs.map((hd, index) => (
            <div
              key={index}
              className="contract-card"
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "20px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                <h3 style={{ margin: 0, color: "#0e7c7b", fontSize: "1.1rem" }}>
                  HĐ số: {hd.soHopDong}
                </h3>
                <span
                  className={`status-badge ${hd.trangThai === "HieuLuc" ? "active" : "expired"}`}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "15px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    backgroundColor:
                      hd.trangThai === "HieuLuc" ? "#e6fffa" : "#fff5f5",
                    color: hd.trangThai === "HieuLuc" ? "#047857" : "#c53030",
                    border: `1px solid ${hd.trangThai === "HieuLuc" ? "#047857" : "#c53030"}`,
                  }}
                >
                  {hd.trangThai === "HieuLuc" ? "Đang hiệu lực" : "Hết hạn/Hủy"}
                </span>
              </div>

              <div className="form-grid grid-2">
                {renderField("Loại hợp đồng", hd.loaiHopDong)}
                {renderField("Lương cơ bản", formatCurrency(hd.luongCoBan))}
                {renderField("Ngày bắt đầu", formatDate(hd.ngayBatDau))}
                {renderField(
                  "Ngày kết thúc",
                  hd.ngayKetThuc ? formatDate(hd.ngayKetThuc) : "Vô thời hạn",
                )}
              </div>

              {/* ACTION BAR: XEM ONLINE VÀ TẢI FILE */}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "15px",
                  borderTop: "1px dashed #eee",
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                {/* NÚT XEM ONLINE (MỚI) */}
                <button
                  onClick={() => handleViewOnline(hd)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 15px",
                    borderRadius: "6px",
                    border: "1px solid #0e7c7b",
                    backgroundColor: "#e6fffa",
                    color: "#0e7c7b",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <FaFileContract /> Xem bản Online
                </button>

                {/* FILE ĐÍNH KÈM (CŨ) */}
                {hd.tepDinhKem && (
                  <a
                    href={getFileUrl(hd.tepDinhKem)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      color: "#555",
                      fontWeight: "500",
                      padding: "8px 15px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <FaEye /> Xem bản Scan (PDF/Ảnh)
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "#999",
            padding: "20px",
            fontStyle: "italic",
          }}
        >
          Không có lịch sử hợp đồng nào.
        </div>
      )}
    </div>
  );

  const renderBank = () => (
    <div className="tab-content">
      <div className="form-section-title">Tài khoản ngân hàng</div>
      <div className="form-grid grid-2">
        {renderField("Tên ngân hàng", employee.tenNganHang)}
        {renderField("Số tài khoản", employee.soTaiKhoanNH)}
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="tab-content">
      <div className="form-section-title">Học vấn</div>
      <div className="form-grid grid-2">
        {renderField("Trình độ", employee.tenTrinhDoHocVan)}
        {renderField("Chuyên ngành", employee.tenChuyenNganh)}
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div className="tab-content">
      <div className="form-section-title">Bảo hiểm</div>
      <div className="form-grid grid-2">
        {renderField("Số BHYT", employee.soBHYT)}
        {renderField("Số BHXH", employee.soBHXH)}
      </div>
    </div>
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
      case "contracts":
        return renderContracts();
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

  const horizontalMenuContainerStyle = {
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #dce0e4",
    padding: "0",
  };

  const horizontalMenuItemStyle = (isActive) => ({
    padding: "15px 25px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: isActive ? "700" : "500",
    color: isActive ? "#0e7c7b" : "#55606d",
    borderBottom: isActive ? "3px solid #0e7c7b" : "3px solid transparent",
    borderLeft: "none",
    backgroundColor: isActive ? "#fff" : "transparent",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  });

  return (
    <>
      <div
        className="emp-detail-page"
        style={{ padding: "0", height: "100%", backgroundColor: "transparent" }}
      >
        <div
          className="emp-layout-container"
          style={{
            height: "100%",
            borderRadius: "8px",
            border: "none",
            boxShadow: "none",
          }}
        >
          <div className="emp-layout-header">
            <h1>Hồ sơ của tôi: {employee.hoTen}</h1>
            <span
              className={`emp-layout-status ${employee.trangThai ? "status-active" : "status-inactive"}`}
            >
              {employee.trangThai ? "Đang hoạt động" : "Đã nghỉ việc"}
            </span>
          </div>

          <div className="emp-layout-body" style={{ flexDirection: "column" }}>
            <div style={horizontalMenuContainerStyle}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  style={horizontalMenuItemStyle(activeTab === tab.id)}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            <div className="emp-main" style={{ padding: "30px" }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL HIỂN THỊ HỢP ĐỒNG ONLINE --- */}
      {viewingContract && (
        <ContractTemplate
          data={viewingContract}
          director={director} // Truyền thông tin giám đốc đã fetch
          onClose={() => setViewingContract(null)}
        />
      )}
    </>
  );
};

export default EmployeeDetailPageNV;
