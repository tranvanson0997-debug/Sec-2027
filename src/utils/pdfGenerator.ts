import { PatrolSession, HotelSystemConfig, FailRecord, AnimalControlReport } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import notoSansRegular from '../assets/fonts/NotoSans-Regular.ttf';
import notoSansBold from '../assets/fonts/NotoSans-Bold.ttf';

/**
 * Helper to purge prohibited/deleted demo text from report output
 * Specifically removes deleted user "Lê Viết Sơn" / "sonllvt99@gmail.com"
 */
export function cleanReportText(text: string | undefined | null): string {
  if (!text) return '';
  let result = text;
  result = result.replace(/Lê Viết Sơn/gi, '');
  result = result.replace(/sonllvt99@gmail\.com/gi, '');
  result = result.replace(/hotline\s*an\s*ninh:[^|\n,]*/gi, '');
  result = result.replace(/hotline:[^|\n,]*/gi, '');
  result = result.replace(/Ext:?\s*114\s*\/?\s*115/gi, '');
  result = result.replace(/114\s*\/\s*115/g, '');
  result = result.replace(/An Giang/g, 'Kiên Giang');
  return result.trim();
}

/**
 * Standalone CSS styles for standard A4 report rendering
 * Fully scoped to .report-container and global body so no dark-theme CSS leaks in
 */
export function getReportStyles(): string {
  return `
    @font-face {
      font-family: "Noto Sans";
      src: url("${notoSansRegular}") format("truetype");
      font-weight: 400;
      font-style: normal;
    }

    @font-face {
      font-family: "Noto Sans";
      src: url("${notoSansBold}") format("truetype");
      font-weight: 700 900;
      font-style: normal;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body, #pdf-render-offscreen-container, .report-container {
      font-family: "Noto Sans", Arial, "Segoe UI", sans-serif !important;
      color: #0f172a !important;
      background-color: #ffffff !important;
      margin: 0;
      padding: 0;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .report-container {
      width: 794px;
      max-width: 794px;
      margin: 0 auto;
      padding: 24px 30px;
      background-color: #ffffff !important;
      color: #0f172a !important;
      box-sizing: border-box;
    }
    .report-container * {
      box-sizing: border-box;
    }
    .header-table {
      width: 100%;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-collapse: collapse;
    }
    .header-table td {
      border: none !important;
      padding: 0 !important;
      background: transparent !important;
      vertical-align: top;
    }
    .hotel-title {
      font-size: 16px;
      font-weight: 800;
      color: #b45309 !important;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .dept-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a !important;
      margin-top: 3px;
    }
    .hotel-contact {
      font-size: 11px;
      color: #64748b !important;
      margin-top: 3px;
    }
    .report-id-box {
      text-align: right;
    }
    .report-id-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b !important;
    }
    .report-id-val {
      font-size: 15px;
      font-weight: 900;
      font-family: Arial, 'Segoe UI', sans-serif;
      color: #0f172a !important;
      letter-spacing: 0.5px;
    }
    .report-id-status {
      font-size: 10.5px;
      color: #64748b !important;
      margin-top: 3px;
    }
    .report-title-box {
      text-align: center;
      margin: 16px 0 16px 0;
    }
    .report-main-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a !important;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .report-sub-title {
      font-size: 11.5px;
      color: #475569 !important;
      font-weight: 600;
      margin-top: 3px;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background-color: #f8fafc !important;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 18px;
    }
    .meta-item {
      font-size: 11.5px;
    }
    .meta-label {
      color: #64748b !important;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
      font-size: 10.5px;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a !important;
    }
    .section-header {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 4px solid #b45309;
      padding-left: 8px;
      margin: 18px 0 10px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 18px;
    }
    .stat-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 4px;
      text-align: center;
      background-color: #ffffff !important;
    }
    .stat-val {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a !important;
    }
    .stat-label {
      font-size: 10px;
      color: #64748b !important;
      font-weight: 600;
      margin-top: 2px;
    }
    .stat-card.pass { border-color: #86efac !important; background-color: #f0fdf4 !important; }
    .stat-card.pass .stat-val { color: #15803d !important; }
    .stat-card.fail { border-color: #fca5a5 !important; background-color: #fef2f2 !important; }
    .stat-card.fail .stat-val { color: #b91c1c !important; }
    
    table.patrol-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11.5px;
      color: #0f172a !important;
    }
    table.patrol-table th {
      background-color: #0f172a !important;
      color: #ffffff !important;
      font-weight: 700;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #0f172a;
    }
    table.patrol-table td {
      padding: 7px 9px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      color: #0f172a !important;
      background-color: #ffffff;
    }
    table.patrol-table tr:nth-child(even) td {
      background-color: #f8fafc !important;
    }
    .fail-card {
      border: 1.5px solid #fca5a5;
      background-color: #fffafa !important;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      break-inside: avoid;
      color: #0f172a !important;
    }
    .fail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #fee2e2;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .fail-title {
      font-weight: 800;
      font-size: 13px;
      color: #991b1b !important;
    }
    .fail-content-grid {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 14px;
    }
    .fail-desc-box {
      font-size: 12px;
      line-height: 1.55;
      color: #0f172a !important;
    }
    .fail-field {
      margin-bottom: 5px;
      color: #0f172a !important;
    }
    .fail-field strong {
      color: #334155 !important;
    }
    .fail-photo-wrapper {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background-color: #0f172a !important;
      text-align: center;
    }
    .fail-img {
      width: 100%;
      aspect-ratio: 4 / 3;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .photo-caption-box {
      background-color: #0f172a !important;
      color: #f8fafc !important;
      padding: 5px 7px;
      font-size: 9.5px;
      text-align: left;
      line-height: 1.35;
      border-top: 2px solid #ef4444;
    }
    .photo-caption-line {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #f8fafc !important;
    }
    .photo-caption-location {
      color: #fde047 !important;
      font-weight: 600;
    }
    .signatures {
      margin-top: 30px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      color: #0f172a !important;
    }
    .sign-title {
      font-weight: 700;
      font-size: 11.5px;
      text-transform: uppercase;
      color: #0f172a !important;
    }
    .sign-note {
      font-size: 10.5px;
      color: #64748b !important;
      font-style: italic;
      margin-top: 2px;
    }
    .sign-space {
      height: 55px;
    }
    .sign-name {
      font-weight: 700;
      font-size: 12px;
      border-top: 1px dashed #cbd5e1;
      display: inline-block;
      padding-top: 4px;
      min-width: 150px;
      color: #0f172a !important;
    }
    .footer-note {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 9.5px;
      color: #64748b !important;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        background: none;
      }
      .report-container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
    }
  `;
}

