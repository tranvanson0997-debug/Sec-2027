/**
 * Utility functions for capturing, compressing, and watermarking evidence photos
 */

export function createWatermarkedPhoto(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  metadata: {
    officerName: string;
    date: string;
    time: string;
    location?: string;
    gpsCoordinates?: string;
    status?: string;
  }
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const width = sourceImage.width || 800;
  const height = sourceImage.height || 600;

  // Max dimension 1024 for storage efficiency
  const maxDim = 1024;
  let targetWidth = width;
  let targetHeight = height;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Draw base photo
  ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

  // Chỉ còn lại 3 dòng nằm dưới góc theo yêu cầu:
  // 1. Tên nhân viên
  // 2. giờ-ngày/tháng/năm
  // 3. tình trạng
  const fontSize = Math.max(13, Math.round(targetHeight * 0.028));
  const lineHeight = fontSize * 1.5;
  const paddingX = 14;
  const paddingY = 12;
  const boxHeight = lineHeight * 3 + paddingY * 2;

  const line1 = `Tên nhân viên: ${metadata.officerName}`;
  const line2 = `${metadata.time} - ${metadata.date}`;
  const line3 = `Tình trạng: ${metadata.status || 'SỰ CỐ (FAIL)'}`;

  ctx.font = `bold ${fontSize}px sans-serif`;
  const w1 = ctx.measureText(line1).width;
  ctx.font = `600 ${fontSize}px monospace`;
  const w2 = ctx.measureText(line2).width;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const w3 = ctx.measureText(line3).width;
  const boxWidth = Math.max(w1, w2, w3) + paddingX * 2 + 10;

  // Nằm dưới góc trái của hình ảnh
  const boxX = 14;
  const boxY = targetHeight - boxHeight - 14;

  // Nền đen mờ cao cấp với viền đỏ an ninh
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  } else {
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
  }
  ctx.fill();
  ctx.stroke();

  // Dải đỏ nhấn bên trái
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(boxX, boxY, 4, boxHeight);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Dòng 1: Tên nhân viên
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(line1, boxX + paddingX, boxY + paddingY);

  // Dòng 2: giờ-ngày/tháng/năm
  ctx.font = `600 ${fontSize}px monospace`;
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(line2, boxX + paddingX, boxY + paddingY + lineHeight);

  // Dòng 3: tình trạng
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = '#f87171'; // Red alert text
  ctx.fillText(line3, boxX + paddingX, boxY + paddingY + lineHeight * 2);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generate a clean simulated photo for hotel incident demo with 3 lines in corner
 */
export function generateSampleIncidentPhoto(
  title: string,
  location: string,
  officerName: string,
  date: string,
  time: string,
  status: string = 'SỰ CỐ (FAIL)'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient representing hotel corridor / basement / entrance
  const gradient = ctx.createLinearGradient(0, 0, 640, 480);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(0.5, '#334155');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 640, 480);

  // Grid/tiles texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }
  for (let y = 0; y < 480; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Draw simulated incident focus zone (target circle / warning box)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(180, 120, 280, 190);
  ctx.setLineDash([]);

  // Warning emblem
  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
  ctx.fillRect(180, 120, 280, 190);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ BẰNG CHỨNG SỰ CỐ AN NINH', 320, 180);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px sans-serif';
  ctx.fillText(title, 320, 220);

  // 3 dòng nằm dưới góc
  const boxX = 16;
  const boxY = 480 - 100;
  const boxWidth = 320;
  const boxHeight = 84;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  } else {
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(boxX, boxY, 4, boxHeight);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Dòng 1: Tên nhân viên
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Tên nhân viên: ${officerName}`, boxX + 14, boxY + 10);

  // Dòng 2: giờ-ngày/tháng/năm
  ctx.font = '600 13px monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`${time} - ${date}`, boxX + 14, boxY + 34);

  // Dòng 3: tình trạng
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#f87171';
  ctx.fillText(`Tình trạng: ${status}`, boxX + 14, boxY + 58);

  return canvas.toDataURL('image/jpeg', 0.85);
}
