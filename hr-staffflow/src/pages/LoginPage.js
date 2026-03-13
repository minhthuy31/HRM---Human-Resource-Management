import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import "../styles/LoginPage.css";
import logo from "../assets/logo.png";
import "../App.css";
import { FaBriefcase, FaUserCircle } from "react-icons/fa";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();

  const normalizeRole = (r) => {
    if (!r) return "";
    return r
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/Auth/login", { email, password });

      const { token, refreshToken, role, maNhanVien, hoTen } = response.data;

      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      const cleanRole = normalizeRole(role);
      const dashboardRoles = ["giamdoc", "truongphong", "ketoantruong", "nhansutruong"];

      if (cleanRole === "nhanvien") {
        navigate(`/employee-home/${maNhanVien}`);
      } else if (dashboardRoles.includes(cleanRole)) {
        setUserData({ maNhanVien, hoTen, role });
        setShowRoleSelection(true);
      } else {
        setError("Vai trò không được hỗ trợ: " + role);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToPersonal = () => {
    navigate(`/employee-home/${userData.maNhanVien}`);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* Nửa bên trái: Banner / Slogan */}
        <div className="login-banner">
          <div className="banner-content">
            <h1>StaffFlow HR</h1>
            <p>Giải pháp Quản trị Nguồn nhân lực toàn diện, tối ưu hóa hiệu suất và nâng tầm không gian làm việc của doanh nghiệp bạn.</p>
          </div>
        </div>

        {/* Nửa bên phải: Khu vực tương tác */}
        <div className="login-form-area">
          <div className="login-box">
            <div className="brand-header">
              <img src={logo} alt="Brand Logo" className="login-logo" />
              {!showRoleSelection && <h2>Đăng nhập</h2>}
            </div>

            {!showRoleSelection ? (
              <>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="input-group">
                    <label>Địa chỉ Email</label>
                    <input
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Mật khẩu</label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <div className="forgot-password-link">
                      <Link to="/forgot-password">Quên mật khẩu?</Link>
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
                  </button>
                </form>
              </>
            ) : (
              <div className="role-selection-container">
                <div className="welcome-header">
                  <h3>Xin chào, {userData?.hoTen}</h3>
                  <span className="role-badge">{userData?.role}</span>
                </div>
                <p className="instruction-text">
                  Vui lòng chọn không gian làm việc của bạn để tiếp tục:
                </p>

                <div className="role-buttons">
                  <button onClick={handleGoToDashboard} className="btn-select-role btn-dashboard">
                    <div className="icon-wrapper dashboard-icon">
                      <FaBriefcase />
                    </div>
                    <div className="text">
                      <strong>Không gian Quản lý</strong>
                    </div>
                  </button>

                  <button onClick={handleGoToPersonal} className="btn-select-role btn-personal">
                    <div className="icon-wrapper personal-icon">
                      <FaUserCircle />
                    </div>
                    <div className="text">
                      <strong>Không gian Cá nhân</strong>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;