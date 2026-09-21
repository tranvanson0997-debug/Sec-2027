import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Share2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { PatrolSession, HotelSystemConfig } from '../types';
import {
  generateAndDownloadPDF,
  generatePatrolReportHTML,
  generatePatrolReportInnerBody,
  getReportStyles,
  sharePatrolReportPDF,
  triggerFileDownload,
} from '../utils/pdfGenerator';

interface StandaloneReportViewProps {
  session: PatrolSession;
  config: HotelSystemConfig;
  onBack: () => void;
}

export const StandaloneReportView: React.FC<StandaloneReportViewProps> = ({
  session,
  config,
  onBack,
}) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    try {
      setStatus('generating');
      setProgressMsg('Đang khởi tạo tệp PDF A4...');
      const res = await generateAndDownloadPDF(session, config, (msg) => {
        setProgressMsg(msg);
      });
      setDownloadUrl(res.url);
      setPdfBlob(res.blob);
      setFilename(res.filename);
      setStatus('ready');
      setProgressMsg('Tệp PDF đã sẵn sàng để tải về!');
    } catch (err: any) {
      console.error('PDF error:', err);
      setStatus('error');
      setProgressMsg('Không thể xuất file nhị phân trực tiếp. Vui lòng dùng nút In Báo Cáo.');
    }
  };

  const handleShare = async () => {
    await sharePatrolReportPDF(session, config, pdfBlob || undefined, filename || undefined);
  };

  const reportHtml = generatePatrolReportHTML(session, config);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Mobile-Friendly Action Bar (Hidden during Print) */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md px-3 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Báo cáo tuần tra an ninh
            </h1>
            <span className="text-[11px] font-mono text-amber-400">{session.id}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Print / Save as PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IN / LƯU PDF TRÊN ĐIỆN THOẠI</span>
          </button>

          {/* Direct File Download Button */}
          {downloadUrl ? (
            <button
              type="button"
              onClick={() => {
                if (pdfBlob) {
                  triggerFileDownload(pdfBlob, filename);
                } else if (downloadUrl) {
                  const a = document.createElement('a');
                  a.href = downloadUrl;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => a.remove(), 1000);
                }
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>[ BẤM ĐỂ TẢI FILE .PDF ]</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={status === 'generating'}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              {status === 'generating' ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Download className="w-4 h-4 text-amber-400" />
              )}
              <span>TẠO FILE .PDF</span>
            </button>
          )}

          {/* Share Button on Mobile */}
          {canShare && (
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">CHIA SẺ</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Tips Banner (Hidden during Print) */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Mẹo trên điện thoại:</strong> Nhấn <strong>[IN / LƯU PDF]</strong> &rarr; Chọn máy in{' '}
            <em>"Lưu dưới dạng PDF"</em> (trên Android) hoặc chụm mở rộng trang in (trên iPhone) để lưu file PDF chất lượng cao.
          </span>
        </div>
        {status === 'generating' && (
          <span className="text-[11px] text-amber-400 animate-pulse">{progressMsg}</span>
        )}
      </div>

      {/* Printable Report Container */}
      <div className="flex-1 overflow-auto bg-slate-200 py-4 sm:py-8 px-2 sm:px-4 flex justify-center">
        <style dangerouslySetInnerHTML={{ __html: getReportStyles() }} />
        <div
          id="printable-report-paper"
          className="report-container bg-white text-slate-900 w-full max-w-[850px] shadow-2xl rounded-sm p-4 sm:p-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none"
          dangerouslySetInnerHTML={{
            __html: generatePatrolReportInnerBody(session, config),
          }}
        />
      </div>
    </div>
  );
};
