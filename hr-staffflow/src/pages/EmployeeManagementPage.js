import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaUserCircle,
  FaSearch,
  FaEllipsisV,
  FaDownload,
  FaUpload,
  FaPenNib, // Icon cho chữ ký
} from "react-icons/fa";
import "../styles/EmployeePage.css";
import EmployeeModal from "../components/modals/EmployeeModal";
import * as XLSX from "xlsx";
import SignatureModal from "../components/modals/SignatureModal"; // Import Modal Ký tên

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("blob:")) return path;
  return `http://localhost:5260${path}`;
};

// --- ContextMenu ---
const ContextMenu = ({ employee, onAction, onClose, x, y, canModify }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return (
    <div className="context-menu" style={{ top: y, left: x }}>
      <ul>
        <li onClick={() => onAction("view", employee)}>
          <FaEye /> Xem chi tiết
        </li>
        {/* Chỉ hiện chức năng sửa/xóa nếu có quyền */}
        {canModify && (
          <>
            <li onClick={() => onAction("edit", employee)}>
              <FaEdit /> Chỉnh sửa
            </li>
            {/* THÊM MỤC CẬP NHẬT CHỮ KÝ */}
            <li onClick={() => onAction("signature", employee)}>
              <FaPenNib /> Cập nhật chữ ký
            </li>
            <li onClick={() => onAction("delete", employee)}>
              <FaTrash /> Vô hiệu hóa
            </li>
          </>
        )}
      </ul>
      <hr />
      <ul>
        <li onClick={() => onAction("view-external", employee)}>
          <FaEye /> Xem chi tiết ngoài
        </li>
        {canModify && (
          <li onClick={() => onAction("edit-external", employee)}>
            <FaEdit /> Chỉnh sửa ngoài
          </li>
        )}
      </ul>
    </div>
  );
};

