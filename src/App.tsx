import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  PlayCircle,
  MapPin,
  ClipboardList,
  Users,
  ShieldAlert,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  QrCode,
} from 'lucide-react';
import {
  User,
  HotelSystemConfig,
  Checkpoint,
  ChecklistTemplate,
  PatrolSession,
  DashboardStats,
} from './types';
import { StorageService } from './services/storage';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PatrolExecutionView } from './components/PatrolExecutionView';
import { CheckpointManagement } from './components/CheckpointManagement';
import { ChecklistManagement } from './components/ChecklistManagement';
import { EmployeeManagement } from './components/EmployeeManagement';
import { IncidentsView } from './components/IncidentsView';
import { DispatchCommandCenter } from './components/DispatchCommandCenter';
import { ReportsView } from './components/ReportsView';
import { SystemAuditView } from './components/SystemAuditView';
import { ReportDetailModal } from './components/ReportDetailModal';
import { StandaloneReportView } from './components/StandaloneReportView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    StorageService.getCurrentUser()
  );
  const [config, setConfig] = useState<HotelSystemConfig>(() =>
    StorageService.getConfig()
  );
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() =>
    StorageService.getCheckpoints()
  );
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>(() =>
    StorageService.getChecklists()
  );
  const [stats, setStats] = useState<DashboardStats>(() =>
    StorageService.getDashboardStats()
  );

  // Standalone Direct Report View (for mobile print / PDF download escaping iframe)
  const [urlReportSession, setUrlReportSession] = useState<PatrolSession | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reportId = params.get('report') || params.get('viewReport') || params.get('printSession');
      if (reportId) {
        const all = StorageService.getPatrolSessions();
        const found = all.find((s) => s.id === reportId);
        if (found) return found;
        if (all.length > 0) return all[0];
      }
    }
    return null;
  });

  // Active Navigation Tab: 'dashboard' | 'patrol' | 'checkpoints' | 'checklists' | 'employees' | 'reports' | 'incidents' | 'audit'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal for inspecting a specific completed report
  const [inspectedSession, setInspectedSession] = useState<PatrolSession | null>(null);

  // Set default tab when user logs in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'OFFICER') {
        setActiveTab('patrol');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser?.id]);

  // Real-time synchronization across all tabs and components
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      refreshAllData();
    });
    return unsubscribe;
  }, []);

  const refreshAllData = () => {
    setCheckpoints(StorageService.getCheckpoints());
    setChecklists(StorageService.getChecklists());
    setStats(StorageService.getDashboardStats());
    setConfig(StorageService.getConfig());
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    refreshAllData();
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
  };

  const handleSessionFinished = (session: PatrolSession) => {
    refreshAllData();
    // Open completed report modal immediately as requested in workflow
    setInspectedSession(session);
  };

  // If direct standalone report URL requested (e.g. on mobile outside iframe)
  if (urlReportSession) {
    return (
      <StandaloneReportView
        session={urlReportSession}
        config={config}
        onBack={() => {
          window.history.pushState({}, '', window.location.pathname);
          setUrlReportSession(null);
        }}
      />
    );
  }

  // If not logged in, render strict Section II / IV Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation Items matching Section V:
  // [ BẮT ĐẦU TUẦN TRA ] [ QUẢN LÝ CHECKPOINT ] [ QUẢN LÝ CHECKLIST ] [ QUẢN LÝ NHÂN VIÊN ] [ BÁO CÁO ] [ INCIDENT ] [ DASHBOARD ] [ QUẢN TRỊ HỆ THỐNG ] [ ĐĂNG XUẤT ]
  const navItems = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
      roles: ['MANAGER', 'SUPERVISOR', 'ADMIN'],
    },
    {
      id: 'patrol',
      label: 'TUẦN TRA AN NINH',
      icon: PlayCircle,
      roles: ['MANAGER', 'SUPERVISOR', 'OFFICER', 'ADMIN'],
      highlight: true,
    },
    {
      id: 'checkpoints',
      label: 'QUẢN LÝ CHECKPOINT',
      icon: MapPin,
      roles: ['MANAGER', 'SUPERVISOR', 'ADMIN'],
    },
    {
      id: 'checklists',
      label: 'QUẢN LÝ CHECKLIST',
      icon: ClipboardList,
      roles: ['MANAGER', 'SUPERVISOR', 'ADMIN'],
    },
    {
      id: 'employees',
      label: 'QUẢN LÝ NHÂN VIÊN',
      icon: Users,
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      id: 'reports',
      label: 'BÁO CÁO TUẦN TRA',
      icon: FileText,
      roles: ['MANAGER', 'SUPERVISOR', 'OFFICER', 'ADMIN'],
    },
    {
      id: 'incidents',
      label: 'ĐIỀU PHỐI SỰ CỐ',
      icon: ShieldAlert,
      roles: ['MANAGER', 'SUPERVISOR', 'OFFICER', 'ADMIN'],
    },
    {
      id: 'audit',
      label: 'AUDIT LOG & CẤU HÌNH',
      icon: Settings,
      roles: ['MANAGER', 'ADMIN'],
    },
  ];

  const permittedNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top Navbar with user info, live clock, and [ ĐĂNG XUẤT ] */}
      <Navbar
        currentUser={currentUser}
        config={config}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Navigation Sub-Bar (Section V Menu Buttons) */}
      <div className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-16 z-20 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            {permittedNavItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition duration-150 cursor-pointer ${
                    isActive
                      ? tab.highlight
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'bg-slate-800 text-amber-400 border border-slate-700 shadow'
                      : tab.highlight
                      ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>[ {tab.label} ]</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            currentUser={currentUser}
            config={config}
            onViewReport={(sess) => setInspectedSession(sess)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'patrol' && (
          <PatrolExecutionView
            currentUser={currentUser}
            config={config}
            checkpoints={checkpoints}
            checklists={checklists}
            onSessionFinished={handleSessionFinished}
          />
        )}

        {activeTab === 'checkpoints' && (
          <CheckpointManagement
            currentUser={currentUser}
            config={config}
            checklists={checklists}
            onDataChanged={refreshAllData}
          />
        )}

        {activeTab === 'checklists' && (
          <ChecklistManagement
            currentUser={currentUser}
            onDataChanged={refreshAllData}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement
            currentUser={currentUser}
            onDataChanged={refreshAllData}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            currentUser={currentUser}
            config={config}
            onSelectSessionForDetail={(sess) => setInspectedSession(sess)}
          />
        )}

        {activeTab === 'incidents' && (
          <DispatchCommandCenter
            currentUser={currentUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'audit' && (
          <SystemAuditView
            currentUser={currentUser}
            config={config}
            onConfigUpdated={(newCfg) => setConfig(newCfg)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="text-[11px] text-slate-400">
            Hệ thống Quản lý Tuần tra An ninh • Tiêu chuẩn Khách sạn Quốc tế 5 Sao
          </div>
        </div>
      </footer>

      {/* Full Report Detail & PDF/Excel Modal */}
      {inspectedSession && (
        <ReportDetailModal
          isOpen={Boolean(inspectedSession)}
          onClose={() => setInspectedSession(null)}
          session={inspectedSession}
          config={config}
          currentUser={currentUser}
          onSessionUpdated={refreshAllData}
          onReopenPatrol={(session) => {
            setInspectedSession(null);
            refreshAllData();
            setActiveTab('patrol');
          }}
        />
      )}
    </div>
  );
}