/**
 * Generate the inner HTML content of the patrol report (used inside .report-container)
 */
export function generatePatrolReportInnerBody(
  session: PatrolSession,
  config: HotelSystemConfig
): string {
  const displayHotelName = cleanReportText(config.hotelName) || config.hotelName || 'Dusit Princess Moonrise Phú Quốc';
  const displayAddress = cleanReportText(config.address) || config.address || '';
  const displayOfficer = cleanReportText(session.officerName) || session.officerName || 'Nhân viên bảo an';

  // Extract all FAIL items across all inspected checkpoints
  const failItems: {
    checkpointId: string;
    checkpointName: string;
    area: string;
    failRecord: FailRecord;
  }[] = [];

  session.checkpoints.forEach((cp) => {
    cp.items.forEach((item) => {
      if (item.status === 'FAIL' && item.failRecord) {
        failItems.push({
          checkpointId: cp.checkpointId,
          checkpointName: cp.checkpointName,
          area: cp.area,
          failRecord: item.failRecord,
        });
      }
    });
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '<span style="background-color:#fee2e2; color:#b91c1c; border:1px solid #ef4444; padding:2px 6px; border-radius:4px; font-weight:700; font-size:11px;">NGHIÊM TRỌNG</span>';
      case 'HIGH':
        return '<span style="background-color:#ffedd5; color:#c2410c; border:1px solid #f97316; padding:2px 6px; border-radius:4px; font-weight:700; font-size:11px;">CAO</span>';
      case 'MEDIUM':
        return '<span style="background-color:#fef9c3; color:#854d0e; border:1px solid #eab308; padding:2px 6px; border-radius:4px; font-weight:700; font-size:11px;">TRUNG BÌNH</span>';
      default:
        return '<span style="background-color:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; font-weight:700; font-size:11px;">THẤP</span>';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return '<span style="color:#15803d; font-weight:700;">ĐẠT (PASS)</span>';
      case 'FAIL':
        return '<span style="color:#b91c1c; font-weight:700;">KHÔNG ĐẠT (FAIL)</span>';
      default:
        return '<span style="color:#64748b;">CHƯA KIỂM TRA</span>';
    }
  };

  return `
    <!-- HEADER / TRANG BÌA -->
    <table class="header-table">
      <tr>
        <td>
          <div class="hotel-title">${displayHotelName}</div>
          <div class="dept-title">${config.departmentName || 'BỘ PHẬN AN NINH & BẢO VỆ'}</div>
          ${displayAddress ? `<div class="hotel-contact">${displayAddress}</div>` : ''}
        </td>
        <td class="report-id-box">
          <div class="report-id-label">MÃ BÁO CÁO</div>
          <div class="report-id-val">${session.id}</div>
          <div class="report-id-status">Trạng thái: <strong>${session.isLocked ? 'ĐÃ KHÓA SUBMIT' : 'ĐANG THỰC HIỆN'}</strong></div>
        </td>
      </tr>
    </table>

    <div class="report-title-box">
      <h1 class="report-main-title">BÁO CÁO TUẦN TRA AN NINH</h1>
      <div class="report-sub-title">SECURITY PATROL INSPECTION & INCIDENT REPORT</div>
    </div>

    <!-- THÔNG TIN PHIÊN TUẦN TRA -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Ngày thực hiện:</span>
        <span class="meta-val">${session.date}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Ca trực:</span>
        <span class="meta-val">${session.shift}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Nhân viên tuần tra:</span>
        <span class="meta-val">${displayOfficer}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Mã số thẻ:</span>
        <span class="meta-val">${session.badgeNumber || 'SEC-OFFICER'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Tuyến tuần tra:</span>
        <span class="meta-val">${session.patrolRoute}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Giờ bắt đầu:</span>
        <span class="meta-val">${session.startTime}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Giờ kết thúc:</span>
        <span class="meta-val">${session.endTime || 'Đang cập nhật'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Thời gian gửi báo cáo:</span>
        <span class="meta-val">${session.submittedAt || 'Chưa khóa dữ liệu'}</span>
      </div>
    </div>

    <!-- TỔNG QUAN THỐNG KÊ (7 CHỈ SỐ) -->
    <div class="section-header">
      <span>I. TỔNG QUAN KẾT QUẢ TUẦN TRA</span>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${session.summary.totalCheckpoints}</div>
        <div class="stat-label">Tổng Checkpoint</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${session.summary.checkedCount}</div>
        <div class="stat-label">Đã kiểm tra</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${session.summary.uncheckedCount}</div>
        <div class="stat-label">Chưa kiểm tra</div>
      </div>
      <div class="stat-card pass">
        <div class="stat-val">${session.summary.passCount}</div>
        <div class="stat-label">PASS (Đạt)</div>
      </div>
      <div class="stat-card fail">
        <div class="stat-val">${session.summary.failCount}</div>
        <div class="stat-label">FAIL (Không đạt)</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${session.summary.completionRate}%</div>
        <div class="stat-label">Tỷ lệ hoàn thành</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${session.summary.passRate}%</div>
        <div class="stat-label">Tỷ lệ đạt</div>
      </div>
    </div>

    <!-- CHI TIẾT TUẦN TRA -->
    <div class="section-header">
      <span>II. BẢNG CHI TIẾT TIẾN ĐỘ CHECKPOINT</span>
    </div>
    <table class="patrol-table">
      <thead>
        <tr>
          <th style="width:40px; text-align:center;">STT</th>
          <th style="width:160px;">Khu vực</th>
          <th>Checkpoint / Vị trí</th>
          <th style="width:120px; text-align:center;">Kết quả</th>
          <th style="width:85px; text-align:center;">Thời gian</th>
        </tr>
      </thead>
      <tbody>
        ${
          session.checkpoints.length === 0
            ? '<tr><td colspan="5" style="text-align:center; padding:16px; color:#64748b;">Chưa có điểm nào được quét kiểm tra trong phiên này.</td></tr>'
            : session.checkpoints
                .map(
                  (cp, idx) => `
          <tr>
            <td style="text-align:center; font-weight:700;">${idx + 1}</td>
            <td><strong>${cp.area}</strong></td>
            <td>
              <div style="font-weight:700; color:#0f172a;">${cp.checkpointName}</div>
              <div style="font-size:10.5px; color:#64748b; font-family:Arial, 'Segoe UI', sans-serif;">Mã: ${cp.checkpointId}</div>
              ${cp.notes ? `<div style="font-size:10.5px; color:#334155; margin-top:2px;"><em>Ghi chú: ${cp.notes}</em></div>` : ''}
            </td>
            <td style="text-align:center;">${getStatusBadge(cp.status)}</td>
            <td style="text-align:center; font-family:Arial, 'Segoe UI', sans-serif;">${cp.scannedAt || '—'}</td>
          </tr>
        `
                )
                .join('')
        }
      </tbody>
    </table>

    <!-- CÁC VẤN ĐỀ FAIL & BẰNG CHỨNG HÌNH ẢNH -->
    <div class="section-header">
      <span>III. CÁC VẤN ĐỀ KHÔNG ĐẠT (FAIL ISSUES & PHOTO EVIDENCE)</span>
      <span style="font-size:11px; font-weight:600; color:#b91c1c;">${failItems.length} sự cố ghi nhận</span>
    </div>

    ${
      failItems.length === 0
        ? '<div style="border:1px solid #bbf7d0; background-color:#f0fdf4; padding:14px; border-radius:6px; color:#166534; font-weight:600; text-align:center;">✓ KHÔNG CÓ SỰ CỐ HOẶC VẤN ĐỀ FAIL TRONG PHIÊN TUẦN TRA NÀY. TOÀN BỘ ĐIỂM KIỂM SOÁT ĐẠT TIÊU CHUẨN AN NINH.</div>'
        : failItems
            .map(
              (f, i) => `
        <div class="fail-card">
          <div class="fail-header">
            <div class="fail-title">
              #${i + 1}. [${f.checkpointId}] ${f.checkpointName}
            </div>
            <div>
              ${getSeverityBadge(f.failRecord.severity)}
            </div>
          </div>

          <div class="fail-content-grid">
            <div class="fail-desc-box">
              <div class="fail-field">
                <strong>Khu vực:</strong> ${f.area}
              </div>
              <div class="fail-field">
                <strong>Tiêu chí không đạt:</strong> <span style="color:#b91c1c; font-weight:700;">${f.failRecord.itemText}</span>
              </div>
              <div class="fail-field">
                <strong>Mô tả chi tiết:</strong> ${f.failRecord.description}
              </div>
              <div class="fail-field">
                <strong>Hành động xử lý tại chỗ:</strong> ${f.failRecord.actionTaken || 'Đã khoanh vùng cảnh báo và báo cáo'}
              </div>
              <div class="fail-field">
                <strong>BỘ phận phối hợp:</strong> <span style="background-color:#e2e8f0; padding:2px 6px; border-radius:3px; font-weight:600;">${f.failRecord.department}</span>
              </div>
              <div class="fail-field">
                <strong>Trạng thái xử lý:</strong> <strong style="color:${f.failRecord.status === 'RESOLVED' ? '#15803d' : '#ea580c'};">${f.failRecord.status}</strong>
              </div>
            </div>

            <!-- ẢNH FAIL VỚI THÔNG TIN BẢO AN -->
            <div>
              <div class="fail-photo-wrapper">
                <img class="fail-img" src="${f.failRecord.photoUrl}" alt="Bằng chứng sự cố ${f.checkpointId}" />
                <div class="photo-caption-box">
                  <div class="photo-caption-line">${cleanReportText(f.failRecord.photoMetadata.officerName) ? `Tên: ${cleanReportText(f.failRecord.photoMetadata.officerName)}` : `Tên: ${displayOfficer}`}</div>
                  <div class="photo-caption-line">Ngày: ${f.failRecord.photoMetadata.date} | Giờ: ${f.failRecord.photoMetadata.time}</div>
                  <div class="photo-caption-line photo-caption-location">Vị trí: ${f.failRecord.photoMetadata.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
            )
            .join('')
    }

    <!-- CHỮ KÝ VÀ PHÊ DUYỆT -->
    <div class="signatures">
      <div>
        <div class="sign-title">NHÂN VIÊN TUẦN TRA</div>
        <div class="sign-note">(Ký & ghi rõ họ tên)</div>
        <div class="sign-space"></div>
        <div class="sign-name"></div>
      </div>
      <div>
        <div class="sign-title">GIÁM SÁT AN NINH</div>
        <div class="sign-note">(Xác nhận & kiểm tra)</div>
        <div class="sign-space"></div>
        <div class="sign-name"></div>
      </div>
      <div>
        <div class="sign-title">TRƯỞNG BỘ PHẬN AN NINH</div>
        <div class="sign-note">(Phê duyệt báo cáo)</div>
        <div class="sign-space"></div>
        <div class="sign-name">Trần Văn Sơn</div>
      </div>
    </div>
