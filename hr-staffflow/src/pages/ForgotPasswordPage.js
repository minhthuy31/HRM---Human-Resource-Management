import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import "../styles/LoginPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  // bước 1: Gửi yêu cầu mã code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await api.post("/Auth/forgot-password", { email });
      setMessage(
        response.data.message || "Đã gửi mã xác nhận đến email của bạn.",
      );
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.",
      );
    }
  };

  // bước 2: Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const response = await api.post("/Auth/reset-password", {
        email,
        code,
        newPassword,
      });
      setMessage(
        response.data.message +
          " Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây.",
      );
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra hoặc mã code không đúng.",
      );
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* CỘT TRÁI - BANNER GIỐNG TRANG LOGIN */}
        <div className="login-banner">
          <div className="banner-content">
            <h1>Khôi phục mật khẩu</h1>
            <p>
              Hệ thống sẽ gửi mã xác nhận gồm 6 chữ số đến email của bạn. Vui
              lòng kiểm tra hộp thư đến để đặt lại mật khẩu.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI - KHU VỰC FORM */}
        <div className="login-form-area">
          <div className="login-box auth-form">
            <div className="brand-header">
              <h2>{step === 1 ? "Quên Mật Khẩu" : "Đặt Lại Mật Khẩu"}</h2>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            {step === 1 ? (
              // FORM BƯỚC 1: NHẬP EMAIL
              <form onSubmit={handleRequestCode}>
                <p
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Vui lòng nhập email tài khoản của bạn để nhận mã khôi phục.
                </p>

                <div className="input-group">
                  <label>Email của bạn</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button className="btn-submit" type="submit">
                  Gửi mã xác nhận
                </button>

                <div
                  className="form-actions"
                  style={{ justifyContent: "center", marginTop: "20px" }}
                >
                  <div className="forgot-password-link">
                    <Link to="/login">Quay lại trang Đăng nhập</Link>
                  </div>
                </div>
              </form>
            ) : (
              // FORM BƯỚC 2: NHẬP MÃ & MẬT KHẨU MỚI
              <form onSubmit={handleResetPassword}>
                <p
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Mã xác nhận đã được gửi đến: <strong>{email}</strong>
                </p>

                <div className="input-group">
                  <label>Mã xác nhận</label>
                  <input
                    type="text"
                    placeholder="Nhập mã 6 chữ số"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>

                <div className="input-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button className="btn-submit" type="submit">
                  Xác nhận đổi mật khẩu
                </button>

                <div
                  className="form-actions"
                  style={{ justifyContent: "center", marginTop: "20px" }}
                >
                  <div className="forgot-password-link">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3b82f6",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Nhập lại Email
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
