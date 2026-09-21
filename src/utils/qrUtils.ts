import QRCode from 'qrcode';

export interface QRCardData {
  checkpointId: string;
  checkpointName: string;
  area: string;
  route: string;
  hotelName: string;
  department: string;
}

/**
 * Generate QR code data URL (PNG)
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

/**
 * Download QR code image directly to user's device
 */
export async function downloadQRCodePNG(checkpointId: string, name: string): Promise<void> {
  const dataUrl = await generateQRCodeDataUrl(checkpointId);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `QR_CHECKPOINT_${checkpointId}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Open print-ready A4 / card page with standard hotel security badge frame for physical mounting
 */
export async function printQRCodeCard(cardData: QRCardData): Promise<void> {
  const qrDataUrl = await generateQRCodeDataUrl(cardData.checkpointId);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để mở cửa sổ in thẻ QR Checkpoint!');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>THẺ QR TUẦN TRA - ${cardData.checkpointId}</title>
      <style>
        @page {
          size: A5 portrait;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
          margin: 0;
          padding: 20px;
          background: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .card {
          width: 148mm;
          min-height: 190mm;
          background: #ffffff;
          border: 4px double #b45309;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .header {
          border-bottom: 2px solid #e2e8f0;
          width: 100%;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .hotel-name {
          font-size: 16px;
          font-weight: 800;
          color: #92400e;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .dept-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-top: 4px;
        }
        .badge-title {
          background: #0f172a;
          color: #f8fafc;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 4px;
          letter-spacing: 1px;
          margin: 10px 0;
          display: inline-block;
        }
        .qr-wrapper {
          background: #ffffff;
          padding: 12px;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          margin: 12px 0;
        }
        .qr-img {
          width: 220px;
          height: 220px;
          display: block;
        }
        .checkpoint-code {
          font-size: 26px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 2px;
          font-family: monospace;
          background: #f1f5f9;
          padding: 6px 18px;
          border-radius: 6px;
          margin-bottom: 8px;
          border: 1px solid #cbd5e1;
        }
        .checkpoint-name {
          font-size: 17px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 6px;
          max-width: 90%;
        }
        .checkpoint-meta {
          font-size: 13px;
          color: #475569;
          margin-bottom: 16px;
        }
        .footer-instruction {
          width: 100%;
          border-top: 1px dashed #cbd5e1;
          padding-top: 12px;
          margin-top: auto;
          font-size: 11px;
          color: #64748b;
          line-height: 1.5;
        }
        .security-warning {
          color: #b91c1c;
          font-weight: 700;
          font-size: 12px;
          margin-top: 4px;
        }
        @media print {
          body {
            background: none;
            padding: 0;
          }
          .card {
            box-shadow: none;
            border: 3px solid #0f172a;
          }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="hotel-name">★ ★ ★ ★ ★</div>
          <div class="hotel-name">${cardData.hotelName}</div>
          <div class="dept-name">${cardData.department}</div>
        </div>

        <div class="badge-title">ĐIỂM KIỂM SOÁT AN NINH TUẦN TRA</div>

        <div class="qr-wrapper">
          <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
        </div>

        <div class="checkpoint-code">${cardData.checkpointId}</div>
        <div class="checkpoint-name">${cardData.checkpointName}</div>
        <div class="checkpoint-meta">
          <strong>Khu vực:</strong> ${cardData.area} | <strong>Tuyến:</strong> ${cardData.route}
        </div>

        <div class="footer-instruction">
          <div>DÀNH CHO NHÂN VIÊN AN NINH QUÉT MÃ KHI TUẦN TRA ĐỊNH KỲ</div>
          <div class="security-warning">⚠ NGHIÊM CẤM TỰ Ý THÁO GỠ, XÓA MỜ HOẶC LÀM HỎNG THẺ NÀY</div>
          <div>Bảo an 24/7 | Tiêu chuẩn Khách sạn 5 Sao</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