<div>Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}</div>
    </div>
  `;
}

/**
 * Generate a complete, beautifully styled A4 Vietnamese Security Patrol PDF Report HTML
 */
export function generatePatrolReportHTML(
  session: PatrolSession,
  config: HotelSystemConfig
): string {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BÁO CÁO TUẦN TRA AN NINH - ${session.id}</title>
      <style>
        ${getReportStyles()}
      </style>
    </head>
    <body>
      <div class="report-container">
        ${generatePatrolReportInnerBody(session, config)}
      </div>
    </body>
    </html>
  `;
}

/**
 * Safely triggers direct file download across desktop and mobile browsers
 * without target="_blank" (which breaks blob URLs in iframes).
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (err) {
    console.warn('Direct file download fallback triggered:', err);
  }
}

/**
 * Generate an authentic multi-page A4 PDF binary file and trigger direct download on mobile/desktop.
 * Optimized specifically for iOS (Safari) and Android (Chrome):
 * 1. Offscreen container rendered with exact 794px width without mobile viewport clipping
 * 2. Window scroll position preserved & zeroed out during capture to prevent blank header
 * 3. Safe image cross-origin handling to prevent canvas tainting SecurityError
 * 4. Adaptive scale capping canvas dimensions comfortably under 3800px (preventing iOS 4096px crashes)
 * 5. High-resolution slicing into standard A4 portrait pages
 */
