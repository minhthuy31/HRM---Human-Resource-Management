import React, { useState, useEffect, useCallback, useRef } from "react";
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

// --- Custom Confirm Modal ---
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-confirm-modal">
        <h3 className="confirm-title">Xác nhận</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn-accept" onClick={onConfirm}>
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // --- LOGIC PHÂN QUYỀN ---
  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";
  const isHRManager = userRole === "Nhân sự trưởng" || userRole === "Giám đốc";

  // --- TOAST STATE ---
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // --- CONFIRM MODAL STATE ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
  };

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
        showToast("Bạn không có quyền xem danh sách phòng ban.", "error");
      } else {
        console.error("Failed to fetch departments", error);
        showToast("Lỗi khi tải dữ liệu phòng ban.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterTrangThai, showToast]);

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

    if (
      (actionType === "edit" ||
        actionType === "disable" ||
        actionType === "activate") &&
      !isHRManager
    ) {
      showToast("Bạn không có quyền thực hiện hành động này.", "error");
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
    setConfirmDialog({
      isOpen: true,
      message: `Bạn có chắc muốn vô hiệu hóa phòng ban ${dept.tenPhongBan}?`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.post(`/PhongBan/${dept.maPhongBan}/disable`);
          showToast("Vô hiệu hóa phòng ban thành công!", "success");
          fetchData();
        } catch (error) {
          const message =
            error.response?.status === 403
              ? "Bạn không có quyền thực hiện hành động này."
              : error.response?.data?.message ||
                "Lỗi khi vô hiệu hóa phòng ban.";
          showToast(message, "error");
        }
      },
    });
  };

  const handleActivate = async (dept) => {
    setConfirmDialog({
      isOpen: true,
      message: `Bạn có chắc muốn kích hoạt lại phòng ban ${dept.tenPhongBan}?`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.post(`/PhongBan/${dept.maPhongBan}/activate`);
          showToast("Kích hoạt lại phòng ban thành công!", "success");
          fetchData();
        } catch (error) {
          const message =
            error.response?.status === 403
              ? "Bạn không có quyền thực hiện hành động này."
              : error.response?.data?.message || "Lỗi khi kích hoạt lại.";
          showToast(message, "error");
        }
      },
    });
  };

  const handleSave = async (deptData) => {
    if (!isHRManager) {
      showToast("Bạn không có quyền thêm/sửa phòng ban.", "error");
      return;
    }

    const cleanData = { ...deptData };
    for (let key in cleanData) {
      if (cleanData[key] === "") {
        cleanData[key] = null;
      }
    }

    const isTrangThaiActive =
      deptData.trangThai !== undefined
        ? deptData.trangThai === "true" || deptData.trangThai === true
        : true;

    const dataToSave = {
      ...cleanData,
      trangThai: isTrangThaiActive,
    };

    try {
      if (currentDepartment) {
        await api.put(`/PhongBan/${currentDepartment.maPhongBan}`, dataToSave);
        showToast("Cập nhật phòng ban thành công!", "success");
      } else {
        dataToSave.maPhongBan = "NEW_PB";
        await api.post("/PhongBan", dataToSave);
        showToast("Thêm phòng ban mới thành công!", "success");
      }

      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Lỗi chi tiết từ Backend:", error.response?.data);

      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors)
          .flat()
          .join("\n");
        showToast("Dữ liệu không hợp lệ:\n" + errorMessages, "error");
      } else {
        const message =
          error.response?.status === 403
            ? "Bạn không có quyền thêm/sửa phòng ban."
            : error.response?.data?.message ||
              (typeof error.response?.data === "string"
                ? error.response?.data
                : "Lưu thất bại!");
        showToast(message, "error");
      }
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
        {/* TOAST COMPONENT FOR DENIED STATE */}
        <div
          className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
        >
          {toast.message}
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
          canModify={isHRManager}
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

      {/* --- CONFIRM MODAL --- */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* --- TOAST COMPONENT --- */}
      <div
        className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
      >
        {toast.message}
      </div>
    </DashboardLayout>
  );
};

export default DepartmentPage;
