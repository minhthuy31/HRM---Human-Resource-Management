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
} from "react-icons/fa";
import "../styles/TimekeepingPage.css";
import AttendanceModal from "../components/modals/AttendanceModal";
import BulkEditModal from "../components/modals/BulkEditModal";

// --- Custom Confirm Modal ---
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

  // --- TOAST STATE ---
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

  // --- CONFIRM MODAL STATE ---
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

        const empRes = await api.get("/NhanVien?TrangThai=true");
        setEmployees(empRes.data || []);

        const attendanceRes = await api.get(
          `/ChamCong?year=${year}&month=${month}`,
        );

        const {
          dailyRecords = [],
          summaries: summaryData = {},
          isLocked: lockedStatus = false,
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
              if (!attendanceMap[rec.maNhanVien]) {
                attendanceMap[rec.maNhanVien] = {};
              }
              attendanceMap[rec.maNhanVien][dateKey] = rec;
            }
          });
        }
        setAttendance(attendanceMap);
      } catch (error) {
        console.error("Lỗi:", error);
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

  const employeeIds = employees.map((emp) => emp.maNhanVien);

  const getWorkDayStyle = (record) => {
    if (!record)
      return {
        ngayCong: "",
        className: "",
        inTime: null,
        outTime: null,
        isLate: false,
        note: "",
      };

    const ngayCong = record.ngayCong;
    let className = "";

    if (ngayCong === 1.0) {
      className =
        record.ghiChu &&
        !record.ghiChu.includes("Đi muộn") &&
        !record.ghiChu.includes("Check-in")
          ? "status-leave"
          : "status-present";
    } else if (ngayCong === 0.5) className = "status-half-day";
    else if (ngayCong === 0.0 && record.gioCheckIn)
      className = "status-present";
    else if (ngayCong === 0.0) className = "status-absent";

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

    if (cleanNote) {
      if (cleanNote.includes("Đi muộn")) isLate = true;
      cleanNote = cleanNote
        .replace(/Check-in qua QR/gi, "")
        .replace(/Face Check-in/gi, "")
        .replace(/\|? *Face Check-out: \d{2}:\d{2}/gi, "")
        .replace(/Check-in: \d{2}:\d{2} \| Check-out: \d{2}:\d{2}/gi, "")
        .replace(/\(Đi muộn\)/gi, "")
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
    const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
      editingCell.day,
    ).padStart(2, "0")}`;

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
      const formattedDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

        {/* TOAST COMPONENT FOR DENIED STATE */}
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
            <h2>{`Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`}</h2>
            <button onClick={() => changeMonth(1)}>
              <FaChevronRight />
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                  {daysArray.map((day) => (
                    <th
                      key={day}
                      className={`day-header ${
                        selection.type === "column" && selection.id === day
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleSelectColumn(day)}
                      style={{ cursor: canEdit ? "pointer" : "default" }}
                    >
                      {day}
                    </th>
                  ))}
                  <th className="summary-col">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => {
                    const empId = emp.maNhanVien;
                    const summary = summaries[empId] || {};

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
                          const {
                            ngayCong,
                            className,
                            inTime,
                            outTime,
                            isLate,
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
                              }}
                            >
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
                        <td className="summary-col">
                          <strong>
                            {summary?.tongCong !== undefined
                              ? summary.tongCong.toFixed(1)
                              : "0.0"}
                          </strong>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={daysInMonth + 2}
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

      {/* --- CONFIRM MODAL --- */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* --- TOAST COMPONENT --- */}
      <div
        className={`toast-notification ${toast.type} ${toast.visible ? "show" : ""}`}
      >
        {toast.message}
      </div>
    </DashboardLayout>
  );
};

export default TimekeepingPage;
