import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaBuilding,
  FaClock,
  FaMoneyBillWave,
  FaEnvelope,
  FaSave,
  FaLock,
  FaCalendarAlt,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import "../styles/SystemSettingsPage.css";

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

  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";
  const canEdit = ["Nhân sự trưởng", "Giám đốc"].includes(userRole);

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
    heSoOTNgayThuong: 1.5,
    heSoOTCuoiTuan: 2.0,
    heSoOTNgayLe: 3.0, // <-- THÊM MẶC ĐỊNH
    smtpServer: "",
    smtpPort: "",
    emailGuiDi: "",
    guiMailTuDong: false,
  });

  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", tenNgayLe: "" });
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());

  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      3000,
    );
  }, []);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const closeConfirm = () =>
    setConfirmDialog({ isOpen: false, message: "", onConfirm: null });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get("/SystemSettings");
      if (response.data) {
        const normalizedData = {};
        for (const key in response.data) {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          normalizedData[camelKey] =
            response.data[key] !== null ? response.data[key] : "";
        }
        setSettings((prev) => ({ ...prev, ...normalizedData }));
      }
    } catch (error) {
      showToast("Không thể tải cấu hình từ máy chủ.", "error");
    }
  }, [showToast]);

  const fetchHolidays = useCallback(async () => {
    try {
      const response = await api.get(`/NgayLe?year=${holidayYear}`);
      setHolidays(response.data);
    } catch (error) {
      showToast("Không thể tải danh sách ngày lễ.", "error");
    }
  }, [holidayYear, showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (activeTab === "holidays") fetchHolidays();
  }, [activeTab, holidayYear, fetchHolidays]);

  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = () => {
    if (!canEdit) {
      showToast("Bạn không có quyền chỉnh sửa cấu hình.", "error");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      message: "Bạn có chắc chắn muốn lưu các thay đổi cấu hình hệ thống này?",
      onConfirm: async () => {
        closeConfirm();
        setLoading(true);
        try {
          const payload = {
            ...settings,
            soPhutDiMuonChoPhep: Number(settings.soPhutDiMuonChoPhep) || 0,
            ngayPhepTieuChuan: Number(settings.ngayPhepTieuChuan) || 0,
            mucLuongCoSo: Number(settings.mucLuongCoSo) || 0,
            phanTramBHXHCompany: Number(settings.phanTramBHXHCompany) || 0,
            phanTramBHXHEmployee: Number(settings.phanTramBHXHEmployee) || 0,
            giamTruGiaCanh: Number(settings.giamTruGiaCanh) || 0,
            giamTruPhuThuoc: Number(settings.giamTruPhuThuoc) || 0,
            heSoOTNgayThuong: Number(settings.heSoOTNgayThuong) || 1.5, // <-- MAP PAYLOAD
            heSoOTCuoiTuan: Number(settings.heSoOTCuoiTuan) || 2.0,
            heSoOTNgayLe: Number(settings.heSoOTNgayLe) || 3.0,
          };
          await api.post("/SystemSettings", payload);
          showToast("Đã lưu cấu hình hệ thống thành công!", "success");
        } catch (error) {
          showToast("Có lỗi xảy ra khi lưu cấu hình.", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!canEdit || !newHoliday.date || !newHoliday.tenNgayLe) return;
    try {
      await api.post("/NgayLe", newHoliday);
      setNewHoliday({ date: "", tenNgayLe: "" });
      fetchHolidays();
      showToast("Đã thêm ngày lễ thành công!", "success");
    } catch (err) {
      showToast(err.response?.data || "Lỗi khi thêm ngày lễ.", "error");
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!canEdit) return;
    setConfirmDialog({
      isOpen: true,
      message:
        "Xóa ngày lễ này sẽ ảnh hưởng đến việc tính lương nếu đã chấm công. Vẫn xóa?",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/NgayLe/${id}`);
          fetchHolidays();
          showToast("Đã xóa ngày lễ.", "success");
        } catch (err) {
          showToast("Lỗi khi xóa ngày lễ.", "error");
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
          {canEdit && activeTab !== "holidays" && (
            <button
              className="btn-save-settings"
              onClick={handleSaveSettings}
              disabled={loading}
            >
              <FaSave /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          )}
        </div>

        {!canEdit && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "12px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "500",
              border: "1px solid #ffeeba",
            }}
          >
            <FaLock /> Bạn đang ở chế độ xem.
          </div>
        )}

        <div className="settings-layout">
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
                <FaClock className="tab-icon" /> Chấm công & Tăng ca
              </li>
              <li
                className={activeTab === "holidays" ? "active" : ""}
                onClick={() => setActiveTab("holidays")}
              >
                <FaCalendarAlt className="tab-icon" /> Thiết lập Ngày Lễ
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

          <div className="settings-content">
            {activeTab === "company" /* Giữ nguyên ... */ && (
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên viết tắt</label>
                    <input
                      type="text"
                      name="tenVietTat"
                      value={settings.tenVietTat || ""}
                      onChange={handleChange}
                      disabled={!canEdit}
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hotline nhân sự</label>
                    <input
                      type="text"
                      name="sdtHotline"
                      value={settings.sdtHotline || ""}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Địa chỉ Trụ sở chính</label>
                  <input
                    type="text"
                    name="diaChi"
                    value={settings.diaChi || ""}
                    onChange={handleChange}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            )}

            {activeTab === "timekeeping" && (
              <div className="settings-panel">
                <h2>Chấm công cơ bản</h2>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Giờ vào làm</label>
                    <input
                      type="time"
                      name="gioVaoLam"
                      value={settings.gioVaoLam || ""}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ tan làm</label>
                    <input
                      type="time"
                      name="gioTanLam"
                      value={settings.gioTanLam || ""}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ nghỉ trưa</label>
                    <input
                      type="text"
                      name="thoiGianNghiTrua"
                      value={settings.thoiGianNghiTrua || ""}
                      onChange={handleChange}
                      disabled={!canEdit}
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số ngày phép / năm</label>
                    <input
                      type="number"
                      name="ngayPhepTieuChuan"
                      value={
                        settings.ngayPhepTieuChuan !== undefined
                          ? settings.ngayPhepTieuChuan
                          : ""
                      }
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {/* --- KHU VỰC HỆ SỐ TĂNG CA (MỚI) --- */}
                <h3
                  style={{
                    marginTop: "30px",
                    fontSize: "1.2rem",
                    color: "#0369a1",
                    borderBottom: "1px solid #e0f2fe",
                    paddingBottom: "10px",
                  }}
                >
                  Cấu hình Hệ số Tăng ca (OT)
                </h3>
                <div className="form-row-3" style={{ marginTop: "15px" }}>
                  <div className="form-group">
                    <label>Hệ số OT Ngày thường (x)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="heSoOTNgayThuong"
                      value={
                        settings.heSoOTNgayThuong !== undefined
                          ? settings.heSoOTNgayThuong
                          : ""
                      }
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hệ số OT Cuối tuần (x)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="heSoOTCuoiTuan"
                      value={
                        settings.heSoOTCuoiTuan !== undefined
                          ? settings.heSoOTCuoiTuan
                          : ""
                      }
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hệ số OT Ngày Lễ (x)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="heSoOTNgayLe"
                      value={
                        settings.heSoOTNgayLe !== undefined
                          ? settings.heSoOTNgayLe
                          : ""
                      }
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "holidays" /* Giữ nguyên ... */ && (
              <div className="settings-panel">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h2>Thiết lập Ngày Lễ (Nghỉ hưởng lương)</h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <label style={{ fontWeight: 600 }}>Năm:</label>
                    <input
                      type="number"
                      value={holidayYear}
                      onChange={(e) => setHolidayYear(e.target.value)}
                      style={{
                        padding: "6px",
                        width: "80px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                </div>
                {canEdit && (
                  <form
                    onSubmit={handleAddHoliday}
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "flex-end",
                      backgroundColor: "#f8fafc",
                      padding: "15px",
                      borderRadius: "8px",
                      border: "1px solid var(--sidebar-border)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "5px",
                        }}
                      >
                        Chọn Ngày
                      </label>
                      <input
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) =>
                          setNewHoliday({ ...newHoliday, date: e.target.value })
                        }
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "5px",
                        }}
                      >
                        Tên dịp lễ
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Quốc khánh..."
                        value={newHoliday.tenNgayLe}
                        onChange={(e) =>
                          setNewHoliday({
                            ...newHoliday,
                            tenNgayLe: e.target.value,
                          })
                        }
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FaPlus /> Thêm
                    </button>
                  </form>
                )}
                <table className="holiday-table">
                  <thead>
                    <tr>
                      <th style={{ width: "20%" }}>Ngày / Tháng</th>
                      <th style={{ width: "65%" }}>Tên dịp lễ</th>
                      {canEdit && (
                        <th style={{ width: "15%", textAlign: "center" }}>
                          Xóa
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.length > 0 ? (
                      holidays.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: "600", color: "#2563eb" }}>
                            {new Date(h.date).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                          <td>{h.tenNgayLe}</td>
                          {canEdit && (
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-delete-holiday"
                                onClick={() => handleDeleteHoliday(h.id)}
                                title="Xóa"
                              >
                                <FaTrash size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={canEdit ? 3 : 2}
                          style={{
                            textAlign: "center",
                            padding: "30px",
                            color: "#6b7280",
                          }}
                        >
                          Chưa có dữ liệu ngày lễ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "payroll" /* Giữ nguyên ... */ && (
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
                    disabled={!canEdit}
                  />
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>% BHXH NLĐ đóng</label>
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
                      disabled={!canEdit}
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giảm trừ người phụ thuộc (VNĐ)</label>
                    <input
                      type="number"
                      name="giamTruPhuThuoc"
                      value={
                        settings.giamTruPhuThuoc !== undefined
                          ? settings.giamTruPhuThuoc
                          : ""
                      }
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" /* Giữ nguyên ... */ && (
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input
                      type="text"
                      name="smtpPort"
                      value={settings.smtpPort || ""}
                      onChange={handleChange}
                      disabled={!canEdit}
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
                    disabled={!canEdit}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="guiMailTuDong"
                    name="guiMailTuDong"
                    checked={settings.guiMailTuDong}
                    onChange={handleChange}
                    disabled={!canEdit}
                  />
                  <label htmlFor="guiMailTuDong">
                    Cho phép tự động gửi email
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
      <div
        className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
      >
        {toast.message}
      </div>
    </DashboardLayout>
  );
};

export default SystemSettingsPage;
