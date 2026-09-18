import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, AlertCircle, ShieldAlert, Mail, UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { StorageService } from '../services/storage';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    const cleanGmail = gmail.trim();

    if (!cleanUsername) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập đã đăng ký trong Quản lý nhân viên!');
      return;
    }
    if (!cleanGmail) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail chính chủ đã đăng ký!');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu xác thực an ninh!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.authenticate(cleanUsername, cleanGmail, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          result.message ||
            'TRUY CẬP BỊ TỪ CHỐI: Tên đăng nhập hoặc Gmail không tồn tại trong danh sách Quản lý nhân viên!'
        );
      }
    }, 200);
  };

  return (
    <div
      id="login-page"
      className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-amber-500 selection:text-slate-950"
    >
      {/* Background Luxury Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div
        id="login-box-container"
        className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 p-5 sm:p-7 backdrop-blur-md"
      >
        {/* Emblem & Branding */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2.5 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
            HỆ THỐNG AN NINH KHÁCH SẠN
          </h1>
          <h2 className="text-xs font-bold text-amber-400 tracking-widest uppercase mt-0.5">
            XÁC THỰC BẢO AN & ĐĂNG NHẬP CHÍNH CHỦ
          </h2>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-300 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Đối chiếu trực tiếp: Tên đăng nhập & Gmail trong Quản lý nhân viên</span>
          </div>
        </div>

        {/* Error Alert (Đá ra nếu sai thông tin) */}
        {errorMessage && (
          <div
            id="login-error-alert"
            className="mb-4 p-3.5 bg-red-950/95 border-2 border-red-700 rounded-xl text-red-200 text-xs font-semibold flex items-start gap-2.5 animate-pulse shadow-lg shadow-red-950/50"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-black text-red-300 tracking-wide uppercase">CẢNH BÁO TỪ CHỐI TRUY CẬP:</div>
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Login Form - Cá nhân tự nhập thông tin */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Tên đăng nhập */}
          <div>
            <label
              htmlFor="username-input"
              className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
            >
              1. Tên đăng nhập (Username đã đăng ký):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-4 h-4 text-amber-400" />
              </div>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (ví dụ: manager, supervisor, officer1...)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * Tên đăng nhập hoặc Họ tên nhân viên đã được Trưởng bộ phận An ninh cấp.
            </p>
          </div>

          {/* Field 2: Gmail đăng nhập chính chủ */}
          <div>
            <label
              htmlFor="gmail-input"
              className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
            >
              2. Gmail đăng nhập (* Phải khớp hồ sơ Quản lý nhân viên):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4 text-amber-400" />
              </div>
              <input
                id="gmail-input"
                type="email"
                autoComplete="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="Ví dụ: nguyenvana.security@gmail.com..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                required
              />
            </div>
            <p className="text-[10px] text-amber-400/90 mt-1">
              * Không đúng Gmail đã đăng ký trong hệ thống sẽ tự động bị ĐÁ RA ngay lập tức.
            </p>
          </div>

          {/* Field 3: Mật khẩu xác thực */}
          <div>
            <label
              htmlFor="password-input"
              className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1"
            >
              3. Mật khẩu xác thực:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu an ninh (Mặc định: 123456)..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                required
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black tracking-wider uppercase text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>ĐANG ĐỐI CHIẾU DỮ LIỆU NHÂN VIÊN...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  <span>[ XÁC THỰC THÔNG TIN & ĐĂNG NHẬP ]</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Policy Reminder */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              QUY CHUẨN AN TOÀN ĐĂNG NHẬP:
            </div>
            <p className="leading-relaxed">
              • Tên đăng nhập và Gmail phải <strong>khớp chính xác</strong> với hồ sơ nhân viên đã đăng ký.
            </p>
            <p className="leading-relaxed">
              • Hệ thống sẽ <strong>tự động từ chối và đá ra</strong> nếu Gmail không có trong danh sách phê duyệt.
            </p>
            <p className="leading-relaxed text-amber-400/80">
              • Nhập sai mật khẩu liên tiếp quá 5 lần sẽ tự động khóa tài khoản nhân viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
