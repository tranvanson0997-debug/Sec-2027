import { PatrolSession, HotelSystemConfig, FailRecord } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
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
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
      grid-template-columns: 1fr 220px;
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
      height: 130px;
      object-fit: cover;
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
              <div style="font-size:10.5px; color:#64748b; font-family:monospace;">Mã: ${cp.checkpointId}</div>
              ${cp.notes ? `<div style="font-size:10.5px; color:#334155; margin-top:2px;"><em>Ghi chú: ${cp.notes}</em></div>` : ''}
            </td>
            <td style="text-align:center;">${getStatusBadge(cp.status)}</td>
            <td style="text-align:center; font-family:monospace;">${cp.scannedAt || '—'}</td>
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
                <strong>Bộ phận phối hợp:</strong> <span style="background-color:#e2e8f0; padding:2px 6px; border-radius:3px; font-weight:600;">${f.failRecord.department}</span>
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
        <div class="sign-name">${displayOfficer}</div>
      </div>
      <div>
        <div class="sign-title">GIÁM SÁT AN NINH</div>
        <div class="sign-note">(Xác nhận & kiểm tra)</div>
        <div class="sign-space"></div>
        <div class="sign-name">Trần Văn Bình</div>
      </div>
      <div>
        <div class="sign-title">TRƯỞNG BỘ PHẬN AN NINH</div>
        <div class="sign-note">(Phê duyệt báo cáo)</div>
        <div class="sign-space"></div>
        <div class="sign-name">Nguyễn Văn An</div>
      </div>
    </div>

    <div class="footer-note">
      <div>Báo cáo điện tử tự động - Hệ thống Quản lý Tuần tra An ninh Dusit Princess Moonrise Phú Quốc</div>
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
 * Generate an authentic multi-page A4 PDF binary file and trigger direct download on mobile/desktop.
 * Fixes the empty/blank file issue by:
 * 1. Setting container opacity to 1 (100% opaque, never 0.01)
 * 2. Scoping all styles directly with high contrast light colors (#0f172a text on #ffffff background)
 * 3. Loading all image elements safely without canvas tainting (allowTaint: false, useCORS: true)
 * 4. Measuring precise scrollHeight and rendering crisp 1.5x scale canvas
 * 5. Accurately slicing into standard A4 pages in jsPDF
 */
export async function generateAndDownloadPDF(
  session: PatrolSession,
  config: HotelSystemConfig,
  onProgress?: (message: string) => void
): Promise<{ blob: Blob; url: string; dataUri: string; filename: string }> {
  if (onProgress) onProgress('Dang khoi tao cau truc bao cao A4...');

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

  const oldContainer = document.getElementById('pdf-render-offscreen-container');
  if (oldContainer) {
    oldContainer.remove();
  }

  const container = document.createElement('div');
  container.id = 'pdf-render-offscreen-container';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '40';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.style.visibility = 'visible';

  container.innerHTML = `
    <style>
      ${getReportStyles()}
    </style>
    <div class="report-container">
      ${generatePatrolReportInnerBody(session, config)}
    </div>
  `;

  document.body.appendChild(container);

  if (onProgress) {
    onProgress(
      isMobile
        ? 'Dang tai anh hien truong che do tiet kiem bo nho...'
        : 'Dang tai va dong bo anh hien truong...'
    );
  }

  const imgElements = Array.from(container.querySelectorAll('img'));

  await Promise.all(
    imgElements.map((img) => {
      return new Promise<void>((resolve) => {
        if (img.src && !img.src.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }

        if (img.complete && img.naturalHeight !== 0) {
          resolve();
          return;
        }

        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        img.onload = finish;
        img.onerror = () => {
          img.style.display = 'none';
          finish();
        };

        setTimeout(finish, isMobile ? 1200 : 800);
      });
    })
  );

  await new Promise((resolve) => setTimeout(resolve, isMobile ? 100 : 200));

  let canvas: HTMLCanvasElement;

  try {
    const totalHeight = Math.max(
      container.scrollHeight,
      container.offsetHeight,
      1123
    );

    /*
     * Mobile uses scale 1.0 to substantially reduce RAM usage.
     * Desktop keeps the original 1.5x rendering quality.
     */
    const renderScale = isMobile ? 1 : 1.5;

    canvas = await html2canvas(container, {
      scale: renderScale,
      useCORS: true,
      allowTaint: false,
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
      imageTimeout: isMobile ? 1200 : 3000,
    });
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }

  if (onProgress) {
    onProgress(
      isMobile
        ? 'Dang dong goi PDF A4 che do tiet kiem bo nho...'
        : 'Dang chia trang va dong goi PDF...'
    );
  }

  const a4WidthMm = 210;
  const a4HeightMm = 297;

  const pageCanvasHeight = Math.floor(
    (canvas.width * a4HeightMm) / a4WidthMm
  );

  const totalPages = Math.max(
    1,
    Math.ceil(canvas.height / pageCanvasHeight)
  );

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  /*
   * Reuse one page canvas instead of creating a new canvas for every page.
   * This reduces peak memory usage on Android.
   */
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = canvas.width;
  pageCanvas.height = pageCanvasHeight;

  const pageCtx = pageCanvas.getContext('2d');

  if (!pageCtx) {
    canvas.width = 1;
    canvas.height = 1;
    pageCanvas.width = 1;
    pageCanvas.height = 1;
    throw new Error('Khong the khoi tao bo nho do hoa de tao PDF.');
  }

  for (let page = 0; page < totalPages; page++) {
    pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    const sourceY = page * pageCanvasHeight;
    const sourceHeight = Math.min(
      canvas.height - sourceY,
      pageCanvasHeight
    );

    if (sourceHeight > 0) {
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
    }

    /*
     * Slightly lower JPEG quality on mobile.
     * The report remains readable while reducing PDF memory/file size.
     */
    const jpegQuality = isMobile ? 0.78 : 0.92;
    const pageImgData = pageCanvas.toDataURL('image/jpeg', jpegQuality);

    if (page > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(
      pageImgData,
      'JPEG',
      0,
      0,
      a4WidthMm,
      a4HeightMm
    );
  }

  /*
   * Release large canvas memory before creating the final PDF outputs.
   */
  canvas.width = 1;
  canvas.height = 1;
  pageCanvas.width = 1;
  pageCanvas.height = 1;

  if (onProgress) {
    onProgress('Dang tao tep PDF tai ve...');
  }

  const filename = `BAO_CAO_TUAN_TRA_${session.id}.pdf`;
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  /*
   * Keep dataUri for the existing preview component.
   * The public return structure is intentionally unchanged.
   */
  const dataUri = pdf.output('datauristring');

  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      link.remove();
    }, 1000);
  } catch (e) {
    console.warn('Auto download attempt ignored by browser policy:', e);
  }

  if (onProgress) {
    onProgress('Hoan tat!');
  }

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
  config: HotelSystemConfig
): Promise<boolean> {
  try {
    const { blob, filename } = await generateAndDownloadPDF(session, config);
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Báo cáo tuần tra an ninh ${session.id}`,
        text: `Báo cáo ca tuần tra an ninh ngày ${session.date} - ${session.shift}. Người thực hiện: ${session.officerName}`,
      });
      return true;
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('Native share failed or dismissed:', err);
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
