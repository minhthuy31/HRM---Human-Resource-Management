// src/components/EmployeeWelcome.js
import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  FaCalendarCheck,
  FaMoneyCheckAlt,
  FaBullhorn,
  FaClock,
  FaChevronRight,
} from "react-icons/fa";
import { api } from "../api";
import "../styles/EmployeeWelcome.css";

const EmployeeWelcome = () => {
  // LẤY DỮ LIỆU TỪ OUTLET CONTEXT TRUYỀN XUỐNG
  const { employee, timekeepingSummary } = useOutletContext();

  const [greeting, setGreeting] = useState("Xin chào");
  const [newsList, setNewsList] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // STATE MỚI ĐỂ LƯU SỐ PHÉP CÒN LẠI TỪ API
  const [remainingLeave, setRemainingLeave] = useState(0);

  // Xử lý lời chào
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Chào buổi sáng");
    else if (hour >= 12 && hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  // Gọi API Bảng tin & Gọi API Số Phép Cùng lúc
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingNews(true);
        // Chạy song song 2 API cho nhanh
        const [newsRes, leaveRes] = await Promise.all([
          api.get("/ThongBao/latest"),
          api.get("/DonNghiPhep/balance"),
        ]);

        setNewsList(newsRes.data);
        setRemainingLeave(leaveRes.data.remainingDays); // Lấy số phép từ API của bạn
      } catch (error) {
        console.error("Lỗi lấy dữ liệu trang chủ:", error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchData();
  }, []);

  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // === DỮ LIỆU THẬT ===
  // Lấy dữ liệu từ Dictionary thay vì Object nếu API trả về Dictionary
  const currentSummary =
    timekeepingSummary?.[employee?.maNhanVien] || timekeepingSummary;

  const totalWorkDays =
    currentSummary?.ngayCong ??
    currentSummary?.tongNgayCong ??
    currentSummary?.tongCong ??
    0;
  const totalLate = currentSummary?.diMuon ?? currentSummary?.soLanDiMuon ?? 0;

  return (
    <div className="emp-welcome-container">
      {/* 1. Banner */}
      <div className="welcome-hero-banner">
        <div className="hero-content">
          <h2>
            {greeting}, {employee?.hoTen}! 👋
          </h2>
          <p>
            Hôm nay là {today}. Chúc bạn một ngày làm việc hiệu quả và tràn đầy
            năng lượng.
          </p>
        </div>
        <div className="hero-illustration">
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/business-team-working-on-project-5301844-4423086.png"
            alt="Work Illustration"
          />
        </div>
      </div>

      {/* 2. Thẻ Truy cập nhanh (DỮ LIỆU THẬT) */}
      <div className="quick-stats-row">
        <div className="stat-card blue-card">
          <div className="stat-icon">
            <FaCalendarCheck />
          </div>
          <div className="stat-info">
            <span className="stat-label">Phép năm còn lại</span>
            {/* Lấy từ API DonNghiPhep/balance */}
            <h3 className="stat-value">
              {remainingLeave} <small>ngày</small>
            </h3>
          </div>
        </div>

        <div className="stat-card green-card">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ngày công tháng này</span>
            {/* Lấy từ API ChamCong summary */}
            <h3 className="stat-value">
              {totalWorkDays} <small>ngày</small>
            </h3>
          </div>
        </div>

        <Link
          to={`/employee-home/${employee?.maNhanVien}/payslip`}
          className="stat-card purple-card action-card"
        >
          <div className="stat-icon">
            <FaMoneyCheckAlt />
          </div>
          <div className="stat-info">
            <span className="stat-label">Kỳ lương gần nhất</span>
            <h3 className="stat-value view-payslip-text">
              Xem Bảng Lương <FaChevronRight className="arrow-icon" />
            </h3>
          </div>
        </Link>
      </div>

      {/* 3. Widgets */}
      <div className="dashboard-widgets-row">
        {/* Bảng tin Công ty */}
        <div className="widget-box news-widget">
          <div className="widget-header">
            <h3>
              <FaBullhorn className="header-icon" /> Bảng tin Công ty
            </h3>
            {newsList.length > 0 && (
              <button className="btn-view-all">Mới nhất</button>
            )}
          </div>
          <div className="widget-body">
            <ul className="news-list">
              {loadingNews ? (
                <li
                  className="news-item"
                  style={{
                    border: "none",
                    color: "var(--toggle-icon-color)",
                    fontStyle: "italic",
                  }}
                >
                  Đang tải bảng tin...
                </li>
              ) : newsList.length === 0 ? (
                <li
                  className="news-item"
                  style={{
                    border: "none",
                    color: "var(--toggle-icon-color)",
                    fontStyle: "italic",
                  }}
                >
                  Chưa có thông báo nào từ Ban Giám Đốc.
                </li>
              ) : (
                newsList.map((news) => (
                  <li key={news.id} className="news-item">
                    <div className="news-date">
                      <span className="day">{news.date.split("/")[0]}</span>
                      <span className="month">Th{news.date.split("/")[1]}</span>
                    </div>
                    <div className="news-content">
                      <span
                        className={`news-badge ${
                          news.type === "Quan trọng"
                            ? "badge-danger"
                            : news.type === "Sự kiện nội bộ"
                              ? "badge-warning"
                              : "badge-primary"
                        }`}
                      >
                        {news.type}
                      </span>
                      <h4 title={news.content}>{news.title}</h4>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Nhắc nhở cá nhân (DỮ LIỆU THẬT) */}
        <div className="widget-box tasks-widget">
          <div className="widget-header">
            <h3>Nhắc nhở của bạn</h3>
          </div>
          <div className="widget-body">
            {totalLate > 0 ? (
              <div
                className="alert-box warning"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  color: "#f59e0b",
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <strong>Chú ý:</strong> Bạn đã đi muộn {totalLate} lần trong
                tháng này. Vui lòng đi làm đúng giờ nhé!
              </div>
            ) : (
              <div
                className="alert-box success"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  borderLeft: "4px solid #10b981",
                }}
              >
                Tuyệt vời! Bạn chưa đi muộn lần nào trong tháng này.
              </div>
            )}

            {remainingLeave <= 2 && (
              <div
                className="alert-box info"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  borderLeft: "4px solid #ef4444",
                  marginTop: "10px",
                }}
              >
                Số ngày phép của bạn chỉ còn lại {remainingLeave} ngày. Hãy lưu
                ý khi xin nghỉ!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeWelcome;
