import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import {
  FaBuilding,
  FaClock,
  FaMoneyBillWave,
  FaEnvelope,
  FaSave,
} from "react-icons/fa";
import "../styles/SystemSettingsPage.css";

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

const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(false);

  // State mặc định
  const [settings, setSettings] = useState({
    tenCongTy: "",
    tenVietTat: "",
    maSoThue: "",
    diaChi: "",
    sdtHotline: "",
    gioVaoLam: "08:30",
    gioTanLam: "17:30",
    thoiGianNghiTrua: "12:00 - 13:00",
    soPhutDiMuonChoPhep: 15,
    ngayPhepTieuChuan: 12,
    mucLuongCoSo: 1800000,
    phanTramBHXHCompany: 21.5,
    phanTramBHXHEmployee: 10.5,
    giamTruGiaCanh: 11000000,
    giamTruPhuThuoc: 4400000,
    smtpServer: "",
    smtpPort: "",
    emailGuiDi: "",
    guiMailTuDong: false,
  });

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

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
  };

  // 1. FETCH DỮ LIỆU & CHUẨN HÓA KEY
  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get("/SystemSettings");
      if (response.data) {
        // Chuyển đổi các key viết hoa từ Backend (PascalCase) sang (camelCase)
        const normalizedData = {};
        for (const key in response.data) {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          normalizedData[camelKey] =
            response.data[key] !== null ? response.data[key] : "";
        }
        setSettings((prev) => ({ ...prev, ...normalizedData }));
      }
    } catch (error) {
      console.error("Lỗi tải cấu hình:", error);
      showToast("Không thể tải cấu hình từ máy chủ.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 2. ÉP KIỂU SỐ TRƯỚC KHI LƯU TRÁNH LỖI 400 BAD REQUEST
  const handleSave = () => {
    setConfirmDialog({
      isOpen: true,
      message: "Bạn có chắc chắn muốn lưu các thay đổi cấu hình hệ thống này?",
      onConfirm: async () => {
        closeConfirm();
        setLoading(true);
        try {
          const payload = {
            ...settings,
            // Ép kiểu các trường Number để C# không bị lỗi chối từ
            soPhutDiMuonChoPhep: Number(settings.soPhutDiMuonChoPhep) || 0,
            ngayPhepTieuChuan: Number(settings.ngayPhepTieuChuan) || 0,
            mucLuongCoSo: Number(settings.mucLuongCoSo) || 0,
            phanTramBHXHCompany: Number(settings.phanTramBHXHCompany) || 0,
            phanTramBHXHEmployee: Number(settings.phanTramBHXHEmployee) || 0,
            giamTruGiaCanh: Number(settings.giamTruGiaCanh) || 0,
            giamTruPhuThuoc: Number(settings.giamTruPhuThuoc) || 0,
          };

          await api.post("/SystemSettings", payload);
          showToast("Đã lưu cấu hình hệ thống thành công!", "success");
        } catch (error) {
          console.error("Lỗi lưu cấu hình:", error);
          showToast("Có lỗi xảy ra khi lưu cấu hình.", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="settings-page-container">
        <div className="settings-header">
          <div>
            <h1>Cài đặt hệ thống</h1>
          </div>
          <button
            className="btn-save-settings"
            onClick={handleSave}
            disabled={loading}
          >
            <FaSave /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>

        <div className="settings-layout">
          {/* Menu bên trái */}
          <div className="settings-sidebar">
            <ul className="settings-menu">
              <li
                className={activeTab === "company" ? "active" : ""}
                onClick={() => setActiveTab("company")}
              >
                <FaBuilding className="tab-icon" /> Thông tin doanh nghiệp
              </li>
              <li
                className={activeTab === "timekeeping" ? "active" : ""}
                onClick={() => setActiveTab("timekeeping")}
              >
                <FaClock className="tab-icon" /> Chấm công & Ngày nghỉ
              </li>
              <li
                className={activeTab === "payroll" ? "active" : ""}
                onClick={() => setActiveTab("payroll")}
              >
                <FaMoneyBillWave className="tab-icon" /> Thuế & Bảo hiểm
              </li>
              <li
                className={activeTab === "email" ? "active" : ""}
                onClick={() => setActiveTab("email")}
              >
                <FaEnvelope className="tab-icon" /> Cấu hình Email
              </li>
            </ul>
          </div>

          {/* Form nội dung bên phải */}
          <div className="settings-content">
            {/* TAB 1: CÔNG TY */}
            {activeTab === "company" && (
              <div className="settings-panel">
                <h2>Thông tin doanh nghiệp</h2>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Tên Công ty đầy đủ</label>
                    <input
                      type="text"
                      name="tenCongTy"
                      value={settings.tenCongTy || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên viết tắt / Tên giao dịch</label>
                    <input
                      type="text"
                      name="tenVietTat"
                      value={settings.tenVietTat || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Mã số thuế</label>
                    <input
                      type="text"
                      name="maSoThue"
                      value={settings.maSoThue || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hotline nhân sự</label>
                    <input
                      type="text"
                      name="sdtHotline"
                      value={settings.sdtHotline || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Địa chỉ Trụ sở chính (In lên báo cáo, hợp đồng)</label>
                  <input
                    type="text"
                    name="diaChi"
                    value={settings.diaChi || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CHẤM CÔNG */}
            {activeTab === "timekeeping" && (
              <div className="settings-panel">
                <h2>Chấm công & Ngày nghỉ</h2>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Giờ vào làm tiêu chuẩn</label>
                    <input
                      type="time"
                      name="gioVaoLam"
                      value={settings.gioVaoLam || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ tan làm tiêu chuẩn</label>
                    <input
                      type="time"
                      name="gioTanLam"
                      value={settings.gioTanLam || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Khung giờ nghỉ trưa</label>
                    <input
                      type="text"
                      name="thoiGianNghiTrua"
                      value={settings.thoiGianNghiTrua || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Thời gian cho phép đi muộn (Phút)</label>
                    <input
                      type="number"
                      name="soPhutDiMuonChoPhep"
                      value={
                        settings.soPhutDiMuonChoPhep !== undefined
                          ? settings.soPhutDiMuonChoPhep
                          : ""
                      }
                      onChange={handleChange}
                    />
                    <small>Số phút ân hạn trước khi tính là đi muộn.</small>
                  </div>
                  <div className="form-group">
                    <label>Số ngày phép tiêu chuẩn / năm</label>
                    <input
                      type="number"
                      name="ngayPhepTieuChuan"
                      value={
                        settings.ngayPhepTieuChuan !== undefined
                          ? settings.ngayPhepTieuChuan
                          : ""
                      }
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LƯƠNG THUẾ */}
            {activeTab === "payroll" && (
              <div className="settings-panel">
                <h2>Cấu hình Thuế & Bảo hiểm</h2>
                <div className="form-group">
                  <label>Mức lương cơ sở (VNĐ)</label>
                  <input
                    type="number"
                    name="mucLuongCoSo"
                    value={
                      settings.mucLuongCoSo !== undefined
                        ? settings.mucLuongCoSo
                        : ""
                    }
                    onChange={handleChange}
                  />
                  <small>Áp dụng để tính mức trần đóng BHXH.</small>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>% BHXH Công ty đóng</label>
                    <input
                      type="number"
                      step="0.1"
                      name="phanTramBHXHCompany"
                      value={
                        settings.phanTramBHXHCompany !== undefined
                          ? settings.phanTramBHXHCompany
                          : ""
                      }
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>% BHXH Người lao động đóng</label>
                    <input
                      type="number"
                      step="0.1"
                      name="phanTramBHXHEmployee"
                      value={
                        settings.phanTramBHXHEmployee !== undefined
                          ? settings.phanTramBHXHEmployee
                          : ""
                      }
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Giảm trừ gia cảnh bản thân (VNĐ)</label>
                    <input
                      type="number"
                      name="giamTruGiaCanh"
                      value={
                        settings.giamTruGiaCanh !== undefined
                          ? settings.giamTruGiaCanh
                          : ""
                      }
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giảm trừ người phụ thuộc (VNĐ/người)</label>
                    <input
                      type="number"
                      name="giamTruPhuThuoc"
                      value={
                        settings.giamTruPhuThuoc !== undefined
                          ? settings.giamTruPhuThuoc
                          : ""
                      }
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EMAIL */}
            {activeTab === "email" && (
              <div className="settings-panel">
                <h2>Cấu hình máy chủ gửi Email</h2>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>SMTP Server</label>
                    <input
                      type="text"
                      name="smtpServer"
                      value={settings.smtpServer || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input
                      type="text"
                      name="smtpPort"
                      value={settings.smtpPort || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email gửi đi (Sender)</label>
                  <input
                    type="email"
                    name="emailGuiDi"
                    value={settings.emailGuiDi || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="guiMailTuDong"
                    name="guiMailTuDong"
                    checked={settings.guiMailTuDong}
                    onChange={handleChange}
                  />
                  <label htmlFor="guiMailTuDong">
                    Cho phép hệ thống tự động gửi email (Mật khẩu mới, Chúc mừng
                    sinh nhật, Báo cáo lương)
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default SystemSettingsPage;
