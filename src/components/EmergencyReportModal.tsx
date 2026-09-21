import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  Camera,
  X,
  Send,
  MapPin,
  Flame,
  Shield,
  Upload,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { Checkpoint, SeverityLevel, User } from '../types';
import { StorageService } from '../services/storage';
import { createWatermarkedPhoto } from '../utils/photoUtils';
import { getCurrentGPS, GPSResult } from '../utils/geoUtils';
import { soundAlert } from '../utils/audioAlert';

interface EmergencyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  sessionId?: string;
  availableCheckpoints: Checkpoint[];
}

export const EmergencyReportModal: React.FC<EmergencyReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sessionId,
  availableCheckpoints,
}) => {
  const [selectedArea, setSelectedArea] = useState('Khu vực Công Cộng / Sảnh');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('CRITICAL');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('Đã phong tỏa khu vực và báo cáo khẩn về trung tâm chỉ huy');
  const [department, setDepartment] = useState('Đội Cơ động An ninh & PCCC');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [gpsData, setGpsData] = useState<GPSResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingLive, setIsCapturingLive] = useState(false);

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
      console.warn('Live camera error:', err);
      setIsCapturingLive(false);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
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
      location: selectedArea,
      gpsCoordinates: gpsData?.displayString,
      status: 'BÁO CÁO SỰ CỐ KHẨN CẤP',
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
          location: selectedArea,
          gpsCoordinates: gpsData?.displayString,
          status: 'BÁO CÁO SỰ CỐ KHẨN CẤP',
        });
        setPhotoUrl(watermarked);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập mô tả chi tiết về sự cố khẩn cấp.');
      return;
    }

    setIsSubmitting(true);
    soundAlert.playEmergencyAlert();

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;

    // Chosen checkpoint name or area name
    const cp = availableCheckpoints.find((c) => c.id === selectedCheckpointId);
    const checkpointName = cp ? `${cp.id} - ${cp.name}` : selectedArea;
    const checkpointId = cp ? cp.id : 'AREA-EMERGENCY';

    StorageService.recordIncident({
      id: incidentId,
      sessionId: sessionId || 'EMERGENCY-SESSION',
      checkpointId,
      checkpointName,
      area: selectedArea,
      officerId: currentUser.id,
      officerName: currentUser.fullName,
      checklistText: 'Báo cáo sự cố khẩn cấp từ hiện trường',
      severity,
      description: description.trim(),
      actionTaken: actionTaken.trim(),
      department,
      photoUrl: photoUrl || '',
      photoMetadata: {
        officerName: currentUser.fullName,
        date: dateStr,
        time: timeStr,
        location: selectedArea,
        gpsCoordinates: gpsData?.displayString,
      },
      status: 'OPEN',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      incidentType: 'EMERGENCY_REPORT',
      gpsCoordinates: gpsData
        ? {
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            accuracy: gpsData.accuracy,
            displayString: gpsData.displayString,
          }
        : undefined,
    });

    setIsSubmitting(false);
    stopLiveCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-white text-sm sm:text-base uppercase tracking-wide">
                BÁO CÁO SỰ CỐ KHẨN CẤP
              </h2>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                ĐỒNG BỘ TRỰC TIẾP LÊN QUẢN LÝ AN NINH
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Severity selector */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Mức độ nghiêm trọng:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('CRITICAL')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  severity === 'CRITICAL'
                    ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/40 ring-1 ring-white'
                    : 'bg-slate-950 text-red-400 border-red-900/60 hover:bg-red-950/30'
                }`}
              >
                🚨 KHẨN CẤP
              </button>
              <button
                type="button"
                onClick={() => setSeverity('HIGH')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  severity === 'HIGH'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/40 ring-1 ring-white'
                    : 'bg-slate-950 text-amber-400 border-amber-900/60 hover:bg-amber-950/30'
                }`}
              >
                ⚠ MỨC CAO
              </button>
              <button
                type="button"
                onClick={() => setSeverity('MEDIUM')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  severity === 'MEDIUM'
                    ? 'bg-yellow-600 text-white border-yellow-400 shadow-lg shadow-yellow-600/40 ring-1 ring-white'
                    : 'bg-slate-950 text-yellow-400 border-yellow-900/60 hover:bg-yellow-950/30'
                }`}
              >
                🟡 TRUNG BÌNH
              </button>
            </div>
          </div>

          {/* Location / Checkpoint Picker */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Vị trí phát hiện sự cố:
            </label>
            <select
              value={selectedCheckpointId}
              onChange={(e) => {
                setSelectedCheckpointId(e.target.value);
                const cp = availableCheckpoints.find((c) => c.id === e.target.value);
                if (cp) setSelectedArea(`${cp.area} - ${cp.name}`);
              }}
              aria-label="Chọn điểm kiểm soát hoặc nhập khu vực"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 mb-2"
            >
              <option value="">-- Chọn Checkpoint cụ thể (nếu có) --</option>
              {availableCheckpoints.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  [{cp.id}] {cp.name} - {cp.area}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              placeholder="Hoặc nhập tên khu vực / tầng khách sạn..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />

            {/* GPS status */}
            <div className="mt-1 flex items-center justify-between text-[10px] text-sky-400 font-mono">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-sky-400" />
                {gpsData ? gpsData.displayString : 'Đang định vị tọa độ GPS...'}
              </span>
              <button
                type="button"
                onClick={() => getCurrentGPS().then((res) => setGpsData(res))}
                className="text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Lấy lại GPS
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Mô tả chi tiết sự việc:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả sự cố (VD: Phát hiện khói nhẹ từ buồng rác tầng 4, hoặc phát hiện khách say xỉn gây rối tại quầy Lounge...)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {/* Action Taken & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                Biện pháp đã xử lý ngay:
              </label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                Bộ phận cần chi viện:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                aria-label="Chọn bộ phận cần chi viện"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Đội Cơ động An ninh & PCCC">Đội Cơ động An ninh & PCCC</option>
                <option value="Bộ phận Kỹ thuật điện (Engineering)">Bộ phận Kỹ thuật điện (Engineering)</option>
                <option value="Bộ phận Housekeeping (Buồng phòng)">Bộ phận Housekeeping (Buồng phòng)</option>
                <option value="Bộ phận Lễ tân (Front Office)">Bộ phận Lễ tân (Front Office)</option>
                <option value="Ban Giám Đốc / Duty Manager">Ban Giám Đốc / Duty Manager</option>
              </select>
            </div>
          </div>

          {/* Photo Evidence with SOP Watermark */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Hình ảnh bằng chứng hiện trường (Đóng dấu SOP + GPS):
            </label>

            {isCapturingLive ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-black border border-red-500">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded animate-pulse">
                    ● CAMERA TRỰC TIẾP
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureLivePhoto}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Chụp & Đóng Dấu SOP
                  </button>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="py-2.5 px-4 bg-slate-800 text-slate-300 rounded-xl font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : photoUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-44 bg-black flex items-center justify-center">
                  <img src={photoUrl} alt="Evidence" className="w-full h-auto object-contain" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Chụp lại ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="py-1.5 px-3 bg-red-950 text-red-300 border border-red-800 rounded-lg text-[11px]"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={startLiveCamera}
                  className="py-3 px-3 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-amber-500 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 text-slate-300 cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-[11px]">Bật Camera</span>
                </button>

                <label className="py-3 px-3 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-amber-500 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 text-slate-300 cursor-pointer">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-[11px]">Tải ảnh thiết bị</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>[ GỬI BÁO CÁO CẤP TỐC LÊN QUẢN LÝ ]</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopLiveCamera();
                onClose();
              }}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
