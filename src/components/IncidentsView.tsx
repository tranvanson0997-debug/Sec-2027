import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  Building,
  User,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Incident, User as UserType } from '../types';
import { StorageService } from '../services/storage';

interface IncidentsViewProps {
  currentUser: UserType;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ currentUser }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => StorageService.getIncidents());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const refreshData = () => {
    setIncidents(StorageService.getIncidents());
  };

  const handleUpdateStatus = (incident: Incident, newStatus: Incident['status']) => {
    try {
      StorageService.updateIncidentStatus(
        incident.id,
        newStatus,
        currentUser,
        resolutionNote.trim() || undefined
      );
      setSelectedIncident(null);
      setResolutionNote('');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = incidents.filter((inc) => {
    const matchSearch =
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.checkpointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.officerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const getSeverityBadge = (sev: Incident['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[10px] font-black uppercase">NGHIÊM TRỌNG</span>;
      case 'HIGH':
        return <span className="bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">CAO</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-950 text-yellow-300 border border-yellow-800 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">TRUNG BÌNH</span>;
      default:
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-medium uppercase">THẤP</span>;
    }
  };

  const getStatusBadge = (st: Incident['status']) => {
    switch (st) {
      case 'RESOLVED':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ĐÃ XỬ LÝ</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><Clock className="w-3 h-3" /> ĐANG XỬ LÝ</span>;
      default:
        return <span className="bg-red-950 text-red-300 border border-red-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> CHƯA XỬ LÝ</span>;
    }
  };

  return (
    <div id="incidents-management-view" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            QUẢN LÝ SỰ CỐ & LỖI AN NINH HIỆN TRƯỜNG
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi, phân loại và đóng sự cố phát hiện qua các đợt kiểm tra tuần tra an ninh
          </p>
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
            placeholder="Tìm theo Mã sự cố, Checkpoint, Mô tả..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả trạng thái xử lý ({incidents.length})</option>
            <option value="OPEN">Chưa xử lý (OPEN)</option>
            <option value="IN_PROGRESS">Đang xử lý (IN PROGRESS)</option>
            <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
          </select>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả mức độ nghiêm trọng</option>
            <option value="CRITICAL">Nghiêm trọng</option>
            <option value="HIGH">Cao</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="LOW">Thấp</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4 font-bold">Mã Sự Cố</th>
                <th className="py-3 px-4 font-bold">Vị Trí / Checkpoint</th>
                <th className="py-3 px-4 font-bold">Nội Dung Sự Cố & Tiêu Chí</th>
                <th className="py-3 px-4 font-bold text-center">Mức Độ</th>
                <th className="py-3 px-4 font-bold">Bộ Phận Phối Hợp</th>
                <th className="py-3 px-4 font-bold text-center">Hình Ảnh</th>
                <th className="py-3 px-4 font-bold text-center">Trạng Thái</th>
                <th className="py-3 px-4 font-bold text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Không tìm thấy sự cố an ninh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-red-400">
                      {inc.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{inc.checkpointName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inc.checkpointId} • {inc.area}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-white font-medium line-clamp-2">{inc.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Tiêu chí: {inc.checklistText}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getSeverityBadge(inc.severity)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-amber-300 font-semibold">{inc.department}</span>
                      <div className="text-[10px] text-slate-500">Bởi: {inc.officerName}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {inc.photoUrl ? (
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="inline-block relative group"
                        >
                          <img
                            src={inc.photoUrl}
                            alt="Incident Evidence"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-700 group-hover:border-amber-500 transition"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Không có</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(inc.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        id={`detail-inc-${inc.id}`}
                        onClick={() => setSelectedIncident(inc)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        Xem & Xử lý
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail and Resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-red-400 text-sm">{selectedIncident.id}</span>
                  {getSeverityBadge(selectedIncident.severity)}
                  {getStatusBadge(selectedIncident.status)}
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  [{selectedIncident.checkpointId}] {selectedIncident.checkpointName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evidence Photo with the strict 3-line watermarking */}
            {selectedIncident.photoUrl && (
              <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={selectedIncident.photoUrl}
                  alt="Incident Full Evidence"
                  className="w-full max-h-72 object-contain bg-black"
                />
                <div className="p-3 bg-slate-900 border-t border-red-500/80 text-[11px] text-slate-300 space-y-1">
                  <div>Nhân viên phát hiện: <strong className="text-white">{selectedIncident.photoMetadata?.officerName || selectedIncident.officerName}</strong></div>
                  <div>Thời gian: {selectedIncident.photoMetadata?.date} lúc {selectedIncident.photoMetadata?.time}</div>
                  <div className="text-amber-300 font-semibold">Vị trí: {selectedIncident.photoMetadata?.location || selectedIncident.checkpointName}</div>
                </div>
              </div>
            )}

            {/* Detailed descriptions */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block mb-0.5">Tiêu chí kiểm tra bị vi phạm:</span>
                <strong className="text-red-300">{selectedIncident.checklistText}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Mô tả hiện trạng thực tế:</span>
                <p className="text-slate-200">{selectedIncident.description}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Hành động xử lý tại chỗ đã thực hiện:</span>
                <p className="text-white">{selectedIncident.actionTaken}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                <div>
                  <span className="text-slate-400 block">Bộ phận tiếp nhận khắc phục:</span>
                  <strong className="text-amber-300">{selectedIncident.department}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Thời gian tạo:</span>
                  <span className="text-slate-300 font-mono">{selectedIncident.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Resolve / Action Controls (Manager & Supervisor) */}
            {(currentUser.role === 'MANAGER' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN') && (
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-600/40 space-y-3">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Cập nhật tiến độ / Đóng sự cố:
                </label>
                <textarea
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Ghi chú kết quả xử lý (ví dụ: Kỹ thuật đã thay mới bóng đèn thoát hiểm lúc 10h15)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <div className="flex flex-wrap gap-2 justify-end">
                  {selectedIncident.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIncident, 'IN_PROGRESS')}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Clock className="w-4 h-4" />
                      Chuyển sang Đang Xử Lý
                    </button>
                  )}

                  {selectedIncident.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIncident, 'RESOLVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <Check className="w-4 h-4" />
                      Xác nhận ĐÃ GIẢI QUYẾT XONG
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
