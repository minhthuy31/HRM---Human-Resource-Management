import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";
import "../styles/KioskPage.css";

const KioskPage = () => {
  const [qrValue, setQrValue] = useState("Đang tải mã...");
  const [error, setError] = useState(false);

  const fetchNewToken = async () => {
    try {
      // Gọi API 1 (Backend) bạn vừa tạo
      const response = await api.get("/Kiosk/generate-token");
      setQrValue(response.data.token); // Cập nhật mã QR
      setError(false);
    } catch (err) {
      console.error("Lỗi lấy token: ", err);
      setError(true);
      setQrValue("Lỗi kết nối máy chủ...");
    }
  };

  useEffect(() => {
    // Lấy mã ngay khi trang tải
    fetchNewToken();

    // Cứ 15 giây lấy mã mới 1 lần
    const intervalId = setInterval(() => {
      fetchNewToken();
    }, 300000); // 300 giây

    return () => clearInterval(intervalId); // Dọn dẹp
  }, []);

  return (
    <div className="kiosk-container">
      <h1>Vui lòng quét mã để Check-in / Check-out</h1>
      <div className="qr-wrapper">
        {error ? (
          <p>{qrValue}</p>
        ) : (
          <QRCodeSVG
            value={qrValue} // Hiển thị mã QR từ state
            size={400} // Kích thước QR
            level={"H"}
            includeMargin={true}
          />
        )}
      </div>
      <p>Mã này sẽ tự động làm mới sau 300 giây.</p>
    </div>
  );
};

export default KioskPage;
