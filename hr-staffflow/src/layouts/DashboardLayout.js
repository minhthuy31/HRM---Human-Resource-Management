import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiSun, FiMoon, FiBell } from "react-icons/fi";
import { api } from "../api";
import "../styles/DashboardLayout.css";
import logo from "../assets/logo.png";

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );
  const navigate = useNavigate();
  const [nhanVien, setNhanVien] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadData, setUnreadData] = useState({ total: 0, nghiPhep: 0, ot: 0, congTac: 0 });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadRequests = async () => {
    try {
      const response = await api.get("/ThongBao/unread-requests-count");
      if (response.data) {
        setUnreadData(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy số đơn chờ duyệt:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUnreadRequests();
      // Tự động làm mới mỗi 60 giây
      const intervalId = setInterval(fetchUnreadRequests, 60000);
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/Auth/me");
        setNhanVien(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const handleMouseEnter = () => isCollapsed && setIsHovered(true);
  const handleMouseLeave = () => isCollapsed && setIsHovered(false);
  const handleToggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(currentTime);

  return (
    <div
      className={`dashboard-container ${isCollapsed ? "collapsed" : ""} ${
        isHovered ? "hovered" : ""
      }`}
    >
      <aside
        className="sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-header">
          <div className="system-title">
            <img src={logo} alt="HR Icon" className="logo" />
            {(!isCollapsed || isHovered) && <h2>Hệ Thống</h2>}
          </div>
          {(!isCollapsed || isHovered) && (
            <button className="toggle-btn" onClick={toggleSidebar}>
              <FiLogOut
                className={`toggle-icon ${isCollapsed ? "rotated" : ""}`}
                size={24}
              />
            </button>
          )}
        </div>
        <ul>
          <li>
            <Link to="/dashboard">
              <span className="icon">🏠</span>
              <span className="text">Trang chủ</span>
            </Link>
          </li>
          <li>
            <Link to="/nhan-vien">
              <span className="icon">👥</span>
              <span className="text">Quản lý nhân viên</span>
            </Link>
          </li>
          <li>
            <Link to="/phong-ban">
              <span className="icon">🏢</span>
              <span className="text">Phòng ban</span>
            </Link>
          </li>
          <li>
            <Link to="/cham-cong">
              <span className="icon">⏰</span>
              <span className="text">Chấm công</span>
            </Link>
          </li>
          <li>
            <Link to="/luong">
              <span className="icon">💰</span>
              <span className="text">Tính lương</span>
            </Link>
          </li>
          <li>
            <Link to="/nghi-phep">
              <span className="icon">🌴</span>
              <span className="text">Quản lý đơn từ</span>
            </Link>
          </li>
          <li>
            <Link to="/hop-dong">
              <span className="icon">🤝</span>
              <span className="text">Quản lý hợp đồng</span>
            </Link>
          </li>
          {/*<li>
            <Link to="/khen-thuong">
              <span className="icon">🏅</span>
              <span className="text">Khen thưởng / Kỷ luật</span>
            </Link>
          </li>*/}
          <li>
            <Link to="/thong-bao">
              <span className="icon">📚</span>
              <span className="text">Thông báo</span>
            </Link>
          </li>
          <li>
            <Link to="/bao-cao">
              <span className="icon">📊</span>
              <span className="text">Báo cáo</span>
            </Link>
          </li>
          <li className="menu-separator">
            <Link to="/cai-dat">
              <span className="icon">⚙️</span>
              <span className="text">Cài đặt hệ thống</span>
            </Link>
          </li>
          {/*<li>
            <Link to="/nguoi-dung">
              <span className="icon">👤</span>
              <span className="text">Người dùng</span>
            </Link>
          </li>*/}
        </ul>
      </aside>

      <main className="main-content">
        <div className="navbar">
          <div className="datetime-container">
            <div className="time">{formattedTime}</div>
            <div className="date">{formattedDate}</div>
          </div>

          <div className="dark-mode-toggle" onClick={handleToggleDarkMode}>
            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </div>

          <div className="notification-container">
            <FiBell size={20} />
            {unreadData.total > 0 && (
              <div className="notification-badge">{unreadData.total > 99 ? '99+' : unreadData.total}</div>
            )}
            <div className="notification-hover-zone"></div>
            <div className="notification-dropdown">
              <div className="notification-header">Thông báo đơn từ</div>
              {unreadData.total > 0 ? (
                <>
                  {unreadData.nghiPhep > 0 && (
                    <Link to="/nghi-phep" className="notification-item">
                      <span className="notification-title">Đơn xin nghỉ phép</span>
                      <span className="notification-desc">Có {unreadData.nghiPhep} đơn chờ duyệt</span>
                    </Link>
                  )}
                  {unreadData.ot > 0 && (
                    <Link to="/nghi-phep" className="notification-item">
                      <span className="notification-title">Đơn đăng ký OT</span>
                      <span className="notification-desc">Có {unreadData.ot} đơn chờ duyệt</span>
                    </Link>
                  )}
                  {unreadData.congTac > 0 && (
                    <Link to="/nghi-phep" className="notification-item">
                      <span className="notification-title">Đơn đăng ký công tác</span>
                      <span className="notification-desc">Có {unreadData.congTac} đơn chờ duyệt</span>
                    </Link>
                  )}
                </>
              ) : (
                <div className="notification-empty">Không có đơn từ chờ duyệt</div>
              )}
            </div>
          </div>

          <div className="avatar-container">
            <div className="avatar">
              {nhanVien?.hoTen
                ? nhanVien.hoTen.trim().split(" ").pop().charAt(0).toUpperCase()
                : ""}
            </div>
            <div className="avatar-hover-zone"></div>
            <div className="dropdown-menu">
              <Link to="/profile">Trang cá nhân</Link>
              <Link to="/change-password">Đổi mật khẩu</Link>
              <button className="dropdown-button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        <div className="page-content-wrapper">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
