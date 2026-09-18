import * as XLSX from 'xlsx';
import { PatrolSession, Incident, Checkpoint, AuditLog, HotelSystemConfig } from '../types';

/**
 * Helper to purge prohibited/deleted demo text from Excel exports:
 * - "Nguyễn Văn An"
 * - "Lê Hoàng Nam"
 * - "Trần Quang Minh"
 * - "01 Đại Lộ Hoàng Gia, Bãi Dài, Đặc Khu Phú Quốc"
 * - Hotline / Line An Ninh: 911 / 114
 * - "★ ★ ★ ★ ★ GRAND LUXURY PALACE HOTEL & RESORT"
 */
export function cleanExcelText(val: any): any {
  if (typeof val !== 'string') return val;
  let text = val;
  text = text.replace(/Nguyễn Văn An/gi, '');
  text = text.replace(/Lê Hoàng Nam/gi, '');
  text = text.replace(/Trần Quang Minh/gi, '');
  text = text.replace(/01 Đại Lộ Hoàng Gia,?\s*Bãi Dài,?\s*Đặc Khu Phú Quốc/gi, '');
  text = text.replace(/\(?\+84\)?\s*28\s*3822\s*8888\s*-\s*Line\s*An\s*Ninh:\s*911\s*\/\s*114/gi, '');
  text = text.replace(/Hotline\s*An\s*Ninh:[^|\n,]*/gi, '');
  text = text.replace(/Hotline:[^|\n,]*/gi, '');
  text = text.replace(/Ext:?\s*114\s*\/?\s*115/gi, '');
  text = text.replace(/114\s*\/\s*115/g, '');
  text = text.replace(/An Giang/g, 'Kiên Giang');
  text = text.replace(/★\s*★\s*★\s*★\s*★\s*GRAND LUXURY PALACE HOTEL & RESORT/gi, '');
  text = text.replace(/GRAND LUXURY PALACE HOTEL & RESORT/gi, '');
  text = text.replace(/GRAND LUXURY PALACE/gi, '');
  text = text.replace(/★\s*★\s*★\s*★\s*★/g, '');
  return text.trim();
}

function sanitizeRow<T extends Record<string, any>>(row: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = typeof value === 'string' ? cleanExcelText(value) : value;
  }
  return result;
}

export function exportHotelPatrolExcel(params: {
  sessions: PatrolSession[];
  incidents: Incident[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
  config: HotelSystemConfig;
}): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Danh sách các phiên tuần tra
  const sessionRows = params.sessions.map((s, idx) =>
    sanitizeRow({
      STT: idx + 1,
      'Mã Phiên': s.id,
      'Ngày Tuần Tra': s.date,
      'Ca Làm Việc': s.shift,
      'Tên Nhân Viên': cleanExcelText(s.officerName),
      'Mã Số Thẻ': s.badgeNumber,
      'Tuyến Tuần Tra': s.patrolRoute,
      'Giờ Bắt Đầu': s.startTime,
      'Giờ Kết Thúc': s.endTime || '',
      'Tổng Checkpoint': s.summary.totalCheckpoints,
      'Đã Kiểm Tra': s.summary.checkedCount,
      'Chưa Kiểm Tra': s.summary.uncheckedCount,
      'Số Lượng ĐẠT (PASS)': s.summary.passCount,
      'Số Lượng LỖI (FAIL)': s.summary.failCount,
      'Tỷ Lệ Hoàn Thành (%)': `${s.summary.completionRate}%`,
      'Tỷ Lệ Đạt (%)': `${s.summary.passRate}%`,
      'Trạng Thái Khóa': s.isLocked ? 'ĐÃ KHÓA SUBMIT' : 'ĐANG THỰC HIỆN',
      'Thời Gian Gửi': s.submittedAt || '',
    })
  );
  const wsSessions = XLSX.utils.json_to_sheet(sessionRows);
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Lịch Sử Tuần Tra');

  // Sheet 2: Danh sách Sự cố & FAIL
  const incidentRows = params.incidents.map((inc, idx) =>
    sanitizeRow({
      STT: idx + 1,
      'Mã Sự Cố': inc.id,
      'Mã Phiên': inc.sessionId,
      'Mã Checkpoint': inc.checkpointId,
      'Tên Điểm Kiểm Soát': inc.checkpointName,
      'Khu Vực': inc.area,
      'Nhân Viên Báo Cáo': cleanExcelText(inc.officerName),
      'Hạng Mục Kiểm Tra': inc.checklistText,
      'Mức Độ Nghiêm Trọng': inc.severity,
      'Mô Tả Sự Cố': cleanExcelText(inc.description),
      'Hành Động Tại Chỗ': cleanExcelText(inc.actionTaken),
      'Bộ Phận Phối Hợp': inc.department,
      'Trạng Thái Xử Lý': inc.status,
      'Thời Gian Tạo': inc.createdAt,
      'Thời Gian Xử Lý': inc.resolvedAt || '',
      'Người Phê Duyệt': cleanExcelText(inc.resolvedBy || ''),
      'Ghi Chú Xử Lý': cleanExcelText(inc.resolutionNotes || ''),
    })
  );
  const wsIncidents = XLSX.utils.json_to_sheet(incidentRows);
  XLSX.utils.book_append_sheet(wb, wsIncidents, 'Danh Sách Sự Cố FAIL');

  // Sheet 3: Danh mục Checkpoints
  const checkpointRows = params.checkpoints.map((cp, idx) =>
    sanitizeRow({
      STT: idx + 1,
      'Mã Điểm': cp.id,
      'Tên Vị Trí': cp.name,
      'Khu Vực': cp.area,
      'Tuyến Tuần Tra': cp.route,
      'Thứ Tự': cp.order,
      'Mã Giá Trị QR': cp.qrCodeValue,
      'Mô Tả Vị Trí': cp.description,
      'Trạng Thái': cp.status === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ KHÓA',
      'Thời Gian Tạo': cp.createdAt,
    })
  );
  const wsCheckpoints = XLSX.utils.json_to_sheet(checkpointRows);
  XLSX.utils.book_append_sheet(wb, wsCheckpoints, 'Danh Mục Checkpoint');

  // Sheet 4: Nhật ký Audit Log
  const auditRows = params.auditLogs.map((log, idx) =>
    sanitizeRow({
      STT: idx + 1,
      'Mã Log': log.id,
      'Thời Gian': log.timestamp,
      'Mã Nhân Viên': log.userId,
      'Họ Tên': cleanExcelText(log.userName),
      'Vai Trò': log.userRole,
      'Hành Động': log.action,
      'Đối Tượng Tác Động': cleanExcelText(log.target),
      'Chi Tiết': cleanExcelText(log.details),
    })
  );
  const wsAudit = XLSX.utils.json_to_sheet(auditRows);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Nhật Ký Hệ Thống (Audit)');

  // Download file
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `BAO_CAO_TUAN_TRA_AN_NINH_${dateStr}.xlsx`);
}
