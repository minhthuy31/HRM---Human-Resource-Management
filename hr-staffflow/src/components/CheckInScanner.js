import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { api } from "../api";
import "../styles/CheckInScanner.css";

const CheckInScanner = ({ onScanSuccess, onScanError }) => {
  // Dùng state để lưu trữ đối tượng scanner
  const [scanner, setScanner] = useState(null);

  // Hàm xử lý khi quét thành công
  const handleScanSuccess = async (decodedText, decodedResult) => {
    if (scanner) {
      // 1. Tạm dừng camera
      scanner.pause(true);

      try {
        // 2. Gọi API Check-in/Check-out
        const response = await api.post("/ChamCong/check-in-qr", {
          qrToken: decodedText,
        });

        // 3. Báo thành công (component cha sẽ tự đóng modal)
        onScanSuccess(response.data.message);

        // 4. Dọn dẹp scanner
        scanner.clear().catch((error) => {
          console.error("Lỗi khi dọn dẹp scanner:", error);
        });
      } catch (err) {
        // 5. Báo lỗi
        const errorMessage =
          err.response?.data?.message || "Lỗi không xác định";
        onScanError(errorMessage);

        // 6. Cho phép quét lại sau 2 giây
        setTimeout(() => {
          if (scanner) scanner.resume();
        }, 2000);
      }
    }
  };

  // Hàm xử lý khi quét lỗi
  const handleScanError = (error) => {
    // Hiển thị lỗi ra console
    console.warn(`Lỗi quét QR: ${error}`);

    // Báo lỗi này về cho trang cha (EmployeeHomePage)
    // Dùng hàm onScanError từ props
    onScanError(`Lỗi Quét: Không thể giải mã ảnh. Vui lòng thử lại.`);
  };

  // Hàm này sẽ chạy 1 lần khi component được render
  useEffect(() => {
    const newScanner = new Html5QrcodeScanner(
      "qr-reader-container", // ID của thẻ div bên dưới
      {
        fps: 10, // Số khung hình/giây
        qrbox: { width: 250, height: 250 }, // Kích thước khung quét
        rememberLastUsedCamera: true,
      },
      false // verbose = false
    );

    // Bắt đầu render camera và quét
    newScanner.render(handleScanSuccess, handleScanError);

    // Lưu đối tượng scanner vào state để dùng ở trên
    setScanner(newScanner);

    // Hàm dọn dẹp: Sẽ chạy khi component bị tắt (unmount)
    return () => {
      newScanner.clear().catch((error) => {
        console.error("Lỗi dọn dẹp scanner:", error);
      });
    };
  }, []); // Chạy 1 lần duy nhất

  return (
    <div className="scanner-container">
      {/* Thư viện sẽ tự động gắn camera vào thẻ div này */}
      <div id="qr-reader-container"></div>
    </div>
  );
};

export default CheckInScanner;
