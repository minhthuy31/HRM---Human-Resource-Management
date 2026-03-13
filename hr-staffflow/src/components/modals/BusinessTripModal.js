import React, { useState } from "react";
import "../../styles/Modal.css";

const BusinessTripModal = ({ onSave, onCancel }) => {
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    ngayBatDau: today,
    ngayKetThuc: today,
    noiCongTac: "",
    mucDich: "",
    phuongTien: "Xe công ty",
    kinhPhiDuKien: "",
    hinhThucChiTra: "TuUngTruoc",
    soTienTamUng: "",
    lyDoTamUng: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    // Chỉ giữ lại số
    const numberValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [name]: numberValue });
  };

  const handleSubmit = () => {
    if (!formData.noiCongTac || !formData.mucDich || !formData.kinhPhiDuKien) {
      alert("Vui lòng điền đầy đủ nơi công tác, mục đích và kinh phí dự kiến.");
      return;
    }

    if (new Date(formData.ngayKetThuc) < new Date(formData.ngayBatDau)) {
      alert("Ngày kết thúc không thể trước ngày bắt đầu.");
      return;
    }

    if (formData.hinhThucChiTra === "XinTamUng" && !formData.soTienTamUng) {
      alert("Vui lòng nhập số tiền muốn tạm ứng.");
      return;
    }

    // Chuyển đổi dữ liệu số trước khi lưu
    const payload = {
      ...formData,
      kinhPhiDuKien: parseFloat(formData.kinhPhiDuKien),
      soTienTamUng:
        formData.hinhThucChiTra === "XinTamUng"
          ? parseFloat(formData.soTienTamUng)
          : 0,
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h2>Đăng ký đi công tác</h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        <div
          className="modal-body"
          style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}
        >
          {/* --- PHẦN 1: THÔNG TIN CHUYẾN ĐI --- */}
          <h3
            style={{
              fontSize: "16px",
              color: "#2563eb",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
              marginBottom: "15px",
            }}
          >
            I. Thông tin chuyến đi
          </h3>

          <div className="form-group-row">
            <div className="form-group">
              <label>Từ ngày</label>
              <input
                type="date"
                name="ngayBatDau"
                value={formData.ngayBatDau}
                onChange={handleChange}
                min={today}
              />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
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
            <label>
              Nơi công tác <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              name="noiCongTac"
              value={formData.noiCongTac}
              onChange={handleChange}
              placeholder="VD: Chi nhánh TP.HCM"
            />
          </div>

          <div className="form-group">
            <label>
              Mục đích chuyến đi <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              name="mucDich"
              rows="2"
              value={formData.mucDich}
              onChange={handleChange}
              placeholder="VD: Họp triển khai dự án mới"
            />
          </div>

          <div className="form-group">
            <label>Phương tiện di chuyển</label>
            <select
              name="phuongTien"
              value={formData.phuongTien}
              onChange={handleChange}
            >
              <option value="Xe công ty">Xe công ty</option>
              <option value="Máy bay">Máy bay</option>
              <option value="Tự túc (Xe cá nhân)">Tự túc (Xe cá nhân)</option>
              <option value="Xe khách/Tàu hỏa">Xe khách/Tàu hỏa</option>
            </select>
          </div>

          {/* --- PHẦN 2: THÔNG TIN KINH PHÍ --- */}
          <h3
            style={{
              fontSize: "16px",
              color: "#2563eb",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
              marginBottom: "15px",
              marginTop: "20px",
            }}
          >
            II. Dự trù kinh phí
          </h3>

          <div className="form-group">
            <label>
              Kinh phí dự kiến (VNĐ) <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              name="kinhPhiDuKien"
              value={formatCurrency(formData.kinhPhiDuKien)}
              onChange={handleCurrencyChange}
              placeholder="VD: 5.000.000"
              style={{ fontWeight: "bold" }}
            />
          </div>

          <div className="form-group">
            <label>Hình thức chi trả</label>
            <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "normal",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="hinhThucChiTra"
                  value="TuUngTruoc"
                  checked={formData.hinhThucChiTra === "TuUngTruoc"}
                  onChange={handleChange}
                  style={{ width: "auto", marginRight: "8px" }}
                />
                Nhân viên tự ứng trước
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "normal",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="hinhThucChiTra"
                  value="XinTamUng"
                  checked={formData.hinhThucChiTra === "XinTamUng"}
                  onChange={handleChange}
                  style={{ width: "auto", marginRight: "8px" }}
                />
                Xin tạm ứng công ty
              </label>
            </div>
          </div>

          {formData.hinhThucChiTra === "XinTamUng" && (
            <div
              className="form-group"
              style={{
                backgroundColor: "#f0f9ff",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #bae6fd",
              }}
            >
              <label style={{ color: "#0369a1" }}>
                Số tiền muốn tạm ứng (VNĐ){" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="soTienTamUng"
                value={formatCurrency(formData.soTienTamUng)}
                onChange={handleCurrencyChange}
                placeholder="Nhập số tiền..."
              />
              <label style={{ color: "#0369a1", marginTop: "10px" }}>
                Lý do xin cấp thêm/tạm ứng
              </label>
              <input
                type="text"
                name="lyDoTamUng"
                value={formData.lyDoTamUng}
                onChange={handleChange}
                placeholder="VD: Chi phí vé máy bay và khách sạn..."
              />
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "#fff7ed",
              borderRadius: "6px",
              border: "1px solid #fed7aa",
              fontSize: "13px",
              color: "#c2410c",
            }}
          >
            <strong>Lưu ý:</strong> Nếu kinh phí thực tế vượt quá mức dự kiến
            hoặc cần thanh toán, vui lòng làm{" "}
            <strong>Đơn thanh toán công tác phí</strong> và đính kèm biên
            lai/hóa đơn sau khi kết thúc chuyến đi.
          </div>
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

export default BusinessTripModal;
