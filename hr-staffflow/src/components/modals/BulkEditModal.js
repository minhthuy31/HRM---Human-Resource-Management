import React, { useState } from "react";

const BulkEditModal = ({ onSave, onCancel }) => {
  const [selectedValue, setSelectedValue] = useState("");

  const handleSave = () => {
    if (selectedValue === "") {
      alert("Vui lòng chọn một trạng thái để áp dụng.");
      return;
    }

    let dataToSave = {};
    switch (selectedValue) {
      case "1.0_work":
        dataToSave = { ngayCong: 1.0, ghiChu: null }; // Đi làm đủ
        break;
      case "1.0_leave":
        dataToSave = { ngayCong: 1.0, ghiChu: "Nghỉ có phép" }; // Nghỉ có phép
        break;
      case "0.5":
        dataToSave = { ngayCong: 0.5, ghiChu: "Làm nửa ngày" }; // Làm nửa ngày
        break;
      case "0.0":
        dataToSave = { ngayCong: 0.0, ghiChu: "Nghỉ không phép" }; // Nghỉ không phép
        break;
      default:
        return;
    }

    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content attendance-modal"
        style={{ maxWidth: "400px" }}
      >
        <div className="modal-header">
          <h2>Áp dụng hàng loạt</h2>
          <button onClick={onCancel} className="modal-close-btn">
            &times;
          </button>
        </div>
        <div className="attendance-form">
          <div className="form-group">
            <label>Chọn giá trị để điền</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              <option value="" disabled>
                -- Chọn trạng thái --
              </option>
              <option value="1.0_work">1.0 - Đi làm đủ</option>
              <option value="1.0_leave">1.0 - Nghỉ có phép</option>
              <option value="0.5">0.5 - Làm nửa ngày</option>
              <option value="0.0">0.0 - Nghỉ không phép</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="cancel-btn">
            Hủy
          </button>
          <button onClick={handleSave} className="save-btn">
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;
