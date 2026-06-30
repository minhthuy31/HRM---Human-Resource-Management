import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useToast } from "../context/ToastContext";

// ===== Cấu hình kiểm tra "người sống" (liveness / chống giả mạo bằng ảnh) =====
// Cơ chế: yêu cầu HÁ MIỆNG. Miệng đóng/mở chênh nhau rất lớn nên tín hiệu rõ ràng,
// camera bắt trúng ngay lần đầu kể cả máy yếu => nhanh, không phải lặp lại nhiều lần.
// Ảnh tĩnh giơ trước camera không tự há miệng được nên bị chặn.
const MAR_OPEN = 0.35; // MAR > 0.35 => coi là ĐANG HÁ MIỆNG (miệng đóng ~0.0-0.1)
const OPEN_HOLD_MS = 400; // Giữ há miệng liên tục đủ lâu này => xác thực là người thật
const LIVENESS_TIMEOUT_MS = 15000; // Thời gian tối đa cho bước xác thực

// Tính Mouth Aspect Ratio (MAR): độ mở miệng theo chiều dọc / chiều rộng miệng.
// getMouth() trả 20 điểm (landmark 48..67). Dùng môi TRONG cho tín hiệu há rõ nhất:
//   điểm 62 (môi trên trong) = index 14, điểm 66 (môi dưới trong) = index 18,
//   khóe trái 48 = index 0, khóe phải 54 = index 6.
const mouthAspectRatio = (mouth) => {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical = dist(mouth[14], mouth[18]);
  const horizontal = dist(mouth[0], mouth[6]);
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
   * Kiểm tra "người sống" bằng cách yêu cầu người dùng HÁ MIỆNG.
   * Phân tích trực tiếp luồng video (nhiều khung hình) thay vì 1 ảnh tĩnh,
   * nên ảnh in / điện thoại giơ trước camera sẽ KHÔNG vượt qua được.
   * Trả về true nếu phát hiện há miệng giữ đủ lâu trong thời gian cho phép.
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
    let openStart = 0; // Mốc thời gian bắt đầu há miệng liên tục (0 = đang ngậm)
    let sawFace = false;

    livenessRunningRef.current = true;

    while (livenessRunningRef.current) {
      if (Date.now() - startTime > LIVENESS_TIMEOUT_MS) {
        setStatusText("");
        showToast(
          "Xác thực thất bại: chưa phát hiện há miệng. Vui lòng nhìn vào camera và há miệng (không dùng ảnh).",
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
      const mar = mouthAspectRatio(detection.landmarks.getMouth());

      // Xác thực khi HÁ MIỆNG giữ liên tục đủ lâu (ảnh tĩnh không tự há miệng được)
      if (mar > MAR_OPEN) {
        if (openStart === 0) openStart = Date.now();
        if (Date.now() - openStart >= OPEN_HOLD_MS) {
          setStatusText("Xác thực người thật thành công ✓");
          return true;
        }
        setStatusText("Giữ há miệng... sắp xong");
      } else {
        openStart = 0; // Ngậm miệng thì đặt lại bộ đếm
        setStatusText(`Hãy HÁ MIỆNG to để xác thực (độ mở: ${mar.toFixed(2)})`);
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
            Để chống gian lận, khi xác nhận hãy HÁ MIỆNG to và giữ một chút để xác
            thực bạn là người thật (không dùng được ảnh).
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
