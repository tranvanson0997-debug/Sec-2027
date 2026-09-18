import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  FileSpreadsheet,
  Settings,
  Database,
  RefreshCw,
  Lock,
  Clock,
  User,
  Shield,
  CheckCircle,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AuditLog, User as UserType, HotelSystemConfig } from '../types';
import { StorageService } from '../services/storage';
import { exportHotelPatrolExcel } from '../utils/excelGenerator';

interface SystemAuditViewProps {
  currentUser: UserType;
  config: HotelSystemConfig;
  onConfigUpdated: (cfg: HotelSystemConfig) => void;
}

export const SystemAuditView: React.FC<SystemAuditViewProps> = ({
  currentUser,
  config,
  onConfigUpdated,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Config settings form with solid defaults
  const [hotelName, setHotelName] = useState(
    config?.hotelName || 'Dusit Princess Moonrise Phú Quốc'
  );
  const [departmentName, setDepartmentName] = useState(
    config?.departmentName || 'BỘ PHẬN AN NINH & BẢO VỆ (SECURITY DEPT)'
  );
  const [address, setAddress] = useState(
    config?.address ||
      'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang'
  );
  const [retentionDays, setRetentionDays] = useState<number>(
    config?.retentionDays ?? 365
  );
  const [requirePhotoOnFail, setRequirePhotoOnFail] = useState<boolean>(
    config?.requirePhotoOnFail ?? true
  );
  const [watermarkHotelName, setWatermarkHotelName] = useState<boolean>(
    config?.watermarkHotelName ?? true
  );
  const [configSavedNotice, setConfigSavedNotice] = useState<string | null>(null);

  // Sync state whenever config prop changes or updates
  useEffect(() => {
    if (config) {
      setHotelName(config.hotelName || 'Dusit Princess Moonrise Phú Quốc');
      setDepartmentName(
        config.departmentName || 'BỘ PHẬN AN NINH & BẢO VỆ (SECURITY DEPT)'
      );
      setAddress(
        config.address ||
          'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang'
      );
      setRetentionDays(config.retentionDays ?? 365);
      setRequirePhotoOnFail(config.requirePhotoOnFail ?? true);
      setWatermarkHotelName(config.watermarkHotelName ?? true);
    }
  }, [config]);

  // Real-time synchronization for audit logs
  useEffect(() => {
    const handleStorageChange = () => {
      setLogs(StorageService.getAuditLogs());
    };
    const unsubscribe = StorageService.subscribe(handleStorageChange);
    return unsubscribe;
  }, []);

  const canEditConfig =
    currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditConfig) {
      alert('Chỉ Security Manager hoặc Admin mới có quyền đổi cấu hình hệ thống!');
      return;
    }

    const updatedConfig: HotelSystemConfig = {
      ...config,
      hotelName: hotelName.trim() || 'Dusit Princess Moonrise Phú Quốc',
      departmentName: departmentName.trim() || 'BỘ PHẬN AN NINH & BẢO VỆ (SECURITY DEPT)',
      address:
        address.trim() ||
        'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang',
      hotline: '',
      requireQrScan: true,
      allowSupervisorOverride: true,
      retentionDays: Number(retentionDays) || 365,
      requirePhotoOnFail,
      watermarkHotelName,
    };

    StorageService.updateConfig(updatedConfig, currentUser);
    onConfigUpdated(updatedConfig);
    setConfigSavedNotice('Đã lưu thành công cấu hình hệ thống an ninh khách sạn!');
    setLogs(StorageService.getAuditLogs());
    setTimeout(() => setConfigSavedNotice(null), 3500);
  };

  const handleResetDemoData = () => {
    if (!canEditConfig) {
      alert('Chỉ Security Manager hoặc Admin mới có quyền đặt lại dữ liệu mẫu!');
      return;
    }

    if (
      !confirm(
        'CẢNH BÁO: Thao tác này sẽ đặt lại toàn bộ dữ liệu tuần tra mẫu và khởi tạo lại hệ thống. Bạn có chắc chắn?'
      )
    ) {
      return;
    }

    StorageService.resetToDefaultSeed();
    window.location.reload();
  };

  const handleExportExcel = () => {
    try {
      const allSessions = StorageService.getPatrolSessions();
      const allIncidents = StorageService.getIncidents();
      const allCheckpoints = StorageService.getCheckpoints();
      const allAuditLogs = StorageService.getAuditLogs();
      const cfg = StorageService.getConfig();

      StorageService.recordAudit(
        currentUser.id,
        currentUser.fullName || currentUser.username,
        currentUser.role,
        'XUẤT BÁO CÁO EXCEL',
        'Nhật ký Audit Log & Toàn bộ dữ liệu',
        `Xuất file Excel gồm ${allAuditLogs.length} bản ghi Audit Log`
      );

      exportHotelPatrolExcel({
        sessions: allSessions,
        incidents: allIncidents,
        checkpoints: allCheckpoints,
        auditLogs: allAuditLogs,
        config: cfg,
      });
    } catch (err) {
      console.error('Export excel error', err);
      alert('Đã xảy ra lỗi khi xuất file Excel. Vui lòng thử lại!');
    }
  };

  const filtered = logs.filter((log) => {
    const actor = log.userName || (log as any).performedBy || '';
    const action = log.action || '';
    const details = log.details || '';
    const target = log.target || '';
    const term = searchTerm.toLowerCase();

    const matchSearch =
      actor.toLowerCase().includes(term) ||
      action.toLowerCase().includes(term) ||
      details.toLowerCase().includes(term) ||
      target.toLowerCase().includes(term);

    const matchAction =
      actionFilter === 'ALL' ||
      action.toUpperCase().includes(actionFilter.toUpperCase());

    return matchSearch && matchAction;
  });

  const getRoleBadge = (role?: string) => {
    const r = (role || 'OFFICER').toUpperCase();
    switch (r) {
      case 'MANAGER':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
            MANAGER
          </span>
        );
      case 'SUPERVISOR':
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
            SUPERVISOR
          </span>
        );
      case 'OFFICER':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
            OFFICER
          </span>
        );
      default:
        return (
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
            ADMIN
          </span>
        );
    }
  };

  // Summary counts
  const loginEventsCount = logs.filter((l) =>
    (l.action || '').includes('ĐĂNG NHẬP')
  ).length;
  const patrolEventsCount = logs.filter((l) =>
    (l.action || '').includes('TUẦN TRA') || (l.action || '').includes('BÁO CÁO')
  ).length;
  const incidentEventsCount = logs.filter((l) =>
    (l.action || '').includes('SỰ CỐ') || (l.action || '').includes('CHỈ ĐẠO')
  ).length;

  return (
    <div id="system-audit-view" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            NHẬT KÝ HỆ THỐNG / AUDIT LOG & CẤU HÌNH AN NINH
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lưu vết bất biến toàn bộ hoạt động: đăng nhập, quét checkpoint, ghi nhận sự cố, xuất file và duyệt sửa dữ liệu
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="py-2 px-3.5 bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
            title="Xuất toàn bộ nhật ký Audit Log sang bảng tính Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            Xuất Excel Audit
          </button>

          <button
            onClick={() => setLogs(StorageService.getAuditLogs())}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới Audit Log
          </button>
        </div>
      </div>

      {/* Audit Stats Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng bản ghi Audit</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{logs.length}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Chế độ ghi bất biến (Append-Only)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nhật ký Đăng nhập</div>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{loginEventsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Xác thực người dùng</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sự kiện Tuần tra</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{patrolEventsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bắt đầu & hoàn thành ca</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sự cố & Chỉ đạo</div>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{incidentEventsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ghi nhận lỗi & Phê duyệt</div>
        </div>
      </div>

      {/* System Settings Block (Cấu hình hệ thống khách sạn) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              CẤU HÌNH THÔNG TIN KHÁCH SẠN VÀ TIÊU CHUẨN TUẦN TRA
            </h3>
          </div>
          {canEditConfig ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              <Shield className="w-3 h-3" /> Quyền Quản lý: Được phép chỉnh sửa & lưu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <Lock className="w-3 h-3 text-slate-400" /> Chế độ xem thông số an ninh tiêu chuẩn
            </span>
          )}
        </div>

        {configSavedNotice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{configSavedNotice}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tên cơ sở lưu trú / Khách sạn 5 sao:
            </label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              disabled={!canEditConfig}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 ${
                !canEditConfig ? 'opacity-80 cursor-not-allowed bg-slate-900/60' : ''
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Bộ phận an ninh & bảo vệ:</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              disabled={!canEditConfig}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 ${
                !canEditConfig ? 'opacity-80 cursor-not-allowed bg-slate-900/60' : ''
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Địa chỉ cơ sở (Phú Quốc, Kiên Giang):
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!canEditConfig}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 ${
                !canEditConfig ? 'opacity-80 cursor-not-allowed bg-slate-900/60' : ''
              }`}
              placeholder="Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Thời gian lưu trữ dữ liệu kiểm toán (Ngày):
            </label>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              disabled={!canEditConfig}
              min={30}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 ${
                !canEditConfig ? 'opacity-80 cursor-not-allowed bg-slate-900/60' : ''
              }`}
              required
            />
          </div>

          <div className="flex flex-col justify-center space-y-2 pt-1">
            <label className={`flex items-center space-x-2 text-slate-200 ${canEditConfig ? 'cursor-pointer' : 'cursor-default'}`}>
              <input
                type="checkbox"
                checked={requirePhotoOnFail}
                onChange={(e) => setRequirePhotoOnFail(e.target.checked)}
                disabled={!canEditConfig}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-950"
              />
              <span className="font-semibold">Bắt buộc chụp hình kèm đóng dấu khi Checkpoint có lỗi FAIL</span>
            </label>

            <label className={`flex items-center space-x-2 text-slate-200 ${canEditConfig ? 'cursor-pointer' : 'cursor-default'}`}>
              <input
                type="checkbox"
                checked={watermarkHotelName}
                onChange={(e) => setWatermarkHotelName(e.target.checked)}
                disabled={!canEditConfig}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-950"
              />
              <span className="font-semibold">Đóng dấu logo bảo an & GPS lên hình ảnh hiện trường</span>
            </label>
          </div>

          <div className="flex flex-col justify-center space-y-2 pt-1 text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Yêu cầu quét mã QR xác thực tại từng trạm (Chống gian lận)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Cho phép Giám sát viên xác thực ngoại lệ có lưu vết Audit</span>
            </div>
          </div>

          {canEditConfig && (
            <div className="md:col-span-2 flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetDemoData}
                className="px-3.5 py-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-800 rounded-xl transition flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                Khôi phục Dữ liệu Mẫu (Reset Demo)
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Lưu Thay Đổi Cấu Hình
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Filter Bar for Audit Logs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Người thực hiện, Hành động, Chi tiết, Mã..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả hành động ({logs.length})</option>
            <option value="ĐĂNG NHẬP">Đăng nhập / Xác thực</option>
            <option value="TUẦN TRA">Bắt đầu & Hoàn thành Tuần tra</option>
            <option value="SỰ CỐ">Ghi nhận sự cố</option>
            <option value="DUYỆT">Duyệt & Chỉ đạo xử lý</option>
            <option value="CẤU HÌNH">Cấu hình hệ thống</option>
            <option value="XUẤT">Xuất file báo cáo (PDF / Excel)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table: Thời gian, Người thực hiện, Quyền, Hành động, Mục tiêu, Chi tiết */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4 font-bold w-40">Thời Gian</th>
                <th className="py-3 px-4 font-bold">Người Thực Hiện</th>
                <th className="py-3 px-4 font-bold">Phân Quyền</th>
                <th className="py-3 px-4 font-bold">Hành Động</th>
                <th className="py-3 px-4 font-bold">Mục Tiêu</th>
                <th className="py-3 px-4 font-bold">Chi Tiết Sự Kiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Không tìm thấy bản ghi Audit Log nào phù hợp với từ khóa lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const actorName =
                    log.userName || (log as any).performedBy || 'Hệ thống';
                  const roleValue =
                    log.userRole || (log as any).role || 'OFFICER';

                  return (
                    <tr key={log.id} className="hover:bg-slate-850/60 transition">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{actorName}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          ID: {log.userId}
                        </div>
                      </td>

                      <td className="py-3 px-4">{getRoleBadge(roleValue)}</td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-amber-300 font-mono text-[11px] inline-block bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                        {log.target || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-md leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
