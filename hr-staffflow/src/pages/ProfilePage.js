import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import "../styles/ProfilePage.css";
import {
  FaUserCircle,
  FaEnvelope,
  FaUserTag,
  FaCalendarAlt,
} from "react-icons/fa";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/Auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Không thể tải thông tin cá nhân", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div>Không tìm thấy thông tin người dùng.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page-container">
        <div className="profile-card">
          <div className="profile-card-header">
            <FaUserCircle className="profile-avatar-icon" />
            <h2>{user.username}</h2>
          </div>

          <div className="profile-card-body">
            <div className="profile-info-row">
              <FaEnvelope className="info-icon" />
              <span className="info-label">Email:</span>
              <span className="info-value">
                {user.email || "Chưa cập nhật"}
              </span>
            </div>
            <div className="profile-info-row">
              <FaUserTag className="info-icon" />
              <span className="info-label">Vai trò:</span>
              <span className="info-value">{user.role}</span>
            </div>
            <div className="profile-info-row">
              <FaCalendarAlt className="info-icon" />
              <span className="info-label">Ngày tạo:</span>
              <span className="info-value">
                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          <div className="profile-card-footer">
            <button
              className="back-button"
              onClick={() => navigate("/dashboard")}
            >
              Quay về Trang chủ
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
