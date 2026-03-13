import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  FaUsers,
  FaFileContract,
  FaMoneyBillWave,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../styles/Dashboard.css";

// Bảng màu cho biểu đồ
const PIE_COLORS = ["#00C49F", "#333333", "#0088FE", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gọi API lấy dữ liệu thống kê
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/Dashboard/summary");
        setData(response.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard:", err);
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Hàm format tiền tệ (VNĐ)
  const formatCurrency = (value) => {
    if (!value) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Trạng thái Loading & Error
  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">Đang tải dữ liệu hệ thống...</div>
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

  // Đảm bảo bắt đúng key (ASP.NET Core thường trả về camelCase)
  const d = {
    tongNhanVien: data.tongNhanVien ?? data.TongNhanVien ?? 0,
    tongLuongKyTruoc: data.tongLuongKyTruoc ?? data.TongLuongKyTruoc ?? 0,
    tongHopDong: data.tongHopDong ?? data.TongHopDong ?? 0,
    hopDongSapHetHan: data.hopDongSapHetHan ?? data.HopDongSapHetHan ?? 0,
    thamNien: data.thamNien ?? data.ThamNien ?? [],
    gioiTinh: data.gioiTinhTheoPhongBan ?? data.GioiTinhTheoPhongBan ?? [],
    luong: data.luongQuaCacKy ?? data.LuongQuaCacKy ?? [],
    ot: data.otTheoPhongBan ?? data.OTTheoPhongBan ?? [],
  };
  // Tính tổng nhân viên có dữ liệu thâm niên
  const totalThamNien = d.thamNien.reduce(
    (sum, item) => sum + (item.soLuong || 0),
    0,
  );

  return (
    <DashboardLayout>
      <div className="dash-page-container">
        {/* HÀNG 1: CARDS */}
        <div className="dash-cards-grid">
          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-blue">
              <FaUsers />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">Tổng số nhân viên</span>
              <h3 className="dash-card-value">{d.tongNhanVien}</h3>
            </div>
          </div>

          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-green">
              <FaMoneyBillWave />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">Tổng lương kỳ trước</span>
              <h3 className="dash-card-value">
                {formatCurrency(d.tongLuongKyTruoc)}
              </h3>
            </div>
          </div>

          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-purple">
              <FaFileContract />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">Hợp đồng có hiệu lực</span>
              <h3 className="dash-card-value">{d.tongHopDong}</h3>
            </div>
          </div>

          <div className="dash-summary-card">
            <div className="dash-icon-box dash-bg-orange">
              <FaExclamationTriangle />
            </div>
            <div className="dash-card-info">
              <span className="dash-card-title">HĐ sắp hết hạn (30 ngày)</span>
              <h3 className="dash-card-value dash-text-orange">
                {d.hopDongSapHetHan}
              </h3>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* HÀNG 2: BIỂU ĐỒ TRÒN & BIỂU ĐỒ CỘT */}
        {/* ========================================== */}
        <div className="dash-charts-grid-2">
          {/* 1. Biểu đồ Donut: Thâm niên */}
          <div className="dash-chart-box">
            <h4 className="dash-box-title">Thâm niên nhân sự</h4>
            <div className="dash-chart-wrapper">
              {/* Kiểm tra nếu tổng = 0 thì hiện chữ, ngược lại vẽ biểu đồ */}
              {totalThamNien === 0 ? (
                <div className="dash-empty-state">
                  Chưa có dữ liệu thâm niên (Chưa cập nhật Ngày vào làm)
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={d.thamNien}
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="soLuong"
                      nameKey="tenThang"
                    >
                      {d.thamNien.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
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

          {/* 2. Biểu đồ Cột: Giới tính */}
          <div className="dash-chart-box">
            <h4 className="dash-box-title">Tỷ lệ giới tính theo phòng ban</h4>
            <div className="dash-chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={d.gioiTinh}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {/* FIX: Thêm angle={-45} và textAnchor="end" để chữ nghiêng không bị đè, height=80 để đủ chỗ cho chữ dài */}
                  <XAxis
                    dataKey="tenPhongBan"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: "20px" }}
                  />
                  <Bar
                    dataKey="nam"
                    name="Nam"
                    fill="#00C49F"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="nu"
                    name="Nữ"
                    fill="#333333"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="khac"
                    name="Khác"
                    fill="#0088FE"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* HÀNG 3: BIỂU ĐỒ ĐƯỜNG & DANH SÁCH */}
        <div className="dash-charts-grid-2">
          <div className="dash-chart-box">
            <h4 className="dash-box-title">Tổng lương chi trả qua các kỳ</h4>
            <div className="dash-chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={d.luong}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="kyLuong" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                    width={60}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="tongTien"
                    name="Tổng lương"
                    stroke="#ef4444"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dash-chart-box">
            <h4 className="dash-box-title">
              Đăng ký làm thêm theo phòng ban <br />
              <span className="dash-sub-title">(Tháng hiện tại)</span>
            </h4>
            <div className="dash-list-wrapper">
              {d.ot.length > 0 ? (
                <ul className="dash-custom-list">
                  {d.ot.map((item, idx) => (
                    <li key={idx}>
                      <span className="dash-list-name">{item.tenPhongBan}</span>
                      <span className="dash-list-value">
                        {item.tongSoGio} giờ
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dash-empty-state">
                  Không có dữ liệu OT tháng này
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
