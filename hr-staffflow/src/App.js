import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/DashBoard";
import EmployeeManagementPage from "./pages/EmployeeManagementPage";
import DepartmentPage from "./pages/DepartmentPage";
import TimekeepingPage from "./pages/TimekeepingPage";
import PayrollPage from "./pages/PayrollPage";
import LeaveManagementPage from "./pages/LeaveManagementPage";
import DisciplinePage from "./pages/DisciplinePage";
import AnnouncementPage from "./pages/AnnouncementPage.js";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import EmployeeEditPage from "./pages/EmployeeEditPage";
import EmployeeHomePage from "./pages/EmployeeHomePage";
import EmployeeDetailPageNV from "./pages/EmployeeDetailPageNV";
import EmployeeWelcome from "./pages/EmployeeWelcome";
import MyTimekeepingPage from "./pages/MyTimekeepingPage";
import KioskPage from "./pages/KioskPage";
import MyPayslipPage from "./pages/MyPayslipPage";
import ContractManagementPage from "./pages/ContractManagementPage.js";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/nhan-vien" element={<ProtectedRoute><EmployeeManagementPage /></ProtectedRoute>} />
        <Route path="/phong-ban" element={<ProtectedRoute><DepartmentPage /></ProtectedRoute>} />
        <Route path="/cham-cong" element={<ProtectedRoute><TimekeepingPage /></ProtectedRoute>} />
        <Route path="/luong" element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
        <Route path="/nghi-phep" element={<ProtectedRoute><LeaveManagementPage /></ProtectedRoute>} />
        <Route path="/khen-thuong" element={<ProtectedRoute><DisciplinePage /></ProtectedRoute>} />
        <Route path="/thong-bao" element={<ProtectedRoute><AnnouncementPage /></ProtectedRoute>} />
        <Route path="/bao-cao" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/kiosk" element={<KioskPage />} /> {/* Kiosk thường để ngoài không cần login cá nhân, hoặc có auth riêng */}
        <Route path="/hop-dong" element={<ProtectedRoute><ContractManagementPage /></ProtectedRoute>} />
        <Route path="/cai-dat" element={<ProtectedRoute><SystemSettingsPage /></ProtectedRoute>} />

        <Route path="/nhan-vien/:employeeId" element={<ProtectedRoute><EmployeeDetailPage /></ProtectedRoute>} />
        <Route
          path="/nhan-vien/:employeeId/edit"
          element={<ProtectedRoute><EmployeeEditPage /></ProtectedRoute>}
        />
        {/* --- CẤU HÌNH ROUTE LỒNG NHAU --- */}
        <Route path="/employee-home/:employeeId" element={<ProtectedRoute><EmployeeHomePage /></ProtectedRoute>}>
          {/* Trang mặc định khi vào employee-home */}
          <Route index element={<EmployeeWelcome />} />

          {/* Trang con cho thông tin chi tiết */}
          <Route path="details" element={<EmployeeDetailPageNV />} />
          <Route path="timekeeping" element={<MyTimekeepingPage />} />
          <Route path="payslip" element={<MyPayslipPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
