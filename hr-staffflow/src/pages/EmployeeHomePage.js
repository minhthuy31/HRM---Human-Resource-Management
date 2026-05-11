import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { Link, useNavigate, useParams, Outlet } from "react-router-dom";
import "../styles/EmployeeHome.css";
import {
  FiSun,
  FiMoon,
  FiLogOut,
  FiHome,
  FiUser,
  FiCalendar,
  FiFileText,
  FiClock,
  FiBriefcase,
  FiAperture,
  FiMessageCircle,
  FiX,
  FiSend,
} from "react-icons/fi";
import { FaSearch, FaUserAstronaut } from "react-icons/fa";
import FaceRecognition from "../components/FaceRecognition";

// Import các Modal
import LeaveRequestModal from "../components/modals/LeaveRequestModal";
import OTRequestModal from "../components/modals/OTRequestModal";
import BusinessTripModal from "../components/modals/BusinessTripModal";

import CheckInScanner from "../components/CheckInScanner";
import "../styles/Modal.css";
import "../styles/CheckInScanner.css";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("blob:")) return path;
  return `http://localhost:5260${path}`;
};

const EmployeeHomePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { employeeId } = useParams();

  // --- STATE MODALS ---
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isOTModalOpen, setIsOTModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  // --- STATE QUÉT QR ---
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // --- STATE FACE ID ---
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceMode, setFaceMode] = useState("checkin");

  const [timekeepingSummary, setTimekeepingSummary] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Kiểm tra trạng thái Dark Mode lúc mới load trang
  useEffect(() => {
    if (document.body.classList.contains("dark-mode")) {
      setIsDarkMode(true);
    }
  }, []);

  // Hàm Toggle Dark Mode đã được sửa để tương tác với thẻ Body
  const handleToggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
    document.body.classList.toggle("dark-mode");
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    // Tuỳ chọn: Có thể xóa class dark-mode khi logout để màn hình login luôn sáng
    document.body.classList.remove("dark-mode");
    navigate("/login");
  }, [navigate]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "bot",
      text: "Xin chào! Mình là Trợ lý AI nhân sự. Bạn muốn xin nghỉ phép, tăng ca hay đi công tác?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  // Hàm gửi tin nhắn
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    // 1. Thêm tin nhắn của User vào UI
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // 2. Gọi API Chatbot Backend
      const res = await api.post("/Chatbot", { message: userMsg });

      // 3. Thêm phản hồi của Bot vào UI
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: res.data.reply },
      ]);
    } catch (error) {
      console.error("Lỗi chatbot:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Xin lỗi, hiện tại không thể kết nối đến máy chủ AI.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Bắt sự kiện nhấn Enter để gửi
  const handleChatKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        const [userRes, timekeepingRes] = await Promise.all([
          api.get(`/NhanVien/${employeeId}`),
          api.get(`/ChamCong/${employeeId}?year=${year}&month=${month}`),
        ]);

        setUser(userRes.data);

        if (timekeepingRes.data.summaries) {
          setTimekeepingSummary(timekeepingRes.data.summaries[employeeId]);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu layout:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [employeeId, handleLogout]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // --- XỬ LÝ ĐĂNG KÝ NGHỈ PHÉP ---
  const handleSaveLeaveRequest = async (requestData) => {
    const formData = new FormData();
    formData.append("NgayBatDau", requestData.ngayBatDau);
    formData.append("NgayKetThuc", requestData.ngayKetThuc);
    formData.append("LyDo", requestData.lyDo);
    formData.append("SoNgayNghi", requestData.soNgayNghi);

    if (requestData.file) {
      formData.append("File", requestData.file);
    }

    try {
      await api.post("/DonNghiPhep/create-with-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Gửi đơn xin nghỉ thành công!");
      setIsLeaveModalOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra.";
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  // --- XỬ LÝ ĐĂNG KÝ OT ---
  const handleSaveOTRequest = async (data) => {
    try {
      const payload = {
        ...data,
        gioBatDau:
          data.gioBatDau.length === 5 ? `${data.gioBatDau}:00` : data.gioBatDau,
        gioKetThuc:
          data.gioKetThuc.length === 5
            ? `${data.gioKetThuc}:00`
            : data.gioKetThuc,
      };

      await api.post("/DangKyOT", payload);
      alert("Đăng ký làm thêm giờ thành công!");
      setIsOTModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi đăng ký OT.";
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  // --- XỬ LÝ ĐĂNG KÝ CÔNG TÁC ---
  const handleSaveTripRequest = async (data) => {
    try {
      await api.post("/DangKyCongTac", { ...data, MaNhanVien: employeeId });
      alert("Đăng ký công tác thành công!");
      setIsTripModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi đăng ký công tác.";
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  // --- HÀM XỬ LÝ NHẬN DIỆN KHUÔN MẶT ---
  const handleFaceCapture = async (faceDescriptor) => {
    try {
      if (faceMode === "register") {
        await api.post("/ChamCong/register-face", {
          MaNhanVien: employeeId,
          FaceDescriptor: faceDescriptor,
        });
        alert(
          "✅ Đăng ký khuôn mặt thành công! Bạn có thể dùng khuôn mặt để chấm công từ bây giờ.",
        );
      } else {
        const res = await api.post("/ChamCong/check-in-face", {
          FaceDescriptor: faceDescriptor,
        });

        if (res.data.success) {
          alert(`✅ ${res.data.message}`);
        } else {
          alert(
            "❌ " + (res.data.message || "Không nhận diện được khuôn mặt."),
          );
        }
      }
      setIsFaceModalOpen(false);
    } catch (error) {
      console.error("Lỗi API khuôn mặt:", error);
      const msg =
        error.response?.data?.message || "Đã có lỗi xảy ra khi kết nối server.";
      alert("❌ " + msg);
    }
  };

  const openFaceRegister = () => {
    setFaceMode("register");
    setIsFaceModalOpen(true);
  };

  const openFaceCheckIn = () => {
    setFaceMode("checkin");
    setIsFaceModalOpen(true);
  };

  // --- XỬ LÝ QUÉT QR ---
  const handleScanSuccess = (message) => {
    setScanResult({ type: "success", text: message });
    setIsScannerOpen(false);
    setTimeout(() => setScanResult(null), 5000);
  };

  const handleScanError = (message) => {
    setScanResult({ type: "error", text: message });
  };

  if (loading || !user) {
    return <div className="loading-fullscreen">Đang tải trang cá nhân...</div>;
  }

  return (
    <>
      <div className="employee-home-page">
        <nav className="employee-navbar">
          <div className="datetime">
            <div className="time">{formattedTime}</div>
            <div className="date">{formattedDate}</div>
          </div>
          <div className="navbar-center">
            <div className="search-container">
              <FaSearch />
              <input type="text" placeholder="Tìm kiếm tin tức, tài liệu..." />
            </div>
          </div>
          <div className="navbar-right">
            <div className="dark-mode-toggle" onClick={handleToggleDarkMode}>
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </div>
            <div className="avatar-container">
              <img
                src={getImageUrl(user.hinhAnh)}
                alt="Avatar"
                className="avatar"
              />
              <div className="dropdown-menu">
                <Link to="/change-password">Đổi mật khẩu</Link>
                <button onClick={handleLogout}>
                  <FiLogOut /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="employee-main-content">
          {/* SIDEBAR TRÁI ĐƯỢC LÀM MỚI */}
          <aside className="left-sidebar">
            <div className="profile-summary">
              <img
                src={getImageUrl(user.hinhAnh)}
                alt="Avatar"
                className="profile-avatar"
              />
              <h3>{user.hoTen}</h3>
              <p>{user.tenChucVu}</p>
            </div>

            {/* Khối Action Buttons được làm gọn gàng */}
            <div className="action-buttons">
              <button
                className="sidebar-action-btn"
                onClick={() => setIsLeaveModalOpen(true)}
              >
                <FiCalendar /> Nghỉ phép
              </button>

              <button
                className="sidebar-action-btn btn-ot"
                onClick={() => setIsOTModalOpen(true)}
              >
                <FiClock /> Tăng ca
              </button>

              <button
                className="sidebar-action-btn btn-trip"
                onClick={() => setIsTripModalOpen(true)}
              >
                <FiBriefcase /> Công tác
              </button>

              <button
                className="sidebar-action-btn sidebar-action-btn-checkin"
                onClick={openFaceCheckIn}
              >
                <FiAperture /> Chấm công FaceID
              </button>
            </div>

            {/* Menu Links có icon giống Dashboard */}
            <nav className="info-links">
              <ul>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}`}>
                    <FiHome /> Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}/details`}>
                    <FiUser /> Thông tin cá nhân
                  </Link>
                </li>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}/timekeeping`}>
                    <FiCalendar /> Bảng công tháng
                  </Link>
                </li>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}/payslip`}>
                    <FiFileText /> Bảng lương
                  </Link>
                </li>
                <li
                  style={{
                    marginTop: "20px",
                    borderTop: "1px solid var(--separator-color)",
                    paddingTop: "10px",
                  }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openFaceRegister();
                    }}
                  >
                    <FiAperture /> Cài đặt Face ID
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={handleLogout}
                    style={{ color: "#dc3545" }}
                  >
                    <FiLogOut /> Đăng xuất
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* NỘI DUNG CHÍNH */}
          <section className="main-feed">
            <Outlet context={{ employee: user }} />
          </section>

          {/* ĐÃ XÓA RIGHT SIDEBAR ĐỂ GIAO DIỆN RỘNG RÃI HƠN */}
        </main>
      </div>

      {/* --- MODAL SECTION --- */}

      {/* 1. Modal Nghỉ Phép */}
      {isLeaveModalOpen && (
        <LeaveRequestModal
          onSave={handleSaveLeaveRequest}
          onCancel={() => setIsLeaveModalOpen(false)}
          remainingLeaveDays={timekeepingSummary?.remainingLeaveDays}
        />
      )}

      {/* 2. Modal OT */}
      {isOTModalOpen && (
        <OTRequestModal
          onSave={handleSaveOTRequest}
          onCancel={() => setIsOTModalOpen(false)}
        />
      )}

      {/* 3. Modal Công Tác */}
      {isTripModalOpen && (
        <BusinessTripModal
          onSave={handleSaveTripRequest}
          onCancel={() => setIsTripModalOpen(false)}
        />
      )}

      {/* 4. Modal Quét QR */}
      {isScannerOpen && (
        <div className="modal-overlay">
          <div className="modal-content scanner-modal">
            <h2>Đưa mã QR vào khung hình</h2>
            <CheckInScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
            {scanResult && scanResult.type === "error" && (
              <p className="scan-error">{scanResult.text}</p>
            )}
            <button
              className="modal-close-btn"
              onClick={() => {
                setIsScannerOpen(false);
                setScanResult(null);
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL NHẬN DIỆN KHUÔN MẶT */}
      {isFaceModalOpen && (
        <FaceRecognition
          mode={faceMode}
          onCapture={handleFaceCapture}
          onClose={() => setIsFaceModalOpen(false)}
        />
      )}

      {/* Popup thông báo thành công */}
      {scanResult && scanResult.type === "success" && (
        <div className="scan-success-popup">{scanResult.text}</div>
      )}

      <div className="chatbot-widget">
        {/* Nút bấm tròn mở Chat */}
        {!isChatOpen && (
          <button
            className="chatbot-toggle-btn"
            onClick={() => setIsChatOpen(true)}
          >
            <FiMessageCircle size={28} />
          </button>
        )}

        {/* Khung cửa sổ Chat */}
        {isChatOpen && (
          <div className="chatbot-window">
            <div className="chat-header">
              <div className="chat-header-info">
                <FiMessageCircle size={20} />
                <span>Trợ lý Nhân sự</span>
              </div>
              <button
                className="chat-close-btn"
                onClick={() => setIsChatOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble-container ${msg.sender}`}
                >
                  {msg.sender === "bot" && (
                    <div className="chat-avatar">AI</div>
                  )}
                  <div className={`chat-bubble ${msg.sender}`}>
                    {/* Render text, hỗ trợ bôi đậm từ Markdown */}
                    {msg.text
                      .split("**")
                      .map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
                      )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="chat-bubble-container bot">
                  <div className="chat-avatar">AI</div>
                  <div className="chat-bubble bot typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-footer">
              <input
                type="text"
                placeholder="Nhập yêu cầu của bạn..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                disabled={isChatLoading}
              />
              <button
                onClick={handleSendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeHomePage;
