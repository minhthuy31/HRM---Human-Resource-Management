import axios from "axios";

// ĐỊNH NGHĨA IP AWS TẠI ĐÂY ĐỂ DỄ QUẢN LÝ
const AWS_IP = "3.107.18.50";

const api = axios.create({
  // Sửa localhost thành IP của AWS
  baseURL: `http://${AWS_IP}:5260/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// INTERCEPTOR REQUEST: Giữ nguyên
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// INTERCEPTOR RESPONSE: Sửa địa chỉ Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) throw new Error("No Refresh Token");

        // QUAN TRỌNG: Phải dùng IP AWS ở đây để gọi API refresh
        const res = await axios.post(
          `http://${AWS_IP}:5260/api/Auth/refresh-token`,
          {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        );

        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;

        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Session expired.");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export { api };
