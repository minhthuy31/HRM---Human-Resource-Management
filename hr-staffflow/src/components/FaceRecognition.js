import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { api } from "../api"; // Sử dụng instance api đã cấu hình sẵn của bạn

const FaceRecognition = ({ mode, onCapture, onClose }) => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Đảm bảo bạn đã copy folder models vào public/models
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Lỗi tải model AI:", error);
        alert(
          "Không thể tải model nhận diện khuôn mặt. Vui lòng kiểm tra lại cấu hình.",
        );
      }
    };
    loadModels();
  }, []);

  const handleCapture = async () => {
    if (!modelsLoaded || isProcessing) return;
    setIsProcessing(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        alert("Không thể chụp ảnh từ webcam.");
        setIsProcessing(false);
        return;
      }

      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert(
          "❌ Không phát hiện khuôn mặt nào. Vui lòng thử lại ở nơi đủ sáng.",
        );
        setIsProcessing(false);
        return;
      }

      // Chuyển descriptor sang mảng số thông thường để gửi đi
      const faceDescriptor = Array.from(detection.descriptor);

      // Gọi callback để xử lý tiếp (gửi API)
      await onCapture(faceDescriptor);
    } catch (error) {
      console.error("Lỗi xử lý khuôn mặt:", error);
      alert("Đã có lỗi xảy ra trong quá trình xử lý.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content scanner-modal"
        style={{ maxWidth: "600px" }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>
          {mode === "register" ? "Đăng Ký Khuôn Mặt" : "Chấm Công Khuôn Mặt"}
        </h2>

        <div
          style={{
            position: "relative",
            minHeight: "300px",
            backgroundColor: "#000",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {modelsLoaded ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              style={{ width: "100%", height: "auto" }}
              videoConstraints={{ facingMode: "user" }}
            />
          ) : (
            <div
              style={{
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "300px",
              }}
            >
              Đang tải model AI...
            </div>
          )}

          {isProcessing && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              Đang xử lý...
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <button
            className="sidebar-action-btn"
            onClick={handleCapture}
            disabled={!modelsLoaded || isProcessing}
            style={{ width: "auto", minWidth: "150px" }}
          >
            {mode === "register" ? "Lưu Khuôn Mặt" : "Xác Nhận Chấm Công"}
          </button>
          <button
            className="sidebar-action-btn"
            onClick={onClose}
            style={{ width: "auto", backgroundColor: "#6c757d" }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;