export async function generateAndDownloadPDF(
  session: PatrolSession,
  config: HotelSystemConfig,
  onProgress?: (message: string) => void
): Promise<{ blob: Blob; url: string; dataUri: string; filename: string }> {
  if (onProgress) onProgress('Đang khởi tạo cấu trúc báo cáo A4...');

  // Remove any stale offscreen container
  const oldContainer = document.getElementById('pdf-render-offscreen-container');
  if (oldContainer) {
    oldContainer.remove();
  }

  // Device detection
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth < 768));

  // Save current scroll position so html2canvas captures from top without offset
  const prevScrollX = typeof window !== 'undefined' ? window.scrollX || window.pageXOffset || 0 : 0;
  const prevScrollY = typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0;
  if (typeof window !== 'undefined' && (prevScrollX !== 0 || prevScrollY !== 0)) {
    window.scrollTo(0, 0);
  }

  // Create an absolute render container with exact A4 portrait pixel width (794px = 210mm at 96dpi)
  // z-index: 40 ensures it sits beneath the modal backdrop (z-50) so it doesn't flicker on screen,
  // but opacity: 1 and visibility: visible ensure html2canvas captures full color and text data!
  const container = document.createElement('div');
  container.id = 'pdf-render-offscreen-container';
  container.style.position = 'absolute';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '794px';
  container.style.minWidth = '794px';
  container.style.maxWidth = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '40';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.style.visibility = 'visible';

  // Attach styles and content
  container.innerHTML = `
    <style>
      ${getReportStyles()}
    </style>
    <div class="report-container">
      ${generatePatrolReportInnerBody(session, config)}
    </div>
  `;

  document.body.appendChild(container);

    if (onProgress) onProgress('Đang đồng bộ hình ảnh và chuẩn bị kết xuất...');

  // Ensure all image elements inside container are loaded safely
  const imgElements = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgElements.map((img) => {
      return new Promise<void>((resolve) => {
        if (img.src && !img.src.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        if (img.complete && img.naturalHeight !== 0) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => {
            img.style.display = 'none';
            resolve();
          };
          setTimeout(resolve, 800);
        }
      });
    })
  );
  if (onProgress) onProgress('Đang xử lý kết xuất hình ảnh nét cao...');
  // Rendering stabilization delay
  await new Promise((r) => setTimeout(r, 200));

  let canvas: HTMLCanvasElement;
  try {
    const totalHeight = Math.max(container.scrollHeight, container.offsetHeight, 1123);
    
    // Adaptive scale: prevents iOS WebKit canvas height overflow crashes (4096px limit) while keeping crisp output
    let scale = 1.5;
    if (isMobile) {
      if (totalHeight * 1.25 > 3800) {
        scale = Math.max(0.85, Math.min(1.0, 3800 / totalHeight));
      } else {
        scale = 1.25;
      }
    } else {
      if (totalHeight * 1.5 > 5500) {
        scale = Math.max(1.0, 5500 / totalHeight);
      }
    }

    // Đảm bảo Noto Sans đã tải xong trước khi html2canvas render PDF
    try {
        const regularFont = new FontFace("Noto Sans", `url(${notoSansRegular})`, {
          weight: "400",
          style: "normal"
        });

        const boldFont = new FontFace("Noto Sans", `url(${notoSansBold})`, {
          weight: "700",
          style: "normal"
        });

        await Promise.all([
          regularFont.load(),
          boldFont.load()
        ]);

        document.fonts.add(regularFont);
        document.fonts.add(boldFont);

        await document.fonts.ready;
      } catch (fontError) {
        console.error("Không thể tải Noto Sans:", fontError);
      }

    // Chỉ áp dụng font cho báo cáo PDF
    container.style.fontFamily = '"Noto Sans", sans-serif';

    container.querySelectorAll('*').forEach((el) => {
      (el as HTMLElement).style.fontFamily = '"Noto Sans", sans-serif';
    });

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: totalHeight,
      windowWidth: 794,
      windowHeight: totalHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });
  } finally {
    // Clean up DOM container and restore scroll
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    if (typeof window !== 'undefined' && (prevScrollX !== 0 || prevScrollY !== 0)) {
      window.scrollTo(prevScrollX, prevScrollY);
    }
  }
  if (onProgress) onProgress('Đang chia trang và đóng gói PDF...');
  const a4WidthMm = 210;
  const a4HeightMm = 297;
  // Calculate page height in canvas pixels matching A4 aspect ratio:
  const pageCanvasHeight = Math.floor((canvas.width * a4HeightMm) / a4WidthMm);
  const totalPages = Math.ceil(canvas.height / pageCanvasHeight) || 1;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let page = 0; page < totalPages; page++) {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageCanvasHeight;
    const pageCtx = pageCanvas.getContext('2d');

    if (pageCtx) {
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      const sourceY = page * pageCanvasHeight;
      const sourceHeight = Math.min(canvas.height - sourceY, pageCanvasHeight);

      pageCtx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sourceHeight,
        0,
        0,
        canvas.width,
        sourceHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
      if (page > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(pageImgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm);
    }
  }

  if (onProgress) onProgress('Đang hoàn thiện tệp PDF...');

  const filename = `BAO_CAO_TUAN_TRA_${session.id}.pdf`;
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const dataUri = pdf.output('datauristring');
  // Desktop: tự động tải PDF
  if (!isMobile) {
    try {
      triggerFileDownload(pdfBlob, filename);
    } catch (e) {
      console.warn('Desktop auto-download caught:', e);
    }
  }

  // Mobile: mở PDF trực tiếp trên trình duyệt
  if (isMobile) {
    try {
      const mobilePdfUrl = URL.createObjectURL(pdfBlob);

      setTimeout(() => {
        try {
          const opened = window.open(mobilePdfUrl, '_blank');

          if (!opened) {
            window.location.href = mobilePdfUrl;
          }
        } catch (openError) {
          console.warn('Không thể mở PDF trên mobile:', openError);
          window.location.href = mobilePdfUrl;
        }

        setTimeout(() => {
          URL.revokeObjectURL(mobilePdfUrl);
        }, 60000);
      }, 100);
    } catch (mobileError) {
      console.warn('Mobile PDF fallback failed:', mobileError);
    }
  }

  if (onProgress) onProgress('Hoàn tất!');

  return {
    blob: pdfBlob,
    url: blobUrl,
    dataUri,
    filename,
  };
}

