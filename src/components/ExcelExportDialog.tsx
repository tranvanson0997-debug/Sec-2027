import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Smartphone,
  Check,
  Layers,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import {
  generateHotelPatrolExcelData,
  HotelExcelExportResult,
} from '../utils/excelGenerator';
import { PatrolSession, Incident, Checkpoint, AuditLog, HotelSystemConfig } from '../types';

interface ExcelExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: PatrolSession[];
  incidents: Incident[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
  config: HotelSystemConfig;
  customFilename?: string;
  title?: string;
}

export const ExcelExportDialog: React.FC<ExcelExportDialogProps> = ({
  isOpen,
  onClose,
  sessions,
  incidents,
  checkpoints,
  auditLogs,
  config,
  customFilename,
  title = 'XUẤT DỮ LIỆU BÁO CÁO EXCEL (.XLSX)',
}) => {
  const [data, setData] = useState<HotelExcelExportResult | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const exportResult = generateHotelPatrolExcelData({
        sessions,
        incidents,
        checkpoints,
        auditLogs,
        config,
        customFilename,
      });
      setData(exportResult);
      setSharedSuccess(false);
      setDownloaded(false);
    } else {
      setData(null);
    }
  }, [isOpen, sessions.length, incidents.length, checkpoints.length, auditLogs.length]);

  if (!isOpen || !data) return null;

  const handleShare = async () => {
    if (data) {
      const res = await data.share();
      if (res) {
        setSharedSuccess(true);
      }
    }
  };

  const handleDownload = () => {
    if (data) {
      data.download();
      setDownloaded(true);
    }
  };

  return (
    <div
      id="excel-export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="excel-export-modal-container"
        className="relative w-full max-w-lg bg-slate-900 border border-emerald-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100 animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-wide uppercase">
                {title}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tương thích 100% điện thoại iPhone (iOS) & Android</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* File Status Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                    Tệp Excel (.xlsx) đã sẵn sàng!
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-300 truncate mt-0.5" title={data.filename}>
                  {data.filename}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg shrink-0">
              XLSX
            </span>
          </div>

          {/* Dataset Breakdown Card */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>DỮ LIỆU ĐÃ KẾT XUẤT (4 SHEETS TIÊU CHUẨN):</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Lịch sử tuần tra:</span>
                  <span className="font-bold text-white">{sessions.length} phiên</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Sự cố & FAIL:</span>
                  <span className="font-bold text-white">{incidents.length} mục</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Danh mục Checkpoint:</span>
                  <span className="font-bold text-white">{checkpoints.length} điểm</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Nhật ký Audit Log:</span>
                  <span className="font-bold text-white">{auditLogs.length} bản ghi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              CHỌN CÁCH LƯU HOẶC CHIA SẺ FILE:
            </label>

            {/* Option 1: Mobile Share Sheet (iOS Files / Android Drive / Zalo / Mail) */}
            {canShare && (
              <button
                type="button"
                id="btn-share-excel-mobile"
                onClick={handleShare}
                className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/60 transition cursor-pointer border border-emerald-400"
              >
                <Share2 className="w-5 h-5" />
                <span>[ LƯU VÀO TỆP (FILES) / CHIA SẺ TRÊN ĐIỆN THOẠI ]</span>
                {sharedSuccess && <Check className="w-4 h-4 text-white" />}
              </button>
            )}

            {/* Option 2: Direct Download to device */}
            <button
              type="button"
              id="btn-download-excel-file"
              onClick={handleDownload}
              className="w-full p-3.5 bg-slate-800 hover:bg-slate-750 active:scale-98 text-emerald-400 border border-emerald-800/80 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>[ BẤM ĐỂ TẢI FILE EXCEL (.XLSX) VỀ MÁY ]</span>
              {downloaded && <Check className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* User Guide Card for Mobile (iOS & Android) */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-[11px] text-slate-400 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>HƯỚNG DẪN DÀNH CHO ĐIỆN THOẠI IPHONE & ANDROID:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
              <li>
                <strong>🍏 Đối với iPhone (iOS / Safari):</strong> Bấm nút{' '}
                <span className="text-emerald-300 font-semibold">[Lưu vào Tệp / Chia sẻ]</span>{' '}
                -&gt; Chọn <em>Lưu vào Tệp (Save to Files)</em> hoặc mở ngay bằng ứng dụng <em>Excel / Numbers / Zalo</em>.
              </li>
              <li>
                <strong>🤖 Đối với Android (Chrome / Samsung):</strong> Bấm{' '}
                <span className="text-emerald-300 font-semibold">[Tải file Excel về máy]</span> để lưu vào thư mục <em>Tải về (Downloads)</em>, hoặc bấm <em>[Chia sẻ]</em> để gửi trực tiếp qua Zalo / Google Drive.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
