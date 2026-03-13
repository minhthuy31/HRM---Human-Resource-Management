import { jwtDecode } from "jwt-decode";

export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    // Lấy các thông tin cần thiết từ chuỗi claim dài
    const role =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const maNhanVien =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    return { ...decoded, role, maNhanVien };
  } catch (error) {
    console.error("Token không hợp lệ:", error);
    localStorage.removeItem("token"); //xóa token
    return null;
  }
};
