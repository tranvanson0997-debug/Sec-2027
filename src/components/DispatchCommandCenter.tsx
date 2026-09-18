import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Send,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Flame,
  Sparkles,
  Building,
  Shield,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCheck,
  Eye,
  X,
  PhoneCall,
  Navigation,
} from 'lucide-react';
import { Incident, SeverityLevel, User as UserType } from '../types';
import { StorageService } from '../services/storage';
import { soundAlert } from '../utils/audioAlert';

interface DispatchCommandCenterProps {
  currentUser: UserType;
  onNavigateTab?: (tab: string) => void;
  selectedIncidentId?: string | null;
}

export const DispatchCommandCenter: React.FC<DispatchCommandCenterProps> = ({
  currentUser,
  onNavigateTab,
  selectedIncidentId,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | SeverityLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectIncident, setInspectIncident] = useState<Incident | null>(null);

  // Directive Form State
  const [directiveText, setDirectiveText] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([
    'Kỹ thuật PCCC & Cứu nạn',
  ]);
  const [isSendingDirective, setIsSendingDirective] = useState(false);

  // Resolution Form State
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const loadData = () => {
    const list = StorageService.getIncidents();
    setIncidents(list);
    if (selectedIncidentId) {
      const found = list.find((i) => i.id === selectedIncidentId);
      if (found) setInspectIncident(found);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = StorageService.subscribeToDataChanges(() => {
      loadData();
    });
    return () => unsub();
  }, [selectedIncidentId]);

  // Handle department checkbox toggle
  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  // Issue Manager Directive to Field Officer
  const handleIssueDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectIncident || !directiveText.trim()) return;

    setIsSendingDirective(true);
    try {
      StorageService.issueIncidentDirective({
        incidentId: inspectIncident.id,
        directiveText: directiveText.trim(),
        manager: currentUser,
        assignedDepartments: selectedDepartments,
        priority: inspectIncident.severity,
      });

      soundAlert.playDispatchChime();

      // Refresh incident in inspector
      const updatedList = StorageService.getIncidents();
      setIncidents(updatedList);
      const reloaded = updatedList.find((i) => i.id === inspectIncident.id);
      if (reloaded) setInspectIncident(reloaded);

      setDirectiveText('');
      setIsSendingDirective(false);
    } catch (err) {
      console.error(err);
      setIsSendingDirective(false);
    }
  };

  // Resolve Incident
  const handleResolveIncident = () => {
    if (!inspectIncident) return;
    StorageService.updateIncidentStatus({
      incidentId: inspectIncident.id,
      status: 'RESOLVED',
      resolver: currentUser,
      resolutionNotes: resolveNotes || 'Đã điều phối đơn vị xử lý hoàn tất hiện trường theo chuẩn SOP.',
    });

    soundAlert.playAcknowledgeChime();

    setShowResolveModal(false);
    setResolveNotes('');
    const updatedList = StorageService.getIncidents();
    setIncidents(updatedList);
    const reloaded = updatedList.find((i) => i.id === inspectIncident.id);
    if (reloaded) setInspectIncident(reloaded);
  };

  // Filtered Incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (activeTab !== 'ALL' && inc.status !== activeTab) return false;
    if (priorityFilter !== 'ALL' && inc.severity !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = inc.id.toLowerCase().includes(q);
      const matchCp = inc.checkpointName.toLowerCase().includes(q);
      const matchOfficer = inc.officerName.toLowerCase().includes(q);
      const matchDesc = inc.description.toLowerCase().includes(q);
      if (!matchId && !matchCp && !matchOfficer && !matchDesc) return false;
    }
    return true;
  });

  const unresolvedCount = incidents.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && (i.status === 'OPEN' || i.status === 'IN_PROGRESS')).length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH' && (i.status === 'OPEN' || i.status === 'IN_PROGRESS')).length;

  const departmentOptions = [
    { name: 'Kỹ thuật PCCC & Cứu nạn', icon: Flame, color: 'text-red-400' },
    { name: 'Housekeeping (Buồng phòng)', icon: Sparkles, color: 'text-cyan-400' },
    { name: 'Lễ tân & Front Office', icon: Building, color: 'text-amber-400' },
    { name: 'Đội Cơ động Chi viện An ninh', icon: Shield, color: 'text-emerald-400' },
    { name: 'Quản lý Ca Trực (Duty Manager)', icon: PhoneCall, color: 'text-purple-400' },
  ];

  return (
    <div id="dispatch-command-center" className="space-y-6 pb-12">
      {/* Top Banner: 24/7 Command Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                HỆ THỐNG ĐIỀU PHỐI HAI CHIỀU TRỰC TUYẾN 24/7 (ONLINE DISPATCH ACTIVE)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
              TRUNG TÂM CHỈ HUY & ĐIỀU PHỐI SỰ CỐ AN NINH
            </h1>
            <p className="text-xs text-slate-400">
              Liên kết hai chiều giữa Sĩ quan tuần tra hiện trường và Trưởng bộ phận An ninh. Phát lệnh chỉ đạo SOP tức thời.
            </p>
          </div>

          {/* Incident Priority Summary Counters */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            <div className="bg-slate-900/90 border border-red-500/40 px-3 py-2 rounded-xl text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-red-400">Khẩn cấp</div>
              <div className="text-xl font-black text-red-400">{criticalCount}</div>
            </div>
            <div className="bg-slate-900/90 border border-amber-500/40 px-3 py-2 rounded-xl text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-amber-400">Mức Cao</div>
              <div className="text-xl font-black text-amber-400">{highCount}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-300">Tổng Chưa Xong</div>
              <div className="text-xl font-black text-white">{unresolvedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Filters & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Tất cả ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'OPEN'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 text-red-400 hover:bg-slate-750'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            Cần Xử Lý ({incidents.filter((i) => i.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-750'
            }`}
          >
            Đang Điều Phối ({incidents.filter((i) => i.status === 'IN_PROGRESS').length})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-750'
            }`}
          >
            Đã Giải Quyết ({incidents.filter((i) => i.status === 'RESOLVED').length})
          </button>
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            aria-label="Lọc theo mức độ ưu tiên sự cố"
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Mọi mức độ</option>
            <option value="CRITICAL">🚨 Khẩn cấp (CRITICAL)</option>
            <option value="HIGH">⚠ Cao (HIGH)</option>
            <option value="MEDIUM">🟡 Trung bình (MEDIUM)</option>
            <option value="LOW">🔵 Thấp (LOW)</option>
          </select>

          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm sự cố, điểm, cán bộ..."
              className="w-full bg-slate-950 border border-slate-700 pl-8 pr-3 py-1.5 text-xs text-white rounded-lg placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Incidents List (Left) + Detailed Directive Command Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents Cards */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Danh sách sự cố từ hiện trường ({filteredIncidents.length})</span>
            <button
              onClick={loadData}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Làm mới
            </button>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <div className="text-sm font-bold text-white">Không có sự cố nào trong bộ lọc</div>
              <div className="text-xs text-slate-500">Tất cả các tuyến tuần tra hiện đang an toàn và ổn định.</div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredIncidents.map((inc) => {
                const isSelected = inspectIncident?.id === inc.id;
                const hasDirective = !!inc.managerDirective;
                const isAcknowledged = inc.managerDirective?.isAcknowledged;

                const severityBadges = {
                  CRITICAL: 'bg-red-950 text-red-300 border-red-800',
                  HIGH: 'bg-amber-950 text-amber-300 border-amber-700',
                  MEDIUM: 'bg-yellow-950 text-yellow-300 border-yellow-800',
                  LOW: 'bg-slate-800 text-slate-300 border-slate-700',
                };

                const statusBadges = {
                  OPEN: 'bg-red-900/80 text-white border-red-700',
                  IN_PROGRESS: 'bg-amber-900/80 text-amber-200 border-amber-600',
                  RESOLVED: 'bg-emerald-950 text-emerald-300 border-emerald-700',
                  CLOSED: 'bg-slate-900 text-slate-400 border-slate-700',
                };

                return (
                  <div
                    key={inc.id}
                    id={`incident-card-${inc.id}`}
                    onClick={() => setInspectIncident(inc)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative shadow-lg ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/90 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    {/* Header: ID, Severity, Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400">{inc.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadges[inc.severity]}`}>
                          {inc.severity === 'CRITICAL' ? '🚨 KHẨN CẤP' : inc.severity}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadges[inc.status]}`}>
                        {inc.status === 'OPEN'
                          ? 'CHƯA XỬ LÝ'
                          : inc.status === 'IN_PROGRESS'
                          ? 'ĐANG XỬ LÝ'
                          : 'ĐÃ GIẢI QUYẾT'}
                      </span>
                    </div>

                    {/* Location & Title */}
                    <div className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{inc.checkpointName}</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">
                      {inc.description}
                    </p>

                    {/* Officer & Time */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{inc.officerName}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{inc.createdAt.substring(11, 16)}</span>
                      </div>
                    </div>

                    {/* Directive Status Tracker Badge */}
                    {hasDirective && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-amber-300">
                          <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span className="font-semibold">Đã phát lệnh chỉ đạo</span>
                        </div>
                        {isAcknowledged ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                            ĐÃ NHẬN CHỈ ĐẠO ({inc.managerDirective?.acknowledgedAt?.substring(11, 16)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                            <Clock className="w-3 h-3" />
                            Chờ NV bấm nhận
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Incident Inspection & Two-way Directive Console */}
        <div className="lg:col-span-6 xl:col-span-7">
          {inspectIncident ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 sticky top-20">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-amber-400">{inspectIncident.id}</span>
                    <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded text-xs font-bold">
                      {inspectIncident.severity}
                    </span>
                    <span className="text-xs text-slate-400">({inspectIncident.department})</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {inspectIncident.checkpointName} ({inspectIncident.area})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {inspectIncident.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đóng & Đã Giải Quyết
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Checkpoint item */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Hạng mục kiểm tra không đạt (FAIL):
                </div>
                <div className="text-red-300 font-semibold">{inspectIncident.checklistText}</div>
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pt-1">
                  Mô tả thực tế từ hiện trường:
                </div>
                <div className="text-slate-200 leading-relaxed">{inspectIncident.description}</div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Cán bộ phát hiện: <strong className="text-white">{inspectIncident.officerName}</strong> Lúc: {inspectIncident.createdAt}
                </div>
                {inspectIncident.photoMetadata?.gpsCoordinates && (
                  <div className="text-[11px] text-sky-400 font-mono flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {inspectIncident.photoMetadata.gpsCoordinates}
                  </div>
                )}
              </div>

              {/* SOP Watermarked Evidence Photo */}
              {inspectIncident.photoUrl && (
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Ảnh chụp hiện trường đóng dấu SOP & GPS:</span>
                    <button
                      onClick={() => setSelectedImageModal(inspectIncident.photoUrl)}
                      className="text-amber-400 hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Phóng to ảnh
                    </button>
                  </div>
                  <div
                    onClick={() => setSelectedImageModal(inspectIncident.photoUrl)}
                    className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-700 max-h-56 bg-black flex items-center justify-center"
                  >
                    <img
                      src={inspectIncident.photoUrl}
                      alt="SOP Evidence"
                      className="w-full h-auto object-contain group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" /> Bấm để xem kích thước đầy đủ
                    </div>
                  </div>
                </div>
              )}

              {/* Current Active Directive State if exists */}
              {inspectIncident.managerDirective && (
                <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                      Chỉ đạo hiện hành của Quản lý An ninh:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Lúc: {inspectIncident.managerDirective.issuedAt}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30">
                    "{inspectIncident.managerDirective.directiveText}"
                  </p>

                  <div className="text-[11px] text-slate-300 flex flex-wrap gap-1 items-center">
                    <span className="text-slate-400">Đơn vị phối hợp:</span>
                    {inspectIncident.managerDirective.assignedDepartments.map((dept, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded text-[10px] font-bold border border-slate-700"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Trạng thái phản hồi sĩ quan:</span>
                    {inspectIncident.managerDirective.isAcknowledged ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ĐÃ NHẬN CHỈ ĐẠO ({inspectIncident.managerDirective.acknowledgedAt?.substring(11, 19)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Đang chờ cán bộ bấm "ĐÃ NHẬN CHỈ ĐẠO"
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Form: Issue Direct Order to Patrol Officer */}
              {inspectIncident.status !== 'RESOLVED' && (
                <form
                  onSubmit={handleIssueDirective}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Phát lệnh chỉ đạo trực tiếp cho sĩ quan hiện trường:
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">Real-time Push</span>
                  </div>

                  <textarea
                    value={directiveText}
                    onChange={(e) => setDirectiveText(e.target.value)}
                    rows={2}
                    placeholder="Nhập nội dung chỉ đạo (ví dụ: Giữ nguyên hiện trường, phong tỏa lối thoát hiểm, phối hợp với kỹ thuật kiểm tra áp suất...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />

                  {/* Multi-select supporting departments */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-300 mb-1.5">
                      Phân công đơn vị hỗ trợ phối hợp:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {departmentOptions.map((dept) => {
                        const isChecked = selectedDepartments.includes(dept.name);
                        const Icon = dept.icon;
                        return (
                          <button
                            key={dept.name}
                            type="button"
                            onClick={() => toggleDepartment(dept.name)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition ${
                              isChecked
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <Icon className={`w-3 h-3 ${dept.color}`} />
                            <span>{dept.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingDirective || !directiveText.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>[ PHÁT LỆNH CHỈ ĐẠO THỜI GIAN THỰC ]</span>
                  </button>
                </form>
              )}

              {/* Resolved details if closed */}
              {inspectIncident.status === 'RESOLVED' && (
                <div className="bg-emerald-950/40 border border-emerald-600/50 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Sự cố đã được giải quyết an toàn
                  </div>
                  <div className="text-slate-300">{inspectIncident.resolutionNotes}</div>
                  <div className="text-[11px] text-slate-400">
                    Người giải quyết: <strong className="text-white">{inspectIncident.resolvedBy}</strong> Lúc: {inspectIncident.resolvedAt}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Radio className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">Chưa chọn sự cố để kiểm tra</div>
              <div className="text-xs text-slate-500 max-w-sm mx-auto">
                Nhấp vào bất kỳ sự cố nào trong danh sách bên trái để xem biên bản chi tiết, ảnh mộc SOP và phát lệnh chỉ đạo thời gian thực.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Resolve Incident Confirmation */}
      {showResolveModal && inspectIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Xác nhận Đã Giải Quyết Sự Cố
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-300">
                Sự cố: <strong className="text-amber-400">{inspectIncident.id}</strong> tại{' '}
                <strong className="text-white">{inspectIncident.checkpointName}</strong>
              </div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Biên bản giải quyết / Ghi chú xử lý:
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={3}
                placeholder="Ghi nhận kết quả xử lý (ví dụ: Kỹ thuật PCCC đã nạp áp và thay chốt an toàn, khu vực đã thông thoáng đạt chuẩn SOP...)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResolveIncident}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Xác Nhận Đóng Sự Cố
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fullscreen Photo Preview */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={selectedImageModal}
              alt="Full Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-700"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
