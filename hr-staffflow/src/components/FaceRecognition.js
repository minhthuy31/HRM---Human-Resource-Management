import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useToast } from "../context/ToastContext";
import { ensureFaceModels } from "../utils/faceModels";

// ===== Cấu hình kiểm tra "người sống" (liveness / chống giả mạo bằng ảnh) =====
// Cơ chế: bắt CHUYỂN ĐỘNG nhắm mắt theo chuỗi MỞ -> NHẮM -> MỞ lại.
// Ảnh tĩnh chỉ thể hiện được MỘT trạng thái cố định nên không thể tạo ra chuyển
// động này => giơ ảnh (mắt mở hay mắt nhắm) đều bị chặn. Không cần model mới.
//
// QUAN TRỌNG: ngưỡng KHÔNG cố định mà TỰ ĐO theo mắt mở của từng người (baseline),
// rồi lấy theo TỈ LỆ của baseline đó => hợp với mọi khuôn mặt/camera, hết cảnh
// "ngưỡng không khớp mắt người này".
const CALIB_FRAMES = 3; // Số khung đo lúc đầu để lấy "mốc" mắt mở (baseline)
const CLOSED_RATIO = 0.88; // Coi là NHẮM khi EAR tụt dưới 88% baseline (nới rộng => chớp nhẹ là ăn)
const LIVENESS_TIMEOUT_MS = 20000; // Thời gian tối đa cho bước xác thực