/**
 * Share the generated PDF report via native Mobile Share Sheet (Zalo, Gmail, AirDrop, Files)
 */
export async function sharePatrolReportPDF(
  session: PatrolSession,
  config: HotelSystemConfig,
  precomputedBlob?: Blob,
  precomputedFilename?: string
): Promise<boolean> {
  let blob = precomputedBlob;
  let filename = precomputedFilename || `BAO_CAO_TUAN_TRA_${session.id}.pdf`;

  try {
    if (!blob) {
      const result = await generateAndDownloadPDF(session, config);
      blob = result.blob;
      filename = result.filename;
    }

    const file = new File([blob], filename, { type: 'application/pdf' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `Báo cáo tuần tra an ninh ${session.id}`,
        text: `Báo cáo ca tuần tra an ninh ngày ${session.date} - ${session.shift}. Người thực hiện: ${session.officerName}`,
      });
      return true;
    } else {
      // Direct download fallback if navigator.share files is unsupported
      triggerFileDownload(blob, filename);
      return true;
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('Native share failed, falling back to direct download:', err);
      if (blob) {
        triggerFileDownload(blob, filename);
        return true;
      }
    }
  }
  return false;
}

/**
 * Smart universal print/export function:
 * - On mobile: automatically generates and downloads the `.pdf` file to device storage
 * - On desktop: attempts hidden iframe print, with automatic fallback to direct PDF file download
 */
export function printPatrolReport(session: PatrolSession, config: HotelSystemConfig): void {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

  if (isMobile) {
    generateAndDownloadPDF(session, config).catch((err) => {
      console.error('Mobile PDF export fallback to iframe print:', err);
      printViaIframe(session, config);
    });
  } else {
    printViaIframe(session, config).then((success) => {
      if (!success) {
        generateAndDownloadPDF(session, config);
      }
    });
  }
}

/**
 * Print patrol report using a hidden iframe
 */
export function printViaIframe(session: PatrolSession, config: HotelSystemConfig): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const html = generatePatrolReportHTML(session, config);
      let iframe = document.getElementById('hidden-patrol-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = 'hidden-patrol-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (win) {
          setTimeout(() => {
            win.print();
            resolve(true);
          }, 400);
        } else {
          resolve(false);
        }
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print call error:', err);
          resolve(false);
        }
      }, 500);
    } catch (e) {
      console.error('printViaIframe failed:', e);
      resolve(false);
    }
  });
}






























/**
 * ============================================================
 * PDF RIÊNG - BẮT / KIỂM SOÁT ĐỘNG VẬT
 * ============================================================
 * Module độc lập với PDF tuần tra hiện có.
 */

function animalPdfSafeText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function animalPdfFilename(report: AnimalControlReport): string {
  const number = animalPdfSafeText(report.reportNumber || report.id)
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_');

  return `BAO_CAO_BAT_DONG_VAT_${number}.pdf`;
}

