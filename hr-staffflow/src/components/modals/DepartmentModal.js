import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/DepartmentPage.css";

const DepartmentModal = ({
  department,
  onSave,
  onCancel,
  isViewOnly = false,
}) => {
  const [formData, setFormData] = useState(department || {});

  useEffect(() => {
    setFormData(department || {});
  }, [department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getTitle = () => {
    if (isViewOnly) return `Chi tiết phòng ban: ${department.tenPhongBan}`;
    return department
      ? `Sửa phòng ban: ${department.tenPhongBan}`
      : "Thêm phòng ban mới";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button onClick={onCancel} className="modal-close-btn">
            <FaTimes />
          </button>
        </div>
        <form className="department-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên phòng ban</label>
            <input
              type="text"
              name="tenPhongBan"
              value={formData.tenPhongBan || ""}
              onChange={handleChange}
              required
              disabled={isViewOnly}
            />
          </div>
          <div className="form-group">
            <label>Địa chỉ</label>
            <input
              type="text"
              name="diaChi"
              value={formData.diaChi || ""}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="text"
              name="sdt_PhongBan"
              value={formData.sdt_PhongBan || ""}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
          {!isViewOnly && (
            <button type="submit" className="btn-submit">
              {department ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
