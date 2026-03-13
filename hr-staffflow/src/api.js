import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5260/api", // Địa chỉ ip của API
  headers: {
    "Content-Type": "application/json",
  },
});

// INTERCEPTOR REQUEST: Tự động gắn Access Token vào mọi API gửi đi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// INTERCEPTOR RESPONSE: Bắt lỗi 401 để tự động Refresh Token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Hết hạn Token) và chưa từng thử refresh (_retry = false)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Đánh dấu đã thử refresh để tránh lặp vô hạn

      try {
        const accessToken = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Không có Refresh Token, phải đăng nhập lại");
        }

        // Gọi API refresh token.
        // LƯU Ý: Dùng axios mặc định, KHÔNG dùng biến 'api' để tránh bị vòng lặp interceptor
        const res = await axios.post(
          "http://localhost:5260/api/Auth/refresh-token",
          {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        );

        // Nếu thành công, lưu cặp token mới vào LocalStorage
        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;

        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Gắn token mới vào request ban đầu và GỌI LẠI request đó
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng thất bại (quá 7 ngày hoặc bị thay đổi)
        console.error("Phiên đăng nhập đã hết hạn hoàn toàn.");

        // Xóa sạch dữ liệu cũ
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Đá người dùng về trang đăng nhập
        window.location.href = "/";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { api };
