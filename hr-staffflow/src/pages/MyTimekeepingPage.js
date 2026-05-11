import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { FaChevronLeft, FaChevronRight, FaFileAlt } from "react-icons/fa";
import "../styles/MyTimekeepingPage.css";
import RequestDetailModal from "../components/modals/RequestDetailModal";

const getDayOfWeek = (year, month, day) => {
  const date = new Date(year, month, day);
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  return days[date.getDay()];
};

const MyTimekeepingPage = () => {
  const { employeeId } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [recordsMap, setRecordsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [requestsMap, setRequestsMap] = useState(new Map());
  const [viewingRequest, setViewingRequest] = useState(null);

  const fetchData = useCallback(
    async (date) => {
      if (!employeeId) return;
      setLoading(true);
      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const response = await api.get(
          `/ChamCong/${employeeId}?year=${year}&month=${month}`,
        );

        const {
          dailyRecords = [],
          summaries = {},
          requests = [],
        } = response.data;
        setSummary(summaries[employeeId] || null);

        const records = new Map();
        dailyRecords.forEach((rec) => {
          const day = parseInt(rec.ngayChamCong.split("-")[2], 10);
          records.set(day, rec);
        });
        setRecordsMap(records);

        const reqMap = new Map();
        requests.forEach((req) => {
          reqMap.set(req.day, req);
        });
        setRequestsMap(reqMap);
      } catch (error) {
        console.error("Lỗi tải dữ liệu chấm công:", error);
      } finally {
        setLoading(false);
      }
    },
    [employeeId],
  );

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const changeMonth = (offset) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getWorkDayStyleAndStatus = (day) => {
    if (recordsMap.has(day)) {
      const record = recordsMap.get(day);
      const ngayCong = record?.ngayCong;
      let className = "";

      if (ngayCong === 1.0)
        className =
          record.ghiChu && !record.ghiChu.includes("Đi muộn")
            ? "status-leave"
            : "status-present";
      else if (ngayCong === 0.5) className = "status-half-day";
      else if (ngayCong === 0.0) className = "status-absent";

      const formatTime = (timeStr) => {
        if (!timeStr) return "--:--";
        const date = new Date(timeStr);
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      };

      let cleanNote = record.ghiChu || "";
      let isLate = false;
      let isEarly = false; // THÊM BIẾN NÀY ĐỂ BẮT VỀ SỚM

      if (cleanNote) {
        if (cleanNote.includes("Đi muộn")) isLate = true;
        if (cleanNote.includes("Về sớm")) isEarly = true; // BẮT TỪ KHÓA

        cleanNote = cleanNote
          .replace(/Face Check-in/g, "")
          .replace(/\|? *Face Check-out: \d{2}:\d{2}/g, "")
          .replace(/\(Đi muộn\)/g, "")
          .replace(/\(Về sớm\)/g, "") // LÀM SẠCH ĐỂ KHÔNG HIỆN CHỮ THỪA
          .trim();
      }

      return {
        ngayCong: ngayCong,
        className: className,
        inTime: record.gioCheckIn ? formatTime(record.gioCheckIn) : null,
        outTime: record.gioCheckOut ? formatTime(record.gioCheckOut) : null,
        isLate: isLate,
        isEarly: isEarly, // TRẢ VỀ RENDER
        note: cleanNote,
      };
    }

    return {
      ngayCong: "",
      className: "",
      inTime: null,
      outTime: null,
      isLate: false,
      isEarly: false,
      note: "",
    };
  };

  return (
    <div className="my-timekeeping-view">
      <div className="timekeeping-header">
        <div className="month-navigator">
          <button onClick={() => changeMonth(-1)}>
            <FaChevronLeft />
          </button>
          <h2>{`Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`}</h2>
          <button onClick={() => changeMonth(1)}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="timekeeping-list">
        <div className="list-header">
          <div className="header-date">Ngày</div>
          <div className="header-status">Trạng thái</div>
        </div>
        {loading ? (
          <div className="loading-text">Đang tải dữ liệu...</div>
        ) : (
          allDays.map((day) => {
            const {
              ngayCong,
              className,
              inTime,
              outTime,
              isLate,
              isEarly,
              note,
            } = getWorkDayStyleAndStatus(day);
            const request = requestsMap.get(day);

            return (
              <div className="day-row" key={day}>
                <div className="date-col">
                  <span className="date-text">{`${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`}</span>
                  <span className="day-of-week-text">
                    {getDayOfWeek(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day,
                    )}
                  </span>
                </div>

                <div
                  className="status-col"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  {ngayCong !== "" && (
                    <span
                      className={className}
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
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
                        gap: "10px",
                        fontSize: "13px",
                        background: "#f3f4f6",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      <span style={{ color: "#10b981", fontWeight: "600" }}>
                        Vào: {inTime || "--:--"}
                      </span>
                      <span style={{ color: "#ef4444", fontWeight: "600" }}>
                        Ra: {outTime || "--:--"}
                      </span>
                    </div>
                  )}

                  {isLate && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "13px",
                        fontStyle: "italic",
                        marginTop: "4px",
                        fontWeight: "500",
                      }}
                    >
                      ⚠️ Đi muộn
                    </span>
                  )}

                  {/* --- HIỂN THỊ CẢNH BÁO VỀ SỚM --- */}
                  {isEarly && (
                    <span
                      style={{
                        color: "#f59e0b",
                        fontSize: "13px",
                        fontStyle: "italic",
                        marginTop: "4px",
                        fontWeight: "500",
                      }}
                    >
                      ⚠️ Về sớm
                    </span>
                  )}

                  {note && (
                    <span
                      className="reason-note"
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      {note}
                    </span>
                  )}

                  {request && (
                    <div
                      onClick={() => setViewingRequest(request)}
                      style={{
                        marginTop: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 8px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        border: "1px dashed #93c5fd",
                      }}
                      title="Bấm để xem chi tiết đơn"
                    >
                      <FaFileAlt /> {request.loaiDon} ({request.trangThai})
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="summary-section">
        <h4>Tổng kết công tháng {currentDate.getMonth() + 1}</h4>
        {summary ? (
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">
                {summary.tongCong?.toFixed(1) || "0.0"}
              </span>
              <span className="summary-label">Tổng công</span>
            </div>
            <div className="summary-item">
              <span className="summary-value green">
                {summary.diLamDu || 0}
              </span>
              <span className="summary-label">Ngày đi đủ</span>
            </div>
            <div className="summary-item">
              <span className="summary-value orange">
                {summary.nghiCoPhep || 0}
              </span>
              <span className="summary-label">Ngày nghỉ phép</span>
            </div>
            <div className="summary-item">
              <span className="summary-value blue">
                {summary.lamNuaNgay || 0}
              </span>
              <span className="summary-label">Ngày làm nửa buổi</span>
            </div>
            <div className="summary-item">
              <span className="summary-value red">
                {summary.nghiKhongPhep || 0}
              </span>
              <span className="summary-label">Ngày vắng</span>
            </div>
          </div>
        ) : (
          <p>Chưa có dữ liệu chấm công cho tháng này.</p>
        )}
      </div>

      {viewingRequest && (
        <RequestDetailModal
          request={viewingRequest}
          onClose={() => setViewingRequest(null)}
        />
      )}
    </div>
  );
};

export default MyTimekeepingPage;
