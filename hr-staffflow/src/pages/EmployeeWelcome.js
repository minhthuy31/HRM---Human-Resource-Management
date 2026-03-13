// src/components/EmployeeWelcome.js

import React from "react";
import { useOutletContext } from "react-router-dom";

const EmployeeWelcome = () => {
  const { employee } = useOutletContext();

  return (
    <div className="banner-card">
      <div className="banner-content">
        <h4>Chào mừng trở lại, {employee.hoTen}!</h4>
        <p>
          Đây là khu vực hiển thị các tin tức, thông báo và sự kiện của công ty.
          Hãy chọn một mục từ thanh bên trái để xem chi tiết.
        </p>
      </div>
    </div>
  );
};

export default EmployeeWelcome;
