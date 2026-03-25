import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { FaBullhorn, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import AnnouncementModal from "../components/modals/AnnouncementModal";
import "../styles/AnnouncementPage.css";

// --- Custom Confirm Modal ---
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-confirm-modal">
        <h3 className="confirm-title">Xác nhận</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn-accept" onClick={onConfirm}>
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentData, setCurrentData] = useState(null);

  // --- TOAST STATE ---
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // --- CONFIRM MODAL STATE ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/ThongBao");
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách thông báo:", error);
      showToast("Lỗi khi tải danh sách thông báo.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenModal = (data = null) => {
    setCurrentData(data);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (currentData) {
        await api.put(`/ThongBao/${currentData.id}`, formData);
        showToast("Cập nhật thành công!", "success");
      } else {
        await api.post("/ThongBao", formData);
        showToast("Đăng thông báo thành công!", "success");
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (error) {
      showToast("Lỗi: " + (error.response?.data || error.message), "error");
    }
  };

  const handleDelete = (id, title) => {
    setConfirmDialog({
      isOpen: true,
      message: `Bạn có chắc muốn ẩn thông báo "${title}" khỏi hệ thống?`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/ThongBao/${id}`);
          showToast("Đã ẩn thông báo thành công!", "success");
          fetchAnnouncements();
        } catch (error) {
          showToast("Lỗi khi ẩn thông báo.", "error");
        }
      },
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getBadgeClass = (type) => {
    if (type === "Quan trọng") return "type-important";
    if (type === "Sự kiện nội bộ") return "type-event";
    return "type-general";
  };

  return (
    <DashboardLayout>
      <div className="announcement-page-container">
        {/* Header */}
        <div className="announcement-header-section">
          <div>
            <h1>
              <FaBullhorn style={{ color: "#f59e0b" }} /> Quản lý Bảng tin
            </h1>
            <p className="announcement-subtitle">
              Truyền đạt thông báo nội bộ đến toàn thể nhân viên
            </p>
          </div>
          <button className="btn-add-news" onClick={() => handleOpenModal()}>
            <FaPlus /> Soạn thông báo mới
          </button>
        </div>

        {/* Table */}
        <div className="announcement-content-box">
          {loading ? (
            <p style={{ color: "var(--main-text)" }}>Đang tải dữ liệu...</p>
          ) : (
            <div className="table-responsive">
              <table className="news-table">
                <thead>
                  <tr>
                    <th>Thời gian đăng</th>
                    <th>Phân loại</th>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th style={{ width: "100px" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 && (
                    <tr>
                      <td colSpan="5" className="news-empty">
                        Chưa có thông báo nào.
                      </td>
                    </tr>
                  )}
                  {announcements.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontSize: "0.9rem" }}>
                        {formatDate(item.ngayTao)}
                      </td>
                      <td>
                        <span
                          className={`type-badge ${getBadgeClass(item.loaiThongBao)}`}
                        >
                          {item.loaiThongBao}
                        </span>
                      </td>
                      <td className="news-title-cell" title={item.tieuDe}>
                        {item.tieuDe}
                      </td>
                      <td>
                        <span
                          className={
                            item.trangThai ? "status-visible" : "status-hidden"
                          }
                        >
                          {item.trangThai ? "Đang hiển thị" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn"
                            onClick={() => handleOpenModal(item)}
                            title="Sửa"
                          >
                            <FaEdit color="#3b82f6" size={18} />
                          </button>

                          {item.trangThai && (
                            <button
                              className="action-btn"
                              onClick={() => handleDelete(item.id, item.tieuDe)}
                              title="Ẩn bài"
                            >
                              <FaTrash color="#ef4444" size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <AnnouncementModal
          data={currentData}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {/* --- CONFIRM MODAL --- */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* --- TOAST COMPONENT --- */}
      <div
        className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
      >
        {toast.message}
      </div>
    </DashboardLayout>
  );
};

export default AnnouncementPage;
