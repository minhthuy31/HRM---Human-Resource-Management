import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      setMessage(response.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra.");
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
          " Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây."
      );
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{step === 1 ? "Quên Mật Khẩu" : "Đặt Lại Mật Khẩu"}</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {step === 1 ? (
          // Form cho bước 1
          <form onSubmit={handleRequestCode}>
            <p style={{ textAlign: "center", marginBottom: "20px" }}>
              Vui lòng nhập email của bạn để nhận mã khôi phục.
            </p>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-submit" type="submit">
              Gửi mã
            </button>
          </form>
        ) : (
          // Form cho bước 2
          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Nhập mã xác nhận (6 chữ số)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-submit" type="submit">
              Xác nhận
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
