import React, { useState, useEffect, useCallback } from "react";
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

const PayrollPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [deptTotal, setDeptTotal] = useState(0);

  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";

  // QUYỀN TÍNH TOÁN & CHỐT: Kế toán, Giám đốc
  const canCalculate = ["Kế toán trưởng", "Giám đốc"].includes(userRole);

  // QUYỀN SỬA (Nhập thưởng/phạt):
  // - Kế toán (khi chưa chốt)
  // - Giám đốc (luôn luôn)
  const canEdit =
    (userRole === "Kế toán trưởng" && !isPublished) || userRole === "Giám đốc";

  const isManager = userRole === "Trưởng phòng";

  const fetchData = useCallback(async (date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await api.get(`/BangLuong?year=${year}&month=${month}`);

      const { data, isPublished: status, departmentTotal } = response.data;

      // Map dữ liệu từ API (Chú ý case sensitive nếu API trả về hoa/thường)
      const mappedData = (data || []).map((item) => ({
        ...item,
        luongCoBan: item.luongCoBan || 0,
        tongPhuCap: item.tongPhuCap || 0,

        // CHẤM CÔNG
        tongNgayCong: item.tongNgayCong || 0,
        tongGioOT: item.tongGioOT || 0, //
        nghiCoPhep: item.nghiCoPhep || 0,
        nghiKhongPhep: item.nghiKhongPhep || 0,
        lamNuaNgay: item.lamNuaNgay || 0,

        // THU NHẬP
        luongChinh: item.luongChinh || 0,
        luongOT: item.luongOT || 0, //
        tongThuNhap: item.tongThuNhap || 0,

        // KHẤU TRỪ
        khauTruBHXH: item.khauTruBHXH || 0,
        khauTruBHYT: item.khauTruBHYT || 0,
        khauTruBHTN: item.khauTruBHTN || 0,
        thueTNCN: item.thueTNCN || 0,
        khoanTruKhac: item.khoanTruKhac || 0,

        // THỰC LĨNH
        thucLanh: item.thucLanh || 0,
      }));

      setPayrolls(mappedData);
      setIsPublished(status);
      setDeptTotal(departmentTotal || 0);
    } catch (err) {
      if (err.response?.status === 403)
        alert("Bạn không có quyền xem bảng lương.");
      else console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const changeMonth = (offset) =>
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );

  const handleCalculate = async () => {
    if (!window.confirm("Hệ thống sẽ tính lại lương (bao gồm OT). Tiếp tục?"))
      return;
    try {
      setLoading(true);
      await api.post("/BangLuong/calculate", {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
      alert("Tính lương thành công!");
      fetchData(currentDate);
    } catch (e) {
      alert(e.response?.data || "Lỗi tính lương.");
      setLoading(false);
    }
  };

  const handlePublish = async (status) => {
    const action = status ? "CHỐT" : "HỦY CHỐT";
    if (!window.confirm(`Bạn muốn ${action} bảng lương tháng này?`)) return;
    try {
      await api.post(`/BangLuong/publish?status=${status}`, {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
      alert("Thành công!");
      fetchData(currentDate);
    } catch (e) {
      alert(e.response?.data || "Lỗi.");
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      const payload = payrolls.map((p) => ({
        id: p.id,
        khoanTruKhac: parseFloat(p.khoanTruKhac) || 0,
      }));
      await api.post("/BangLuong/save", payload);
      alert("Lưu thành công!");
      fetchData(currentDate);
    } catch (e) {
      alert(e.response?.data || "Lỗi lưu.");
    }
  };

  const handleInputChange = (id, value) => {
    if (!canEdit) return;
    const numVal = value.replace(/\D/g, "");
    setPayrolls((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newKhoanTru = parseFloat(numVal) || 0;
        const totalDeduct =
          p.khauTruBHXH +
          p.khauTruBHYT +
          p.khauTruBHTN +
          p.thueTNCN +
          newKhoanTru;
        const newThucLanh = p.tongThuNhap - totalDeduct;
        return { ...p, khoanTruKhac: numVal, thucLanh: newThucLanh };
      }),
    );
  };

  const formatMoney = (val) => new Intl.NumberFormat("vi-VN").format(val || 0);

  const handleExportExcel = () => {
    const data = payrolls.map((p) => ({
      "Mã NV": p.maNhanVien,
      "Họ Tên": p.nhanVien?.hoTen,
      "Lương CB": p.luongCoBan,
      Công: p.tongNgayCong,
      "OT (h)": p.tongGioOT, // Xuất Excel thêm cột OT
      "Lương OT": p.luongOT,
      "Thực Lĩnh": p.thucLanh,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangLuong");
    XLSX.writeFile(wb, "BangLuong.xlsx");
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
                    <th colSpan={3} className="group-header bg-gray">
                      Cố định
                    </th>
                    {/* CẬP NHẬT COLSPAN: 4 -> 5 (Thêm OT) */}
                    <th colSpan={5} className="group-header bg-blue-light">
                      Chấm công
                    </th>
                    {/* CẬP NHẬT COLSPAN: 2 -> 3 (Thêm tiền OT) */}
                    <th colSpan={3} className="group-header bg-green-light">
                      Thu nhập
                    </th>
                    <th colSpan={5} className="group-header bg-red-light">
                      Khấu trừ
                    </th>
                    <th className="sticky-col last-col" rowSpan={2}>
                      Thực Lĩnh
                    </th>
                  </tr>
                  <tr>
                    <th className="sub-th">Lương CB</th>
                    <th className="sub-th">Lương BH</th>
                    <th className="sub-th">Phụ Cấp</th>
                    {/* NHÓM CHẤM CÔNG */}
                    <th className="sub-th">Công</th>
                    <th className="sub-th" style={{ color: "#d97706" }}>
                      OT (h)
                    </th>{" "}
                    {/* CỘT MỚI */}
                    <th className="sub-th">Phép</th>
                    <th className="sub-th">KP</th>
                    <th className="sub-th">1/2</th>
                    {/* NHÓM THU NHẬP */}
                    <th className="sub-th">Lương Chính</th>
                    <th className="sub-th" style={{ color: "#d97706" }}>
                      Tiền OT
                    </th>{" "}
                    {/* CỘT MỚI */}
                    <th className="sub-th">Tổng TN</th>
                    <th className="sub-th">BHXH</th>
                    <th className="sub-th">BHYT</th>
                    <th className="sub-th">BHTN</th>
                    <th className="sub-th">Thuế</th>
                    <th className="sub-th bg-yellow-light">Khác (Sửa)</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p.maNhanVien}>
                      <td className="sticky-col first-col">
                        <div className="employee-info">
                          <strong>{p.nhanVien?.hoTen}</strong>
                          <span>{p.maNhanVien}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        {formatMoney(p.luongCoBan)}
                      </td>
                      <td className="text-right">
                        {formatMoney(p.luongDongBaoHiem)}
                      </td>
                      <td className="text-right">
                        {formatMoney(p.tongPhuCap)}
                      </td>

                      {/* DATA CHẤM CÔNG */}
                      <td className="text-center font-bold text-blue">
                        {p.tongNgayCong}
                      </td>
                      <td
                        className="text-center font-bold"
                        style={{ color: "#d97706" }}
                      >
                        {p.tongGioOT > 0 ? p.tongGioOT : "-"}
                      </td>
                      <td className="text-center">{p.nghiCoPhep}</td>
                      <td className="text-center text-red">
                        {p.nghiKhongPhep}
                      </td>
                      <td className="text-center">{p.lamNuaNgay}</td>

                      {/* DATA THU NHẬP */}
                      <td className="text-right">
                        {formatMoney(p.luongChinh)}
                      </td>
                      <td className="text-right" style={{ color: "#d97706" }}>
                        {formatMoney(p.luongOT)}
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

                      <td>
                        <input
                          className="salary-input"
                          disabled={!canEdit}
                          value={formatMoney(p.khoanTruKhac)}
                          onChange={(e) =>
                            handleInputChange(p.id, e.target.value)
                          }
                        />
                      </td>

                      <td className="sticky-col last-col text-right font-bold text-green">
                        {formatMoney(p.thucLanh)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PayrollPage;
