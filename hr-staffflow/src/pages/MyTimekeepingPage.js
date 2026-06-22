import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { FaChevronLeft, FaChevronRight, FaFileAlt } from "react-icons/fa";
import "../styles/MyTimekeepingPage.css";
import RequestDetailModal from "../components/modals/RequestDetailModal";

const WEEKDAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

const formatTime = (timeStr) => {
  if (!timeStr) return null;
  const d = new Date(timeStr);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
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
        const response = await api.get(`/ChamCong/${employeeId}?year=${year}&month=${month}`);
        const { dailyRecords = [], summaries = {}, requests = [] } = response.data;
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
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build calendar cells (Monday-start)
  const firstDow = new Date(year, month - 1, 1).getDay();
  const startOffset = (firstDow + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Compute late/early counts from records
  let lateCount = 0;
  let earlyCount = 0;
  recordsMap.forEach((rec) => {
    if (rec.ghiChu?.includes("Đi muộn")) lateCount++;
    if (rec.ghiChu?.includes("Về sớm")) earlyCount++;
  });

  const getDayInfo = (day) => {
    const today = new Date();
    const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
    const dow = new Date(year, month - 1, day).getDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;

    const rec = recordsMap.get(day);
    const request = requestsMap.get(day);

    let inTime = null, outTime = null;
    let isLate = false, isEarly = false;
    let ngayCong = null;
    let missingCheckIn = false, missingCheckOut = false;
    let note = "";

    if (rec) {
      ngayCong = rec.ngayCong;
      inTime = rec.gioCheckIn ? formatTime(rec.gioCheckIn) : null;
      outTime = rec.gioCheckOut ? formatTime(rec.gioCheckOut) : null;
      if (rec.ghiChu?.includes("Đi muộn")) isLate = true;
      if (rec.ghiChu?.includes("Về sớm")) isEarly = true;
      missingCheckIn = !rec.gioCheckIn && ngayCong !== null;
      missingCheckOut = rec.gioCheckIn && !rec.gioCheckOut;

      let cleanNote = rec.ghiChu || "";
      cleanNote = cleanNote
        .replace(/Face Check-in/g, "")
        .replace(/\|? *Face Check-out: \d{2}:\d{2}/g, "")
        .replace(/\(Đi muộn\)/g, "")
        .replace(/\(Về sớm\)/g, "")
        .trim();
      note = cleanNote;
    }

    return { isToday, isWeekend, rec, request, inTime, outTime, isLate, isEarly, ngayCong, missingCheckIn, missingCheckOut, note };
  };

  const renderDayCell = (day, idx) => {
    if (!day) return <div key={`empty-${idx}`} className="cal-cell cal-cell--empty" />;

    const { isToday, isWeekend, rec, request, inTime, outTime, isLate, isEarly, ngayCong, missingCheckOut, note } = getDayInfo(day);

    let cellClass = "cal-cell";
    if (isToday) cellClass += " cal-cell--today";
    if (isWeekend) cellClass += " cal-cell--weekend";
    if (request?.trangThai === "Đã duyệt" && (request.loaiDon?.includes("Nghỉ") || request.loaiDon === "Công tác")) {
      cellClass += " cal-cell--leave";
    }

    const requestColor = request
      ? request.trangThai === "Đã duyệt" ? "#16a34a"
        : request.trangThai === "Từ chối" ? "#dc2626"
        : "#d97706"
      : "#2563eb";

    return (
      <div key={day} className={cellClass}>
        <div className="cal-day-number">{day}</div>

        {/* Work schedule */}
        {!isWeekend && (
          <div className="cal-schedule">HC 08:00 - 17:00</div>
        )}

        {/* Check-in / Check-out */}
        {rec && !isWeekend && (
          <div className={`cal-times ${(isLate || isEarly) ? "cal-times--warn" : ""}`}>
            {inTime && outTime
              ? `${inTime} - ${outTime}`
              : inTime
              ? `${inTime} - ??:??`
              : "??:?? - ??:??"}
          </div>
        )}

        {/* Status badges */}
        <div className="cal-badges">
          {isLate && <span className="cal-badge cal-badge--late">Di muộn</span>}
          {isEarly && <span className="cal-badge cal-badge--early">Về sớm</span>}
          {missingCheckOut && !isLate && !isEarly && (
            <span className="cal-badge cal-badge--missing">Thiếu out</span>
          )}
          {ngayCong === 0 && rec && !isWeekend && !request && (
            <span className="cal-badge cal-badge--absent">Vắng</span>
          )}
          {note && !isLate && !isEarly && (
            <span className="cal-badge cal-badge--note" title={note}>{note.length > 10 ? note.slice(0, 10) + "…" : note}</span>
          )}
        </div>

        {/* Request badge */}
        {request && (
          <div
            className="cal-request"
            style={{ borderColor: requestColor, color: requestColor }}
            onClick={() => setViewingRequest(request)}
            title="Bấm để xem chi tiết đơn"
          >
            <FaFileAlt style={{ fontSize: "10px" }} />
            <span>{request.loaiDon}</span>
            {request.trangThai === "Từ chối" && (
              <span className="cal-request--rejected">TC</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="my-timekeeping-view">
      {/* ── HEADER ── */}
      <div className="cal-header">
        <div className="cal-nav">
          <button onClick={() => changeMonth(-1)}><FaChevronLeft /></button>
          <span className="cal-month-label">
            {String(month).padStart(2, "0")}/{year}
          </span>
          <button onClick={() => changeMonth(1)}><FaChevronRight /></button>
          <button className="cal-today-btn" onClick={goToday}>Hôm nay</button>
        </div>
      </div>

      {/* ── SUMMARY BAR ── */}
      <div className="cal-summary-bar">
        <div className="cal-sum-item">
          <span className="cal-sum-value">{summary?.tongCong?.toFixed(2) ?? "0.00"}</span>
          <span className="cal-sum-label">Ngày công</span>
        </div>
        <div className="cal-sum-item">
          <span className="cal-sum-value red">{summary?.nghiKhongPhep ?? 0}</span>
          <span className="cal-sum-label">Vắng</span>
        </div>
        <div className="cal-sum-item">
          <span className="cal-sum-value orange">{lateCount + earlyCount}</span>
          <span className="cal-sum-label">Lần muộn/sớm</span>
        </div>
        <div className="cal-sum-item">
          <span className="cal-sum-value green">{summary?.nghiCoPhep ?? 0}</span>
          <span className="cal-sum-label">Ngày nghỉ phép</span>
        </div>
        <div className="cal-sum-item">
          <span className="cal-sum-value blue">{summary?.lamNuaNgay ?? 0}</span>
          <span className="cal-sum-label">Nửa ngày</span>
        </div>
        <div className="cal-sum-item">
          <span className="cal-sum-value green">{summary?.diLamDu ?? 0}</span>
          <span className="cal-sum-label">Ngày đi đủ</span>
        </div>
      </div>

      {/* ── CALENDAR ── */}
      {loading ? (
        <div className="loading-text">Đang tải dữ liệu...</div>
      ) : (
        <div className="cal-grid-wrap">
          {/* Weekday header */}
          <div className="cal-grid cal-grid--header">
            {WEEKDAYS.map((d) => (
              <div key={d} className={`cal-head-cell${d === "Thứ Bảy" || d === "Chủ Nhật" ? " cal-head-cell--weekend" : ""}`}>
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="cal-grid">
            {cells.map((day, idx) => renderDayCell(day, idx))}
          </div>
        </div>
      )}

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
