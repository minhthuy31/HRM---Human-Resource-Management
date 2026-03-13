import React, { useState, useEffect } from "react";

const AttendanceModal = ({ cellData, onSave, onCancel, remainingLeave }) => {
  const [selectedType, setSelectedType] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  // Logic để xác định `selectedType` khi mở modal với dữ liệu có sẵn
  useEffect(() => {
    // Nếu NgayCong là 1.0 VÀ có GhiChu -> đây là "Nghỉ có phép"
    const isPaidLeave = cellData.ngayCong === 1.0 && !!cellData.ghiChu;

    if (isPaidLeave) {
      setSelectedType("paid-leave");
    } else if (cellData.ngayCong !== undefined && cellData.ngayCong !== null) {
      // Các trường hợp khác thì dùng chính giá trị của NgayCong
      setSelectedType(cellData.ngayCong.toString());
    } else {
      // Nếu là ô mới, không chọn gì cả
      setSelectedType("");
    }
    setGhiChu(cellData.ghiChu || "");
  }, [cellData]);

  const handleSelectChange = (e) => {
    setSelectedType(e.target.value);
  };

  // Logic mới để gửi đúng dữ liệu lên API
  const handleSave = () => {
    if (selectedType === "") {
      alert("Vui lòng chọn một trạng thái.");
      return;
    }

    let ngayCongValue;
    let ghiChuValue = "";

    if (selectedType === "paid-leave") {
      ngayCongValue = 1.0;
      ghiChuValue = ghiChu;
      if (!ghiChuValue) {
        alert("Vui lòng nhập lý do nghỉ có phép.");
        return;
      }
    } else {
      // Các trường hợp còn lại
      ngayCongValue = parseFloat(selectedType);
      ghiChuValue = ""; // Chỉ nghỉ phép mới có ghi chú
    }

    onSave({
      ...cellData,
      ngayCong: ngayCongValue,
      ghiChu: ghiChuValue,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content attendance-modal">
        <div className="modal-header">
          <h2>Chỉnh sửa chấm công</h2>
          <button onClick={onCancel} className="modal-close-btn">
            &times;
          </button>
        </div>
        <div className="attendance-form">
          <div className="form-group">
            <label>Ngày công</label>
            <select value={selectedType} onChange={handleSelectChange}>
              <option value="" disabled>
                -- Chọn trạng thái --
              </option>

              {/* Sửa lại các giá trị trong <option> */}
              <option value="1.0">1.0 - Đi làm đủ</option>
              <option value="paid-leave">1.0 - Nghỉ có phép</option>
              <option value="0.5">0.5 - Làm nửa ngày</option>
              <option value="0.0">0.0 - Nghỉ không phép</option>
            </select>
          </div>

          {/* Logic mới: chỉ hiện khi chọn "Nghỉ có phép" */}
          {selectedType === "paid-leave" && (
            <>
              <div className="leave-balance-info">
                Số ngày phép còn lại trong năm:
                <strong>
                  {remainingLeave !== undefined ? ` ${remainingLeave}` : "..."}
                </strong>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label>Lý do nghỉ phép (bắt buộc)</label>
                <textarea
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  rows="3"
                  placeholder="Nhập lý do..."
                />
              </div>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="cancel-btn">
            Hủy
          </button>
          <button onClick={handleSave} className="save-btn">
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
