import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaUsers,
  FaEllipsisV,
  FaUndo,
  FaBan,
} from "react-icons/fa";
import "../styles/DepartmentPage.css";
import DepartmentModal from "../components/modals/DepartmentModal";
import EmployeeListModal from "../components/modals/EmployeeListModal";

// --- ContextMenu ---
const DepartmentContextMenu = ({
  department,
  onAction,
  onClose,
  x,
  y,
  canModify,
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return (
    <div className="dept-context-menu" style={{ top: y, left: x }}>
      <ul>
        <li onClick={() => onAction("viewEmployees", department)}>
          <FaUsers /> Xem nhân viên
        </li>
        <li onClick={() => onAction("viewDetails", department)}>
          <FaEye /> Xem chi tiết
        </li>

        {/* Chỉ hiện Sửa/Xóa/Kích hoạt nếu có quyền quản lý */}
        {canModify && (
          <>
            <li onClick={() => onAction("edit", department)}>
              <FaEdit /> Chỉnh sửa
            </li>
            {department.trangThai ? (
              <li onClick={() => onAction("disable", department)}>
                <FaTrash /> Vô hiệu hóa
              </li>
            ) : (
              <li onClick={() => onAction("activate", department)}>
                <FaUndo /> Kích hoạt
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
};

const DepartmentPage = () => {
  const [phongBans, setPhongBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("true");
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEmployeeListModalOpen, setIsEmployeeListModalOpen] = useState(false);

  const [activeMenu, setActiveMenu] = useState({ id: null, x: 0, y: 0 });

  // --- LOGIC PHÂN QUYỀN (ĐÃ SỬA) ---
  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";

  // SỬA Ở ĐÂY: Thêm điều kiện userRole === "Giám đốc"
  const isHRManager = userRole === "Nhân sự trưởng" || userRole === "Giám đốc";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("searchTerm", searchTerm);
      if (filterTrangThai !== "") params.append("trangThai", filterTrangThai);

      const url = `/PhongBan?${params.toString()}`;
      const response = await api.get(url);
      setPhongBans(response.data);
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 403 || error.response.status === 401)
      ) {
        setPermissionDenied(true);
        setPhongBans([]);
      } else {
        console.error("Failed to fetch departments", error);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterTrangThai]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  const handleToggleMenu = (e, department) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 200;
    const menuHeight = 170;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth)
      x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight)
      y = window.innerHeight - menuHeight - 10;

    setActiveMenu({ id: department.maPhongBan, x, y });
  };

  const handleAction = (actionType, dept) => {
    setActiveMenu({ id: null, x: 0, y: 0 });

    // --- CHẶN HÀNH ĐỘNG SỬA/XÓA NẾU KHÔNG PHẢI QUẢN LÝ ---
    if (
      (actionType === "edit" ||
        actionType === "disable" ||
        actionType === "activate") &&
      !isHRManager
    ) {
      alert("Bạn không có quyền thực hiện hành động này.");
      return;
    }

    switch (actionType) {
      case "viewEmployees":
        handleViewEmployees(dept);
        break;
      case "viewDetails":
        handleViewDetails(dept);
        break;
      case "edit":
        handleEdit(dept);
        break;
      case "disable":
        handleDisable(dept);
        break;
      case "activate":
        handleActivate(dept);
        break;
      default:
        break;
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleAdd = () => {
    setCurrentDepartment(null);
    setIsEditModalOpen(true);
  };
  const handleViewDetails = (dept) => {
    setCurrentDepartment(dept);
    setIsViewModalOpen(true);
  };
  const handleEdit = (dept) => {
    setCurrentDepartment(dept);
    setIsEditModalOpen(true);
  };
  const handleViewEmployees = (dept) => {
    setCurrentDepartment(dept);
    setIsEmployeeListModalOpen(true);
  };

  const handleDisable = async (dept) => {
    if (
      window.confirm(
        `Bạn có chắc muốn vô hiệu hóa phòng ban ${dept.tenPhongBan}?`,
      )
    ) {
      try {
        await api.post(`/PhongBan/${dept.maPhongBan}/disable`);
        fetchData();
      } catch (error) {
        const message =
          error.response?.status === 403
            ? "Bạn không có quyền thực hiện hành động này."
            : error.response?.data?.message || "Lỗi khi vô hiệu hóa phòng ban.";
        alert(message);
      }
    }
  };

  const handleActivate = async (dept) => {
    if (
      window.confirm(
        `Bạn có chắc muốn kích hoạt lại phòng ban ${dept.tenPhongBan}?`,
      )
    ) {
      try {
        await api.post(`/PhongBan/${dept.maPhongBan}/activate`);
        fetchData();
      } catch (error) {
        const message =
          error.response?.status === 403
            ? "Bạn không có quyền thực hiện hành động này."
            : error.response?.data?.message || "Lỗi khi kích hoạt lại.";
        alert(message);
      }
    }
  };

  const handleSave = async (deptData) => {
    // Chặn ở client trước khi gọi API
    if (!isHRManager) {
      alert("Bạn không có quyền thêm/sửa phòng ban.");
      return;
    }

    try {
      const dataToSave = {
        ...deptData,
        trangThai: deptData.trangThai === "true" || deptData.trangThai === true,
      };
      if (currentDepartment) {
        await api.put(`/PhongBan/${currentDepartment.maPhongBan}`, dataToSave);
      } else {
        await api.post("/PhongBan", dataToSave);
      }
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      const message =
        error.response?.status === 403
          ? "Bạn không có quyền thêm/sửa phòng ban."
          : error.response?.data?.message || "Lưu thất bại!";
      alert(message);
    }
  };

  if (permissionDenied) {
    return (
      <DashboardLayout>
        <div className="dept-page">
          <div className="dept-permission-denied">
            <FaBan size={50} color="#d9534f" />
            <h2>Truy cập bị từ chối</h2>
            <p>Bạn không có quyền xem danh sách phòng ban.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dept-page">
        <div className="dept-header">
          <h1>Quản lý Phòng ban</h1>

          <div className="dept-header-actions">
            <form onSubmit={handleSearchSubmit} className="dept-search-form">
              <div className="dept-search-wrapper">
                <FaSearch className="dept-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </form>

            <div className="dept-filter-wrapper">
              <select
                value={filterTrangThai}
                onChange={(e) => setFilterTrangThai(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Hoạt động</option>
                <option value="false">Vô hiệu hóa</option>
              </select>
            </div>

            {/* Chỉ hiện nút THÊM MỚI nếu có quyền quản lý */}
            {isHRManager && (
              <button onClick={handleAdd} className="dept-add-btn">
                <FaPlus /> Thêm mới
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="dept-table-wrapper">
            <table className="dept-table">
              <thead>
                <tr>
                  <th>Mã phòng ban</th>
                  <th>Tên phòng ban</th>
                  <th>Địa chỉ</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {phongBans.length > 0 ? (
                  phongBans.map((dept) => (
                    <tr key={dept.maPhongBan}>
                      <td>{dept.maPhongBan}</td>
                      <td
                        className="dept-name-cell"
                        onContextMenu={(e) => handleToggleMenu(e, dept)}
                      >
                        {dept.tenPhongBan}
                      </td>
                      <td>{dept.diaChi}</td>
                      <td>{dept.sdt_PhongBan}</td>

                      <td
                        style={{
                          color: dept.trangThai ? "green" : "red",
                        }}
                      >
                        {dept.trangThai ? "Hoạt động" : "Vô hiệu hóa"}
                      </td>
                      <td className="dept-actions-cell">
                        <button
                          className="dept-action-btn"
                          onClick={(e) => handleToggleMenu(e, dept)}
                        >
                          <FaEllipsisV />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeMenu.id && (
        <DepartmentContextMenu
          department={phongBans.find((d) => d.maPhongBan === activeMenu.id)}
          onAction={handleAction}
          onClose={() => setActiveMenu({ id: null, x: 0, y: 0 })}
          x={activeMenu.x}
          y={activeMenu.y}
          canModify={isHRManager} // Truyền quyền xuống Menu
        />
      )}

      {isEditModalOpen && (
        <DepartmentModal
          department={currentDepartment}
          onCancel={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
      {isViewModalOpen && (
        <DepartmentModal
          department={currentDepartment}
          onCancel={() => setIsViewModalOpen(false)}
          isViewOnly={true}
        />
      )}
      {isEmployeeListModalOpen && (
        <EmployeeListModal
          phongBan={currentDepartment}
          onCancel={() => setIsEmployeeListModalOpen(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default DepartmentPage;
