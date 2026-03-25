import React, { useState, useEffect } from "react";
import "../../styles/Modal.css";

const AnnouncementModal = ({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    tieuDe: "",
    loaiThongBao: "Thông báo chung",
    noiDung: "",
    trangThai: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        tieuDe: data.tieuDe || "",
        loaiThongBao: data.loaiThongBao || "Thông báo chung",
        noiDung: data.noiDung || "",
        trangThai: data.trangThai ?? true,
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.tieuDe || !formData.noiDung) {
      alert("Vui lòng nhập đầy đủ Tiêu đề và Nội dung.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h2>{data ? "Chỉnh sửa Thông báo" : "Tạo Thông báo mới"}</h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        <div className="form-group">
          <label>
            Tiêu đề thông báo <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="tieuDe"
            value={formData.tieuDe}
            onChange={handleChange}
            placeholder="VD: Thông báo lịch nghỉ lễ 30/4..."
          />
        </div>

        <div className="form-group">
          <label>Phân loại</label>
          <select
            name="loaiThongBao"
            value={formData.loaiThongBao}
            onChange={handleChange}
          >
            <option value="Thông báo chung">Thông báo chung</option>
            <option value="Quan trọng">Quan trọng</option>
            <option value="Sự kiện nội bộ">Sự kiện nội bộ</option>
            <option value="Hành chính - Nhân sự">Hành chính - Nhân sự</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Nội dung chi tiết <span style={{ color: "red" }}>*</span>
          </label>
          <textarea
            name="noiDung"
            rows="6"
            value={formData.noiDung}
            onChange={handleChange}
            placeholder="Nhập nội dung chi tiết của thông báo..."
          ></textarea>
        </div>

        {data && (
          <div
            className="form-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <input
              type="checkbox"
              id="trangThai"
              name="trangThai"
              checked={formData.trangThai}
              onChange={handleChange}
              style={{ width: "18px", height: "18px" }}
            />
            <label
              htmlFor="trangThai"
              style={{ margin: 0, cursor: "pointer", fontWeight: "normal" }}
            >
              Hiển thị thông báo này trên bảng tin
            </label>
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            {data ? "Cập nhật" : "Đăng tải"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
