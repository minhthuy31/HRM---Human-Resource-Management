import React, { useState, useEffect, useCallback } from "react";
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
import "../styles/LeaveManagementPage.css"; // Reuse the CSS you provided

// --- Helper Functions ---
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    v || 0,
  );
const formatTime = (t) => (t ? t.substring(0, 5) : ""); // Format TimeSpan "HH:mm:ss" -> "HH:mm"

const RequestManagementPage = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("LEAVE"); // 'LEAVE', 'OT', 'TRIP'
  const [statusFilter, setStatusFilter] = useState("Chờ duyệt");
  const [deptFilter, setDeptFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- USER INFO & PERMISSIONS ---
  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";

  // Permission Logic:
  // Approve/Reject: Only Manager (of that dept), Director, General Director
  const canApprove = ["Trưởng phòng", "Giám đốc", "Tổng giám đốc"].includes(
    userRole,
  );
  // View All & Filter Dept: Director, General Director, HR, Accountant
  const canViewAllAndFilter = [
    "Giám đốc",
    "Tổng giám đốc",
    "Kế toán trưởng",
    "Nhân sự trưởng",
  ].includes(userRole);

  // --- LOAD DEPARTMENTS (For Filter) ---
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
      // Optional: alert("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, deptFilter, searchTerm]);

  // Debounce search input to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // --- HANDLE ACTIONS (APPROVE/REJECT) ---
  const handleAction = async (id, action) => {
    // action = 'approve' | 'reject'
    const actionText = action === "approve" ? "DUYỆT" : "TỪ CHỐI";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} đơn này?`)) return;

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
      // alert("Thao tác thành công!");
      fetchData(); // Reload data after action
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Có lỗi xảy ra (có thể do không đủ quyền hạn).";
      alert(msg);
    }
  };

  // --- RENDER TABLE ROW CONTENT ---
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
        {/* Column 1: Employee Info */}
        <td>
          <strong>{item.hoTenNhanVien}</strong>
          <br />
          <span style={{ fontSize: "12px", color: "#888" }}>
            {item.maNhanVien}
          </span>
        </td>

        {/* Column 2: Department */}
        <td>{item.tenPhongBan || "---"}</td>

        {/* Column 3+: Dynamic Content based on Tab */}
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
            {/* Remaining Leave Days */}
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

        {/* Status Column */}
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

        {/* Action Column (Only visible if canApprove AND status is Pending) */}
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

        {/* 1. TOP TOOLBAR: Search & Department Filter */}
        <div
          className="filters-bar"
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          {/* Search Box */}
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

          {/* Department Filter (Only for Admin/HR/Accountant) */}
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

        {/* 2. MAIN TABS (Request Types) */}
        <div className="main-tabs">
          <button
            className={activeTab === "LEAVE" ? "active" : ""}
            onClick={() => {
              setActiveTab("LEAVE");
              setStatusFilter("Chờ duyệt"); // Reset filter on tab change
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

        {/* 3. SUB FILTERS (Status Tabs) */}
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

        {/* 4. DATA TABLE */}
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

                  {/* Dynamic Headers based on Active Tab */}
                  {activeTab === "LEAVE" && (
                    <>
                      <th>Lý do</th>
                      <th>Thời gian</th>
                      <th className="text-center">Số ngày</th>
                      <th>File</th>
                      <th className="text-center">Còn lại</th>
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
    </DashboardLayout>
  );
};

export default RequestManagementPage;
