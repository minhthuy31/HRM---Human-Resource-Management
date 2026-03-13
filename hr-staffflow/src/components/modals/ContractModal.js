import React, { useState, useEffect } from "react";
import { FaFileContract } from "react-icons/fa"; // <--- ĐÃ BỔ SUNG IMPORT NÀY
import "../../styles/Modal.css";

const ContractModal = ({ contract, employees, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    soHopDong: "",
    maNhanVien: "",
    loaiHopDong: "Chính thức 1 năm",
    ngayBatDau: new Date().toISOString().split("T")[0],
    ngayKetThuc: "",
    luongCoBan: "",
    ghiChu: "",
    trangThai: "HieuLuc",
  });
  const [file, setFile] = useState(null);

  // Load dữ liệu khi sửa
  useEffect(() => {
    if (contract) {
      setFormData({
        soHopDong: contract.soHopDong,
        maNhanVien: contract.maNhanVien,
        loaiHopDong: contract.loaiHopDong,
        ngayBatDau: contract.ngayBatDau
          ? contract.ngayBatDau.split("T")[0]
          : "",
        ngayKetThuc: contract.ngayKetThuc
          ? contract.ngayKetThuc.split("T")[0]
          : "",
        luongCoBan: contract.luongCoBan,
        ghiChu: contract.ghiChu || "",
        trangThai: contract.trangThai || "HieuLuc",
      });
    }
  }, [contract]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleCurrencyChange = (e) => {
    const val = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
    setFormData((prev) => ({ ...prev, luongCoBan: val }));
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return "";
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const handleSubmit = () => {
    if (!formData.soHopDong || !formData.maNhanVien || !formData.luongCoBan) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }

    const payload = new FormData();
    payload.append("soHopDong", formData.soHopDong);
    payload.append("maNhanVien", formData.maNhanVien);
    payload.append("loaiHopDong", formData.loaiHopDong);
    payload.append("ngayBatDau", formData.ngayBatDau);
    if (formData.ngayKetThuc)
      payload.append("ngayKetThuc", formData.ngayKetThuc);
    payload.append("luongCoBan", formData.luongCoBan);
    payload.append("trangThai", formData.trangThai);
    payload.append("ghiChu", formData.ghiChu || "");

    if (file) payload.append("fileDinhKem", file);

    onSave(payload, !!contract);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "650px" }}>
        <div className="modal-header">
          <h2>{contract ? "Cập nhật Hợp đồng" : "Tạo Hợp đồng mới"}</h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        <div
          className="modal-body"
          style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}
        >
          {/* Hàng 1: Số HĐ & Nhân viên */}
          <div className="form-group-row">
            <div className="form-group">
              <label>
                Số hợp đồng <span style={{ color: "red" }}>*</span>
              </label>
              <input
                name="soHopDong"
                value={formData.soHopDong}
                onChange={handleChange}
                disabled={!!contract} // Không cho sửa số HĐ khi update
                placeholder="VD: HĐ-2025/001"
              />
            </div>
            <div className="form-group">
              <label>
                Nhân viên <span style={{ color: "red" }}>*</span>
              </label>
              <select
                name="maNhanVien"
                value={formData.maNhanVien}
                onChange={handleChange}
                disabled={!!contract}
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((e) => (
                  <option key={e.maNhanVien} value={e.maNhanVien}>
                    {e.hoTen} ({e.maNhanVien})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 2: Loại & Trạng thái */}
          <div className="form-group-row">
            <div className="form-group">
              <label>Loại hợp đồng</label>
              <select
                name="loaiHopDong"
                value={formData.loaiHopDong}
                onChange={handleChange}
              >
                <option value="Thử việc">Thử việc (2 tháng)</option>
                <option value="Chính thức 1 năm">Chính thức 1 năm</option>
                <option value="Chính thức 3 năm">Chính thức 3 năm</option>
                <option value="Vô thời hạn">Vô thời hạn</option>
                <option value="CTV">Cộng tác viên</option>
              </select>
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
                style={{
                  borderColor:
                    formData.trangThai === "DaChamDut" ? "red" : "#ddd",
                  color: formData.trangThai === "DaChamDut" ? "red" : "#333",
                }}
              >
                <option value="HieuLuc">Đang hiệu lực</option>
                <option value="HetHan">Hết hạn</option>
                <option value="DaChamDut">Đã chấm dứt (Nghỉ việc)</option>
              </select>
            </div>
          </div>

          {/* Hàng 3: Thời gian */}
          <div className="form-group-row">
            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                name="ngayBatDau"
                value={formData.ngayBatDau}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Ngày kết thúc (Để trống nếu Vô thời hạn)</label>
              <input
                type="date"
                name="ngayKetThuc"
                value={formData.ngayKetThuc}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Hàng 4: Lương & File */}
          <div className="form-group">
            <label>
              Lương ký hợp đồng (VNĐ) <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={formatCurrency(formData.luongCoBan)}
              onChange={handleCurrencyChange}
              style={{ fontWeight: "bold", color: "#16a34a", fontSize: "16px" }}
            />
          </div>

          <div className="form-group">
            <label>Tệp đính kèm (PDF/Ảnh)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {contract && contract.tepDinhKem && !file && (
              <div style={{ fontSize: "13px", marginTop: "5px" }}>
                <a
                  href={`http://localhost:5260${contract.tepDinhKem}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#0e7c7b",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FaFileContract /> Xem file hiện tại
                </a>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              name="ghiChu"
              value={formData.ghiChu}
              onChange={handleChange}
              rows="2"
              placeholder="Ghi chú thêm..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Lưu Hợp Đồng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;
