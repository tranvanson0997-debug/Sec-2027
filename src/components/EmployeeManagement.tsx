import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Lock,
  Unlock,
  KeyRound,
  History,
  ShieldCheck,
  Search,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface EmployeeManagementProps {
  currentUser: User;
  onDataChanged: () => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  currentUser,
  onDataChanged,
}) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [onlineUsers, setOnlineUsers] = useState<string[]>(() =>
    StorageService.getOnlineUsers().map((u) => u.userId)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewHistoryUser, setViewHistoryUser] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('OFFICER');
  const [formBadgeNumber, setFormBadgeNumber] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const refreshUsers = () => {
    setUsers(StorageService.getUsers());
    setOnlineUsers(StorageService.getOnlineUsers().map((u) => u.userId));
    onDataChanged();
  };

  const openAddUser = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormFullName('');
    setFormRole('OFFICER');
    setFormBadgeNumber(`SEC-${String(Math.floor(100 + Math.random() * 900))}`);
    setFormPhone('');
    setFormEmail('');
    setFormPassword('123456');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormFullName(u.fullName);
    setFormRole(u.role);
    setFormBadgeNumber(u.badgeNumber);
    setFormPhone(u.phone);
    setFormEmail(u.email);
    setFormPassword(u.passwordHash || '123456');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formUsername.trim() || !formFullName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên đăng nhập và Họ tên nhân viên!');
      return;
    }

    if (!formEmail.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ Gmail chính chủ của nhân viên (Dùng để xác thực đăng nhập)!');
      return;
    }

    const cleanEmail = formEmail.trim().toLowerCase();
    const cleanUsername = formUsername.trim().toLowerCase();

    // Check duplicate email
    const emailExists = users.some(
      (u) =>
        (!editingUser || u.id !== editingUser.id) &&
        u.email &&
        u.email.trim().toLowerCase() === cleanEmail
    );
    if (emailExists) {
      setErrorMsg(`Địa chỉ Gmail "${formEmail.trim()}" đã được đăng ký cho một nhân viên khác!`);
      return;
    }

    try {
      if (editingUser) {
        // Edit
        const updated: User = {
          ...editingUser,
          fullName: formFullName.trim(),
          role: formRole,
          badgeNumber: formBadgeNumber.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          passwordHash: formPassword.trim() || editingUser.passwordHash || '123456',
        };
        StorageService.updateUser(updated, currentUser);
        setSuccessMsg(`Đã cập nhật thông tin nhân viên ${updated.fullName} (Gmail: ${updated.email})`);
      } else {
        // Add
        const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
        if (exists) {
          setErrorMsg('Tên đăng nhập này đã tồn tại!');
          return;
        }

        const newUser = StorageService.addUser(
          {
            username: cleanUsername,
            fullName: formFullName.trim(),
            role: formRole,
            badgeNumber: formBadgeNumber.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim(),
            passwordHash: formPassword.trim() || '123456',
            status: 'ACTIVE',
          },
          currentUser
        );
        setSuccessMsg(`Đã tạo tài khoản cho nhân viên ${newUser.fullName} (Gmail: ${newUser.email} - Mật khẩu: ${formPassword.trim() || '123456'})`);
      }

      setIsModalOpen(false);
      refreshUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleLock = (u: User) => {
    try {
      StorageService.toggleUserStatus(u.id, currentUser);
      refreshUsers();
      setSuccessMsg(`Đã đổi trạng thái tài khoản ${u.fullName} thành ${u.status === 'ACTIVE' ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = (u: User) => {
    if (!confirm(`Bạn có chắc muốn đặt lại mật khẩu cho ${u.fullName} về mặc định "123456"?`)) return;
    try {
      const pin = StorageService.resetUserPassword(u.id, currentUser);
      refreshUsers();
      alert(`Đã đặt lại mật khẩu cho ${u.fullName}. Mật khẩu mới là: ${pin}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  const allPatrolSessions = StorageService.getPatrolSessions();

  return (
    <div id="employee-management-view" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            QUẢN LÝ NHÂN VIÊN AN NINH & PHÂN QUYỀN
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý danh sách nhân sự, phân cấp 4 cấp quyền, khóa tài khoản và kiểm tra lịch sử tuần tra
          </p>
        </div>

        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
          <button
            id="add-employee-btn"
            onClick={openAddUser}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 text-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            [ + THÊM NHÂN VIÊN ]
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, username, mã thẻ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả vai trò ({users.length})</option>
            <option value="MANAGER">Security Manager</option>
            <option value="SUPERVISOR">Security Supervisor</option>
            <option value="OFFICER">Security Officer</option>
            <option value="ADMIN">System Admin</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4 font-bold">Họ & Tên / Thẻ</th>
                <th className="py-3 px-4 font-bold">Tên Đăng Nhập</th>
                <th className="py-3 px-4 font-bold">Phân Quyền</th>
                <th className="py-3 px-4 font-bold">Liên Hệ</th>
                <th className="py-3 px-4 font-bold text-center">Trạng Thái</th>
                <th className="py-3 px-4 font-bold">Đăng Nhập Gần Nhất</th>
                <th className="py-3 px-4 font-bold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((u) => {
                const userPatrols = allPatrolSessions.filter((s) => s.officerId === u.id);
                return (
                  <tr key={u.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{u.fullName || u.username}</span>
                        {onlineUsers.includes(u.id) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-amber-400">Mã: {u.badgeNumber || 'SEC-000'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 font-semibold">
                      {u.username}
                    </td>

                    <td className="py-3 px-4">
                      {u.role === 'MANAGER' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          SECURITY MANAGER
                        </span>
                      )}
                      {u.role === 'SUPERVISOR' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          SUPERVISOR
                        </span>
                      )}
                      {u.role === 'OFFICER' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OFFICER
                        </span>
                      )}
                      {u.role === 'ADMIN' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          SYSTEM ADMIN
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      <div>{u.phone}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                          <Lock className="w-3 h-3" /> Đã khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {u.lastLogin || 'Chưa đăng nhập'}
                    </td>

                    {/* Actions: Sửa, Khóa, Đặt lại mật khẩu, Lịch sử tuần tra */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Lịch sử tuần tra */}
                        <button
                          id={`history-user-${u.id}`}
                          onClick={() => setViewHistoryUser(u)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Xem lịch sử tuần tra"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Sửa */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            id={`edit-user-${u.id}`}
                            onClick={() => openEditUser(u)}
                            className="p-1.5 bg-slate-800 hover:bg-blue-600/30 text-blue-300 rounded-lg transition"
                            title="Chỉnh sửa thông tin / phân quyền"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Đặt lại mật khẩu */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            id={`reset-pwd-${u.id}`}
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 rounded-lg transition"
                            title="Đặt lại mật khẩu (về 123456)"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}

                        {/* Khóa / Mở khóa */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && u.id !== currentUser.id && (
                          <button
                            id={`lock-user-${u.id}`}
                            onClick={() => handleToggleLock(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.status === 'ACTIVE'
                                ? 'bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400'
                                : 'bg-red-950 text-red-300 hover:bg-slate-800'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 text-xs">
            <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wide">
              {editingUser ? 'SỬA THÔNG TIN NHÂN VIÊN' : 'THÊM NHÂN VIÊN MỚI'}
            </h3>
            <p className="text-slate-400 mb-4">Cấu hình hồ sơ an ninh và cấp quyền truy cập hệ thống</p>

            {errorMsg && (
              <div className="p-3 mb-3 bg-red-950 border border-red-800 rounded-xl text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên đăng nhập: *</label>
                <input
                  type="text"
                  value={formUsername}
                  disabled={Boolean(editingUser)}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="officer3, guard_a..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Họ và tên đầy đủ: *</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Nguyễn Văn A..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phân quyền:</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="OFFICER">3. Security Officer</option>
                    <option value="SUPERVISOR">2. Security Supervisor</option>
                    <option value="MANAGER">1. Security Manager</option>
                    <option value="ADMIN">4. System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mã số thẻ bảo an:</label>
                  <input
                    type="text"
                    value={formBadgeNumber}
                    onChange={(e) => setFormBadgeNumber(e.target.value)}
                    placeholder="SEC-055..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0908..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gmail chính chủ (* Bắt buộc):
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mật khẩu đăng nhập (Để trống nếu dùng mặc định: 123456):
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (Mặc định: 123456)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-amber-400/90 mt-1">
                  * Nhân viên bắt buộc phải nhập đúng Tên đăng nhập và Gmail chính chủ này để đăng nhập vào hệ thống.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow"
                >
                  {editingUser ? 'Lưu cập nhật' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Patrol History Modal */}
      {viewHistoryUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 text-xs max-h-[85vh] flex flex-col">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              LỊCH SỬ TUẦN TRA - {viewHistoryUser.fullName}
            </h3>
            <p className="text-slate-400 mb-4">
              Mã thẻ: <strong className="text-amber-400 font-mono">{viewHistoryUser.badgeNumber}</strong> | Vai trò: {viewHistoryUser.role}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2">
              {allPatrolSessions.filter((s) => s.officerId === viewHistoryUser.id).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nhân viên này chưa có phiên tuần tra nào được lưu trữ.
                </div>
              ) : (
                allPatrolSessions
                  .filter((s) => s.officerId === viewHistoryUser.id)
                  .map((s) => (
                    <div key={s.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{s.id}</div>
                        <div className="text-slate-400 text-[11px]">
                          {s.date} | {s.shift} ({s.startTime} - {s.endTime || 'Đang thực hiện'})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">
                          {s.summary.checkedCount}/{s.summary.totalCheckpoints} Điểm
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Đạt: {s.summary.passCount} | Lỗi: {s.summary.failCount}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setViewHistoryUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
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