export async function generateAnimalControlPDF(
  report: AnimalControlReport
): Promise<void> {
  const safe = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    return String(value);
  };

  const values = (value: unknown): string[] => {
    return safe(value)
      .split('||')
      .map(v => v.trim())
      .filter(Boolean);
  };

  const hasValue = (value: unknown, item: string): boolean => {
    return values(value).includes(item);
  };

  const esc = (value: unknown): string => {
    return safe(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const check = (condition: boolean): string => {
    return `
      <span class="check-box ${condition ? 'checked' : ''}">
        ${condition ? '<span class="check-mark"></span>' : ''}
      </span>
    `;
  };

  const line = (label: string, value: unknown): string => `
    <div class="line-row">
      <div class="line-label">${esc(label)}</div>
      <div class="line-value">${esc(value) || 'Chưa ghi nhận'}</div>
    </div>
  `;

  const checkboxRow = (
    label: string,
    items: string[],
    selected: unknown,
    multi = false
  ): string => `
    <div class="option-row">
      <div class="option-label">${esc(label)}</div>
      <div class="options">
        ${items.map(item => `
          <span class="option">
            ${check(multi ? hasValue(selected, item) : safe(selected) === item)}
            <span>${esc(item)}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;

  try {
    const animalTypes = [
      'Chó/Mèo thả rông',
      'Bò sát / Rắn',
      'Rết / Bọ cạp / Ong',
      'Chim / Dơi',
      'Khỉ / Động vật hoang dã',
      'Khác'
    ];

    const dangerLevels = [
      'Cấp 1 (An toàn)',
      'Cấp 2 (Cảnh báo)',
      'Cấp 3 (Nguy hiểm)'
    ];

    const initialConditions = [
      'Bình thường / Khỏe mạnh',
      'Bị thương / Kiệt sức',
      'Hung dữ / Kích động',
      'Đã chết'
    ];

    const guestImpacts = [
      'Không gây ảnh hưởng',
      'Gây hoảng loạn / Phàn nàn',
      'Đã gây va chạm / Cắn / Đốt (Tấn công)'
    ];

    const captureTools = [
      'Lưới / Vợt',
      'Gậy bắt rắn chuyên dụng',
      'Lồng bẫy',
      'Găng tay bảo hộ dày',
      'Thùng chứa chuyên dụng'
    ];

    const postActions = [
      'Bàn giao lại cho chủ sở hữu (Khách/Dân địa phương)',
      'Thả về môi trường tự nhiên xa khu vực Resort (Rừng/Khu bảo tồn)',
      'Bàn giao cho Kiểm lâm / Chi cục Bảo vệ Môi trường / Trạm Thú y',
      'Tiêu hủy theo quy định an toàn sinh học (Đối với vật nguy hiểm/bệnh)'
    ];

    const causes = [
      'Hàng rào hở',
      'Cửa ra vào mở',
      'Khu vực cây rậm rạp chưa phát quang',
      'Mùi thức ăn'
    ];

    const departments = [
      'An ninh',
      'Cảnh quan',
      'Bảo trì'
    ];

    const photos = Array.isArray(report.photos) ? report.photos : [];

    const photoHtml = photos.length
      ? `
        <div class="photo-grid">
          ${photos.map((photo, index) => `
            <div class="photo-card">
              <div class="photo-title">ẢNH MINH CHỨNG ${index + 1}</div>
              <img src="${esc(photo.dataUrl)}" />
            </div>
          `).join('')}
        </div>
      `
      : `
        <div class="no-photo">
          Chưa có ảnh minh chứng
        </div>
      `;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: "Noto Sans", Arial, sans-serif;
    color: #17202a;
    background: #ffffff;
  }

  .report {
    width: 794px;
    margin: 0 auto;
    padding: 28px 34px 26px;
    background: #ffffff;
    font-family: "Noto Sans", Arial, sans-serif;
    font-size: 12.5px;
    line-height: 1.5;
  }

  .header {
    text-align: center;
    border: 1px solid #b8c7d9;
    border-top: 7px solid #17365d;
    background: #f4f8fc;
    padding: 14px 18px 13px;
    margin-bottom: 14px;
  }

  .hotel {
    font-size: 23px;
    font-weight: 800;
    color: #17365d;
    letter-spacing: 0.2px;
    line-height: 1.2;
  }

  .hotel-sub {
    display: none;
  }

  .title {
    margin-top: 10px;
    font-size: 20px;
    font-weight: 800;
    color: #17365d;
    line-height: 1.25;
  }

  .subtitle {
    margin-top: 3px;
    font-size: 12px;
    font-weight: 700;
    color: #566573;
    letter-spacing: 0.3px;
  }

  .safety {
    margin-top: 10px;
    padding: 7px 10px;
    border: 1px solid #c5d5e6;
    background: #eaf2f8;
    color: #24445f;
    font-size: 10px;
    font-weight: 700;
  }

  .meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #aebdca;
    margin-bottom: 12px;
    background: #ffffff;
  }

  .meta-row {
    min-height: 30px;
    display: flex;
    align-items: center;
    padding: 6px 9px;
    border-bottom: 1px solid #d7e0e8;
    font-size: 12.5px;
  }

  .meta-row:nth-child(odd) {
    border-right: 1px solid #d7e0e8;
  }

  .meta-label {
    min-width: 115px;
    font-weight: 800;
    color: #17365d;
  }

  .section {
    border: 1px solid #b8c7d9;
    margin-top: 11px;
    background: #ffffff;
    overflow: hidden;
  }

  .section-title {
    background: #17365d;
    color: #ffffff;
    padding: 8px 11px;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.3;
  }

  .section-body {
    padding: 10px 11px;
  }

  .line-row {
    display: flex;
    align-items: flex-start;
    min-height: 28px;
    padding: 5px 7px;
    border-bottom: 1px solid #e2e8ee;
    font-size: 12.5px;
    line-height: 1.5;
  }

  .line-row:nth-child(even) {
    background: #f7f9fb;
  }

  .line-label {
    width: 190px;
    min-width: 190px;
    padding-right: 10px;
    font-weight: 800;
    color: #243b53;
  }

  .line-value {
    flex: 1;
    color: #17202a;
    font-weight: 700;
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 14px;
    padding: 5px 7px 7px;
  }

  .option {
    display: inline-flex;
    align-items: center; vertical-align: middle; gap: 7px; min-height: 18px; line-height: 18px;
    font-size: 12.5px;
    font-weight: 700;
    color: #17202a;
    white-space: nowrap;
  }

  .check-box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px; height: 15px; min-width: 15px; max-width: 15px;
    border: 1.7px solid #17365d;
    border-radius: 2px;
    background: #ffffff;
    vertical-align: middle;
    flex: 0 0 15px;
  }

  .check-mark {
    position: absolute;
    width: 6px;
    height: 10px;
    left: 3px;
    top: 1px;
    border-right: 2px solid #17365d;
    border-bottom: 2px solid #17365d;
    transform: rotate(42deg);
  }

  .text-block {
    margin-top: 7px;
    padding: 9px 10px;
    min-height: 48px;
    border: 1px solid #c6d2dd;
    border-left: 4px solid #5b9bd5;
    background: #f8fafc;
    font-size: 12.5px;
    line-height: 1.55;
    color: #17202a;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    margin-top: 9px;
  }

  .photo-item {
    border: 1px solid #aebdca;
    background: #f7f9fb;
    padding: 5px;
  }

  .photo-item img {
    width: 100%;
    height: 145px;
    object-fit: cover;
    display: block;
  }

  .signature-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 18px;
    table-layout: fixed;
  }

  .signature-table td {
    width: 50%;
    text-align: center;
    vertical-align: top;
    border: 1px solid #b8c7d9;
    padding: 10px 8px;
    height: 145px;
    background: #f8fafc;
  }

  .signature-title {
    font-size: 12px;
    font-weight: 800;
    color: #17365d;
    line-height: 1.35;
  }

  .signature-space {
    height: 75px;
  }

  .signature-name {
    font-size: 12.5px;
    font-weight: 800;
    color: #17202a;
  }

  .footer {
    margin-top: 12px;
    padding-top: 7px;
    border-top: 2px solid #17365d;
    text-align: center;
    color: #566573;
    font-size: 9px;
    font-weight: 700;
  }
