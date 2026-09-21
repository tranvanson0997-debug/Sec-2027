import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  Download,
  Lock,
  Edit3,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { PatrolSession, HotelSystemConfig, User } from '../types';
import { printPatrolReport } from '../utils/pdfGenerator';
import { exportHotelPatrolExcel } from '../utils/excelGenerator';
import { StorageService } from '../services/storage';
import { PDFExportDialog } from './PDFExportDialog';
import { ExcelExportDialog } from './ExcelExportDialog';
import { StandaloneReportView } from './StandaloneReportView';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PatrolSession | null;
  config: HotelSystemConfig;
  currentUser: User;
  onSessionUpdated: () => void;
  onReopenPatrol?: (session: PatrolSession) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  session,
  config,
  currentUser,
  onSessionUpdated,
  onReopenPatrol,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [showExcelExportModal, setShowExcelExportModal] = useState(false);
  const [showFullScreenReport, setShowFullScreenReport] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const handlePrintPDF = () => {
    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'XUẤT BÁO CÁO PDF',
      session.id,
      `Xuất báo cáo PDF phiên tuần tra ${session.id}`
    );
    setShowPDFExportModal(true);
  };

  const handleExportExcel = () => {
    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'XUẤT FILE EXCEL',
      session.id,
      `Xuất dữ liệu Excel cho phiên tuần tra ${session.id}`
    );
    setShowExcelExportModal(true);
  };

  const handleReopenSession = () => {
    if (
      !confirm(
        `Bạn có muốn mở lại phiên tuần tra ${session.id} để tiếp tục quét và kiểm tra các điểm checkpoint chưa hoàn thành?`
      )
    ) {
      return;
    }
    try {
      const reopened = StorageService.reopenPatrolSession(
        session.id,
        currentUser,
        'Mở lại từ chi tiết báo cáo để tiếp tục quét điểm kiểm soát'
      );
      onSessionUpdated();
      onClose();
      if (onReopenPatrol) {
        onReopenPatrol(reopened);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi mở lại phiên tuần tra');
    }
  };

  const handleApproveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReason.trim()) {
      setEditError('Vui lòng ghi rõ lý do yêu cầu chỉnh sửa dữ liệu đã khóa.');
      return;
    }

    try {
      StorageService.requestAndApproveEdit({
        sessionId: session.id,
        requester: currentUser,
        approver: currentUser,
        reason: editReason.trim(),
        beforeSummary: `Tổng: ${session.summary.checkedCount} điểm. Pass: ${session.summary.passCount}, Fail: ${session.summary.failCount}`,
        afterSummary: `Đã bổ sung ghi chú giám sát: ${editNote.trim()}`,
      });

      setShowEditModal(false);
      setEditReason('');
      setEditNote('');
      onSessionUpdated();
    } catch (err: any) {
      setEditError(err.message || 'Lỗi khi phê duyệt sửa đổi');
    }
  };

  const failCheckpoints = session.checkpoints.filter((c) => c.status === 'FAIL');

  return (
    <div id="report-detail-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div id="report-detail-modal-container" className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[92vh]">
        {/* Header - Mobile First Responsive Layout */}
        <div className="bg-slate-850 px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                    BÁO CÁO TUẦN TRA
                  </h3>
                  <span className="font-mono text-[11px] sm:text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
                    {session.id}
                  </span>
                  {session.isLocked && (
                    <span className="bg-emerald-950/90 text-emerald-300 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> ĐÃ KHÓA
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                  {config.hotelName ? `${config.hotelName} – ` : ''}{config.departmentName}
                </p>
              </div>
            </div>

            <button
              id="close-report-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition shrink-0"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons (Export PDF / Excel) */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
            <button
              id="export-pdf-action-btn"
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              title="Xuất file PDF tiêu chuẩn A4"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>[ XUẤT PDF ]</span>
            </button>
            <button
              id="export-excel-action-btn"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              title="Xuất file Excel .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>[ XUẤT EXCEL ]</span>
            </button>

            {/* Reopen Session to continue patrolling (addresses user issue) */}
            <button
              id="reopen-patrol-btn"
              onClick={handleReopenSession}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              title="Mở lại phiên tuần tra này để tiếp tục quét các điểm kiểm soát chưa hoàn thành"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>[ TIẾP TỤC QUÉT ĐIỂM ]</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs flex-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Nhân viên:</span>
              <strong className="text-white text-xs sm:text-sm block truncate">{session.officerName}</strong>
              <div className="text-slate-400 text-[10px] sm:text-[11px] font-mono">Thẻ: {session.badgeNumber || 'SEC-042'}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ca trực:</span>
              <strong className="text-amber-300 text-xs sm:text-sm block">{session.shift}</strong>
              <div className="text-slate-400 text-[10px] sm:text-[11px]">Ngày: {session.date}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Tuyến tuần tra:</span>
              <strong className="text-white text-xs sm:text-sm block truncate">{session.patrolRoute}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Thời gian:</span>
              <div className="text-white font-mono text-[11px] sm:text-xs">{session.startTime} - {session.endTime || '...'}</div>
              <div className="text-slate-400 text-[10px] sm:text-[11px] truncate">{session.submittedAt ? `Gửi: ${session.submittedAt.substring(11, 16)}` : 'Chưa gửi'}</div>
            </div>
          </div>

          {/* Statistics summary row - Fits neatly on all screen sizes */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              I. Tổng quan thống kê phiên tuần tra
            </h4>
            <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2 text-center">
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <div className="text-sm sm:text-base font-extrabold text-white">{session.summary.totalCheckpoints}</div>
                <div className="text-[10px] text-slate-400 font-medium">Tổng điểm</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <div className="text-sm sm:text-base font-extrabold text-blue-400">{session.summary.checkedCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Đã quét</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <div className="text-sm sm:text-base font-extrabold text-slate-400">{session.summary.uncheckedCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Chưa quét</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-700/60 p-2 rounded-xl">
                <div className="text-sm sm:text-base font-extrabold text-emerald-400">{session.summary.passCount}</div>
                <div className="text-[10px] text-emerald-300 font-medium">Đạt (PASS)</div>
              </div>
              <div className="bg-red-950/40 border border-red-700/60 p-2 rounded-xl">
                <div className="text-sm sm:text-base font-extrabold text-red-400">{session.summary.failCount}</div>
                <div className="text-[10px] text-red-300 font-medium">Lỗi (FAIL)</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <div className="text-sm sm:text-base font-extrabold text-amber-400">{session.summary.completionRate}%</div>
                <div className="text-[10px] text-slate-400 font-medium">Hoàn thành</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl col-span-2 xs:col-span-2 sm:col-span-1">
                <div className="text-sm sm:text-base font-extrabold text-teal-400">{session.summary.passRate}%</div>
                <div className="text-[10px] text-slate-400 font-medium">Tỷ lệ đạt</div>
              </div>
            </div>
          </div>

          {/* Checkpoint table / Mobile Card List */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              II. Danh sách điểm kiểm soát & Kết quả ({session.checkpoints.length} điểm)
            </h4>

            {/* Mobile View: High-density touch cards */}
            <div className="block sm:hidden space-y-2">
              {session.checkpoints.length === 0 ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-slate-500">
                  Chưa có điểm kiểm soát nào được ghi nhận.
                </div>
              ) : (
                session.checkpoints.map((cp, idx) => (
                  <div
                    key={cp.checkpointId}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{cp.area}</span>
                      </div>
                      <div className="font-semibold text-white text-xs truncate">
                        {cp.checkpointName}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="font-mono text-amber-400">{cp.checkpointId}</span>
                        <span>•</span>
                        <span className="font-mono">{cp.scannedAt}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {cp.status === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ĐẠT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-950 border border-red-700 text-red-300">
                          <XCircle className="w-3 h-3 text-red-400" /> LỖI
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop / Tablet View: Full Spreadsheet Table */}
            <div className="hidden sm:block bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-400 text-[11px] border-b border-slate-800">
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3">Khu vực</th>
                      <th className="py-2.5 px-3">Tên Checkpoint / Vị trí</th>
                      <th className="py-2.5 px-3 text-center w-28">Kết quả</th>
                      <th className="py-2.5 px-3 text-center w-28">Thời gian quét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {session.checkpoints.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          Chưa có điểm kiểm soát nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      session.checkpoints.map((cp, idx) => (
                        <tr key={cp.checkpointId} className="hover:bg-slate-900/50 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-slate-300 font-medium">{cp.area}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{cp.checkpointName}</div>
                            <div className="font-mono text-[10px] text-amber-400">{cp.checkpointId}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {cp.status === 'PASS' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> ĐẠT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 border border-red-700 text-red-300">
                                <XCircle className="w-3 h-3" /> KHÔNG ĐẠT
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">{cp.scannedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAIL Items with Photos (Section XI: Photo Evidence) */}
          {failCheckpoints.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  III. Sự cố FAIL & Bằng chứng hiện trường
                </h4>
                <span className="text-red-400 font-bold text-[11px] bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                  {failCheckpoints.length} điểm có lỗi
                </span>
              </div>

              <div className="space-y-3">
                {failCheckpoints.map((cp) => {
                  const failItems = cp.items.filter((i) => i.status === 'FAIL' && i.failRecord);
                  return failItems.map((item, fIdx) => {
                    const record = item.failRecord!;
                    return (
                      <div
                        key={record.incidentId || fIdx}
                        className="bg-red-950/20 border border-red-800/60 rounded-xl p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
                      >
                        <div className="md:col-span-2 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              [{cp.checkpointId}] {cp.checkpointName}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                              Mức độ: {record.severity}
                            </span>
                          </div>

                          <div className="text-red-300 font-semibold text-xs">
                            Hạng mục: {record.itemText}
                          </div>

                          <div className="text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs">
                            <strong className="text-white">Hiện trạng:</strong> {record.description}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            <div className="text-slate-400">
                              Xử lý tức thời: <strong className="text-slate-200">{record.actionTaken}</strong>
                            </div>
                            <div className="text-slate-400">
                              Bộ phận: <strong className="text-amber-300">{record.department}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Photo with exactly 3 lines as specified in Section XI */}
                        <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col">
                          <img
                            src={record.photoUrl}
                            alt="Evidence"
                            className="w-full h-40 sm:h-36 object-cover bg-black"
                          />
                          <div className="bg-slate-900 px-3 py-2 text-[10px] text-slate-300 space-y-0.5 border-t border-red-500/80 leading-snug">
                            <div className="truncate">Tên: <strong className="text-white">{record.photoMetadata?.officerName || session.officerName}</strong></div>
                            <div>Ngày: {record.photoMetadata?.date || session.date} | Giờ: {record.photoMetadata?.time || session.startTime}</div>
                            <div className="text-amber-300 font-semibold truncate">
                              Vị trí: {record.photoMetadata?.location || `${cp.area} – ${cp.checkpointId}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          )}

          {/* Section XIX: Yêu cầu chỉnh sửa dữ liệu đã submit */}
          {session.isLocked && (
            <div className="border border-slate-800 rounded-xl p-3.5 sm:p-4 bg-slate-950/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    IV. Khóa dữ liệu & Lịch sử chỉnh sửa
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Dữ liệu đã khóa sau khi gửi. Nghiêm cấm nhân viên tự ý sửa đổi.
                  </p>
                </div>

                {(currentUser.role === 'MANAGER' || currentUser.role === 'SUPERVISOR') && (
                  <button
                    id="request-edit-btn"
                    onClick={() => setShowEditModal(true)}
                    className="w-full sm:w-auto justify-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    [ YÊU CẦU CHỈNH SỬA ]
                  </button>
                )}
              </div>

              {session.editAuditHistory && session.editAuditHistory.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Nhật ký các lần chỉnh sửa đã phê duyệt:</span>
                  {session.editAuditHistory.map((audit) => (
                    <div key={audit.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-slate-400 mb-1">
                        <span>Yêu cầu: <strong className="text-white">{audit.requestedBy}</strong></span>
                        <span>Duyệt: <strong className="text-amber-400">{audit.approvedBy}</strong></span>
                        <span className="font-mono">{audit.timestamp}</span>
                      </div>
                      <div className="text-slate-300"><strong>Lý do:</strong> {audit.reason}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{audit.afterSummary}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic mt-2">
                  Dữ liệu nguyên bản chưa qua bất kỳ chỉnh sửa nào.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-3.5 sm:px-6 py-2.5 sm:py-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Phiên: <strong className="font-mono text-slate-300">{session.id}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Edit Request Modal for Section XIX */}
      {showEditModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-600/60 w-full max-w-md rounded-2xl shadow-2xl p-5">
            <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              YÊU CẦU CHỈNH SỬA DỮ LIỆU ĐÃ KHÓA
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Quy trình kiểm soát theo Mục XIX: Lưu người yêu cầu, người phê duyệt, lý do và thời gian.
            </p>

            {editError && (
              <div className="p-2.5 mb-3 bg-red-950 border border-red-800 rounded-lg text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleApproveEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lý do yêu cầu chỉnh sửa: <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ví dụ: Bổ sung xác nhận sự cố đèn Exit đã được Kỹ thuật khắc phục lúc 08:30..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nội dung điều chỉnh / Ghi chú giám sát:
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ghi rõ nội dung cập nhật sau khi phê duyệt"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow"
                >
                  Xác nhận & Phê duyệt sửa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Dialog for Mobile & Desktop */}
      <PDFExportDialog
        isOpen={showPDFExportModal}
        onClose={() => setShowPDFExportModal(false)}
        session={session}
        config={config}
        onOpenFullScreen={() => {
          setShowPDFExportModal(false);
          setShowFullScreenReport(true);
        }}
      />

      {/* Excel Export Dialog for Mobile & Desktop */}
      <ExcelExportDialog
        isOpen={showExcelExportModal}
        onClose={() => setShowExcelExportModal(false)}
        sessions={[session]}
        incidents={StorageService.getIncidents().filter((i) => i.sessionId === session.id)}
        checkpoints={StorageService.getCheckpoints()}
        auditLogs={StorageService.getAuditLogs()}
        config={config}
        customFilename={`BAO_CAO_TUAN_TRA_${session.id}.xlsx`}
        title={`XUẤT DỮ LIỆU EXCEL - PHIÊN ${session.id}`}
      />

      {/* Full-Screen In-App Print/Export Document View */}
      {showFullScreenReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <StandaloneReportView
            session={session}
            config={config}
            onBack={() => setShowFullScreenReport(false)}
          />
        </div>
      )}
    </div>
  );
};
