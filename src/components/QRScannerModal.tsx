import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Checkpoint } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedValue: string) => void;
  availableCheckpoints: Checkpoint[];
  targetCheckpoint?: Checkpoint | null;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  availableCheckpoints,
  targetCheckpoint,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const qrRegionId = 'html5qr-code-full-region';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setValidationError(null);
      setManualCode('');
      return;
    }

    // Auto-start camera if supported
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn('Camera failed to start or access denied:', err);
      setCameraError(
        'Không thể mở Camera thực tế (quyền truy cập chưa cấp hoặc thiết bị không có webcam). Bạn có thể dùng tính năng Tải ảnh QR hoặc chọn Mã kiểm tra mô phỏng bên dưới.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
    setCameraActive(false);
  };

  const handleDetectedCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    // Validate if matching checkpoint
    const found = availableCheckpoints.find(
      (c) => c.id.toUpperCase() === trimmed || c.qrCodeValue.toUpperCase() === trimmed
    );

    if (!found) {
      setValidationError(`Mã QR "${trimmed}" không hợp lệ hoặc không thuộc hệ thống tuần tra khách sạn!`);
      return;
    }

    if (targetCheckpoint && found.id !== targetCheckpoint.id) {
      setValidationError(`Mã quét được là "${found.id} - ${found.name}", nhưng quy trình đang yêu cầu quét đúng điểm "${targetCheckpoint.id}".`);
      return;
    }

    // Success!
    stopCamera();
    onScanSuccess(found.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }
      const decoded = await html5QrCodeRef.current.scanFile(file, true);
      handleDetectedCode(decoded);
    } catch (err) {
      setValidationError('Không nhận diện được mã QR trong hình ảnh tải lên. Vui lòng thử lại ảnh rõ nét hơn.');
    }
  };

  if (!isOpen) return null;

  return (
    <div id="qr-scanner-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div id="qr-scanner-modal-container" className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-850 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">QUÉT MÃ QR CHECKPOINT</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Quét mã QR gắn tại vị trí thực tế</p>
            </div>
          </div>
          <button
            id="close-qr-scanner-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Info */}
        {targetCheckpoint && (
          <div className="bg-amber-950/40 border-b border-amber-900/60 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-xs shrink-0">
            <span className="text-amber-300 font-semibold flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              Điểm cần quét:
            </span>
            <span className="font-mono bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-500/30 font-bold truncate">
              {targetCheckpoint.id} – {targetCheckpoint.name}
            </span>
          </div>
        )}

        {/* Scanner Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-3.5 sm:space-y-4">
          {validationError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Video Region */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-700 min-h-[260px] flex flex-col items-center justify-center">
            <div id={qrRegionId} className="w-full h-full max-h-[300px]" />

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-5 flex flex-col items-center justify-center text-center">
                <Camera className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs text-amber-400 font-medium mb-3 max-w-xs">{cameraError}</p>
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition">
                  <Upload className="w-4 h-4" />
                  Tải ảnh chụp mã QR từ thư viện
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition">
              <Upload className="w-4 h-4 text-amber-400" />
              Chọn ảnh chụp QR
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

            {!cameraActive && (
              <button
                id="retry-camera-btn"
                type="button"
                onClick={startCamera}
                className="bg-amber-600 hover:bg-amber-500 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Camera className="w-4 h-4" />
                Bật Camera lại
              </button>
            )}
          </div>

          {/* Simulator options for instant testing on computers without printing QR */}
          <div className="border-t border-slate-800 pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mô phỏng quét nhanh tại chỗ (Testing):
              </span>
              <span className="text-[10px] text-slate-500">Dành cho kiểm thử không cần in giấy</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableCheckpoints.map((cp) => (
                <button
                  key={cp.id}
                  id={`simulate-scan-${cp.id}`}
                  onClick={() => handleDetectedCode(cp.id)}
                  className={`p-2 rounded-lg text-left border text-xs transition flex flex-col ${
                    targetCheckpoint?.id === cp.id
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="font-mono font-bold text-amber-400 text-[11px]">{cp.id}</span>
                  <span className="truncate font-medium">{cp.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            id="cancel-qr-scanner-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
