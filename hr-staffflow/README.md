# Hệ thống Quản lý Nhân sự (HRM)

Một giải pháp Quản lý Nguồn nhân lực (HRM) full-stack, được xây dựng để cung cấp một nền tảng tập trung cho các nghiệp vụ nhân sự.

Dự án bao gồm một **Backend C# .NET API** và một **Frontend React.js**, được thiết kế để phục vụ hai nhóm người dùng chính: **Quản lý** và **Nhân viên**.

## 🏛️ Các phân hệ (Modules)

Hệ thống được tổ chức thành các module chức năng chính:

- **Xác thực & Phân quyền (Authentication & Authorization):**

  - Xử lý đăng nhập an toàn (JWT) và phân quyền truy cập dựa trên 5 vai trò (Giám đốc, Trưởng phòng, Nhân sự, Nhân viên...).

- **Quản lý Nhân viên (Employee Management):**

  - Cung cấp các thao tác (CRUD) để quản lý hồ sơ và thông tin chi tiết của nhân viên.

- **Quản lý Thời gian (Time & Attendance):**

  - Bao gồm chức năng chấm công (`ChamCong`) và quản lý đơn xin nghỉ phép (`DonNghiPhep`) với quy trình duyệt.

- **Quản lý Lương (Payroll):**

  - Cung cấp một giao diện để tổng hợp dữ liệu chấm công, tính toán và chốt bảng lương hàng tháng.

- **Cổng thông tin Nhân viên (Employee Portal):**
  - Một giao diện (`EmployeeHomePage`) dành riêng cho nhân viên, cho phép họ xem thông tin cá nhân, bảng công, phiếu lương và gửi các yêuCầ.

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Lĩnh vực     | Công nghệ                                                |
| :----------- | :------------------------------------------------------- |
| **Backend**  | C# .NET 7/8, ASP.NET Core Web API, Entity Framework Core |
| **Frontend** | React.js, React Router, Axios                            |
| **Database** | Microsoft SQL Server                                     |

---

## 🚀 Khởi chạy dự án

Dự án yêu cầu chạy cả hai thành phần (Backend và Frontend) song song.

### 1. Backend (.NET API)

1.  Mở file `.sln` bằng Visual Studio.
2.  Cập nhật `ConnectionStrings` trong `appsettings.json` để trỏ đến CSDL SQL Server của bạn.
3.  Mở **Package Manager Console** và chạy lệnh `update-database`.
4.  Nhấn **F5** để khởi chạy máy chủ API.

### 2. Frontend (React App)

1.  Điều hướng đến thư mục dự án Frontend.
2.  Chạy `npm install` để cài đặt các gói.
3.  Cập nhật `baseURL` trong `src/api.js` để trỏ đến địa chỉ API Backend đang chạy.
4.  Chạy `npm start` để khởi chạy ứng dụng.
5.  Truy cập [http://localhost:3000](http://localhost:3000).
