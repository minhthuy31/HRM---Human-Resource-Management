import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useToast } from "../context/ToastContext";
import { ensureFaceModels, getBackend } from "../utils/faceModels";

// ===== Cấu hình kiểm tra "người sống" (liveness / chống giả mạo bằng ảnh) =====
// Cơ chế: bắt CHUYỂN ĐỘNG nhắm mắt theo chuỗi MỞ -> NHẮM -> MỞ lại.
// Ảnh tĩnh chỉ thể hiện được MỘT trạng thái cố định nên không thể tạo ra chuyển
// động này => giơ ảnh (mắt mở hay mắt nhắm) đều bị chặn. Không cần model mới.
//
// QUAN TRỌNG: ngưỡng KHÔNG cố định mà TỰ ĐO theo mắt mở của từng người (baseline),
// rồi lấy theo TỈ LỆ của baseline đó => hợp với mọi khuôn mặt/camera, hết cảnh
// "ngưỡng không khớp mắt người này".
const CALIB_FRAMES = 3; // Số khung đo lúc đầu để lấy "mốc" mắt mở (baseline)
const CLOSED_RATIO = 0.9; // Coi là NHẮM khi EAR tụt dưới 90% baseline (cao = chỉ cần chớp nhẹ cũng nhận)
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
  const [backendName, setBackendName] = useState(""); // CHẨN ĐOÁN: webgl (nhanh) hay cpu (chậm)

  const isRegister = mode === "register";

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Dùng module chung: nếu trang chủ đã preload thì đây trả về ngay (không chờ)
        await ensureFaceModels();
        setBackendName(getBackend());
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
    let minEar = 1; // EAR thấp nhất khi chớp (để chẩn đoán)
    let belowCount = 0; // số khung liên tiếp thấy mắt khép
    let frameCount = 0; // đếm khung để tính fps

    livenessRunningRef.current = true;

    while (livenessRunningRef.current) {
      if (Date.now() - startTime > LIVENESS_TIMEOUT_MS) {
        setStatusText("");
        showToast(
          "Xác thực thất bại. Hãy nhìn thẳng camera rồi NHẮM MẮT một cái và MỞ ra (không dùng ảnh).",
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
      frameCount += 1;
      const landmarks = detection.landmarks;
      const ear =
        (eyeAspectRatio(landmarks.getLeftEye()) +
          eyeAspectRatio(landmarks.getRightEye())) /
        2;

      // Máy trạng thái: ĐO mắt mở -> chờ NHẮM (có chuyển động => ảnh tĩnh không qua được)
      if (phase === 0) {
        // Đo baseline mắt mở của riêng người này
        calib.push(ear);
        setStatusText(`Giữ MẮT MỞ, đang chuẩn bị... (${calib.length}/${CALIB_FRAMES})`);
        if (calib.length >= CALIB_FRAMES) {
          baseline = median(calib);
          closedThr = baseline * CLOSED_RATIO;
          phase = 1;
        }
      } else if (phase === 1) {
        if (ear < minEar) minEar = ear;
        // Cần 2 khung liên tiếp thấy mắt khép (chống 1 khung nhiễu, vẫn rất nhạy)
        belowCount = ear < closedThr ? belowCount + 1 : 0;
        if (belowCount >= 2) {
          setStatusText("Xác thực người thật thành công ✓");
          return true;
        }
        const secs = (Date.now() - startTime) / 1000;
        const fps = secs > 0 ? Math.round(frameCount / secs) : 0;
        setStatusText(
          `CHỚP MẮT đi — EAR ${ear.toFixed(2)} (thấp nhất ${minEar.toFixed(
            2
          )}) cần < ${closedThr.toFixed(2)} · ${fps} fps`
        );
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

    // inputSize lớn hơn cho bước này => dò khuôn mặt chính xác hơn (chỉ chạy 1 lần nên vẫn nhanh)
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 });
    for (let attempt = 0; attempt < 6; attempt++) {
      setStatusText("Đang nhận diện khuôn mặt...");
      const detection = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        // Chuyển descriptor sang mảng số thông thường để gửi đi
        return Array.from(detection.descriptor);
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    showToast(
      "Không nhận diện được khuôn mặt. Hãy đưa mặt vào GIỮA khung hình, đủ sáng rồi thử lại.",
      "error"
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
        {backendName && (
          <p
            style={{
              textAlign: "center",
              margin: "0 0 8px",
              fontSize: "12px",
              color: backendName === "webgl" ? "#28a745" : "#dc3545",
            }}
          >
            Chế độ xử lý: {backendName}
            {backendName === "webgl" ? " (GPU - nhanh)" : " (CHẬM - không có GPU)"}
          </p>
        )}

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
              videoConstraints={{ facingMode: "user", width: 320, height: 240 }}
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
            Để chống gian lận, khi xác nhận hãy giữ mắt mở 1 giây rồi CHỚP MẮT một
            cái để xác thực bạn là người thật (không dùng được ảnh).
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
