import React, { useState, useEffect } from 'react';
import {
  Users,
  Radio,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Search,
  Activity,
  UserCheck,
  Shield,
  Send,
} from 'lucide-react';
import { OnlineUser, AccessNotification, User } from '../types';
import { StorageService } from '../services/storage';

interface OnlineMonitoringPanelProps {
  currentUser: User;
  onNavigateTab?: (tab: string) => void;
}

export const OnlineMonitoringPanel: React.FC<OnlineMonitoringPanelProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(() =>
    StorageService.getOnlineUsers()
  );
  const [notifications, setNotifications] = useState<AccessNotification[]>(() =>
    StorageService.getAccessNotifications()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isBroadcastingTest, setIsBroadcastingTest] = useState(false);

  const refreshData = () => {
    setOnlineUsers(StorageService.getOnlineUsers());
    setNotifications(StorageService.getAccessNotifications());
  };

  useEffect(() => {
    // Keep heartbeat alive for current user
    if (currentUser) {
      StorageService.registerOnlineUser(currentUser, 'Đang theo dõi bảng điều khiển an ninh');
      StorageService.updateHeartbeat(currentUser.id, 'Đang theo dõi bảng điều khiển an ninh');
    }
    refreshData();

    const unsubscribe = StorageService.subscribe(() => {
      refreshData();
    });

    const interval = setInterval(() => {
      refreshData();
      if (currentUser?.id) {
        StorageService.updateHeartbeat(currentUser.id);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleClearNotifications = () => {
    localStorage.removeItem('hotel_security_access_notifications_v1');
    StorageService.notifyDataChanged();
    setNotifications([]);
  };

  const handleSendTestSignal = () => {
    setIsBroadcastingTest(true);
    const senderName = currentUser.fullName?.trim() || currentUser.username || 'Cán bộ quản lý';
    StorageService.sendAccessNotification({
      userId: currentUser.id,
      userName: senderName,
      userRole: currentUser.role,
      email: currentUser.email,
      message: `Cán bộ ${senderName} gửi tín hiệu kiểm tra liên kết an ninh thời gian thực`,
      type: 'LOGIN',
    });
    setTimeout(() => setIsBroadcastingTest(false), 800);
  };

  const filteredOnlineUsers = onlineUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = (u.fullName || u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const badge = (u.badgeNumber || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    return (
      name.includes(term) ||
      email.includes(term) ||
      badge.includes(term) ||
      role.includes(term)
    );
  });

  return (
    <div
      id="online-monitoring-panel"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6"
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                THEO DÕI TRUY CẬP TRỰC TUYẾN & NHÂN VIÊN ONLINE
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                {onlineUsers.length} ĐANG ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống giám sát quản lý nhận diện nhân viên đăng nhập bằng Gmail và báo cáo thời gian thực
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSendTestSignal}
            disabled={isBroadcastingTest}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 active:scale-95 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Gửi tín hiệu kiểm tra đường truyền"
          >
            <Send className="w-3.5 h-3.5" />
            <span>[ TEST TÍN HIỆU ]</span>
          </button>
          <button
            type="button"
            onClick={refreshData}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Làm mới tức thì"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-column layout: Online Personnel Grid + Real-time Access Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (7 cols): Currently Online Personnel */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                DANH SÁCH NHÂN SỰ ĐANG TRUY CẬP ({onlineUsers.length})
              </span>
            </div>
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhân viên, email..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {filteredOnlineUsers.length === 0 ? (
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800/80 text-center text-slate-500 text-xs space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Chưa có nhân viên nào trực tuyến trong bộ lọc này.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredOnlineUsers.map((u) => {
                const displayFullName = u.fullName?.trim() || u.username || 'Cán bộ an ninh';
                const isCurrent = currentUser && (currentUser.id === u.userId || (u.email && currentUser.email?.toLowerCase() === u.email.toLowerCase()));
                const avatarChar = displayFullName.charAt(0).toUpperCase() || 'U';
                const roleLabel =
                  u.role === 'MANAGER'
                    ? 'Trưởng ca / Quản lý'
                    : u.role === 'SUPERVISOR'
                    ? 'Giám sát an ninh'
                    : u.role === 'OFFICER'
                    ? 'Nhân viên tuần tra'
                    : 'Quản trị viên';

                return (
                  <div
                    key={u.userId}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                      isCurrent
                        ? 'bg-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 hover:bg-slate-850/70 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${
                          isCurrent ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-700 text-amber-400'
                        }`}>
                          {avatarChar}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {displayFullName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              BẠN (ĐANG ĐĂNG NHẬP)
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {roleLabel}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {u.badgeNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[200px] sm:max-w-[260px]">
                            {u.email}
                          </span>
                        </div>

                        <div className="text-[11px] text-emerald-400/90 font-medium">
                          • {u.currentAction || 'Đang hoạt động trong ca'}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-slate-900/60 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 text-[11px]">
                      <div className="text-slate-400">
                        Ca trực: <strong className="text-slate-200">{u.shift}</strong>
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        Đăng nhập: {u.loginTime ? u.loginTime.substring(11, 19) : 'Vừa xong'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col (5 cols): Live Access Notification Stream */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                NHẬT KÝ TRUY CẬP HỆ THỐNG
              </span>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearNotifications}
                className="text-[11px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition"
                title="Xóa nhật ký thông báo"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 max-h-[380px] overflow-y-auto space-y-2 divide-y divide-slate-850">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-1">
                <Clock className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p>Chưa có thông báo truy cập mới.</p>
                <p className="text-[10px] text-slate-600">Khi nhân viên đăng nhập bằng Gmail, thông báo sẽ hiển thị ngay tại đây.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {notif.type === 'LOGIN'
                        ? 'ĐĂNG NHẬP HỆ THỐNG'
                        : notif.type === 'PATROL_SUBMIT'
                        ? 'GỬI BÁO CÁO TUẦN TRA'
                        : notif.type}
                    </span>
                    <span className="font-mono text-slate-500 text-[10px]">{notif.timestamp}</span>
                  </div>

                  <div className="text-xs text-white font-medium pl-2.5 border-l-2 border-amber-500/50">
                    {notif.message}
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pl-2.5">
                    <span className="font-semibold text-slate-300">{notif.userName}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{notif.email}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
