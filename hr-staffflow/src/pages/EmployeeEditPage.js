import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { FaArrowLeft, FaUserCircle, FaCamera } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import "../styles/EmployeeDetailPage.css";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("blob:")) return path;
  return `http://localhost:5260${path}`;
};

const EmployeeEditPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [phongBans, setPhongBans] = useState([]);
  const [chucVus, setChucVus] = useState([]);
  const [chuyenNganhs, setChuyenNganhs] = useState([]);
  const [trinhDoHocVans, setTrinhDoHocVans] = useState([]);
  const [hopDongs, setHopDongs] = useState([]);
  const [managers, setManagers] = useState([]);

  // Image upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [empRes, pbRes, cvRes, cnRes, tdRes, hdRes, mgrRes] =
          await Promise.all([
            api.get(`/NhanVien/${employeeId}`),
            api.get("/PhongBan"),
            api.get("/ChucVuNhanVien"),
            api.get("/ChuyenNganh"),
            api.get("/TrinhDoHocVan"),
            api.get("/HopDong"),
            api.get("/NhanVien/managers?excludeId=" + employeeId),
          ]);

        // --- CẬP NHẬT: Đảm bảo mapping đúng luongTroCap ---
        const empData = {
          ...empRes.data,
          luongCoBan:
            empRes.data.luongCoBan !== undefined &&
            empRes.data.luongCoBan !== null
              ? empRes.data.luongCoBan
              : "",
          // Đã sửa thành luongTroCap
          luongTroCap:
            empRes.data.luongTroCap !== undefined &&
            empRes.data.luongTroCap !== null
              ? empRes.data.luongTroCap
              : "",
          soHopDong: empRes.data.soHopDong || "",
        };

        setEmployee(empData);
        setPreviewUrl(empRes.data.hinhAnh);
        setPhongBans(pbRes.data);
        setChucVus(cvRes.data);
        setChuyenNganhs(cnRes.data);
        setTrinhDoHocVans(tdRes.data);
        setHopDongs(hdRes.data);
        setManagers(mgrRes.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [employeeId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (date, name) => {
    setEmployee((prev) => ({
      ...prev,
      [name]: date ? dayjs(date).format("YYYY-MM-DD") : null,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!employee) return;
    let dataToSave = { ...employee };

    // Đảm bảo luongCoBan là số khi gửi đi
    if (dataToSave.luongCoBan !== "" && dataToSave.luongCoBan !== null) {
      dataToSave.luongCoBan = parseFloat(dataToSave.luongCoBan);
    } else {
      dataToSave.luongCoBan = 0;
    }

    // Đảm bảo luongTroCap là số khi gửi đi
    if (dataToSave.luongTroCap !== "" && dataToSave.luongTroCap !== null) {
      dataToSave.luongTroCap = parseFloat(dataToSave.luongTroCap);
    } else {
      dataToSave.luongTroCap = 0;
    }

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await api.post("/NhanVien/UploadImage", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        dataToSave.hinhAnh = uploadRes.data.filePath;
      }

      await api.put(`/NhanVien/${dataToSave.maNhanVien}`, dataToSave);
      alert("Cập nhật thành công!");
      navigate(`/nhan-vien/${dataToSave.maNhanVien}`);
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      alert("Lưu thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const tabs = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "identity", label: "Giấy tờ tùy thân" },
    { id: "contact", label: "Liên hệ" },
    { id: "job", label: "Công việc & Lương" },
    { id: "bank", label: "Thông tin tài khoản" },
    { id: "education", label: "Trình độ học vấn" },
    { id: "insurance", label: "Bảo hiểm" },
  ];

  const renderPersonal = () => (
    <div className="tab-content">
      <div className="form-section-title">Thông tin cơ bản</div>
      <div style={{ display: "flex", gap: "25px" }}>
        <div className="avatar-section">
          <div
            className="avatar-preview"
            onClick={() => fileInputRef.current.click()}
          >
            {previewUrl ? (
              <img src={getImageUrl(previewUrl)} alt="Avatar" />
            ) : (
              <FaUserCircle size={80} color="#ccc" />
            )}
          </div>
          <span
            className="avatar-upload-label"
            onClick={() => fileInputRef.current.click()}
          >
            <FaCamera /> Chọn ảnh
          </span>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div className="form-grid grid-2">
            <div className="form-group">
              <label>Mã nhân viên</label>
              <input value={employee.maNhanVien} disabled />
            </div>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                name="hoTen"
                value={employee.hoTen || ""}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu (Để trống nếu ko đổi)</label>
              <input
                type="password"
                name="matKhau"
                onChange={handleChange}
                placeholder="..."
              />
            </div>
            <div className="form-group">
              <label>Phòng ban</label>
              <select
                name="maPhongBan"
                value={employee.maPhongBan || ""}
                onChange={handleChange}
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
        </div>
      </div>
      <div className="form-section-title">Chi tiết cá nhân</div>
      <div className="form-grid grid-3">
        <div className="form-group">
          <label>Ngày sinh</label>
          <DatePicker
            selected={employee.ngaySinh ? new Date(employee.ngaySinh) : null}
            onChange={(date) => handleDateChange(date, "ngaySinh")}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
          />
        </div>
        <div className="form-group">
          <label>Giới tính</label>
          <select
            name="gioiTinh"
            value={employee.gioiTinh}
            onChange={handleChange}
          >
            <option value={1}>Nam</option>
            <option value={0}>Nữ</option>
            <option value={2}>Khác</option>
          </select>
        </div>
        <div className="form-group">
          <label>Hôn nhân</label>
          <select
            name="tinhTrangHonNhan"
            value={employee.tinhTrangHonNhan || ""}
            onChange={handleChange}
          >
            <option value="">-- Chọn --</option>
            <option value="Độc thân">Độc thân</option>
            <option value="Đã kết hôn">Đã kết hôn</option>
          </select>
        </div>
        <div className="form-group">
          <label>Dân tộc</label>
          <input
            name="danToc"
            value={employee.danToc || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Tôn giáo</label>
          <input
            name="tonGiao"
            value={employee.tonGiao || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Quốc tịch</label>
          <input
            name="quocTich"
            value={employee.quocTich || "Việt Nam"}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Nơi sinh</label>
          <input
            name="noiSinh"
            value={employee.noiSinh || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Quê quán</label>
          <input
            name="queQuan"
            value={employee.queQuan || ""}
            onChange={handleChange}
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
            value={employee.cccd || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Nơi cấp</label>
          <input
            name="noiCapCCCD"
            value={employee.noiCapCCCD || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Ngày cấp</label>
          <DatePicker
            selected={
              employee.ngayCapCCCD ? new Date(employee.ngayCapCCCD) : null
            }
            onChange={(date) => handleDateChange(date, "ngayCapCCCD")}
            dateFormat="dd/MM/yyyy"
          />
        </div>
        <div className="form-group">
          <label>Ngày hết hạn</label>
          <DatePicker
            selected={
              employee.ngayHetHanCCCD ? new Date(employee.ngayHetHanCCCD) : null
            }
            onChange={(date) => handleDateChange(date, "ngayHetHanCCCD")}
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>
      <div className="form-section-title">Hộ chiếu</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Số hộ chiếu</label>
          <input
            name="soHoChieu"
            value={employee.soHoChieu || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Nơi cấp</label>
          <input
            name="noiCapHoChieu"
            value={employee.noiCapHoChieu || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="tab-content">
      <div className="form-section-title">Liên hệ chính</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            value={employee.email || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>SĐT</label>
          <input
            name="sdt_NhanVien"
            value={employee.sdt_NhanVien || ""}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-section-title">Địa chỉ</div>
      <div className="form-grid grid-1">
        <div className="form-group">
          <label>Địa chỉ thường trú</label>
          <input
            name="diaChiThuongTru"
            value={employee.diaChiThuongTru || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  const renderJob = () => (
    <div className="tab-content">
      <div className="form-section-title">Công việc</div>
      <div className="form-grid grid-3">
        <div className="form-group">
          <label>Quản lý</label>
          <select
            name="maQuanLyTrucTiep"
            value={employee.maQuanLyTrucTiep || ""}
            onChange={handleChange}
          >
            <option value="">-- Chọn --</option>
            {managers.map((m) => (
              <option key={m.maNhanVien} value={m.maNhanVien}>
                {m.hoTen}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Chức vụ</label>
          <select
            name="maChucVuNV"
            value={employee.maChucVuNV || ""}
            onChange={handleChange}
          >
            <option value="">-- Chọn --</option>
            {chucVus.map((c) => (
              <option key={c.maChucVuNV} value={c.maChucVuNV}>
                {c.tenChucVu}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Loại NV</label>
          <input
            name="loaiNhanVien"
            value={employee.loaiNhanVien || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* --- PHẦN BỔ SUNG: LƯƠNG & HỢP ĐỒNG --- */}
      <div className="form-section-title" style={{ marginTop: "20px" }}>
        Lương & Hợp đồng
      </div>
      <div className="form-grid grid-3">
        <div className="form-group">
          <label>Lương cơ bản (VNĐ)</label>
          <input
            type="number"
            name="luongCoBan"
            value={employee.luongCoBan}
            onChange={handleChange}
            placeholder="Nhập mức lương..."
          />
        </div>
        <div className="form-group">
          <label>Lương trợ cấp (VNĐ)</label>
          <input
            type="number"
            name="luongTroCap"
            value={employee.luongTroCap}
            onChange={handleChange}
            placeholder="Nhập trợ cấp..."
          />
        </div>
        <div className="form-group">
          <label>Số hợp đồng</label>
          <input
            type="text"
            name="soHopDong"
            value={employee.soHopDong}
            onChange={handleChange}
            placeholder="VD: HD-001/2025"
          />
        </div>
      </div>
    </div>
  );

  const renderBank = () => (
    <div className="tab-content">
      <div className="form-section-title">Tài khoản ngân hàng</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Tên Ngân hàng</label>
          <input
            name="tenNganHang"
            value={employee.tenNganHang || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Số tài khoản</label>
          <input
            name="soTaiKhoanNH"
            value={employee.soTaiKhoanNH || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Tên chủ tài khoản</label>
          <input
            name="tenTaiKhoanNH"
            value={employee.tenTaiKhoanNH || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="tab-content">
      <div className="form-section-title">Học vấn</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Trình độ</label>
          <select
            name="maTrinhDoHocVan"
            value={employee.maTrinhDoHocVan || ""}
            onChange={handleChange}
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
          <label>Chuyên ngành</label>
          <select
            name="maChuyenNganh"
            value={employee.maChuyenNganh || ""}
            onChange={handleChange}
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
          <label>Nơi đào tạo</label>
          <input
            name="noiDaoTao"
            value={employee.noiDaoTao || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div className="tab-content">
      <div className="form-section-title">Bảo hiểm</div>
      <div className="form-grid grid-2">
        <div className="form-group">
          <label>Số BHXH</label>
          <input
            name="soBHXH"
            value={employee.soBHXH || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Số BHYT</label>
          <input
            name="soBHYT"
            value={employee.soBHYT || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Nơi ĐK KCB</label>
          <input
            name="noiDKKCB"
            value={employee.noiDKKCB || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <DashboardLayout>
        <p>Đang tải...</p>
      </DashboardLayout>
    );
  if (!employee)
    return (
      <DashboardLayout>
        <h1>Lỗi</h1>
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
        return <div>Chưa cập nhật</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="emp-detail-page">
        <div className="emp-detail-page__header">
          <button
            onClick={() => navigate(-1)}
            className="emp-detail-page__back-btn"
          >
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        <div className="emp-layout-container">
          <div className="emp-layout-header">
            <h1>Cập nhật: {employee.hoTen}</h1>
            <div className="form-group" style={{ width: "200px" }}>
              <select
                name="trangThai"
                value={employee.trangThai}
                onChange={handleChange}
                style={{ height: "36px" }}
              >
                <option value={true}>Đang hoạt động</option>
                <option value={false}>Đã nghỉ việc</option>
              </select>
            </div>
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

          <div className="emp-layout-footer">
            <button className="btn-save" onClick={handleSave}>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeEditPage;