// Lấy trung vị (median) — bền với nhiễu hơn trung bình
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

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
      try {
        // Dùng module chung: nếu trang chủ đã preload thì đây trả về ngay (không chờ)
        await ensureFaceModels();
        setModelsLoaded(true);
      } catch (error) {
        console.error("Lỗi tải model AI:", error);
        showToast(
          "Không thể tải model nhận diện khuôn mặt. Vui lòng kiểm tra lại cấu hình.",
          "error",
        );
      }
    };
    loadModels();

    // Dừng vòng lặp liveness nếu component bị đóng giữa chừng
    return () => {
      livenessRunningRef.current = false;
    };
  }, []);

  /**
   * Kiểm tra "người sống" bằng CHUYỂN ĐỘNG nhắm mắt: MỞ -> NHẮM -> MỞ lại.
   * Vì phải có sự THAY ĐỔI trạng thái theo thời gian, một tấm ảnh tĩnh (luôn ở
   * một trạng thái) không thể vượt qua. Phân tích trực tiếp trên luồng video.
   * Trả về true nếu hoàn tất đủ chuỗi chuyển động trong thời gian cho phép.
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
    let phase = 0; // 0: ĐO mắt mở, 1: chờ NHẮM -> đạt
    let sawFace = false;
    const calib = []; // các mẫu EAR lúc đo baseline
    let baseline = 0; // mốc EAR mắt mở của riêng người này
    let closedThr = 0;

    livenessRunningRef.current = true;

    while (livenessRunningRef.current) {
      if (Date.now() - startTime > LIVENESS_TIMEOUT_MS) {
        setStatusText("");
        showToast(
          "Xác thực thất bại. Hãy nhìn thẳng camera rồi NHẮM MẮT một cái và MỞ ra (không dùng ảnh).",
          "error",
        );
        return false;
      }
      //lấy vector
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

      // Máy trạng thái: ĐO mắt mở -> chờ NHẮM (có chuyển động => ảnh tĩnh không qua được)
      if (phase === 0) {
        // Đo baseline mắt mở của riêng người này
        calib.push(ear);
        setStatusText(
          `Giữ MẮT MỞ, đang chuẩn bị... (${calib.length}/${CALIB_FRAMES})`,
        );
        if (calib.length >= CALIB_FRAMES) {
          baseline = median(calib);
          closedThr = baseline * CLOSED_RATIO;
          phase = 1;
        }
      } else if (phase === 1) {
        // Chỉ cần 1 khung thấy mắt khép là qua ngay => chớp phát nào ăn phát đó
        if (ear < closedThr) {
          setStatusText("Xác thực người thật thành công ✓");
          return true;
        }
        setStatusText("Hãy CHỚP MẮT để xác thực");
      }
    }

    if (!sawFace) {
      showToast("Không phát hiện khuôn mặt trong quá trình xác thực.", "error");
    }
    return false;
  };

  // Trích descriptor: lấy TRỰC TIẾP từ luồng video (ổn định hơn chụp ảnh tĩnh),
  // và thử lại vài lần để không bị trượt do 1 khung hình xấu.
  const captureDescriptor = async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) {
      showToast("Camera chưa sẵn sàng. Vui lòng thử lại.", "error");
      return null;
    }

    // inputSize vừa phải => nhanh mà vẫn đủ chính xác cho bước lấy vector
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
    for (let attempt = 0; attempt < 6; attempt++) {
      setStatusText("Đang nhận diện khuôn mặt...");
      const detection = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      //Lấy ra vector descriptor (128 chiều) để gửi đi
      if (detection) {
        // Chuyển descriptor sang mảng số thông thường để gửi đi
        return Array.from(detection.descriptor);
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    showToast(
      "Không nhận diện được khuôn mặt. Hãy đưa mặt vào GIỮA khung hình, đủ sáng rồi thử lại.",
      "error",
    );
    return null;
  };

  const handleCapture = async () => {
    if (!modelsLoaded || isProcessing) return;
    setIsProcessing(true);

    try {
      // Chỉ bắt buộc kiểm tra "người sống" khi CHẤM CÔNG (chống chấm công bằng ảnh).
      // Khi đăng ký khuôn mặt thì giữ nguyên như cũ.
      if (!isRegister) {
        const tL = Date.now();
        const isLive = await runLivenessCheck();
        console.log("[time] liveness (chớp mắt):", Date.now() - tL, "ms");
        livenessRunningRef.current = false;
        if (!isLive) {
          setStatusText("");
          setIsProcessing(false);
          return;
        }
      }

      const tC = Date.now();
      const faceDescriptor = await captureDescriptor();
      console.log("[time] captureDescriptor (lấy vector):", Date.now() - tC, "ms");
      if (!faceDescriptor) {
        setStatusText("");
        setIsProcessing(false);
        return;
      }

      // Gọi callback để xử lý tiếp (gửi API) — không thay đổi so với trước
      const tA = Date.now();
      await onCapture(faceDescriptor);
      console.log("[time] onCapture (gọi API chấm công):", Date.now() - tA, "ms");
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
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.72)",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <style>{`
        @keyframes frid-spin { to { transform: rotate(360deg); } }
        @keyframes frid-scan { 0% { top: 8%; } 50% { top: 86%; } 100% { top: 8%; } }
        @keyframes frid-pulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0, 0, 0, 0.06)",
            color: "#334155",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            zIndex: 5,
          }}
        >
          &times;
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "26px 24px 14px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 12px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              boxShadow: "0 8px 20px rgba(79, 70, 229, 0.35)",
            }}
          >
            {isRegister ? "🧑‍💼" : "🕒"}
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            {isRegister ? "Đăng Ký Khuôn Mặt" : "Chấm Công Khuôn Mặt"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#64748b" }}>
            {isRegister
              ? "Đưa khuôn mặt vào giữa khung rồi bấm lưu"
              : "Nhìn thẳng camera và chớp mắt để xác thực"}
          </p>
        </div>

        {/* Camera */}
        <div style={{ padding: "0 24px" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 16,
              overflow: "hidden",
              background: "#0b1220",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: isProcessing
                ? "0 0 0 3px #22d3ee, 0 0 22px rgba(34, 211, 238, 0.55)"
                : "none",
              transition: "box-shadow .25s",
            }}
          >
            {modelsLoaded ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user", width: 320, height: 240 }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  color: "#cbd5e1",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "3px solid rgba(255, 255, 255, 0.2)",
                    borderTopColor: "#22d3ee",
                    animation: "frid-spin 0.9s linear infinite",
                  }}
                />
                <span style={{ fontSize: 13 }}>Đang tải model AI...</span>
              </div>
            )}

            {/* Khung dẫn hướng + vạch quét (chỉ trang trí, không ảnh hưởng logic) */}
            {modelsLoaded && !isProcessing && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "58%",
                    height: "78%",
                    transform: "translate(-50%, -50%)",
                    border: "2px dashed rgba(255, 255, 255, 0.55)",
                    borderRadius: "50%",
                    animation: "frid-pulse 2s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    height: 2,
                    background:
                      "linear-gradient(90deg, transparent, #22d3ee, transparent)",
                    boxShadow: "0 0 10px #22d3ee",
                    animation: "frid-scan 2.6s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
              </>
            )}

          </div>
        </div>

        {/* Vùng trạng thái / hướng dẫn — nằm DƯỚI camera, không che mặt */}
        <div style={{ margin: "14px 24px 0", minHeight: 46 }}>
          {isProcessing ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#ecfeff",
                border: "1px solid #a5f3fc",
                display: "flex",
                gap: 10,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "#0e7490",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid rgba(14, 116, 144, 0.25)",
                  borderTopColor: "#0891b2",
                  animation: "frid-spin 0.8s linear infinite",
                  flex: "0 0 auto",
                }}
              />
              <span>{statusText || "Đang xử lý..."}</span>
            </div>
          ) : (
            !isRegister && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#eff6ff",
                  border: "1px solid #dbeafe",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 12.5,
                  color: "#1e40af",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontSize: 15 }}>🔒</span>
                <span>
                  Giữ mắt mở 1 giây rồi <b>chớp mắt</b> một cái để xác thực người
                  thật — hệ thống không chấp nhận ảnh.
                </span>
              </div>
            )
          )}
        </div>

        {/* Nút hành động */}
        <div style={{ display: "flex", gap: 12, padding: "18px 24px 24px" }}>
          <button
            onClick={onClose}
            style={{
              flex: "0 0 auto",
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#475569",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleCapture}
            disabled={!modelsLoaded || isProcessing}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              color: "#fff",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: !modelsLoaded || isProcessing ? "not-allowed" : "pointer",
              background:
                !modelsLoaded || isProcessing
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #6366f1, #06b6d4)",
              boxShadow:
                !modelsLoaded || isProcessing
                  ? "none"
                  : "0 8px 20px rgba(79, 70, 229, 0.35)",
            }}
          >
            {isProcessing
              ? "Đang xử lý..."
              : isRegister
              ? "Lưu Khuôn Mặt"
              : "Xác Nhận Chấm Công"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;
