import * as faceapi from "face-api.js";

// Tải model face-api MỘT LẦN duy nhất và dùng lại (idempotent).
// Gọi preload sớm (vd lúc vào trang chủ) để khi mở chấm công không phải chờ tải.
let loadPromise = null;

export function ensureFaceModels() {
  if (loadPromise) return loadPromise; // đã/đang tải => dùng lại, không tải lại

  loadPromise = (async () => {
    const MODEL_URL = "/models"; // folder models nằm trong public/models

    // Ép dùng WebGL (GPU) cho nhanh; nếu không hỗ trợ thì tự dùng backend mặc định
    try {
      if (faceapi.tf?.setBackend) {
        await faceapi.tf.setBackend("webgl");
        await faceapi.tf.ready();
      }
    } catch (e) {
      console.warn("Không bật được WebGL, dùng backend mặc định:", e);
    }
    console.log("[faceModels] TF backend =", getBackend());

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    // "Làm nóng" model trên 1 canvas trắng để lần dò thật đầu tiên không bị khựng
    try {
      const warm = document.createElement("canvas");
      warm.width = 320;
      warm.height = 240;
      await faceapi
        .detectSingleFace(warm, new faceapi.TinyFaceDetectorOptions({ inputSize: 128 }))
        .withFaceLandmarks();
    } catch (e) {
      /* bỏ qua, chỉ là warm-up */
    }
  })();

  // Nếu tải lỗi thì cho phép thử lại lần sau
  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export function getBackend() {
  return faceapi.tf?.getBackend?.() || "?";
}
