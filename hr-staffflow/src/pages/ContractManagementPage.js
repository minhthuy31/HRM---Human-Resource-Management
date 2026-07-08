import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { getUserFromToken } from "../utils/auth";
import {
  FaBan,
  FaPlus,
  FaSearch,
  FaEdit,
  FaPrint,
  FaFilter,
  FaFileExcel,
  FaFileSignature,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import ContractModal from "../components/modals/ContractModal";
import ContractTemplate from "../components/templates/ContractTemplate";
import "../styles/ContractPage.css";

const ContractManagementPage = () => {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("HieuLuc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [phuLucParent, setPhuLucParent] = useState(null); // HĐ gốc khi tạo phụ lục
  const [printingContract, setPrintingContract] = useState(null);
  const [directorInfo, setDirectorInfo] = useState(null);

  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";
  const canModify = ["Giám đốc", "Tổng giám đốc", "Nhân sự trưởng"].includes(
    userRole,
  );

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/HopDong?search=${searchTerm}`;
      // Nếu chọn bộ lọc sắp hết hạn, gọi params sapHetHan
      if (statusFilter === "SapHetHan") {
        url += `&sapHetHan=true`;
      } else {
        url += `&trangThai=${statusFilter}`;
      }

      const res = await api.get(url);
      const sorted = [...(res.data || [])].sort((a, b) =>
        (a.hoTenNhanVien || "").localeCompare(b.hoTenNhanVien || "", "vi"),
      );
      setContracts(sorted);
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

  useEffect(() => {
    const fetchDirector = async () => {
      try {
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

  const handleSave = async (payload, mode) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      let res;
      if (mode === "phuluc") {
        res = await api.post("/HopDong/phu-luc", payload, config);
      } else if (mode === "update") {
        const id = encodeURIComponent(payload.get("soHopDong"));
        res = await api.put(`/HopDong?id=${id}`, payload, config);
      } else {
        res = await api.post("/HopDong", payload, config);
      }
      showToast(
        mode === "update"
          ? "Cập nhật hợp đồng thành công!"
          : mode === "phuluc"
            ? `Tạo phụ lục ${res.data?.soHopDong || ""} thành công!`
            : `Tạo hợp đồng ${res.data?.soHopDong || "mới"} thành công!`,
      );
      // Cảnh báo khe hở ngày giữa 2 hợp đồng (nếu có)
      if (res.data?.warning) showToast(res.data.warning, "error");
      setIsModalOpen(false);
      setEditingContract(null);
      setPhuLucParent(null);
      fetchContracts();
    } catch (err) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra.";
      showToast("Lỗi: " + msg, "error");
    }
  };

  const handleDelete = (soHopDong) => {
    setConfirmDelete(soHopDong);
  };

  // Mở modal tạo phụ lục cho 1 HĐ GỐC. Prefill theo giá trị HIỆN HÀNH
  // (phụ lục mới nhất nếu có) để phụ lục kế tiếp kế thừa lương/chức vụ đang áp dụng,
  // nhưng vẫn gắn vào HĐ gốc (không phải phụ lục của phụ lục).
  const openPhuLuc = (goc) => {
    const family = contracts.filter((c) => c.soHopDongGoc === goc.soHopDong);
    const latest = family.length
      ? family.reduce((a, b) =>
          new Date(a.ngayBatDau) >= new Date(b.ngayBatDau) ? a : b,
        )
      : goc;
    setEditingContract(null);
    setPhuLucParent({
      ...goc, // giữ soHopDong (gốc), maNhanVien, hoTenNhanVien, loaiHopDong
      luongCoBan: latest.luongCoBan,
      maChucVu: latest.maChucVu,
      noiLamViec: latest.noiLamViec,
      ngayKetThuc: latest.ngayKetThuc,
    });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const soHopDong = confirmDelete;
    setConfirmDelete(null);
    try {
      const id = encodeURIComponent(soHopDong);
      await api.delete(`/HopDong?id=${id}`);
      showToast("Đã vô hiệu hóa hợp đồng!");
      fetchContracts();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Có lỗi xảy ra khi vô hiệu hóa.";
      showToast("Lỗi: " + msg, "error");
    }
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "---";

  const statusLabel = (s) =>
    ({
      HieuLuc: "Đang hiệu lực",
      HetHan: "Hết hạn",
      DaChamDut: "Đã chấm dứt",
    })[s] || s;

  const handleExportExcel = () => {
    const headers = [
      "STT",
      "Số HĐ",
      "Họ tên NV",
      "Mã NV",
      "Phòng ban",
      "Loại HĐ",
      "Ngày bắt đầu",
      "Ngày kết thúc",
      "Lương ký (VNĐ)",
      "Trạng thái",
    ];

    const rows = contracts.map((c, i) => [
      i + 1,
      c.soHopDong,
      c.hoTenNhanVien || "",
      c.maNhanVien || "",
      c.tenPhongBan || "",
      c.loaiHopDong || "",
      c.ngayBatDau ? new Date(c.ngayBatDau).toLocaleDateString("vi-VN") : "",
      c.ngayKetThuc
        ? new Date(c.ngayKetThuc).toLocaleDateString("vi-VN")
        : "Vô thời hạn",
      Number(c.luongCoBan) || 0,
      statusLabel(c.trangThai),
    ]);

    const wsData = [[`DANH SÁCH HỢP ĐỒNG LAO ĐỘNG`], [], headers, ...rows];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    ws["!cols"] = [
      { wch: 5 },
      { wch: 16 },
      { wch: 22 },
      { wch: 10 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HopDong");
    XLSX.writeFile(
      wb,
      `DanhSachHopDong_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`,
    );
  };

  const getStatusBadge = (status, endDate) => {
    if (status === "DaChamDut")
      return <span className="badge badge-red">Đã chấm dứt</span>;
    if (status === "HetHan")
      return <span className="badge badge-gray">Hết hạn</span>;
    if (endDate && new Date(endDate) < new Date()) {
      return <span className="badge badge-warning">Quá hạn</span>;
    }
    return <span className="badge badge-green">Đang hiệu lực</span>;
  };

  return (
    <DashboardLayout>
      <div className="contract-page">
        {/* Confirm xóa */}
        {confirmDelete && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 9000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "28px 32px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                minWidth: "320px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚫</div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                Xác nhận vô hiệu hóa hợp đồng
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "20px",
                }}
              >
                Hợp đồng <strong>{confirmDelete}</strong> sẽ chuyển sang trạng
                thái <strong>Đã chấm dứt</strong>
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    cursor: "pointer",
                    background: "#f9fafb",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Vô hiệu hóa
                </button>
              </div>
            </div>
          </div>
        )}

        {printingContract && (
          <ContractTemplate
            data={printingContract}
            director={directorInfo}
            onClose={() => setPrintingContract(null)}
          />
        )}

        <div className="page-header">
          <div className="header-title">
            <h1>Quản lý Hợp Đồng</h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              <FaFileExcel /> Xuất Excel
            </button>
            {canModify && (
              <button
                className="btn-add"
                onClick={() => {
                  setEditingContract(null);
                  setPhuLucParent(null);
                  setIsModalOpen(true);
                }}
              >
                <FaPlus /> Tạo mới
              </button>
            )}
          </div>
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
              <option value="SapHetHan">Sắp hết hạn (≤ 30 ngày)</option>
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
                    <tr
                      key={c.soHopDong}
                      className={c.isExpiringSoon ? "row-expiring-soon" : ""}
                    >
                      <td style={{ fontWeight: "bold", color: "#333" }}>
                        {c.soHopDong}
                        {c.soHopDongGoc && (
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#0d9488",
                              marginTop: "2px",
                            }}
                            title={`Phụ lục của ${c.soHopDongGoc}`}
                          >
                            📄 Phụ lục · {c.soHopDongGoc}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.hoTenNhanVien}</div>
                        <small style={{ color: "#888" }}>{c.maNhanVien}</small>
                      </td>
                      <td>{c.tenPhongBan || "---"}</td>
                      <td>{c.loaiHopDong}</td>
                      <td>
                        <div>
                          {formatDate(c.ngayBatDau)} -{" "}
                          {c.ngayKetThuc
                            ? formatDate(c.ngayKetThuc)
                            : "Vô thời hạn"}
                        </div>
                        {c.isExpiringSoon && (
                          <div className="expiring-warning">⚠️ Sắp hết hạn</div>
                        )}
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
                            <>
                              <button
                                className="icon-btn edit"
                                onClick={() => {
                                  setEditingContract(c);
                                  setPhuLucParent(null);
                                  setIsModalOpen(true);
                                }}
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </button>
                              {c.trangThai === "HieuLuc" && !c.soHopDongGoc && (
                                <button
                                  className="icon-btn appendix"
                                  onClick={() => openPhuLuc(c)}
                                  title="Tạo phụ lục hợp đồng"
                                >
                                  <FaFileSignature />
                                </button>
                              )}
                              <button
                                className="icon-btn delete"
                                onClick={() => handleDelete(c.soHopDong)}
                                title="Vô hiệu hóa (chấm dứt)"
                              >
                                <FaBan />
                              </button>
                            </>
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
            parentContract={phuLucParent}
            employees={employees}
            onSave={handleSave}
            onCancel={() => {
              setIsModalOpen(false);
              setPhuLucParent(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContractManagementPage;
