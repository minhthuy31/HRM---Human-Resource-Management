import React from "react";
import "../../styles/Modal.css";

const RequestDetailModal = ({ request, onClose }) => {
  if (!request || !request.chiTiet) return null;

  const { loaiDon, trangThai, chiTiet } = request;

  // Format ngày giờ
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("vi-VN");
  const formatMoney = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  // Chọn màu trạng thái
  const statusColor =
    trangThai === "Đã duyệt"
      ? "#10b981"
      : trangThai === "Từ chối"
        ? "#ef4444"
        : "#f59e0b";

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "500px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #eee",
            paddingBottom: "10px",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ margin: 0, color: "#2563eb" }}>
            Chi tiết chứng từ: {loaiDon}
          </h3>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "bold",
              backgroundColor: statusColor,
            }}
          >
            {trangThai}
          </span>
        </div>

        <div style={{ fontSize: "15px", lineHeight: "1.8", color: "#374151" }}>
          {/* FORMAT HIỂN THỊ: NGHỈ PHÉP & NGHỈ KHÔNG LƯƠNG */}
          {(loaiDon === "Nghỉ phép" || loaiDon === "Nghỉ không lương") && (
            <>
              <p>
                <strong>Từ ngày:</strong> {formatDate(chiTiet.ngayBatDau)}
              </p>
              <p>
                <strong>Đến ngày:</strong> {formatDate(chiTiet.ngayKetThuc)}
              </p>
              <p>
                <strong>Tổng số ngày nghỉ:</strong>{" "}
                <span style={{ color: "#d97706", fontWeight: "bold" }}>
                  {chiTiet.soNgayNghi} ngày
                </span>
              </p>
              <p>
                <strong>Lý do chi tiết:</strong>
              </p>
              <div
                style={{
                  background: "#f3f4f6",
                  padding: "10px",
                  borderRadius: "6px",
                  fontStyle: "italic",
                }}
              >
                {chiTiet.lyDo}
              </div>
            </>
          )}

          {/* FORMAT HIỂN THỊ: OT */}
          {loaiDon === "OT" && (
            <>
              <p>
                <strong>Ngày làm thêm:</strong>{" "}
                {formatDate(chiTiet.ngayLamThem)}
              </p>
              <p>
                <strong>Khung giờ:</strong> {chiTiet.gioBatDau} -{" "}
                {chiTiet.gioKetThuc}
              </p>
              <p>
                <strong>Tổng thời gian:</strong>{" "}
                <span style={{ color: "#059669", fontWeight: "bold" }}>
                  {chiTiet.soGio} giờ
                </span>
              </p>
              <p>
                <strong>Lý do / Dự án:</strong>
              </p>
              <div
                style={{
                  background: "#f3f4f6",
                  padding: "10px",
                  borderRadius: "6px",
                  fontStyle: "italic",
                }}
              >
                {chiTiet.lyDo}
              </div>
            </>
          )}

          {/* FORMAT HIỂN THỊ: CÔNG TÁC */}
          {loaiDon === "Công tác" && (
            <>
              <p>
                <strong>Thời gian:</strong> {formatDate(chiTiet.ngayBatDau)} -{" "}
                {formatDate(chiTiet.ngayKetThuc)}
              </p>
              <p>
                <strong>Nơi công tác:</strong> {chiTiet.noiCongTac}
              </p>
              <p>
                <strong>Phương tiện:</strong> {chiTiet.phuongTien}
              </p>
              <p>
                <strong>Mục đích:</strong> {chiTiet.mucDich}
              </p>
              <div
                style={{
                  marginTop: "10px",
                  borderTop: "1px dashed #ccc",
                  paddingTop: "10px",
                }}
              >
                <p>
                  <strong>Kinh phí dự kiến:</strong>{" "}
                  {formatMoney(chiTiet.kinhPhiDuKien)}
                </p>
                <p>
                  <strong>Số tiền tạm ứng:</strong>{" "}
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                    {formatMoney(chiTiet.soTienTamUng)}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button className="btn-cancel" onClick={onClose}>
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
