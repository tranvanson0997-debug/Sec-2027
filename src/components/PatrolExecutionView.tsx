import React, { useState, useEffect } from 'react';
import {
  Shield,
  Play,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Lock,
  ChevronRight,
  Camera,
  MapPin,
  Check,
  RotateCcw,
  Pause,
  Trash2,
  ArrowLeft,
  CheckCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  User,
  Checkpoint,
  ChecklistTemplate,
  PatrolSession,
  CheckpointInspectionResult,
  ChecklistItemStatus,
  FailRecord,
  HotelSystemConfig,
  Incident,
} from '../types';
import { StorageService } from '../services/storage';
import { QRScannerModal } from './QRScannerModal';
import { FailIncidentModal } from './FailIncidentModal';
import { EmergencyReportModal } from './EmergencyReportModal';
import { soundAlert } from '../utils/audioAlert';

interface PatrolExecutionViewProps {
  currentUser: User;
  config: HotelSystemConfig;
  checkpoints: Checkpoint[];
  checklists: ChecklistTemplate[];
  onSessionFinished: (session: PatrolSession) => void;
}

export const PatrolExecutionView: React.FC<PatrolExecutionViewProps> = ({
  currentUser,
  config,
  checkpoints,
  checklists,
  onSessionFinished,
}) => {
  // Available shifts (2 ca cố định: Ca ngày 06:00 - 18:00 & Ca đêm 18:00 - 06:00)
  const currentHour = new Date().getHours();
  const defaultShift =
    currentHour >= 6 && currentHour < 18
      ? 'Ca ngày (06:00 - 18:00)'
      : 'Ca đêm (18:00 - 06:00)';

  const shifts = [
    'Ca ngày (06:00 - 18:00)',
    'Ca đêm (18:00 - 06:00)',
  ];

  const routes = [
    'Tuyến Tổng Hợp Toàn Khách Sạn (Toàn diện)',
    'Tuyến Sảnh & Khu Vực Công Cộng (VIP Focus)',
    'Tuyến Bãi Biển & Khu Giải Trí Ngoài Trời',
    'Tuyến Tầng Hầm, Kỹ Thuật & PCCC',
    'Tuyến Cao Tầng & Sky Bar Rooftop',
  ];

  // Patrol Setup
  const [selectedShift, setSelectedShift] = useState(defaultShift);
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);
  const [activeSession, setActiveSession] = useState<PatrolSession | null>(null);

  // In-progress or recent sessions to resume / reopen
  const [existingInProgress, setExistingInProgress] = useState<PatrolSession | null>(null);
  const [recentIncomplete, setRecentIncomplete] = useState<PatrolSession | null>(null);

  // Active Checkpoint Being Inspected
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [currentChecklistItems, setCurrentChecklistItems] = useState<{
    [itemId: string]: {
      status: ChecklistItemStatus;
      failRecord?: FailRecord;
    };
  }>({});
  const [checkpointNotes, setCheckpointNotes] = useState('');

  // Modals & Real-time Directives
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [targetCheckpointToScan, setTargetCheckpointToScan] = useState<Checkpoint | null>(null);
  const [activeFailItem, setActiveFailItem] = useState<{ item: any; checkpoint: Checkpoint } | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [isConfirmLockModalOpen, setIsConfirmLockModalOpen] = useState(false);
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);
  const [isEmergencyReportOpen, setIsEmergencyReportOpen] = useState(false);
  const [activeDirectives, setActiveDirectives] = useState<Incident[]>([]);
  const [acknowledgedToast, setAcknowledgedToast] = useState<string | null>(null);

  // Early submit confirmation checkbox (when not all checkpoints are checked)
  const [confirmEarlySubmit, setConfirmEarlySubmit] = useState(false);

  // Sync Directives from Manager in Real-time
  const loadActiveDirectives = () => {
    const list = StorageService.getIncidents();
    const pending = list.filter((i) => i.managerDirective && !i.managerDirective.isAcknowledged);
    setActiveDirectives(pending);
  };

  const loadSessionsOverview = () => {
    const all = StorageService.getPatrolSessions();
    const inProg =
      all.find((s) => s.officerId === currentUser.id && s.status === 'IN_PROGRESS') ||
      all.find((s) => s.status === 'IN_PROGRESS') ||
      null;
    setExistingInProgress(inProg);

    // Look for recently completed session that has incomplete checkpoints (e.g., locked early or by accident)
    const incomplete = all
      .filter((s) => s.status === 'COMPLETED' && s.checkpoints.length < checkpoints.length)
      .sort((a, b) => (b.submittedAt || b.date).localeCompare(a.submittedAt || a.date))[0] || null;
    setRecentIncomplete(incomplete);

    // If there is an in-progress session and user does not have an activeSession yet, auto-load it
    if (inProg && !activeSession) {
      setActiveSession(inProg);
    }
  };

  useEffect(() => {
    loadActiveDirectives();
    loadSessionsOverview();
    const unsub = StorageService.subscribeToDataChanges(() => {
      loadActiveDirectives();
      loadSessionsOverview();
    });
    return () => unsub();
  }, [currentUser]);

  // Handle Officer clicking [ ĐÃ NHẬN CHỈ ĐẠO ]
  const handleAcknowledgeDirective = (incidentId: string) => {
    try {
      StorageService.acknowledgeIncidentDirective(incidentId, currentUser);
      soundAlert.playAcknowledgeChime();
      setAcknowledgedToast(`Đã gửi phản hồi [ĐÃ NHẬN CHỈ ĐẠO] thành công về Quản lý an ninh.`);
      setTimeout(() => setAcknowledgedToast(null), 4000);
      loadActiveDirectives();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle [ BẮT ĐẦU TUẦN TRA ]
  const handleStartPatrol = () => {
    const newSession = StorageService.createPatrolSession({
      officer: currentUser,
      shift: selectedShift,
      route: selectedRoute,
    });
    setActiveSession(newSession);
    setExistingInProgress(newSession);
  };

  // Reopen a recent session that was mistakenly locked or incomplete
  const handleReopenSession = (sessionId: string) => {
    try {
      const reopened = StorageService.reopenPatrolSession(
        sessionId,
        currentUser,
        'Mở lại phiên tuần tra để tiếp tục quét các điểm kiểm soát'
      );
      setActiveSession(reopened);
      setExistingInProgress(reopened);
      setRecentIncomplete(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi mở lại phiên');
    }
  };

  // Cancel / discard an empty or unwanted session
  const handleCancelSession = (sessionId?: string) => {
    const targetId = sessionId || activeSession?.id;
    if (!targetId) return;

    if (
      !confirm(
        'Bạn có chắc chắn muốn hủy bỏ phiên tuần tra này? Thao tác này sẽ dọn dẹp phiên để bạn bắt đầu mới.'
      )
    ) {
      return;
    }

    try {
      StorageService.cancelPatrolSession(targetId, currentUser, 'Hủy bởi nhân viên tuần tra');
      setActiveSession(null);
      setExistingInProgress(null);
      loadSessionsOverview();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy phiên');
    }
  };

  // Pause and safely leave active session without locking
  const handlePauseSession = () => {
    // Simply set activeSession to null in view state - session stays IN_PROGRESS in Storage
    setActiveSession(null);
    loadSessionsOverview();
  };

  // Trigger QR scanning for a checkpoint
  const handleRequestScan = (cp: Checkpoint) => {
    setTargetCheckpointToScan(cp);
    setIsScannerOpen(true);
  };

  // When QR code is successfully scanned
  const handleScanSuccess = (scannedCheckpointId: string) => {
    setIsScannerOpen(false);
    const cp = checkpoints.find((c) => c.id === scannedCheckpointId);
    if (!cp) return;

    // Load checkpoint's checklist
    const tpl = checklists.find((c) => c.id === cp.checklistId) || checklists[0];

    // Check if previously inspected in this session
    const prevInspection = activeSession?.checkpoints.find((c) => c.checkpointId === cp.id);
    if (prevInspection) {
      const itemsMap: any = {};
      prevInspection.items.forEach((it) => {
        itemsMap[it.itemId] = {
          status: it.status,
          failRecord: it.failRecord,
        };
      });
      setCurrentChecklistItems(itemsMap);
      setCheckpointNotes(prevInspection.notes || '');
    } else {
      // Initialize with unselected
      const itemsMap: any = {};
      tpl.items.forEach((it) => {
        itemsMap[it.id] = { status: '' as any };
      });
      setCurrentChecklistItems(itemsMap);
      setCheckpointNotes('');
    }

    setActiveCheckpoint(cp);
  };

  // Item PASS / FAIL / NA Click
  const handleItemStatusChange = (item: any, status: ChecklistItemStatus) => {
    if (status === 'FAIL') {
      setActiveFailItem({ item, checkpoint: activeCheckpoint! });
      return;
    }

    setCurrentChecklistItems((prev) => ({
      ...prev,
      [item.id]: {
        status,
        failRecord: undefined,
      },
    }));
  };

  // Submit FAIL from Modal
  const handleFailRecordSubmitted = (failRecord: FailRecord) => {
    if (!activeFailItem) return;

    setCurrentChecklistItems((prev) => ({
      ...prev,
      [activeFailItem.item.id]: {
        status: 'FAIL',
        failRecord,
      },
    }));

    StorageService.recordIncident({
      id: failRecord.incidentId,
      sessionId: activeSession!.id,
      checkpointId: activeCheckpoint!.id,
      checkpointName: activeCheckpoint!.name,
      area: activeCheckpoint!.area,
      officerId: currentUser.id,
      officerName: currentUser.fullName,
      checklistText: activeFailItem.item.text,
      severity: failRecord.severity,
      description: failRecord.description,
      actionTaken: failRecord.actionTaken,
      department: failRecord.department,
      photoUrl: failRecord.photoUrl,
      photoMetadata: failRecord.photoMetadata,
      status: 'OPEN',
      createdAt: failRecord.createdAt,
    });

    setActiveFailItem(null);
  };

  // Save current checkpoint inspection
  const handleSaveCheckpointInspection = () => {
    if (!activeCheckpoint || !activeSession) return;

    const tpl = checklists.find((c) => c.id === activeCheckpoint.checklistId) || checklists[0];

    const allAnswered = tpl.items.every(
      (it) => currentChecklistItems[it.id] && currentChecklistItems[it.id].status
    );

    if (!allAnswered) {
      alert('Vui lòng hoàn thành đánh giá tất cả các tiêu chí checklist trước khi hoàn tất điểm này!');
      return;
    }

    const itemsResult = tpl.items.map((it) => ({
      itemId: it.id,
      itemText: it.text,
      status: currentChecklistItems[it.id].status,
      failRecord: currentChecklistItems[it.id].failRecord,
    }));

    const hasFail = itemsResult.some((i) => i.status === 'FAIL');
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const inspection: CheckpointInspectionResult = {
      checkpointId: activeCheckpoint.id,
      checkpointName: activeCheckpoint.name,
      area: activeCheckpoint.area,
      scannedAt: timeStr,
      completedAt: timeStr,
      status: hasFail ? 'FAIL' : 'PASS',
      items: itemsResult,
      notes: checkpointNotes.trim(),
    };

    const updatedCheckpoints = [...activeSession.checkpoints];
    const idx = updatedCheckpoints.findIndex((c) => c.checkpointId === activeCheckpoint.id);
    if (idx !== -1) {
      updatedCheckpoints[idx] = inspection;
    } else {
      updatedCheckpoints.push(inspection);
    }

    const passCount = updatedCheckpoints.filter((c) => c.status === 'PASS').length;
    const failCount = updatedCheckpoints.filter((c) => c.status === 'FAIL').length;
    const allActive = checkpoints.filter((c) => c.status === 'ACTIVE');

    const updatedSession: PatrolSession = {
      ...activeSession,
      checkpoints: updatedCheckpoints,
      summary: {
        totalCheckpoints: allActive.length,
        checkedCount: updatedCheckpoints.length,
        uncheckedCount: Math.max(0, allActive.length - updatedCheckpoints.length),
        passCount,
        failCount,
        naCount: 0,
        completionRate: Math.round((updatedCheckpoints.length / allActive.length) * 1000) / 10,
        passRate: Math.round((passCount / Math.max(1, updatedCheckpoints.length)) * 1000) / 10,
      },
    };

    StorageService.updatePatrolSession(updatedSession);
    setActiveSession(updatedSession);
    setActiveCheckpoint(null);
  };

  // Open Confirmation Modal to Submit & Lock Patrol Data
  const handleOpenLockModal = () => {
    if (!activeSession) return;
    if (activeSession.checkpoints.length === 0) {
      alert(
        'Bạn chưa quét checkpoint nào trong ca tuần tra! Vui lòng quét mã QR tại các trạm kiểm soát bên dưới để thực hiện kiểm tra trước khi gửi báo cáo.'
      );
      return;
    }
    setConfirmEarlySubmit(false);
    setIsConfirmLockModalOpen(true);
  };

  // Execute Submit and Lock Data directly into Storage
  const handleConfirmSubmitAndLock = () => {
    if (!activeSession) return;

    if (activeSession.checkpoints.length < checkpoints.length && !confirmEarlySubmit) {
      alert(
        'Vui lòng đánh dấu xác nhận kết thúc ca sớm do sự cố/bàn giao trước khi khóa dữ liệu.'
      );
      return;
    }

    setIsSubmittingLock(true);

    try {
      const lockedSession = StorageService.submitPatrolSession(activeSession.id, currentUser);
      setIsConfirmLockModalOpen(false);
      setActiveSession(null);
      setIsSubmittingLock(false);
      onSessionFinished(lockedSession);
    } catch (err: any) {
      console.error('Error locking patrol session:', err);
      setIsSubmittingLock(false);
      setSubmitNotice(err.message || 'Lỗi khi khóa dữ liệu');
    }
  };

  // Unchecked checkpoints calculation for warning
  const uncheckedCheckpoints = activeSession
    ? checkpoints.filter(
        (cp) => !activeSession.checkpoints.some((c) => c.checkpointId === cp.id)
      )
    : [];

  // ==========================================
  // RENDER 1: Not started yet or session paused
  // ==========================================
  if (!activeSession) {
    return (
      <div id="patrol-setup-screen" className="max-w-lg mx-auto w-full px-2 sm:px-0 space-y-4 pt-1">
        {/* Banner if there is an in-progress session waiting to be resumed */}
        {existingInProgress && (
          <div className="bg-emerald-950/70 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                BẠN ĐANG CÓ PHIÊN TUẦN TRA ĐANG DIỄN RA
              </h3>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã phiên:</span>
                <span className="font-mono font-bold text-amber-400">{existingInProgress.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ca & Tuyến:</span>
                <span className="text-slate-200 font-semibold">{existingInProgress.shift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiến độ quét điểm:</span>
                <span className="font-bold text-emerald-400">
                  {existingInProgress.checkpoints.length} / {checkpoints.length} Điểm ({existingInProgress.summary?.completionRate || 0}%)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveSession(existingInProgress)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>TIẾP TỤC TUẦN TRA NGAY</span>
              </button>

              <button
                type="button"
                onClick={() => handleCancelSession(existingInProgress.id)}
                className="py-3 px-3.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Hủy phiên dở dang này để bắt đầu lại từ đầu"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hủy phiên</span>
              </button>
            </div>
          </div>
        )}

        {/* Banner if recent session was prematurely locked and user wants to reopen */}
        {recentIncomplete && !existingInProgress && (
          <div className="bg-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>PHIÊN GẦN NHẤT BỊ KHÓA SỚM ({recentIncomplete.checkpoints.length}/{checkpoints.length} ĐIỂM)</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{recentIncomplete.id}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Phiên tuần tra trước đó đã được gửi khi chưa hoàn thành đủ {checkpoints.length} trạm kiểm soát.
              Bạn có thể mở lại phiên này để tiếp tục quét các điểm còn thiếu.
            </p>
            <button
              type="button"
              onClick={() => handleReopenSession(recentIncomplete.id)}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>MỞ LẠI PHIÊN {recentIncomplete.id} ĐỂ TIẾP TỤC QUÉT ĐIỂM</span>
            </button>
          </div>
        )}

        {/* Start New Session Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white text-center tracking-wide uppercase">
            TUẦN TRA AN NINH
          </h2>
          <p className="text-xs text-slate-400 text-center mb-5">
            Bảo an chuyên nghiệp – Kiểm soát khu vực theo tuyến tuần tra thực tế
          </p>

          <div className="bg-slate-950 p-4 rounded-xl sm:rounded-2xl border border-slate-800 text-left space-y-3.5 mb-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <span className="text-slate-400">Nhân viên trực:</span>
              <span className="font-bold text-white text-sm">{currentUser.fullName || currentUser.username}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <span className="text-slate-400">Mã số thẻ:</span>
              <span className="font-mono text-amber-400 font-bold">{currentUser.badgeNumber || 'SEC-042'}</span>
            </div>
            <div>
              <label htmlFor="shift-select" className="text-slate-300 font-semibold block mb-1.5">
                Chọn Ca làm việc:
              </label>
              <select
                id="shift-select"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500 text-sm"
              >
                {shifts.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="route-select" className="text-slate-300 font-semibold block mb-1.5">
                Tuyến tuần tra phân công:
              </label>
              <select
                id="route-select"
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500 text-sm"
              >
                {routes.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 text-xs">
                Sẵn sàng nhận ca
              </span>
            </div>
          </div>

          <button
            id="start-patrol-btn"
            onClick={handleStartPatrol}
            className="w-full h-14 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black tracking-wider uppercase text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <Play className="w-5 h-5 fill-current shrink-0" />
            <span>[ BẮT ĐẦU TUẦN TRA ]</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmergencyReportOpen(true)}
            className="w-full py-3 px-3 bg-red-950/70 hover:bg-red-900/80 border border-red-500/60 rounded-xl text-xs font-bold text-red-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span>[ 🚨 BÁO CÁO SỰ CỐ KHẨN CẤP / TIẾP QUẢN NGAY ]</span>
          </button>
        </div>

        <EmergencyReportModal
          isOpen={isEmergencyReportOpen}
          onClose={() => setIsEmergencyReportOpen(false)}
          currentUser={currentUser}
          sessionId={activeSession?.id}
          availableCheckpoints={checkpoints}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER 2: Active Patrol Session in Progress
  // ==========================================
  const scannedCount = activeSession.checkpoints.length;
  const totalCount = checkpoints.length;
  const isAllCheckpointsCompleted = scannedCount >= totalCount && totalCount > 0;
  const hasZeroScanned = scannedCount === 0;

  return (
    <div id="patrol-active-session" className="max-w-xl mx-auto w-full px-1 sm:px-0 space-y-4 pb-12 animate-fade-in">
      {/* Session Top Navigation & Quick Controls */}
      <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={handlePauseSession}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold flex items-center gap-1.5 transition"
          title="Tạm dừng phiên tuần tra để xem danh mục khác. Dữ liệu vẫn được giữ nguyên và có thể tiếp tục bất cứ lúc nào."
        >
          <Pause className="w-3.5 h-3.5 text-amber-400" />
          <span>Tạm dừng / Quay về</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEmergencyReportOpen(true)}
            className="px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-lg font-bold flex items-center gap-1 text-[11px] transition"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Báo sự cố</span>
          </button>

          <button
            type="button"
            onClick={() => handleCancelSession()}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 rounded-lg font-medium transition text-[11px]"
            title="Hủy bỏ phiên tuần tra này"
          >
            <Trash2 className="w-3 h-3" />
            <span>Hủy phiên</span>
          </button>
        </div>
      </div>

      {/* Session Header Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                PHIÊN TUẦN TRA ĐANG DIỄN RA
              </h2>
              <span className="font-mono text-[11px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded border border-slate-800 font-bold">
                {activeSession.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{activeSession.shift}</p>
            <p className="text-[11px] text-amber-400 font-medium truncate mt-0.5">
              Tuyến: {activeSession.patrolRoute}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Bắt đầu:</span>
            <span className="font-mono text-xs font-bold text-slate-200">{activeSession.startTime}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold text-xs">Tiến độ Checkpoint:</span>
            <span className="font-mono font-bold text-amber-400 text-xs">
              {scannedCount} / {totalCount} Điểm ({activeSession.summary.completionRate}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${activeSession.summary.completionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-emerald-400 font-bold">Đạt: {activeSession.summary.passCount} PASS</span>
            <span className="text-red-400 font-bold">Lỗi: {activeSession.summary.failCount} FAIL</span>
            <span className="text-slate-400">Còn lại: {activeSession.summary.uncheckedCount}</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CONDITIONAL ACTION BUTTONS BASED ON SCAN STATUS (CRITICAL FIX) */}
        {/* ============================================================== */}

        {/* CASE 1: ZERO POINTS SCANNED -> DO NOT ALLOW SUBMIT! GUIDE USER TO SCAN FIRST POINT */}
        {hasZeroScanned && (
          <div className="space-y-2.5">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>CHƯA CÓ CHECKPOINT NÀO ĐƯỢC QUÉT</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Bạn chưa kiểm tra điểm an ninh nào. Hãy bấm nút <strong>Quét mã QR</strong> tại từng trạm bên dưới để kiểm tra checklist. Nút khóa và gửi báo cáo sẽ sẵn sàng khi hoàn tất các điểm.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleRequestScan(checkpoints[0])}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>[ QUÉT MÃ QR ĐIỂM ĐẦU TIÊN: {checkpoints[0]?.name || 'TRẠM 1'} ]</span>
            </button>
          </div>
        )}

        {/* CASE 2: IN PROGRESS (1 <= SCANNED < TOTAL) -> PROMPT NEXT POINT, SUBMIT IS SECONDARY WITH WARNING */}
        {!hasZeroScanned && !isAllCheckpointsCompleted && (
          <div className="space-y-2">
            <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[11px] text-blue-200 flex items-center justify-between">
              <span>Đang tuần tra: Đã quét <strong>{scannedCount}/{totalCount} điểm</strong></span>
              <span className="text-amber-400 font-bold">Còn {uncheckedCheckpoints.length} điểm chưa quét</span>
            </div>

            {/* Quick Next Scan Button */}
            {uncheckedCheckpoints.length > 0 && (
              <button
                type="button"
                onClick={() => handleRequestScan(uncheckedCheckpoints[0])}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QUÉT TIẾP ĐIỂM TIẾP THEO: {uncheckedCheckpoints[0]?.name}</span>
              </button>
            )}

            {/* Subtle option to submit early if emergency handover */}
            <button
              type="button"
              onClick={handleOpenLockModal}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-amber-300 border border-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Gửi báo cáo kết thúc ca sớm (Còn {uncheckedCheckpoints.length} điểm chưa quét)</span>
            </button>
          </div>
        )}

        {/* CASE 3: ALL CHECKPOINTS COMPLETED (100%) -> HIGHLIGHT FINAL SUBMIT & LOCK */}
        {isAllCheckpointsCompleted && (
          <div className="space-y-2">
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">ĐÃ QUÉT HOÀN TẤT {totalCount}/{totalCount} CHECKPOINT (100%)</span>
            </div>

            <button
              id="submit-patrol-btn"
              type="button"
              onClick={handleOpenLockModal}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>[ GỬI BÁO CÁO & KHÓA DỮ LIỆU CHÍNH THỨC ]</span>
            </button>
          </div>
        )}
      </div>

      {/* Acknowledged Toast Alert */}
      {acknowledgedToast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-600 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{acknowledgedToast}</span>
        </div>
      )}

      {/* Real-time Directive Announcement Banner from Security Manager */}
      {activeDirectives.length > 0 && (
        <div className="space-y-3">
          {activeDirectives.map((inc) => (
            <div
              key={inc.id}
              id={`directive-card-${inc.id}`}
              className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-red-500 rounded-2xl p-4 shadow-2xl space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between border-b border-red-500/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span className="text-xs font-black text-red-400 tracking-wider uppercase">
                    CHỈ ĐẠO TỪ QUẢN LÝ AN NINH (MANAGER DIRECTIVE)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-amber-300">
                  {inc.managerDirective?.issuedAt}
                </span>
              </div>

              <div className="bg-slate-950/90 p-3 rounded-xl border border-red-500/40 text-xs space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{inc.checkpointName} ({inc.area})</span>
                  <span className="text-slate-400 font-mono text-[10px]">• Mã: {inc.id}</span>
                </div>

                <div className="text-sm font-bold text-white leading-snug">
                  "{inc.managerDirective?.directiveText}"
                </div>

                {inc.managerDirective?.assignedDepartments && inc.managerDirective.assignedDepartments.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="text-slate-400 font-semibold">Đơn vị phối hợp:</span>
                    {inc.managerDirective.assignedDepartments.map((dept, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                id={`btn-ack-directive-${inc.id}`}
                onClick={() => handleAcknowledgeDirective(inc.id)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <CheckCheck className="w-4 h-4 text-white" />
                <span>[ ĐÃ NHẬN CHỈ ĐẠO ]</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* CHECKPOINT INSPECTION SCREEN (WHEN A CHECKPOINT IS OPEN)        */}
      {/* ============================================================== */}
      {activeCheckpoint ? (
        <div id="checklist-inspection-screen" className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-fade-in">
          {/* Checkpoint Header Banner with clear BACK button */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono font-black text-xs">
                  {activeCheckpoint.id}
                </span>
                <span className="text-xs text-amber-400 font-bold uppercase">{activeCheckpoint.area}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                {activeCheckpoint.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeCheckpoint.description}</p>
            </div>

            <button
              onClick={() => setActiveCheckpoint(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          </div>

          {/* Quick Bulk Actions for Mobile */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-300 font-medium">
              Đã đánh giá:{' '}
              <strong className="text-amber-400 font-mono">
                {
                  Object.values(currentChecklistItems).filter((it: { status?: ChecklistItemStatus }) => it && it.status).length
                }
                /
                {(checklists.find((c) => c.id === activeCheckpoint.checklistId) || checklists[0]).items.length}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => {
                const tpl = checklists.find((c) => c.id === activeCheckpoint.checklistId) || checklists[0];
                const updated: any = { ...currentChecklistItems };
                tpl.items.forEach((it) => {
                  if (!updated[it.id] || !updated[it.id].status) {
                    updated[it.id] = { status: 'PASS' };
                  }
                });
                setCurrentChecklistItems(updated);
              }}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Chọn nhanh tất cả ĐẠT
            </button>
          </div>

          {/* Checklist Items: Vertical Card Layout for Phone Screen */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              TIÊU CHUẨN KIỂM TRA (CHECKLIST AN NINH):
            </div>

            {(() => {
              const tpl = checklists.find((c) => c.id === activeCheckpoint.checklistId) || checklists[0];
              return tpl.items.map((item, idx) => {
                const currentStatus = currentChecklistItems[item.id]?.status;
                const failRecord = currentChecklistItems[item.id]?.failRecord;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition text-xs space-y-2.5 ${
                      currentStatus === 'PASS'
                        ? 'bg-emerald-950/20 border-emerald-700/60'
                        : currentStatus === 'FAIL'
                        ? 'bg-red-950/20 border-red-700/60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white leading-relaxed">
                        {idx + 1}. {item.text}
                      </span>
                      {item.isMandatory && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                          BẮT BUỘC
                        </span>
                      )}
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleItemStatusChange(item, 'PASS')}
                        className={`h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer ${
                          currentStatus === 'PASS'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-750'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ĐẠT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemStatusChange(item, 'FAIL')}
                        className={`h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer ${
                          currentStatus === 'FAIL'
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-750'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>LỖI / SỰ CỐ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemStatusChange(item, 'NA')}
                        className={`h-11 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer ${
                          currentStatus === 'NA'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-750'
                        }`}
                      >
                        <span>N/A</span>
                      </button>
                    </div>

                    {/* If marked FAIL, show recorded summary badge */}
                    {failRecord && (
                      <div className="bg-red-950/60 border border-red-500/40 rounded-lg p-2.5 text-[11px] text-red-200 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span>Ghi nhận sự cố: {failRecord.description}</span>
                        </div>
                        {failRecord.photoUrl && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-amber-400" />
                            <span>Đã đính kèm ảnh hiện trường có GPS & Watermark</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Notes field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Ghi chú thêm về trạm kiểm soát (Tùy chọn):
            </label>
            <textarea
              value={checkpointNotes}
              onChange={(e) => setCheckpointNotes(e.target.value)}
              placeholder="Nhập ghi chú hiện trường nếu có..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Inspection Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleSaveCheckpointInspection}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>HOÀN TẤT ĐIỂM NÀY & LƯU TIẾN ĐỘ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCheckpoint(null)}
              className="h-12 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* CHECKPOINTS LIST FOR CURRENT PATROL ROUTE                      */
        /* ============================================================== */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              DANH SÁCH CÁC TRẠM KIỂM SOÁT ({checkpoints.length} ĐIỂM)
            </h3>
            <span className="text-[11px] text-slate-400">Chạm để quét mã QR</span>
          </div>

          <div className="space-y-2.5">
            {checkpoints.map((cp, idx) => {
              const inspection = activeSession.checkpoints.find(
                (c) => c.checkpointId === cp.id
              );
              const isChecked = Boolean(inspection);
              const isFail = inspection?.status === 'FAIL';

              return (
                <div
                  key={cp.id}
                  id={`checkpoint-row-${cp.id}`}
                  className={`bg-slate-900 border rounded-2xl p-4 transition space-y-3 ${
                    isChecked
                      ? isFail
                        ? 'border-red-500/60 bg-red-950/10'
                        : 'border-emerald-500/60 bg-emerald-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{cp.id}</span>
                      <span className="text-xs text-amber-400 font-semibold">{cp.area}</span>
                    </div>

                    <div>
                      {isChecked ? (
                        isFail ? (
                          <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-400" />
                            ĐÃ QUÉT - CÓ LỖI
                          </span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ĐÃ QUÉT - ĐẠT
                          </span>
                        )
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded">
                          CHƯA KIỂM TRA
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
                      {cp.name}
                    </h4>
                    {cp.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {cp.description}
                      </p>
                    )}
                    {isChecked && (
                      <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
                        <span>Quét lúc: <strong className="text-slate-200">{inspection?.scannedAt}</strong></span>
                        <span>•</span>
                        <span>{inspection?.items.length} hạng mục checklist</span>
                      </div>
                    )}
                  </div>

                  <button
                    id={`scan-cp-${cp.id}`}
                    onClick={() => handleRequestScan(cp)}
                    className={`w-full h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition active:scale-[0.98] cursor-pointer ${
                      isChecked
                        ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-amber-600/20'
                    }`}
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>{isChecked ? '[ QUÉT / KIỂM TRA LẠI ]' : '[ QUÉT MÃ QR ĐIỂM NÀY ]'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tiến độ ca tuần tra:</span>
              <span className="font-bold text-amber-400 font-mono">
                {scannedCount}/{totalCount} điểm đã quét
              </span>
            </div>

            {/* Bottom action matches condition */}
            {hasZeroScanned ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Chưa thể gửi báo cáo (Cần quét ít nhất 1 điểm kiểm soát)</span>
              </div>
            ) : isAllCheckpointsCompleted ? (
              <button
                id="submit-patrol-btn-bottom"
                type="button"
                onClick={handleOpenLockModal}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>[ GỬI BÁO CÁO & KHÓA DỮ LIỆU CHÍNH THỨC ]</span>
              </button>
            ) : (
              <button
                id="submit-patrol-btn-bottom-early"
                type="button"
                onClick={handleOpenLockModal}
                className="w-full h-11 bg-slate-800 hover:bg-slate-750 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Gửi báo cáo kết thúc sớm ({scannedCount}/{totalCount} điểm)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION & LOCK MODAL                                      */}
      {/* ============================================================== */}
      {isConfirmLockModalOpen && activeSession && (
        <div
          id="confirm-lock-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
        >
          <div
            id="confirm-lock-modal"
            className="bg-slate-900 border-2 border-red-500/60 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                XÁC NHẬN GỬI BÁO CÁO & KHÓA DỮ LIỆU
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quy định Bảo an Khách Sạn (Mục XIX): Dữ liệu sau khi bấm gửi sẽ được <strong className="text-red-400">KHÓA VĨNH VIỄN</strong>, chuyển thẳng về Báo Cáo Quản Lý.
              </p>
            </div>

            {/* Session Info Summary */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Mã phiên:</span>
                <span className="font-mono font-bold text-amber-400">{activeSession.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Ca tuần tra:</span>
                <span className="font-semibold text-slate-200">{activeSession.shift}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Nhân viên gửi:</span>
                <span className="font-bold text-white">{currentUser.fullName || currentUser.username}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Điểm đã kiểm tra:</span>
                <span className="font-bold text-emerald-400">
                  {scannedCount} / {totalCount} Checkpoint
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">Kết quả đánh giá:</span>
                <div className="space-x-2">
                  <span className="text-emerald-400 font-bold">{activeSession.summary.passCount} ĐẠT</span>
                  <span className="text-red-400 font-bold">{activeSession.summary.failCount} LỖI</span>
                </div>
              </div>
            </div>

            {/* Warning if incomplete checkpoints */}
            {uncheckedCheckpoints.length > 0 && (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>CẢNH BÁO: CÒN {uncheckedCheckpoints.length} ĐIỂM CHƯA KIỂM TRA</span>
                </div>
                <div className="text-[11px] text-slate-300 max-h-24 overflow-y-auto space-y-1">
                  {uncheckedCheckpoints.map((cp) => (
                    <div key={cp.id} className="text-slate-400">
                      • <strong className="text-slate-200">{cp.name}</strong> ({cp.area})
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-2 pt-2 border-t border-amber-500/30 text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmEarlySubmit}
                    onChange={(e) => setConfirmEarlySubmit(e.target.checked)}
                    className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-950"
                  />
                  <span className="text-[11px] font-bold">
                    Tôi xác nhận kết thúc ca sớm do lý do bất khả kháng / sự cố bàn giao.
                  </span>
                </label>
              </div>
            )}

            {submitNotice && (
              <div className="bg-red-500/15 border border-red-500/30 p-3 rounded-xl text-xs text-red-300">
                {submitNotice}
              </div>
            )}

            {/* Action Buttons: QUAY LẠI LÀ HÀNH ĐỘNG CHÍNH ĐỂ TRÁNH BỊ KHÓA NHẦM */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmLockModalOpen(false)}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>QUAY LẠI ĐỂ TIẾP TỤC QUÉT ĐIỂM</span>
              </button>

              <button
                id="btn-confirm-lock-final"
                type="button"
                disabled={isSubmittingLock || (uncheckedCheckpoints.length > 0 && !confirmEarlySubmit)}
                onClick={handleConfirmSubmitAndLock}
                className="w-full h-11 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isSubmittingLock
                    ? 'ĐANG KHÓA DỮ LIỆU...'
                    : uncheckedCheckpoints.length > 0
                    ? 'XÁC NHẬN KHÓA SỚM VỚI DỮ LIỆU HIỆN CÓ'
                    : 'ĐỒNG Ý GỬI VÀ KHÓA DỮ LIỆU NGAY'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        availableCheckpoints={checkpoints}
        targetCheckpoint={targetCheckpointToScan}
      />

      {/* FAIL Incident Workflow Modal */}
      {activeFailItem && (
        <FailIncidentModal
          isOpen={Boolean(activeFailItem)}
          onClose={() => setActiveFailItem(null)}
          onSubmitFail={handleFailRecordSubmitted}
          checkpoint={activeFailItem.checkpoint}
          item={activeFailItem.item}
          currentUser={currentUser}
          sessionId={activeSession.id}
        />
      )}

      {/* Emergency Incident Report Modal */}
      <EmergencyReportModal
        isOpen={isEmergencyReportOpen}
        onClose={() => setIsEmergencyReportOpen(false)}
        currentUser={currentUser}
        sessionId={activeSession?.id}
        availableCheckpoints={checkpoints}
      />
    </div>
  );
};
