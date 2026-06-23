import React, { useState, useEffect, useRef } from "react";
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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

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

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1) return "vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return `${Math.floor(diff / 1440)} ngày trước`;
  };

  const typeConfig = {
    LEAVE: { icon: "🗓", label: "Nghỉ phép", tab: "LEAVE", color: "#16a34a" },
    OT:    { icon: "⏰", label: "Tăng ca",   tab: "OT",    color: "#7c3aed" },
    TRIP:  { icon: "✈️", label: "Công tác",  tab: "TRIP",  color: "#0369a1" },
  };

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchUnreadRequests = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        api.get("/ThongBao/unread-requests-count"),
        api.get("/ThongBao/pending-requests"),
      ]);
      if (countRes.data) setUnreadData(countRes.data);
      if (listRes.data)  setPendingRequests(listRes.data);
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

          <div
            ref={notifRef}
            className="notification-container"
            onClick={() => setIsNotifOpen((prev) => !prev)}
          >
            <FiBell size={20} />
            {unreadData.total > 0 && (
              <div className="notification-badge">{unreadData.total > 99 ? '99+' : unreadData.total}</div>
            )}
            {isNotifOpen && (
              <div className="notification-dropdown" style={{ display: "block" }}>
                <div className="notification-header">
                  Đơn từ chờ duyệt
                  {unreadData.total > 0 && (
                    <span style={{ marginLeft: "6px", background: "#ef4444", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px" }}>
                      {unreadData.total}
                    </span>
                  )}
                </div>
                {pendingRequests.length > 0 ? (
                  <>
                    {pendingRequests.map((req, idx) => {
                      const cfg = typeConfig[req.type] || typeConfig.LEAVE;
                      return (
                        <div
                          key={idx}
                          className="notification-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNotifOpen(false);
                            navigate(`/nghi-phep?tab=${cfg.tab}&requestId=${req.id}`);
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{cfg.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px" }}>
                                <span className="notification-title" style={{ color: cfg.color }}>{req.hoTen}</span>
                                <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0 }}>{timeAgo(req.ngayGui)}</span>
                              </div>
                              <span className="notification-desc">{req.moTa}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div
                      className="notification-item"
                      style={{ textAlign: "center", color: "#2563eb", fontSize: "13px", fontWeight: 500, justifyContent: "center" }}
                      onClick={(e) => { e.stopPropagation(); setIsNotifOpen(false); navigate("/nghi-phep"); }}
                    >
                      Xem tất cả đơn từ →
                    </div>
                  </>
                ) : (
                  <div className="notification-empty">Không có đơn từ chờ duyệt</div>
                )}
              </div>
            )}
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