</style>
</head>

<body>
<div class="report">

  <div class="header">
    <div class="hotel">Dusit Princess Moonrise Phú Quốc</div>


    <div class="title">BÁO CÁO BẮT / KIỂM SOÁT ĐỘNG VẬT</div>
    <div class="subtitle">ANIMAL CAPTURE &amp; CONTROL INCIDENT REPORT</div>
    <div class="safety">AN TOÀN NỘI BỘ &amp; BẢO VỆ ĐỘNG VẬT</div>
  </div>

  <div class="meta">
    <div class="meta-grid">
      <div class="meta-cell">
        <span class="meta-label">Mã số báo cáo:</span>
        ${esc(report.reportNumber) || 'Chưa xác định'}
      </div>

      <div class="meta-cell">
        <span class="meta-label">Ngày lập báo cáo:</span>
        ${esc(report.date)}
        ${report.time ? ' - ' + esc(report.time) : ''}
      </div>

      <div class="meta-cell">
        <span class="meta-label">Thời gian phát hiện:</span>
        ${esc(report.detectionTime || report.time)}
      </div>

      <div class="meta-cell">
        <span class="meta-label">Người báo cáo:</span>
        ${esc(report.reporterName || 'Chưa xác định')}
      </div>

      <div class="meta-cell">
        <span class="meta-label">Khu vực phát hiện:</span>
        ${esc(report.location)}
      </div>

      <div class="meta-cell">
        <span class="meta-label">Bộ phận phản ứng:</span>
        ${esc(report.responseDepartments || 'Chưa xác định')}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      I. ĐẶC ĐIỂM ĐỘNG VẬT &amp; TÌNH HUỐNG PHÁT HIỆN
    </div>

    <div class="section-body">

      ${checkboxRow(
        'Loại động vật',
        animalTypes,
        report.animalType,
        false
      )}

      ${line('Chủng loại / Chủng loài', report.animalSpecies)}

      ${line('Màu sắc / Kích thước', report.animalColorSize)}

      ${line('Trọng lượng ước tính', report.estimatedWeight ? report.estimatedWeight + ' kg' : '')}

      ${line('Ngoại hình', report.animalAppearance)}

      ${checkboxRow(
        'Tình trạng ban đầu',
        initialConditions,
        report.initialCondition,
        false
      )}

      ${checkboxRow(
        'Mức độ nguy hiểm',
        dangerLevels,
        report.dangerLevel,
        false
      )}

      ${checkboxRow(
        'Ảnh hưởng đến Khách',
        guestImpacts,
        report.guestImpactType || report.guestImpact,
        false
      )}

      ${line('Ảnh hưởng đến Nhân viên', report.employeeImpact)}

    </div>
  </div>

  <div class="section">
    <div class="section-title">
      II. DIỄN BIẾN QUÁ TRÌNH BẮT / XỬ LÝ
    </div>

    <div class="section-body">

      ${checkboxRow(
        'Dụng cụ / Thiết bị sử dụng',
        captureTools,
        report.captureTools,
        true
      )}

      <div class="option-row">
        <div class="option-label">Nhân sự tham gia xử lý</div>
        <div class="text-block">${esc(
          (report as any).capturePersonnel ||
          report.captureProcess ||
          'Chưa ghi nhận'
        )}</div>
      </div>

      <div class="option-row">
        <div class="option-label">Diễn biến quá trình bắt</div>
        <div class="text-block">${esc(
          report.captureProcess || 'Chưa ghi nhận'
        )}</div>
      </div>

    </div>
  </div>

  <div class="section">
    <div class="section-title">
      III. PHƯƠNG ÁN XỬ LÝ SAU KHI BẮT
    </div>

    <div class="section-body">

      ${checkboxRow(
        'Phương án xử lý',
        postActions,
        report.postCaptureAction,
        false
      )}

      ${line('Họ tên / Đơn vị tiếp nhận', report.receivingPerson)}

      ${line('Số điện thoại', report.receivingPhone)}

      <div class="option-row">
        <div class="option">
          ${check(report.receivingConfirmation === true)}
          <span>Xác nhận ký nhận</span>
        </div>
      </div>

    </div>
  </div>

  <div class="section">
    <div class="section-title">
      IV. ĐÁNH GIÁ LỖ HỔNG &amp; ĐỀ XUẤT NGUYÊN TẮC PHÒNG NGỪA
    </div>

    <div class="section-body">

      ${checkboxRow(
        'Nguyên nhân xâm nhập',
        causes,
        report.cause,
        true
      )}

      <div class="option-row">
        <div class="option-label">Biện pháp phòng ngừa đề xuất</div>
        <div class="text-block">${esc(
          report.proposedMeasures || 'Chưa ghi nhận'
        )}</div>
      </div>

    </div>
  </div>

  <div class="section">
    <div class="section-title">
      V. HÌNH ẢNH HIỆN TRƯỜNG
    </div>

    <div class="section-body">
      ${photoHtml}
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      VI. XÁC NHẬN
    </div>

    <div class="section-body" style="padding:0;">
      <table class="signature-table">
  <tr>
    <td>
      <div class="signature-title">NGƯỜI LẬP BÁO CÁO</div>
      <div class="signature-space"></div>
      <div class="signature-name"></div>
    </td>
    <td>
      <div class="signature-title">TRƯỞNG BỘ PHẬN AN NINH</div>
      <div class="signature-space"></div>
      <div class="signature-name">TRẦN VĂN SƠN</div>
    </td>
  </tr>
