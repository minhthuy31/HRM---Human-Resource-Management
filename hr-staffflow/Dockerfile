# ==========================================
# GIAI ĐOẠN 1: Nấu code (Build)
# ==========================================
FROM node:18-alpine AS build
WORKDIR /app

# Copy các file quản lý thư viện vào trước
COPY package*.json ./

# Cài đặt thư viện (Chạy npm install)
RUN npm install

# Copy toàn bộ source code của bạn vào
COPY . .
# tối ưu ram: RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build
# Chạy lệnh build để đóng gói React/Vue thành HTML/CSS/JS thuần
RUN npm run build
# (Lưu ý: Nếu bạn dùng Vite, có thể nó sinh ra thư mục 'dist' thay vì 'build'. Mình đang lấy chuẩn là 'build').

# ==========================================
# GIAI ĐOẠN 2: Bưng ra đĩa (Chạy bằng Nginx)
# ==========================================
FROM nginx:alpine

# Xóa cái web mặc định tẻ nhạt của Nginx đi
RUN rm -rf /usr/share/nginx/html/*

# Lấy "món ăn" đã nấu xong ở Giai đoạn 1 xếp vào Nginx
# Nếu dự án của bạn dùng Vite (thư mục xuất ra là dist), hãy đổi /app/build thành /app/dist nhé!
COPY --from=build /app/build /usr/share/nginx/html

# GIA VỊ BÍ MẬT: Cấu hình này giúp React/Vue không bị lỗi 404 khi bạn F5 trang
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Mở cửa số 80 (để file docker-compose.yml nối vào cổng 3000 của bạn)
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]