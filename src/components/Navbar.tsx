import React, { useState, useEffect } from 'react';
import {
  Shield,
  LogOut,
  User,
  Clock,
  Bell,
  RefreshCw,
  KeyRound,
  Radio,
  CheckCircle2,
  Mail,
  X,
} from 'lucide-react';
import { User as UserType, HotelSystemConfig, AccessNotification } from '../types';
import { StorageService } from '../services/storage';

interface NavbarProps {
  currentUser: UserType;
  config: HotelSystemConfig;
  onLogout: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  config,
  onLogout,
  activeTab,
  onSelectTab,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [notifications, setNotifications] = useState<AccessNotification[]>(() =>
    StorageService.getAccessNotifications()
  );
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(() => StorageService.getOnlineUsers().length);
  const [activeToast, setActiveToast] = useState<AccessNotification | null>(null);
  const [unresolvedIncidentsCount, setUnresolvedIncidentsCount] = useState<number>(() =>
    StorageService.getUnresolvedIncidentsCount()
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' | ' + now.toLocaleDateString('vi-VN')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to storage notifications & incidents count
  useEffect(() => {
    let lastNotifId = notifications[0]?.id;

    const handleUpdate = () => {
      const latest = StorageService.getAccessNotifications();
      setNotifications(latest);
      setOnlineCount(StorageService.getOnlineUsers().length);
      setUnresolvedIncidentsCount(StorageService.getUnresolvedIncidentsCount());

      if (latest.length > 0 && latest[0].id !== lastNotifId) {
        lastNotifId = latest[0].id;
        setActiveToast(latest[0]);
        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
          setActiveToast(null);
        }, 5000);
      }
    };

    const unsubscribe = StorageService.subscribe(handleUpdate);
    return unsubscribe;
  }, []);

  const getRoleBadge = (role: UserType['role']) => {
    switch (role) {
      case 'MANAGER':
        return {
          label: 'SECURITY MANAGER',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'SUPERVISOR':
        return {
          label: 'SECURITY SUPERVISOR',
          classes: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'OFFICER':
        return {
          label: 'SECURITY OFFICER',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'ADMIN':
        return {
          label: 'SYSTEM ADMIN',
          classes: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Hotel */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSelectTab(currentUser.role === 'OFFICER' ? 'patrol' : 'dashboard')}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-black text-white tracking-wide">
                  HỆ THỐNG TUẦN TRA AN NINH
                </div>
              </div>
            </button>
          </div>

          {/* Real-time Clock & Online Indicator */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Online Badge for Managers/Supervisors */}
            {['MANAGER', 'SUPERVISOR', 'ADMIN'].includes(currentUser.role) && (
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition cursor-pointer"
                title="Xem danh sách nhân viên trực tuyến"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">{onlineCount} Online</span>
              </button>
            )}

            <div className="flex items-center text-xs text-slate-400 font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 mr-2 text-amber-400" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* User Info & Notification Bell & Logout button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Dispatch Incidents Alert Bell */}
            <button
              id="dispatch-incidents-nav-btn"
              type="button"
              onClick={() => onSelectTab('incidents')}
              className={`relative px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                unresolvedIncidentsCount > 0
                  ? 'bg-red-950/80 hover:bg-red-900 border-red-500 text-red-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
              }`}
              title="Trung tâm điều phối sự cố an ninh"
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Điều Phối</span>
              {unresolvedIncidentsCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black">
                  {unresolvedIncidentsCount}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">0</span>
              )}
            </button>

            {/* Notification Bell with Dropdown */}
            {['MANAGER', 'SUPERVISOR', 'ADMIN'].includes(currentUser.role) && (
              <div className="relative">
                <button
                  id="access-notification-bell"
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Thông báo truy cập nhân viên"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                {isNotifOpen && (
                  <div
                    id="access-notification-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase">
                          THÔNG BÁO TRUY CẬP ({notifications.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-800/80">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 text-xs">
                          Chưa có thông báo truy cập nào
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className="pt-2 first:pt-0 space-y-0.5 text-xs">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-400">{n.userName}</span>
                              <span className="font-mono text-slate-500">{n.timestamp}</span>
                            </div>
                            <div className="text-slate-200 text-xs font-medium">{n.message}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{n.email}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsNotifOpen(false);
                        onSelectTab('dashboard');
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-xl text-xs font-bold text-center transition block"
                    >
                      [ Xem Trung Tâm Giám Sát Online ]
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{currentUser.fullName || currentUser.username}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.classes}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                <span>{currentUser.email || currentUser.username}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Thẻ: {currentUser.badgeNumber || 'SEC-042'}</span>
              </div>
            </div>

            {/* Logout button: TẤT CẢ NÚT PHẢI HOẠT ĐỘNG THẬT */}
            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-300 border border-slate-700 hover:border-red-700/60 rounded-xl transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">[ ĐĂNG XUẤT ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Access Toast Alert: "Nguyễn Văn A" Đang truy cập */}
      {activeToast && (
        <div
          id="access-toast-banner"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 border-2 border-emerald-500/70 p-4 rounded-2xl shadow-2xl space-y-1 animate-slide-up"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              THÔNG BÁO HỆ THỐNG AN NINH
            </span>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-sm font-bold text-white">
            "{activeToast.userName}" Đang truy cập hệ thống
          </div>
          <div className="text-xs text-slate-300">
            Gmail: <strong className="text-amber-400 font-mono">{activeToast.email}</strong>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-1">
            Thời gian: {activeToast.timestamp}
          </div>
        </div>
      )}
    </header>
  );
};
