// import axios from "axios";

// // ĐỊNH NGHĨA IP AWS TẠI ĐÂY ĐỂ DỄ QUẢN LÝ
// //const AWS_IP = "3.107.18.50";
// const AWS_IP = "localhost";

// const api = axios.create({
//   // Sửa localhost thành IP của AWS
//   baseURL: `http://${AWS_IP}:5260/api`,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // INTERCEPTOR REQUEST: Giữ nguyên
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers["Authorization"] = "Bearer " + token;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // INTERCEPTOR RESPONSE: Sửa địa chỉ Refresh Token
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response &&
//       error.response.status === 401 &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;

//       try {
//         const accessToken = localStorage.getItem("token");
//         const refreshToken = localStorage.getItem("refreshToken");

//         if (!refreshToken) throw new Error("No Refresh Token");

//         // QUAN TRỌNG: Phải dùng IP AWS ở đây để gọi API refresh
//         const res = await axios.post(
//           `http://${AWS_IP}:5260/api/Auth/refresh-token`,
//           {
//             accessToken: accessToken,
//             refreshToken: refreshToken,
//           },
//         );

//         const newToken = res.data.token;
//         const newRefreshToken = res.data.refreshToken;

//         localStorage.setItem("token", newToken);
//         localStorage.setItem("refreshToken", newRefreshToken);

//         originalRequest.headers["Authorization"] = "Bearer " + newToken;
//         return api(originalRequest);
//       } catch (refreshError) {
//         console.error("Session expired.");
//         localStorage.removeItem("token");
//         localStorage.removeItem("refreshToken");
//         window.location.href = "/";
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   },
// );

// export { api };

import axios from "axios";

const api = axios.create({
  // Thay đổi cốt lõi: Chỉ cần gọi "/api" (Đường dẫn tương đối)
  // Nginx trên server sẽ tự động bắt lấy chữ "/api" và bẻ lái vào Backend
  baseURL: `/api`,
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

    // Các endpoint xác thực (login/refresh/quên-đặt mật khẩu): KHÔNG chạy logic refresh
    // token khi gặp 401 — để lỗi (sai mật khẩu / tài khoản bị vô hiệu hóa) trả thẳng
    // về trang đăng nhập hiển thị, tránh bị redirect làm mất thông báo.
    const reqUrl = originalRequest?.url || "";
    const isAuthEndpoint =
      reqUrl.includes("/Auth/login") ||
      reqUrl.includes("/Auth/refresh-token") ||
      reqUrl.includes("/Auth/forgot-password") ||
      reqUrl.includes("/Auth/reset-password");

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) throw new Error("No Refresh Token");

        // QUAN TRỌNG: Gọi thẳng '/api/Auth/refresh-token'
        const res = await axios.post(`/api/Auth/refresh-token`, {
          accessToken: accessToken,
          refreshToken: refreshToken,
        });

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
