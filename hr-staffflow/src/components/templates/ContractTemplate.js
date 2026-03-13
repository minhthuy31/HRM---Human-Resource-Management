import React from "react";
import { FaPrint, FaTimes, FaFileContract } from "react-icons/fa";
import "../../styles/ContractTemplate.css";

// Thêm prop 'director' vào danh sách nhận props
const ContractTemplate = ({ data, director, onClose }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (d) => {
    if (!d) return "...../...../.......";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "...../...../.......";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const formatMoney = (val) =>
    val ? new Intl.NumberFormat("vi-VN").format(val) : "................";

  // --- Helper lấy dữ liệu an toàn (xử lý chữ Hoa/Thường của API) ---
  const getDirectorName = () =>
    director?.HoTen || director?.hoTen || "CHƯA CẬP NHẬT";
  const getDirectorPosition = () =>
    director?.TenChucVu || director?.tenChucVu || "Giám đốc"; // Lấy chức vụ động
  const getDirectorSign = () => director?.ChuKy || director?.chuKy;

  return (
    <div className="contract-preview-overlay">
      <div className="preview-toolbar">
        <div className="preview-title">
          <FaFileContract style={{ marginRight: "10px" }} />
          Hợp đồng số: <strong>{data.soHopDong || data.SoHopDong}</strong>
        </div>
        <div className="toolbar-actions">
          <button className="btn-action btn-print" onClick={handlePrint}>
            <FaPrint /> In Hợp Đồng
          </button>
          <button className="btn-action btn-close" onClick={onClose}>
            <FaTimes /> Đóng
          </button>
        </div>
      </div>

      <div className="preview-content-scroll">
        <div className="contract-paper">
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div style={{ textAlign: "center", width: "45%" }}>
              <div
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11pt",
                }}
              >
                CÔNG TY CÔNG NGHỆ XYZ
              </div>
              <div style={{ fontSize: "11pt" }}>
                Số: {data.soHopDong || data.SoHopDong}
              </div>
            </div>
            <div style={{ textAlign: "center", width: "55%" }}>
              <div
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11pt",
                }}
              >
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  borderBottom: "1px solid black",
                  display: "inline-block",
                  paddingBottom: "3px",
                  fontSize: "11pt",
                }}
              >
                Độc lập – Tự do – Hạnh phúc
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1
              style={{ fontSize: "18pt", fontWeight: "bold", margin: "15px 0" }}
            >
              HỢP ĐỒNG LAO ĐỘNG
            </h1>
          </div>

          <div
            style={{
              fontStyle: "italic",
              marginBottom: "15px",
              paddingLeft: "20px",
              fontSize: "11pt",
            }}
          >
            <div>- Căn cứ Bộ luật Lao động nước CHXHCN Việt Nam;</div>
            <div>- Căn cứ vào nhu cầu và khả năng của Các Bên.</div>
          </div>

          <div style={{ marginBottom: "15px", fontSize: "11pt" }}>
            Hôm nay, ngày {currentDay} tháng {currentMonth} năm {currentYear},
            tại Văn phòng Công ty XYZ, chúng tôi gồm có:
          </div>

          {/* --- BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG) - ĐÃ CẬP NHẬT DỮ LIỆU ĐỘNG --- */}
          <div className="c-section">
            <div style={{ fontWeight: "bold", fontSize: "11pt" }}>
              BÊN A (Người sử dụng lao động): CÔNG TY CÔNG NGHỆ XYZ
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "5px",
                fontSize: "11pt",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "140px" }}>Đại diện</td>
                  <td>
                    : <strong>Ông/Bà {getDirectorName().toUpperCase()}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Chức vụ</td>
                  {/* Hiển thị chức vụ lấy từ API (VD: Tổng Giám Đốc) */}
                  <td>: {getDirectorPosition()}</td>
                </tr>
                <tr>
                  <td>Địa chỉ</td>
                  <td>: Tầng 10, Tòa nhà Landmark, TP. Hồ Chí Minh</td>
                </tr>
                <tr>
                  <td>Điện thoại</td>
                  <td>: 028.9999.8888</td>
                </tr>
              </tbody>
            </table>
            <div
              style={{
                fontStyle: "italic",
                marginTop: "5px",
                fontSize: "10pt",
              }}
            >
              (Sau đây gọi tắt là “Công ty”)
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              margin: "10px 0",
              fontWeight: "bold",
            }}
          >
            VÀ
          </div>

          {/* BÊN B (NGƯỜI LAO ĐỘNG) */}
          <div className="c-section">
            <div style={{ fontWeight: "bold", fontSize: "11pt" }}>
              BÊN B (Người lao động): Ông/Bà{" "}
              {(data.HoTenNhanVien || data.hoTenNhanVien || "").toUpperCase()}
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "5px",
                fontSize: "11pt",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "140px" }}>Ngày sinh</td>
                  <td>: {formatDate(data.NgaySinh || data.ngaySinh)}</td>
                </tr>
                <tr>
                  <td>Số CCCD/CMND</td>
                  <td>
                    :{" "}
                    <strong>
                      {data.CCCD || data.cccd || "...................."}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>Địa chỉ thường trú</td>
                  <td>
                    : {data.DiaChi || data.diaChi || "...................."}
                  </td>
                </tr>
                <tr>
                  <td>Điện thoại</td>
                  <td>
                    :{" "}
                    {data.SoDienThoai ||
                      data.soDienThoai ||
                      "...................."}
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              style={{
                fontStyle: "italic",
                marginTop: "5px",
                fontSize: "10pt",
              }}
            >
              (Sau đây gọi tắt là “Người lao động”)
            </div>
          </div>

          <div style={{ margin: "15px 0", fontSize: "11pt" }}>
            Hai bên thỏa thuận ký kết hợp đồng lao động và cam kết thực hiện
            đúng những điều khoản sau đây:
          </div>

          {/* NỘI DUNG ĐIỀU KHOẢN (Giữ nguyên) */}
          <div
            className="c-article"
            style={{ marginBottom: "15px", fontSize: "11pt" }}
          >
            <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
              Điều 1: Thời hạn và công việc
            </div>
            <div>
              <strong>1.1. Loại hợp đồng:</strong>{" "}
              {data.LoaiHopDong || data.loaiHopDong}.
            </div>
            <div>
              <strong>1.2. Thời hạn:</strong> Từ ngày{" "}
              {formatDate(data.NgayBatDau || data.ngayBatDau)}
              {data.NgayKetThuc || data.ngayKetThuc
                ? ` đến ngày ${formatDate(data.NgayKetThuc || data.ngayKetThuc)}`
                : " (Vô thời hạn)"}
              .
            </div>
            <div>
              <strong>1.3. Đơn vị công tác:</strong>{" "}
              {data.TenPhongBan || data.tenPhongBan || "...................."}.
            </div>
            <div>
              <strong>1.4. Chức vụ/Vị trí:</strong>{" "}
              {data.TenChucVu || data.tenChucVu || "Nhân viên"}.
            </div>
            <div>
              <strong>1.5. Công việc phải làm:</strong> Thực hiện các công việc
              theo bản mô tả công việc và phân công của quản lý trực tiếp.
            </div>
          </div>

          <div
            className="c-article"
            style={{ marginBottom: "15px", fontSize: "11pt" }}
          >
            <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
              Điều 2: Chế độ làm việc
            </div>
            <div>- Thời gian làm việc: 8 giờ/ngày, từ thứ Hai đến thứ Sáu.</div>
            <div>- Được trang bị đầy đủ dụng cụ làm việc cần thiết.</div>
          </div>

          <div
            className="c-article"
            style={{ marginBottom: "15px", fontSize: "11pt" }}
          >
            <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
              Điều 3: Nghĩa vụ và quyền lợi
            </div>
            <div style={{ fontWeight: "bold", marginTop: "5px" }}>
              3.1. Quyền lợi:
            </div>
            <div style={{ paddingLeft: "20px" }}>
              - Mức lương chính:{" "}
              <strong>
                {formatMoney(data.LuongCoBan || data.luongCoBan)} VNĐ/tháng
              </strong>
              .
              <br />- Phụ cấp và thưởng: Theo quy chế của Công ty.
              <br />- Được đóng BHXH, BHYT, BHTN theo quy định của pháp luật.
            </div>
            <div style={{ fontWeight: "bold", marginTop: "5px" }}>
              3.2. Nghĩa vụ:
            </div>
            <div style={{ paddingLeft: "20px" }}>
              - Hoàn thành công việc được giao, chấp hành nội quy lao động.
            </div>
          </div>

          <div
            className="c-article"
            style={{ marginBottom: "15px", fontSize: "11pt" }}
          >
            <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
              Điều 4: Điều khoản thi hành
            </div>
            <div>
              - Hợp đồng này có hiệu lực kể từ ngày{" "}
              {formatDate(data.NgayBatDau || data.ngayBatDau)}.
            </div>
            <div>
              - Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi
              bên giữ 01 bản.
            </div>
          </div>

          {/* --- PHẦN CHỮ KÝ (CẬP NHẬT CẢ 2 BÊN) --- */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
              paddingBottom: "80px",
            }}
          >
            {/* CỘT NGƯỜI LAO ĐỘNG */}
            <div style={{ textAlign: "center", width: "45%" }}>
              <div style={{ fontWeight: "bold" }}>NGƯỜI LAO ĐỘNG</div>
              <div style={{ fontStyle: "italic", fontSize: "0.9em" }}>
                (Ký, ghi rõ họ tên)
              </div>

              <div
                style={{
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "10px 0",
                }}
              >
                {data.ChuKy || data.chuKy ? (
                  <img
                    src={data.ChuKy || data.chuKy}
                    alt="Chữ ký NLĐ"
                    style={{ maxHeight: "80px", maxWidth: "150px" }}
                  />
                ) : (
                  <span style={{ color: "#ccc", fontSize: "12px" }}>
                    (Chưa có chữ ký)
                  </span>
                )}
              </div>

              <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                {data.HoTenNhanVien || data.hoTenNhanVien}
              </div>
            </div>

            {/* CỘT ĐẠI DIỆN CÔNG TY (GIÁM ĐỐC) - DỮ LIỆU ĐỘNG */}
            <div style={{ textAlign: "center", width: "45%" }}>
              <div style={{ fontWeight: "bold" }}>ĐẠI DIỆN CÔNG TY</div>
              <div style={{ fontStyle: "italic", fontSize: "0.9em" }}>
                (Ký, đóng dấu, ghi rõ họ tên)
              </div>

              {/* Hiển thị Chữ ký Giám đốc */}
              <div
                style={{
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "10px 0",
                }}
              >
                {getDirectorSign() ? (
                  <img
                    src={getDirectorSign()}
                    alt="Chữ ký GĐ"
                    style={{ maxHeight: "80px", maxWidth: "150px" }}
                  />
                ) : (
                  /* Để trống để ký tay nếu chưa có chữ ký số */
                  <span style={{ color: "#ccc", fontSize: "12px" }}>
                    (Chưa có chữ ký)
                  </span>
                )}
              </div>

              {/* Tên Giám đốc & Chức vụ bên dưới */}
              <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                {getDirectorName()}
              </div>
              {/* Hiển thị lại chức vụ dưới tên (Tùy chọn) */}
              {/* <div style={{ fontSize: "10pt", fontWeight: "bold" }}>{getDirectorPosition()}</div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplate;
