import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Share2,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  Smartphone,
  AlertCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { PatrolSession, HotelSystemConfig } from '../types';
import {
  generateAndDownloadPDF,
  sharePatrolReportPDF,
  generatePatrolReportHTML,
} from '../utils/pdfGenerator';

interface PDFExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: PatrolSession | null;
  config: HotelSystemConfig;
  onOpenFullScreen?: (session: PatrolSession) => void;
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  isOpen,
  onClose,
  session,
  config,
  onOpenFullScreen,
}) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('Sẵn sàng xuất file');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  // When modal opens with a session, generate the PDF file
  useEffect(() => {
    if (isOpen && session) {
      handleGeneratePDF();
    } else {
      setStatus('idle');
      setDownloadUrl(null);
      setDataUri(null);
      setErrorMessage(null);
    }
  }, [isOpen, session?.id]);

  if (!isOpen || !session) return null;

  const handleGeneratePDF = async () => {
    try {
      setStatus('generating');
      setErrorMessage(null);

      const result = await generateAndDownloadPDF(session, config, (msg) => {
        setProgressMsg(msg);
      });

      setDownloadUrl(result.url);
      setDataUri(result.dataUri);
      setFilename(result.filename);
      setStatus('ready');
      setProgressMsg('File PDF A4 đã được tạo thành công!');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setStatus('error');
      setErrorMessage(
        err?.message || 'Có lỗi khi xử lý đồ họa trên trình duyệt này. Bạn có thể sử dụng chế độ Xem Toàn Màn Hình hoặc In để lưu file PDF.'
      );
    }
  };

  const handlePrint = () => {
    if (onOpenFullScreen) {
      onOpenFullScreen(session);
      onClose();
    } else {
      window.print();
    }
  };

  const handleShare = async () => {
    if (!canShare) {
      alert('Thiết bị hoặc trình duyệt của bạn không hỗ trợ chia sẻ file trực tiếp.');
      return;
    }
    setProgressMsg('Đang mở bảng chia sẻ của điện thoại...');
    await sharePatrolReportPDF(session, config);
  };

  const standaloneUrl = `${window.location.origin}${window.location.pathname}?report=${session.id}`;

  return (
    <div
      id="pdf-export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="pdf-export-modal-container"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100 animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-wide uppercase">
                XUẤT BÁO CÁO TUẦN TRA PDF
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Tối ưu hóa 100% cho điện thoại iPhone & Android</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Session Summary Pill */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Mã phiên:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{session.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Ca trực:</span>
              <span className="font-semibold text-slate-200">{session.shift}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Nhân viên:</span>
              <span className="font-semibold text-slate-200">{session.officerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Ngày:</span>
              <span className="font-mono text-slate-300">{session.date}</span>
            </div>
          </div>

          {/* Progress / Status Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-2">
                {status === 'generating' && (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Đang kết xuất PDF A4...</span>
                  </>
                )}
                {status === 'ready' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Tệp PDF A4 đã sẵn sàng!</span>
                  </>
                )}
                {status === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-bold">Cần hỗ trợ xuất</span>
                  </>
                )}
              </span>
              {filename && (
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                  {filename}
                </span>
              )}
            </div>

            {/* Progress status text */}
            <div className="text-xs text-slate-400 font-medium pl-6">
              {progressMsg}
            </div>

            {/* Error handling details */}
            {status === 'error' && (
              <div className="text-xs bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl text-amber-200 space-y-1">
                <p>{errorMessage}</p>
                <p className="text-[11px] text-slate-300">
                  Hãy nhấn <strong>"Xem toàn màn hình & Lưu PDF"</strong> bên dưới để lưu file trực tiếp qua trình duyệt điện thoại.
                </p>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              CHỌN CÁCH XUẤT HOẶC LƯU BÁO CÁO:
            </label>

            {/* If PDF ready: Show BIG PHYSICAL DOWNLOAD LINK */}
            {status === 'ready' && downloadUrl && (
              <div className="space-y-2">
                <a
                  href={downloadUrl}
                  download={filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition cursor-pointer animate-pulse border border-emerald-400"
                >
                  <Download className="w-5 h-5" />
                  <span>[ BẤM ĐỂ TẢI FILE PDF VỀ MÁY ]</span>
                </a>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 bg-slate-800 hover:bg-slate-750 active:scale-98 text-emerald-400 border border-emerald-800/60 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>[ XEM TRỰC TIẾP FILE PDF TRÊN TRÌNH DUYỆT ]</span>
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Full-Screen View & Print */}
              <button
                type="button"
                id="btn-open-fullscreen-view"
                onClick={handlePrint}
                className="p-3.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>[ XEM TOÀN MÀN HÌNH & IN PDF ]</span>
              </button>

              {/* Option 2: Standalone URL (Escapes Iframe on Phone) */}
              <a
                href={standaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-slate-800 hover:bg-slate-750 active:scale-98 text-slate-200 border border-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>[ MỞ TRANG ĐỘC LẬP TRÊN SAFARI/CHROME ]</span>
              </a>

              {/* Option 3: Regenerate PDF if needed */}
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={status === 'generating'}
                className="p-3.5 bg-slate-800 hover:bg-slate-750 active:scale-98 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {status === 'generating' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Download className="w-4 h-4 text-amber-400" />
                )}
                <span>[ TẠO LẠI FILE .PDF ]</span>
              </button>

              {/* Option 4: Web Share API */}
              {canShare && (
                <button
                  type="button"
                  id="btn-share-pdf-mobile"
                  onClick={handleShare}
                  disabled={status === 'generating'}
                  className="p-3.5 bg-emerald-700 hover:bg-emerald-600 active:scale-98 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>[ CHIA SẺ QUA ZALO / GMAIL ]</span>
                </button>
              )}
            </div>
          </div>

          {/* User Guide Card for Mobile */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>HƯỚNG DẪN DÀNH CHO ĐIỆN THOẠI DI ĐỘNG:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>
                <strong>Nút [TẢI FILE PDF VỀ MÁY]:</strong> Lưu trực tiếp tệp <code>.pdf</code> vào ứng dụng <em>Tệp (Files)</em> trên iPhone hoặc mục <em>Tải về (Downloads)</em> trên Android.
              </li>
              <li>
                <strong>Nút [XEM TOÀN MÀN HÌNH & IN]:</strong> Hiển thị toàn bộ báo cáo A4 chuẩn và mở cửa sổ in của điện thoại để lưu PDF cực nét.
              </li>
              <li>
                <strong>Nút [MỞ TRANG ĐỘC LẬP]:</strong> Dùng khi trình duyệt nhúng hoặc iframe chặn tải file, mở trực tiếp bằng trình duyệt gốc của máy.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
