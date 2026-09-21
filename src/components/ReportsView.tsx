import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Eye,
  Calendar,
  Layers,
  RotateCcw,
  Sparkles,
  Database,
} from 'lucide-react';
import { PatrolSession, User, HotelSystemConfig } from '../types';
import { StorageService } from '../services/storage';
import { printPatrolReport } from '../utils/pdfGenerator';
import { exportHotelPatrolExcel } from '../utils/excelGenerator';
import { ReportDetailModal } from './ReportDetailModal';
import { PDFExportDialog } from './PDFExportDialog';
import { ExcelExportDialog } from './ExcelExportDialog';
import { StandaloneReportView } from './StandaloneReportView';

interface ReportsViewProps {
  currentUser: User;
  config: HotelSystemConfig;
  onSelectSessionForDetail?: (session: PatrolSession) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  config,
}) => {
  const [sessions, setSessions] = useState<PatrolSession[]>(() => {
    const list = StorageService.getPatrolSessions();
    if (list.length === 0) {
      return StorageService.seedDefaultSessions();
    }
    return list;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<PatrolSession | null>(null);
  const [exportPDFSession, setExportPDFSession] = useState<PatrolSession | null>(null);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [fullScreenSession, setFullScreenSession] = useState<PatrolSession | null>(null);

  const refreshData = () => {
    const updated = StorageService.getPatrolSessions();
    if (updated.length === 0) {
      setSessions(StorageService.seedDefaultSessions());
    } else {
      setSessions(updated);
    }
  };

  // Real-time synchronization & Auto-seed baseline data if missing
  useEffect(() => {
    const currentList = StorageService.getPatrolSessions();
    if (currentList.length === 0) {
      const seeded = StorageService.seedDefaultSessions();
      setSessions(seeded);
    }

    const unsubscribe = StorageService.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, []);

  const handleSeedDefaultData = () => {
    const seeded = StorageService.resetToDefaultPatrols();
    setSessions(seeded);
    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'NẠP DỮ LIỆU CƠ SỞ',
      'BÁO CÁO TUẦN TRA',
      'Đã khởi tạo nạp lại dữ liệu báo cáo cơ sở tiêu chuẩn (3 phiên tuần tra 2 ca ngày/đêm).'
    );
  };

  const handlePrintPDF = (session: PatrolSession) => {
    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'XUẤT BÁO CÁO PDF',
      session.id,
      `In xuất báo cáo PDF cho phiên ${session.id}`
    );
    setExportPDFSession(session);
  };

  const handleExportAllExcel = () => {
    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'XUẤT TOÀN BỘ EXCEL',
      'DATABASE',
      `Xuất toàn bộ cơ sở dữ liệu Excel (4 sheets)`
    );
    setShowExcelDialog(true);
  };

  const filtered = sessions.filter((s) => {
    const matchSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patrolRoute.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.date.includes(searchTerm);
    const matchShift = shiftFilter === 'ALL' || s.shift.includes(shiftFilter);
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && s.status === 'COMPLETED') ||
      (statusFilter === 'IN_PROGRESS' && s.status === 'IN_PROGRESS');
    return matchSearch && matchShift && matchStatus;
  });

  return (
    <div id="reports-view" className="space-y-6">
      {/* Header with quick Export All & Seed Base Data */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            LỊCH SỬ BÁO CÁO TUẦN TRA & XUẤT DỮ LIỆU
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Xem chi tiết, in báo cáo PDF tiêu chuẩn A4 và xuất toàn bộ cơ sở dữ liệu Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="seed-default-data-btn"
            type="button"
            onClick={handleSeedDefaultData}
            className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            title="Khởi tạo hoặc nạp lại 3 phiên tuần tra cơ sở mẫu"
          >
            <Database className="w-4 h-4" />
            <span>[ NẠP DỮ LIỆU CƠ SỞ ]</span>
          </button>

          <button
            id="export-all-excel-btn"
            onClick={handleExportAllExcel}
            className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>[ XUẤT TẤT CẢ FILE EXCEL (.XLSX) ]</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã phiên, Tên nhân viên, Ngày..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả các ca (Ca ngày & Ca đêm)</option>
            <option value="ngày">Ca ngày (06:00 - 18:00)</option>
            <option value="đêm">Ca đêm (18:00 - 06:00)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả trạng thái ({sessions.length})</option>
            <option value="COMPLETED">Đã hoàn thành & Khóa dữ liệu</option>
            <option value="IN_PROGRESS">Đang tuần tra thực tế</option>
          </select>
        </div>
      </div>

      {/* Reports Table & Mobile Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Mobile View: High-density touch cards for phones (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-800">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <Database className="w-10 h-10 text-amber-500/60 mx-auto" />
              <p className="text-slate-300 text-xs font-semibold">
                Chưa có dữ liệu báo cáo cơ sở hoặc không khớp bộ lọc.
              </p>
              <button
                type="button"
                onClick={handleSeedDefaultData}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nạp Dữ Liệu Cơ Sở Mẫu Ngay</span>
              </button>
            </div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-amber-400 text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {s.id}
                  </span>
                  {s.isLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <Lock className="w-2.5 h-2.5" /> ĐÃ KHÓA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      <Clock className="w-2.5 h-2.5" /> Đang chạy
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-white font-bold truncate">{s.officerName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.patrolRoute}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-300 text-xs font-semibold">{s.date}</div>
                    <div className="text-[10px] text-amber-300/90">{s.shift} ({s.startTime} - {s.endTime || '...'})</div>
                  </div>
                </div>

                {/* Progress bar and results */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tiến độ tuần tra</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {s.summary.checkedCount}/{s.summary.totalCheckpoints} ({s.summary.completionRate}%)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Kết quả kiểm tra</span>
                    <div className="flex items-center gap-1.5 justify-end text-xs font-bold">
                      <span className="text-emerald-400">{s.summary.passCount} PASS</span>
                      <span className="text-slate-600">/</span>
                      <span className={s.summary.failCount > 0 ? 'text-red-400' : 'text-slate-400'}>
                        {s.summary.failCount} FAIL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    id={`view-detail-report-mobile-${s.id}`}
                    onClick={() => setSelectedSessionForModal(s)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>[ Xem Chi Tiết ]</span>
                  </button>
                  <button
                    id={`print-pdf-report-mobile-${s.id}`}
                    onClick={() => handlePrintPDF(s)}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>[ In PDF ]</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Spreadsheet Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4 font-bold">Mã Phiên</th>
                <th className="py-3 px-4 font-bold">Ngày & Ca Trực</th>
                <th className="py-3 px-4 font-bold">Nhân Viên Tuần Tra</th>
                <th className="py-3 px-4 font-bold">Tuyến Phân Công</th>
                <th className="py-3 px-4 font-bold text-center">Tiến Độ</th>
                <th className="py-3 px-4 font-bold text-center">Kết Quả</th>
                <th className="py-3 px-4 font-bold text-center">Trạng Thái Khóa</th>
                <th className="py-3 px-4 font-bold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="space-y-3">
                      <Database className="w-10 h-10 text-amber-500/60 mx-auto" />
                      <p className="font-semibold text-sm">Chưa có dữ liệu báo cáo tuần tra cơ sở.</p>
                      <button
                        type="button"
                        onClick={handleSeedDefaultData}
                        className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Nạp Ngay Dữ Liệu Báo Cáo Cơ Sở Mẫu</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {s.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{s.date}</div>
                      <div className="text-[11px] text-slate-400">{s.shift} ({s.startTime} - {s.endTime || '...'})</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{s.officerName}</div>
                      <div className="font-mono text-[10px] text-slate-400">Thẻ: {s.badgeNumber || 'SEC-042'}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                      {s.patrolRoute}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-mono font-bold text-white">
                        {s.summary.checkedCount}/{s.summary.totalCheckpoints}
                      </div>
                      <div className="text-[10px] text-slate-400">({s.summary.completionRate}%)</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-xs">
                        <span className="text-emerald-400">{s.summary.passCount} PASS</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className={s.summary.failCount > 0 ? 'text-red-400 font-black' : 'text-slate-400'}>
                          {s.summary.failCount} FAIL
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Đạt {s.summary.passRate}%</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {s.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <Lock className="w-3 h-3" /> ĐÃ KHÓA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          <Clock className="w-3 h-3" /> Đang chạy
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          id={`view-detail-report-${s.id}`}
                          onClick={() => setSelectedSessionForModal(s)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          title="Xem toàn văn báo cáo"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Xem</span>
                        </button>

                        <button
                          id={`print-pdf-report-${s.id}`}
                          onClick={() => handlePrintPDF(s)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition"
                          title="Xuất in PDF tiêu chuẩn A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSessionForModal && (
        <ReportDetailModal
          isOpen={Boolean(selectedSessionForModal)}
          onClose={() => setSelectedSessionForModal(null)}
          session={selectedSessionForModal}
          config={config}
          currentUser={currentUser}
          onSessionUpdated={refreshData}
        />
      )}

      {/* PDF Export Dialog for Mobile & Desktop */}
      <PDFExportDialog
        isOpen={Boolean(exportPDFSession)}
        onClose={() => setExportPDFSession(null)}
        session={exportPDFSession}
        config={config}
        onOpenFullScreen={(s) => {
          setExportPDFSession(null);
          setFullScreenSession(s);
        }}
      />

      {/* Excel Export Dialog for Mobile & Desktop */}
      <ExcelExportDialog
        isOpen={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        sessions={sessions}
        incidents={StorageService.getIncidents()}
        checkpoints={StorageService.getCheckpoints()}
        auditLogs={StorageService.getAuditLogs()}
        config={config}
        title="XUẤT TOÀN BỘ CƠ SỞ DỮ LIỆU EXCEL (.XLSX)"
      />

      {/* Full-Screen In-App Print/Export Document View */}
      {fullScreenSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <StandaloneReportView
            session={fullScreenSession}
            config={config}
            onBack={() => setFullScreenSession(null)}
          />
        </div>
      )}
    </div>
  );
};

