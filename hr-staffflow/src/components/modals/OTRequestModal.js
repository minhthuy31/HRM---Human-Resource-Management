import React, { useState } from "react";
import "../../styles/Modal.css";

const OTRequestModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ngayLamThem: new Date().toISOString().split("T")[0],
    gioBatDau: "17:30",
    gioKetThuc: "19:30",
    lyDo: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // Validate cơ bản
    if (formData.gioKetThuc <= formData.gioBatDau) {
      alert("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }
    if (!formData.lyDo) {
      alert("Vui lòng nhập lý do làm thêm.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Đăng ký làm thêm giờ (OT)</h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        <div className="form-group">
          <label>Ngày làm thêm</label>
          <input
            type="date"
            name="ngayLamThem"
            value={formData.ngayLamThem}
            onChange={handleChange}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Từ giờ</label>
            <input
              type="time"
              name="gioBatDau"
              value={formData.gioBatDau}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Đến giờ</label>
            <input
              type="time"
              name="gioKetThuc"
              value={formData.gioKetThuc}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Lý do / Dự án</label>
          <textarea
            name="lyDo"
            rows="3"
            value={formData.lyDo}
            onChange={handleChange}
            placeholder=""
          />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTRequestModal;
