import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaPrint,
  FaFilter,
  FaFileContract,
} from "react-icons/fa";
import ContractModal from "../components/modals/ContractModal";
import ContractTemplate from "../components/templates/ContractTemplate";
import "../styles/ContractPage.css";

const ContractManagementPage = () => {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // State bộ lọc & tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("HieuLuc");

  // State Modal & Preview
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [printingContract, setPrintingContract] = useState(null);

  // --- 1. THÊM STATE LƯU THÔNG TIN GIÁM ĐỐC ---
  const [directorInfo, setDirectorInfo] = useState(null);

  // --- PHÂN QUYỀN ---
  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";
  const canModify = ["Giám đốc", "Tổng giám đốc", "Nhân sự trưởng"].includes(
    userRole,
  );

  // --- HÀM TẢI DỮ LIỆU ---
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/HopDong?search=${searchTerm}&trangThai=${statusFilter}`,
      );
      setContracts(res.data);
    } catch (err) {
      console.error("Lỗi tải hợp đồng:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchContracts(), 500);
    return () => clearTimeout(timer);
  }, [fetchContracts]);

  // --- 2. THÊM EFFECT GỌI API LẤY THÔNG TIN GIÁM ĐỐC ---
  useEffect(() => {
    const fetchDirector = async () => {
      try {
        // Gọi API bạn đã viết trong HopDongController
        // Dùng 'api' instance để tự động gửi kèm Token (tránh lỗi 401)
        const res = await api.get("/HopDong/GiamDoc");
        setDirectorInfo(res.data);
      } catch (err) {
        console.error("Không lấy được thông tin giám đốc:", err);
      }
    };
    fetchDirector();
  }, []);

  useEffect(() => {
    if (canModify) {
      const fetchEmps = async () => {
        try {
          const res = await api.get("/NhanVien?trangThai=true");
          setEmployees(res.data);
        } catch (err) {}
      };
      fetchEmps();
    }
  }, [canModify]);

  // --- FETCH FRESH DATA FOR PRINTING ---
  const handlePrintClick = async (contract) => {
    try {
      const empRes = await api.get(`/NhanVien/${contract.maNhanVien}`);
      const freshEmployeeData = empRes.data;

      const mergedData = {
        ...contract,
        ChuKy: freshEmployeeData.chuKy,
        CCCD: freshEmployeeData.cccd,
        DiaChi: freshEmployeeData.diaChiThuongTru,
        SoDienThoai: freshEmployeeData.sdt_NhanVien,
        NgaySinh: freshEmployeeData.ngaySinh,
      };

      setPrintingContract(mergedData);
    } catch (error) {
      console.error("Error fetching fresh employee data for print:", error);
      setPrintingContract(contract);
    }
  };

  const handleSave = async (payload, isUpdate) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (isUpdate) {
        const id = encodeURIComponent(payload.get("soHopDong"));
        await api.put(`/HopDong?id=${id}`, payload, config);
      } else {
        await api.post("/HopDong", payload, config);
      }
      alert(isUpdate ? "Cập nhật thành công!" : "Tạo hợp đồng mới thành công!");
      setIsModalOpen(false);
      setEditingContract(null);
      fetchContracts();
    } catch (err) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra.";
      alert("Lỗi: " + msg);
    }
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "---";

  const getStatusBadge = (status, endDate) => {
    if (status === "DaChamDut")
      return <span className="badge badge-red">Đã chấm dứt</span>;
    if (status === "HetHan")
      return <span className="badge badge-gray">Hết hạn</span>;
    if (endDate && new Date(endDate) < new Date()) {
      return <span className="badge badge-warning">Quá hạn (Cần gia hạn)</span>;
    }
    return <span className="badge badge-green">Đang hiệu lực</span>;
  };

  return (
    <DashboardLayout>
      <div className="contract-page">
        {/* --- 3. TRUYỀN BIẾN director={directorInfo} VÀO COMPONENT TEMPLATE --- */}
        {printingContract && (
          <ContractTemplate
            data={printingContract}
            director={directorInfo} // <--- QUAN TRỌNG: Thêm dòng này
            onClose={() => setPrintingContract(null)}
          />
        )}

        <div className="page-header">
          <div className="header-title">
            <h1>
              <FaFileContract /> Quản lý Hợp Đồng
            </h1>
          </div>
          {canModify && (
            <button
              className="btn-add"
              onClick={() => {
                setEditingContract(null);
                setIsModalOpen(true);
              }}
            >
              <FaPlus /> Tạo mới
            </button>
          )}
        </div>

        <div className="toolbar">
          <div className="search-box">
            <FaSearch />
            <input
              placeholder="Tìm theo tên NV, số HĐ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select"
            >
              <option value="HieuLuc">Đang hiệu lực</option>
              <option value="HetHan">Đã hết hạn</option>
              <option value="DaChamDut">Đã chấm dứt</option>
              <option value="All">Tất cả</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Số HĐ</th>
                  <th>Nhân viên</th>
                  <th>Phòng ban</th>
                  <th>Loại HĐ</th>
                  <th>Thời hạn</th>
                  <th>Lương ký</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length > 0 ? (
                  contracts.map((c) => (
                    <tr key={c.soHopDong}>
                      <td style={{ fontWeight: "bold", color: "#333" }}>
                        {c.soHopDong}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.hoTenNhanVien}</div>
                        <small style={{ color: "#888" }}>{c.maNhanVien}</small>
                      </td>
                      <td>{c.tenPhongBan || "---"}</td>
                      <td>{c.loaiHopDong}</td>
                      <td>
                        {formatDate(c.ngayBatDau)} -{" "}
                        {c.ngayKetThuc
                          ? formatDate(c.ngayKetThuc)
                          : "Vô thời hạn"}
                      </td>
                      <td style={{ fontWeight: "bold", color: "#10b981" }}>
                        {formatMoney(c.luongCoBan)}
                      </td>
                      <td>{getStatusBadge(c.trangThai, c.ngayKetThuc)}</td>
                      <td style={{ textAlign: "center" }}>
                        <div className="action-group">
                          <button
                            className="icon-btn print"
                            onClick={() => handlePrintClick(c)}
                            title="Xem & In"
                          >
                            <FaPrint />
                          </button>

                          {canModify && (
                            <button
                              className="icon-btn edit"
                              onClick={() => {
                                setEditingContract(c);
                                setIsModalOpen(true);
                              }}
                              title="Chỉnh sửa / Chấm dứt"
                            >
                              <FaEdit />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      Không tìm thấy hợp đồng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {isModalOpen && (
          <ContractModal
            contract={editingContract}
            employees={employees}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContractManagementPage;
