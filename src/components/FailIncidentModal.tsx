import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertOctagon, X, Check, Upload, AlertCircle, RefreshCw, Navigation } from 'lucide-react';
import { SeverityLevel, FailRecord, Checkpoint, ChecklistItem, User } from '../types';
import { createWatermarkedPhoto } from '../utils/photoUtils';
import { getCurrentGPS, GPSResult } from '../utils/geoUtils';

interface FailIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFail: (failRecord: FailRecord) => void;
  checkpoint: Checkpoint;
  item: ChecklistItem;
  currentUser: User;
  sessionId: string;
}

export const FailIncidentModal: React.FC<FailIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmitFail,
  checkpoint,
  item,
  currentUser,
  sessionId,
}) => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM');
  const [actionTaken, setActionTaken] = useState('');
  const [department, setDepartment] = useState('Bộ phận Kỹ thuật điện (Engineering)');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturingLive, setIsCapturingLive] = useState(false);
  const [gpsData, setGpsData] = useState<GPSResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCurrentGPS().then((res) => setGpsData(res));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startLiveCamera = async () => {
    try {
      setErrorMessage(null);
      setIsCapturingLive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Cannot open live camera:', err);
      setIsCapturingLive(false);
      setErrorMessage('Không thể truy cập camera trực tiếp. Vui lòng bấm "Chọn ảnh / Chụp ảnh" để dùng ứng dụng máy ảnh của thiết bị.');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturingLive(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const watermarked = createWatermarkedPhoto(videoRef.current, {
      officerName: currentUser.fullName,
      date: dateStr,
      time: timeStr,
      location: `${checkpoint.area} – ${checkpoint.id}`,
      gpsCoordinates: gpsData?.displayString,
    });

    setPhotoUrl(watermarked);
    stopLiveCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN');
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        const watermarked = createWatermarkedPhoto(img, {
          officerName: currentUser.fullName,
          date: dateStr,
          time: timeStr,
          location: `${checkpoint.area} – ${checkpoint.id}`,
          gpsCoordinates: gpsData?.displayString,
        });
        setPhotoUrl(watermarked);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation matching Section IX: Không cho Submit nếu thiếu các trường bắt buộc
    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập mô tả chi tiết về sự cố / vấn đề không đạt.');
      return;
    }
    if (!actionTaken.trim()) {
      setErrorMessage('Vui lòng nhập hành động đã thực hiện xử lý tại chỗ.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Vui lòng chọn bộ phận liên quan tiếp nhận xử lý.');
      return;
    }
    if (!photoUrl) {
      setErrorMessage('Bắt buộc phải có hình ảnh bằng chứng cho mục KHÔNG ĐẠT (FAIL)!');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;

    const failRecord: FailRecord = {
      incidentId,
      itemId: item.id,
      itemText: item.text,
      description: description.trim(),
      severity,
      actionTaken: actionTaken.trim(),
      department: department.trim(),
      photoUrl,
      photoMetadata: {
        officerName: currentUser.fullName,
        officerId: currentUser.id,
        date: dateStr,
        time: timeStr,
        location: `${checkpoint.area} – ${checkpoint.id}`,
        checkpointId: checkpoint.id,
        itemText: item.text,
        gpsCoordinates: gpsData?.displayString,
      },
      status: 'OPEN',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    stopLiveCamera();
    onSubmitFail(failRecord);
  };

  const handleModalClose = () => {
    stopLiveCamera();
    onClose();
  };

  return (
    <div id="fail-incident-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div id="fail-incident-modal-container" className="bg-slate-900 border-t sm:border border-red-500/40 w-full max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh]">
        {/* Header matching Section IX */}
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 px-4 sm:px-5 py-3 sm:py-4 border-b border-red-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
              <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide truncate">VẤN ĐỀ KHÔNG ĐẠT</h3>
              <p className="text-[11px] sm:text-xs text-red-300 font-medium truncate">Ghi nhận sự cố & bằng chứng hiện trường</p>
            </div>
          </div>
          <button
            id="close-fail-modal-btn"
            onClick={handleModalClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checkpoint & Checklist Item banner */}
        <div className="bg-slate-950 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800 flex flex-col gap-1 text-xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 truncate">Vị trí: <strong className="text-white">{checkpoint.name} ({checkpoint.id})</strong></span>
            <span className="text-amber-400 font-mono font-bold shrink-0">{checkpoint.area}</span>
          </div>
          <div className="text-red-300 font-semibold flex items-start gap-1.5 mt-0.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">Tiêu chuẩn không đạt: {item.text}</span>
          </div>
        </div>

        {/* Form Body - Scrollable Vertical Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3 bg-red-950/90 border border-red-800 rounded-xl text-red-200 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mô tả */}
            <div>
              <label htmlFor="fail-description-input" className="block text-slate-200 font-semibold mb-1.5 text-xs sm:text-sm">
                Mô tả chi tiết sự cố / vấn đề: <span className="text-red-400">*</span>
              </label>
              <textarea
                id="fail-description-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi rõ hiện trạng phát hiện (ví dụ: Đèn Exit bị tắt, cửa thoát hiểm bị chèn chốt, sàn ướt không có biển cảnh báo...)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition text-sm sm:text-xs"
                required
              />
            </div>

            {/* Mức độ: Thấp, Trung bình, Cao, Nghiêm trọng */}
            <div>
              <label className="block text-slate-200 font-semibold mb-1.5 text-xs sm:text-sm">
                Mức độ nghiêm trọng: <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { level: 'LOW' as SeverityLevel, label: 'Thấp', color: 'border-slate-600 text-slate-300 hover:bg-slate-800' },
                  { level: 'MEDIUM' as SeverityLevel, label: 'Trung bình', color: 'border-yellow-600/70 text-yellow-300 hover:bg-yellow-950/40' },
                  { level: 'HIGH' as SeverityLevel, label: 'Cao', color: 'border-orange-600/70 text-orange-300 hover:bg-orange-950/40' },
                  { level: 'CRITICAL' as SeverityLevel, label: 'Nghiêm trọng', color: 'border-red-600/70 text-red-300 hover:bg-red-950/40' },
                ].map((s) => (
                  <button
                    key={s.level}
                    id={`severity-btn-${s.level.toLowerCase()}`}
                    type="button"
                    onClick={() => setSeverity(s.level)}
                    className={`h-11 px-3 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                      severity === s.level
                        ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/30'
                        : `bg-slate-950 ${s.color}`
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${severity === s.level ? 'bg-white' : 'bg-current'}`} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hành động đã thực hiện */}
            <div>
              <label htmlFor="fail-action-taken-input" className="block text-slate-200 font-semibold mb-1.5 text-xs sm:text-sm">
                Hành động đã thực hiện tại chỗ: <span className="text-red-400">*</span>
              </label>
              <input
                id="fail-action-taken-input"
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Ví dụ: Đã đặt rào chắn an toàn, ngắt cầu dao tạm, dọn vật cản..."
                className="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition text-sm sm:text-xs"
                required
              />
            </div>

            {/* Bộ phận liên quan */}
            <div>
              <label htmlFor="fail-department-select" className="block text-slate-200 font-semibold mb-1.5 text-xs sm:text-sm">
                Bộ phận liên quan tiếp nhận: <span className="text-red-400">*</span>
              </label>
              <select
                id="fail-department-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-3.5 text-white focus:outline-none focus:border-red-500 transition text-sm sm:text-xs font-medium"
              >
                <option value="Bộ phận Kỹ thuật điện (Engineering)">Bộ phận Kỹ thuật điện (Engineering)</option>
                <option value="Bộ phận Kỹ thuật nước & PCCC (Fire Safety & Plumbing)">Bộ phận Kỹ thuật nước & PCCC (Fire Safety & Plumbing)</option>
                <option value="Bộ phận Buồng phòng (Housekeeping)">Bộ phận Buồng phòng (Housekeeping)</option>
                <option value="Bộ phận Tiền sảnh & Lễ tân (Front Office)">Bộ phận Tiền sảnh & Lễ tân (Front Office)</option>
                <option value="Bộ phận Ẩm thực & Bếp (F&B / Kitchen)">Bộ phận Ẩm thực & Bếp (F&B / Kitchen)</option>
                <option value="Bộ phận Cảnh quan & Bãi biển (Landscaping & Beach)">Bộ phận Cảnh quan & Bãi biển (Landscaping & Beach)</option>
                <option value="Ban Giám đốc & Quản lý tòa nhà (General Management)">Ban Giám đốc & Quản lý tòa nhà (General Management)</option>
                <option value="Đội Phản ứng Nhanh An ninh (Security Rapid Response)">Đội Phản ứng Nhanh An ninh (Security Rapid Response)</option>
              </select>
            </div>

            {/* CHỤP HÌNH / BẰNG CHỨNG HÌNH ẢNH (BẮT BUỘC) */}
            <div className="border border-slate-700/80 rounded-xl p-3.5 bg-slate-950/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                  <Camera className="w-4 h-4 text-red-400" />
                  Bằng chứng hiện trường (Bắt buộc): <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono">Đóng dấu 3 dòng</span>
              </div>

              {/* Live Camera View if active */}
              {isCapturingLive && (
                <div className="relative bg-black rounded-xl overflow-hidden flex flex-col items-center">
                  <video ref={videoRef} className="w-full max-h-64 object-cover" autoPlay playsInline muted />
                  <div className="absolute bottom-3 flex gap-2 w-full px-3 justify-center">
                    <button
                      type="button"
                      onClick={captureLivePhoto}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold h-11 px-6 rounded-xl shadow-xl flex items-center gap-2 text-xs transition active:scale-95"
                    >
                      <Camera className="w-4 h-4" /> [ CHỤP ẢNH NÀY ]
                    </button>
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium h-11 px-4 rounded-xl text-xs transition"
                    >
                      Đóng camera
                    </button>
                  </div>
                </div>
              )}

              {/* Photo preview */}
              {photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-red-500/60">
                  <img src={photoUrl} alt="Bằng chứng hiện trường" className="w-full max-h-56 object-contain bg-black" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        startLiveCamera();
                      }}
                      className="bg-slate-900/95 hover:bg-slate-800 text-white h-9 px-3 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 shadow-md transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Chụp lại
                    </button>
                  </div>
                </div>
              ) : (
                !isCapturingLive && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id="open-camera-btn"
                      type="button"
                      onClick={startLiveCamera}
                      className="h-16 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-200 font-bold flex flex-col items-center justify-center gap-1 transition active:scale-[0.98]"
                    >
                      <Camera className="w-5 h-5 text-red-400" />
                      <span className="text-xs">[ CHỤP HÌNH ]</span>
                      <span className="text-[10px] text-slate-400 font-normal">Mở Camera trực tiếp</span>
                    </button>

                    <label className="cursor-pointer h-16 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-[0.98]">
                      <Upload className="w-5 h-5 text-amber-400" />
                      <span className="text-xs">Chọn ảnh máy</span>
                      <span className="text-[10px] text-slate-400 font-normal">Thư viện / File</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Actions: Sticky Bottom Bar in Vertical Phone Form */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
            <button
              id="submit-fail-report-btn"
              type="submit"
              className="w-full sm:flex-1 h-12 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition text-xs sm:text-sm text-center cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>[ GỬI BÁO CÁO SỰ CỐ ]</span>
            </button>
            <button
              id="cancel-fail-btn"
              type="button"
              onClick={handleModalClose}
              className="w-full sm:w-auto h-10 sm:h-12 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition text-xs text-center"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
