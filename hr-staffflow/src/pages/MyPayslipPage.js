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

// Helper format tiền
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

  // 1. Quét mọi Key để đảm bảo luôn lấy được Mã Nhân Viên (tránh undefined)
  const tokenEmpId =
    user?.nameid ||
    user?.id ||
    user?.MaNhanVien ||
    user?.[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    user?.unique_name;

  // Ưu tiên lấy từ Context, nếu không có thì lấy từ Token
  const currentEmpId = contextEmployee?.maNhanVien || tokenEmpId;
  const employeeName =
    contextEmployee?.hoTen || user?.unique_name || "Nhân viên";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (date) => {
      // Đã bỏ câu lệnh if(!employeeId) cản trở việc gọi API
      setLoading(true);
      setError(null);
      setPayslipData(null);

      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const response = await api.get(
          `/BangLuong?year=${year}&month=${month}`,
        );

        const responseData = response.data;
        const list = responseData.data || responseData.Data || [];

        let myRecord = null;

        // 2. Logic lấy phiếu lương THÔNG MINH và BẢO MẬT
        if (list.length === 1) {
          // Trường hợp Backend chỉ trả về đúng 1 người (nhân viên thường xem)
          myRecord = list[0];
        } else if (list.length > 1 && currentEmpId) {
          // Trường hợp sếp/quản lý vào trang cá nhân, Backend trả nguyên list phòng ban
          // -> Phải tìm chính xác ID của họ trong list đó
          myRecord = list.find(
            (item) =>
              (item.maNhanVien || item.MaNhanVien)?.toLowerCase() ===
              currentEmpId.toLowerCase(),
          );
        }

        if (myRecord) {
          setPayslipData(myRecord);
        } else {
          setPayslipData(null);
        }
      } catch (err) {
        console.error("Lỗi tải phiếu lương:", err);
        if (err.response && err.response.status === 403) {
          setPayslipData(null);
        } else {
          setError("Không thể tải dữ liệu bảng lương (hoặc chưa được chốt).");
        }
      } finally {
        setLoading(false);
      }
    },
    [currentEmpId], // Dependency quan trọng
  );

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const changeMonth = (offset) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
    if (loading) {
      return <div className="loading-text">Đang tải phiếu lương...</div>;
    }

    if (!payslipData) {
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
    }

    if (error) {
      return <div className="error-text">{error}</div>;
    }

    // --- BƯỚC QUAN TRỌNG: CHUẨN HÓA DỮ LIỆU ---
    const p = payslipData;
    const d = {
      // Cố Định
      luongCoBan: p.luongCoBan ?? p.LuongCoBan ?? 0,
      tongPhuCap: p.tongPhuCap ?? p.TongPhuCap ?? 0,

      // Chấm Công
      tongNgayCong: p.tongNgayCong ?? p.TongNgayCong ?? 0,
      tongGioOT: p.tongGioOT ?? p.TongGioOT ?? 0,
      nghiCoPhep: p.nghiCoPhep ?? p.NghiCoPhep ?? 0,
      nghiKhongPhep: p.nghiKhongPhep ?? p.NghiKhongPhep ?? 0,
      lamNuaNgay: p.lamNuaNgay ?? p.LamNuaNgay ?? 0,

      // Thu Nhập
      luongChinh: p.luongChinh ?? p.LuongChinh ?? 0,
      luongOT: p.luongOT ?? p.LuongOT ?? 0,
      tongThuNhap: p.tongThuNhap ?? p.TongThuNhap ?? 0,

      // Khấu Trừ
      khauTruBHXH: p.khauTruBHXH ?? p.KhauTruBHXH ?? 0,
      khauTruBHYT: p.khauTruBHYT ?? p.KhauTruBHYT ?? 0,
      khauTruBHTN: p.khauTruBHTN ?? p.KhauTruBHTN ?? 0,
      thueTNCN: p.thueTNCN ?? p.ThueTNCN ?? 0,
      khoanTruKhac: p.khoanTruKhac ?? p.KhoanTruKhac ?? 0,

      // Kết Quả
      thucLanh: p.thucLanh ?? p.ThucLanh ?? 0,

      // Thông tin nhân viên (nếu API trả về lồng nhau)
      hoTen: p.nhanVien?.hoTen || p.NhanVien?.HoTen || employeeName,
      phongBan: p.nhanVien?.tenPhongBan || p.NhanVien?.TenPhongBan || "---",
      chucVu: p.nhanVien?.tenChucVu || p.NhanVien?.TenChucVu || "---",
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
          {/* 1. THU NHẬP */}
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
              <span>Lương Chính ({d.tongNgayCong} công)</span>
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

          {/* 2. KHẤU TRỪ */}
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

          {/* 3. THÔNG TIN CÔNG */}
          <div className="section-block info-only">
            <h4 className="section-title text-blue">III. CHI TIẾT CHẤM CÔNG</h4>
            <div className="attendance-grid">
              <div className="att-item">
                <span className="lbl">Tổng Công</span>
                <span className="val">{d.tongNgayCong}</span>
              </div>
              <div className="att-item">
                <span className="lbl">Nghỉ Phép</span>
                <span className="val">{d.nghiCoPhep}</span>
              </div>
              <div className="att-item">
                <span className="lbl">Không Phép</span>
                <span className="val">{d.nghiKhongPhep}</span>
              </div>
              <div className="att-item">
                <span className="lbl">Nửa Ngày</span>
                <span className="val">{d.lamNuaNgay}</span>
              </div>
            </div>
          </div>

          {/* 4. THỰC LĨNH */}
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
          <h2>{`Tháng ${
            currentDate.getMonth() + 1
          }, ${currentDate.getFullYear()}`}</h2>
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
