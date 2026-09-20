/**
 * Utility functions for capturing, compressing, and watermarking evidence photos
 */

export function createWatermarkedPhoto(
  sourceImage: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  metadata: {
    officerName: string;
    date: string;
    time: string;
    location: string;
    gpsCoordinates?: string;
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

  // Top-Right Official SOP 5-Star Security Seal Badge
  const sealWidth = Math.min(220, Math.round(targetWidth * 0.35));
  const sealHeight = 36;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#eab308'; // Amber gold border
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(targetWidth - sealWidth - 12, 12, sealWidth, sealHeight, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.fillText('★ CHỨNG THỰC AN NINH SOP 5-SAO ★', targetWidth - sealWidth / 2 - 12, 26);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('DUSIT PRINCESS MOONRISE VERIFIED', targetWidth - sealWidth / 2 - 12, 39);

  // Overlay bottom timestamp badge (4 lines including GPS as specified)
  ctx.textAlign = 'left';
  const barHeight = Math.max(76, Math.round(targetHeight * 0.14));
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, targetHeight - barHeight, targetWidth, barHeight);

  // Red/Gold accent security bar
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, targetHeight - barHeight, 6, barHeight);

  const fontSize = Math.max(11, Math.round(targetHeight * 0.024));
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.textBaseline = 'middle';

  const lineSpacing = barHeight / 4.2;
  const startY = targetHeight - barHeight + lineSpacing * 0.7;
  const startX = 16;

  // Line 1: Tên nhân viên
  ctx.fillText(`Cán bộ tuần tra: ${metadata.officerName}`, startX, startY);

  // Line 2: Ngày & Giờ
  ctx.fillText(`Thời gian: ${metadata.date} lúc ${metadata.time} (Thời gian thực)`, startX, startY + lineSpacing);

  // Line 3: Vị trí
  ctx.fillStyle = '#fde047';
  ctx.fillText(`Vị trí: ${metadata.location}`, startX, startY + lineSpacing * 2);

  // Line 4: Tọa độ GPS & Mã định vị
  ctx.fillStyle = '#38bdf8';
  ctx.font = `500 ${fontSize - 1}px monospace`;
  ctx.fillText(metadata.gpsCoordinates || 'GPS: 10.34582°N, 107.07322°E (±5m Khách Sạn)', startX, startY + lineSpacing * 3);

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Generate a high quality realistic simulated photo for hotel incident demo
 */
export function generateSampleIncidentPhoto(title: string, location: string, officerName: string, date: string, time: string): string {
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
  ctx.strokeRect(180, 120, 280, 200);
  ctx.setLineDash([]);

  // Warning emblem
  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
  ctx.fillRect(180, 120, 280, 200);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ BẰNG CHỨNG SỰ CỐ AN NINH', 320, 180);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px sans-serif';
  ctx.fillText(title, 320, 220);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('Ảnh ghi nhận từ Camera Tuần Tra Khách Sạn 5*', 320, 255);

  // Watermark bar 3 lines
  ctx.textAlign = 'left';
  const barHeight = 80;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 480 - barHeight, 640, barHeight);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, 480 - barHeight, 6, barHeight);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Tên: ${officerName}`, 16, 420);
  ctx.fillText(`Ngày: ${date} | Giờ: ${time}`, 16, 442);
  ctx.fillStyle = '#fde047';
  ctx.fillText(`Vị trí: ${location}`, 16, 464);

  return canvas.toDataURL('image/jpeg', 0.85);
}

