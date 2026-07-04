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
const CLOSED_RATIO = 0.78; // Coi là NHẮM khi EAR tụt dưới 78% baseline (chặt để ảnh nghiêng KHÔNG lọt;
// mắt thật nhắm sâu tụt tới ~35-40% nên vẫn qua thoải mái)
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

// Tính Mouth Aspect Ratio (MAR): độ mở miệng dọc / rộng miệng.
// getMouth() trả 20 điểm (48..67). Môi trong: 62=idx14, 66=idx18; khóe: 48=idx0, 54=idx6.
// Dùng để phát hiện trò NGHIÊNG ẢNH: nghiêng làm cả mặt bị nén => MAR cũng tụt,
// trong khi nhắm mắt thật thì miệng đứng yên => MAR không đổi.
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
      try {
        // Dùng module chung: nếu trang chủ đã preload thì đây trả về ngay (không chờ)
        await ensureFaceModels();
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
    const marCalib = []; // các mẫu MAR (miệng) lúc đo baseline
    let baseline = 0; // mốc EAR mắt mở của riêng người này
    let marBaseline = 0; // mốc MAR miệng của riêng người này
    let closedThr = 0;
    let belowCount = 0; // số khung liên tiếp thấy mắt khép (mà miệng vẫn ổn)

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
      const landmarks = detection.landmarks;
      const ear =
        (eyeAspectRatio(landmarks.getLeftEye()) +
          eyeAspectRatio(landmarks.getRightEye())) /
        2;
      const mar = mouthAspectRatio(landmarks.getMouth());

      // Máy trạng thái: ĐO mắt+miệng mở -> chờ NHẮM (mắt khép nhưng miệng KHÔNG nén)
      if (phase === 0) {
        // Đo baseline mắt mở + miệng của riêng người này
        calib.push(ear);
        marCalib.push(mar);
        setStatusText(`Giữ MẮT MỞ, đang chuẩn bị... (${calib.length}/${CALIB_FRAMES})`);
        if (calib.length >= CALIB_FRAMES) {
          baseline = median(calib);
          marBaseline = median(marCalib);
          closedThr = baseline * CLOSED_RATIO;
          phase = 1;
        }
      } else if (phase === 1) {
        const eyeClosed = ear < closedThr; // mắt khép
        // Chốt chặn tilt: nhắm thật thì miệng đứng yên; nghiêng ảnh thì miệng cũng bị nén
        const mouthStable = mar > marBaseline * 0.7;

        if (eyeClosed && mouthStable) {
          belowCount += 1; // khung hợp lệ liên tiếp
          if (belowCount >= 2) {
            setStatusText("Xác thực người thật thành công ✓");
            return true;
          }
        } else {
          belowCount = 0;
        }

        if (eyeClosed && !mouthStable) {
          setStatusText("Phát hiện nghiêng ảnh — vui lòng dùng khuôn mặt thật");
        } else {
          setStatusText("Hãy CHỚP MẮT để xác thực");
        }
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
