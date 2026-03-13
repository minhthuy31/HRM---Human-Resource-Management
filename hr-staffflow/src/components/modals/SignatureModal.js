import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { FaEraser, FaSave, FaTimes } from "react-icons/fa";
import "../../styles/Modal.css";

const SignatureModal = ({ onSave, onCancel }) => {
  // Khởi tạo là null để tránh lỗi undefined khi mount
  const sigCanvas = useRef(null);

  // Xóa chữ ký để ký lại
  const clear = () => {
    sigCanvas.current.clear();
  };

  // Lưu chữ ký
  const handleSave = () => {
    // Kiểm tra xem người dùng đã ký chưa
    if (sigCanvas.current.isEmpty()) {
      alert("Vui lòng ký tên trước khi lưu.");
      return;
    }

    // --- FIX LỖI "trim_canvas is not a function" ---
    // Thay vì dùng getTrimmedCanvas().toDataURL(), ta dùng thẳng toDataURL()
    // Nhược điểm: Ảnh sẽ có nhiều khoảng trắng xung quanh (kích thước bằng khung vẽ)
    // Ưu điểm: Không bị lỗi crash ứng dụng.
    const base64String = sigCanvas.current.toDataURL("image/png");

    // Trả chuỗi này về cho component cha
    onSave(base64String);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: "500px" }}>
        <div className="modal-header">
          <h2>Tạo chữ ký điện tử</h2>
          <span className="close-icon" onClick={onCancel}>
            &times;
          </span>
        </div>

        <div
          className="modal-body"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "14px" }}>
            Vui lòng ký vào khung bên dưới bằng chuột hoặc màn hình cảm ứng.
          </p>

          <div
            style={{
              border: "2px dashed #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 450,
                height: 200,
                className: "sigCanvas",
              }}
            />
          </div>
        </div>

        <div
          className="modal-actions"
          style={{ justifyContent: "space-between", marginTop: "20px" }}
        >
          <button
            className="cancel-btn"
            onClick={clear}
            style={{
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
            }}
          >
            <FaEraser /> Ký lại
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="cancel-btn" onClick={onCancel}>
              Hủy
            </button>
            <button className="save-btn" onClick={handleSave}>
              <FaSave /> Lưu chữ ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
