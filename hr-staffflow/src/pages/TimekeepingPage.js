import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../api";
import { getUserFromToken } from "../utils/auth";
import {
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaUnlock,
  FaBan,
  FaFileAlt,
  FaFileExcel,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "../styles/TimekeepingPage.css";
import AttendanceModal from "../components/modals/AttendanceModal";
import BulkEditModal from "../components/modals/BulkEditModal";
import RequestDetailModal from "../components/modals/RequestDetailModal";

// --- Searchable combobox ---
const SearchableSelect = ({ options, value, onChange, placeholder, labelKey = "label", valueKey = "value" }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o[labelKey]?.toLowerCase().includes(search.toLowerCase())
  );
  const selectedLabel = options.find((o) => o[valueKey] === value)?.[labelKey] || "";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: "180px" }}>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          border: "1px solid #d1d5db", borderRadius: "6px", padding: "7px 10px",
          cursor: "pointer", background: "#fff", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          fontSize: "14px", color: selectedLabel ? "#111" : "#9ca3af",
          userSelect: "none",
        }}
      >
        <span>{selectedLabel || placeholder}</span>
        <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #d1d5db", borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1100,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            onClick={(e) => e.stopPropagation()}
            style={{
              border: "none", borderBottom: "1px solid #e5e7eb",
              padding: "8px 10px", fontSize: "13px", outline: "none",
            }}
          />
          <div style={{ overflowY: "auto", maxHeight: "220px" }}>
            <div
              onMouseDown={() => { onChange(""); setSearch(""); setOpen(false); }}
              style={{ padding: "8px 10px", cursor: "pointer", fontSize: "13px", color: "#6b7280" }}
            >
              {placeholder}
            </div>
            {filtered.map((opt) => (
              <div
                key={opt[valueKey]}
                onMouseDown={() => { onChange(opt[valueKey]); setSearch(""); setOpen(false); }}
                style={{
                  padding: "8px 10px", cursor: "pointer", fontSize: "13px",
                  background: value === opt[valueKey] ? "#eff6ff" : "transparent",
                  color: value === opt[valueKey] ? "#2563eb" : "#111",
                }}
              >
                {opt[labelKey]}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "8px 10px", color: "#9ca3af", fontSize: "13px" }}>Không tìm thấy</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-confirm-modal">
        <h3 className="confirm-title">Xác nhận</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn-accept" onClick={onConfirm}>
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

const TimekeepingPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [employees, setEmployees] = useState([]);
  const [phongBans, setPhongBans] = useState([]);
  const [filterPhongBan, setFilterPhongBan] = useState("");
  const [filterNhanVien, setFilterNhanVien] = useState("");
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [editingCell, setEditingCell] = useState(null);
  const [selection, setSelection] = useState({ type: null, id: null });
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [endCell, setEndCell] = useState(null);
  const [bulkEditData, setBulkEditData] = useState(null);

  const user = getUserFromToken();
  const userRole = user?.role || user?.Role || "";

  const canEdit =
    ["Nhân sự trưởng", "Giám đốc", "Tổng giám đốc", "Trưởng phòng"].includes(
      userRole,
    ) && !isLocked;
  const canLock = ["Nhân sự trưởng", "Giám đốc", "Tổng giám đốc"].includes(
    userRole,
  );

  const [requestsMap, setRequestsMap] = useState({});
  const [viewingRequest, setViewingRequest] = useState(null);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
  };

  const fetchData = useCallback(
    async (date) => {
      setLoading(true);
      setPermissionDenied(false);
      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const [empRes, pbRes] = await Promise.all([
          api.get("/NhanVien?TrangThai=true"),
          api.get("/PhongBan"),
        ]);

        // Chỉ hiện NV đã vào làm trong/trước tháng đang xem
        // null ngayVaoLam: không hiện ở tháng cũ, chỉ hiện tháng hiện tại trở về sau
        const now = new Date();
        const isViewingPastMonth = monthEnd <= new Date(now.getFullYear(), now.getMonth(), 1);
        const filteredByMonth = (empRes.data || []).filter((emp) => {
          if (!emp.ngayVaoLam) return !isViewingPastMonth;
          return new Date(emp.ngayVaoLam) < monthEnd;
        });
        setEmployees(filteredByMonth);
        setPhongBans(pbRes.data?.filter((pb) => pb.trangThai) || []);

        const attendanceRes = await api.get(
          `/ChamCong?year=${year}&month=${month}`,
        );

        const {
          dailyRecords = [],
          summaries: summaryData = {},
          isLocked: lockedStatus = false,
          requests = [],
        } = attendanceRes.data;

        setSummaries(summaryData);
        setIsLocked(lockedStatus);

        const attendanceMap = {};
        if (dailyRecords.length > 0) {
          dailyRecords.forEach((rec) => {
            const dateString = rec.ngayChamCong.split("T")[0];
            const dateParts = dateString.split("-");
            if (dateParts.length === 3) {
              const dateKey = parseInt(dateParts[2], 10);
              if (!attendanceMap[rec.maNhanVien])
                attendanceMap[rec.maNhanVien] = {};
              attendanceMap[rec.maNhanVien][dateKey] = rec;
            }
          });
        }
        setAttendance(attendanceMap);

        const reqMap = {};
        if (requests.length > 0) {
          requests.forEach((req) => {
            if (!reqMap[req.maNhanVien]) reqMap[req.maNhanVien] = {};
            reqMap[req.maNhanVien][req.day] = req;
          });
        }
        setRequestsMap(reqMap);
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          setPermissionDenied(true);
          showToast("Bạn không có quyền xem bảng công tổng hợp.", "error");
        } else {
          showToast("Lỗi khi tải dữ liệu chấm công.", "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const changeMonth = (offset) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Nhân viên sau khi lọc
  const filteredEmployees = employees.filter((emp) => {
    if (filterPhongBan && emp.maPhongBan !== filterPhongBan) return false;
    if (filterNhanVien && emp.maNhanVien !== filterNhanVien) return false;
    return true;
  });

  // Danh sách NV cho dropdown lọc (nếu đã chọn phòng ban thì chỉ show NV phòng đó)
  const nvOptions = (filterPhongBan
    ? employees.filter((e) => e.maPhongBan === filterPhongBan)
    : employees
  ).map((e) => ({ value: e.maNhanVien, label: `${e.hoTen} (${e.maNhanVien})` }));

  const pbOptions = phongBans.map((pb) => ({ value: pb.maPhongBan, label: pb.tenPhongBan }));

  const employeeIds = filteredEmployees.map((emp) => emp.maNhanVien);

  const getWorkDayStyle = (record) => {
    if (!record)
      return {
        ngayCong: "",
        className: "",
        inTime: null,
        outTime: null,
        isLate: false,
        isEarly: false,
        note: "",
      };

    const ngayCong = record.ngayCong;
    let className = "";

    if (ngayCong >= 1.0) {
      className =
        record.ghiChu &&
        !record.ghiChu.includes("Đi muộn") &&
        !record.ghiChu.includes("Check-in")
          ? "status-leave"
          : "status-present";
    } else if (ngayCong > 0 && ngayCong < 1.0) {
      className = "status-half-day";
    } else if (ngayCong === 0.0 && record.gioCheckIn) {
      className = "status-present";
    } else if (ngayCong === 0.0) {
      className = "status-absent";
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return null;
      try {
        return new Date(timeStr).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch (e) {
        return null;
      }
    };

    let cleanNote = record.ghiChu || "";
    let isLate = false;
    let isEarly = false; 

    if (cleanNote) {
      if (cleanNote.includes("Đi muộn")) isLate = true;
      if (cleanNote.includes("Về sớm")) isEarly = true; 

      cleanNote = cleanNote
        .replace(/Check-in qua QR/gi, "")
        .replace(/Face Check-in/gi, "")
        .replace(/\|? *Face Check-out: \d{2}:\d{2}/gi, "")
        .replace(/Check-in: \d{2}:\d{2} \| Check-out: \d{2}:\d{2}/gi, "")
        .replace(/\(Đi muộn\)/gi, "")
        .replace(/\(Về sớm\)/gi, "") 
        .trim();

      if (cleanNote.startsWith("|")) cleanNote = cleanNote.substring(1).trim();
      if (cleanNote.endsWith("|")) cleanNote = cleanNote.slice(0, -1).trim();
    }

    return {
      ngayCong: ngayCong,
      className: className,
      inTime: formatTime(record.gioCheckIn),
      outTime: formatTime(record.gioCheckOut),
      isLate: isLate,
      isEarly: isEarly, 
      note: cleanNote,
    };
  };

  const clearSelections = () => {
    setSelection({ type: null, id: null });
    setIsDragging(false);
    setStartCell(null);
    setEndCell(null);
    document.body.style.userSelect = "auto";
  };

  const handleCellClick = (maNhanVien, day) => {
    if (!canEdit) {
      if (isLocked) showToast("Bảng công tháng này đã bị khóa.", "warning");
      return;
    }
    const record = attendance[maNhanVien]?.[day] || {};
    setEditingCell({
      maNhanVien,
      day,
      ngayCong: record.ngayCong !== undefined ? record.ngayCong : 1.0,
      ghiChu: record.ghiChu || "",
    });
  };

  const handleMouseDown = (maNhanVien, day) => {
    if (!canEdit) return;
    clearSelections();
    setIsDragging(true);
    setStartCell({ maNhanVien, day });
    setEndCell({ maNhanVien, day });
    document.body.style.userSelect = "none";
  };

  const handleMouseEnter = (maNhanVien, day) => {
    if (isDragging) setEndCell({ maNhanVien, day });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      if (
        startCell &&
        endCell &&
        (startCell.maNhanVien !== endCell.maNhanVien ||
          startCell.day !== endCell.day)
      ) {
        setBulkEditData({ type: "range", start: startCell, end: endCell });
      }
      setIsDragging(false);
    }
    document.body.style.userSelect = "auto";
  };

  const handleSelectRow = (id) => {
    if (canEdit) {
      clearSelections();
      setSelection({ type: "row", id });
      setBulkEditData({ type: "row", id });
    }
  };

  const handleSelectColumn = (id) => {
    if (canEdit) {
      clearSelections();
      setSelection({ type: "column", id });
      setBulkEditData({ type: "column", id });
    }
  };

  const isCellSelected = (maNhanVien, day) => {
    if (selection.type === "row" && selection.id === maNhanVien) return true;
    if (selection.type === "column" && selection.id === day) return true;
    if (!isDragging || !startCell || !endCell) return false;

    const startRow = employeeIds.indexOf(startCell.maNhanVien);
    const endRow = employeeIds.indexOf(endCell.maNhanVien);
    const startCol = startCell.day;
    const endCol = endCell.day;
    const currentRow = employeeIds.indexOf(maNhanVien);
    const currentCol = day;

    return (
      currentRow >= Math.min(startRow, endRow) &&
      currentRow <= Math.max(startRow, endRow) &&
      currentCol >= Math.min(startCol, endCol) &&
      currentCol <= Math.max(startCol, endCol)
    );
  };

  const handleSave = async (editData) => {
    if (!editingCell || !canEdit) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(editingCell.day).padStart(2, "0")}`;

    try {
      await api.post("/ChamCong/upsert", {
        maNhanVien: editingCell.maNhanVien,
        ngayChamCong: formattedDate,
        ngayCong: parseFloat(editData.ngayCong),
        ghiChu: editData.ghiChu,
        onlyIfEmpty: false,
      });
      setEditingCell(null);
      showToast("Đã cập nhật công thành công!", "success");
      fetchData(currentDate);
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          error.response?.data ||
          "Lỗi lưu dữ liệu.",
        "error",
      );
    }
  };

  const handleBulkSave = async (dataToSave) => {
    if (!bulkEditData || !canEdit) return;
    const promises = [];
    const { type, id, start, end } = bulkEditData;
    let cellsToUpdate = [];

    if (type === "row") {
      daysArray.forEach((day) => cellsToUpdate.push({ maNhanVien: id, day }));
    } else if (type === "column") {
      employeeIds.forEach((empId) =>
        cellsToUpdate.push({ maNhanVien: empId, day: id }),
      );
    } else if (type === "range") {
      const startRow = employeeIds.indexOf(start.maNhanVien);
      const endRow = employeeIds.indexOf(end.maNhanVien);
      const startCol = start.day;
      const endCol = end.day;
      for (
        let r = Math.min(startRow, endRow);
        r <= Math.max(startRow, endRow);
        r++
      ) {
        for (
          let c = Math.min(startCol, endCol);
          c <= Math.max(startCol, endCol);
          c++
        ) {
          cellsToUpdate.push({ maNhanVien: employeeIds[r], day: c });
        }
      }
    }

    cellsToUpdate.forEach(({ maNhanVien, day }) => {
      const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const hasData = attendance[maNhanVien] && attendance[maNhanVien][day];
      if (hasData) return;

      promises.push(
        api.post("/ChamCong/upsert", {
          maNhanVien,
          ngayChamCong: formattedDate,
          ...dataToSave,
          onlyIfEmpty: true,
        }),
      );
    });

    try {
      if (promises.length === 0) {
        showToast(
          "Không có ô trống nào cần điền trong vùng đã chọn.",
          "warning",
        );
      } else {
        await Promise.all(promises);
        showToast(
          `Đã điền thành công cho ${promises.length} ô trống.`,
          "success",
        );
      }
    } catch (error) {
      showToast("Có lỗi xảy ra (Có thể do mạng hoặc quyền hạn).", "error");
    } finally {
      setBulkEditData(null);
      clearSelections();
      fetchData(currentDate);
    }
  };

  const handleLockAction = async (lockStatus) => {
    const actionText = lockStatus ? "KHÓA" : "HỦY KHÓA";
    setConfirmDialog({
      isOpen: true,
      message: `Bạn có chắc muốn ${actionText} bảng công tháng này?`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.post("/ChamCong/lock-action", {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            isLocked: lockStatus,
          });
          showToast(
            `Đã ${actionText.toLowerCase()} bảng công thành công!`,
            "success",
          );
          fetchData(currentDate);
        } catch (e) {
          showToast(
            e.response?.data || `Lỗi khi ${actionText.toLowerCase()} công.`,
            "error",
          );
        }
      },
    });
  };

  // Công chuẩn tháng (T2-T6, không tính ngày lễ từ backend — dùng để hiển thị)
  const soCongChuanThang = daysArray.filter((day) => {
    const dow = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
    return dow !== 0 && dow !== 6;
  }).length;

  const handleExportExcel = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dowLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    const headers = [
      "STT", "Nhân viên", "Mã NV", "Phòng ban",
      ...daysArray.map((day) => {
        const dow = new Date(year, month - 1, day).getDay();
        return `${day}(${dowLabels[dow]})`;
      }),
      "Tổng công", "Nghỉ CP", "Nghỉ KP", "OT (h)", "Đi muộn",
    ];

    const pbMap = {};
    phongBans.forEach((pb) => (pbMap[pb.maPhongBan] = pb.tenPhongBan));

    const rows = filteredEmployees.map((emp, idx) => {
      const empId = emp.maNhanVien;
      const summary = summaries[empId] || {};
      let muon = 0;

      const dayCells = daysArray.map((day) => {
        const rec = attendance[empId]?.[day];
        if (!rec) return "";
        if (rec.ghiChu?.includes("Đi muộn")) muon++;
        return rec.ngayCong !== undefined ? rec.ngayCong : "";
      });

      return [
        idx + 1,
        emp.hoTen,
        empId,
        pbMap[emp.maPhongBan] || emp.maPhongBan || "",
        ...dayCells,
        Number(summary.tongCong ?? 0).toFixed(2),
        summary.nghiCoPhep ?? 0,
        summary.nghiKhongPhep ?? 0,
        Number(summary.tongGioOT ?? 0).toFixed(1),
        muon,
      ];
    });

    const wsData = [
      [`BẢNG CHẤM CÔNG THÁNG ${month}/${year} (Công chuẩn: ${soCongChuanThang} ngày)`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    ws["!cols"] = [
      { wch: 5 }, { wch: 22 }, { wch: 10 }, { wch: 18 },
      ...daysArray.map(() => ({ wch: 7 })),
      { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `CC_T${month}_${year}`);

    try {
      // Tải file bằng Blob (ổn định hơn XLSX.writeFile trên trình duyệt)
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BangChamCong_T${String(month).padStart(2, "0")}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Lỗi xuất Excel:", e);
      alert("Lỗi xuất Excel: " + (e?.message || e));
    }
  };

  if (permissionDenied) {
    return (
      <DashboardLayout>
        <div
          className="timekeeping-page"
          style={{ textAlign: "center", paddingTop: "50px" }}
        >
          <FaBan size={50} color="#ef4444" style={{ marginBottom: "20px" }} />
          <h2 style={{ color: "#ef4444" }}>Truy cập bị từ chối</h2>
          <p>Bạn không có quyền xem bảng công tổng hợp.</p>
        </div>
        <div
          className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
        >
          {toast.message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="timekeeping-page">
        <div className="timekeeping-header">
          <div className="month-navigator">
            <button onClick={() => changeMonth(-1)}>
              <FaChevronLeft />
            </button>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: 0 }}>{`Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`}</h2>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Công chuẩn: {soCongChuanThang} ngày</span>
            </div>
            <button onClick={() => changeMonth(1)}>
              <FaChevronRight />
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: "#16a34a", color: "white",
                padding: "8px 16px", borderRadius: "4px", border: "none",
                display: "flex", alignItems: "center", gap: "6px",
                cursor: "pointer", fontWeight: "500",
              }}
            >
              <FaFileExcel /> Xuất Excel
            </button>
            {isLocked && (
              <span
                style={{
                  color: "#e11d48",
                  fontWeight: "bold",
                  border: "1px solid #e11d48",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  backgroundColor: "#fff1f2",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "14px",
                }}
              >
                <FaLock size={12} /> ĐÃ KHÓA
              </span>
            )}
            {canLock && (
              <>
                {!isLocked ? (
                  <button
                    onClick={() => handleLockAction(true)}
                    style={{
                      backgroundColor: "#e11d48",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <FaLock /> Khóa công
                  </button>
                ) : (
                  <button
                    onClick={() => handleLockAction(false)}
                    style={{
                      backgroundColor: "#10b981",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <FaUnlock /> Hủy khóa
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* --- BỘ LỌC --- */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
          <SearchableSelect
            options={pbOptions}
            value={filterPhongBan}
            onChange={(val) => { setFilterPhongBan(val); setFilterNhanVien(""); }}
            placeholder="-- Tất cả phòng ban --"
            valueKey="value"
            labelKey="label"
          />
          <SearchableSelect
            options={nvOptions}
            value={filterNhanVien}
            onChange={setFilterNhanVien}
            placeholder="-- Tất cả nhân viên --"
            valueKey="value"
            labelKey="label"
          />
          {(filterPhongBan || filterNhanVien) && (
            <button
              onClick={() => { setFilterPhongBan(""); setFilterNhanVien(""); }}
              style={{
                padding: "7px 12px", fontSize: "13px", cursor: "pointer",
                border: "1px solid #d1d5db", borderRadius: "6px",
                background: "#f9fafb", color: "#6b7280",
              }}
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div
          className="timekeeping-table-container"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading ? (
            <p style={{ padding: "20px" }}>Đang tải...</p>
          ) : (
            <table className="timekeeping-table">
              <thead>
                <tr>
                  <th className="employee-name-col">Nhân viên</th>
                  {daysArray.map((day) => {
                    const dow = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    const dowLabel = ["CN","T2","T3","T4","T5","T6","T7"][dow];
                    return (
                      <th
                        key={day}
                        className={`day-header ${selection.type === "column" && selection.id === day ? "selected" : ""}`}
                        onClick={() => handleSelectColumn(day)}
                        style={{ cursor: canEdit ? "pointer" : "default", color: isWeekend ? "#dc2626" : undefined }}
                      >
                        <div>{day}</div>
                        <div style={{ fontSize: "10px", fontWeight: "normal" }}>{dowLabel}</div>
                      </th>
                    );
                  })}
                  <th className="summary-col" style={{ minWidth: "60px" }}>Tổng<br/><span style={{fontSize:"10px",fontWeight:"normal"}}>công</span></th>
                  <th className="summary-col" style={{ minWidth: "50px" }}>Nghỉ<br/><span style={{fontSize:"10px",fontWeight:"normal",color:"#16a34a"}}>CP</span></th>
                  <th className="summary-col" style={{ minWidth: "50px" }}>Nghỉ<br/><span style={{fontSize:"10px",fontWeight:"normal",color:"#dc2626"}}>KP</span></th>
                  <th className="summary-col" style={{ minWidth: "50px" }}>OT<br/><span style={{fontSize:"10px",fontWeight:"normal",color:"#7c3aed"}}>(h)</span></th>
                  <th className="summary-col" style={{ minWidth: "50px" }}>Đi<br/><span style={{fontSize:"10px",fontWeight:"normal",color:"#f59e0b"}}>muộn</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const empId = emp.maNhanVien;
                    const summary = summaries[empId] || {};
                    const muonCount = Object.values(attendance[empId] || {}).filter(
                      (r) => r?.ghiChu?.includes("Đi muộn")
                    ).length;
                    return (
                      <tr key={empId}>
                        <td
                          className="employee-name-col"
                          onClick={() => handleSelectRow(empId)}
                          style={{ cursor: canEdit ? "pointer" : "default" }}
                        >
                          <div className="employee-info">
                            <span
                              className="font-bold"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {emp.hoTen}
                            </span>
                            <br />
                            <span style={{ color: "#888", fontSize: "12px" }}>
                              {empId}
                            </span>
                          </div>
                        </td>
                        {daysArray.map((day) => {
                          const record = attendance[empId]?.[day] || null;
                          const request = requestsMap[empId]?.[day] || null;
                          const {
                            ngayCong,
                            className,
                            inTime,
                            outTime,
                            isLate,
                            isEarly,
                            note,
                          } = getWorkDayStyle(record);
                          const selected = isCellSelected(empId, day);

                          return (
                            <td
                              key={day}
                              className={`attendance-cell ${className} ${selected ? "selected" : ""}`}
                              onMouseDown={() => handleMouseDown(empId, day)}
                              onMouseEnter={() => handleMouseEnter(empId, day)}
                              onClick={() => handleCellClick(empId, day)}
                              style={{
                                cursor: canEdit ? "pointer" : "default",
                                verticalAlign: "top",
                                padding: "8px 4px",
                                position: "relative",
                              }}
                            >
                              {request && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingRequest(request);
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: "2px",
                                    right: "4px",
                                    color: "#2563eb",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                  }}
                                  title={`Xem chi tiết đơn ${request.loaiDon}`}
                                >
                                  <FaFileAlt />
                                </div>
                              )}
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  width: "100%",
                                }}
                              >
                                {ngayCong !== "" && (
                                  <span
                                    style={{
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    {ngayCong}
                                  </span>
                                )}
                                {(inTime || outTime) && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      fontSize: "10px",
                                      lineHeight: "1.3",
                                      textAlign: "center",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#10b981",
                                        fontWeight: "600",
                                      }}
                                    >
                                      V: {inTime || "--"}
                                    </span>
                                    <span
                                      style={{
                                        color: "#ef4444",
                                        fontWeight: "600",
                                      }}
                                    >
                                      R: {outTime || "--"}
                                    </span>
                                  </div>
                                )}
                                {isLate && (
                                  <span
                                    style={{
                                      color: "#ef4444",
                                      fontSize: "10px",
                                      fontStyle: "italic",
                                      fontWeight: "600",
                                    }}
                                  >
                                    ⚠️ Muộn
                                  </span>
                                )}
                                {isEarly && (
                                  <span
                                    style={{
                                      color: "#f59e0b",
                                      fontSize: "10px",
                                      fontStyle: "italic",
                                      fontWeight: "600",
                                    }}
                                  >
                                    ⚠️ Về sớm
                                  </span>
                                )}
                                {note && (
                                  <span
                                    className="reason-note"
                                    style={{
                                      fontSize: "10px",
                                      color: "#6b7280",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {note}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="summary-col" style={{ textAlign: "center" }}>
                          <strong style={{ color: "#0369a1", fontSize: "15px" }}>
                            {Number(summary?.tongCong ?? 0).toFixed(1)}
                          </strong>
                        </td>
                        <td className="summary-col" style={{ textAlign: "center", color: "#16a34a", fontWeight: "600" }}>
                          {summary?.nghiCoPhep ?? 0}
                        </td>
                        <td className="summary-col" style={{ textAlign: "center", color: "#dc2626", fontWeight: "600" }}>
                          {summary?.nghiKhongPhep ?? 0}
                        </td>
                        <td className="summary-col" style={{ textAlign: "center", color: "#7c3aed", fontWeight: "600" }}>
                          {Number(summary?.tongGioOT ?? 0).toFixed(1)}
                        </td>
                        <td className="summary-col" style={{ textAlign: "center", color: muonCount > 0 ? "#f59e0b" : "#9ca3af", fontWeight: "600" }}>
                          {muonCount > 0 ? muonCount : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={daysInMonth + 6}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Không có dữ liệu nhân viên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editingCell && (
        <AttendanceModal
          cellData={editingCell}
          onSave={handleSave}
          onCancel={() => setEditingCell(null)}
          remainingLeave={summaries[editingCell.maNhanVien]?.remainingLeaveDays}
        />
      )}
      {bulkEditData && (
        <BulkEditModal
          onSave={handleBulkSave}
          onCancel={() => {
            setBulkEditData(null);
            clearSelections();
          }}
        />
      )}
      {viewingRequest && (
        <RequestDetailModal
          request={viewingRequest}
          onClose={() => setViewingRequest(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
      <div
        className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
      >
        {toast.message}
      </div>
    </DashboardLayout>
  );
};

export default TimekeepingPage;