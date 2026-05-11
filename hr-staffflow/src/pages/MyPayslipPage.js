import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPrint,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import "../styles/MyPayslipPage.css";

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const MyPayslipPage = () => {
  const user = getUserFromToken();
  const { employee: contextEmployee } = useOutletContext() || {};
  const currentEmpId =
    contextEmployee?.maNhanVien ||
    user?.nameid ||
    user?.id ||
    user?.MaNhanVien ||
    user?.[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    user?.unique_name;
  const employeeName =
    contextEmployee?.hoTen || user?.unique_name || "Nhân viên";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (date) => {
      setLoading(true);
      setError(null);
      setPayslipData(null);
      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const response = await api.get(
          `/BangLuong?year=${year}&month=${month}`,
        );
        const list = response.data.data || response.data.Data || [];

        let myRecord = null;
        if (list.length === 1) myRecord = list[0];
        else if (list.length > 1 && currentEmpId) {
          myRecord = list.find(
            (item) =>
              (item.maNhanVien || item.MaNhanVien)?.toLowerCase() ===
              currentEmpId.toLowerCase(),
          );
        }
        setPayslipData(myRecord || null);
      } catch (err) {
        if (err.response && err.response.status === 403) setPayslipData(null);
        else
          setError("Không thể tải dữ liệu bảng lương (hoặc chưa được chốt).");
      } finally {
        setLoading(false);
      }
    },
    [currentEmpId],
  );

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const changeMonth = (offset) =>
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  const handlePrint = () => window.print();

  const renderContent = () => {
    if (loading)
      return <div className="loading-text">Đang tải phiếu lương...</div>;
    if (!payslipData)
      return (
        <div className="no-data-text">
          <FaFileInvoiceDollar
            size={40}
            color="#ccc"
            style={{ marginBottom: 10 }}
          />
          <p>
            Chưa có phiếu lương cho tháng {currentDate.getMonth() + 1}/
            {currentDate.getFullYear()}.
          </p>
          <small style={{ color: "#888" }}>
            (Vui lòng chờ Kế toán chốt sổ)
          </small>
        </div>
      );
    if (error) return <div className="error-text">{error}</div>;

    const p = payslipData;
    const d = {
      luongCoBan: p.luongCoBan ?? 0,
      tongPhuCap: p.tongPhuCap ?? 0,
      soCongChuan: p.soCongChuanTrongThang ?? 26, // LẤY CÔNG CHUẨN VÀO ĐÂY
      tongNgayCong: p.tongNgayCong ?? 0,
      tongGioOT: p.tongGioOT ?? 0,
      nghiCoPhep: p.nghiCoPhep ?? 0,
      nghiKhongLuong: p.nghiKhongLuong ?? 0, // LẤY NGHỈ KHÔNG LƯƠNG
      nghiKhongPhep: p.nghiKhongPhep ?? 0,
      lamNuaNgay: p.lamNuaNgay ?? 0,
      luongChinh: p.luongChinh ?? 0,
      luongOT: p.luongOT ?? 0,
      tongThuNhap: p.tongThuNhap ?? 0,
      khauTruBHXH: p.khauTruBHXH ?? 0,
      khauTruBHYT: p.khauTruBHYT ?? 0,
      khauTruBHTN: p.khauTruBHTN ?? 0,
      thueTNCN: p.thueTNCN ?? 0,
      khoanTruKhac: p.khoanTruKhac ?? 0,
      thucLanh: p.thucLanh ?? 0,
      hoTen: p.nhanVien?.hoTen || employeeName,
      phongBan: p.nhanVien?.tenPhongBan || "---",
      chucVu: p.nhanVien?.tenChucVu || "---",
    };

    const totalInsurance = d.khauTruBHXH + d.khauTruBHYT + d.khauTruBHTN;

    return (
      <div className="payslip-container">
        <div className="payslip-header-section">
          <div className="company-info">
            <h2>PHIẾU LƯƠNG</h2>
            <p className="period">
              Tháng {currentDate.getMonth() + 1} năm {currentDate.getFullYear()}
            </p>
          </div>
          <div className="emp-info-grid">
            <div className="info-row">
              <span className="label">Họ tên:</span>
              <span className="val">{d.hoTen}</span>
            </div>
            <div className="info-row">
              <span className="label">Mã NV:</span>
              <span className="val">{currentEmpId}</span>
            </div>
            <div className="info-row">
              <span className="label">Phòng ban:</span>
              <span className="val">{d.phongBan}</span>
            </div>
            <div className="info-row">
              <span className="label">Chức vụ:</span>
              <span className="val">{d.chucVu}</span>
            </div>
          </div>
        </div>

        <div className="payslip-body">
          <div className="section-block">
            <h4 className="section-title text-green">I. THU NHẬP</h4>
            <div className="detail-row">
              <span>Lương Cơ Bản</span>
              <span className="amount">{formatCurrency(d.luongCoBan)}</span>
            </div>
            <div className="detail-row">
              <span>Phụ Cấp</span>
              <span className="amount">{formatCurrency(d.tongPhuCap)}</span>
            </div>
            <div className="detail-row highlight-bg">
              {/* Hiển thị tỷ lệ (Công đi làm / Công chuẩn) */}
              <span>
                Lương Chính ({d.tongNgayCong} / {d.soCongChuan} công)
              </span>
              <span className="amount bold">
                {formatCurrency(d.luongChinh)}
              </span>
            </div>
            <div className="detail-row">
              <span>Lương OT ({d.tongGioOT} giờ)</span>
              <span className="amount">{formatCurrency(d.luongOT)}</span>
            </div>
            <div className="detail-row total-row">
              <span>TỔNG THU NHẬP (Gross)</span>
              <span className="amount text-green">
                {formatCurrency(d.tongThuNhap)}
              </span>
            </div>
          </div>

          <div className="section-block">
            <h4 className="section-title text-red">II. CÁC KHOẢN KHẤU TRỪ</h4>
            <div className="detail-row">
              <span>BHXH (8%)</span>
              <span className="amount">{formatCurrency(d.khauTruBHXH)}</span>
            </div>
            <div className="detail-row">
              <span>BHYT (1.5%)</span>
              <span className="amount">{formatCurrency(d.khauTruBHYT)}</span>
            </div>
            <div className="detail-row">
              <span>BHTN (1%)</span>
              <span className="amount">{formatCurrency(d.khauTruBHTN)}</span>
            </div>
            <div className="detail-row">
              <span>Thuế TNCN</span>
              <span className="amount">{formatCurrency(d.thueTNCN)}</span>
            </div>
            <div className="detail-row">
              <span>Khấu trừ khác (Phạt...)</span>
              <span className="amount">{formatCurrency(d.khoanTruKhac)}</span>
            </div>
            <div className="detail-row total-row">
              <span>TỔNG KHẤU TRỪ</span>
              <span className="amount text-red">
                {formatCurrency(totalInsurance + d.khoanTruKhac + d.thueTNCN)}
              </span>
            </div>
          </div>

          {/* BỔ SUNG NGHỈ KL VÀ CÔNG CHUẨN VÀO CHI TIẾT */}
          <div className="section-block info-only">
            <h4 className="section-title text-blue">III. CHI TIẾT CHẤM CÔNG</h4>
            <div
              className="attendance-grid"
              style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
            >
              <div className="att-item">
                <span className="lbl">Công Chuẩn</span>
                <span className="val" style={{ color: "#6b7280" }}>
                  {d.soCongChuan}
                </span>
              </div>
              <div className="att-item">
                <span className="lbl">Tổng Công Hưởng Lương</span>
                <span className="val" style={{ color: "#0ea5e9" }}>
                  {d.tongNgayCong}
                </span>
              </div>
              <div className="att-item">
                <span className="lbl">Nghỉ Phép</span>
                <span className="val">{d.nghiCoPhep}</span>
              </div>
              <div className="att-item">
                <span className="lbl">Nghỉ Không Lương</span>
                <span className="val" style={{ color: "#f59e0b" }}>
                  {d.nghiKhongLuong}
                </span>
              </div>
              <div className="att-item">
                <span className="lbl">Không Phép</span>
                <span className="val" style={{ color: "#ef4444" }}>
                  {d.nghiKhongPhep}
                </span>
              </div>
              <div className="att-item">
                <span className="lbl">Nửa Ngày</span>
                <span className="val">{d.lamNuaNgay}</span>
              </div>
            </div>
          </div>

          <div className="net-salary-section">
            <div className="net-label">THỰC LĨNH (Net Salary)</div>
            <div className="net-amount">{formatCurrency(d.thucLanh)}</div>
          </div>
        </div>

        <div className="payslip-footer">
          <p className="note">
            * Mọi thắc mắc vui lòng liên hệ phòng Kế toán trong vòng 3 ngày.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="my-payslip-view">
      <div className="month-navigator-bar">
        <div className="month-navigator">
          <button onClick={() => changeMonth(-1)}>
            <FaChevronLeft />
          </button>
          <h2>
            Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
          </h2>
          <button onClick={() => changeMonth(1)}>
            <FaChevronRight />
          </button>
        </div>
        <button
          className="print-btn"
          onClick={handlePrint}
          disabled={!payslipData}
        >
          <FaPrint /> In Phiếu
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default MyPayslipPage;
