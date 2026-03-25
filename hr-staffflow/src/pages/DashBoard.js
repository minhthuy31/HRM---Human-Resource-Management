import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FaUsers,
  FaUserPlus,
  FaFileContract,
  FaBell,
  FaBirthdayCake,
} from "react-icons/fa";
import "../styles/Dashboard.css";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

// Hàm giải mã JWT Token (ĐÃ FIX LỖI ĐỌC TIẾNG VIỆT CÓ DẤU)
const getUserRole = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Thuật toán decode Base64 hỗ trợ UTF-8 (Tiếng Việt)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    return (
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload.role
    );
  } catch (e) {
    console.error("Lỗi giải mã token:", e);
    return null;
  }
};

// Hàm chuẩn hóa chuỗi
const checkIsTruongPhong = (r) => {
  if (!r) return false;
  const cleanRole = r
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/[đ]/g, "d")
    .replace(/\s+/g, "");
  return cleanRole === "truongphong";
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = getUserRole();
  const isTruongPhong = checkIsTruongPhong(userRole);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/Dashboard/summary");
        setData(response.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard:", err);
        setError("Không thể tải dữ liệu trang chủ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">Đang tải trang chủ...</div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="dashboard-error">{error || "Không có dữ liệu"}</div>
      </DashboardLayout>
    );
  }

  const d = {
    tongNhanVien: data.tongNhanVien ?? 0,
    nhanVienMoiTrongThang: data.nhanVienMoiTrongThang ?? 0,
    hopDongSapHetHan: data.hopDongSapHetHan ?? 0,
    donOTChoDuyet: data.donOTChoDuyet ?? 0,
    nhanSuTheoPhongBan: data.nhanSuTheoPhongBan ?? [],
    sinhNhatTrongThang: data.sinhNhatTrongThang ?? [],
  };

  return (
    <DashboardLayout>
      <div className="dash-page-container">
        <h2 className="dash-welcome-text">
          {isTruongPhong ? "Tổng quan Phòng" : "Tổng quan Hệ thống"}
        </h2>

        {/* HÀNG 1: 4 THẺ CHỈ SỐ NHANH */}
        <div className="dash-cards-grid">
          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-blue">
              <FaUsers />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">
                {/* ĐỔI TEXT THEO Ý BẠN Ở ĐÂY */}
                {isTruongPhong ? "Sĩ số phòng" : "Sĩ số toàn công ty"}
              </span>
              <h3 className="dash-card-value">{d.tongNhanVien}</h3>
            </div>
          </div>

          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-green">
              <FaUserPlus />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">Nhân sự mới (Tháng này)</span>
              <h3 className="dash-card-value">{d.nhanVienMoiTrongThang}</h3>
            </div>
          </div>

          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-orange">
              <FaFileContract />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">HĐ sắp hết hạn (30 ngày)</span>
              <h3 className="dash-card-value dash-text-orange">
                {d.hopDongSapHetHan}
              </h3>
            </div>
          </div>

          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-purple">
              <FaBell />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">
                {isTruongPhong
                  ? "Đơn OT phòng chờ duyệt"
                  : "Tổng đơn OT chờ duyệt"}
              </span>
              <h3 className="dash-card-value">{d.donOTChoDuyet}</h3>
            </div>
          </div>
        </div>

        {/* HÀNG 2: BIỂU ĐỒ & BẢNG TIN */}
        <div className="dash-charts-grid-2">
          {/* Biểu đồ Cơ cấu nhân sự */}
          <div className="dash-chart-box">
            <h4 className="dash-box-title">
              {isTruongPhong
                ? "Quy mô nhân sự"
                : "Cơ cấu nhân sự theo Phòng ban"}
            </h4>
            <div className="dash-chart-wrapper">
              {d.nhanSuTheoPhongBan.length === 0 ? (
                <div className="dash-empty-state">
                  Chưa có dữ liệu phòng ban
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={d.nhanSuTheoPhongBan}
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="soLuong"
                      nameKey="tenPhongBan"
                    >
                      {d.nhanSuTheoPhongBan.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [`${value} người`, "Số lượng"]}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bảng tin: Sinh nhật */}
          <div className="dash-chart-box">
            <h4 className="dash-box-title">
              <FaBirthdayCake
                style={{ color: "#ec4899", marginRight: "8px" }}
              />
              Sinh nhật trong tháng {new Date().getMonth() + 1}
            </h4>
            <div className="dash-list-wrapper">
              {d.sinhNhatTrongThang.length > 0 ? (
                <ul className="dash-custom-list">
                  {d.sinhNhatTrongThang.map((nv, idx) => (
                    <li key={idx}>
                      <div>
                        <span
                          className="dash-list-name"
                          style={{ display: "block" }}
                        >
                          {nv.hoTen}
                        </span>
                        <span
                          className="dash-sub-title"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {nv.tenPhongBan}
                        </span>
                      </div>
                      <span
                        className="dash-list-value"
                        style={{ backgroundColor: "#fce7f3", color: "#db2777" }}
                      >
                        {nv.ngaySinhFormated}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dash-empty-state">
                  {isTruongPhong
                    ? "Không có nhân viên nào trong phòng sinh nhật tháng này."
                    : "Không có nhân viên nào sinh nhật tháng này."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
