import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Save,
  CheckCircle2,
  Printer,
  User,
  CalendarDays,
  Shield,
  Camera,
  Video,
  Flame,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

interface HandoverRecord {
  id: string;
  date: string;
  shift: string;
  giver: string;
  receiver: string;
  supervisor: string;
  securitySituation: string;
  incidents: string;
  nextTasks: string;
  assets: string;
  cctv: string;
  fireSafety: string;
  accessControl: string;
  specialNotes: string;
  status: 'DRAFT' | 'CONFIRMED';
  createdAt: string;
  updatedAt: string;
}

interface HandoverViewProps {
  currentUser: any;
}

const STORAGE_KEY = 'SEC2027_HANDOVER_RECORDS';

const SHIFT_OPTIONS = [
  'Ca ngày (06:00 - 18:00)',
  'Ca đêm (18:00 - 06:00)',
  'Ca hành chính (09:00 - 17:00)',
];

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  shift: SHIFT_OPTIONS[0],
  giver: '',
  receiver: '',
  supervisor: '',
  securitySituation: '',
  incidents: '',
  nextTasks: '',
  assets: '',
  cctv: '',
  fireSafety: '',
  accessControl: '',
  specialNotes: '',
};

export const HandoverView: React.FC<HandoverViewProps> = ({
  currentUser,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [records, setRecords] = useState<HandoverRecord[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setRecords([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setRecords(parsed);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    }
  };

  const saveRecords = (items: HandoverRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setRecords(items);
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (confirm = false) => {
    const now = new Date().toISOString();

    const record: HandoverRecord = {
      id: `HO-${Date.now()}`,
      ...form,
      giver:
        form.giver.trim() ||
        currentUser?.fullName ||
        currentUser?.username ||
        '',
      status: confirm ? 'CONFIRMED' : 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };

    const next = [record, ...records];
    saveRecords(next);

    setMessage(
      confirm
        ? 'Đã lưu và xác nhận bàn giao ca.'
        : 'Đã lưu phiếu bàn giao ca.'
    );

    setTimeout(() => setMessage(''), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const latestRecords = useMemo(() => {
    return records.slice(0, 10);
  }, [records]);

  const inputClass =
    'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';

  const sectionClass =
    'rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/15 p-3">
              <ClipboardList className="h-7 w-7 text-amber-400" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-wide text-white">
                BÀN GIAO CA AN NINH
              </h1>
              <p className="text-sm text-slate-400">
                Dusit Princess Moonrise Phú Quốc • BỘ PHẬN AN NINH & BẢO VỆ
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-100 hover:bg-slate-700"
        >
          <Printer className="h-4 w-4" />
          IN / PDF
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <section className={sectionClass}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-400" />
              <h2 className="font-black text-white">THÔNG TIN CA</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  NGÀY
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  CA
                </label>
                <select
                  value={form.shift}
                  onChange={(e) => updateField('shift', e.target.value)}
                  className={inputClass}
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  GIÁM SÁT / TBP
                </label>
                <input
                  value={form.supervisor}
                  onChange={(e) =>
                    updateField('supervisor', e.target.value)
                  }
                  placeholder="Tên người phụ trách"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  NHÂN VIÊN GIAO CA
                </label>
                <input
                  value={form.giver}
                  onChange={(e) => updateField('giver', e.target.value)}
                  placeholder="Người giao ca"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  NHÂN VIÊN NHẬN CA
                </label>
                <input
                  value={form.receiver}
                  onChange={(e) => updateField('receiver', e.target.value)}
                  placeholder="Người nhận ca"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <h2 className="font-black text-white">TÌNH HÌNH AN NINH</h2>
            </div>

            <textarea
              value={form.securitySituation}
              onChange={(e) =>
                updateField('securitySituation', e.target.value)
              }
              placeholder="Tình hình an ninh trong ca: khách, nhân viên, khu vực công cộng, bãi xe, bãi biển..."
              rows={4}
              className={inputClass}
            />
          </section>

          <section className={sectionClass}>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="font-black text-white">
                SỰ CỐ / VẤN ĐỀ CHƯA GIẢI QUYẾT
              </h2>
            </div>

            <textarea
              value={form.incidents}
              onChange={(e) => updateField('incidents', e.target.value)}
              placeholder="Ghi nhận sự cố, tình huống bất thường hoặc công việc còn tồn đọng..."
              rows={4}
              className={inputClass}
            />
          </section>

          <section className={sectionClass}>
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-400" />
              <h2 className="font-black text-white">
                CÔNG VIỆC CHO CA TIẾP THEO
              </h2>
            </div>

            <textarea
              value={form.nextTasks}
              onChange={(e) => updateField('nextTasks', e.target.value)}
              placeholder="Các công việc cần tiếp tục theo dõi hoặc thực hiện..."
              rows={4}
              className={inputClass}
            />
          </section>

          <section className={sectionClass}>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-amber-400" />
                  <h3 className="font-bold text-white">TÀI SẢN / THIẾT BỊ</h3>
                </div>
                <textarea
                  value={form.assets}
                  onChange={(e) => updateField('assets', e.target.value)}
                  placeholder="Bộ đàm, chìa khóa, đèn pin, thiết bị..."
                  rows={4}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Video className="h-4 w-4 text-amber-400" />
                  <h3 className="font-bold text-white">HỆ THỐNG CCTV</h3>
                </div>
                <textarea
                  value={form.cctv}
                  onChange={(e) => updateField('cctv', e.target.value)}
                  placeholder="Tình trạng camera, đầu ghi, màn hình giám sát..."
                  rows={4}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <h3 className="font-bold text-white">PCCC</h3>
                </div>
                <textarea
                  value={form.fireSafety}
                  onChange={(e) => updateField('fireSafety', e.target.value)}
                  placeholder="Tình trạng hệ thống và thiết bị PCCC..."
                  rows={4}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  <h3 className="font-bold text-white">KIỂM SOÁT RA VÀO</h3>
                </div>
                <textarea
                  value={form.accessControl}
                  onChange={(e) =>
                    updateField('accessControl', e.target.value)
                  }
                  placeholder="Chìa khóa, thẻ từ, cửa kiểm soát, khu vực hạn chế..."
                  rows={4}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-black text-white">GHI CHÚ ĐẶC BIỆT</h2>

            <textarea
              value={form.specialNotes}
              onChange={(e) => updateField('specialNotes', e.target.value)}
              placeholder="Thông tin đặc biệt cần bàn giao cho ca tiếp theo..."
              rows={4}
              className={inputClass}
            />
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-700 px-5 py-3 font-black text-white hover:bg-slate-600"
            >
              <Save className="h-5 w-5" />
              LƯU BÀN GIAO
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-5 w-5" />
              XÁC NHẬN NHẬN CA
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <section className={sectionClass}>
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-amber-400" />
              <h2 className="font-black text-white">NGƯỜI ĐĂNG NHẬP</h2>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="font-bold text-white">
                {currentUser?.fullName || currentUser?.username || '---'}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Vai trò: {currentUser?.role || '---'}
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-black text-white">
              LỊCH SỬ BÀN GIAO GẦN NHẤT
            </h2>

            {latestRecords.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
                Chưa có dữ liệu bàn giao.
              </div>
            ) : (
              <div className="space-y-3">
                {latestRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">
                        {record.date}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black ${
                          record.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {record.status === 'CONFIRMED'
                          ? 'ĐÃ XÁC NHẬN'
                          : 'NHÁP'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-400">
                      {record.shift}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Giao: {record.giver || '---'}
                    </div>

                    <div className="text-xs text-slate-500">
                      Nhận: {record.receiver || '---'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={sectionClass}>
            <div className="mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-400" />
              <h2 className="font-black text-white">HÌNH ẢNH BÀN GIAO</h2>
            </div>

            <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center">
              <Camera className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p className="text-xs text-slate-500">
                Chức năng chụp ảnh bàn giao sẽ được tích hợp ở bước tiếp theo.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};