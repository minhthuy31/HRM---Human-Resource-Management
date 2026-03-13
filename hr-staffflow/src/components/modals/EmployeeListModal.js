import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { FaTimes, FaUserCircle } from "react-icons/fa";
import "../../styles/EmployeePage.css";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("blob:")) return path;
  return `http://localhost:5260${path}`;
};

const EmployeeListModal = ({ phongBan, onCancel }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeesInDept = async () => {
      if (!phongBan) return;
      setLoading(true);
      try {
        // gọi api để lấy tên tên nhân viên trong phòng ban ấy
        const response = await api.get(
          `/NhanVien?maPhongBan=${phongBan.maPhongBan}`
        );
        setEmployees(response.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách nhân viên:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesInDept();
  }, [phongBan]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "1000px" }}>
        <div className="modal-header">
          <h2>Danh sách nhân viên: {phongBan.tenPhongBan}</h2>
          <button onClick={onCancel} className="modal-close-btn">
            <FaTimes />
          </button>
        </div>
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="table-container" style={{ height: "60vh" }}>
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Họ tên</th>
                  <th>Mã NV</th>
                  <th>Chức vụ</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.maNhanVien}>
                      <td>
                        {emp.hinhAnh ? (
                          <img
                            src={getImageUrl(emp.hinhAnh)}
                            alt={emp.hoTen}
                            className="table-avatar"
                          />
                        ) : (
                          <FaUserCircle
                            size={30}
                            style={{ color: "var(--toggle-icon-color)" }}
                          />
                        )}
                      </td>
                      <td>{emp.hoTen}</td>
                      <td>{emp.maNhanVien}</td>
                      <td>{emp.tenChucVu}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Không có nhân viên nào trong phòng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeListModal;