// --- COMPONENT TRANG CHÍNH ---
const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [phongBans, setPhongBans] = useState([]);
  const [chucVus, setChucVus] = useState([]);
  const [chuyenNganhs, setChuyenNganhs] = useState([]);
  const [trinhDoHocVans, setTrinhDoHocVans] = useState([]);
  const [hopDongs, setHopDongs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO CHỮ KÝ ---
  const [showSigModal, setShowSigModal] = useState(false);
  const [selectedEmpForSig, setSelectedEmpForSig] = useState(null);

  // --- LOGIC PHÂN QUYỀN ---
  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";
  const isHRManager = userRole === "Nhân sự trưởng" || userRole === "Giám đốc";

  const [activeMenu, setActiveMenu] = useState({
    id: null,
    x: 0,
    y: 0,
  });

  const [modal, setModal] = useState({ type: null, data: null });

  const [filters, setFilters] = useState({
    selectedPhongBan: "",
    searchTerm: "",
    selectedChucVu: "",
    selectedTrangThai: "true",
    selectedTrinhDo: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.selectedPhongBan)
        params.append("maPhongBan", filters.selectedPhongBan);
      if (filters.selectedChucVu)
        params.append("maChucVuNV", filters.selectedChucVu);
      if (filters.selectedTrangThai !== "")
        params.append("trangthai", filters.selectedTrangThai);
      if (filters.selectedTrinhDo)
        params.append("maTrinhDoHocVan", filters.selectedTrinhDo);
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
      const employeeUrl = `/NhanVien?${params.toString()}`;

      const [empRes, pbRes, cvRes, cnRes, tdRes, hdRes, mgrRes] =
        await Promise.all([
          api.get(employeeUrl),
          api.get("/PhongBan"),
          api.get("/ChucVuNhanVien"),
          api.get("/ChuyenNganh"),
          api.get("/TrinhDoHocVan"),
          api.get("/HopDong"),
          api.get("/NhanVien/managers"),
        ]);

      setEmployees(empRes.data);
      setPhongBans(pbRes.data);
      setChucVus(cvRes.data);
      setChuyenNganhs(cnRes.data);
      setTrinhDoHocVans(tdRes.data);
      setHopDongs(hdRes.data);
      setManagers(mgrRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      if (error.response && error.response.status === 403) {
        alert("Bạn không có quyền truy cập dữ liệu này.");
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu({ id: null, x: 0, y: 0 });
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSearchChange = (e) =>
    setFilters((f) => ({ ...f, searchTerm: e.target.value }));
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleToggleMenu = (e, employee) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 200;
    const menuHeight = 200;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setActiveMenu({ id: employee.maNhanVien, x, y });
  };

  // --- HÀM MỞ MODAL KÝ TÊN ---
  const openSignatureModal = (employee) => {
    setSelectedEmpForSig(employee);
    setShowSigModal(true);
  };

  // --- HÀM LƯU CHỮ KÝ (GỌI API) ---
  const handleSaveSignature = async (base64String) => {
    if (!selectedEmpForSig) return;

    try {
      await api.post("/NhanVien/save-signature-base64", {
        maNhanVien: selectedEmpForSig.maNhanVien,
        base64Image: base64String,
      });

      alert("Đã cập nhật chữ ký thành công!");
      setShowSigModal(false);
      fetchData(); // Load lại để update data mới nhất
    } catch (err) {
      console.error(err);
      alert("Lỗi lưu chữ ký: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (actionType, employee) => {
    setActiveMenu({ id: null, x: 0, y: 0 });

    if (actionType === "view") {
      try {
        const response = await api.get(`/NhanVien/${employee.maNhanVien}`);
        setModal({ type: "view", data: response.data });
      } catch (error) {
        alert("Không thể tải dữ liệu để xem.");
      }
      return;
    }

    // --- CHECK QUYỀN TRƯỚC KHI THỰC HIỆN ACTION ---
    if (
      (actionType === "edit" ||
        actionType === "delete" ||
        actionType === "edit-external" ||
        actionType === "signature") && // Thêm quyền signature
      !isHRManager
    ) {
      alert("Bạn không có quyền thực hiện chức năng này.");
      return;
    }

    // Xử lý mở Modal Ký tên
    if (actionType === "signature") {
      openSignatureModal(employee);
      return;
    }

    if (actionType === "edit") {
      try {
        const response = await api.get(`/NhanVien/${employee.maNhanVien}`);
        setModal({ type: "edit", data: response.data });
      } catch (error) {
        alert("Không thể tải dữ liệu để sửa.");
      }
      return;
    }

    if (actionType === "delete") {
      if (
        window.confirm(
          `Bạn có chắc muốn vô hiệu hóa nhân viên ${employee.hoTen}?`,
        )
      ) {
        try {
          await api.delete(`/NhanVien/${employee.maNhanVien}`);
          fetchData();
        } catch (error) {
          alert(error.response?.data?.message || "Lỗi khi vô hiệu hóa.");
        }
      }
      return;
    }

    if (actionType === "view-external") {
      window.open(`/nhan-vien/${employee.maNhanVien}`, "_blank");
      return;
    }

    if (actionType === "edit-external") {
      window.open(`/nhan-vien/${employee.maNhanVien}/edit`, "_blank");
      return;
    }
  };

  const handleSave = async (employeeData, imageFile) => {
    if (!isHRManager) {
      alert("Bạn không có quyền lưu thay đổi.");
      return;
    }

    const dataToSave = {
      ...employeeData,
      trangThai: employeeData.trangThai.toString() === "true",
    };
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await api.post("/NhanVien/UploadImage", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        dataToSave.hinhAnh = uploadRes.data.filePath;
      }
      if (modal.data) {
        await api.put(`/NhanVien/${modal.data.maNhanVien}`, dataToSave);
      } else {
        await api.post("/NhanVien", dataToSave);
      }
      setModal({ type: null, data: null });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.errors
        ? JSON.stringify(error.response.data.errors)
        : error.response?.data?.message || "Lưu thất bại!";
      alert(errorMsg);
    }
  };

  // ... (Giữ nguyên các hàm handleExportExcel, handleImportExcel, findIdByName, excelDateToJSDate) ...
  const handleExportExcel = () => {
    if (employees.length === 0) {
      alert("Không có dữ liệu nhân viên để xuất.");
      return;
    }
    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("vi-VN");
    };

    const dataToExport = employees.map((emp) => {
      return {
        "Mã NV": emp.maNhanVien,
        "Họ Tên": emp.hoTen,
        Email: emp.email,
        SĐT: emp.sdt_NhanVien,
        "Giới Tính": emp.gioiTinh === 1 ? "Nam" : "Nữ",
        "Ngày Sinh": formatDate(emp.ngaySinh),
        "Dân Tộc": emp.danToc,
        "Tôn Giáo": emp.tonGiao,
        "Quốc Tịch": emp.quocTich,
        "Nơi Sinh": emp.noiSinh,
        "Tình Trạng Hôn Nhân": emp.tinhTrangHonNhan,
        "Quê Quán": emp.queQuan,
        "Địa Chỉ Thường Trú": emp.diaChiThuongTru,
        "Phường/Xã TT": emp.phuongXaThuongTru,
        "Quận/Huyện TT": emp.quanHuyenThuongTru,
        "Tỉnh/Thành TT": emp.tinhThanhThuongTru,
        "Quốc Gia TT": emp.quocGiaThuongTru,
        "Địa Chỉ Tạm Trú": emp.diaChiTamTru,
        CCCD: emp.cccd,
        "Ngày Cấp CCCD": formatDate(emp.ngayCapCCCD),
        "Nơi Cấp CCCD": emp.noiCapCCCD,
        "Ngày Hết Hạn CCCD": formatDate(emp.ngayHetHanCCCD),
        "Số Hộ Chiếu": emp.soHoChieu,
        "Ngày Cấp HC": formatDate(emp.ngayCapHoChieu),
        "Nơi Cấp HC": emp.noiCapHoChieu,
        "Ngày Hết Hạn HC": formatDate(emp.ngayHetHanHoChieu),
        "Loại Nhân Viên": emp.loaiNhanVien,
        "Trạng Thái": emp.trangThai ? "Hoạt động" : "Đã nghỉ",
        "Phòng Ban": emp.tenPhongBan,
        "Chức Vụ": emp.tenChucVu,
        "Quản Lý Trực Tiếp": emp.tenQuanLyTrucTiep,
        "Ngày Vào Làm": formatDate(emp.ngayVaoLam),
        "Ngày Nghỉ Việc": formatDate(emp.ngayNghiViec),
        "Trình Độ": emp.tenTrinhDoHocVan,
        "Chuyên Ngành": emp.tenChuyenNganh,
        "Nơi Đào Tạo": emp.noiDaoTao,
        "Hệ Đào Tạo": emp.heDaoTao,
        "Số Tài Khoản NH": emp.soTaiKhoanNH,
        "Tên Ngân Hàng": emp.tenNganHang,
        "Tên Tài Khoản NH": emp.tenTaiKhoanNH,
        "Số BHYT": emp.soBHYT,
        "Số BHXH": emp.soBHXH,
        "Nơi ĐK KCB": emp.noiDKKCB,
        "Người Liên Hệ KC": emp.nguoiLienHeKhanCap,
        "SĐT KC": emp.sdtKhanCap,
        "Quan Hệ KC": emp.quanHeKhanCap,
        "Địa Chỉ KC": emp.diaChiKhanCap,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const cols = Object.keys(dataToExport[0]).map(() => ({ wch: 20 }));
    ws["!cols"] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachNhanVien");
    const fileName = `DanhSachNhanVien_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const findIdByName = (list, name, nameField, idField) => {
    if (!name) return null;
    const item = list.find(
      (i) => i[nameField]?.toLowerCase() === name.toLowerCase(),
    );
    return item ? item[idField] : null;
  };

  const excelDateToJSDate = (serial) => {
    if (typeof serial === "number") {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return new Date(
        date_info.getFullYear(),
        date_info.getMonth(),
        date_info.getDate() + 1,
      );
    } else if (typeof serial === "string") {
      const parts = serial.split("/");
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    return null;
  };

  const handleImportExcel = (e) => {
    if (!isHRManager) {
      alert("Bạn không có quyền nhập dữ liệu.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const employeesToImport = json.map((row) => {
          const maPB = findIdByName(
            phongBans,
            row["Phòng Ban"],
            "tenPhongBan",
            "maPhongBan",
          );
          const maCV = findIdByName(
            chucVus,
            row["Chức Vụ"],
            "tenChucVu",
            "maChucVuNV",
          );
          const maTD = findIdByName(
            trinhDoHocVans,
            row["Trình Độ"],
            "tenTrinhDo",
            "maTrinhDoHocVan",
          );
          const maCN = findIdByName(
            chuyenNganhs,
            row["Chuyên Ngành"],
            "tenChuyenNganh",
            "maChuyenNganh",
          );

          return {
            hoTen: row["Họ Tên"],
            email: row["Email"],
            sdt_NhanVien: row["SĐT"],
            gioiTinh: row["Giới Tính"] === "Nam" ? 1 : 0,
            ngaySinh: excelDateToJSDate(row["Ngày Sinh"]),
            danToc: row["Dân Tộc"],
            tonGiao: row["Tôn Giáo"],
            quocTich: row["Quốc Tịch"],
            noiSinh: row["Nơi Sinh"],
            tinhTrangHonNhan: row["Tình Trạng Hôn Nhân"],
            queQuan: row["Quê Quán"],
            diaChiThuongTru: row["Địa Chỉ Thường Trú"],
            phuongXaThuongTru: row["Phường/Xã TT"],
            quanHuyenThuongTru: row["Quận/Huyện TT"],
            tinhThanhThuongTru: row["Tỉnh/Thành TT"],
            quocGiaThuongTru: row["Quốc Gia TT"],
            diaChiTamTru: row["Địa Chỉ Tạm Trú"],
            cccd: row["CCCD"],
            ngayCapCCCD: excelDateToJSDate(row["Ngày Cấp CCCD"]),
            noiCapCCCD: row["Nơi Cấp CCCD"],
            ngayHetHanCCCD: excelDateToJSDate(row["Ngày Hết Hạn CCCD"]),
            soHoChieu: row["Số Hộ Chiếu"],
            ngayCapHoChieu: excelDateToJSDate(row["Ngày Cấp HC"]),
            noiCapHoChieu: row["Nơi Cấp HC"],
            ngayHetHanHoChieu: excelDateToJSDate(row["Ngày Hết Hạn HC"]),
            loaiNhanVien: row["Loại Nhân Viên"],
            maPhongBan: maPB,
            maChucVuNV: maCV,
            maTrinhDoHocVan: maTD,
            maChuyenNganh: maCN,
            soTaiKhoanNH: row["Số Tài Khoản NH"],
            tenNganHang: row["Tên Ngân Hàng"],
            tenTaiKhoanNH: row["Tên Tài Khoản NH"],
            soBHYT: row["Số BHYT"],
            soBHXH: row["Số BHXH"],
            noiDKKCB: row["Nơi ĐK KCB"],
            nguoiLienHeKhanCap: row["Người Liên Hệ KC"],
            sdtKhanCap: row["SĐT KC"],
            quanHeKhanCap: row["Quan Hệ KC"],
            diaChiKhanCap: row["Địa Chỉ KC"],
            trangThai: row["Trạng Thái"]
              ? row["Trạng Thái"].toLowerCase() === "hoạt động"
              : true,
            matKhau: "123456",
          };
        });

        const validEmployees = employeesToImport.filter(
          (emp) => emp.maPhongBan && emp.maChucVuNV && emp.hoTen,
        );
        const invalidCount = employeesToImport.length - validEmployees.length;

        if (invalidCount > 0)
          alert(
            `Cảnh báo: ${invalidCount} nhân viên không thể nhập do thiếu/sai tên.`,
          );
        if (validEmployees.length === 0) {
          alert("Không có nhân viên nào hợp lệ để nhập.");
          setLoading(false);
          return;
        }

        const response = await api.post("/NhanVien/import", validEmployees);
        alert(response.data.message);
        fetchData();
      } catch (err) {
        console.error("Lỗi khi nhập Excel:", err);
        alert(
          "Đã xảy ra lỗi khi đọc hoặc gửi file. " +
            (err.response?.data?.message || ""),
        );
      } finally {
        setLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <DashboardLayout>
      <div className="employee-page">
        <div className="page-header">
          <div className="header-top-row">
            <h1>Quản lý nhân viên</h1>
            <div className="header-actions">
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={filters.searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </form>

              <div className="action-buttons-group">
                {isHRManager && (
                  <>
                    <button
                      onClick={() =>
                        document.getElementById("import-excel-input").click()
                      }
                      className="add-btn btn-import"
                    >
                      <FaUpload /> Nhập
                    </button>
                    <input
                      type="file"
                      id="import-excel-input"
                      style={{ display: "none" }}
                      accept=".xlsx, .xls"
                      onChange={handleImportExcel}
                    />
                  </>
                )}

                <button
                  onClick={handleExportExcel}
                  className="add-btn btn-export"
                >
                  <FaDownload /> Xuất
                </button>

                {isHRManager && (
                  <button
                    onClick={() => setModal({ type: "edit", data: null })}
                    className="add-btn btn-add"
                  >
                    <FaPlus /> Thêm mới
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="header-bottom-row">
            <div className="filter-item">
              <select
                name="selectedPhongBan"
                value={filters.selectedPhongBan}
                onChange={handleFilterChange}
              >
                <option value="">-- Tất cả phòng ban --</option>
                {phongBans.map((pb) => (
                  <option key={pb.maPhongBan} value={pb.maPhongBan}>
                    {pb.tenPhongBan}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <select
                name="selectedChucVu"
                value={filters.selectedChucVu}
                onChange={handleFilterChange}
              >
                <option value="">-- Tất cả chức vụ --</option>
                {chucVus.map((cv) => (
                  <option key={cv.maChucVuNV} value={cv.maChucVuNV}>
                    {cv.tenChucVu}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <select
                name="selectedTrangThai"
                value={filters.selectedTrangThai}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Hoạt động</option>
                <option value="false">Đã nghỉ</option>
              </select>
            </div>
            <div className="filter-item">
              <select
                name="selectedTrinhDo"
                value={filters.selectedTrinhDo}
                onChange={handleFilterChange}
              >
                <option value="">-- Tất cả trình độ --</option>
                {trinhDoHocVans.map((td) => (
                  <option key={td.maTrinhDoHocVan} value={td.maTrinhDoHocVan}>
                    {td.tenTrinhDo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Họ tên</th>
                  <th>Mã NV</th>
                  <th>Chức vụ</th>
                  <th>Phòng ban</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.maNhanVien}>
                    <td>
                      {emp.hinhAnh ? (
                        <img
                          src={getImageUrl(emp.hinhAnh)}
                          alt={emp.hoTen}
                          className="table-avatar"
                        />
                      ) : (
                        <FaUserCircle size={30} />
                      )}
                    </td>
                    <td
                      onContextMenu={(e) => handleToggleMenu(e, emp)}
                      className="employee-name-cell"
                    >
                      {emp.hoTen}
                    </td>
                    <td>{emp.maNhanVien}</td>
                    <td>{emp.tenChucVu}</td>
                    <td>{emp.tenPhongBan}</td>
                    <td style={{ color: emp.trangThai ? "green" : "red" }}>
                      {emp.trangThai ? "Hoạt động" : "Đã nghỉ"}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn"
                        onClick={(e) => handleToggleMenu(e, emp)}
                      >
                        <FaEllipsisV />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {activeMenu.id && (
        <ContextMenu
          employee={employees.find((e) => e.maNhanVien === activeMenu.id)}
          onAction={handleAction}
          onClose={() => setActiveMenu({ id: null, x: 0, y: 0 })}
          x={activeMenu.x}
          y={activeMenu.y}
          canModify={isHRManager}
        />
      )}

      {modal.type && (
        <EmployeeModal
          employee={modal.data}
          onCancel={() => setModal({ type: null, data: null })}
          onSave={handleSave}
          isViewOnly={modal.type === "view" || !isHRManager}
          phongBans={phongBans}
          chucVus={chucVus}
          chuyenNganhs={chuyenNganhs}
          trinhDoHocVans={trinhDoHocVans}
          hopDongs={hopDongs}
          managers={managers}
        />
      )}

      {/* RENDER MODAL KÝ TÊN */}
      {showSigModal && (
        <SignatureModal
          onSave={handleSaveSignature}
          onCancel={() => setShowSigModal(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default EmployeePage;
