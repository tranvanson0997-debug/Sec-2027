import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertTriangle, ShieldCheck } from 'lucide-react';
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);

  const qrRegionId = 'html5qr-code-full-region';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const processingScanRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setValidationError(null);
      setStartingCamera(false);
      processingScanRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      startCamera();
    }, 250);

    return () => {
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    if (startingCamera || processingScanRef.current) return;

    try {
      setStartingCamera(true);
      setCameraError(null);
      setValidationError(null);
      processingScanRef.current = false;

      if (!window.isSecureContext) {
        throw new Error(
          'SECURE_CONTEXT_REQUIRED: Camera cần HTTPS. Hãy mở ứng dụng bằng địa chỉ https://.'
        );
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'MEDIA_DEVICES_UNAVAILABLE: Trình duyệt không hỗ trợ truy cập camera.'
        );
      }

      // Yêu cầu quyền camera trực tiếp trước khi khởi động QR scanner.
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      });

      permissionStream.getTracks().forEach((track) => track.stop());

      if (!mountedRef.current || !isOpen) return;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      const scanner = html5QrCodeRef.current;

      if (scanner.isScanning) {
        setCameraActive(true);
        return;
      }

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Bỏ qua lỗi từng frame.
        }
      );

      if (mountedRef.current) {
        setCameraActive(true);
      }
    } catch (err) {
      console.error('QR camera failed:', err);

      let message =
        'Không thể mở camera. Vui lòng kiểm tra quyền Camera của trình duyệt.';

      if (err instanceof Error) {
        const text = err.message || '';

        if (text.includes('SECURE_CONTEXT_REQUIRED')) {
          message =
            'Camera cần HTTPS. Hãy mở Sec-2027 bằng địa chỉ https://192.168.1.125:3000/.';
        } else if (text.includes('MEDIA_DEVICES_UNAVAILABLE')) {
          message =
            'Trình duyệt không hỗ trợ Camera hoặc trang đang chạy trong chế độ không an toàn.';
        } else if (
          text.includes('Permission') ||
          text.includes('NotAllowed') ||
          text.includes('denied')
        ) {
          message =
            'Camera đang bị từ chối quyền. Hãy vào Cài đặt trình duyệt và cho phép Camera cho trang Sec-2027.';
        }
      }

      if (mountedRef.current) {
        setCameraActive(false);
        setCameraError(message);
      }
    } finally {
      if (mountedRef.current) {
        setStartingCamera(false);
      }
    }
  };

  const stopCamera = async () => {
    const scanner = html5QrCodeRef.current;

    if (!scanner) {
      setCameraActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn('Không thể dừng QR camera:', err);
    }

    try {
      scanner.clear();
    } catch {
      // Bỏ qua lỗi clear.
    }

    html5QrCodeRef.current = null;
    setCameraActive(false);
  };

  const handleDetectedCode = async (code: string) => {
    if (processingScanRef.current) return;

    const trimmed = code.trim().toUpperCase();

    if (!trimmed) return;

    processingScanRef.current = true;

    const found = availableCheckpoints.find(
      (c) =>
        c.id.toUpperCase() === trimmed ||
        c.qrCodeValue.toUpperCase() === trimmed
    );

    if (!found) {
      processingScanRef.current = false;

      setValidationError(
        `Mã QR "${trimmed}" không hợp lệ hoặc không thuộc hệ thống tuần tra khách sạn.`
      );

      return;
    }

    if (targetCheckpoint && found.id !== targetCheckpoint.id) {
      processingScanRef.current = false;

      setValidationError(
        `Mã QR không đúng checkpoint.\n\n` +
        `Đã quét: ${found.id} - ${found.name}\n` +
        `Yêu cầu: ${targetCheckpoint.id} - ${targetCheckpoint.name}`
      );

      return;
    }

    await stopCamera();

    onScanSuccess(found.id);
  };

  if (!isOpen) return null;

  return (
    <div
      id="qr-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="qr-scanner-modal-container"
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh] sm:max-h-[90vh]"
      >
        <div className="bg-slate-850 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                QUÉT QR CHECKPOINT
              </h3>

              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Chỉ sử dụng camera để quét mã QR tại vị trí thực tế
              </p>
            </div>
          </div>

          <button
            id="close-qr-scanner-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetCheckpoint && (
          <div className="bg-amber-950/40 border-b border-amber-900/60 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 text-xs shrink-0">
            <span className="text-amber-300 font-semibold flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              Điểm cần quét:
            </span>

            <span className="font-mono bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-500/30 font-bold truncate">
              {targetCheckpoint.id} – {targetCheckpoint.name}
            </span>
          </div>
        )}

        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2 whitespace-pre-line">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="relative rounded-xl overflow-hidden bg-black border-2 border-amber-500/40 min-h-[300px] flex items-center justify-center">
            <div
              id={qrRegionId}
              className="w-full min-h-[300px]"
            />

            {!cameraActive && (
              <div className="absolute inset-0 bg-slate-950/95 p-5 flex flex-col items-center justify-center text-center">
                <Camera className="w-12 h-12 text-amber-400 mb-3" />

                <p className="text-sm text-white font-semibold mb-2">
                  {startingCamera
                    ? 'ĐANG MỞ CAMERA...'
                    : 'CAMERA CHƯA HOẠT ĐỘNG'}
                </p>

                <p className="text-xs text-slate-400 max-w-xs mb-4 whitespace-pre-line">
                  {cameraError ||
                    'Nhấn BẬT CAMERA để cấp quyền và bắt đầu quét QR.'}
                </p>

                <button
                  id="retry-camera-btn"
                  type="button"
                  disabled={startingCamera}
                  onClick={() => {
                    processingScanRef.current = false;
                    startCamera();
                  }}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-2.5 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Camera className="w-4 h-4" />
                  {startingCamera ? 'ĐANG MỞ CAMERA...' : 'BẬT CAMERA'}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-3 text-center">
            {cameraActive ? (
              <>
                <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  CAMERA ĐANG HOẠT ĐỘNG
                </div>

                <p className="text-[11px] text-slate-400 mt-1">
                  Đưa mã QR tại checkpoint vào giữa khung camera
                </p>
              </>
            ) : (
              <div className="text-xs text-slate-400">
                Camera chưa hoạt động
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-950/30 border border-amber-800/50 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />

              <div>
                <p className="text-xs font-bold text-amber-300">
                  KIỂM SOÁT TUẦN TRA
                </p>

                <p className="text-[11px] text-amber-200/70 mt-1">
                  Chỉ chấp nhận mã QR được quét trực tiếp bằng camera.
                  Không hỗ trợ tải ảnh QR hoặc chọn QR từ thư viện.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-850 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            id="cancel-qr-scanner-btn"
            type="button"
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
