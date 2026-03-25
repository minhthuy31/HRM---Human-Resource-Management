import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaCheck,
  FaTimes,
  FaSearch,
  FaFileDownload,
  FaPlane,
  FaClock,
  FaUmbrellaBeach,
} from "react-icons/fa";
import "../styles/LeaveManagementPage.css";

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

// --- Helper Functions ---
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    v || 0,
  );
const formatTime = (t) => (t ? t.substring(0, 5) : "");

const RequestManagementPage = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("LEAVE"); // 'LEAVE', 'OT', 'TRIP'
  const [statusFilter, setStatusFilter] = useState("Chờ duyệt");
  const [deptFilter, setDeptFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // --- USER INFO & PERMISSIONS ---
  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";

  const canApprove = ["Trưởng phòng", "Giám đốc", "Tổng giám đốc"].includes(
    userRole,
  );

  const canViewAllAndFilter = [
    "Giám đốc",
    "Tổng giám đốc",
    "Kế toán trưởng",
    "Nhân sự trưởng",
  ].includes(userRole);

  // --- LOAD DEPARTMENTS ---
  useEffect(() => {
    if (canViewAllAndFilter) {
      api
        .get("/PhongBan")
        .then((res) => setDepartments(res.data))
        .catch((err) => console.error("Error loading departments:", err));
    }
  }, [canViewAllAndFilter]);

  // --- FETCH DATA FUNCTION ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("trangThai", statusFilter);
      if (deptFilter) params.append("maPhongBan", deptFilter);
      if (searchTerm) params.append("searchTerm", searchTerm);

      let endpoint = "";
      switch (activeTab) {
        case "LEAVE":
          endpoint = "/DonNghiPhep";
          break;
        case "OT":
          endpoint = "/DangKyOT";
          break;
        case "TRIP":
          endpoint = "/DangKyCongTac";
          break;
        default:
          return;
      }

      const response = await api.get(`${endpoint}?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Không thể tải dữ liệu đơn từ.", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, deptFilter, searchTerm, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // --- HANDLE ACTIONS (APPROVE/REJECT) ---
  const handleAction = (id, action) => {
    const actionText = action === "approve" ? "DUYỆT" : "TỪ CHỐI";

    setConfirmDialog({
      isOpen: true,
      message: `Bạn có chắc chắn muốn ${actionText} đơn này?`,
      onConfirm: async () => {
        closeConfirm();
        let endpointPrefix = "";
        switch (activeTab) {
          case "LEAVE":
            endpointPrefix = "/DonNghiPhep";
            break;
          case "OT":
            endpointPrefix = "/DangKyOT";
            break;
          case "TRIP":
            endpointPrefix = "/DangKyCongTac";
            break;
          default:
            return;
        }

        try {
          await api.post(`${endpointPrefix}/${action}/${id}`);
          showToast(
            `Đã ${actionText.toLowerCase()} đơn thành công!`,
            "success",
          );
          fetchData();
        } catch (error) {
          const msg =
            error.response?.data?.message ||
            "Có lỗi xảy ra (có thể do không đủ quyền hạn).";
          showToast(msg, "error");
        }
      },
    });
  };

  // --- RENDER TABLE BODY ---
  const renderTableBody = () => {
    if (data.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="no-data">
            Không có dữ liệu.
          </td>
        </tr>
      );
    }

    return data.map((item) => (
      <tr key={item.id}>
        <td>
          <strong>{item.hoTenNhanVien}</strong>
          <br />
          <span style={{ fontSize: "12px", color: "#888" }}>
            {item.maNhanVien}
          </span>
        </td>

        <td>{item.tenPhongBan || "---"}</td>

        {activeTab === "LEAVE" && (
          <>
            <td className="reason-cell">{item.lyDo}</td>
            <td>
              {formatDate(item.ngayBatDau)} - {formatDate(item.ngayKetThuc)}
            </td>
            <td className="text-center font-bold">{item.soNgayNghi}</td>
            <td>
              {item.tepDinhKem ? (
                <a
                  href={`http://localhost:5260${item.tepDinhKem}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#0e7c7b",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FaFileDownload /> Xem
                </a>
              ) : (
                "-"
              )}
            </td>
            <td
              className="text-center"
              style={{
                color: item.remainingLeaveDays < 0 ? "red" : "green",
                fontWeight: "bold",
              }}
            >
              {item.remainingLeaveDays}
            </td>
          </>
        )}

        {activeTab === "OT" && (
          <>
            <td className="reason-cell">{item.lyDo}</td>
            <td>{formatDate(item.ngayLamThem)}</td>
            <td>
              {formatTime(item.gioBatDau)} - {formatTime(item.gioKetThuc)}
            </td>
            <td className="text-center font-bold" style={{ color: "#6f42c1" }}>
              {item.soGio ? item.soGio.toFixed(1) : 0}h
            </td>
            <td>-</td>
          </>
        )}

        {activeTab === "TRIP" && (
          <>
            <td>
              <div style={{ fontWeight: "500" }}>{item.noiCongTac}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {item.phuongTien}
              </div>
            </td>
            <td className="reason-cell">{item.mucDich}</td>
            <td>
              {formatDate(item.ngayBatDau)} <br />
              <small>đến</small> <br />
              {formatDate(item.ngayKetThuc)}
            </td>
            <td>
              <div style={{ fontSize: "12px" }}>
                <div>DK: {formatMoney(item.kinhPhiDuKien)}</div>
                <div style={{ color: "#d97706", fontWeight: "500" }}>
                  Tạm ứng: {formatMoney(item.soTienTamUng)}
                </div>
                {item.lyDoTamUng && (
                  <div style={{ fontStyle: "italic", color: "#888" }}>
                    ({item.lyDoTamUng})
                  </div>
                )}
              </div>
            </td>
            <td>-</td>
          </>
        )}

        <td>
          <span
            className={`status-badge ${
              item.trangThai === "Chờ duyệt"
                ? "pending"
                : item.trangThai === "Đã duyệt"
                  ? "approved"
                  : "rejected"
            }`}
          >
            {item.trangThai}
          </span>
        </td>

        {canApprove && (
          <td>
            {item.trangThai === "Chờ duyệt" && (
              <div className="action-buttons">
                <button
                  className="approve-btn"
                  title="Duyệt"
                  onClick={() => handleAction(item.id, "approve")}
                >
                  <FaCheck />
                </button>
                <button
                  className="reject-btn"
                  title="Từ chối"
                  onClick={() => handleAction(item.id, "reject")}
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </td>
        )}
      </tr>
    ));
  };

  return (
    <DashboardLayout>
      <div className="leave-management-container">
        <h1>Quản lý Đơn từ & Yêu cầu</h1>

        <div
          className="filters-bar"
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          <div
            className="search-box"
            style={{ position: "relative", flex: 1, minWidth: "250px" }}
          >
            <FaSearch
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#888",
              }}
            />
            <input
              type="text"
              placeholder="Tìm tên nhân viên hoặc mã NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px 10px 35px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                height: "40px",
              }}
            />
          </div>

          {canViewAllAndFilter && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: "0 10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                minWidth: "200px",
                height: "40px",
              }}
            >
              <option value="">-- Tất cả phòng ban --</option>
              {departments.map((d) => (
                <option key={d.maPhongBan} value={d.maPhongBan}>
                  {d.tenPhongBan}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="main-tabs">
          <button
            className={activeTab === "LEAVE" ? "active" : ""}
            onClick={() => {
              setActiveTab("LEAVE");
              setStatusFilter("Chờ duyệt");
            }}
          >
            <FaUmbrellaBeach style={{ marginRight: 8 }} /> Nghỉ Phép
          </button>
          <button
            className={activeTab === "OT" ? "active" : ""}
            onClick={() => {
              setActiveTab("OT");
              setStatusFilter("Chờ duyệt");
            }}
          >
            <FaClock style={{ marginRight: 8 }} /> Tăng Ca (OT)
          </button>
          <button
            className={activeTab === "TRIP" ? "active" : ""}
            onClick={() => {
              setActiveTab("TRIP");
              setStatusFilter("Chờ duyệt");
            }}
          >
            <FaPlane style={{ marginRight: 8 }} /> Công Tác
          </button>
        </div>

        <div className="sub-filters">
          {[
            { key: "Chờ duyệt", label: "Chờ duyệt" },
            { key: "Đã duyệt", label: "Đã duyệt" },
            { key: "Từ chối", label: "Từ chối" },
            { key: "", label: "Tất cả" },
          ].map((st) => (
            <button
              key={st.key}
              className={statusFilter === st.key ? "active" : ""}
              onClick={() => setStatusFilter(st.key)}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="requests-table-container">
          {loading ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#666" }}
            >
              Đang tải dữ liệu...
            </div>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th style={{ width: "180px" }}>Nhân viên</th>
                  <th style={{ width: "150px" }}>Phòng ban</th>

                  {activeTab === "LEAVE" && (
                    <>
                      <th>Lý do</th>
                      <th>Thời gian</th>
                      <th className="text-center">Số ngày</th>
                      <th>File</th>
                      <th className="text-center">Phép còn lại</th>
                    </>
                  )}
                  {activeTab === "OT" && (
                    <>
                      <th>Lý do OT</th>
                      <th>Ngày làm</th>
                      <th>Khung giờ</th>
                      <th className="text-center">Tổng giờ</th>
                      <th>-</th>
                    </>
                  )}
                  {activeTab === "TRIP" && (
                    <>
                      <th>Nơi đến / P.Tiện</th>
                      <th>Mục đích</th>
                      <th>Thời gian</th>
                      <th>Kinh phí</th>
                      <th>-</th>
                    </>
                  )}

                  <th style={{ width: "100px" }}>Trạng thái</th>
                  {canApprove && <th style={{ width: "100px" }}>Hành động</th>}
                </tr>
              </thead>
              <tbody>{renderTableBody()}</tbody>
            </table>
          )}
        </div>
      </div>

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

export default RequestManagementPage;
