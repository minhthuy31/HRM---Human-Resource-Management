import React, { useState, useEffect } from "react";

const AttendanceModal = ({ cellData, onSave, onCancel, remainingLeave }) => {
  const [ngayCong, setNgayCong] = useState("");
  const [isPaidLeave, setIsPaidLeave] = useState(false);
  const [ghiChu, setGhiChu] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const paidLeave = cellData.ngayCong === 1.0 && !!cellData.ghiChu;
    setIsPaidLeave(paidLeave);
    setNgayCong(
      cellData.ngayCong !== undefined && cellData.ngayCong !== null
        ? cellData.ngayCong.toString()
        : ""
    );
    setGhiChu(cellData.ghiChu || "");
    setError("");
  }, [cellData]);

  const handleQuick = (val) => {
    setNgayCong(val.toString());
    setError("");
  };

  const handleSave = () => {
    const val = parseFloat(ngayCong);
    if (ngayCong === "" || isNaN(val)) {
      setError("Vui lòng nhập số ngày công.");
      return;
    }
    if (val < 0 || val > 1) {
      setError("Ngày công phải từ 0 đến 1.");
      return;
    }
    if (isPaidLeave && !ghiChu.trim()) {
      setError("Vui lòng nhập lý do nghỉ có phép.");
      return;
    }
    onSave({
      ...cellData,
      ngayCong: val,
      ghiChu: isPaidLeave ? ghiChu.trim() : "",
    });
  };

  const quickBtns = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="modal-overlay">
      <div className="modal-content attendance-modal">
        <div className="modal-header">
          <h2>Chỉnh sửa chấm công</h2>
          <button onClick={onCancel} className="modal-close-btn">&times;</button>
        </div>

        <div className="attendance-form">
          <div className="form-group">
            <label>Số ngày công</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.25}
              value={ngayCong}
              onChange={(e) => { setNgayCong(e.target.value); setError(""); }}
              placeholder="VD: 0.75"
              style={{
                width: "100%", padding: "8px 12px", fontSize: "16px",
                border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
              }}
              autoFocus
            />
            {/* Nút chọn nhanh */}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              {quickBtns.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuick(v)}
                  style={{
                    padding: "5px 12px", borderRadius: "5px", border: "1px solid #d1d5db",
                    cursor: "pointer", fontSize: "13px", fontWeight: "600",
                    background: parseFloat(ngayCong) === v ? "#2563eb" : "#f3f4f6",
                    color: parseFloat(ngayCong) === v ? "#fff" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isPaidLeave}
                onChange={(e) => { setIsPaidLeave(e.target.checked); setError(""); }}
                style={{ width: "16px", height: "16px" }}
              />
              Nghỉ có phép (ghi lý do)
            </label>
          </div>

          {isPaidLeave && (
            <>
              <div className="leave-balance-info">
                Số ngày phép còn lại:
                <strong>{remainingLeave !== undefined ? ` ${remainingLeave}` : " ..."}</strong>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label>Lý do nghỉ phép <span style={{ color: "red" }}>*</span></label>
                <textarea
                  value={ghiChu}
                  onChange={(e) => { setGhiChu(e.target.value); setError(""); }}
                  rows="3"
                  placeholder="Nhập lý do..."
                />
              </div>
            </>
          )}

          {error && (
            <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "6px" }}>{error}</p>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="cancel-btn">Hủy</button>
          <button onClick={handleSave} className="save-btn">Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
