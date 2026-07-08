import React, { useState, useEffect } from "react";
import { FaFileContract } from "react-icons/fa";
import "../../styles/Modal.css";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api";

const ContractModal = ({
  contract,
  parentContract, // HĐ gốc: có giá trị = đang tạo phụ lục
  employees,
  onSave,
  onCancel,
}) => {
  const { showToast } = useToast();
  const isPhuLuc = !!parentContract;

  const [formData, setFormData] = useState({
    soHopDong: "",
    maNhanVien: "",
    loaiHopDong: "Chính thức", // Mặc định là Chính thức
    ngayBatDau: new Date().toISOString().split("T")[0],
    ngayKetThuc: "",
    luongCoBan: "",
    ghiChu: "",
    trangThai: "HieuLuc",
    maChucVu: "",
    noiLamViec: "",
  });
  const [file, setFile] = useState(null);
  const [chucVus, setChucVus] = useState([]);

  // Danh sách chức vụ cho dropdown
  useEffect(() => {
    api
      .get("/ChucVuNhanVien")
      .then((res) => setChucVus(res.data || []))
      .catch(() => {});
  }, []);

  // Prefill khi CHỈNH SỬA
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
        maChucVu: contract.maChucVu || "",
        noiLamViec: contract.noiLamViec || "",
      });
    }
  }, [contract]);

  // Prefill khi TẠO PHỤ LỤC (dựa trên HĐ gốc)
  useEffect(() => {
    if (parentContract) {
      setFormData((prev) => ({
        ...prev,
        soHopDong: parentContract.soHopDong, // hiển thị mã HĐ gốc
        maNhanVien: parentContract.maNhanVien,
        loaiHopDong: parentContract.loaiHopDong,
        ngayBatDau: new Date().toISOString().split("T")[0],
        ngayKetThuc: parentContract.ngayKetThuc
          ? parentContract.ngayKetThuc.split("T")[0]
          : "",
        luongCoBan: parentContract.luongCoBan,
        ghiChu: "",
        trangThai: "HieuLuc",
        maChucVu: parentContract.maChucVu || "",
        noiLamViec: parentContract.noiLamViec || "",
      }));
    }
  }, [parentContract]);

  // Tạo mới thường: lấy trước mã HĐ tự sinh để hiển thị
  useEffect(() => {
    if (!contract && !parentContract) {
      api
        .get("/HopDong/next-code")
        .then((res) =>
          setFormData((prev) => ({ ...prev, soHopDong: res.data.soHopDong })),
        )
        .catch(() => {});
    }
  }, [contract, parentContract]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleCurrencyChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, luongCoBan: val }));
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return "";
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const employeeName = () => {
    const emp = (employees || []).find(
      (e) => e.maNhanVien === formData.maNhanVien,
    );
    if (emp) return `${emp.hoTen} (${emp.maNhanVien})`;
    if (isPhuLuc)
      return `${parentContract.hoTenNhanVien || ""} (${formData.maNhanVien})`;
    return formData.maNhanVien;
  };

  const handleSubmit = () => {
    if (!formData.maNhanVien || !formData.luongCoBan) {
      showToast("Vui lòng điền đầy đủ các trường bắt buộc (*)", "error");
      return;
    }

    const payload = new FormData();
    payload.append("maNhanVien", formData.maNhanVien);
    payload.append("loaiHopDong", formData.loaiHopDong);
    payload.append("ngayBatDau", formData.ngayBatDau);
    if (formData.ngayKetThuc)
      payload.append("ngayKetThuc", formData.ngayKetThuc);
    payload.append("luongCoBan", formData.luongCoBan);
    payload.append("luongDongBaoHiem", formData.luongCoBan);
    payload.append("ghiChu", formData.ghiChu || "");
    payload.append("maChucVu", formData.maChucVu || "");
    payload.append("noiLamViec", formData.noiLamViec || "");
    if (file) payload.append("fileDinhKem", file);

    if (isPhuLuc) {
      // Phụ lục: server tự sinh mã, chỉ cần mã HĐ gốc
      payload.append("soHopDongGoc", parentContract.soHopDong);
      onSave(payload, "phuluc");
    } else {
      payload.append("soHopDong", formData.soHopDong);
      payload.append("trangThai", formData.trangThai);
      onSave(payload, contract ? "update" : "create");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "650px" }}>
        <div className="modal-header">
          <h2>
            {isPhuLuc
              ? "Tạo Phụ lục Hợp đồng"
              : contract
                ? "Cập nhật Hợp đồng"
                : "Tạo Hợp đồng mới"}
          </h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        <div
          className="modal-body"
          style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}
        >
          {isPhuLuc && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "14px",
                fontSize: "13px",
                color: "#1e40af",
              }}
            >
              📄 Phụ lục dựa trên hợp đồng gốc{" "}
              <strong>{parentContract.soHopDong}</strong>. HĐ gốc sẽ được kết
              thúc trước ngày hiệu lực; lương/chức vụ mới áp dụng từ ngày hiệu
              lực.
            </div>
          )}

          <div className="form-group-row">
            <div className="form-group">
              <label>
                {isPhuLuc ? "Mã HĐ gốc" : "Số hợp đồng (tự sinh)"}
              </label>
              <input
                name="soHopDong"
                value={formData.soHopDong}
                disabled
                readOnly
                placeholder="HĐ-…/…"
                style={{
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontWeight: "bold",
                }}
              />
            </div>
            <div className="form-group">
              <label>
                Nhân viên <span style={{ color: "red" }}>*</span>
              </label>
              {contract || isPhuLuc ? (
                <input
                  value={employeeName()}
                  disabled
                  readOnly
                  style={{ background: "#f3f4f6", color: "#6b7280" }}
                />
              ) : (
                <select
                  name="maNhanVien"
                  value={formData.maNhanVien}
                  onChange={handleChange}
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map((e) => (
                    <option key={e.maNhanVien} value={e.maNhanVien}>
                      {e.hoTen} ({e.maNhanVien})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Loại hợp đồng</label>
              <select
                name="loaiHopDong"
                value={formData.loaiHopDong}
                onChange={handleChange}
                disabled={isPhuLuc}
              >
                <option value="Chính thức">Hợp đồng Chính thức</option>
                <option value="Thử việc">Hợp đồng Thử việc</option>
              </select>
            </div>
            {!isPhuLuc && (
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
            )}
          </div>

          {/* Chức vụ + Nơi làm việc */}
          <div className="form-group-row">
            <div className="form-group">
              <label>Chức vụ / Vị trí</label>
              <select
                name="maChucVu"
                value={formData.maChucVu}
                onChange={handleChange}
              >
                <option value="">-- Giữ nguyên / Chưa chọn --</option>
                {chucVus.map((cv) => (
                  <option key={cv.maChucVuNV} value={cv.maChucVuNV}>
                    {cv.tenChucVu}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nơi làm việc</label>
              <input
                type="text"
                name="noiLamViec"
                value={formData.noiLamViec}
                onChange={handleChange}
                placeholder="VD: Văn phòng chính, Chi nhánh HN..."
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>{isPhuLuc ? "Ngày hiệu lực" : "Ngày bắt đầu"}</label>
              <input
                type="date"
                name="ngayBatDau"
                value={formData.ngayBatDau}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>
                {isPhuLuc
                  ? "Ngày kết thúc (gia hạn - trống nếu vô thời hạn)"
                  : "Ngày kết thúc (Để trống nếu Vô thời hạn)"}
              </label>
              <input
                type="date"
                name="ngayKetThuc"
                value={formData.ngayKetThuc}
                onChange={handleChange}
              />
            </div>
          </div>

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
            {isPhuLuc ? "Lưu Phụ lục" : "Lưu Hợp Đồng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;