</table>
    </div>
  </div>

  <div class="footer">
    Dusit Princess Moonrise Phú Quốc -
    ANIMAL CONTROL &amp; RESCUE PROTOCOL
  </div>

</div>
</body>
</html>
`;

    const container = document.createElement('div');

    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.background = '#ffffff';
    container.style.fontFamily = '"Noto Sans", sans-serif';

    container.innerHTML = html;

    document.body.appendChild(container);

    try {
      /*
       * PDF BẮT ĐỘNG VẬT:
       * HTML được browser render trước.
       * Không dùng jsPDF setFont() cho tiếng Việt.
       * Không nhúng TTF trực tiếp vào PDF.
       */

      container.style.fontFamily =
        'Arial, "Noto Sans", sans-serif';

      container.style.fontKerning = 'normal';
      container.style.textRendering = 'geometricPrecision';

      container.querySelectorAll('*').forEach((el) => {
        const element = el as HTMLElement;

        element.style.fontFamily =
          'Arial, "Noto Sans", sans-serif';

        element.style.fontKerning = 'normal';
        element.style.textRendering = 'geometricPrecision';
      });

      await document.fonts.ready;

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

      const scale = 3;

      const canvas = await html2canvas(container, {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: Math.max(container.scrollHeight, 1123),
        windowWidth: 794,
        windowHeight: Math.max(container.scrollHeight, 1123),
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const pagePixelHeight = Math.floor(
        canvas.width * (pageHeight / pageWidth)
      );

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(
          pagePixelHeight,
          canvas.height - offsetY
        );

        const pageCanvas = document.createElement('canvas');

        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');

        if (!ctx) {
          throw new Error('Không thể tạo canvas PDF.');
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const imageData = pageCanvas.toDataURL(
          'image/jpeg',
          0.95
        );

        const renderedHeight =
          (sliceHeight / canvas.width) * pageWidth;

        pdf.addImage(
          imageData,
          'JPEG',
          0,
          0,
          pageWidth,
          renderedHeight,
          undefined,
          'FAST'
        );

        offsetY += sliceHeight;
        pageIndex++;
      }

      pdf.save(
        `Bao-Cao-Bat-Dong-Vat-${report.reportNumber || report.id}.pdf`
      );
    } finally {
      container.remove();
    }

  } catch (error) {
    console.error(
      'Lỗi xuất PDF báo cáo bắt động vật:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    alert(
      `Không thể xuất PDF báo cáo bắt động vật.\n\n${message}`
    );
  }
}
async function animalPhotoToJpeg(
  dataUrl: string
): Promise<string> {
  if (!dataUrl) {
    throw new Error('Ảnh không có dữ liệu.');
  }

  return await new Promise<string>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const maxWidth = 1200;
        const maxHeight = 900;

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          reject(
            new Error('Không đọc được kích thước ảnh.')
          );
          return;
        }

        const ratio = Math.min(
          1,
          maxWidth / width,
          maxHeight / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas =
          document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext('2d');

        if (!context) {
          reject(
            new Error(
              'Không tạo được Canvas để xử lý ảnh.'
            )
          );
          return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(
          0,
          0,
          width,
          height
        );

        context.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        const jpeg =
          canvas.toDataURL(
            'image/jpeg',
            0.82
          );

        if (!jpeg || jpeg === 'data:,') {
          reject(
            new Error(
              'Không chuyển được ảnh sang JPEG.'
            )
          );
          return;
        }

        resolve(jpeg);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(
        new Error(
          'Trình duyệt không thể đọc ảnh báo cáo.'
        )
      );
    };

    img.src = dataUrl;
  });
}










