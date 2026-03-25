import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import {
  FaFileExcel,
  FaFilter,
  FaChartBar,
  FaUserPlus,
  FaClock,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";
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
import "../styles/ReportsPage.css";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

// Hàm giải mã JWT Token để lấy chức vụ (Role) hiện tại
const getUserRole = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
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
    return null;
  }
};

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

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("thongKe");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPhongBan, setSelectedPhongBan] = useState("");
  const [phongBans, setPhongBans] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Xác định Role
  const userRole = getUserRole();
  const isTruongPhong = checkIsTruongPhong(userRole);

  useEffect(() => {
    const fetchPhongBans = async () => {
      try {
        const res = await api.get("/PhongBan");
        setPhongBans(res.data.filter((pb) => pb.trangThai === true));
      } catch (err) {
        console.error("Lỗi lấy phòng ban:", err);
      }
    };
    if (!isTruongPhong) {
      fetchPhongBans(); // Chỉ load danh sách phòng ban nếu ko phải Trưởng phòng
    }
  }, [isTruongPhong]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/BaoCao/tong-hop?month=${month}&year=${year}`);
      setData(res.data);
    } catch (error) {
      console.error("Lỗi báo cáo:", error);
      alert("Bạn không có quyền truy cập hoặc hệ thống bị lỗi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleExportExcel = () => {
    if (!data) return;
    let fileName = "";
    const workbook = XLSX.utils.book_new();

    // Nếu là trưởng phòng thì bỏ qua filter (Backend đã tự lo việc này)
    const filterData = (arr) => {
      if (isTruongPhong) return arr;
      return selectedPhongBan
        ? arr.filter((x) => x.maPhongBan === selectedPhongBan)
        : arr;
    };

    if (activeTab === "bienDong") {
      let dataToExport = filterData(data.baoCao.bienDong).map((item) => ({
        "Mã NV": item.maNV,
        "Họ Tên": item.hoTen,
        "Phòng Ban": item.phongBan,
        "Phân Loại": item.loai,
        "Ngày Hiệu Lực": item.ngayHieuLuc,
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataToExport),
        "Biến Động",
      );
      fileName = `BienDongNhanSu_T${month}_${year}.xlsx`;
    } else if (activeTab === "chamCong") {
      let dataToExport = filterData(data.baoCao.chamCong).map((item) => {
        let row = {
          "Mã NV": item.maNV,
          "Họ Tên": item.hoTen,
          "Phòng Ban": item.phongBan,
        };
        for (let i = 1; i <= daysInMonth; i++) {
          row[`Ngày ${i}`] = item.chiTiet[i.toString()] || "";
        }
        row["Tổng Công"] = item.tongCong;
        row["Đi Muộn"] = item.diMuon;
        row["Nghỉ Phép"] = item.nghiPhep;
        row["Không Phép"] = item.khongPhep;
        row["Nửa Ngày"] = item.nuaNgay;
        return row;
      });
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataToExport),
        "Chấm Công",
      );
      fileName = `ChiTietChamCong_T${month}_${year}.xlsx`;
    } else if (activeTab === "luong") {
      let dataTongHop = filterData(data.baoCao.bangLuong.tongHop).map(
        (item) => ({
          "Phòng Ban": item.tenPhongBan,
          "Số Nhân Viên": item.soNhanVien,
          "Tổng Thu Nhập": item.tongThuNhap,
          "Tổng Thực Lãnh": item.tongThucLanh,
        }),
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataTongHop),
        "Tổng Hợp Phòng Ban",
      );

      let dataChiTiet = filterData(data.baoCao.bangLuong.chiTiet).map(
        (item) => ({
          "Mã NV": item.maNV,
          "Họ Tên": item.hoTen,
          "Phòng Ban": item.phongBan,
          "Tổng Thu Nhập": item.tongThuNhap,
          "Thuế TNCN": item.thueTNCN,
          "Trừ Bảo Hiểm": item.truBaoHiem,
          "Thực Lãnh": item.thucLanh,
          "Trạng Thái": item.daChot,
        }),
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataChiTiet),
        "Chi Tiết Lương",
      );
      fileName = `BaoCaoLuong_T${month}_${year}.xlsx`;
    } else {
      alert("Vui lòng chọn tab Bảng dữ liệu để xuất Excel.");
      return;
    }

    XLSX.writeFile(workbook, fileName);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const renderTabContent = () => {
    if (loading || !data)
      return <div className="loading-state">Đang tải dữ liệu báo cáo...</div>;

    const filterTableData = (arr) => {
      if (isTruongPhong) return arr;
      return selectedPhongBan
        ? arr.filter((x) => x.maPhongBan === selectedPhongBan)
        : arr;
    };

    if (activeTab === "thongKe") {
      const { thamNien, gioiTinh, luongQuaCacKy } = data.thongKe;
      const hasThamNienData = thamNien && thamNien.some((x) => x.soLuong > 0);

      return (
        <div className="reports-charts-grid">
          <div className="report-chart-box">
            <h3>Phân bổ Thâm niên nhân sự</h3>
            <div
              style={{
                width: "100%",
                height: "250px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {hasThamNienData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={thamNien}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="soLuong"
                      nameKey="tenThang"
                    >
                      {thamNien.map((entry, index) => (
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
              ) : (
                <div className="empty-chart">Chưa có dữ liệu ngày vào làm</div>
              )}
            </div>
          </div>

          <div className="report-chart-box">
            <h3>Giới tính theo Phòng ban</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gioiTinh}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="tenPhongBan" tick={{ fontSize: 11 }} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey="nam"
                  name="Nam"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="nu"
                  name="Nữ"
                  fill="#ec4899"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="report-chart-box full-width">
            <h3>Biến động Quỹ lương 6 kỳ gần nhất</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={luongQuaCacKy}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="kyLuong" />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  width={60}
                />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="tongTien"
                  name="Tổng lương chi trả"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (activeTab === "bienDong") {
      const displayData = filterTableData(data.baoCao.bienDong);
      return (
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ Tên</th>
                <th>Phòng Ban</th>
                <th>Phân Loại</th>
                <th>Ngày Hiệu Lực</th>
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-row">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {displayData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.maNV}</td>
                  <td>{item.hoTen}</td>
                  <td>{item.phongBan}</td>
                  <td>
                    <span
                      className={`status-badge ${item.loai === "Tuyển mới" ? "badge-success" : "badge-danger"}`}
                    >
                      {item.loai}
                    </span>
                  </td>
                  <td>{item.ngayHieuLuc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "chamCong") {
      const displayData = filterTableData(data.baoCao.chamCong);
      return (
        <div className="report-table-wrapper wide-table-wrapper">
          <table className="report-table excel-style-table">
            <thead>
              <tr>
                <th className="sticky-col first">Mã NV</th>
                <th className="sticky-col second">Họ Tên</th>
                <th className="sticky-col third">Phòng Ban</th>
                {daysArray.map((d) => (
                  <th key={d} className="day-col">
                    {d}
                  </th>
                ))}
                <th className="sum-col highlight">Tổng Công</th>
                <th className="sum-col">Đi Muộn</th>
                <th className="sum-col">Nghỉ Phép</th>
                <th className="sum-col">Không Phép</th>
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 && (
                <tr>
                  <td colSpan={7 + daysInMonth} className="empty-row">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {displayData.map((item, idx) => (
                <tr key={idx}>
                  <td className="sticky-col first">{item.maNV}</td>
                  <td className="sticky-col second font-bold">{item.hoTen}</td>
                  <td className="sticky-col third">{item.phongBan}</td>
                  {daysArray.map((d) => {
                    const val = item.chiTiet[d.toString()];
                    let cellClass = "day-cell ";
                    if (val === "1") cellClass += "c-full";
                    else if (val === "1(M)") cellClass += "c-late";
                    else if (val === "0.5") cellClass += "c-half";
                    else if (val === "P") cellClass += "c-leave";
                    else if (val === "KP") cellClass += "c-no-leave";
                    return (
                      <td key={d} className={cellClass}>
                        {val}
                      </td>
                    );
                  })}
                  <td className="font-bold text-primary highlight text-center">
                    {item.tongCong}
                  </td>
                  <td className="text-warning font-bold text-center">
                    {item.diMuon}
                  </td>
                  <td className="text-success font-bold text-center">
                    {item.nghiPhep}
                  </td>
                  <td className="text-danger font-bold text-center">
                    {item.khongPhep}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-legend">
            <strong>Ký hiệu: </strong>
            <span className="l-item">
              <span className="c-full">1</span> Đủ công
            </span>
            <span className="l-item">
              <span className="c-late">1(M)</span> Đi muộn
            </span>
            <span className="l-item">
              <span className="c-half">0.5</span> Nửa ngày
            </span>
            <span className="l-item">
              <span className="c-leave">P</span> Có phép
            </span>
            <span className="l-item">
              <span className="c-no-leave">KP</span> Không phép
            </span>
          </div>
        </div>
      );
    }

    if (activeTab === "luong") {
      const { tongHop, chiTiet } = data.baoCao.bangLuong;
      const displayTongHop = filterTableData(tongHop);
      const displayChiTiet = filterTableData(chiTiet);

      return (
        <div className="payroll-report-layout">
          <div className="dept-summary-cards">
            {displayTongHop.length === 0 && (
              <p className="empty-row">Chưa có quỹ lương phòng ban</p>
            )}
            {displayTongHop.map((pb, idx) => (
              <div key={idx} className="summary-card">
                <h4>{pb.tenPhongBan}</h4>
                <div className="sum-row">
                  <span>Nhân sự:</span> <strong>{pb.soNhanVien} người</strong>
                </div>
                <div className="sum-row">
                  <span>Tổng Lương:</span>{" "}
                  <strong className="text-success">
                    {formatCurrency(pb.tongThucLanh)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-title-payroll">
            Bảng Lương Chi Tiết Nhân Viên
          </h3>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ Tên</th>
                  <th>Phòng Ban</th>
                  <th>Tổng Thu Nhập</th>
                  <th>Thuế / Bảo Hiểm</th>
                  <th>Thực Lãnh</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {displayChiTiet.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Chưa có dữ liệu bảng lương tháng này
                    </td>
                  </tr>
                )}
                {displayChiTiet.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.maNV}</td>
                    <td>{item.hoTen}</td>
                    <td>{item.phongBan}</td>
                    <td>{formatCurrency(item.tongThuNhap)}</td>
                    <td className="text-danger">
                      -{formatCurrency(item.thueTNCN + item.truBaoHiem)}
                    </td>
                    <td className="font-bold text-success">
                      {formatCurrency(item.thucLanh)}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${item.daChot === "Đã chốt" ? "badge-success" : "badge-danger"}`}
                      >
                        {item.daChot}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="reports-page-container">
        <div className="reports-header-section">
          <div>
            <h1>Phân tích & Thống kê</h1>
            <p className="reports-subtitle">
              Dữ liệu nhân sự chi tiết phục vụ báo cáo
            </p>
          </div>

          <div className="reports-actions">
            <div className="filter-controls">
              {/* ẨN BỘ LỌC PHÒNG BAN NẾU LÀ TRƯỞNG PHÒNG */}
              {!isTruongPhong && (
                <select
                  value={selectedPhongBan}
                  onChange={(e) => setSelectedPhongBan(e.target.value)}
                  className="report-select"
                >
                  <option value="">-- Tất cả phòng ban --</option>
                  {phongBans.map((pb) => (
                    <option key={pb.maPhongBan} value={pb.maPhongBan}>
                      {pb.tenPhongBan}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="report-select"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="report-select"
              >
                <option value="2024">Năm 2024</option>
                <option value="2025">Năm 2025</option>
                <option value="2026">Năm 2026</option>
              </select>
              <button
                className="btn-filter"
                onClick={fetchReports}
                disabled={loading}
              >
                <FaFilter /> {loading ? "Đang tải..." : "Lọc"}
              </button>
            </div>

            {activeTab !== "thongKe" && (
              <button className="btn-export" onClick={handleExportExcel}>
                <FaFileExcel /> Xuất Excel
              </button>
            )}
          </div>
        </div>

        <div className="reports-tabs">
          <button
            className={`tab-btn ${activeTab === "thongKe" ? "active" : ""}`}
            onClick={() => setActiveTab("thongKe")}
          >
            <FaChartBar className="tab-icon" /> Thống kê
          </button>
          <button
            className={`tab-btn ${activeTab === "bienDong" ? "active" : ""}`}
            onClick={() => setActiveTab("bienDong")}
          >
            <FaUserPlus className="tab-icon" /> Nhân sự
          </button>
          <button
            className={`tab-btn ${activeTab === "chamCong" ? "active" : ""}`}
            onClick={() => setActiveTab("chamCong")}
          >
            <FaClock className="tab-icon" /> Chấm công
          </button>
          <button
            className={`tab-btn ${activeTab === "luong" ? "active" : ""}`}
            onClick={() => setActiveTab("luong")}
          >
            <FaMoneyCheckAlt className="tab-icon" /> Lương
          </button>
        </div>

        <div className="reports-content-box">{renderTabContent()}</div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
