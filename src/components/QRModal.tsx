import React, { useEffect, useState } from 'react';
import { X, Download, Printer, QrCode, Shield, Check } from 'lucide-react';
import { Checkpoint, HotelSystemConfig } from '../types';
import { generateQRCodeDataUrl, downloadQRCodePNG, printQRCodeCard } from '../utils/qrUtils';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint: Checkpoint | null;
  config: HotelSystemConfig;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  checkpoint,
  config,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (checkpoint && isOpen) {
      generateQRCodeDataUrl(checkpoint.id).then((url) => {
        setQrUrl(url);
      });
    } else {
      setQrUrl('');
      setCopied(false);
    }
  }, [checkpoint, isOpen]);

  if (!isOpen || !checkpoint) return null;

  const handleDownload = async () => {
    await downloadQRCodePNG(checkpoint.id, checkpoint.name);
  };

  const handlePrint = async () => {
    await printQRCodeCard({
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
      area: checkpoint.area,
      route: checkpoint.route,
      hotelName: config.hotelName,
      department: 'BỘ PHẬN AN NINH',
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(checkpoint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="qr-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div id="qr-modal-container" className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">QUẢN LÝ THẺ QR CHECKPOINT</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Mã định danh điểm tuần tra bảo an</p>
            </div>
          </div>
          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Physical Card Preview */}
        <div className="p-4 sm:p-6 flex flex-col items-center overflow-y-auto flex-1">
          {/* Card representation for physical printing */}
          <div className="w-full bg-white text-slate-900 rounded-xl p-3.5 sm:p-5 border-4 border-amber-600/40 shadow-inner flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-amber-600 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5 fill-amber-600" />
              {config.hotelName}
            </div>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              BỘ PHẬN AN NINH
            </div>

            <div className="my-2.5 sm:my-3 p-1.5 sm:p-2 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
              {qrUrl ? (
                <img src={qrUrl} alt={`QR ${checkpoint.id}`} className="w-40 h-40 sm:w-48 sm:h-48 block" />
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-slate-400">
                  Đang khởi tạo mã QR...
                </div>
              )}
            </div>

            <div className="inline-block bg-slate-900 text-amber-400 px-3 py-1 rounded font-mono font-extrabold text-xs sm:text-sm tracking-wider mb-1">
              {checkpoint.id}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 max-w-[260px] line-clamp-2">
              {checkpoint.name}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
              Khu vực: <strong>{checkpoint.area}</strong> | Tuyến: <strong>{checkpoint.route}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 sm:mt-4 text-xs text-slate-400">
            <span>Mã: <code className="text-amber-400 font-mono font-bold">{checkpoint.id}</code></span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium transition"
            >
              {copied ? '✓ Đã sao chép' : 'Sao chép mã'}
            </button>
          </div>
        </div>

        {/* Actions matching Section XVI: [ XEM QR ] [ TẢI QR ] [ IN QR ] */}
        <div className="bg-slate-850 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
          <button
            id="download-qr-btn"
            onClick={handleDownload}
            className="py-2.5 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition truncate"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span>[ TẢI QR ]</span>
          </button>

          <button
            id="print-qr-btn"
            onClick={handlePrint}
            className="py-2.5 px-2.5 sm:px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-600/20 transition truncate"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>[ IN THẺ DÁN ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
