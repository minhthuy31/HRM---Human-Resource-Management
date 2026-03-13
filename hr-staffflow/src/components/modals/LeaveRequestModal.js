import React, { useState, useEffect } from "react";
import { api } from "../../api"; // Đảm bảo import đúng đường dẫn api của bạn
import "../../styles/Modal.css";

const LeaveRequestModal = ({ onSave, onCancel }) => {
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    ngayBatDau: today,
    ngayKetThuc: today,
    soNgayNghi: 1,
    lyDo: "",
    customReason: "",
    file: null,
  });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  // --- THÊM STATE NÀY ĐỂ LƯU SỐ PHÉP LẤY TỪ API ---
  const [fetchedRemainingDays, setFetchedRemainingDays] = useState(null);

  const predefinedReasons = [
    "Nghỉ ốm",
    "Nghỉ phép năm",
    "Nghỉ việc gia đình",
    "Nghỉ chế độ (thai sản/cưới hỏi)",
    "Khác (ghi rõ lý do)",
  ];

  // --- GỌI API LẤY SỐ PHÉP KHI MODAL MỞ RA ---
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get("/DonNghiPhep/balance");
        setFetchedRemainingDays(response.data.remainingDays);
      } catch (err) {
        console.error("Lỗi lấy số dư phép:", err);
        setFetchedRemainingDays(0); // Fallback nếu lỗi
      }
    };
    fetchBalance();
  }, []);

  // Hàm tính số ngày làm việc (trừ T7, CN)
  const calculateBusinessDays = (startDate, endDate) => {
    let count = 0;
    let curDate = new Date(startDate);
    const end = new Date(endDate);

    while (curDate <= end) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  useEffect(() => {
    const { ngayBatDau, ngayKetThuc } = formData;
    if (ngayBatDau && ngayKetThuc) {
      const start = new Date(ngayBatDau);
      const end = new Date(ngayKetThuc);

      if (end < start) {
        setError("Ngày kết thúc không thể trước ngày bắt đầu.");
        setFormData((prev) => ({ ...prev, soNgayNghi: 0 }));
      } else {
        const days = calculateBusinessDays(start, end);
        setFormData((prev) => ({ ...prev, soNgayNghi: days }));
        setError("");
      }
    }
  }, [formData.ngayBatDau, formData.ngayKetThuc]);

  // Check cảnh báo dựa trên số phép vừa lấy được
  useEffect(() => {
    // Sử dụng fetchedRemainingDays thay vì prop cũ
    if (formData.lyDo === "Nghỉ phép năm" && fetchedRemainingDays !== null) {
      if (formData.soNgayNghi > fetchedRemainingDays) {
        const diff = formData.soNgayNghi - fetchedRemainingDays;
        setWarning(
          `Bạn chỉ còn ${fetchedRemainingDays} ngày phép. ${diff} ngày vượt quá sẽ tính là nghỉ không lương.`,
        );
      } else {
        setWarning("");
      }
    } else {
      setWarning("");
    }
  }, [formData.soNgayNghi, formData.lyDo, fetchedRemainingDays]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = () => {
    if (formData.soNgayNghi <= 0) {
      setError("Số ngày nghỉ không hợp lệ.");
      return;
    }

    let finalReason = formData.lyDo;
    if (formData.lyDo === "Khác (ghi rõ lý do)") {
      if (!formData.customReason.trim()) {
        setError("Vui lòng ghi rõ lý do.");
        return;
      }
      finalReason = formData.customReason;
    } else if (!formData.lyDo) {
      setError("Vui lòng chọn lý do.");
      return;
    }

    const submissionData = {
      ngayBatDau: formData.ngayBatDau,
      ngayKetThuc: formData.ngayKetThuc,
      soNgayNghi: formData.soNgayNghi,
      lyDo: finalReason,
      file: formData.file,
    };

    onSave(submissionData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Đăng ký nghỉ phép</h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {warning && (
          <div
            className="modal-warning"
            style={{
              color: "#d97706",
              backgroundColor: "#fffbeb",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "10px",
              border: "1px solid #fcd34d",
              fontSize: "13px",
            }}
          >
            <i className="fa fa-exclamation-triangle"></i> {warning}
          </div>
        )}

        <div
          className="leave-balance-info"
          style={{ color: "#0e7c7b", marginBottom: "15px", fontSize: "14px" }}
        >
          {/* HIỂN THỊ SỐ LIỆU TỪ STATE */}
          Phép năm còn lại:{" "}
          <strong>
            {fetchedRemainingDays !== null ? fetchedRemainingDays : "..."}
          </strong>{" "}
          ngày
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Từ ngày (*)</label>
            <input
              type="date"
              name="ngayBatDau"
              value={formData.ngayBatDau}
              onChange={handleChange}
              min={today}
            />
          </div>
          <div className="form-group">
            <label>Đến ngày (*)</label>
            <input
              type="date"
              name="ngayKetThuc"
              value={formData.ngayKetThuc}
              onChange={handleChange}
              min={formData.ngayBatDau}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Số ngày nghỉ (đã trừ T7/CN):</label>
          <input
            type="text"
            value={formData.soNgayNghi}
            disabled
            style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}
          />
        </div>

        <div className="form-group">
          <label>Lý do nghỉ (*)</label>
          <select name="lyDo" value={formData.lyDo} onChange={handleChange}>
            <option value="">-- Chọn lý do --</option>
            {predefinedReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {formData.lyDo === "Khác (ghi rõ lý do)" && (
          <div className="form-group">
            <textarea
              name="customReason"
              placeholder="Nhập lý do cụ thể..."
              value={formData.customReason}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="form-group">
          <label>Tệp đính kèm (nếu có)</label>
          <input type="file" name="file" onChange={handleChange} />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Gửi đơn
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
