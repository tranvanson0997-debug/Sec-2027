import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Eye,
  Radio,
} from 'lucide-react';
import {
  DashboardStats,
  PatrolSession,
  Incident,
  Checkpoint,
  User,
  HotelSystemConfig,
} from '../types';
import { StorageService } from '../services/storage';
import { OnlineMonitoringPanel } from './OnlineMonitoringPanel';

interface DashboardViewProps {
  stats: DashboardStats;
  currentUser: User;
  config: HotelSystemConfig;
  onViewReport: (session: PatrolSession) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  currentUser,
  config,
  onViewReport,
  onNavigateTab,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'ALL'>('TODAY');
  const [allSessions, setAllSessions] = useState<PatrolSession[]>(() => StorageService.getPatrolSessions());
  const [allIncidents, setAllIncidents] = useState<Incident[]>(() => StorageService.getIncidents());
  const [allCheckpoints, setAllCheckpoints] = useState<Checkpoint[]>(() => StorageService.getCheckpoints());
  const [liveStats, setLiveStats] = useState<DashboardStats>(stats);

  // Subscribe to real-time updates from patrol officers
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setAllSessions(StorageService.getPatrolSessions());
      setAllIncidents(StorageService.getIncidents());
      setAllCheckpoints(StorageService.getCheckpoints());
      setLiveStats(StorageService.getDashboardStats());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setLiveStats(stats);
  }, [stats]);

  const allUsers = StorageService.getUsers();

  // Active officers
  const inProgressSessions = allSessions.filter((s) => s.status === 'IN_PROGRESS');

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
            TRUNG TÂM CHỈ HUY BẢO AN & GIÁM SÁT TUẦN TRA
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi thời gian thực kết quả tuần tra, sự cố an ninh và tuân thủ quy chuẩn 5 sao
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('patrol')}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition cursor-pointer"
          >
            [ BẮT ĐẦU TUẦN TRA ]
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            [ XEM BÁO CÁO ]
          </button>
        </div>
      </div>

      {/* Online Access & Real-Time Personnel Tracking for Manager & Supervisor */}
      {['MANAGER', 'SUPERVISOR', 'ADMIN'].includes(currentUser.role) && (
        <OnlineMonitoringPanel
          currentUser={currentUser}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* Real-Time Live Patrol Monitoring Panel for Security Manager */}
      {inProgressSessions.length > 0 && (
        <div id="live-patrol-monitoring-panel" className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/50 p-4 sm:p-5 rounded-3xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-4 h-4">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    THEO DÕI TUẦN TRA TRỰC TIẾP (LIVE PATROL MONITOR)
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 animate-pulse" /> ĐANG ĐỒNG BỘ THỜI GIAN THỰC
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quản lý có thể xem ngay mọi thông tin và kết quả kiểm tra khi nhân viên vừa hoàn tất từng điểm
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-amber-400 font-bold">{inProgressSessions.length}</span> phiên đang tuần tra ngoài hiện trường
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 space-y-3">
            {inProgressSessions.map((sess) => {
              const lastCp = sess.checkpoints.length > 0 ? sess.checkpoints[sess.checkpoints.length - 1] : null;

              return (
                <div key={sess.id} className="pt-3 first:pt-0 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {sess.id}
                        </span>
                        <strong className="text-white text-sm sm:text-base">{sess.officerName}</strong>
                        <span className="text-amber-300/90 text-xs font-semibold">({sess.shift})</span>
                        <span className="text-slate-400 text-xs font-mono">• Bắt đầu: {sess.startTime}</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Tuyến phân công: <span className="text-amber-300 font-medium">{sess.patrolRoute}</span>
                      </div>
                    </div>

                    <button
                      id={`inspect-live-session-${sess.id}`}
                      onClick={() => onViewReport(sess)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95 shrink-0"
                      title="Xem toàn bộ kết quả, checklist và hình ảnh nhân viên vừa kiểm tra"
                    >
                      <Eye className="w-4 h-4" />
                      <span>[ XEM CHI TIẾT KẾT QUẢ VỪA KIỂM TRA ]</span>
                    </button>
                  </div>

                  {/* Highlight: Checkpoint vừa kiểm tra xong tức thì */}
                  <div className="bg-slate-950/90 border border-slate-800/90 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Điểm kiểm soát vừa hoàn tất gần nhất:</span>
                      </div>
                      {lastCp ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            [{lastCp.checkpointId}] {lastCp.checkpointName}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({lastCp.completedAt || lastCp.scannedAt})
                          </span>
                          {lastCp.status === 'PASS' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ĐẠT TIÊU CHUẨN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-red-400" /> PHÁT HIỆN SỰ CỐ
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          Nhân viên vừa bắt đầu ca trực, đang di chuyển đến điểm kiểm soát đầu tiên...
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tiến độ tuần tra</div>
                      <div className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
                        {sess.checkpoints.length} / {allCheckpoints.length} Điểm ({sess.summary.completionRate}%)
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        {sess.summary.passCount} PASS • <span className={sess.summary.failCount > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>{sess.summary.failCount} FAIL</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Core Stat Cards matching Section XIV */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số lượt tuần tra */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lượt tuần tra</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {liveStats.todayPatrolsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{liveStats.totalPatrolsCount} tổng lượt</span>
            <span>ghi nhận trong hệ thống</span>
          </div>
        </div>

        {/* Card 2: Tỷ lệ hoàn thành */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tỷ lệ hoàn thành</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {liveStats.completionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tỷ lệ đạt chuẩn (Pass Rate): <strong className="text-white">{liveStats.passRate}%</strong>
          </div>
        </div>

        {/* Card 3: Tổng checkpoint đã kiểm tra */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Checkpoint đã kiểm tra</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {liveStats.totalCheckpointsChecked}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Trên tổng số <strong className="text-white">{allCheckpoints.length} điểm cố định</strong>
          </div>
        </div>

        {/* Card 4: Tổng số lỗi phát hiện */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lỗi & Sự cố phát hiện</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-400">
            {liveStats.totalFailsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-amber-400 font-semibold">{liveStats.openIncidentsCount} đang xử lý</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{liveStats.resolvedIncidentsCount} đã giải quyết</span>
          </div>
        </div>
      </div>

      {/* Secondary Highlights matching Section XIV:
          - Checkpoint có lỗi nhiều nhất
          - Ca trực có nhiều lỗi nhất
          - Nhân viên đang tuần tra
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most frequent fail checkpoint */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            Checkpoint có lỗi nhiều nhất:
          </div>
          <div className="text-sm font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
            {stats.mostFailedCheckpoint}
          </div>
        </div>

        {/* Shift with most fails */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Ca trực có nhiều lỗi nhất:
          </div>
          <div className="text-sm font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
            {stats.shiftWithMostFails}
          </div>
        </div>

        {/* Active officers patrolling right now */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Nhân viên đang tuần tra:
          </div>
          <div className="text-sm font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            {inProgressSessions.length > 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {inProgressSessions.map((s) => s.officerName).join(', ')}
              </span>
            ) : (
              <span className="text-slate-400 font-normal">Hiện không có phiên đang chạy</span>
            )}
            <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300">
              {inProgressSessions.length} Đang trực
            </span>
          </div>
        </div>
      </div>

      {/* Hourly Patrol Activity Chart & Checkpoint Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly distribution bar chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Biểu đồ phân bổ tuần tra an ninh theo khung giờ (24h)
            </h3>
            <span className="text-[11px] text-slate-400">Cường độ quét</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 items-end h-36 pt-4 px-2 bg-slate-950 rounded-xl border border-slate-850">
            {stats.hourlyPatrolDistribution.map((h) => {
              const maxCount = Math.max(...stats.hourlyPatrolDistribution.map((d) => d.count), 1);
              const heightPct = Math.max(12, Math.round((h.count / maxCount) * 100));

              return (
                <div key={h.hour} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[9px] font-mono text-amber-300 opacity-0 group-hover:opacity-100 transition mb-1">
                    {h.count}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      h.count > 0 ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-800/40'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 mt-1.5">
                    {h.hour.split(':')[0]}h
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>• Ca ngày: 06h - 14h</span>
            <span>• Ca chiều: 14h - 22h</span>
            <span>• Ca đêm: 22h - 06h (Tập trung PCCC & Đột nhập)</span>
          </div>
        </div>

        {/* Checkpoint Status Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Trạng thái các điểm kiểm soát:
              </h3>
              <span className="text-[11px] text-slate-400">{allCheckpoints.length} điểm</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {allCheckpoints.map((cp) => {
                const failsForCp = allIncidents.filter((i) => i.checkpointId === cp.id);
                const hasFail = failsForCp.length > 0;

                return (
                  <div
                    key={cp.id}
                    className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-400 text-[10px] mr-1.5">{cp.id}</span>
                      <span className="text-slate-200 font-medium text-[11px]">{cp.name}</span>
                    </div>
                    {hasFail ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-800">
                        {failsForCp.length} lỗi
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Chuẩn
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('checkpoints')}
            className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
          >
            Quản lý Checkpoint & QR thẻ <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Incidents Table & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách sự cố mới nhất */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Sự cố phát hiện mới nhất (Incidents):
            </h3>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-amber-400 text-xs hover:underline flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {allIncidents.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                Chưa có sự cố nào được ghi nhận. Hệ thống an ninh hoàn toàn ổn định!
              </div>
            ) : (
              allIncidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-400 text-[10px]">{inc.id}</span>
                      <span className="font-semibold text-white">{inc.checkpointName}</span>
                      <span className="px-1.5 py-0.2 bg-red-950 text-red-400 text-[9px] rounded font-bold border border-red-800">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] line-clamp-1">{inc.description}</div>
                    <div className="text-slate-500 text-[10px]">
                      Bởi: {inc.officerName} • Bộ phận: <strong className="text-amber-300">{inc.department}</strong> • Lúc: {inc.createdAt}
                    </div>
                  </div>

                  {inc.photoUrl && (
                    <img
                      src={inc.photoUrl}
                      alt="Incident"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Completed Patrol Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Các phiên tuần tra gần đây:
            </h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-amber-400 text-xs hover:underline flex items-center gap-0.5"
            >
              Tất cả báo cáo <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {allSessions.slice(0, 5).map((sess) => (
              <div
                key={sess.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{sess.id}</span>
                    <span className="font-semibold text-white">{sess.officerName}</span>
                    <span className="text-[10px] text-slate-400">({sess.shift})</span>
                    {sess.status === 'IN_PROGRESS' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        TRỰC TIẾP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        ĐÃ KHÓA
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {sess.date} • {sess.startTime} - {sess.endTime || 'Đang tuần tra...'} • Tuyến: {sess.patrolRoute}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-emerald-400 font-bold">{sess.summary.passCount} PASS</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-red-400 font-bold">{sess.summary.failCount} FAIL</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-300">{sess.summary.checkedCount}/{sess.summary.totalCheckpoints} điểm ({sess.summary.completionRate}%)</span>
                  </div>
                </div>

                <button
                  id={`view-report-${sess.id}`}
                  onClick={() => onViewReport(sess)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
                    sess.status === 'IN_PROGRESS'
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {sess.status === 'IN_PROGRESS' ? 'Xem Trực Tiếp' : 'Xem Báo Cáo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
