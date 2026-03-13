import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import "../styles/ChangePasswordPage.css";

function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    // gọi đến api change-password
    try {
      await api.post("/Auth/change-password", {
        oldPassword,
        newPassword,
      });

      setMessage(
        "Đổi mật khẩu thành công! Bạn sẽ được đăng xuất để đăng nhập lại."
      );

      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Đã có lỗi xảy ra.");
    }
  };

  return (
    <DashboardLayout>
      <div className="change-password-container">
        <div className="change-password-card">
          <h1>Đổi Mật Khẩu</h1>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="password"
                placeholder="Mật khẩu hiện tại"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
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
              Xác nhận thay đổi
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChangePasswordPage;
