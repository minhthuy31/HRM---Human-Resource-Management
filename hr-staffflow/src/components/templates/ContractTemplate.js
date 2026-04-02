import React from "react";
import { FaPrint, FaTimes, FaFileContract } from "react-icons/fa";
import "../../styles/ContractTemplate.css";

const ContractTemplate = ({ data, director, onClose }) => {
  if (!data) return null;

  const isThuViec = data.loaiHopDong === "Thử việc";

  const handlePrint = () => window.print();

  const formatDate = (d) => {
    if (!d) return "...../...../.......";
    const date = new Date(d);
    return `${("0" + date.getDate()).slice(-2)}/${("0" + (date.getMonth() + 1)).slice(-2)}/${date.getFullYear()}`;
  };

  const today = new Date();
  const currentDay = ("0" + today.getDate()).slice(-2);
  const currentMonth = ("0" + (today.getMonth() + 1)).slice(-2);
  const currentYear = today.getFullYear();

  const formatMoney = (val) =>
    val ? new Intl.NumberFormat("vi-VN").format(val) : "................";

  const styles = {
    docHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "30px",
      fontSize: "12pt",
    },
    leftHeader: { lineHeight: 1.5, fontStyle: "italic" },
    rightHeader: { textAlign: "center" },
    boldUpper: { fontWeight: "bold", textTransform: "uppercase" },
    title: {
      textAlign: "center",
      fontSize: "16pt",
      fontWeight: "bold",
      margin: "20px 0",
    },
    baseText: {
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: "20px",
      padding: "0 40px",
    },
    sectionTitle: {
      fontWeight: "bold",
      textTransform: "uppercase",
      marginTop: "15px",
      marginBottom: "10px",
    },
    p: { margin: "5px 0", textAlign: "justify" },
    list: { margin: "5px 0", paddingLeft: "15px" },
    listItem: { marginBottom: "5px" },
    signArea: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "40px",
      paddingBottom: "50px",
      textAlign: "center",
    },
  };

  return (
    <div className="contract-preview-overlay">
      {/* TOOLBAR */}
      <div className="preview-toolbar">
        <div className="preview-title">
          <FaFileContract style={{ marginRight: "10px" }} />
          Hợp đồng: {data.soHopDong}
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

      {/* CONTENT */}
      <div className="preview-content-scroll">
        <div className="contract-paper">
          <div style={styles.docHeader}>
            <div style={styles.leftHeader}>
              <div style={{ fontWeight: "bold" }}>
                Mẫu hợp đồng {isThuViec ? "thử việc" : "lao động"}:
              </div>
              <div>
                Công ty: <strong>CÔNG NGHỆ XYZ</strong>
              </div>
              <div>Mã NV: {data.maNhanVien}</div>
            </div>
            <div style={styles.rightHeader}>
              <div style={styles.boldUpper}>
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div style={{ fontStyle: "italic", marginTop: "5px" }}>
                ......., ngày {currentDay} tháng {currentMonth} năm{" "}
                {currentYear}
              </div>
            </div>
          </div>

          <div style={styles.title}>
            HỢP ĐỒNG {isThuViec ? "THỬ VIỆC" : "LAO ĐỘNG"}
          </div>

          <div style={styles.baseText}>
            (Căn cứ vào Bộ luật lao động số 45/2019/QH13 thông qua ngày
            20/11/2019 của Quốc Hội nước Cộng hòa xã hội chủ nghĩa Việt Nam)
          </div>

          <div>
            <div style={styles.sectionTitle}>
              {isThuViec ? "A." : "-"} BÊN SỬ DỤNG LAO ĐỘNG: CÔNG TY CÔNG NGHỆ
              XYZ
            </div>
            <ul
              style={{
                ...styles.list,
                listStyleType: "none",
                paddingLeft: "15px",
              }}
            >
              <li style={styles.listItem}>
                - Địa chỉ: Tầng 72, Tòa nhà Landmark, TP.HCM
              </li>
              <li style={styles.listItem}>
                - Người đại diện:{" "}
                <strong>
                  {director ? director.hoTen : "Nguyễn Văn Giám Đốc"}
                </strong>
              </li>
              <li style={styles.listItem}>
                - Chức vụ: {director ? director.tenChucVu : "Giám đốc"}
              </li>
              <li style={styles.listItem}>- Mã số thuế: 0101234567</li>
              <li style={styles.listItem}>- Điện thoại: 028.1234.5678</li>
            </ul>

            <div style={styles.sectionTitle}>
              {isThuViec ? "B." : "-"} BÊN NGƯỜI LAO ĐỘNG:
            </div>
            <ul
              style={{
                ...styles.list,
                listStyleType: "none",
                paddingLeft: "15px",
              }}
            >
              <li style={styles.listItem}>
                - Ông/Bà: <strong>{data.hoTenNhanVien?.toUpperCase()}</strong>
              </li>
              <li style={styles.listItem}>
                - Ngày sinh: {formatDate(data.ngaySinh)}
              </li>
              <li style={styles.listItem}>
                - Số CMND/CCCD:{" "}
                {data.cccd ||
                  "......................................................"}
              </li>
              <li style={styles.listItem}>
                - Thường trú tại:{" "}
                {data.diaChi ||
                  "......................................................................................"}
              </li>
              <li style={styles.listItem}>
                - Điện thoại:{" "}
                {data.SoDienThoai ||
                  data.soDienThoai ||
                  "......................................................"}
              </li>
            </ul>
          </div>

          <div
            style={{
              fontStyle: "italic",
              marginTop: "15px",
              marginBottom: "15px",
            }}
          >
            Cùng thỏa thuận ký kết Hợp đồng{" "}
            {isThuViec ? "thử việc" : "lao động"} và cam kết làm đúng những điều
            sau đây:
          </div>

          {/* --- ĐIỀU KHOẢN THỬ VIỆC --- */}
          {isThuViec && (
            <>
              <div style={{ fontWeight: "bold" }}>
                Điều 1: Thời gian thử việc và công việc phải làm trong thời gian
                thử việc:
              </div>
              <ul style={{ ...styles.list, listStyleType: "none" }}>
                <li style={styles.listItem}>
                  - Thời gian thử việc: Từ ngày{" "}
                  <strong>{formatDate(data.ngayBatDau)}</strong> đến ngày{" "}
                  <strong>
                    {data.ngayKetThuc
                      ? formatDate(data.ngayKetThuc)
                      : "...................."}
                  </strong>
                </li>
                <li style={styles.listItem}>
                  - Địa điểm làm việc: Tại văn phòng Công ty.
                </li>
                <li style={styles.listItem}>
                  - Chức danh chuyên môn:{" "}
                  <strong>{data.tenChucVu || "Nhân viên"}</strong>
                </li>
                <li style={styles.listItem}>
                  - Công việc phải làm: Theo đúng công việc chuyên môn của Phòng
                  cũng như sự phân công của người phụ trách.
                </li>
              </ul>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 2: Chế độ thử việc:
              </div>
              <ul style={{ ...styles.list, listStyleType: "none" }}>
                <li style={styles.listItem}>
                  - Thời giờ làm việc: 8 tiếng/ ngày.
                </li>
                <li style={styles.listItem}>
                  - Được sử dụng các thiết bị, dụng cụ làm việc do Công ty trang
                  bị.
                </li>
                <li style={styles.listItem}>
                  - Đảm bảo an toàn, vệ sinh nơi làm việc.
                </li>
              </ul>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 3: Nghĩa vụ, quyền lợi của Người lao động được hưởng:
              </div>
              <div style={{ marginLeft: "15px" }}>
                <div>
                  <strong>1. Quyền lợi:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Phương tiện đi lại: Tự túc/ Xe đưa đón.
                  </li>
                  <li style={styles.listItem}>
                    - Lương cơ bản:{" "}
                    <strong>{formatMoney(data.luongCoBan)} đồng</strong>.
                  </li>
                  <li style={styles.listItem}>
                    - Hình thức trả lương: Lương thời gian/ Chuyển khoản.
                  </li>
                  <li style={styles.listItem}>
                    - Ngày trả lương: Ngày 05 hàng tháng.
                  </li>
                  <li style={styles.listItem}>
                    - Chế độ nghỉ ngơi (nghỉ hàng tuần, phép năm, hiếu hỷ...)
                    theo quy định của Pháp luật hiện hành.
                  </li>
                </ul>
                <div>
                  <strong>2. Nghĩa vụ:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Hoàn thành những công việc đã cam kết trong Hợp đồng thử
                    việc.
                  </li>
                  <li style={styles.listItem}>
                    - Bồi thường vi phạm và vật chất: Theo nội quy kỷ luật lao
                    động và quy định của Pháp luật hiện hành.
                  </li>
                  <li style={styles.listItem}>
                    - Người lao động cam kết chấp hành nội quy lao động, các quy
                    chế, quy định, kỷ luật lao động của doanh nghiệp.
                  </li>
                </ul>
              </div>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 4: Nghĩa vụ và quyền lợi của Người sử dụng lao động:
              </div>
              <div style={{ marginLeft: "15px" }}>
                <div>
                  <strong>1. Nghĩa vụ:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Đảm bảo việc làm và những điều cam kết đã ghi trong Hợp
                    đồng thử việc.
                  </li>
                  <li style={styles.listItem}>
                    - Thanh toán đầy đủ, đúng thời hạn các chế độ và quyền lợi
                    cho Người lao động theo Hợp đồng thử việc, thỏa ước lao động
                    tập thể (nếu có).
                  </li>
                </ul>
                <div>
                  <strong>2. Quyền hạn:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Điều hành người lao động hoàn thành công việc theo Hợp
                    đồng (bố trí, điều chuyển, tạm ngừng việc).
                  </li>
                  <li style={styles.listItem}>
                    - Tạm hoãn, chấm dứt Hợp đồng thử việc, kỷ luật người lao
                    động theo quy định của pháp luật, thỏa ước lao động tập thể,
                    nội quy lao động của doanh nghiệp.
                  </li>
                </ul>
              </div>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 5: Những thỏa thuận khác
              </div>
              <div style={styles.p}>
                Kết thúc thời gian thử việc, người lao động phải có Phiếu nhận
                xét kết quả thử việc và có nhận xét của Phụ trách bộ phận. Phòng
                Nhân sự có trách nhiệm báo cáo kết quả thử việc và đề nghị Giám
                đốc quyết định tiếp nhận (nếu đạt yêu cầu) và chấm dứt hợp đồng
                thử việc (nếu không đạt yêu cầu).
              </div>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 6: Điều khoản thi hành:
              </div>
              <div style={styles.p}>
                Những vấn đề về lao động không ghi trong Hợp đồng thử việc này
                thì áp dụng theo quy định trong thỏa ước lao động tập thể,
                trường hợp chưa có thỏa ước lao động tập thể thì áp dụng theo
                quy định của Pháp luật hiện hành.
              </div>
              <div style={styles.p}>
                Hợp đồng thử việc được lập thành 02 bản có giá trị như nhau, mỗi
                bên giữ một bản và có hiệu lực kể từ ngày......Khi hai bên ký
                kết Phụ lục Hợp đồng thử việc thì nội dung của Phụ lục hợp đồng
                thử việc cũng có giá trị như nội dung của bản Hợp đồng thử việc
                này.
              </div>
            </>
          )}

          {/* --- ĐIỀU KHOẢN HỢP ĐỒNG CHÍNH THỨC --- */}
          {!isThuViec && (
            <>
              <div style={{ fontWeight: "bold" }}>
                Điều 1: Thời gian và công việc hợp đồng:
              </div>
              <ul style={{ ...styles.list, listStyleType: "none" }}>
                <li style={styles.listItem}>
                  - Loại Hợp đồng lao động:{" "}
                  <strong>Có xác định thời hạn</strong>
                </li>
                <li style={styles.listItem}>
                  - Từ ngày <strong>{formatDate(data.ngayBatDau)}</strong> đến
                  ngày{" "}
                  <strong>
                    {data.ngayKetThuc
                      ? formatDate(data.ngayKetThuc)
                      : "......................."}
                  </strong>
                </li>
                <li style={styles.listItem}>
                  - Địa điểm làm việc: Tại văn phòng Công ty.
                </li>
                <li style={styles.listItem}>
                  - Chức danh chuyên môn:{" "}
                  <strong>{data.tenChucVu || "Nhân viên"}</strong>
                </li>
                <li style={styles.listItem}>
                  - Công việc phải làm: Theo đúng công việc chuyên môn của Phòng
                  cũng như sự phân công của người phụ trách.
                </li>
              </ul>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 2: Chế độ làm việc:
              </div>
              <ul style={{ ...styles.list, listStyleType: "none" }}>
                <li style={styles.listItem}>
                  - Thời giờ làm việc: 8 tiếng/ ngày. Được sử dụng các thiết bị,
                  dụng cụ làm việc do Công ty trang bị.
                </li>
                <li style={styles.listItem}>
                  - Đảm bảo an toàn, vệ sinh nơi làm việc.
                </li>
              </ul>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 3: Nghĩa vụ, quyền lợi của Người lao động được hưởng:
              </div>
              <div style={{ marginLeft: "15px" }}>
                <div>
                  <strong>1. Quyền lợi:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Hình thức trả lương: Lương thời gian/ Chuyển khoản
                  </li>
                  <li style={styles.listItem}>
                    - Chế độ nâng lương: Theo quy chế của Công ty
                  </li>
                  <li style={styles.listItem}>
                    - Được trang bị bảo hộ lao động: Theo tính chất công việc và
                    quy định của Công ty
                  </li>
                  <li style={styles.listItem}>
                    - Chế độ nghỉ ngơi (nghỉ hàng tuần, phép năm, hiếu hỷ...)
                    theo quy định của Pháp luật hiện hành.
                  </li>
                  <li style={styles.listItem}>
                    - BHXH, BHYT, BH TNLĐ, BH BNN: Công ty trả 21.5%; Người lao
                    động trả 10.5%
                  </li>
                  <li style={styles.listItem}>
                    - Bảo hiểm thất nghiệp: Công ty trả 1%; Người lao động trả
                    1%
                  </li>
                </ul>
                <div>
                  <strong>2. Nghĩa vụ:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Hoàn thành những công việc đã cam kết trong Hợp đồng lao
                    động
                  </li>
                  <li style={styles.listItem}>
                    - Chấp hành lệnh điều hành công việc, nội quy kỷ luật, an
                    toàn lao động
                  </li>
                  <li style={styles.listItem}>
                    - Bồi thường vi phạm và vật chất: Theo nội quy kỷ luật lao
                    động và quy định của Pháp luật hiện hành.
                  </li>
                  <li style={styles.listItem}>
                    - Người lao động cam kết chấp hành nội quy lao động, các quy
                    chế, quy định, kỷ luật lao động.
                  </li>
                </ul>
              </div>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 4: Nghĩa vụ và quyền lợi của Người sử dụng lao động:
              </div>
              <div style={{ marginLeft: "15px" }}>
                <div>
                  <strong>1. Nghĩa vụ:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Đảm bảo việc làm và thực hiện đầy đủ những điều đã cam kết
                    trong hợp đồng lao động.
                  </li>
                  <li style={styles.listItem}>
                    - Thanh toán đầy đủ, đúng thời hạn các chế độ và quyền lợi
                    cho người lao động theo hợp đồng lao động, thỏa ước lao động
                    tập thể (nếu có).
                  </li>
                </ul>
                <div>
                  <strong>2. Quyền hạn:</strong>
                </div>
                <ul style={{ ...styles.list, listStyleType: "none" }}>
                  <li style={styles.listItem}>
                    - Điều hành người lao động hoàn thành công việc theo hợp
                    đồng (bố trí, điều chuyển, tạm ngừng việc).
                  </li>
                  <li style={styles.listItem}>
                    - Tạm hoãn, chấm dứt hợp đồng lao động, kỷ luật người lao
                    động theo quy định của pháp luật, thỏa ước lao động tập thể
                    (nếu có) và nội quy lao động của doanh nghiệp.
                  </li>
                </ul>
              </div>

              <div style={{ fontWeight: "bold", marginTop: "15px" }}>
                Điều 5: Điều khoản thi hành:
              </div>
              <div style={styles.p}>
                Những vấn đề về lao động không ghi trong hợp đồng lao động này
                thì áp dụng theo quy định của thỏa ước lao động tập thể, trường
                hợp chưa có thỏa ước lao động tập thể thì áp dụng theo quy định
                của pháp luật lao động.
              </div>
              <div style={styles.p}>
                Hợp đồng này được lập thành 02 bản có giá trị như nhau, mỗi bên
                giữ 01 bản và có hiệu lực kể từ ngày ký.
              </div>
            </>
          )}

          {/* --- KHU VỰC CHỮ KÝ --- */}
          <div style={styles.signArea}>
            <div style={{ width: "45%" }}>
              <div style={{ fontWeight: "bold" }}>NGƯỜI LAO ĐỘNG</div>
              <div style={{ fontStyle: "italic", fontSize: "11pt" }}>
                (Ký, ghi rõ họ tên)
              </div>

              {/* Chữ ký giả lập (in không bị mất font) */}
              <div
                className="signature-text"
                style={{ minHeight: "100px", marginTop: "20px" }}
              >
                {data.hoTenNhanVien}
              </div>

              <div style={{ fontWeight: "bold", marginTop: "10px" }}>
                {data.hoTenNhanVien}
              </div>
            </div>

            <div style={{ width: "45%" }}>
              <div style={{ fontWeight: "bold" }}>NGƯỜI SỬ DỤNG LAO ĐỘNG</div>
              <div style={{ fontStyle: "italic", fontSize: "11pt" }}>
                {isThuViec ? "Giám đốc" : "(Ký, đóng dấu, ghi rõ họ tên)"}
              </div>

              {/* Chữ ký giả lập (in không bị mất font) */}
              <div
                className="signature-text"
                style={{ minHeight: "100px", marginTop: "20px" }}
              >
                {director ? director.hoTen : "Nguyễn Văn Giám Đốc"}
              </div>

              <div style={{ fontWeight: "bold", marginTop: "10px" }}>
                {director ? director.hoTen : "Nguyễn Văn Giám Đốc"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplate;
