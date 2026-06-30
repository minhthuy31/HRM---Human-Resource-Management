import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useToast } from "../context/ToastContext";

// ===== Cấu hình kiểm tra "người sống" (liveness / chống giả mạo bằng ảnh) =====
// Cơ chế: yêu cầu NHẮM MẮT GIỮ một lúc (thay vì rình 1 cú chớp chớp nhoáng).
// Mắt nhắm kéo dài => camera chắc chắn bắt trúng ngay lần đầu => nhanh, không mỏi mắt.
// Ngưỡng đặt theo dữ liệu đo thực tế: mắt mở EAR ~0.32, lúc nhắm tụt ~0.20.
const EAR_CLOSED = 0.25; // EAR < 0.25 => coi là ĐANG NHẮM mắt
const CLOSED_HOLD_MS = 800; // Giữ nhắm liên tục đủ lâu này => xác thực là người thật
const LIVENESS_TIMEOUT_MS = 15000; // Thời gian tối đa cho bước xác thực

// Tính Eye Aspect Ratio (EAR) cho 1 mắt gồm 6 điểm landmark
const eyeAspectRatio = (eye) => {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical = dist(eye[1], eye[5]) + dist(eye[2], eye[4]);
  const horizontal = 2 * dist(eye[0], eye[3]);
  return horizontal === 0 ? 0 : vertical / horizontal;
};

const FaceRecognition = ({ mode, onCapture, onClose }) => {
  const { showToast } = useToast();
  const webcamRef = useRef(null);
  const livenessRunningRef = useRef(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");

  const isRegister = mode === "register";

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
        showToast("Không thể tải model nhận diện khuôn mặt. Vui lòng kiểm tra lại cấu hình.", "error");
      }
    };
    loadModels();

    // Dừng vòng lặp liveness nếu component bị đóng giữa chừng
    return () => {
      livenessRunningRef.current = false;
    };
  }, []);

  /**
   * Kiểm tra "người sống" bằng cách yêu cầu người dùng chớp mắt.
   * Phân tích trực tiếp luồng video (nhiều khung hình) thay vì 1 ảnh tĩnh,
   * nên ảnh in / điện thoại giơ trước camera sẽ KHÔNG vượt qua được.
   * Trả về true nếu phát hiện đủ số lần chớp mắt trong thời gian cho phép.
   */
  const runLivenessCheck = async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) {
      showToast("Camera chưa sẵn sàng. Vui lòng thử lại.", "error");
      return false;
    }

    // inputSize nhỏ => quét nhanh, mượt hơn trên máy yếu
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 128 });
    const startTime = Date.now();
    let closedStart = 0; // Mốc thời gian bắt đầu nhắm mắt liên tục (0 = đang mở)
    let sawFace = false;

    livenessRunningRef.current = true;

    while (livenessRunningRef.current) {
      if (Date.now() - startTime > LIVENESS_TIMEOUT_MS) {
        setStatusText("");
        showToast(
          "Xác thực thất bại: không phát hiện chớp mắt. Vui lòng nhìn vào camera và chớp mắt (không dùng ảnh).",
          "error"
        );
        return false;
      }

      const detection = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks();

      if (!detection) {
        setStatusText("Không thấy khuôn mặt — hãy nhìn thẳng vào camera");
        continue;
      }

      sawFace = true;
      const landmarks = detection.landmarks;
      const ear =
        (eyeAspectRatio(landmarks.getLeftEye()) +
          eyeAspectRatio(landmarks.getRightEye())) /
        2;

      // Xác thực khi NHẮM MẮT giữ liên tục đủ lâu (ảnh tĩnh không tự nhắm được)
      if (ear < EAR_CLOSED) {
        if (closedStart === 0) closedStart = Date.now();
        if (Date.now() - closedStart >= CLOSED_HOLD_MS) {
          setStatusText("Xác thực người thật thành công ✓");
          return true;
        }
        setStatusText("Giữ nhắm mắt... sắp xong");
      } else {
        closedStart = 0; // Mở mắt thì đặt lại bộ đếm
        setStatusText("Hãy NHẮM MẮT và giữ ~1 giây để xác thực");
      }
    }

    if (!sawFace) {
      showToast("Không phát hiện khuôn mặt trong quá trình xác thực.", "error");
    }
    return false;
  };

  // Trích descriptor từ 1 ảnh chụp (giữ nguyên logic cũ để không ảnh hưởng so khớp)
  const captureDescriptor = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      showToast("Không thể chụp ảnh từ webcam.", "error");
      return null;
    }

    const img = await faceapi.fetchImage(imageSrc);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      showToast("Không phát hiện khuôn mặt nào. Vui lòng thử lại ở nơi đủ sáng.", "error");
      return null;
    }

    // Chuyển descriptor sang mảng số thông thường để gửi đi
    return Array.from(detection.descriptor);
  };

  const handleCapture = async () => {
    if (!modelsLoaded || isProcessing) return;
    setIsProcessing(true);

    try {
      // Chỉ bắt buộc kiểm tra "người sống" khi CHẤM CÔNG (chống chấm công bằng ảnh).
      // Khi đăng ký khuôn mặt thì giữ nguyên như cũ.
      if (!isRegister) {
        const isLive = await runLivenessCheck();
        livenessRunningRef.current = false;
        if (!isLive) {
          setStatusText("");
          setIsProcessing(false);
          return;
        }
      }

      const faceDescriptor = await captureDescriptor();
      if (!faceDescriptor) {
        setStatusText("");
        setIsProcessing(false);
        return;
      }

      // Gọi callback để xử lý tiếp (gửi API) — không thay đổi so với trước
      await onCapture(faceDescriptor);
    } catch (error) {
      console.error("Lỗi xử lý khuôn mặt:", error);
      showToast("Đã có lỗi xảy ra trong quá trình xử lý.", "error");
    } finally {
      livenessRunningRef.current = false;
      setStatusText("");
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
          {isRegister ? "Đăng Ký Khuôn Mặt" : "Chấm Công Khuôn Mặt"}
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
                textAlign: "center",
                padding: "0 20px",
                zIndex: 10,
              }}
            >
              {statusText || "Đang xử lý..."}
            </div>
          )}
        </div>

        {!isRegister && (
          <p
            style={{
              marginTop: "10px",
              fontSize: "13px",
              color: "#6c757d",
              textAlign: "center",
            }}
          >
            Để chống gian lận, khi xác nhận hãy NHẮM MẮT và giữ khoảng 1 giây để
            xác thực bạn là người thật (không dùng được ảnh).
          </p>
        )}

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
            {isRegister ? "Lưu Khuôn Mặt" : "Xác Nhận Chấm Công"}
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
