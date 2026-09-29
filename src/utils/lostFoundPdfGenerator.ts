import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { LostFoundReport } from '../types';
import notoSansRegular from '../assets/fonts/NotoSans-Regular.ttf';
import notoSansBold from '../assets/fonts/NotoSans-Bold.ttf';

function safe(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function esc(value: unknown): string {
  return safe(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'BẢN NHÁP',
    FOUND: 'ĐÃ TIẾP NHẬN',
    IN_CUSTODY: 'ĐANG LƯU GIỮ',
    RETURNED: 'ĐÃ TRẢ',
    CLOSED: 'ĐÃ ĐÓNG',
    CANCELLED: 'ĐÃ HỦY',
  };

  return labels[status] || status;
}

function typeLabel(type: LostFoundReport['type']): string {
  return type === 'LOST' ? 'MẤT TÀI SẢN' : 'TÌM THẤY TÀI SẢN';
}

function checkbox(label: string, checked: boolean): string {
  return `
    <span class="check-item">
      <span class="check-box ${checked ? 'checked' : ''}">
        ${checked ? '✓' : ''}
      </span>
      <span>${esc(label)}</span>
    </span>
  `;
}

function row(label: string, value: unknown): string {
  return `
    <tr>
      <td class="label">${esc(label)}</td>
      <td class="value">${esc(value)}</td>
    </tr>
  `;
}

async function loadFonts(): Promise<void> {
  if (typeof document === 'undefined') return;

  try {
    const regular = new FontFace(
      'Noto Sans',
      `url(${notoSansRegular})`,
      { weight: '400', style: 'normal' }
    );

    const bold = new FontFace(
      'Noto Sans',
      `url(${notoSansBold})`,
      { weight: '700', style: 'normal' }
    );

    await Promise.all([regular.load(), bold.load()]);

    document.fonts.add(regular);
    document.fonts.add(bold);

    await document.fonts.ready;
  } catch (error) {
    console.warn('Không thể tải Noto Sans:', error);
  }
}

function buildHtml(report: LostFoundReport): HTMLDivElement {
  const root = document.createElement('div');

  root.style.position = 'absolute';
  root.style.left = '-100000px';
  root.style.top = '0';
  root.style.width = '794px';
  root.style.background = '#ffffff';
  root.style.fontFamily = '"Noto Sans", Arial, sans-serif';
  root.style.color = '#0f172a';

  const photos = Array.isArray(report.photos) ? report.photos : [];

  const detailRows = [
    ['Địa điểm', report.location],
    ['Khu vực / vị trí', report.area],
    ['Người báo / người giao', report.reporterName],
    ['Điện thoại', report.reporterPhone],
    ['Email', report.reporterEmail],
    ['Tên tài sản / đồ vật', report.itemName],
    ['Loại tài sản', report.itemCategory],
    ['Mô tả chi tiết', report.itemDescription],
    ['Màu sắc', report.itemColor],
    ['Thương hiệu', report.itemBrand],
    ['Số serial / IMEI', report.itemSerialNumber],
    ['Số lượng', report.itemQuantity],
    ['Tình trạng tài sản', report.itemCondition],
    ['Vị trí lưu giữ', report.storageLocation],
    ['Người tiếp nhận', report.receivedBy],
    ['Thời gian tiếp nhận', report.receivedAt],
    ['Người nhận lại tài sản', report.returnedTo],
    ['Điện thoại người nhận', report.returnedPhone],
    ['Thời gian bàn giao', report.returnedAt],
    ['Ghi chú bàn giao', report.returnNotes],
    ['Ghi chú khác', report.notes],
  ]
    .filter(([, value]) => value !== undefined && value !== null && String(value) !== '')
    .map(([label, value]) => row(label, value))
    .join('');

  const photoHtml = photos.length
    ? `
      <div class="section-title">HÌNH ẢNH / BẰNG CHỨNG</div>
      <div class="photo-grid">
        ${photos.map((photo, index) => `
          <div class="photo-card">
            <img
              src="${esc(photo.dataUrl)}"
              alt="Ảnh ${index + 1}"
            />
            <div class="photo-caption">
              ${index + 1}. ${esc(photo.fileName || `Ảnh ${index + 1}`)}
            </div>
          </div>
        `).join('')}
      </div>
    `
    : `
      <div class="section-title">HÌNH ẢNH / BẰNG CHỨNG</div>
      <div class="no-photo">Chưa có hình ảnh đính kèm.</div>
    `;

  root.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
      }

      .report {
        width: 794px;
        background: #ffffff;
        padding: 32px 38px 34px;
      }

      .header {
        background: #0f172a;
        color: #ffffff;
        padding: 22px 24px 20px;
        border-radius: 8px 8px 0 0;
        border-bottom: 5px solid #334155;
      }

      .department {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .4px;
        margin-bottom: 8px;
      }

      .title {
        font-size: 25px;
        font-weight: 700;
        text-align: center;
        letter-spacing: .3px;
      }

      .subtitle {
        margin-top: 7px;
        font-size: 10px;
        text-align: center;
        color: #cbd5e1;
      }

      .report-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        border: 1px solid #cbd5e1;
        border-top: none;
        background: #f8fafc;
      }

      .meta-cell {
        padding: 11px 14px;
        border-bottom: 1px solid #e2e8f0;
      }

      .meta-cell:nth-child(odd) {
        border-right: 1px solid #e2e8f0;
      }

      .meta-label {
        font-size: 8px;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 3px;
      }

      .meta-value {
        font-size: 10px;
        font-weight: 700;
        color: #0f172a;
      }

      .section-title {
        margin-top: 18px;
        margin-bottom: 8px;
        padding: 8px 11px;
        background: #0f172a;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .3px;
        border-radius: 4px;
      }

      .checks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 18px;
        padding: 11px 12px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        border-radius: 4px;
      }

      .check-group {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .check-group-title {
        min-width: 105px;
        font-size: 9px;
        font-weight: 700;
        color: #334155;
      }

      .check-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 9px;
        color: #1e293b;
        white-space: nowrap;
      }

      .check-box {
        width: 14px;
        height: 14px;
        border: 1.5px solid #64748b;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
      }

      .check-box.checked {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 9px;
      }

      th {
        background: #0f172a;
        color: #ffffff;
        font-size: 9px;
        font-weight: 700;
        padding: 8px;
        border: 1px solid #0f172a;
        text-align: center;
      }

      td {
        border: 1px solid #cbd5e1;
        padding: 7px 8px;
        vertical-align: top;
        line-height: 1.45;
        word-break: break-word;
        white-space: pre-wrap;
      }

      td.label {
        width: 31%;
        background: #f1f5f9;
        font-weight: 700;
        color: #334155;
      }

      td.value {
        width: 69%;
        color: #1e293b;
      }

      .photo-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .photo-card {
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        padding: 7px;
        border-radius: 4px;
      }

      .photo-card img {
        display: block;
        width: 100%;
        height: 245px;
        object-fit: contain;
        background: #ffffff;
        border: 1px solid #e2e8f0;
      }

      .photo-caption {
        padding: 6px 3px 2px;
        font-size: 8px;
        color: #475569;
        word-break: break-word;
      }

      .no-photo {
        border: 1px solid #cbd5e1;
        padding: 18px;
        text-align: center;
        font-size: 9px;
        color: #64748b;
        background: #f8fafc;
      }

      .signature {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .signature-box {
        border: 1px solid #cbd5e1;
        min-height: 105px;
        padding: 10px;
        text-align: center;
      }

      .signature-title {
        font-size: 9px;
        font-weight: 700;
        color: #334155;
      }

      .signature-name {
        margin-top: 68px;
        font-size: 9px;
        font-weight: 700;
      }

      .bottom-info {
        margin-top: 14px;
        padding: 8px 10px;
        background: #f1f5f9;
        border-left: 4px solid #0f172a;
        font-size: 8px;
        color: #475569;
      }
    </style>

    <div class="report">
      <div class="header">
        <div class="department">BỘ PHẬN AN NINH KHÁCH SẠN</div>
        <div class="title">BÁO CÁO LOST &amp; FOUND</div>
        <div class="subtitle">GHI NHẬN - LƯU GIỮ - BÀN GIAO TÀI SẢN</div>
      </div>

      <div class="report-meta">
        <div class="meta-cell">
          <div class="meta-label">SỐ BÁO CÁO</div>
          <div class="meta-value">${esc(report.reportNumber)}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">NGÀY / GIỜ</div>
          <div class="meta-value">${esc(report.date)} &nbsp; ${esc(report.time)}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">LOẠI BÁO CÁO</div>
          <div class="meta-value">${esc(typeLabel(report.type))}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">TRẠNG THÁI</div>
          <div class="meta-value">${esc(statusLabel(safe(report.status)))}</div>
        </div>
      </div>

      <div class="section-title">PHÂN LOẠI / TRẠNG THÁI</div>

      <div class="checks">
        <div class="check-group">
          <span class="check-group-title">LOẠI BÁO CÁO</span>
          ${checkbox('Mất tài sản', report.type === 'LOST')}
          ${checkbox('Tìm thấy tài sản', report.type === 'FOUND')}
        </div>

        <div class="check-group">
          <span class="check-group-title">TRẠNG THÁI</span>
          ${checkbox('Bản nháp', report.status === 'DRAFT')}
          ${checkbox('Đã tiếp nhận', report.status === 'FOUND')}
          ${checkbox('Đang lưu giữ', report.status === 'IN_CUSTODY')}
          ${checkbox('Đã trả', report.status === 'RETURNED')}
          ${checkbox('Đã đóng', report.status === 'CLOSED')}
          ${checkbox('Đã hủy', report.status === 'CANCELLED')}
        </div>
      </div>

      <div class="section-title">THÔNG TIN CHI TIẾT</div>

      <table>
        <thead>
          <tr>
            <th style="width:31%">NỘI DUNG</th>
            <th style="width:69%">THÔNG TIN CHI TIẾT</th>
          </tr>
        </thead>
        <tbody>
          ${detailRows}
        </tbody>
      </table>

      ${photoHtml}

      <div class="section-title">XÁC NHẬN</div>

      <div class="signature">
        <div class="signature-box">
          <div class="signature-title">NHÂN VIÊN LẬP / TIẾP NHẬN</div>
          <div class="signature-name">${esc(report.officerName)}</div>
        </div>

        <div class="signature-box">
          <div class="signature-title">NGƯỜI BÁO / NGƯỜI GIAO</div>
          <div class="signature-name">${esc(report.reporterName)}</div>
        </div>
      </div>

      <div class="bottom-info">
        Mã nhân viên: ${esc(report.officerId)}
        ${report.badgeNumber ? ` &nbsp; | &nbsp; Số hiệu: ${esc(report.badgeNumber)}` : ''}
        &nbsp; | &nbsp; Ngày tạo: ${esc(report.createdAt)}
      </div>
    </div>
  `;

  return root;
}

export async function generateLostFoundPdf(
  report: LostFoundReport
): Promise<void> {
  await loadFonts();

  const root = buildHtml(report);
  document.body.appendChild(root);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    await document.fonts.ready;

    root.style.fontFamily = 'Noto Sans, Arial, sans-serif';
    root.querySelectorAll('*').forEach((el) => {
      (el as HTMLElement).style.fontFamily = 'Noto Sans, Arial, sans-serif';
    });

    const images = Array.from(root.querySelectorAll('img'));

    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }

            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    const reportElement = root.querySelector('.report') as HTMLElement;

    if (!reportElement) {
      throw new Error('Không tìm thấy nội dung báo cáo Lost & Found.');
    }

    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const pageHeightPx = Math.floor(
      canvas.width * (pageHeight / pageWidth)
    );

    let sourceY = 0;
    let page = 0;

    while (sourceY < canvas.height) {
      if (page > 0) {
        pdf.addPage();
      }

      const sliceHeight = Math.min(
        pageHeightPx,
        canvas.height - sourceY
      );

      const pageCanvas = document.createElement('canvas');

      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const context = pageCanvas.getContext('2d');

      if (!context) {
        throw new Error('Không thể tạo canvas PDF.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const imageData = pageCanvas.toDataURL(
        'image/jpeg',
        0.94
      );

      const imageHeight =
        (sliceHeight / canvas.width) * pageWidth;

      pdf.addImage(
        imageData,
        'JPEG',
        0,
        0,
        pageWidth,
        imageHeight,
        undefined,
        'FAST'
      );

      page += 1;
      sourceY += sliceHeight;
    }

    const totalPages = pdf.getNumberOfPages();

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      pdf.setPage(pageNumber);

      /*
       * Footer chỉ dùng ký tự ASCII để không phụ thuộc
       * font PDF. Toàn bộ tiếng Việt của báo cáo đã được
       * browser + Noto Sans render thành hình ảnh.
       */
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);

      pdf.text(
        `Lost & Found | ${safe(report.reportNumber)}`,
        14,
        pageHeight - 7
      );

      pdf.text(
        `Page ${pageNumber}/${totalPages}`,
        pageWidth - 14,
        pageHeight - 7,
        { align: 'right' }
      );
    }

    const fileName =
      `${safe(report.reportNumber) || 'lost-found-report'}.pdf`;

    pdf.save(fileName);
  } finally {
    root.remove();
  }
}

