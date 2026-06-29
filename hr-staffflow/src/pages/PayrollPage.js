import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaChevronLeft,
  FaChevronRight,
  FaFileExcel,
  FaSave,
  FaCalculator,
  FaCheckDouble,
  FaUnlock,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "../styles/PayrollPage.css";

// --- Custom Confirm Modal (Giữ nguyên) ---
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

// Lấy tên (từ cuối) để sort theo chuẩn Việt Nam
const getFirstName = (fullName) => (fullName || "").trim().split(/\s+/).pop() || "";

const PayrollPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [deptTotal, setDeptTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (maNhanVien) =>
    setExpandedRows((prev) => ({ ...prev, [maNhanVien]: !prev[maNhanVien] }));

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN");
  };

  // Bộ lọc
  const [searchName, setSearchName] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";

  const canCalculate = ["Kế toán trưởng", "Giám đốc"].includes(userRole);
  const canEdit =
    (userRole === "Kế toán trưởng" && !isPublished) || userRole === "Giám đốc";
  const isManager = userRole === "Trưởng phòng";

  // --- TOAST & CONFIRM (Giữ nguyên) ---
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      3000,
    );
  }, []);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const closeConfirm = () =>
    setConfirmDialog({ isOpen: false, message: "", onConfirm: null });

  const fetchData = useCallback(
    async (date) => {
      setLoading(true);
      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const response = await api.get(
          `/BangLuong?year=${year}&month=${month}`,
        );

        const { data, isPublished: status, departmentTotal } = response.data;

        // Bổ sung map thêm NghiKhongLuong và SoCongChuanTrongThang
        const mappedData = (data || []).map((item) => ({
          ...item,
          luongCoBan: item.luongCoBan || 0,
          tongPhuCap: item.tongPhuCap || 0,
          soCongChuanTrongThang: item.soCongChuanTrongThang || 22,
          tongNgayCong: item.tongNgayCong || 0,
          tongGioOT: item.tongGioOT || 0,
          tongCongChuanOT: item.tongCongChuanOT || 0,
          nghiCoPhep: item.nghiCoPhep || 0,
          nghiKhongLuong: item.nghiKhongLuong || 0,
          nghiKhongPhep: item.nghiKhongPhep || 0,
          lamNuaNgay: item.lamNuaNgay || 0,
          soNgayLamLe: item.soNgayLamLe || 0,
          tienLamLe: item.tienLamLe || 0,
          luongChinh: item.luongChinh || 0,
          luongOT: item.luongOT || 0,
          luongLamThemLe: item.luongLamThemLe || 0,
          tienAn: item.tienAn || 0,
          tienGuiXe: item.tienGuiXe || 0,
          tienChuyenCan: item.tienChuyenCan || 0,
          tongThuNhap: item.tongThuNhap || 0,
          khauTruBHXH: item.khauTruBHXH || 0,
          khauTruBHYT: item.khauTruBHYT || 0,
          khauTruBHTN: item.khauTruBHTN || 0,
          thueTNCN: item.thueTNCN || 0,
          khoanTruKhac: item.khoanTruKhac || 0,
          lyDoKhac: item.lyDoKhac || "",
          thucLanh: item.thucLanh || 0,
        }));

        const sortedPayrolls = [...mappedData].sort((a, b) => {
          const nameA = a.nhanVien?.hoTen || a.hoTen || "";
          const nameB = b.nhanVien?.hoTen || b.hoTen || "";
          // Sort theo Tên (từ cuối) trước, nếu bằng thì sort theo toàn bộ tên
          const cmp = getFirstName(nameA).localeCompare(getFirstName(nameB), "vi");
          return cmp !== 0 ? cmp : nameA.localeCompare(nameB, "vi");
        });
        setPayrolls(sortedPayrolls);
        setIsPublished(status);
        setDeptTotal(departmentTotal || 0);
      } catch (err) {
        showToast("Lỗi khi tải dữ liệu bảng lương.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const changeMonth = (offset) =>
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );

  // ... (Giữ nguyên các hàm handleCalculate, handlePublish, handleSave, handleInputChange, handleExportExcel) ...
  const handleCalculate = () => {
    setConfirmDialog({
      isOpen: true,
      message:
        "Hệ thống sẽ tính lại lương theo chuẩn công mới và thuế lũy tiến. Bạn chắc chắn tiếp tục?",
      onConfirm: async () => {
        closeConfirm();
        try {
          setLoading(true);
          await api.post("/BangLuong/calculate", {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
          });
          showToast("Tính lương thành công!", "success");
          fetchData(currentDate);
        } catch (e) {
          showToast(e.response?.data || "Lỗi tính lương.", "error");
          setLoading(false);
        }
      },
    });
  };

  const handlePublish = (status) => {
    const action = status ? "CHỐT" : "HỦY CHỐT";
    setConfirmDialog({
      isOpen: true,
      message: `Bạn muốn ${action} bảng lương tháng này?`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.post(`/BangLuong/publish?status=${status}`, {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
          });
          showToast(`${action} bảng lương thành công!`, "success");
          fetchData(currentDate);
        } catch (e) {
          showToast(e.response?.data || "Lỗi.", "error");
        }
      },
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      const payload = payrolls.map((p) => ({
        id: p.id,
        khoanTruKhac: parseFloat(p.khoanTruKhac) || 0,
        lyDoKhac: p.lyDoKhac || "",
      }));
      await api.post("/BangLuong/save", payload);
      showToast("Lưu điều chỉnh thành công!", "success");
      fetchData(currentDate);
    } catch (e) {
      showToast("Lỗi lưu dữ liệu.", "error");
    }
  };

  const handleInputChange = (id, value) => {
    if (!canEdit) return;
    setPayrolls((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const dieu = parseFloat(value) || 0;
        const totalDeduct =
          p.khauTruBHXH + p.khauTruBHYT + p.khauTruBHTN + p.thueTNCN;
        return {
          ...p,
          khoanTruKhac: value,
          thucLanh: p.tongThuNhap - totalDeduct + dieu,
        };
      }),
    );
  };

  const handleLyDoChange = (id, value) => {
    if (!canEdit) return;
    setPayrolls((prev) =>
      prev.map((p) => (p.id !== id ? p : { ...p, lyDoKhac: value })),
    );
  };

  const formatMoney = (val) => new Intl.NumberFormat("vi-VN").format(val || 0);

  // Danh sách phòng ban duy nhất từ dữ liệu đã load
  const deptOptions = [...new Set(
    payrolls.map((p) => p.nhanVien?.tenPhongBan || "").filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "vi"));

  // Bảng hiển thị sau khi lọc
  const filteredPayrolls = payrolls.filter((p) => {
    const name = (p.nhanVien?.hoTen || p.hoTen || "").toLowerCase();
    const dept = p.nhanVien?.tenPhongBan || "";
    if (filterDept && dept !== filterDept) return false;
    if (searchName && !name.includes(searchName.toLowerCase())) return false;
    return true;
  });

  const handleExportExcel = () => {
    /* ... Giữ nguyên ... */
  };

  return (
    <DashboardLayout>
      <div className="payroll-page-container">
        <h1>Quản lý Lương</h1>
        <div className="payroll-header">
          <div className="month-navigator">
            <button onClick={() => changeMonth(-1)}>
              <FaChevronLeft />
            </button>
            <h2>
              Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
            </h2>
            <button onClick={() => changeMonth(1)}>
              <FaChevronRight />
            </button>
            {isPublished && <span className="tag-published">ĐÃ CHỐT</span>}
          </div>

          <div className="header-actions">
            {canCalculate && !isPublished && (
              <button className="calc-btn" onClick={handleCalculate}>
                <FaCalculator /> Tính lương
              </button>
            )}
            {canCalculate &&
              (isPublished ? (
                <button
                  className="unlock-btn"
                  onClick={() => handlePublish(false)}
                >
                  <FaUnlock /> Hủy chốt
                </button>
              ) : (
                <button
                  className="lock-btn"
                  onClick={() => handlePublish(true)}
                >
                  <FaCheckDouble /> Chốt lương
                </button>
              ))}
            <button className="export-excel-btn" onClick={handleExportExcel}>
              <FaFileExcel /> Xuất
            </button>
            {canEdit && (
              <button className="save-payroll-btn" onClick={handleSave}>
                <FaSave /> Lưu
              </button>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm & lọc */}
        <div style={{ display: "flex", gap: "10px", margin: "14px 0", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 34px",
                border: "1px solid #d1d5db", borderRadius: "8px",
                fontSize: "14px", outline: "none", boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "14px" }}>
              🔍
            </span>
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{
              padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px",
              fontSize: "14px", background: "#fff", cursor: "pointer", minWidth: "180px",
            }}
          >
            <option value="">Tất cả phòng ban</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {(searchName || filterDept) && (
            <button
              onClick={() => { setSearchName(""); setFilterDept(""); }}
              style={{
                padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: "8px",
                fontSize: "13px", cursor: "pointer", background: "#f9fafb", color: "#6b7280",
              }}
            >
              ✕ Xóa lọc
            </button>
          )}
          <span style={{ alignSelf: "center", fontSize: "13px", color: "#6b7280" }}>
            {filteredPayrolls.length} / {payrolls.length} nhân viên
          </span>
        </div>

        {isManager && isPublished && (
          <div
            className="dept-summary-box"
            style={{
              backgroundColor: "#e0f2fe",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #bae6fd",
            }}
          >
            <h3 style={{ margin: 0, color: "#0369a1" }}>
              Tổng thực lĩnh phòng: {formatMoney(deptTotal)} VNĐ
            </h3>
          </div>
        )}

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="payroll-table-wrapper">
            <div className="payroll-table-scroll">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th className="sticky-col first-col" rowSpan={2}>
                      Nhân viên
                    </th>
                    <th colSpan={2} className="group-header bg-gray">
                      Cố định
                    </th>
                    <th colSpan={7} className="group-header bg-blue-light">
                      Chấm công
                    </th>
                    <th colSpan={6} className="group-header bg-green-light">
                      Thu nhập
                    </th>
                    <th colSpan={4} className="group-header bg-red-light">
                      Khấu trừ
                    </th>
                    <th
                      className="sub-th bg-yellow-light"
                      rowSpan={2}
                      title="Dương (+) = thưởng/cộng thêm | Âm (-) = trừ lương"
                    >
                      Điều chỉnh (±)
                    </th>
                    <th className="sticky-col last-col" rowSpan={2}>
                      Thực Lĩnh
                    </th>
                  </tr>
                  <tr>
                    <th className="sub-th">Lương CB</th>
                    <th className="sub-th">Phụ Cấp</th>

                    {/* THÊM CỘT CÔNG CHUẨN & NGHỈ KL */}
                    <th className="sub-th" title="Công chuẩn của tháng">
                      C.Chuẩn
                    </th>
                    <th className="sub-th">Công</th>
                    <th className="sub-th" style={{ color: "#d97706" }} title="Tổng giờ OT (mở rộng để xem 3 loại)">
                      OT (h)
                    </th>
                    <th className="sub-th">Phép</th>
                    <th
                      className="sub-th"
                      style={{ color: "#ef4444" }}
                      title="Nghỉ không lương (có đơn)"
                    >
                      Nghỉ KL
                    </th>
                    <th className="sub-th" title="Nghỉ không phép">
                      KP
                    </th>
                    <th className="sub-th">1/2</th>

                    <th className="sub-th">Lương Chính</th>
                    <th className="sub-th" style={{ color: "#d97706" }} title="Tổng tiền OT (thường + T7/CN + lễ). Mở rộng để xem chi tiết.">
                      Tiền OT
                    </th>
                    <th className="sub-th" title="Tiền ăn (50k/ngày công)">
                      T.Ăn
                    </th>
                    <th className="sub-th" title="Tiền gửi xe (theo ngày công)">
                      T.Xe
                    </th>
                    <th
                      className="sub-th"
                      title="Tiền chuyên cần (đủ công chuẩn mới được)"
                    >
                      C.Cần
                    </th>
                    <th className="sub-th">Tổng TN</th>
                    <th className="sub-th">BHXH</th>
                    <th className="sub-th">BHYT</th>
                    <th className="sub-th">BHTN</th>
                    <th className="sub-th">Thuế</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.length > 0 ? (
                    filteredPayrolls.map((p) => {
                      const segments = p.chiTietHopDong || [];
                      const otSegs = p.chiTietOT || [];
                      const hasMulti = segments.length > 1;
                      const hasOT = otSegs.length > 0;
                      const canExpand = hasMulti || hasOT;
                      const isExpanded = !!expandedRows[p.maNhanVien];
                      return (
                      <React.Fragment key={p.maNhanVien}>
                      <tr>
                        <td className="sticky-col first-col">
                          <div
                            className="employee-info"
                            style={{ cursor: canExpand ? "pointer" : "default" }}
                            onClick={() => canExpand && toggleRow(p.maNhanVien)}
                          >
                            <strong>
                              {canExpand && (isExpanded ? "▼ " : "▶ ")}
                              {p.nhanVien?.hoTen}
                            </strong>
                            <span>
                              {p.maNhanVien}
                              {hasMulti && (
                                <em
                                  style={{
                                    marginLeft: 6,
                                    color: "#2563eb",
                                    fontStyle: "normal",
                                    fontWeight: 600,
                                  }}
                                >
                                  {segments.length} HĐ
                                </em>
                              )}
                              {hasOT && (
                                <em
                                  style={{
                                    marginLeft: 6,
                                    color: "#d97706",
                                    fontStyle: "normal",
                                    fontWeight: 600,
                                  }}
                                >
                                  OT
                                </em>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          {formatMoney(p.luongCoBan)}
                        </td>
                        <td className="text-right">
                          {formatMoney(p.tongPhuCap)}
                        </td>

                        {/* DỮ LIỆU CÔNG MỚI */}
                        <td
                          className="text-center font-bold"
                          style={{ color: "#6b7280" }}
                        >
                          {p.soCongChuanTrongThang}
                        </td>
                        <td className="text-center font-bold text-blue">
                          {Math.round(p.tongNgayCong * 100) / 100}
                        </td>
                        <td
                          className="text-center font-bold"
                          style={{ color: "#d97706" }}
                        >
                          {p.tongGioOT > 0 ? p.tongGioOT : "-"}
                        </td>
                        <td className="text-center">{p.nghiCoPhep}</td>
                        <td
                          className="text-center"
                          style={{ color: "#ef4444" }}
                        >
                          {p.nghiKhongLuong}
                        </td>
                        <td className="text-center text-red">
                          {p.nghiKhongPhep}
                        </td>
                        <td className="text-center">{p.lamNuaNgay}</td>

                        <td className="text-right">
                          {formatMoney(p.luongChinh)}
                        </td>
                        <td className="text-right" style={{ color: "#d97706" }}>
                          {formatMoney(p.luongOT)}
                        </td>
                        <td className="text-right text-sm">
                          {p.tienAn > 0 ? formatMoney(p.tienAn) : "-"}
                        </td>
                        <td className="text-right text-sm">
                          {p.tienGuiXe > 0 ? formatMoney(p.tienGuiXe) : "-"}
                        </td>
                        <td className="text-right text-sm">
                          {p.tienChuyenCan > 0
                            ? formatMoney(p.tienChuyenCan)
                            : "-"}
                        </td>
                        <td className="text-right font-bold text-green">
                          {formatMoney(p.tongThuNhap)}
                        </td>

                        <td className="text-right text-sm">
                          {formatMoney(p.khauTruBHXH)}
                        </td>
                        <td className="text-right text-sm">
                          {formatMoney(p.khauTruBHYT)}
                        </td>
                        <td className="text-right text-sm">
                          {formatMoney(p.khauTruBHTN)}
                        </td>
                        <td className="text-right text-sm">
                          {formatMoney(p.thueTNCN)}
                        </td>
                        <td style={{ minWidth: "130px" }}>
                          {canEdit ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <input
                                type="number"
                                className="salary-input"
                                value={p.khoanTruKhac || ""}
                                onChange={(e) =>
                                  handleInputChange(p.id, e.target.value)
                                }
                                style={{
                                  color:
                                    parseFloat(p.khoanTruKhac) > 0
                                      ? "#16a34a"
                                      : parseFloat(p.khoanTruKhac) < 0
                                        ? "#dc2626"
                                        : "",
                                  fontWeight: "600",
                                }}
                              />
                              <input
                                className="salary-input"
                                value={p.lyDoKhac || ""}
                                onChange={(e) =>
                                  handleLyDoChange(p.id, e.target.value)
                                }
                                placeholder="Lý do..."
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  padding: "3px 6px",
                                }}
                              />
                            </div>
                          ) : (
                            <div style={{ textAlign: "right" }}>
                              {parseFloat(p.khoanTruKhac) !== 0 && (
                                <div
                                  style={{
                                    color:
                                      parseFloat(p.khoanTruKhac) > 0
                                        ? "#16a34a"
                                        : "#dc2626",
                                    fontWeight: "600",
                                  }}
                                >
                                  {parseFloat(p.khoanTruKhac) > 0 ? "+" : ""}
                                  {formatMoney(p.khoanTruKhac)}
                                </div>
                              )}
                              {p.lyDoKhac && (
                                <div
                                  style={{ fontSize: "11px", color: "#6b7280" }}
                                >
                                  {p.lyDoKhac}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="sticky-col last-col text-right font-bold text-green">
                          {formatMoney(p.thucLanh)}
                        </td>
                      </tr>
                      {isExpanded && canExpand && (
                        <tr>
                          <td colSpan={22} style={{ background: "#f8fafc", padding: "10px 18px" }}>
                            {hasMulti && (
                            <>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "#334155" }}>
                              Chi tiết lương theo hợp đồng
                            </div>
                            <table style={{ width: "auto", fontSize: 13, borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ color: "#64748b" }}>
                                  <th style={{ textAlign: "left", padding: "4px 12px" }}>Hợp đồng</th>
                                  <th style={{ textAlign: "left", padding: "4px 12px" }}>Loại</th>
                                  <th style={{ textAlign: "left", padding: "4px 12px" }}>Kỳ</th>
                                  <th style={{ textAlign: "right", padding: "4px 12px" }}>Lương CB</th>
                                  <th style={{ textAlign: "center", padding: "4px 12px" }}>Hệ số</th>
                                  <th style={{ textAlign: "right", padding: "4px 12px" }}>Đơn giá/ngày</th>
                                  <th style={{ textAlign: "center", padding: "4px 12px" }}>Công</th>
                                  <th style={{ textAlign: "right", padding: "4px 12px" }}>Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody>
                                {segments.map((s, i) => (
                                  <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "4px 12px" }}>{s.soHopDong}</td>
                                    <td style={{ padding: "4px 12px" }}>{s.loaiHopDong}</td>
                                    <td style={{ padding: "4px 12px" }}>
                                      {formatDate(s.tuNgay)} – {formatDate(s.denNgay)}
                                    </td>
                                    <td style={{ padding: "4px 12px", textAlign: "right" }}>{formatMoney(s.luongCoBan)}</td>
                                    <td style={{ padding: "4px 12px", textAlign: "center" }}>×{s.heSo}</td>
                                    <td style={{ padding: "4px 12px", textAlign: "right" }}>{formatMoney(s.donGiaNgay)}</td>
                                    <td style={{ padding: "4px 12px", textAlign: "center" }}>{s.soNgayCong}</td>
                                    <td style={{ padding: "4px 12px", textAlign: "right", fontWeight: 600 }}>{formatMoney(s.thanhTien)}</td>
                                  </tr>
                                ))}
                                <tr style={{ borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
                                  <td colSpan={7} style={{ padding: "4px 12px", textAlign: "right" }}>
                                    Tổng lương chính:
                                  </td>
                                  <td style={{ padding: "4px 12px", textAlign: "right", color: "#16a34a" }}>
                                    {formatMoney(segments.reduce((sum, s) => sum + (s.thanhTien || 0), 0))}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            </>
                            )}
                            {hasOT && (
                            <>
                            <div style={{ fontWeight: 600, margin: "12px 0 6px", color: "#334155" }}>
                              Chi tiết OT
                            </div>
                            <table style={{ width: "auto", fontSize: 13, borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ color: "#64748b" }}>
                                  <th style={{ textAlign: "left", padding: "4px 12px" }}>Loại ngày</th>
                                  <th style={{ textAlign: "center", padding: "4px 12px" }}>Số giờ</th>
                                  <th style={{ textAlign: "center", padding: "4px 12px" }}>Hệ số</th>
                                  <th style={{ textAlign: "right", padding: "4px 12px" }}>Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody>
                                {otSegs.map((o, i) => (
                                  <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "4px 12px" }}>{o.loaiNgay}</td>
                                    <td style={{ padding: "4px 12px", textAlign: "center" }}>{o.soGio}h</td>
                                    <td style={{ padding: "4px 12px", textAlign: "center" }}>×{o.heSo}</td>
                                    <td style={{ padding: "4px 12px", textAlign: "right", fontWeight: 600 }}>{formatMoney(o.thanhTien)}</td>
                                  </tr>
                                ))}
                                <tr style={{ borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
                                  <td colSpan={3} style={{ padding: "4px 12px", textAlign: "right" }}>Tổng tiền OT:</td>
                                  <td style={{ padding: "4px 12px", textAlign: "right", color: "#d97706" }}>
                                    {formatMoney(otSegs.reduce((sum, o) => sum + (o.thanhTien || 0), 0))}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            </>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="22"
                        className="text-center"
                        style={{ padding: "30px 0" }}
                      >
                        Không có dữ liệu bảng lương tháng này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
      <div
        className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
      >
        {toast.message}
      </div>
    </DashboardLayout>
  );
};

export default PayrollPage;
