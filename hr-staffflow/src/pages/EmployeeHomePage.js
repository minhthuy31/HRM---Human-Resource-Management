import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import { Link, useNavigate, useParams, Outlet } from "react-router-dom";
import "../styles/EmployeeHome.css";
// 1. Import icon đã gộp (để tránh lỗi FaSearch declared)
import { FaSearch, FaUserAstronaut } from "react-icons/fa";

// 2. QUAN TRỌNG: Import component FaceRecognition (Sửa lỗi not defined)
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
  const handleToggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

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

  // --- MỚI: XỬ LÝ ĐĂNG KÝ OT ---
  const handleSaveOTRequest = async (data) => {
    try {
      const payload = {
        ...data,
        gioBatDau: data.gioBatDau.length === 5 ? `${data.gioBatDau}:00` : data.gioBatDau,
        gioKetThuc: data.gioKetThuc.length === 5 ? `${data.gioKetThuc}:00` : data.gioKetThuc,
      };

      await api.post("/DangKyOT", payload);
      alert("Đăng ký làm thêm giờ thành công!");
      setIsOTModalOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi khi đăng ký OT.";
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  // --- MỚI: XỬ LÝ ĐĂNG KÝ CÔNG TÁC ---
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
            <div className="action-buttons">
              <button
                className="sidebar-action-btn"
                onClick={() => setIsLeaveModalOpen(true)}
              >
                Đăng ký nghỉ
              </button>

              <button
                className="sidebar-action-btn"
                onClick={() => setIsOTModalOpen(true)}
              >
                Đăng ký OT
              </button>

              <button
                className="sidebar-action-btn"
                onClick={() => setIsTripModalOpen(true)}
              >
                Đăng ký Công tác
              </button>

              <button className="sidebar-action-btn" onClick={openFaceCheckIn}>
                📸 Chấm công Khuôn mặt
              </button>

              <button
                className="sidebar-action-btn sidebar-action-btn-checkin"
                onClick={() => {
                  setScanResult(null);
                  setIsScannerOpen(true);
                }}
              >
                Quét QR Chấm công
              </button>
            </div>

            <nav className="info-links">
              <ul>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}/details`}>
                    Thông tin chung
                  </Link>
                </li>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}/timekeeping`}>
                    Bảng công tháng
                  </Link>
                </li>
                <li>
                  <Link to={`/employee-home/${user.maNhanVien}/payslip`}>
                    Bảng lương
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openFaceRegister();
                    }}
                  >
                    Cài đặt dữ liệu khuôn mặt
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleLogout}>
                    Đăng xuất
                  </a>
                </li>
              </ul>
            </nav>
          </aside>
          <section className="main-feed">
            <Outlet context={{ employee: user }} />
          </section>
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
    </>
  );
};

export default EmployeeHomePage;
