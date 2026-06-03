# ==========================================
# STAGE 1: Build React
# ==========================================
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Giới hạn RAM khi build để server không bị chết
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build

# ==========================================
# STAGE 2: Nginx (Lắng nghe cổng 443)
# ==========================================
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html

# # Ghi đè cấu hình Nginx: Mở cổng 443 và bẻ lái API sang Backend
RUN echo 'server { \
    listen 80; \
    server_name _; \
    \
    location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
    proxy_pass http://hr-backend:8080/api/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "keep-alive"; \
    proxy_set_header Host $host; \
    proxy_cache_bypass $http_upgrade; \
    } \
    \
    location /images/ { \
    proxy_pass http://hr-backend:8080/images/; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]