import * as XLSX from 'xlsx';
import {
  PatrolSession,
  Incident,
  Checkpoint,
  AuditLog,
  HotelSystemConfig,
} from '../types';

export function cleanExcelText(val: any): any {
  if (typeof val !== 'string') return val;

  let text = val;

  // Loại bỏ một số nội dung demo cũ
  text = text.replace(/Nguyá»…n VÄƒn An/gi, '');
  text = text.replace(/LÃª HoÃ ng Nam/gi, '');
  text = text.replace(/Tráº§n Quang Minh/gi, '');
  text = text.replace(
    /01 Äº¡i Lá»™ HoÃ ng Gia,?\s*BÃ£i DÃ i,?\s*Äº·c Khu PhÃº Quá»‘c/gi,
    ''
  );
  text = text.replace(
    /\(?\+84\)?\s*28\s*3822\s*8888\s*-\s*Line\s*An\s*Ninh:\s*911\s*\/\s*114/gi,
    ''
  );
  text = text.replace(/Hotline\s*An\s*Ninh:[^|\n,]*/gi, '');
  text = text.replace(/Hotline:[^|\n,]*/gi, '');
  text = text.replace(/Ext:?\s*114\s*\/?\s*115/gi, '');
  text = text.replace(/114\s*\/\s*115/g, '');
  text = text.replace(
    /â˜…\s*â˜…\s*â˜…\s*â˜…\s*â˜…\s*GRAND LUXURY PALACE HOTEL & RESORT/gi,
    ''
  );
  text = text.replace(/GRAND LUXURY PALACE HOTEL & RESORT/gi, '');
  text = text.replace(/GRAND LUXURY PALACE/gi, '');
  text = text.replace(/â˜…\s*â˜…\s*â˜…\s*â˜…\s*â˜…/g, '');

  return text.trim();
}

function sanitizeRow<T extends Record<string, any>>(row: T): T {
  const result: any = {};

  for (const [key, value] of Object.entries(row)) {
    result[key] =
      typeof value === 'string' ? cleanExcelText(value) : value;
  }

  return result;
}

export async function exportHotelPatrolExcel(params: {
  sessions: PatrolSession[];
  incidents: Incident[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
  config: HotelSystemConfig;
}): Promise<boolean> {
  try {
    const wb = XLSX.utils.book_new();

    // =========================================================
    // SHEET 1 - PHIÊN TUẦN TRA
    // =========================================================

    const sessionRows = params.sessions.map((s, idx) =>
      sanitizeRow({
        STT: idx + 1,
        'Mã Phiên': s.id,
        'Ngày Tuần Tra': s.date,
        'Ca Làm Việc': s.shift,
        'Tên Nhân Viên': s.officerName,
        'Mã Số Thẻ': s.badgeNumber,
        'Tuyến Tuần Tra': s.patrolRoute,
        'Giờ Bắt Đầu': s.startTime,
        'Số Lượng Kiểm Tra': s.summary.checkedCount,
        'Chưa Kiểm Tra': s.summary.uncheckedCount,
        'Số Lượng PASS': s.summary.passCount,
        'Số Lượng FAIL': s.summary.failCount,
        'Tỷ Lệ Hoàn Thành (%)': `${s.summary.completionRate}%`,
        'Tỷ Lệ Đạt (%)': `${s.summary.passRate}%`,
        'Trạng Thái': s.isLocked ? 'ĐÃ KHÓA' : 'ĐANG THỰC HIỆN',
      })
    );

    const wsSessions = XLSX.utils.json_to_sheet(sessionRows);

    wsSessions['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      wsSessions,
      'Phiên Tuần Tra'
    );

    // =========================================================
    // SHEET 2 - SỰ CỐ
    // =========================================================

    const incidentRows = params.incidents.map((inc, idx) =>
      sanitizeRow({
        STT: idx + 1,
        'Mã Sự Cố': inc.id,
        'Mức Độ': inc.severity,
        'Mô Tả Sự Cố': inc.description,
        'Hành Động Tại Chỗ': inc.actionTaken,
        'Bộ Phận Phối Hợp': inc.department,
        'Trạng Thái Xử Lý': inc.status,
      })
    );

    const wsIncidents = XLSX.utils.json_to_sheet(incidentRows);

    wsIncidents['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 15 },
      { wch: 45 },
      { wch: 45 },
      { wch: 25 },
      { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      wsIncidents,
      'Sự Cố'
    );

    // =========================================================
    // SHEET 3 - CHECKPOINT
    // =========================================================

    const checkpointRows = params.checkpoints.map((cp, idx) =>
      sanitizeRow({
        STT: idx + 1,
        'Mã Checkpoint': cp.id,
        'Tên Checkpoint': cp.name,
        'Khu Vực': cp.area,
      })
    );

    const wsCheckpoints =
      XLSX.utils.json_to_sheet(checkpointRows);

    wsCheckpoints['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 35 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      wsCheckpoints,
      'Checkpoint'
    );

    // =========================================================
    // SHEET 4 - AUDIT LOG
    // =========================================================

    const auditRows = params.auditLogs.map((log, idx) =>
      sanitizeRow({
        STT: idx + 1,
        'Thời Gian': log.timestamp,
        'Tên Người Dùng': log.userName,
        'Vai Trò': log.userRole,
        'Hành Động': log.action,
        'Đối Tượng Tác Động': log.target,
        'Chi Tiết': log.details,
      })
    );

    const wsAudit =
      XLSX.utils.json_to_sheet(auditRows);

    wsAudit['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 30 },
      { wch: 50 },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      wsAudit,
      'Nhật Ký Hệ Thống'
    );

    // =========================================================
    // TẠO FILE EXCEL
    // =========================================================

    const dateStr = new Date()
      .toISOString()
      .split('T')[0];

    const filename =
      `BAO_CAO_TUAN_TRA_AN_NINH_${dateStr}.xlsx`;

    const arrayBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob(
      [arrayBuffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );

    const file = new File(
      [blob],
      filename,
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );

    // =========================================================
    // MOBILE
    // =========================================================

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      );

    if (
      isMobile &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: 'Báo cáo tuần tra an ninh',
        text: 'Báo cáo tuần tra an ninh khách sạn',
      });

      return true;
    }

    // =========================================================
    // DESKTOP + FALLBACK MOBILE
    // =========================================================

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 1500);

    return true;
  } catch (error) {
    console.error(
      'Lỗi xuất Excel:',
      error
    );

    return false;
  }
}